#!/usr/bin/env node
/**
 * 技能体检器 —— `.claude/skills/` 下每个 SKILL.md 的自洽性检查。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * **skill 失效是静默的**：路径写错、frontmatter 字段拼错、行数失控，
 * 都不会立刻报错 —— 只会在某天用到时把人带沟里。
 * 而 skill 里全是路径引用（`docs/xxx.md`、`scripts/xxx.mjs`、`backend/@@...@@-admin/`），
 * 文件一改名、脚本一换参数，引用就烂掉了。
 *
 * ── 两类检查，严重程度刻意不同 ──────────────────────────────────
 *   【硬约束】违反 → exit 1
 *     来自 Anthropic 官方校验器 `quick_validate.py`（skill-creator 插件内）。
 *     违反的后果是 **skill 装不上**，必须修。
 *
 *   【项目约定】违反 → 只警告
 *     行数、触发词、引用路径、排查小节。是质量问题，不阻断提交 ——
 *     因为"代价不对称，处理方式就该不对称"（同 element-plus-scan.mjs 的 --check）。
 *
 * ── 为什么跳过 el-* / element-plus-* ────────────────────────────
 * 那 39 个是从上游拉的引用技能（见 AI工程化需求.txt §4.3）。
 * 它们**不该满足本项目约定** —— 改了就说不清是上游内容还是本地改动，
 * 下次 `--fetch` 还会覆盖。默认跳过，`--all` 可以连它们一起查官方硬约束。
 *
 * 用法：
 *   node scripts/skill-lint.mjs            查自建技能
 *   node scripts/skill-lint.mjs --all      连引用的也查（只查硬约束）
 *   node scripts/skill-lint.mjs --verbose  逐个列出通过项
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
// 路径提取逻辑与 `ref-check.mjs` **共用一份** —— 两边各写一份迟早会漂移，
// 而"漂移"的表现是**一个查得出、一个查不出**。判定规则见那个脚本的文件头。
import { refPathsIn, topLevelDirs } from './ref-check.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills')

const argv = process.argv.slice(2)
const has = (name) => argv.includes(name)

/** 引用技能的前缀 —— 与 element-plus-scan.mjs 保持一致 */
const VENDORED_PREFIX = /^(el-|element-plus-)/

/** 官方允许的 frontmatter 字段（多一个就装不上） */
const ALLOWED_KEYS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'])

/** 项目约定的行数上限（docs/ 那条是 400，skill 更严 —— 它每次被完整读入上下文） */
const MAX_LINES = 200

// ──────────────────────────────────────────────────────────────────

/**
 * 极简 frontmatter 解析 —— 只够用来查字段，不追求完整 YAML。
 * 处理：顶层 `key: value`、引号包裹的值、`key:` 后跟缩进块（记为 dict 键）。
 * 不支持块标量（`|` / `>`）等复杂形态 —— 遇到了会走"字段缺失"分支报出来，不会静默放过。
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { err: '内容没有以 --- 开头（缺 frontmatter）' }
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { err: 'frontmatter 格式不对（没有配对的 --- 结束行）' }

  const fields = {}
  const lines = m[1].split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (/^\s/.test(line)) continue // 缩进行：属于上一层的块，顶层字段不需要
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (!value) fields[kv[1]] = { dict: true } // `key:` 后面跟缩进块
    else {
      value = value.replace(/^["'](.*)["']$/, '$1') // 去掉包裹引号
      fields[kv[1]] = { value }
    }
  }
  return { fields, body: text.slice(m[0].length) }
}

/**
 * 正文里反引号包住的**仓库根相对路径**的提取逻辑，与 `ref-check.mjs` **共用一份**。
 * 判定规则（只认第一段是真实顶层目录的）见那个脚本的文件头。
 */

// ──────────────────────────────────────────────────────────────────

