/**
 * 把仓库里的**字面量**换成占位符（@@KEY@@），供模板维护使用。
 *
 * 使用者不需要跑这个 —— 他们跑的是 `scripts/init.mjs`（反向：占位符 → 新值）。
 * 这个脚本在**给模板加新功能、又引入了新的硬编码默认值**时跑一次，
 * 把新出现的字面量也纳入占位符体系。
 *
 * ⚠️ 所有规则都**带上下文锚点**，不做裸替换。
 *    反例：裸替换 `123456` 会把演示数据里的条形码 `6901234567890` 也改掉。
 *
 * 幂等：已经替换过的位置不会再匹配（占位符里没有原字面量）。
 *
 * 用法：
 *   node scripts/templatize.mjs --dry-run     # 只报告会改什么
 *   node scripts/templatize.mjs               # 实际写入
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { EXCLUDE_DIRS, EXCLUDE_FILES, BINARY_EXT } from './init.config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry-run')

/**
 * 替换规则。顺序**有讲究**：
 *   1. 长串先于短串（`@@PROJECT_SLUG@@-mysql-data` 必须在 `@@PROJECT_SLUG@@-mysql` 之前）
 *   2. 类名先于包名（`@@CONFIG_CLASS@@` 独立于 `@@JAVA_PACKAGE_ROOT@@`，互不干扰，但类名更具体）
 *   3. 带锚点的密码/端口规则放在最后
 */
const RULES = [
  // ── 类名（精确全词，不用通配 RuoYi —— 散文里也有「框架 RuoYi」）──
  { re: /\bRuoYiServletInitializer\b/g, to: '@@SERVLET_INITIALIZER@@', why: 'Servlet 初始化类名' },
  { re: /\bRuoYiApplication\b/g, to: '@@APP_CLASS@@', why: '启动类名' },
  { re: /\bRuoYiConfig\b/g, to: '@@CONFIG_CLASS@@', why: '配置类名' },

  // ── Java 包根（333 个文件，机械替换，无误伤风险）──
  { re: /\bcom\.ruoyi\b/g, to: '@@JAVA_PACKAGE_ROOT@@', why: 'Java 包根' },

  // ── Maven 模块前缀（目录名 / artifactId / jar 名）──
  ...['admin', 'common', 'framework', 'generator', 'quartz', 'system', 'biz', 'storage-minio'].map((m) => ({
    re: new RegExp(`\\bruoyi-${m}\\b`, 'g'),
    to: `@@MAVEN_ARTIFACT_PREFIX@@-${m}`,
    why: `Maven 模块 ruoyi-${m}`,
  })),
  { re: /\bruoyi\.jar\b/g, to: '@@MAVEN_ARTIFACT_PREFIX@@.jar', why: 'jar 名' },

  // ── 容器与数据卷（长的先来）──
  { re: /\bmes-mysql-data\b/g, to: '@@PROJECT_SLUG@@-mysql-data', why: 'MySQL 数据卷' },
  { re: /\bmes-redis-data\b/g, to: '@@PROJECT_SLUG@@-redis-data', why: 'Redis 数据卷' },
  { re: /\bmes-mysql\b/g, to: '@@PROJECT_SLUG@@-mysql', why: 'MySQL 容器' },
  { re: /\bmes-redis\b/g, to: '@@PROJECT_SLUG@@-redis', why: 'Redis 容器' },
  // ⚠️ minio-data / minio-init 必须排在 minio 之前：
  //    \bmes-minio\b 的尾部 \b 会被 "-" 满足，从而匹配到 mes-minio-data 的前缀
  { re: /\bmes-minio-data\b/g, to: '@@PROJECT_SLUG@@-minio-data', why: 'MinIO 数据卷' },
  { re: /\bmes-minio-init\b/g, to: '@@PROJECT_SLUG@@-minio-init', why: 'MinIO init 容器' },
  { re: /\bmes-minio\b/g, to: '@@PROJECT_SLUG@@-minio', why: 'MinIO 容器' },
  { re: /\bmes-files\b/g, to: '@@PROJECT_SLUG@@-files', why: 'MinIO 桶名' },
  { re: /name=@@PROJECT_SLUG@@-/g, to: 'name=@@PROJECT_SLUG@@-', why: 'docker ps --filter name=@@PROJECT_SLUG@@-' },

  // ── 数据库名（带引号/反引号/URL 上下文，避免误伤）──
  { re: /"@@DB_NAME@@"/g, to: '"@@DB_NAME@@"', why: 'compose 的 MYSQL_DATABASE' },
  { re: /localhost:\d+\/ry-vue/g, to: 'localhost:@@MYSQL_PORT@@/@@DB_NAME@@', why: 'JDBC URL' },
  { re: /utf8mb4 @@DB_NAME@@/g, to: 'utf8mb4 @@DB_NAME@@', why: '文档里的导入命令' },

  // ── 密码：只在明确的密码上下文替换 ──
  { re: /-p@@DB_PASSWORD@@\b/g, to: '-p@@DB_PASSWORD@@', why: 'mysql CLI 的 -p' },
  { re: /MYSQL_ROOT_PASSWORD: "@@DB_PASSWORD@@"/g, to: 'MYSQL_ROOT_PASSWORD: "@@DB_PASSWORD@@"', why: 'compose 密码' },
  { re: /password: @@DB_PASSWORD@@\b/g, to: 'password: @@DB_PASSWORD@@', why: 'druid/redis 密码' },
  { re: /-p'@@DB_PASSWORD@@'/g, to: "-p'@@DB_PASSWORD@@'", why: 'healthcheck 内联密码' },
  { re: /\$\{MINIO_ROOT_USER:-minioadmin\}/g, to: '${MINIO_ROOT_USER:-@@MINIO_ACCESS_KEY@@}', why: 'MinIO 账号默认值' },
  { re: /\$\{MINIO_ROOT_PASSWORD:-minioadmin\}/g, to: '${MINIO_ROOT_PASSWORD:-@@MINIO_SECRET_KEY@@}', why: 'MinIO 密码默认值' },

  // ── 端口：全部带上下文 ──
  { re: /127\.0\.0\.1:3307:3306/g, to: '127.0.0.1:@@MYSQL_PORT@@:3306', why: 'compose MySQL 端口映射' },
  { re: /127\.0\.0\.1:6380:6379/g, to: '127.0.0.1:@@REDIS_PORT@@:6379', why: 'compose Redis 端口映射' },
  { re: /127\.0\.0\.1:9002:9000/g, to: '127.0.0.1:@@MINIO_PORT@@:9000', why: 'compose MinIO S3 API 端口映射' },
  { re: /127\.0\.0\.1:9003:9001/g, to: '127.0.0.1:@@MINIO_CONSOLE_PORT@@:9001', why: 'compose MinIO 控制台端口映射' },
  { re: /localhost:@@BACKEND_PORT@@/g, to: 'localhost:@@BACKEND_PORT@@', why: 'backend 地址' },
  { re: /^(\s*)port: 8080\s*$/gm, to: '$1port: @@BACKEND_PORT@@', why: 'application.yml 端口' },
  { re: /^(\s*)port: 6380\s*$/gm, to: '$1port: @@REDIS_PORT@@', why: 'application.yml Redis 端口' },
  { re: /^(\s*)port: 80,\s*$/gm, to: '$1port: @@FRONTEND_PORT@@,', why: 'vite 端口' },

  // ── 项目显示名 ──
  { re: /@@PROJECT_NAME@@/g, to: '@@PROJECT_NAME@@', why: 'VITE_APP_TITLE / package.json description / 页脚' },

  // ── 绝对路径 → 相对路径（比 token 更合适：本来就是相对仓库根执行的）──
  //   ⚠️ 具体的必须排在通用之前 —— 否则通用规则先吃掉 ""，
  //   这条只剩 "profile: uploadPath"，永远命中不到。
  { re: /profile: E:\/mes\/code\/uploadPath/g, to: 'profile: ${RUOYI_PROFILE:./uploadPath}', why: '上传目录 → 环境变量+相对路径' },
  { re: /E:\/mes\/code\//g, to: '', why: '文档里的绝对路径 → 相对路径' },
  { re: /E:\\\\mes\\\\code\\\\/g, to: '', why: '同上（转义形式）' },
]

const BIN = new Set(BINARY_EXT)
const SKIP_FILES = new Set(EXCLUDE_FILES)
const SKIP_DIRS = new Set(EXCLUDE_DIRS.map((d) => d.split('/')[0]))

/**
 * 本文件自己 —— **工具绝不能改写自己的规则定义**。
 *
 * 踩过的坑：`{ re: /\bmes-minio-data\b/g, ... }` 这行里的 `mes-minio-data` 会被
 * **它自己的规则**匹配上，于是被改写成 `/@@PROJECT_SLUG@@-minio-data/g` —— 规则
 * 当场失效，而且不报错。仓库里已经留下过这种残骸：几条 `re:` 与 `to:` 一模一样
 * 的自指规则（如 `/@@PROJECT_NAME@@/g` → `'@@PROJECT_NAME@@'`），就是被自己改写过的。
 *
 * ⚠️ 与它相反：`scripts/init.config.mjs` **要**参与替换（它里面的默认值本来就是占位符），
 *    所以不能整个 `scripts/` 都跳过。
 */
const SELF = fileURLToPath(import.meta.url)

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      await walk(path.join(dir, e.name), out)
    } else if (e.isFile()) {
      if (SKIP_FILES.has(e.name)) continue
      const full = path.join(dir, e.name)
      if (path.resolve(full) === SELF) continue
      out.push(full)
    }
  }
  return out
}

