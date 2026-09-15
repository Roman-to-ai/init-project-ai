#!/usr/bin/env node
/**
 * Element Plus 组件技能 —— 扫描 + 拉取 + 体检，三合一。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * 上游 `jiaiyan/element-plus-skills`（MIT）提供了 88 个技能
 * （77 组件 + 5 设计规范 + 6 基础）。但**不能全量引入**：
 * 每个技能的 name + description 都会进 skill 索引，也就是**每次会话都要背这 88 条**。
 * 而项目实际用到的组件是个有限子集。
 *
 * 所以清单**从事实源生成，不手写** —— 手写会漏新用的组件，
 * 也会带上项目根本没装的（如 `el-datetime-picker`，2.13.1 里已并入 `el-date-picker`）。
 *
 * ── 三种运行方式 ────────────────────────────────────────────────
 *   默认        扫源码 → 列出应有 / 已有 / 缺失
 *   --check     体检：源码用了但没落地的 → exit 1（可挂 CI）
 *   --fetch     按源码实际用量，从上游**锁定的 sha** 拉取 SKILL.md 落到 .claude/skills/
 *
 * 上游更新时：改下面的 UPSTREAM.sha，跑一次 `--fetch`。**不要手工编辑落地的 SKILL.md** ——
 * 下次 fetch 会覆盖，且那样就说不清是上游内容还是本地改动。
 *
 * ── 铁律：映射表必须硬编码 ───────────────────────────────────────
 * 子组件归并到父组件是**语义**关系，不是词法关系：
 *   `el-option`       属于 `el-select`   —— 前缀匹配推不出来
 *   `el-table-column` 属于 `el-table`    —— 这个倒是能推
 * 所以没有纯算法解。下面两张表是这份脚本唯一需要的项目知识，
 * 与 `doc-scan.mjs` 里的 `AUDIT_COLUMNS` / `CONTENT_HTML_TYPES` 同一个模式。
 * **技能库新增子组件时，要来这里加一行。**
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'frontend', 'src')
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills')
const LOCK = path.join(ROOT, 'scripts', 'element-plus-skills.lock.json')

/**
 * 上游锁定信息 —— 改 sha 即升级。
 * 与本文件同目录的 `.lock.json` 记录**上次实际拉取**的 sha 与时间，用于追溯。
 */
const UPSTREAM = {
  repo: 'jiaiyan/element-plus-skills',
  sha: '1d126b39a80523665cc6290f70ce25aa89d708ae',
  license: 'MIT',
}

/** 落地技能目录的识别前缀 —— 用来把「引入的」和「自建的」技能区分开 */
const VENDORED_PREFIX = /^(el-|element-plus-)/

/** 上游 LICENSE 的落地位置（MIT 要求保留声明） */
const LICENSE_FILE = path.join(SKILLS_DIR, 'LICENSE-element-plus-skills')

const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)
const has = (name) => argv.includes(name)

/**
 * 子组件 → 父组件。
 * 技能库把子组件**折进父组件的 SKILL.md**，不单列技能
 * （实测：`el-form/SKILL.md` 提到 `el-form-item` 50 次，`el-table` 提到 `el-table-column` 38 次）。
 * 所以扫描到的子组件应当**计入父组件**，而不是当成缺技能。
 */
const SUB_COMPONENT = {
  'el-form-item': 'el-form',
  'el-table-column': 'el-table',
  'el-option': 'el-select',
  'el-option-group': 'el-select',
  'el-radio-group': 'el-radio',
  'el-radio-button': 'el-radio',
  'el-checkbox-group': 'el-checkbox',
  'el-checkbox-button': 'el-checkbox',
  'el-tab-pane': 'el-tabs',
  'el-dropdown-item': 'el-dropdown',
  'el-dropdown-menu': 'el-dropdown',
  'el-menu-item': 'el-menu',
  'el-sub-menu': 'el-menu',
  'el-breadcrumb-item': 'el-breadcrumb',
  'el-step': 'el-steps',
  'el-collapse-item': 'el-collapse',
  'el-carousel-item': 'el-carousel',
  'el-descriptions-item': 'el-descriptions',
  'el-timeline-item': 'el-timeline',
  'el-avatar-group': 'el-avatar',
  'el-button-group': 'el-button',
  'el-skeleton-item': 'el-skeleton',
  'el-splitter-panel': 'el-splitter',
  'el-tour-step': 'el-tour',
}

