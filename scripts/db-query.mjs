#!/usr/bin/env node
/**
 * 只读查库 —— 给 AI 一个安全的查库入口，换取 `docker exec` 不再每次打断。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * `.claude/settings.json` 里 `docker exec` 一直是 `ask`，而查库是高频操作。
 * 原因写在 AI工程化需求.txt §3.10：权限规则是**前缀匹配**，
 * 一条 `Bash(docker exec *)` 会连 `... mysql -e "DROP TABLE ..."` 一起放行 ——
 * **没有既方便又安全的写法**。
 *
 * 但要根治不是放宽权限，是**造一个只读的封装**，然后放行那个封装：
 *   `Bash(node scripts/db-query.mjs *)` 前缀匹配放行的是**这个脚本**，
 *   而脚本本身拒绝一切写操作。这就是「用能力换权限」。
 *
 * ── 安全模型：只认第一条关键字，且逐个语句查 ────────────────────
 * 光看整串 SQL 的第一个词是不够的 —— `select 1; drop table x` 的第一个词是 select。
 * 所以：**去注释 → 按 `;` 拆 → 每个语句都要过检查**。
 * 另外挡掉几种"看着是读、其实是写"的：`into outfile` / `load_file` / `for update`。
 *
 * ⚠️ 这是**降低误操作风险**，不是防恶意绕过。它是给自己人用的护栏，
 * 不是对抗性场景下的沙箱 —— 真要绕过，改脚本就行。
 *
 * 用法：
 *   node scripts/db-query.mjs "select * from sys_user limit 5"
 *   node scripts/db-query.mjs --table "show tables"
 *   echo "desc sys_user" | node scripts/db-query.mjs
 *   node scripts/db-query.mjs --container @@PROJECT_SLUG@@-mysql --db @@DB_NAME@@ "select 1"
 *
 *   --table / -t    表格边框输出（mysql -t），默认是 tab 分隔
 *   --vertical / -E 竖排输出，列很多的表好用
 *   --container / --db / --password  覆盖连接信息
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)

const CONTAINER = opt('--container', '@@PROJECT_SLUG@@-mysql')
const DB_NAME = opt('--db', '@@DB_NAME@@')
const DB_PASSWORD = opt('--password', '@@DB_PASSWORD@@')

/** 允许的语句首关键字 */
const READ_ONLY = new Set(['select', 'show', 'desc', 'describe', 'explain'])

/** 「看着是读、其实是写」的片段 */
const FORBIDDEN_FRAGMENTS = ['into outfile', 'into dumpfile', 'load_file', 'for update', 'lock in share mode']

/** 去注释 —— MySQL 会忽略它们，我们不能被它们骗过（`/*x*\/drop table t`） */
function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/#[^\n]*/g, ' ')
}

/** 返回违规原因，通过则返回 null */
function vet(sql) {
  const clean = stripComments(sql)
  const statements = clean
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  if (statements.length === 0) return '空语句'

  for (const stmt of statements) {
    const head = stmt.split(/[\s(]+/)[0].toLowerCase()
    if (!READ_ONLY.has(head)) {
      return `语句以 "${head}" 开头，只允许 ${[...READ_ONLY].join(' / ')}`
    }
    const lower = stmt.toLowerCase()
    for (const frag of FORBIDDEN_FRAGMENTS) {
      if (lower.includes(frag)) return `包含被禁片段 "${frag}"`
    }
  }
  return null
}

// ──────────────────────────────────────────────────────────────────

async function readStdin() {
  if (process.stdin.isTTY) return ''
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

/** 取值型选项 */
const FLAG_WITH_VALUE = new Set(['--container', '--db', '--password'])

/** 全部已知选项 —— 只跳过这些，不按 `-` 前缀猜 */
const KNOWN_FLAGS = new Set([...FLAG_WITH_VALUE, '--table', '-t', '--vertical', '-E'])

/**
 * 取出非选项参数（拼成 SQL）。
 * ⚠️ 不能简单地"以 - 开头就跳过" —— SQL 里 `--` 是注释，
 * 一段以注释开头的 SQL 会被整个当成选项丢掉，静默变成"没给 SQL"。
 * 所以只跳过**已知的**选项名。
 */
function positional() {
  const out = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (FLAG_WITH_VALUE.has(a)) {
      i++
      continue
    }
    if (KNOWN_FLAGS.has(a)) continue
    out.push(a)
  }
  return out
}

const main = async () => {
  const sql = positional().join(' ') || (await readStdin()).trim()

  if (!sql) {
    console.error('用法：node scripts/db-query.mjs "select ..."')
    console.error('  或：echo "desc 表名" | node scripts/db-query.mjs')
    process.exit(1)
  }

  const bad = vet(sql)
  if (bad) {
    console.error(`✗ 拒绝执行：${bad}`)
    console.error('\n这个脚本只做只读查询。要写数据请直接改代码或走 migration ——')
    console.error('理由见 AI工程化需求.txt §3.10：写操作不该有一个"不用确认"的入口。')
    process.exit(1)
  }

  const mysqlArgs = ['exec', '-i', CONTAINER, 'mysql', '-uroot', `-p${DB_PASSWORD}`, '--default-character-set=utf8mb4']
  if (argv.includes('--table') || argv.includes('-t')) mysqlArgs.push('-t')
  if (argv.includes('--vertical') || argv.includes('-E')) mysqlArgs.push('-E')
  mysqlArgs.push(DB_NAME)

  try {
    // SQL 走 stdin，不拼进命令行 —— 免得引号/转义层层剥壳出错
    const out = execFileSync('docker', mysqlArgs, { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    process.stdout.write(out)
  } catch (e) {
    // mysql 把错误写 stderr，且退出码非 0 —— 原样透出，别吞
    if (e.stderr) process.stderr.write(e.stderr)
    else console.error(`✗ ${e.message}`)
    process.exit(1)
  }
}

main()
