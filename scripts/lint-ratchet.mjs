#!/usr/bin/env node
/**
 * ESLint 棘轮 —— 只报**新增**的 lint 问题，不报存量。
 *
 * ── 为什么照抄 typecheck.mjs 而不是"全绿门禁" ──────────────────
 * 本仓库此前**完全没有 lint**，197 个源文件一上来必然是一大批存量问题。
 * 直接跑 eslint 会淹没在噪音里 —— 没人能从几百行输出里看出"我刚才是不是改坏了"。
 * 所以用同一个棘轮模式（见 scripts/typecheck.mjs）：
 *   · 存量记进基线，之后只对**新增**失败
 *   · 修掉一个就跑 --update 让基线收紧
 *
 * **为什么不试图一次清空存量**：那正是当初类型检查没有采用的策略
 * （见 `docs/基建/类型检查棘轮.md`）。存量太大时，"修完再上"等于永远上不了。
 *
 * ── key 不带行列号（同 typecheck.mjs）──────────────────────────
 * 带行列号的 key 在改动后会大面积漂移（插一行，后面所有行号全变），
 * 于是每次改代码都报一堆假的"新增"。所以 key 只取
 * `文件 + 规则 + 消息`，配合数量做多重集比较。行号只用于展示。
 *
 * ⚠️ 已知局限：**消息里嵌了标识符的错误仍会随改名 churn**。判定方法同 typecheck ——
 *    看新增与修复的数量是否相等且文件名相同，是则跑 --update。
 *
 * ── 语法错误会让 eslint 少报其它问题 ──────────────────────────
 * 与 typecheck 的坑同源：一个文件解析失败（`error TS/parsing error`），
 * 该文件的其余规则全都不跑，于是棘轮显示"修复了一大堆"。
 * 这里显式点名，别照着那个数字跑 --update。
 *
 * 用法：
 *   node scripts/lint-ratchet.mjs            # 比对基线，有新增则 exit 1
 *   node scripts/lint-ratchet.mjs --update   # 把当前结果写为新基线
 *   node scripts/lint-ratchet.mjs --list     # 列出当前全部问题
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// ⚠️ 必须用 fileURLToPath 而不是 new URL(...).pathname —— 后者是百分号编码的，
//    本项目路径含中文，会算出一个不存在的目录。（与 typecheck.mjs 同）
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FRONTEND = path.join(ROOT, 'frontend')
const ESLINT = path.join(FRONTEND, 'node_modules', 'eslint', 'bin', 'eslint.js')
const BASELINE = path.join(ROOT, 'scripts', 'lint-baseline.json')

const args = process.argv.slice(2)
const UPDATE = args.includes('--update')
const LIST = args.includes('--list')

/** 跑 eslint，返回 [{file, rule, message, sev, line, col}] */
function runLint() {
  if (!existsSync(ESLINT)) {
    process.stderr.write(
      `找不到 eslint：${ESLINT}\n先安装前端依赖：\n  pnpm -C frontend install\n`,
    )
    process.exit(2)
  }
  if (!existsSync(path.join(FRONTEND, 'eslint.config.js'))) {
    process.stderr.write(`找不到 frontend/eslint.config.js —— 没有配置就无从 lint。\n`)
    process.exit(2)
  }

  // 刻意**不经过 pnpm**：Windows 上 pnpm 的 shim 从别的进程调用时会因为
  // 路径里的引号转义失败。直接用 node 跑 eslint 入口最稳。（与 typecheck.mjs 同）
  const res = spawnSync(process.execPath, [ESLINT, '.', '--format', 'json'], {
    cwd: FRONTEND,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  const raw = (res.stdout || '').trim()
  if (!raw) {
    // eslint 在配置错误/崩溃时把原因写在 stderr，且没有 JSON 输出
    process.stderr.write(res.stderr || 'eslint 没有输出\n')
    process.exit(2)
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    process.stderr.write(`eslint 输出不是合法 JSON：\n${raw.slice(0, 500)}\n`)
    process.exit(2)
  }

  const problems = []
  for (const file of parsed) {
    const rel = path.relative(FRONTEND, file.filePath).replace(/\\/g, '/')
    for (const m of file.messages) {
      // 解析失败没有 ruleId，单独归类 —— 见文件头那条坑
      problems.push({
        file: rel,
        rule: m.ruleId || (m.fatal ? 'FATAL(解析失败)' : 'unknown'),
        message: (m.message || '').trim(),
        sev: m.severity === 2 ? 'error' : 'warn',
        line: m.line || 0,
        col: m.column || 0,
      })
    }
  }
  return problems
}

/** 稳定 key：文件 + 规则 + 消息（不含行列号） */
const keyOf = (p) => `${p.file}|${p.rule}|${p.message}`

function toCounts(problems) {
  const m = {}
  for (const p of problems) {
    const k = keyOf(p)
    m[k] = (m[k] || 0) + 1
  }
  return m
}

function loadBaseline() {
  if (!existsSync(BASELINE)) return null
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8'))
  } catch {
    process.stderr.write(`基线文件损坏：${BASELINE}\n用 --update 重建。\n`)
    process.exit(2)
  }
}

function main() {
  process.stdout.write('运行 eslint …\n')
  const problems = runLint()
  const current = toCounts(problems)

  if (LIST) {
    for (const p of problems) {
      process.stdout.write(`  ${p.file}(${p.line},${p.col}) ${p.sev}  ${p.rule}  ${p.message}\n`)
    }
    process.stdout.write(`\n共 ${problems.length} 个\n`)
    return 0
  }

  if (UPDATE) {
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          _comment:
            'ESLint 棘轮基线。由 scripts/lint-ratchet.mjs --update 生成。' +
            'key = 文件|规则|消息（不含行列号，避免行号漂移造成假新增）。' +
            '修掉问题后请重跑 --update 让基线收紧。',
          generatedAt: new Date().toISOString(),
          total: problems.length,
          entries: current,
        },
        null,
        2,
      ) + '\n',
    )
    process.stdout.write(`基线已更新：${problems.length} 个问题 → ${path.relative(ROOT, BASELINE)}\n`)
    return 0
  }

  const base = loadBaseline()
  if (!base) {
    process.stdout.write(
      `\n没有基线文件（${path.relative(ROOT, BASELINE)}）。\n` +
        `当前有 ${problems.length} 个 lint 问题。\n\n` +
        `把当前状态记成基线：\n  node scripts/lint-ratchet.mjs --update\n`,
    )
    return 2
  }

  const baseCounts = base.entries || {}
  const added = []
  const fixed = []
  for (const k of new Set([...Object.keys(baseCounts), ...Object.keys(current)])) {
    const b = baseCounts[k] || 0
    const c = current[k] || 0
    if (c > b) added.push({ k, n: c - b })
    else if (c < b) fixed.push({ k, n: b - c })
  }

  process.stdout.write(`\nlint：${problems.length} 个问题（基线 ${base.total}）\n`)

  if (added.length === 0) {
    process.stdout.write('  ✅ 无新增问题\n')
  } else {
    const n = added.reduce((s, a) => s + a.n, 0)
    process.stdout.write(`  ❌ 新增 ${n} 个：\n\n`)
    for (const { k, n: cnt } of added.slice(0, 30)) {
      const [file, rule, message] = k.split('|')
      const sample = problems.find((p) => keyOf(p) === k)
      const loc = sample ? `(${sample.line},${sample.col})` : ''
      process.stdout.write(
        `     ${file}${loc}  ${rule}  ${message}${cnt > 1 ? `   ×${cnt}` : ''}\n`,
      )
    }
    if (added.length > 30) process.stdout.write(`     …另有 ${added.length - 30} 处\n`)
    process.stdout.write('\n  这些是你本次改动引入的。修掉后重跑即可。\n')
  }

  if (fixed.length) {
    const n = fixed.reduce((s, a) => s + a.n, 0)
    process.stdout.write(`  🎉 修复了 ${n} 个（跑 --update 可让基线收紧）\n`)
  }

  // 解析失败会让 eslint **跳过该文件的其余规则**，于是显示"修复了一大堆"。
  // 与 typecheck.mjs 里语法错误的坑同源，别照着那个数字跑 --update。
  const fatal = problems.filter((p) => p.rule.startsWith('FATAL'))
  const fixedTotal = fixed.reduce((s, a) => s + a.n, 0)
  if (fatal.length && fixedTotal > 20) {
    process.stdout.write(
      `\n  ⚠️ 当前有 ${fatal.length} 个【解析失败】的文件（如 ${fatal[0].file}）。\n` +
        `     解析失败会让该文件的其余规则全都不跑 ——\n` +
        `     上面那个「修复了 ${fixedTotal} 个」多半是假象。\n` +
        `     **先修解析错误再重跑；现在不要跑 --update。**\n`,
    )
  }

  return added.length ? 1 : 0
}

process.exit(main())
