#!/usr/bin/env node
/**
 * 模板实例化 —— 把占位符（`@@KEY@@`）换成新项目的值。
 *
 * 使用者跑的是这个；维护模板时跑的是 `scripts/templatize.mjs`（反向：字面量 → 占位符）。
 * 变量清单与排除规则都来自 `scripts/init.config.mjs`（单一事实来源）。
 *
 * ── 两个阶段，顺序不能反 ────────────────────────────────────────
 *   1. **改名字** —— 文件与目录名里的占位符（`@@APP_CLASS@@.java`、`@@JAVA_PACKAGE_ROOT@@/`）
 *   2. **改内容** —— 所有文本文件里的占位符
 * 先改名字，第 2 步遍历到的就是最终路径，报告里的路径才是能直接用的。
 *
 * ── `@@JAVA_PACKAGE_ROOT@@` 是唯一一个会「展开」的变量 ──────────
 * 其余变量的值都是单个路径段，直接替换即可。但包根的值是 `com.example` 这样带点的，
 * 而它在磁盘上是一个**目录名**：
 *
 *     src/main/java/@@JAVA_PACKAGE_ROOT@@/controller/...
 *                  ↓  值 = com.example
 *     src/main/java/com/example/controller/...
 *
 * 所以配置里给它标了 `asPath: true`，改名时按点拆成目录层级。
 *
 * ── 关于「字节级 no-op 闸门」 ───────────────────────────────────
 * `init.config.mjs` 的注释里写着「默认值必须等于当前仓库的实际值，这样用默认值跑一遍
 * init 输出与输入逐字节相同」。**那条只对默认值本身就是占位符的变量成立**
 * （`APP_CLASS` / `CONFIG_CLASS` / `SERVLET_INITIALIZER` / `JAVA_PACKAGE_ROOT` / `PROJECT_NAME`
 * 的默认值就是占位符本身）。其余变量（`PROJECT_SLUG` = `mes`、`DB_NAME` = `ry-vue` …）
 * 的默认值是真值，用它们跑 init 会**真的改内容**，不是 no-op。
 *
 * 所以别把「no-op」当测试手段 —— 要体检就跑 `--check`：它列出仓库里所有占位符
 * 以及各自会被换成什么，只读、不写。
 *
 * 用法：
 *   node scripts/init.mjs                    交互式逐项提问
 *   node scripts/init.mjs --defaults         全用默认值，不问
 *   node scripts/init.mjs --set DB_NAME=mydb --set PROJECT_SLUG=foo
 *   node scripts/init.mjs --check            只读体检：列出占位符与其目标值
 *   node scripts/init.mjs --dry-run          演示会改什么，不落盘
 *   node scripts/init.mjs --yes              跳过最后的确认
 */

import { readdirSync, statSync, readFileSync, writeFileSync,
         renameSync, mkdirSync, rmdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { VARIABLES, DEFAULTS, EXCLUDE_DIRS, EXCLUDE_FILES, BINARY_EXT,
         IGNORE_PLACEHOLDERS } from './init.config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d)

const CHECK = has('--check')
const DRY = has('--dry-run')
const YES = has('--yes')
const USE_DEFAULTS = has('--defaults')
const SETS = argv.reduce((acc, a, i) => (a === '--set' ? [...acc, argv[i + 1]] : acc), [])

const PLACEHOLDER = /@@([A-Z][A-Z0-9_]*)@@/g
const byKey = Object.fromEntries(VARIABLES.map((v) => [v.key, v]))
/** 长 key 先替，避免短 key 命中长 key 的一部分 */
const KEYS_BY_LEN = VARIABLES.map((v) => v.key).sort((a, b) => b.length - a.length)

// ────────────────────────────────────────────────────────────────
// 取值
// ────────────────────────────────────────────────────────────────

async function collectValues() {
  const values = { ...DEFAULTS }
  for (const kv of SETS) {
    const i = kv.indexOf('=')
    if (i < 1) die(`--set 的格式是 KEY=VALUE，收到：${kv}`)
    const key = kv.slice(0, i)
    if (!byKey[key]) die(`未知变量 ${key}。可用：${VARIABLES.map((v) => v.key).join(', ')}`)
    values[key] = kv.slice(i + 1)
  }
  // --check 是纯体检，不该拦截提问；其余情况没给值就问
  if (!CHECK && !USE_DEFAULTS && !SETS.length) await prompt(values)

  for (const v of VARIABLES) {
    const raw = values[v.key]
    values[v.key] = v.apply ? v.apply(raw) : raw
    // 默认值**本身就是占位符**的那几个变量（APP_CLASS / JAVA_PACKAGE_ROOT / …），
    // 在模板态下必然过不了自己的格式校验 —— 那不是错误，是「还没实例化」。
    // 只校验用户真给了值的情况。
    if (/@@[A-Z_]+@@/.test(values[v.key])) continue
    if (v.validate && !v.validate.test(values[v.key])) {
      die(`${v.key} 取值不合法：${JSON.stringify(values[v.key])}\n  ${v.validateMessage || ''}`)
    }
  }
  return values
}

async function prompt(values) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  console.log('\n逐项确认（直接回车接受方括号里的默认值）：\n')
  let group = null
  for (const v of VARIABLES) {
    if (v.group && v.group !== group) { group = v.group; console.log(`── ${group} ──`) }
    console.log(`${v.label}  [${values[v.key]}]`)
    if (v.hint) console.log(`  ${v.hint}`)
    const a = (await rl.question('> ')).trim()
    if (a) values[v.key] = a
    console.log()
  }
  rl.close()
}

