---
name: db-manage
description: 数据库操作——查数据、建表改表、备份恢复、维护 sql/ 脚本。当用户说"查一下这张表"、"建表"、"加个字段"、"改表结构"、"备份数据库"、"恢复数据"、"sql 脚本放哪"时使用。
---

# 数据库管理

## ⚠️ 铁律：写操作必须先说清楚再做

这个 skill 覆盖**只读**和**写**两类操作，**风险完全不同**：

| 类别 | 例子 | 规矩 |
|---|---|---|
| **只读** | `select` / `show` / `desc` | 直接用 `scripts/db-query.mjs`，不等确认 |
| **写** | `create` / `alter` / `drop` / `delete` / `update` | ⚠️ **先说清改什么、影响谁、能不能回滚，等人确认** |

**永远不要在没备份的情况下改结构**，也**永远不要 `drop` 一张你叫不出业务含义的表**。

---

## 一、查数据 —— 只用 `db-query.mjs`

```bash
node scripts/db-query.mjs "select * from sys_user limit 5"
node scripts/db-query.mjs --table "show tables"
echo "desc sys_order" | node scripts/db-query.mjs
```

**别用 `docker exec ... mysql -e "..."`。** 那个每次都要确认，而 `db-query.mjs` 已经在
`permissions.allow` 里 —— 它只放行 `select` / `show` / `desc` / `explain`，
挡掉多语句（`select 1; drop table x`）、注释藏写操作（`/*x*/delete`）、
以及 `into outfile` / `load_file` / `for update` 这类"看着是读其实是写"的。

> 参见 `AI工程化需求.txt` §3.10、§3.15：**用能力换权限** ——
> 与其放宽 `docker exec` 的前缀匹配，不如造一个只读的封装。

---

## 二、`sql/` 脚本的三个约定

`backend/sql/` 下的文件分三类，**用途不同，别放错**：

| 前缀 | 用途 | 能不能改 |
|---|---|---|
| `ry_<日期>.sql` / `quartz.sql` | **基线种子** —— 全新环境的起点 | ❌ **不要改**。改了，已存在的库和新建的库就对不上了 |
| `<模块>.sql` / `<模块>_<业务>_menu.sql` | 新模块的建表与菜单 | ✅ 新模块就新建一份 |
| **`upgrade_<日期>_<描述>.sql`** | **改已有结构** | ✅ **改结构一律走这个** |

### ⚠️ 改结构不要动基线种子

加一个字段就改 `ry_20260417.sql`，会导致：**已经跑起来的库不会变**（它早就导过了），
只有全新环境才有那个字段 —— 两边的结构从此分叉，且**没有任何机制能发现**。

正确做法是新建一份升级脚本：

```
backend/sql/upgrade_20260915_add_order_status.sql
```

命名沿用已有的三个例子（`upgrade_20260913_gen_column_is_common.sql` 等）：
**日期用下划线分隔、描述用下划线连接、说清楚改了什么**。

脚本里写清楚：这段 SQL 对**已有的**库做什么。**要能重复执行不报错**（用 `if not exists` 之类）。

### 建表脚本的形状

照 `biz_demo.sql` 抄：
- 文件头一段注释说明**用途、删除步骤**
- `drop table if exists` 开头（可重复执行）
- **表和每个字段的 `comment` 必须有** —— 生成器拿它当 label，漏了页面全是英文变量名

---

## 三、备份与恢复

**改结构之前先备份**，这是最低成本的保险：

```bash
# 备份整库
docker exec -i <PROJECT_SLUG>-mysql mysqldump -uroot -p<DB_PASSWORD> \
    --default-character-set=utf8mb4 <DB_NAME> > backup_<日期>.sql

# 备份单表
docker exec -i <PROJECT_SLUG>-mysql mysqldump -uroot -p<DB_PASSWORD> <DB_NAME> sys_menu \
    > sys_menu_<日期>.sql
```

**恢复**（⚠️ 会覆盖现有数据，先确认）：

```bash
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    --default-character-set=utf8mb4 <DB_NAME> < backup_<日期>.sql
```

> 备份文件**别提交进版本库** —— 里面可能含真实数据。
> 放仓库外，或确认 `.gitignore` 覆盖了。

---

## 四、导 SQL 的常规姿势

```bash
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    --default-character-set=utf8mb4 <DB_NAME> < 脚本.sql
```

⚠️ **`sql/` 下的脚本不含建库语句**，全新环境要先建库：

```bash
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    -e "create database \`<DB_NAME>\` default character set utf8mb4"
```

⚠️ **库名带横线时，SQL 里要用反引号包起来**（这条踩过，见 `docs/基建/数据库.md`）。

---

## 排查

- **连错库了** → 确认端口是 `3307` 不是 `3306`。开发机上常有别的项目占着 3306
- **导 SQL 报语法错** → 库名带横线，要用反引号
- **改了种子脚本但库没变** → 库早就导过了。种子只在全新环境生效，改结构要走 `upgrade_*.sql`
- **`db-query` 拒绝了你的查询** → 它只收只读语句。写操作请走 DDL 流程（先说清楚再确认）
- **`Unknown database`** → 还没建库，`sql/` 脚本不含建库语句
- **改了表结构但页面不对** → 生成器那边的 `gen_table_column` 也要跟着更新，重新导表生成

## 汇报

```
操作：只读查询 / 建表 / 改结构 / 备份 / 恢复
库表：<库名>.<表名>
脚本：<新建了哪个 sql/ 下的文件；改结构的话说明为什么没动基线种子>
备份：<改结构前是否备份、备份文件在哪>
影响面：<哪些模块/页面受影响>
验证：<查过数据确认了吗；没验的明说>
遗留：<拿不准的>
```

**写操作没跑过就不要说"改好了"。** 报"已备份 + SQL 已写 + 未执行"也是合格结论 —— 比假通过好得多。