/**
 * ⚠️ 例外：**没有组件技能**，只在**设计规范**里覆盖的标签。
 * `el-col` 是本项目第二高频的标签（279 次），但技能库里没有 `el-col` 组件技能 ——
 * 它属于布局网格，收在 `element-plus-design-layout` 里（提到 `el-row`/`el-col` 40 次）。
 * **只拉组件技能，网格布局就整块没了。** 这是本表存在的主要理由。
 */
const DESIGN_SPEC = {
  'el-row': 'element-plus-design-layout',
  'el-col': 'element-plus-design-layout',
}

/**
 * 服务型组件 —— 以函数调用，不是标签，**最容易漏**。
 * Element Plus 的函数式 API 是固定的小集合，所以这里可以穷举。
 */
const SERVICE_COMPONENT = {
  ElMessage: 'el-message',
  ElMessageBox: 'el-message-box',
  ElNotification: 'el-notification',
  ElLoading: 'el-loading',
  ElLoadingService: 'el-loading',
}

/** 扫描时跳过的目录 */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

/** 扫描的源码后缀 */
const EXTS = new Set(['.vue', '.ts', '.tsx', '.js'])

// ──────────────────────────────────────────────────────────────────

/** 递归收集源码文件 */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (EXTS.has(path.extname(name))) out.push(full)
  }
  return out
}

/** 标签 → 技能名。映射表之外的一律是它自己。 */
const skillOf = (tag) => SUB_COMPONENT[tag] ?? DESIGN_SPEC[tag] ?? tag

/** 技能名 → 上游仓库里的相对路径 */
const upstreamPathOf = (skill) =>
  VENDORED_PREFIX.test(skill) && !skill.startsWith('element-plus-')
    ? `components/${skill}/SKILL.md`
    : `${skill}/SKILL.md`

/** 收集源码里用到的所有 Element Plus 标识 */
function scanUsage() {
  const files = walk(SRC)
  if (files.length === 0) {
    console.error(`✗ 没扫到源码：${SRC}`)
    console.error('  （frontend/ 未安装或路径不对？）')
    process.exit(1)
  }

  /** tag → 出现次数 */
  const tags = new Map()
  const bump = (k) => tags.set(k, (tags.get(k) ?? 0) + 1)

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/<(el-[a-z0-9-]+)/g)) bump(m[1])
    for (const m of text.matchAll(/\b(El[A-Z][a-zA-Z0-9]*)\b/g)) {
      if (SERVICE_COMPONENT[m[1]]) bump(SERVICE_COMPONENT[m[1]])
    }
  }

  /** 技能名 → { uses: Set<tag>, count } */
  const skills = new Map()
  for (const [tag, count] of tags) {
    const skill = skillOf(tag)
    if (!skills.has(skill)) skills.set(skill, { uses: new Set(), count: 0 })
    const entry = skills.get(skill)
    entry.uses.add(tag)
    entry.count += count
  }

  return { files, tags, skills }
}

/** 磁盘上已落地的 Element Plus 技能（按目录名前缀识别，与自建技能区分开） */
function vendoredSkills() {
  if (!existsSync(SKILLS_DIR)) return new Set()
  return new Set(
    readdirSync(SKILLS_DIR)
      .filter((n) => VENDORED_PREFIX.test(n) && statSync(path.join(SKILLS_DIR, n)).isDirectory()),
  )
}

// ──────────────────────────────────────────────────────────────────

/**
 * 打包下载整仓再解压，而不是逐个抓 SKILL.md。
 *
 * 为什么：`raw.githubusercontent.com` 在部分网络下会被挡（实测 Connect Timeout），
 * 而 `codeload.github.com` 通。而且 40 个单文件请求无论怎么并发都比一次 tarball 慢。
 * 代价是多下几十个用不到的文件 —— 几百 KB，无所谓。
 */
async function downloadRepo() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'ep-skills-'))
  const tarPath = path.join(tmp, 'repo.tar.gz')
  const res = await fetch(`https://codeload.github.com/${UPSTREAM.repo}/tar.gz/${UPSTREAM.sha}`)
  if (!res.ok) throw new Error(`打包下载失败：${res.status} ${res.statusText}`)
  writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()))
  // ⚠️ 用相对路径 + cwd，不要再传 -C 绝对路径：
  // GNU tar 会把 `C:\...` 里的冒号当成 `host:path` 语法，报 "Cannot connect to C"。
  execFileSync('tar', ['-xzf', 'repo.tar.gz'], { cwd: tmp, stdio: 'pipe' })
  const root = readdirSync(tmp).find((n) => n !== 'repo.tar.gz')
  if (!root) throw new Error('解压后没找到目录')
  return { tmp, root: path.join(tmp, root) }
}