// ────────────────────────────────────────────────────────────────
// 遍历
// ────────────────────────────────────────────────────────────────

const skipDir = (name) => EXCLUDE_DIRS.includes(name)
/** 排除名单 + 二进制后缀（后缀表只是**加速**：命中就不必读文件了） */
const skipFile = (name) => EXCLUDE_FILES.some((f) => name === f || name.endsWith(f)) ||
  BINARY_EXT.some((e) => name.toLowerCase().endsWith(e))
/** 后缀认不出来的，按**内容**判断：前 8KB 含 NUL 就是二进制 */
const isBinary = (buf) => buf.subarray(0, 8192).includes(0)

/** 深度优先，返回 {dirs, files} 的绝对路径 */
function walk(dir, acc = { dirs: [], files: [] }) {
  for (const name of readdirSync(dir)) {
    if (skipDir(name)) continue
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) { acc.dirs.push(p); walk(p, acc) }
    else acc.files.push(p)
  }
  return acc
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/')
const depth = (p) => rel(p).split('/').length

// ────────────────────────────────────────────────────────────────
// 阶段 1：改名字
// ────────────────────────────────────────────────────────────────

/**
 * 把一个「名字」里的占位符换成值。
 * 只有 `asPath` 的变量、且整个名字**就是**那个占位符时，才按点展开成路径。
 * 其余情况（如 `@@MAVEN_ARTIFACT_PREFIX@@-admin`）都是直接的字符串替换。
 */
function resolveName(name, values) {
  let out = name
  for (const key of KEYS_BY_LEN) {
    const token = `@@${key}@@`
    if (!out.includes(token)) continue
    const v = byKey[key]
    if (v.asPath && out === token) return values[key].split('.').join(path.sep)
    out = out.split(token).join(values[key])
  }
  return out
}

function renameAll(values, log) {
  for (let pass = 0; pass < 10; pass++) {
    const { dirs, files } = walk(ROOT)
    const hits = [...dirs, ...files]
      .filter((p) => path.basename(p).includes('@@'))
      .sort((a, b) => depth(b) - depth(a)) // 深的先改，父路径才还有效
    if (!hits.length) return

    for (const p of hits) {
      const to = resolveName(path.basename(p), values)
      const target = path.join(path.dirname(p), to)
      log(`  ${rel(p)}\n    → ${rel(target)}`)
      if (DRY) continue
      mkdirSync(path.dirname(target), { recursive: true })
      // 目标已存在时不能直接 rename（Windows 会失败），先确认是空目录再复用
      if (existsSync(target)) {
        if (statSync(target).isDirectory() && !readdirSync(target).length) rmdirSync(target)
        else die(`目标已存在且非空：${rel(target)}`)
      }
      renameSync(p, target)
    }
    if (DRY) return
  }
  die('改名迭代超过 10 轮，可能是占位符写法有误。请检查文件名。')
}

// ────────────────────────────────────────────────────────────────
// 阶段 2：改内容
// ────────────────────────────────────────────────────────────────

function rewriteAll(values, log) {
  const { files } = walk(ROOT)
  const perVar = Object.fromEntries(VARIABLES.map((v) => [v.key, 0]))
  let changed = 0

  for (const p of files) {
    if (skipFile(path.basename(p))) continue
    let buf
    try { buf = readFileSync(p) } catch { continue }
    if (isBinary(buf)) continue

    let s = buf.toString('utf8')
    const before = s
    for (const key of KEYS_BY_LEN) {
      const token = `@@${key}@@`
      if (!s.includes(token)) continue
      perVar[key] += s.split(token).length - 1
      s = s.split(token).join(values[key])
    }
    if (s === before) continue
    changed++
    log(`  ~ ${rel(p)}`)
    if (!DRY) writeFileSync(p, s, 'utf8')
  }
  return { changed, perVar }
}

