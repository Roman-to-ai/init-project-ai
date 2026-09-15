#!/usr/bin/env node
/**
 * 引用体检 —— 全仓 Markdown / 文本文件里引用的**仓库根相对路径**是否存在。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * `skill-lint.mjs` 只查 `.claude/skills/` 里的引用。但**文档自己的引用同样会腐烂** ——
 * `docs/` 之间互相引用、`AI工程化需求.txt` 引用 `docs/`、`CLAUDE.md` 引用脚本……
 * 文件一改名，引用就失效，而且**没有任何东西会报错**。
 *
 * 实测：这个盲区里已经攒了 3 处失效引用（`docs/生成器/字段类型与校验规则.md`
 * 这个文件根本不存在，实际是两个文件 `字段类型.md` + `校验规则.md`）。
 *
 * ── 只认仓库根相对的路径 ────────────────────────────────────────
 * 文档里反引号包的东西五花八门：JSON 片段、shell 参数、npm 包名、示意性简写
 * （`sql/`、`src/xxx.ts`、`biz/domain/`）。**全当路径查会淹在误报里**，
 * 真正该发现的（`docs/xxx.md` 被改名）反而看不见。
 * 所以只认**第一段是真实顶层目录**的路径。顶层目录从磁盘现读，不硬编码。
 *
 * 用法：
 *   node scripts/ref-check.mjs            体检
 *   node scripts/ref-check.mjs --check    有失效引用则 exit 1（可挂 CI）
 *   node scripts/ref-check.mjs --verbose  连"当前文件"也列出来
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const has = (name) => argv.includes(name)

/** 查哪些文件 */
const EXTS = new Set(['.md', '.txt'])
const SKIP_DIRS = new Set(['node_modules', 'target', 'dist', '.git', 'shots', 'uploadPath'])

/**
 * 路径里出现这些段就跳过 —— 它们是**构建产物**，源码仓里本来就不存在。
 * 不跳的话，文档里写「产物在 `frontend/dist/`」这种**完全正确**的话会被报成失效引用。
 * （实测踩过：`release` skill 里那句就被误报了。）
 */
const BUILD_OUTPUT_SEGMENTS = new Set(['dist', 'target', 'node_modules', 'build'])

export function topLevelDirs(root) {
  return new Set(readdirSync(root).filter((n) => statSync(path.join(root, n)).isDirectory()))
}

/**
 * 正文里反引号包住的**仓库根相对路径**。
 * 判定规则见文件头 —— 只认第一段是真实顶层目录的。
 */
export function refPathsIn(text, top) {
  const out = new Set()
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const raw = m[1].trim()
    if (raw.includes('://')) continue
    // 通配 / 占位 / shell 记法 —— 都不是"某个具体文件"
    if (/[*<>{}]/.test(raw)) continue
    if (/\s/.test(raw)) continue
    if (raw.startsWith('/') || raw.startsWith('.')) continue
    if (!raw.includes('/')) continue
    const clean = raw.replace(/[),.;:]+$/, '').replace(/#.*$/, '')
    const segs = clean.split('/')
    if (!top.has(segs[0])) continue
    // 构建产物目录跳过 —— 见 BUILD_OUTPUT_SEGMENTS 的说明
    if (segs.some((s) => BUILD_OUTPUT_SEGMENTS.has(s))) continue
    out.add(clean)
  }
  return out
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (EXTS.has(path.extname(name))) out.push(full)
  }
  return out
}

function main() {
  const top = topLevelDirs(ROOT)
  const files = walk(ROOT)

  const broken = [] // { ref, where }
  let refs = 0

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const r of refPathsIn(text, top)) {
      refs++
      // 目录引用（以 / 结尾）也要能解析
      if (!existsSync(path.join(ROOT, r))) broken.push({ ref: r, where: rel })
    }
  }

  if (!broken.length) {
    console.log(`✓ ${files.length} 个文件、${refs} 处引用，全部有效`)
    return
  }

  console.error(`✗ ${broken.length} 处引用的路径不存在：\n`)
  const byWhere = new Map()
  for (const { ref, where } of broken) {
    if (!byWhere.has(where)) byWhere.set(where, [])
    byWhere.get(where).push(ref)
  }
  for (const [where, list] of byWhere) {
    console.error(`  ${where}`)
    for (const r of list) console.error(`      ${r}`)
  }
  console.error(`\n改名或删文件之后，引用它的地方要一起改 —— 没有任何东西会自动提醒你，除了这个脚本。`)
  console.error(`（只认仓库根相对的路径；示意性简写和代码片段不在检查范围内）`)

  if (has('--check')) process.exit(1)
}

// 被 import 时不执行 CLI 部分
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