async function doFetch(skills) {
  mkdirSync(SKILLS_DIR, { recursive: true })
  const want = [...skills.keys()].sort()

  const { tmp, root } = await downloadRepo()
  let ok = 0
  const failed = []

  for (const skill of want) {
    // components/el-table/SKILL.md 或 element-plus-design-layout/SKILL.md
    const from = path.join(root, upstreamPathOf(skill))
    if (!existsSync(from)) {
      failed.push(skill)
      continue
    }
    const dir = path.join(SKILLS_DIR, skill)
    mkdirSync(dir, { recursive: true })
    copyFileSync(from, path.join(dir, 'SKILL.md'))
    ok++
  }

  // MIT 要求保留上游版权声明 —— 和内容放在一起
  const licFrom = path.join(root, 'LICENSE')
  if (existsSync(licFrom)) copyFileSync(licFrom, LICENSE_FILE)
  else console.error('  ✗ 上游仓库里没找到 LICENSE')

  rmSync(tmp, { recursive: true, force: true })

  writeFileSync(
    LOCK,
    JSON.stringify(
      {
        source: `https://github.com/${UPSTREAM.repo}`,
        sha: UPSTREAM.sha,
        license: UPSTREAM.license,
        fetchedAt: new Date().toISOString(),
        skills: want,
      },
      null,
      2,
    ) + '\n',
  )

  console.log(`✓ 拉取完成：${ok}/${want.length} 个技能落进 .claude/skills/`)
  if (failed.length) {
    console.error(`\n✗ 上游仓库里没有这些路径（映射表该更新了？）：`)
    console.error(`    ${failed.join(', ')}`)
  }
  console.log(`  LICENSE → ${path.relative(ROOT, LICENSE_FILE)}`)
  console.log(`  来源记录 → ${path.relative(ROOT, LOCK)}`)

  // 落了但源码没用到 —— 只报告，不自动删（删文件这种事交给人）
  const onDisk = vendoredSkills()
  const stale = [...onDisk].filter((s) => !skills.has(s)).sort()
  if (stale.length) {
    console.log(`\n⚠ 以下已落地但源码没用到了，可考虑删掉（脚本不自动删）：`)
    console.log(`    ${stale.join(', ')}`)
  }
}

// ──────────────────────────────────────────────────────────────────

async function main() {
  const { files, tags, skills } = scanUsage()

  if (has('--fetch')) return doFetch(skills)

  const should = [...skills.keys()].sort()
  const onDisk = vendoredSkills()
  const missing = should.filter((s) => !onDisk.has(s))
  const extra = [...onDisk].filter((s) => !skills.has(s)).sort()

  if (has('--json')) {
    console.log(
      JSON.stringify(
        {
          scannedFiles: files.length,
          usedTags: Object.fromEntries([...tags].sort()),
          should,
          missing,
          extra,
        },
        null,
        2,
      ),
    )
    return
  }

  if (has('--verbose')) {
    console.log(`扫了 ${files.length} 个文件，用到 ${tags.size} 个 Element Plus 标识\n`)
    for (const [skill, { uses, count }] of [...skills].sort()) {
      console.log(`  ${skill.padEnd(32)} ← ${[...uses].sort().join(', ')}  (${count} 次)`)
    }
    console.log()
  }

  if (has('--check')) {
    if (missing.length === 0) {
      console.log(`✓ Element Plus 技能齐备（${should.length} 个，与源码一致）`)
      if (extra.length) {
        console.log(`\n⚠ 已落地但源码没用（${extra.length} 个）—— 只多占上下文，不报错：`)
        console.log(`    ${extra.join(', ')}`)
      }
      return
    }
    console.error(`✗ 源码用了、但技能没落地（${missing.length} 个）—— AI 会照记忆写 API：`)
    for (const s of missing) {
      console.error(`    ${s.padEnd(32)} ← ${[...skills.get(s).uses].sort().join(', ')}`)
    }
    console.error(`\n跑 \`node scripts/element-plus-scan.mjs --fetch\` 拉取`)
    process.exit(1)
  }

  console.log(`应有 ${should.length} 个，已落地 ${should.length - missing.length} 个\n`)
  for (const s of should) console.log(`  ${onDisk.has(s) ? '✓' : '✗'} ${s}`)
  console.log()
  if (!existsSync(LOCK)) {
    console.log('（还没有来源记录，跑 --fetch 会一并写入）')
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`)
  process.exit(1)
})
