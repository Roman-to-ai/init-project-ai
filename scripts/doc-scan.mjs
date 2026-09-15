#!/usr/bin/env node
/**
 * 业务模块文档扫描器 —— 把「一个模块横跨哪些地方」这类**可枚举的事实**从
 * 数据库和代码目录里抽出来，写进 `docs/业务/<模块>.md`。
 *
 * ── 为什么要有这个脚本 ──────────────────────────────────────────
 * 一个业务模块的事实散落在 6 个地方：表注释（information_schema）、生成配置
 * （gen_table / gen_table_column）、菜单与权限串（sys_menu）、字典
 * （sys_dict_type / sys_dict_data）、代码落点（后端 6 个文件 + 前端 3 个）、
 * 建表脚本（sql/）。这些**全都可枚举**，手抄一遍必错，且改一次就过期一次。
 *
 * 所以：脚本负责所有能自动抽取的部分，人（AI）只写它抽不出来的两样东西 ——
 * **业务含义**和**为什么这么设计**。
 *
 * ── 铁律：脚本只碰 GENERATED 标记块 ─────────────────────────────
 * 文档里 `<!-- BEGIN GENERATED -->` 和 `<!-- END GENERATED -->` 之间的内容归脚本，
 * 之外的一字不动。叙述写多少、写什么，脚本永远不管。这样「刷新事实」和
 * 「补充理解」两件事可以各自独立发生 —— 前者能随时重跑，后者不会被覆盖。
 *
 * ── 模块怎么识别 ────────────────────────────────────────────────
 * 以 `gen_table` 为准，不是扫目录 —— 因为「有表但没菜单」和「是别人的子表」
 * 这两种情况只有库知道：
 *   · 表被别的表声明为 `sub_table_name`  → 折叠进主表文档的「子表」一节，不单独成篇
 *   · 没有任何 `sys_menu` 用它       → 不算模块，列进 README 的「未挂菜单」提示
 *   （前者对应主子表的子表，后者通常意味着生成到一半或测试遗留。）
 *
 * 用法：
 *   node scripts/doc-scan.mjs                 生成 / 刷新
 *   node scripts/doc-scan.mjs --check         只读体检：缺文档 / 生成块过期 / 多余的文档 → exit 1
 *   node scripts/doc-scan.mjs --module demoProduct    只处理一个模块
 *   node scripts/doc-scan.mjs --list          只列出识别到的模块，不写文件
 *
 *   --container / --db / --password   覆盖默认连接信息（见下）
 *
 * 查库走 `docker exec` 调 mysql CLI —— 与 CLAUDE.md 和 new-module skill 里的命令
 * 形状一致。**刻意不引 mysql 驱动**：为了一个文档脚本往 package.json 里加依赖不值，
 * 而且那样就得管连接串、密码、环境差异，反而更脆。
 *
 * ⚠️ 下面三个默认值是**模板占位符**，在模板仓库本身里跑不通（容器名还没实例化）。
 *    与 scripts/shot.mjs 的 `--redis-container` 同一套办法：给 CLI 覆盖位。
 *    在占位符已被实例化的项目里，默认值就是真值，直接跑即可。
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs', '业务')

const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)

const MYSQL_CONTAINER = opt('--container', '@@PROJECT_SLUG@@-mysql')
const DB_PASSWORD = opt('--password', '@@DB_PASSWORD@@')
const DB_NAME = opt('--db', '@@DB_NAME@@')

/** 审计列 —— 每张表都有，列进文档只是噪音 */
const AUDIT_COLUMNS = new Set(['del_flag', 'create_by', 'create_time', 'update_by', 'update_time'])

/**
 * 内容类控件 —— 图片、附件、富文本、长文本域。
 * 这些字段**永远不参与筛选**，列进「关键字段」表纯占地方。
 * 但也不能让它们凭空消失，所以从表里拿掉之后，末尾用一行点名交代。
 */
const CONTENT_HTML_TYPES = new Set(['imageUpload', 'fileUpload', 'editor', 'textarea'])

