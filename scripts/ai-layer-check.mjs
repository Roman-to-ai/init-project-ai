#!/usr/bin/env node
/**
 * AI 工程层版本体检 —— 实例与模板之间差了什么，以及**哪些能安全地带过来**。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * 模板仓库（`code/`）是主战场，AI 工程层会持续改进。而**实例是复制出去的，
 * 模板改了它不会自动跟上** —— 更糟的是**看不见差了什么**，于是没人会去同步。
 *
 * 插件机制本来能解决（实例声明依赖、跟随上游升级），但当前选择是**直接复制**
 * （见 AI工程化需求.txt §4.3）。既然是复制，就得有个"差在哪"的体检。
 *
 * ── ⭐ 怎么分辨"能安全覆盖"和"要人看" ────────────────────────────
 * 同一个文件两边内容不同，有**两种相反的原因**：
 *   a) 模板改了、实例没跟上        → 该把模板的带过来
 *   b) 实例本地改过                → 带过来会**覆盖掉本地改动**
 *
 * 光比较两份文件**分不出**它们 —— 需要**共同祖先**。实例里不一定有 git，
 * 所以 `init.mjs` 在实例化时记了一份基线哈希（`.ai-layer-manifest.json`）：
 *
 *   实例当前哈希 == 基线哈希  →  实例**从没动过**这个文件  →  **可直接带过来** ✅
 *   实例当前哈希 ≠ 基线哈希  →  本地动过  →  **要人判断** ⚠️
 *
 * 没有基线文件时（老实例、或 clone 时没带上），退化成"全部要人判断"。
 *
 * ── 它仍然不自动合并 ────────────────────────────────────────────
 * 就算标了"可直接带过来"，**覆盖文件仍然是人的决定** ——
 * 这个脚本只把判断依据摆出来。要动手请照 `.claude/skills/sync-ai-layer/SKILL.md`。
 *
 * 用法：
 *   node scripts/ai-layer-check.mjs --template ../code            体检
 *   node scripts/ai-layer-check.mjs --template ../code --check    有「落后」则 exit 1
 *   node scripts/ai-layer-check.mjs --template ../code --verbose  连一致的也列出来
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { snapshotLayer, MANIFEST, LAYER_ROOTS } from './ai-layer.config.mjs'
import { IGNORE_PLACEHOLDERS } from './init.config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)
const has = (name) => argv.includes(name)

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

/** 读实例化时记的基线哈希 */
function loadManifest() {
  const p = path.join(ROOT, MANIFEST)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8')).files ?? null
  } catch {
    return null
  }
}

/**
 * 比较含「替换不掉的占位符」的文件 —— 把那些占位符**当成任意内容**来匹配。
 *
 * 不做这层的话，这类文件只能一律报"无法比对"，而它们往往正是最该跟进的：
 * `CLAUDE.md` / `docs/基建/数据库.md` / `scripts/doc-scan.mjs` 都含 `DB_PASSWORD`。
 * 一律跳过 = 这几个文件**永远看不见模板的改动**，盲区太大。
 *
 * 匹配得上 → 真的没变（差异只是那个凭据）；匹配不上 → 结构确实变了，按正常流程分类。
 */
function fitsWildcard(tplRoot, rel, values) {
  const tplPath = path.join(tplRoot, rel)
  const instPath = path.join(ROOT, rel)
  if (!existsSync(tplPath) || !existsSync(instPath)) return false

  const tpl = readFileSync(tplPath, 'utf8')
  const inst = readFileSync(instPath, 'utf8')
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  let pattern = ''
  let last = 0
  for (const m of tpl.matchAll(/@@([A-Z0-9_]+)@@/g)) {
    pattern += esc(tpl.slice(last, m.index))
    const key = m[1]
    if (IGNORE_PLACEHOLDERS.includes(key)) pattern += esc(m[0])
    else if (values?.[key]) pattern += esc(values[key])
    else pattern += '[\\s\\S]*?' // 替换不掉的 → 任意内容
    last = m.index + m[0].length
  }
  pattern += esc(tpl.slice(last))

  try {
    return new RegExp(`^${pattern}$`).test(inst)
  } catch {
    return false // 拼出来不是合法正则就放弃，按"有差异"处理
  }
}

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
  const baseline = loadManifest()
  const mine = snapshotLayer(ROOT)
  const theirs = snapshotLayer(tplRoot, (s) => subst(s, values))

  const behind = []   // 模板有、我没有   ← 最要紧
  const safe = []     // 两边都有、内容不同，但**本地从没动过** → 可直接带
  const local = []    // 两边都有、内容不同，且**本地动过**   → 要人判断
  const ahead = []    // 我有、模板没有
  let same = 0

  for (const [rel, hash] of theirs) {
    if (!mine.has(rel)) behind.push(rel)
    else if (mine.get(rel) === hash) same++
    else {
      // 哈希不同**不等于真的有差异** —— 含替换不掉的占位符（凭据）时，
      // 两边会"看起来不同"但其实只差那个值。用通配再比一次。
      if (fitsWildcard(tplRoot, rel, values)) same++
      else if (baseline && baseline[rel] === mine.get(rel)) safe.push(rel)
      else local.push(rel)
    }
  }
  for (const rel of mine.keys()) if (!theirs.has(rel)) ahead.push(rel)

  behind.sort(); safe.sort(); local.sort(); ahead.sort()

  console.log(`模板：${tplRoot}`)
  console.log(`本地：${ROOT}`)
  if (!values) console.log('⚠ 读不到 .template-init.json —— 占位符没还原，"有差异"里会混进噪音')
  if (!baseline) console.log('⚠ 读不到基线 —— 分不出"可直接带"和"要人判断"，全部按后者处理')
  console.log()

  const list = (title, items, hint) => {
    if (!items.length) return
    console.log(`${title}（${items.length}）`)
    if (hint) console.log(`  ${hint}`)
    for (const r of items) console.log(`  ${r}`)
    console.log()
  }

  list('❌ 模板有、这里没有', behind, '← 未同步的改进。跑 --check 会因这一项 exit 1')
  list('✅ 可安全带过来', safe, '← 本地从没动过（与实例化基线一致），用模板版覆盖不会丢东西')
  list('⚠ 要人判断', local, '← 本地动过。模板的改动直接覆盖会**丢掉本地改动**，得看一眼')
  if (has('--verbose')) {
    console.log(`✓ 内容一致（${same}）\n`)
  }
  list('· 这里独有', ahead, '本地新增的文档/脚本')

  console.log(
    `共 ${theirs.size} 个模板文件：一致 ${same} · 落后 ${behind.length} · ` +
      `可安全带 ${safe.length} · 要判断 ${local.length} · 本地新增 ${ahead.length}`,
  )

  if (!behind.length && !safe.length && !local.length) {
    console.log('\n✓ AI 工程层与模板一致')
    return
  }

  if (has('--check') && behind.length) {
    console.error(`\n✗ 有 ${behind.length} 个文件模板更新了而这里没有。`)
    console.error('  本脚本**不自动合并** —— 见 .claude/skills/sync-ai-layer/SKILL.md')
    process.exit(1)
  }
}

main()