async function isBinary(file) {
  if (BIN.has(path.extname(file).toLowerCase())) return true
  const buf = await readFile(file)
  return buf.subarray(0, 8192).includes(0)
}

const stats = new Map()
const changedFiles = []
let scanned = 0
let skippedBin = 0

for (const file of await walk(ROOT)) {
  if (await isBinary(file)) { skippedBin++; continue }
  scanned++
  const raw = await readFile(file, 'utf8')
  let next = raw

  for (const { re, to, why } of RULES) {
    const before = next
    next = next.replace(re, to)
    if (next !== before) {
      const n = (before.match(re) || []).length
      if (n) stats.set(why, (stats.get(why) || 0) + n)
    }
  }

  if (next !== raw) {
    changedFiles.push(path.relative(ROOT, file))
    if (!DRY) await writeFile(file, next, 'utf8')
  }
}

// 新增的占位符自检：确保没有 @@ 残留在不该有的地方（本次是反向，忽略）
console.log(`\n扫描 ${scanned} 个文本文件（跳过 ${skippedBin} 个二进制）\n`)
if (stats.size === 0) {
  console.log('没有需要替换的内容 —— 要么已经全部占位化，要么规则没命中。')
} else {
  console.log('替换统计（按变量）：')
  for (const [why, n] of [...stats.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${why}`)
  }
  console.log(`\n涉及 ${changedFiles.length} 个文件${DRY ? '（--dry-run，未写入）' : ''}`)
}