const BEGIN = '<!-- BEGIN GENERATED: scripts/doc-scan.mjs — 勿手改，跑 `node scripts/doc-scan.mjs` 刷新 -->'
const END = '<!-- END GENERATED -->'
const GENERATED_AT = /^<!-- generated-at: .* -->$/m

// ────────────────────────────────────────────────────────────────
// 取数
// ────────────────────────────────────────────────────────────────

/**
 * mysql `--batch` 会把字段里的特殊字符**反斜杠转义**（`\` → `\\`，制表符 → `\t`，
 * 换行 → `\n`）。不还原的话，`validation_rule` 里的正则就被毁掉：
 * 库里存的 JSON 文本是 `{"pattern":"^1[3-9]\\d{9}$"}`，JSON.parse 后应得单反斜杠的
 * `\d`；但 batch 输出会把它变成 4 个反斜杠，parse 完剩 2 个 —— 正则就成了
 * 「一个反斜杠后面跟个 d」，手机号永远校验不过。
 *
 * ⚠️ 必须先按制表符切分、再还原每个字段 —— 反过来，字段内部的 `\t` 会被还原成
 *    真制表符，把一列劈成两列。
 */
const BATCH_ESCAPES = { '\\': '\\', t: '\t', n: '\n', r: '\r', 0: '\0', b: '\b', Z: '\x1a' }
const unescapeBatch = (s) => s.replace(/\\(.)/g, (_, c) => BATCH_ESCAPES[c] ?? c)

/** 跑一条 SQL，返回二维数组（--batch 是制表符分隔，-N 去掉表头） */
function q(sql) {
  let out
  try {
    out = execFileSync(
      'docker',
      ['exec', '-i', MYSQL_CONTAINER, 'mysql', '-uroot', `-p${DB_PASSWORD}`,
       '--default-character-set=utf8mb4', '--batch', '-N', '-e', sql],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (e) {
    const detail = (e.stderr || e.message || '').toString().trim()
    die(
      `连不上数据库（容器 \`${MYSQL_CONTAINER}\`）。\n` +
      `  中间件没起？ → docker compose -f deploy/docker-compose.yml up -d\n` +
      `${detail.split('\n').map((l) => '  ' + l).join('\n')}`,
    )
  }
  return out
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => l.split('\t').map((c) => (c === 'NULL' ? '' : unescapeBatch(c))))
}

function die(msg) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(2)
}

/** 递归找文件，跳过 target/node_modules/dist */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'target' || name === 'node_modules' || name === 'dist' || name === '.git') continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** 相对仓库根的 POSIX 路径，写进文档里可直接点 */
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/')

// ────────────────────────────────────────────────────────────────
// 组装模块模型
// ────────────────────────────────────────────────────────────────