/** 返回 { hard: [], soft: [] } */
function lint(skillName, text, checkConventions, top) {
  const hard = []
  const soft = []

  const fm = parseFrontmatter(text)
  if (fm.err) {
    hard.push(fm.err)
    return { hard, soft } // frontmatter 都解析不了，后面的检查没意义
  }

  const { fields, body } = fm

  // ── 硬约束：字段 ────────────────────────────────────────────────
  const extra = Object.keys(fields).filter((k) => !ALLOWED_KEYS.has(k))
  if (extra.length) {
    hard.push(`frontmatter 有不允许的字段：${extra.join(', ')}（只允许 ${[...ALLOWED_KEYS].join(' / ')}）`)
  }

  const name = fields.name?.value
  if (!name) hard.push("缺 'name'")
  else {
    if (!/^[a-z0-9-]+$/.test(name)) hard.push(`name "${name}" 必须是 kebab-case（只含小写字母、数字、连字符）`)
    else if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
      hard.push(`name "${name}" 不能以连字符开头/结尾，也不能有连续连字符`)
    }
    if (name.length > 64) hard.push(`name 超长（${name.length} > 64）`)
    if (name !== skillName) hard.push(`name "${name}" 与目录名 "${skillName}" 不一致`)
  }

  const desc = fields.description?.value
  if (!desc) hard.push("缺 'description'")
  else {
    if (desc.includes('<') || desc.includes('>')) hard.push('description 不能含尖括号 < 或 >')
    if (desc.length > 1024) hard.push(`description 超长（${desc.length} > 1024）`)
  }

  const compat = fields.compatibility?.value
  if (compat && compat.length > 500) hard.push(`compatibility 超长（${compat.length} > 500）`)

  // 引用的技能只查硬约束 —— 它们不该满足本项目约定（见文件头）
  if (!checkConventions) return { hard, soft }

  // ── 项目约定：只警告 ────────────────────────────────────────────
  const lineCount = text.split(/\r?\n/).length
  if (lineCount > MAX_LINES) {
    soft.push(`${lineCount} 行，超过 ${MAX_LINES} 行上限 —— 把细节移进 docs/，这里只留步骤和指针`)
  }

  if (desc && !/[「『"'‘“]/.test(desc)) {
    soft.push('description 里没有引号包住的触发词 —— 它是 skill 被调起的唯一依据，写上用户会说的原话')
  }

  if (!/^#{1,4}\s*.*(排查|验证|自检)/m.test(body)) {
    soft.push('没有「排查」「验证」或「自检」小节 —— 跑完了无法判断对不对')
  }

  const missing = []
  for (const p of refPathsIn(body, top)) {
    if (!existsSync(path.join(ROOT, p))) missing.push(p)
  }
  if (missing.length) {
    soft.push(`引用的仓库根相对路径不存在：${missing.join(', ')}`)
  }

  // 引用的 `/xxx` 是不是真的存在 —— 写成「交给 /style-regression 跑」而它其实是
  // **代理不是 skill**，这种错会让人（和 AI）去敲一个根本调不起来的命令。
  const badRefs = new Set()
  for (const m of body.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
    const n = m[1]
    const ok =
      existsSync(path.join(ROOT, '.claude', 'skills', n)) ||
      existsSync(path.join(ROOT, '.claude', 'commands', `${n}.md`)) ||
      existsSync(path.join(ROOT, '.claude', 'agents', `${n}.md`))
    if (!ok) badRefs.add(`/${n}`)
  }
  if (badRefs.size) {
    soft.push(`引用的 skill / 命令 / 代理不存在：${[...badRefs].join(', ')}`)
  }

  return { hard, soft }
}

/**
 * 斜杠命令的检查 —— 比 skill 松得多。
 *
 * 为什么松：命令的 frontmatter 规范（`allowed-tools` 的写法、还有哪些字段）
 * 没有权威依据可查，写严了全是误报。而这里**只拦一种真会出事的情况**：
 * frontmatter 坏了或没有 description —— 那样命令会**静默不出现**，
 * 用户以为敲了 `/commit`，其实什么都没发生。
 */
function lintCommands() {
  const dir = path.join(ROOT, '.claude', 'commands')
  if (!existsSync(dir)) return { checked: 0, hard: [] }

  const hard = []
  const files = readdirSync(dir).filter((n) => n.endsWith('.md'))
  for (const f of files) {
    const fm = parseFrontmatter(readFileSync(path.join(dir, f), 'utf8'))
    if (fm.err) {
      hard.push(`.claude/commands/${f}：${fm.err}`)
      continue
    }
    if (!fm.fields.description?.value) {
      hard.push(`.claude/commands/${f}：缺 description —— 命令会静默不出现`)
    }
  }
  return { checked: files.length, hard }
}

// ──────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`✗ 没有技能目录：${SKILLS_DIR}`)
    process.exit(1)
  }

  const all = has('--all')
  const verbose = has('--verbose')
  const top = topLevelDirs(ROOT)
  const dirs = readdirSync(SKILLS_DIR).filter((n) => statSync(path.join(SKILLS_DIR, n)).isDirectory())

  let hardCount = 0
  let softCount = 0
  let checked = 0
  let skipped = 0

  for (const dir of dirs.sort()) {
    const vendored = VENDORED_PREFIX.test(dir)
    if (vendored && !all) {
      skipped++
      continue
    }
    const file = path.join(SKILLS_DIR, dir, 'SKILL.md')
    if (!existsSync(file)) {
      console.log(`✗ ${dir}`)
      console.log(`    【硬约束】目录里没有 SKILL.md`)
      hardCount++
      continue
    }

    checked++
    const { hard, soft } = lint(dir, readFileSync(file, 'utf8'), !vendored, top)

    if (hard.length === 0 && soft.length === 0) {
      if (verbose) console.log(`✓ ${dir}`)
      continue
    }

    console.log(`${hard.length ? '✗' : '⚠'} ${dir}`)
    for (const msg of hard) {
      console.log(`    【硬约束】${msg}`)
      hardCount++
    }
    for (const msg of soft) {
      console.log(`    【约定】${msg}`)
      softCount++
    }
  }

  const cmd = lintCommands()
  for (const msg of cmd.hard) {
    console.log(`✗ ${msg}`)
    hardCount++
  }

  console.log()
  console.log(
    `查了 ${checked} 个技能${skipped ? `（跳过 ${skipped} 个引用技能，--all 可一并查）` : ''}` +
      (cmd.checked ? ` + ${cmd.checked} 个命令` : ''),
  )
  if (hardCount === 0 && softCount === 0) {
    console.log('✓ 全部通过')
    return
  }
  console.log(`  硬约束 ${hardCount} 项 · 约定 ${softCount} 项`)
  if (hardCount) {
    console.error('\n硬约束违规会让 skill 装不上 / 命令不出现，必须修 —— 见 docs/基建/技能规范.md §二')
    process.exit(1)
  }
}

main()