/** 还剩下哪些没被替换的占位符（拼错的、或配置里没定义的） */
function leftovers() {
  const seen = new Map()
  for (const p of walk(ROOT).files) {
    if (skipFile(path.basename(p))) continue
    let buf
    try { buf = readFileSync(p) } catch { continue }
    if (isBinary(buf)) continue
    for (const m of buf.toString('utf8').matchAll(PLACEHOLDER)) {
      if (!seen.has(m[1])) seen.set(m[1], rel(p))
    }
  }
  // 配置里用来说明语法的示例不算「没替换干净」
  for (const k of IGNORE_PLACEHOLDERS) seen.delete(k)
  return seen
}

function die(msg) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(2)
}

// ────────────────────────────────────────────────────────────────
// 主流程
// ────────────────────────────────────────────────────────────────

const found = leftovers()
if (!found.size) {
  console.log('\n这个仓库里已经找不到任何占位符了 —— 看起来已经实例化过。')
  console.log('如果你确实要重新实例化，请从模板重新克隆一份。\n')
  process.exit(0)
}

const values = await collectValues()

if (CHECK) {
  console.log('\n仓库里的占位符 → 将被替换为：\n')
  for (const v of VARIABLES) {
    console.log(`  @@${v.key}@@`.padEnd(30) + `→ ${values[v.key]}`)
  }
  const unknown = [...found.keys()].filter((k) => !byKey[k])
  if (unknown.length) {
    console.log(`\n⚠️ 以下占位符在 init.config.mjs 里没有定义，不会被替换：`)
    for (const k of unknown) console.log(`  @@${k}@@   （首次出现在 ${found.get(k)}）`)
  }
  console.log(`\n（--check 只读，未写入任何文件）\n`)
  process.exit(unknown.length ? 1 : 0)
}

console.log(`\n目标目录：${ROOT}`)
console.log(`变量：${VARIABLES.length} 个`)
if (DRY) console.log('模式：--dry-run（不落盘）')
if (!YES && !DRY) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const a = (await rl.question('\n开始实例化？(y/N) ')).trim().toLowerCase()
  rl.close()
  if (a !== 'y') { console.log('已取消。'); process.exit(0) }
}

console.log('\n[1/2] 重命名文件与目录')
renameAll(values, (l) => console.log(l))
console.log('\n[2/2] 替换文件内容')
const { changed, perVar } = rewriteAll(values, (l) => console.log(l))

console.log(`\n${DRY ? '（dry-run）' : ''}改名若干处，改写 ${changed} 个文件。按变量统计：`)
for (const v of VARIABLES) if (perVar[v.key]) console.log(`  ${String(perVar[v.key]).padStart(5)}  ${v.key}`)

const left = leftovers()
// ⚠️ **dry-run 下不能照搬这个检查**：不落盘，文件里当然还全是占位符。
//    原样报出来就是一长串「还剩 N 个没被替换 …… 要么是没定义，要么是拼错了」，
//    而它们其实全都能替换 —— 照 `init-project` 的流程先跑 dry-run 的人会被吓到
//    （2026-09-15 实测踩到）。此时只有**配置里真没定义的**才值得报。
const report = DRY ? new Map([...left].filter(([k]) => DEFAULTS[k] === undefined)) : left
if (report.size) {
  console.log(`\n⚠️ 还剩 ${report.size} 个占位符没被替换：`)
  for (const [k, where] of report) console.log(`  @@${k}@@   （${where}）`)
  console.log('   —— 要么是 init.config.mjs 里没定义，要么是拼错了。')
}

if (!DRY) {
  // 实例化标记 —— `.gitignore` 里早就预留了这个文件名，但一直没人写。
  // 用途：一眼看出「这个仓库是模板态还是已实例化」，以及当初填了什么值。
  //
  // ⚠️ 凭据类变量（init.config.mjs 里标了 secret 的）**打码后再落盘** ——
  //    这个文件虽然已 gitignore，但没有理由把密钥明文写进去。
  const recorded = Object.fromEntries(
    VARIABLES.map((v) => [v.key, v.secret ? '***' : values[v.key]]))
  writeFileSync(path.join(ROOT, '.template-init.json'),
    JSON.stringify({ instantiatedAt: new Date().toISOString(), values: recorded }, null, 2) + '\n', 'utf8')

  console.log(`
下一步：
  docker compose -f deploy/docker-compose.yml up -d
  mvn -f backend/pom.xml clean install -DskipTests

已写入 .template-init.json（记录本次填的值；它已在 .gitignore 里，不会进版本库）。
模板维护用的三个脚本（init.mjs / init.config.mjs / templatize.mjs）留着不影响运行 ——
以后想给模板再加占位符时还用得上；不需要可自行删除。
`)
}