function loadModules() {
  const tables = q(
    `select table_id, table_name, table_comment, class_name, tpl_category,
            module_name, business_name, function_name, sub_table_name, sub_table_fk_name,
            form_col_num
     from \`${DB_NAME}\`.gen_table where gen_type = '0' order by table_id`,
  ).map(([table_id, table_name, table_comment, class_name, tpl_category,
    module_name, business_name, function_name, sub_table_name, sub_table_fk_name, form_col_num]) => ({
    tableId: table_id,
    tableName: table_name,
    tableComment: table_comment,
    className: class_name,
    tplCategory: tpl_category || 'crud',
    moduleName: module_name,
    businessName: business_name,
    functionName: function_name,
    subTableName: sub_table_name,
    subFkName: sub_table_fk_name,
    formColNum: form_col_num,
  }))

  const colsByTable = new Map()
  for (const row of q(
    `select table_id, column_name, column_comment, column_type, is_pk, is_required,
            is_list, is_query, is_common, query_type, html_type, dict_type, validation_rule, sort
     from \`${DB_NAME}\`.gen_table_column order by table_id, sort`,
  )) {
    const [table_id, column_name, column_comment, column_type, is_pk, is_required,
      is_list, is_query, is_common, query_type, html_type, dict_type, validation_rule, sort] = row
    if (!colsByTable.has(table_id)) colsByTable.set(table_id, [])
    colsByTable.get(table_id).push({
      name: column_name,
      comment: column_comment,
      type: column_type,
      isPk: is_pk === '1',
      isRequired: is_required === '1',
      isList: is_list === '1',
      isQuery: is_query === '1',
      isCommon: is_common !== '0', // 默认（空）视为常用 —— 与生成器的向后兼容行为一致
      queryType: query_type || 'EQ',
      htmlType: html_type,
      dictType: dict_type,
      validationRule: validation_rule,
      sort: Number(sort) || 0,
    })
  }

  // 菜单：一个模块 = 一条 C（有 component）+ 若干 F
  const menusByPrefix = new Map()
  for (const [menu_id, menu_name, parent_id, mpath, component, menu_type, perms, order_num] of q(
    `select menu_id, menu_name, parent_id, path, component, menu_type, perms, order_num
     from \`${DB_NAME}\`.sys_menu where perms is not null and perms <> '' order by order_num, menu_id`,
  )) {
    const prefix = perms.split(':').slice(0, 2).join(':')
    if (!menusByPrefix.has(prefix)) menusByPrefix.set(prefix, [])
    menusByPrefix.get(prefix).push({
      id: menu_id, name: menu_name, parentId: parent_id, path: mpath,
      component, type: menu_type, perms, orderNum: Number(order_num) || 0,
    })
  }

  const dicts = new Map()
  for (const [dict_type, dict_name, dict_label, dict_value] of q(
    `select d.dict_type, d.dict_name, a.dict_label, a.dict_value
     from \`${DB_NAME}\`.sys_dict_type d
     join \`${DB_NAME}\`.sys_dict_data a on a.dict_type = d.dict_type
     order by d.dict_type, a.dict_sort`,
  )) {
    if (!dicts.has(dict_type)) dicts.set(dict_type, { name: dict_name, values: [] })
    dicts.get(dict_type).values.push([dict_label, dict_value])
  }

  // SQL 脚本：按「文件里有没有 create table <表名>」和「有没有这个权限前缀」认领
  const sqlFiles = walk(path.join(ROOT, 'backend', 'sql'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({ path: f, text: readFileSync(f, 'utf8') }))

  const subTableOf = new Map()
  for (const t of tables) if (t.subTableName) subTableOf.set(t.subTableName, t)

  const modules = []
  const orphanTables = []
  for (const t of tables) {
    t.columns = colsByTable.get(t.tableId) || []
    if (subTableOf.has(t.tableName)) continue // 子表：折叠进主表，不单独成篇
    const prefix = `${t.moduleName}:${t.businessName}`
    const menus = menusByPrefix.get(prefix) || []
    const main = menus.find((m) => m.type === 'C')
    if (!main) {
      orphanTables.push(t)
      continue
    }
    t.menus = menus
    t.dicts = dicts
    if (t.subTableName) {
      const sub = tables.find((x) => x.tableName === t.subTableName)
      if (sub) {
        sub.columns = colsByTable.get(sub.tableId) || []
        t.subTable = sub
      }
    }
    t.createSql = sqlFiles.find((f) => new RegExp(`create\\s+table\\s+\`?${t.tableName}\`?`, 'i').test(f.text))
    t.menuSql = sqlFiles.find((f) => f.text.includes(`${prefix}:`))
    modules.push(t)
  }
  return { modules, orphanTables }
}

// ────────────────────────────────────────────────────────────────
// 渲染
// ────────────────────────────────────────────────────────────────

const PATTERN = { crud: '单表', tree: '树表', sub: '主子表' }

/** 该模块的 6 个权限串；库里若不全，如实列出手上有的 */
function permsRow(mod) {
  const suffix = [...new Set(mod.menus.map((m) => m.perms.split(':').pop()))]
  const order = ['list', 'query', 'add', 'edit', 'remove', 'export']
  suffix.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return `\`${mod.moduleName}:${mod.businessName}:{${suffix.join(',')}}\``
}

function locate(mod, key) {
  const name = mod.className
  const pats = {
    controller: [`${name}Controller.java`],
    domain: [`${name}.java`],
    service: [`I${name}Service.java`],
    impl: [`${name}ServiceImpl.java`],
    mapper: [`${name}Mapper.java`],
    xml: [`${name}Mapper.xml`],
  }[key]
  const backend = walk(path.join(ROOT, 'backend'))
  const hit = backend.find((f) => pats.some((p) => path.basename(f) === p))
  return hit ? rel(hit) : null
}

function frontendFiles(mod) {
  const base = `frontend/src`
  const candidates = {
    页面: `${base}/views/${mod.moduleName}/${mod.businessName}/index.vue`,
    API: `${base}/api/${mod.moduleName}/${mod.businessName}.ts`,
    类型: `${base}/types/api/${mod.moduleName}/${mod.businessName}.ts`,
  }
  return Object.entries(candidates)
    .filter(([, p]) => existsSync(path.join(ROOT, p)))
    .map(([k, p]) => [k, p])
}

/**
 * 校验规则 JSON → 人话。
 * 返回 null 表示「这条规则里没有值得写进文档的语义」（如 treeselect 的字段名映射），
 * 调用方据此整行跳过 —— 免得文档里出现一行空白格。
 */
function ruleText(json) {
  let r
  try { r = JSON.parse(json) } catch { return `⚠️ 非法 JSON：\`${json}\`` }
  const map = {
    required: '必填',
    maxLength: (v) => `≤${v}字`, minLength: (v) => `≥${v}字`,
    min: (v) => `≥${v}`, max: (v) => `≤${v}`,
    // 整数列会带 precision: 0，写出来是「0位小数」这种废话
    precision: (v) => (Number(v) > 0 ? `${v}位小数` : null),
    pattern: (v) => `正则 \`${v}\``,
    gtField: (v) => `> ${v}`, ltField: (v) => `< ${v}`,
    eqField: (v) => `= ${v}`, neField: (v) => `≠ ${v}`,
    fileSize: (v) => `≤${v}MB`, fileType: (v) => `限 ${v}`, limit: (v) => `最多 ${v} 个`,
    // treeselect 的选项来源 —— 这是配置里唯一有信息量的部分
    treeApi: (v) => `树数据源 \`${v}\``,
    // 选择类控件的选项来源。**把选项列出来**而不是只报个数 ——
    // 读文档的人正想知道「这个字段有哪几个选项」。
    // 超过 6 个就截断，免得一个字段把表格撑爆。
    options: (v) => {
      if (!Array.isArray(v)) return null
      const labels = v.slice(0, 6).map((o) => o?.label).filter(Boolean)
      return `写死选项 ${v.length} 个（${labels.join('、')}${v.length > 6 ? '…' : ''}）`
    },
    optionsApi: (v) => `选项来自接口 \`${v}\``,
    patternMessage: null, // 只是报错文案，不占文档篇幅
    optionLabel: null, optionValue: null, // 接口的字段映射，实现细节
    valueField: null, labelField: null, parentField: null, // 实现细节
  }
  const parts = Object.entries(r)
    .map(([k, v]) => {
      if (!(k in map)) return `${k}=${v}`
      const f = map[k]
      if (f === null) return null
      return typeof f === 'function' ? f(v) : f
    })
    .filter(Boolean)
  return parts.length ? parts.join('、') : null
}

function renderBlock(mod) {
  const L = []
  const push = (...xs) => L.push(...xs)

  // ── 定位 ──
  const main = mod.menus.find((m) => m.type === 'C')
  const pk = mod.columns.find((c) => c.isPk)
  push('## 定位', '')
  push('| | |', '|---|---|')
  push(`| 菜单 | ${main.name}（${main.parentId === '0' ? '顶级 C 菜单' : `挂在 menu_id=${main.parentId} 下`}，\`order_num=${main.orderNum}\`） |`)
  push(`| 表 | \`${mod.tableName}\` — ${mod.tableComment}${pk ? `，主键 \`${pk.name}\`` : ''} |`)
  push(`| 路由 | \`/${mod.moduleName}/${mod.businessName}\` → \`${main.component}\` |`)
  push(`| 权限串 | ${permsRow(mod)} |`)
  push(`| 模式 | **${PATTERN[mod.tplCategory] || mod.tplCategory}**${mod.subTable ? `（子表 \`${mod.subTable.tableName}\`，外键 \`${mod.subFkName}\`）` : ''} |`)
  push('')

  // ── 关键字段 ──
  const all = mod.columns.filter((c) => !AUDIT_COLUMNS.has(c.name))
  const cols = all.filter((c) => !CONTENT_HTML_TYPES.has(c.htmlType))
  const content = all.filter((c) => CONTENT_HTML_TYPES.has(c.htmlType))
  push('## 关键字段', '')
  push('> 审计列（del_flag / create_* / update_*）已略去。`*` = 必填。', '')
  push('| 字段 | 类型 | 含义 | 控件 | 字典 | 查询 |', '|---|---|---|---|---|---|')
  for (const c of cols) {
    const q_ = c.isQuery ? `${c.queryType} · ${c.isCommon ? '常用' : '**收起**'}` : ''
    push(`| \`${c.name}\`${c.isRequired ? ' \\*' : ''} | ${c.type} | ${c.comment} | \`${c.htmlType}\` | ${c.dictType ? `\`${c.dictType}\`` : ''} | ${q_} |`)
  }
  push('')
  if (content.length) {
    push(`> 另有 ${content.length} 个内容字段不参与筛选：${content.map((c) => `\`${c.name}\``).join('、')}。`, '')
  }

  const ruled = all
    .map((c) => [c, c.validationRule ? ruleText(c.validationRule) : null])
    .filter(([, t]) => t)
  if (ruled.length) {
    push('### 校验规则', '', '> 来源 `gen_table_column.validation_rule`，**前后端共用这一份**。', '')
    push('| 字段 | 规则 |', '|---|---|')
    for (const [c, t] of ruled) push(`| \`${c.name}\` | ${t} |`)
    push('')
  }

  // ── 子表 ──
  if (mod.subTable) {
    const sub = mod.subTable
    const subAll = sub.columns.filter((c) => !AUDIT_COLUMNS.has(c.name))
    const subCols = subAll.filter((c) => !CONTENT_HTML_TYPES.has(c.htmlType))
    push(`## 子表 \`${sub.tableName}\``, '')
    push(`> ${sub.tableComment}。**没有独立菜单和权限串** —— 明细随主表一起提交，`)
    push(`> 页面上是新增/修改弹窗里的内嵌子表格。`, '')
    push('| 字段 | 类型 | 含义 | 控件 | 字典 |', '|---|---|---|---|---|')
    for (const c of subCols) {
      push(`| \`${c.name}\`${c.isRequired ? ' \\*' : ''} | ${c.type} | ${c.comment} | \`${c.htmlType}\` | ${c.dictType ? `\`${c.dictType}\`` : ''} |`)
    }
    push('')
    const subContent = subAll.filter((c) => CONTENT_HTML_TYPES.has(c.htmlType))
    if (subContent.length) {
      push(`> 另有 ${subContent.length} 个内容字段不参与筛选：${subContent.map((c) => `\`${c.name}\``).join('、')}。`, '')
    }
  }

  // ── 字典 ──
  const usedDicts = [...new Set([...mod.columns, ...(mod.subTable?.columns || [])]
    .map((c) => c.dictType).filter(Boolean))]
  if (usedDicts.length) {
    push('## 字典', '')
    push('| dict_type | 名称 | 取值 |', '|---|---|---|')
    for (const dt of usedDicts) {
      const d = mod.dicts.get(dt)
      if (!d) { push(`| \`${dt}\` | ⚠️ **库里没有这个字典** | |`); continue }
      push(`| \`${dt}\` | ${d.name} | ${d.values.map(([l, v]) => `${l}=${v}`).join(' / ')} |`)
    }
    push('')
  }

  // ── 代码落点 ──
  push('## 代码落点', '')
  const backendRows = [
    ['Controller', locate(mod, 'controller')], ['Domain', locate(mod, 'domain')],
    ['Service', locate(mod, 'service')], ['ServiceImpl', locate(mod, 'impl')],
    ['Mapper 接口', locate(mod, 'mapper')], ['Mapper XML', locate(mod, 'xml')],
  ].filter(([, p]) => p)
  push('**后端**', '', '| 层 | 文件 |', '|---|---|')
  for (const [k, p] of backendRows) push(`| ${k} | \`${p}\` |`)
  if (backendRows.length < 6) {
    push('', `> ⚠️ 只找到 ${backendRows.length}/6 个后端文件 —— 可能还没落地，或类名与 \`gen_table.class_name\` 不一致。`)
  }
  push('')

  const fe = frontendFiles(mod)
  push('**前端**', '', '| | 文件 |', '|---|---|')
  for (const [k, p] of fe) push(`| ${k} | \`${p}\` |`)
  const barrel = 'frontend/src/types/api/index.ts'
  if (existsSync(path.join(ROOT, barrel))) {
    const line = `export * from "./${mod.moduleName}/${mod.businessName}"`
    const has = readFileSync(path.join(ROOT, barrel), 'utf8').includes(line)
    push('', has
      ? `类型 barrel \`src/types/api/index.ts\` 已导出 ✅`
      : `> ⚠️ 类型 barrel \`src/types/api/index.ts\` **缺** \`${line}\` —— 补上，否则页面 import 类型会报错。`)
  }
  push('')

  // ── 重建顺序 ──
  push('## 重建顺序', '')
  let step = 1
  push(`${step++}. 建表 + 字典：${mod.createSql ? `\`${rel(mod.createSql.path)}\`` : '⚠️ **没找到含该表建表语句的 SQL 脚本**'}`)
  push(`${step++}. 菜单 + 权限：${mod.menuSql ? `\`${rel(mod.menuSql.path)}\`` : '⚠️ **没找到含该权限前缀的 SQL 脚本**'}`)
  push(`${step++}. \`mvn -f backend/pom.xml clean install -DskipTests\` 并重启后端`)
  push(`${step++}. **重新登录** —— 菜单与权限是登录时缓存进 Redis 的，不重登看不到变化`)
  push('')

  return L.slice(0, -1).join('\n') // 去掉末尾空行
}

