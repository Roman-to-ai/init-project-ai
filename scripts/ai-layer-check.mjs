#!/usr/bin/env node
/**
 * AI 工程层版本体检 —— 实例与模板之间差了什么。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * 模板仓库（`code/`）是主战场，AI 工程层（`CLAUDE.md` / `docs/` / `.claude/` / `scripts/`）
 * 会持续改进。而**实例是复制出去的，模板改了它不会自动跟上** ——
 * 更糟的是**看不见差了什么**，于是没人会去同步，差距只增不减。
 *
 * 插件机制本来能解决这个（实例声明依赖、跟随上游升级），但当前选择是**直接复制**
 * （见 AI工程化需求.txt §4.3 的取舍）。既然是复制，就得有个"差在哪"的体检。
 *
 * ⚠️ **它只报告，不合并。** 自动合并三方差异风险太高，而且往往改哪边要人来判断。
 *    先让差异**可见**，合并与否是下一步的事。
 *
 * ── 为什么要有排除清单 ──────────────────────────────────────────
 * 有些文件**本来就该两边不同** —— 它们是**项目状态**不是模板资产：
 *   · 棘轮基线（存量错误每个项目不一样）
 *   · 业务模块文档（生成物）
 *   · 变更日志（项目自己的历史）
 *   · 个人设置（`settings.local.json`，优先级高于团队设置）
 * 不排除的话，报告会被这些"正常差异"淹没，真正该看的看不见。
 *
 * 用法：
 *   node scripts/ai-layer-check.mjs --template ../code      体检
 *   node scripts/ai-layer-check.mjs --template ../code --check   有「模板有而实例没有」则 exit 1
 *   node scripts/ai-layer-check.mjs --template ../code --verbose 连内容相同的也列出来
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)
const has = (name) => argv.includes(name)

/** AI 工程层的范围 —— 这几处是"模板能力"，不是"项目内容" */
const LAYER_ROOTS = ['CLAUDE.md', 'README.md', '.gitlab-ci.yml', 'docs', '.claude', 'scripts']

/**
 * 本来就该两边不同的 —— **项目状态**，不是模板资产。
 * 不做排除的话，报告会被正常差异淹没。
 */
const EXCLUDE = [
  'scripts/typecheck-baseline.json', // 棘轮基线：存量错误每个项目不一样
  'scripts/lint-baseline.json',
  'docs/业务',                       // 业务模块文档：生成物
  '.claude/settings.local.json',     // 个人设置：优先级高于团队设置
  '.claude/.state',
  '.ai-log',                         // 变更日志：项目自己的历史
]

const isExcluded = (rel) => EXCLUDE.some((e) => rel === e || rel.startsWith(`${e}/`))

/**
 * 从实例的 `.template-init.json` 读占位符取值。
 *
 * ⚠️ 凭据类（`DB_PASSWORD` / MinIO 钥匙）在里面是**打码的**（`***`），
 *    拿不到真值 —— 所以含这些占位符的文件仍可能误报"有差异"。已知局限。
 */
function loadValues() {
  const p = path.join(ROOT, '.template-init.json')
  if (!existsSync(p)) return null
  try {
    const v = JSON.parse(readFileSync(p, 'utf8')).values ?? null
    if (!v) return null
    // 打码的不参与替换
    return Object.fromEntries(Object.entries(v).filter(([, val]) => typeof val === 'string' && val && val !== '***'))
  } catch {
    return null
  }
}

/**
 * 把**模板侧**的内容按实例取值替换掉，再比。
 *
 * 不做这一步的话，**每个含占位符的文件都会被报成"有差异"** ——
 * 模板里是 `@@MYSQL_PORT@@`、实例里是 `3307`，而那是**设计如此**，不是差异。
 * 实测：不替换时 23 个"差异"里绝大多数是这个原因，真正的改动反而被淹没。
 */
function subst(text, values) {
  if (!values) return text
  let out = text
  for (const [k, v] of Object.entries(values)) out = out.split(`@@${k}@@`).join(v)
  return out
}

/** 递归收集文件，返回 { 相对路径: sha256 }。values 给定时对内容做占位符还原。 */
function snapshot(base, values) {
  const out = new Map()

  const walk = (rel) => {
    if (isExcluded(rel)) return
    const abs = path.join(base, rel)
    if (!existsSync(abs)) return
    const st = statSync(abs)
    if (st.isDirectory()) {
      for (const name of readdirSync(abs)) walk(rel ? `${rel}/${name}` : name)
      return
    }
    // 只比文本 —— 二进制的差异没有可操作性
    const buf = readFileSync(abs)
    if (buf.includes(0)) return
    const content = values ? subst(buf.toString('utf8'), values) : buf
    out.set(rel, createHash('sha256').update(content).digest('hex').slice(0, 12))
  }

  for (const r of LAYER_ROOTS) walk(r)
  return out
}

const short = (h) => h.slice(0, 7)

function main() {
  const tplDir = opt('--template', null)
  if (!tplDir) {
    console.error('用法：node scripts/ai-layer-check.mjs --template <模板目录> [--check] [--verbose]')
    console.error('  例：node scripts/ai-layer-check.mjs --template ../code')
    process.exit(2)
  }
  const tplRoot = path.resolve(ROOT, tplDir)
  if (!existsSync(path.join(tplRoot, 'scripts', 'init.config.mjs'))) {
    console.error(`✗ ${tplRoot} 看起来不是模板仓库（找不到 scripts/init.config.mjs）`)
    process.exit(2)
  }

  const values = loadValues()
  const mine = snapshot(ROOT)
  const theirs = snapshot(tplRoot, values) // 模板侧先按实例取值还原占位符

  if (!values) {
    console.log('⚠ 读不到 .template-init.json —— 占位符没还原，"有差异"里会混进大量噪音\n')
  }

  const behind = []   // 模板有、我没有   ← 最要紧
  const changed = []  // 两边都有、内容不同
  const ahead = []    // 我有、模板没有
  const same = []

  for (const [rel, hash] of theirs) {
    if (!mine.has(rel)) behind.push(rel)
    else if (mine.get(rel) !== hash) changed.push(rel)
    else same.push(rel)
  }
  for (const rel of mine.keys()) if (!theirs.has(rel)) ahead.push(rel)

  behind.sort()
  changed.sort()
  ahead.sort()

  console.log(`模板：${tplRoot}`)
  console.log(`本地：${ROOT}\n`)

  const list = (title, items, hint) => {
    if (!items.length) return
    console.log(`${title}（${items.length}）${hint ? `\n  ${hint}` : ''}`)
    for (const r of items) console.log(`  ${r}`)
    console.log()
  }

  list('❌ 模板有、这里没有', behind, '← 未同步的改进。跑 --check 会因这一项 exit 1')
  list('⚠ 两边都有、内容不同', changed, '可能是模板改了，也可能是这里本地改过 —— 要人判断')
  list('· 这里独有', ahead, '本地新增的文档/脚本')
  if (has('--verbose')) list('✓ 内容一致', same)

  console.log(`共 ${theirs.size} 个模板文件：一致 ${same.length} · 落后 ${behind.length} · 有差异 ${changed.length} · 本地新增 ${ahead.length}`)

  if (!behind.length && !changed.length) {
    console.log('\n✓ AI 工程层与模板一致')
    return
  }

  if (has('--check') && behind.length) {
    console.error(`\n✗ 有 ${behind.length} 个文件模板更新了而这里没有。`)
    console.error('  本脚本**不自动合并** —— 差异要人看一眼再决定怎么带过来。')
    process.exit(1)
  }
}

main()
