#!/usr/bin/env node
/**
 * 类型检查棘轮（ratchet）—— 只报**新增**的类型错误，不报存量。
 *
 * ── 为什么是棘轮而不是"全绿门禁" ────────────────────────────────
 * 本仓库有 300+ 个**存量**类型错误（见下），一次性修完是一个动 30 多个文件的
 * 项目，不是一步能做完的事。但直接跑 vue-tsc 又会淹没在存量噪音里 ——
 * 没人能从 306 行输出里看出"我刚才是不是改坏了"。
 *
 * 棘轮解决的问题：把存量记进基线，之后**只对新增错误失败**。
 *   · 你不能让它变多（改坏东西立刻被发现）
 *   · 它会随你减少而收紧（修掉一个就跑 --update 把基线降下来）
 *
 * ── 为什么 key 不带行列号 ──────────────────────────────────────
 * 带行列号的 key 在改动后会大面积漂移（文件里插一行，后面所有错误的行号全变），
 * 于是每次改代码都报一堆假的"新增"。所以 key 只取
 * `文件 + 错误码 + 消息`，配合数量做多重集比较。行号只用于展示。
 *
 * ⚠️ 已知局限：**消息里嵌了类型字面量的错误，仍会随结构变动 churn**。
 *    例如生成代码里 `form.value = response.data` 的报错，
 *    消息中会列出目标类型的字段顺序：
 *      Type 'X | undefined' is not assignable to type '{ a?: number; b?: string; ... }'
 *    一旦调整 `gen_table_column.sort`（列顺序）或增删字段，这段消息就变，
 *    于是棘轮报"新增 1 个 / 修复 1 个"——**净变化为 0，是假警报**。
 *    判断方法：看新增与修复的数量是否相等且文件名相同。是则跑 --update 即可。
 *
 * ── 存量错误的来源（供将来清理时参考）────────────────────────────
 *   ~70 个 : Element Plus 恢复真实类型后暴露的（原先被空声明抹成 any）
 *    44 个 : `const { proxy } = getCurrentInstance()` —— 返回值可空，
 *            解构前需加 `!`；上游自己也不一致（RightToolbar 里写了 `!`）
 *   ~190 个 : 模板绑定签名、possibly-undefined 等代码本身的既有问题
 *   关掉 strict 也只能降到 221，没有配置捷径。
 *
 * ── 生成新模块后请跑 --update ──────────────────────────────────
 * 代码生成器产出的 CRUD 页面每个模块约带 22 个类型错误，且**性质与上面这批完全同类**
 * （proxy 可空、reset() 赋 null、queryParams.params 未声明、@click 签名……）——
 * 那是框架全代码库的统一写法，不是新引入的坏味道。
 *
 * 刻意**不去改 VM 模板迎合类型**：那会让生成代码与其余代码库风格分裂，
 * 而且其中几处（如 reset() 的初值）改动会改变运行时行为。
 * 所以策略是：**生成完模块后跑一次 --update 把它收进基线**，
 * 让棘轮继续对"手写改动"保持敏感 —— 回归本来就主要来自手写改动。
 *
 * （生成器模板里确实有过一个**真** bug：`toggleExpandQuery()` 用了未声明的
 *   `queryRef.value`，每次点击都静默抛 ReferenceError。已改为上游惯用的
 *   `proxy.$refs["queryRef"]`。这类才是值得追的。）
 *
 * 用法：
 *   node scripts/typecheck.mjs            # 比对基线，有新增则 exit 1
 *   node scripts/typecheck.mjs --update   # 把当前结果写为新基线
 *   node scripts/typecheck.mjs --list     # 列出当前全部错误
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// ⚠️ 必须用 fileURLToPath 而不是 new URL(...).pathname —— 后者是百分号编码的，
//    本项目路径含中文，会算出一个不存在的目录。
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FRONTEND = path.join(ROOT, 'frontend')
const VUE_TSC = path.join(FRONTEND, 'node_modules', 'vue-tsc', 'bin', 'vue-tsc.js')
const BASELINE = path.join(ROOT, 'scripts', 'typecheck-baseline.json')

const args = process.argv.slice(2)
const UPDATE = args.includes('--update')
const LIST = args.includes('--list')

/** 跑 vue-tsc，返回 { out, errors: [{file, code, message, loc}] } */
function runTypeCheck() {
  if (!existsSync(VUE_TSC)) {
    process.stderr.write(
      `找不到 vue-tsc：${VUE_TSC}\n先安装前端依赖：\n  pnpm -C frontend install\n`
    )
    process.exit(2)
  }

  // 刻意**不经过 pnpm**：Windows 上 pnpm 的 shim 从别的进程调用时会因为
  // 路径里的引号转义失败（'"D:\nvm4w\nodejs\\node_modules\pnpm\pnpm"' 不是
  // 内部或外部命令）。直接用 node 跑 vue-tsc 的入口最稳。
  const res = spawnSync(process.execPath, [VUE_TSC, '--noEmit'], {
    cwd: FRONTEND,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  const out = `${res.stdout || ''}\n${res.stderr || ''}`

  const errors = []
  for (const line of out.split(/\r?\n/)) {
    // 形如  src/views/x.vue(12,34): error TS2339: Property 'y' does not exist ...
    const m = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/)
    if (!m) continue
    errors.push({
      file: m[1].replace(/\\/g, '/').replace(/^\.\//, ''),
      line: Number(m[2]),
      col: Number(m[3]),
      code: m[4],
      message: m[5].trim(),
    })
  }
  return { out, errors }
}

/** 稳定 key：文件 + 错误码 + 消息（不含行列号） */
const keyOf = (e) => `${e.file}|${e.code}|${e.message}`

/** 转成 { key: count } 的多重集 */
function toCounts(errors) {
  const m = {}
  for (const e of errors) {
    const k = keyOf(e)
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
  process.stdout.write('运行 vue-tsc …（首次约需 1 分钟）\n')
  const { errors } = runTypeCheck()
  const current = toCounts(errors)

  if (LIST) {
    for (const e of errors) {
      process.stdout.write(`  ${e.file}(${e.line},${e.col}) ${e.code}  ${e.message}\n`)
    }
    process.stdout.write(`\n共 ${errors.length} 个\n`)
    return 0
  }

  if (UPDATE) {
    const payload = {
      _comment:
        '类型检查棘轮基线。由 scripts/typecheck.mjs --update 生成。' +
        'key = 文件|错误码|消息（不含行列号，避免行号漂移造成假新增）。' +
        '修掉错误后请重跑 --update 让基线收紧。',
      generatedAt: new Date().toISOString(),
      total: errors.length,
      entries: current,
    }
    writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + '\n')
    process.stdout.write(`基线已更新：${errors.length} 个错误 → ${path.relative(ROOT, BASELINE)}\n`)
    return 0
  }

  const base = loadBaseline()
  if (!base) {
    process.stdout.write(
      `\n没有基线文件（${path.relative(ROOT, BASELINE)}）。\n` +
        `当前有 ${errors.length} 个类型错误。\n\n` +
        `把当前状态记成基线：\n  node scripts/typecheck.mjs --update\n`
    )
    return 2
  }

  const baseCounts = base.entries || {}
  const added = []
  const fixed = []
  const allKeys = new Set([...Object.keys(baseCounts), ...Object.keys(current)])
  for (const k of allKeys) {
    const b = baseCounts[k] || 0
    const c = current[k] || 0
    if (c > b) added.push({ k, n: c - b })
    else if (c < b) fixed.push({ k, n: b - c })
  }

  process.stdout.write(`\n类型检查：${errors.length} 个错误（基线 ${base.total}）\n`)

  if (added.length === 0) {
    process.stdout.write('  ✅ 无新增错误\n')
  } else {
    const n = added.reduce((s, a) => s + a.n, 0)
    process.stdout.write(`  ❌ 新增 ${n} 个错误：\n\n`)
    for (const { k, n: cnt } of added.slice(0, 30)) {
      const [file, code, message] = k.split('|')
      const sample = errors.find((e) => keyOf(e) === k)
      const loc = sample ? `(${sample.line},${sample.col})` : ''
      process.stdout.write(`     ${file}${loc}  ${code}  ${message}${cnt > 1 ? `   ×${cnt}` : ''}\n`)
    }
    if (added.length > 30) process.stdout.write(`     …另有 ${added.length - 30} 处\n`)
    process.stdout.write('\n  这些是你本次改动引入的。修掉后重跑即可。\n')
  }

  if (fixed.length) {
    const n = fixed.reduce((s, a) => s + a.n, 0)
    process.stdout.write(`  🎉 修复了 ${n} 个（跑 --update 可让基线收紧）\n`)
  }

  // ⚠️ 语法错误会让 vue-tsc **中止整个程序**，只报它自己 —— 于是棘轮显示
  //    「新增 1 个 / 修复 400 多个」，看着像质量突飞猛进，其实是检查被整体掐断了。
  //    实测：frontend/vite.config.ts 里一个 `port: @@FRONTEND_PORT@@`（模板占位符，
  //    不是合法表达式）就能让 436 个错误全部消失。
  //    这里显式点出来，免得有人照着那个数字跑 --update，把基线压成 1。
  //    详见 docs/基建/类型检查棘轮.md。
  const syntax = errors.filter((e) => /^TS1\d{3}$/.test(e.code))
  const fixedTotal = fixed.reduce((s, a) => s + a.n, 0)
  if (syntax.length && fixedTotal > 20) {
    process.stdout.write(
      `\n  ⚠️ 当前有 ${syntax.length} 个【语法】错误（如 ${syntax[0].code}）。\n` +
        `     语法错误会让 vue-tsc 中止整个程序、不再报其余类型错误 ——\n` +
        `     上面那个「修复了 ${fixedTotal} 个」多半是假象，不是代码变干净了。\n` +
        `     **先修语法错误再重跑；现在不要跑 --update。**\n` +
        `     详见 docs/基建/类型检查棘轮.md。\n`,
    )
  }

  return added.length ? 1 : 0
}

process.exit(main())