/** 整份文档：叙述部分由人写，脚本只在首次生成时铺好架子 */
function renderNewDoc(mod, block) {
  const tpl = `---
name: ${mod.functionName}
type: 业务
table: ${mod.tableName}
module: ${mod.moduleName}
business: ${mod.businessName}
perms: ${mod.moduleName}:${mod.businessName}
pattern: ${PATTERN[mod.tplCategory] || mod.tplCategory}
updated: ${today()}
---

# ${mod.functionName}

> 一句话：这张表在业务上干什么、谁在用、什么场景下会操作它。
> **（待补 —— 这是脚本抽不出来的部分）**

${BEGIN}
${block}
${END}

## 业务规则

> **（待补）** 字段之间的联动、隐含约束、状态流转、谁有权改什么。
> 只写**读代码看不出来**的；能从上面表格读到的不要重复。

- 待补。

## 设计取舍

> **（待补）** 这个模块里非显然的选择，以及为什么。
> 若是照着生成器默认产物做的、没什么特别的，写一句「无，标准生成产物」即可 ——
> **明确说「没有」比留空有用**，读的人才知道不是忘了写。

- 待补。

## ⚠️ 坑

> **（待补）** 这个模块**特有**的坑。通用坑（生成器、主题、构建）别往这儿塞，
> 写进 \`docs/生成器/\` 或 \`docs/基建/\` 对应那篇。

- 待补。
`
  return tpl
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * 生成块的内容**不含** BEGIN/END 标记 —— 标记由 `splice()` 统一补。
 * （踩过：这里曾经自带标记，而 splice 又补一次，于是每跑一次脚本
 *   标记就多一对，文档越滚越长，且永远判「过期」。）
 */
const blockOf = (body) => `<!-- generated-at: ${stamp} -->\n\n${body}`

/** 把已有的叙述保住，只换生成块 */
function splice(doc, block, mod) {
  const b = doc.indexOf(BEGIN)
  const e = doc.indexOf(END)
  if (b === -1 || e === -1) {
    die(
      `docs/业务/${mod.functionName}.md 里找不到 GENERATED 标记块。\n` +
      `  要么手工删了标记，要么这份文档不是脚本生成的。\n` +
      `  想重来：删掉该文件再跑一次 \`node scripts/doc-scan.mjs\`（叙述会丢，先备份）。`,
    )
  }
  return doc.slice(0, b + BEGIN.length) + '\n' + block + '\n' + doc.slice(e)
}

// ────────────────────────────────────────────────────────────────
// 主流程
// ────────────────────────────────────────────────────────────────

const CHECK = argv.includes('--check')
const LIST = argv.includes('--list')
const only = opt('--module', null)

const stamp = new Date().toISOString()
const { modules, orphanTables } = loadModules()
const picked = only ? modules.filter((m) => m.businessName === only) : modules
if (only && !picked.length) die(`没有 business_name 为 \`${only}\` 的模块。用 --list 看有哪些。`)

if (LIST) {
  console.log(`\n识别到 ${modules.length} 个模块：`)
  for (const m of modules) console.log(`  ${m.functionName.padEnd(14, '　')} ${m.tableName}  [${PATTERN[m.tplCategory] || m.tplCategory}]`)
  if (orphanTables.length) {
    console.log(`\n有 gen_table 记录但没挂菜单（${orphanTables.length} 张，不生成文档）：`)
    for (const t of orphanTables) console.log(`  ${t.tableName}  (${t.moduleName}:${t.businessName})`)
  }
  console.log()
  process.exit(0)
}

mkdirSync(DOCS, { recursive: true })

const problems = []
const written = []

for (const mod of picked) {
  const file = path.join(DOCS, `${mod.functionName}.md`)
  const block = blockOf(renderBlock(mod))
  if (!existsSync(file)) {
    if (CHECK) { problems.push(`缺文档：docs/业务/${mod.functionName}.md`); continue }
    writeFileSync(file, renderNewDoc(mod, block), 'utf8')
    written.push(`+ docs/业务/${mod.functionName}.md`)
  } else {
    const cur = readFileSync(file, 'utf8')
    const next = splice(cur, block, mod)
    // generated-at 每次都变，比对时剔掉，否则永远判「过期」
    const strip = (s) => s.replace(GENERATED_AT, '')
    if (strip(cur) === strip(next)) continue
    if (CHECK) { problems.push(`生成块过期：docs/业务/${mod.functionName}.md`); continue }
    writeFileSync(file, next, 'utf8')
    written.push(`~ docs/业务/${mod.functionName}.md`)
  }
}

// ── docs/业务/README.md 的总览表 ──
const readme = path.join(DOCS, 'README.md')
const rows = [
  '| 模块 | 表 | 模式 | 权限前缀 | 文档 |',
  '|---|---|---|---|---|',
  ...modules.map((m) => {
    const f = `${m.functionName}.md`
    // 链接目标保留原始中文：URL 编码后既不可读也没法 grep，
    // 而 markdown 渲染器和编辑器都吃原始 Unicode 路径
    return `| ${m.functionName} | \`${m.tableName}\` | ${PATTERN[m.tplCategory] || m.tplCategory} | \`${m.moduleName}:${m.businessName}\` | [${m.functionName}](./${f}) |`
  }),
]
if (orphanTables.length) {
  rows.push('', `> ⚠️ 以下表有 \`gen_table\` 记录但**没挂菜单**，未生成文档 —— 通常意味着生成到一半，`,
    `> 或是测试遗留。确认无用就删掉记录：\`delete from gen_table where table_name = '<表名>';\``, '',
    '| 表 | 模块 | 业务名 |', '|---|---|---|',
    ...orphanTables.map((t) => `| \`${t.tableName}\` | ${t.moduleName} | ${t.businessName} |`))
}
const readmeBlock = blockOf(rows.join('\n'))

if (existsSync(readme)) {
  const cur = readFileSync(readme, 'utf8')
  const next = splice(cur, readmeBlock, { functionName: 'README' })
  const strip = (s) => s.replace(GENERATED_AT, '')
  if (strip(cur) !== strip(next)) {
    if (CHECK) problems.push('生成块过期：docs/业务/README.md')
    else { writeFileSync(readme, next, 'utf8'); written.push('~ docs/业务/README.md') }
  }
} else if (!CHECK) {
  writeFileSync(readme, `---
name: 业务模块总览
type: 业务
---

# 业务模块总览

> 本目录下每一个业务模块一份文档。**改代码前先看这里找模块**。
> 表格由 \`scripts/doc-scan.mjs\` 生成，不要手改；表外的说明可以随便写。
>
> 新建模块的完整步骤见 \`.claude/skills/new-module/SKILL.md\`。

${BEGIN}
${readmeBlock}
${END}

## 文档里哪部分是人写的

每份模块文档分成两半：

- **表格部分**（\`<!-- BEGIN GENERATED -->\` 块内）—— 脚本从数据库和代码目录抽出来的事实。
  改字段、改菜单、改权限串之后，跑一次 \`node scripts/doc-scan.mjs\` 就会自动刷新。
  **手工改这里没用，下次跑脚本会被覆盖。**
- **叙述部分**（\`业务规则\` / \`设计取舍\` / \`⚠️ 坑\`）—— 脚本抽不出来的理解，人工维护。
  脚本**永远不会碰**这三节。

> ⚠️ 表格里的字段、菜单、权限串如果和实际代码对不上，说明**有人改了代码但没跑脚本**。
> \`node scripts/doc-scan.mjs --check\` 会报出来（CI 里也能用，有漂移则 exit 1）。
`, 'utf8')
  written.push('+ docs/业务/README.md')
}

// ── 孤儿文档：文档还在，但对应的模块已经没了 ────────────────────
//
// 脚本**只按数据库里的模块迭代**，从来不回头看 `docs/业务/` 里有没有多余的文档。
// 于是「模块被去掉、文档留下」这种情况无人处理。实测复现过：
//   给表建个菜单 → 跑脚本 → 有文档；再删掉菜单 → 跑脚本 → **文档还在**；
//   而且 `--check` 报「全部一致」、exit 0 —— **完全发现不了**。
//
// 这类文档描述的是一批**不存在的文件**，比缺文档更容易误导（照着找必扑空）。
// **只报告，不自动删** —— 删除是人的决定。
const knownDocs = new Set(modules.map((m) => `${m.functionName}.md`))
const orphanDocs = existsSync(DOCS)
  ? readdirSync(DOCS)
      .filter((f) => f.endsWith('.md') && f !== 'README.md' && !knownDocs.has(f))
      .sort()
  : []

// ── 收尾 ──
if (CHECK) {
  for (const f of orphanDocs) problems.push(`多余的文档（模块已不存在）：docs/业务/${f}`)
  if (problems.length) {
    console.error(`\n✗ 文档与代码/数据库不一致（${problems.length} 处）：`)
    for (const p of problems) console.error(`  · ${p}`)
    console.error(`\n  跑 \`node scripts/doc-scan.mjs\` 刷新。\n`)
    console.error(`  「多余的文档」不会被自动删除 —— 确认那个模块确实没了，再手工删。\n`)
    process.exit(1)
  }
  console.log(`\n✓ ${modules.length} 个模块的文档都与代码/数据库一致。\n`)
} else {
  if (written.length) console.log(`已更新：\n  ${written.join('\n  ')}\n`)
  else console.log('没有变化。')
  if (orphanTables.length) {
    console.log(`\n⚠️ ${orphanTables.length} 张表有 gen_table 记录但没挂菜单（见 docs/业务/README.md）。`)
  }
  if (orphanDocs.length) {
    console.log(`\n⚠️ ${orphanDocs.length} 份文档对应的模块已经不存在了（**不自动删**，确认后手工删）：`)
    for (const f of orphanDocs) console.log(`    docs/业务/${f}`)
  }
}
