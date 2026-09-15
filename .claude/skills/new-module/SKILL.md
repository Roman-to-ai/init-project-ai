---
name: new-module
description: 在本项目里新增业务模块——用代码生成器产出前后端 CRUD 代码 + 菜单权限 SQL。当用户说"加一个模块"、"新增管理页面"、"给某张表做增删改查"、"生成代码"、"导入表"时使用。
---

# 新增业务模块

框架**自带代码生成器**，产出的是 Vue3 + `<script lang="ts">`。
**优先走生成器，不要手写 CRUD** —— 手写必漏菜单权限、字典、分页这些配套设施。

> **前置：表设计不属于这个 skill。** 如果建表 SQL 还没写，先跑 `/design-schema`
> —— 表形态、字段控件、校验规则、查询条件分组都在那边定完，产物直接喂给这里。

## 零、代码放哪个包（已定，不用再纠结）

生成器的 `packageName` 默认就是项目业务包（`<包根>.biz`），
生成物直接落进业务模块 —— 那是本项目预置好的，**生成器里什么都不用改**。

> ⚠️ 框架自带的 `system` 模块（`Sys*` 那一堆）**不要放业务代码**：
> 将来升级框架要逐个分辨，后期想搬出来成本很高。

## 一、走生成器

界面：**系统工具 → 代码生成 → 导入表** → 选中建好的表 → 确定。

> 本项目**只有一套模板**（Vue3 + Element Plus + TypeScript），没有"选前端类型"这回事。
> 但**仍然要走界面导入** —— 用 SQL 直接往 `gen_table` 插记录会漏掉列信息的初始化。

导入后点 **编辑**，确认这几项：

- **生成包路径** `packageName` — 默认已是业务包，不用改
- **生成模块名** `moduleName` — 如 `biz`
- **生成业务名** `businessName` — 如 `workOrder`，决定前端目录名和 API 文件名
- **生成功能名** `functionName` — 如 `生产工单`，进菜单
- **上级菜单** `parentMenuId` — ⚠️ **别用默认值**，见下

> ⚠️ **默认的上级菜单是「系统工具」，业务模块不该挂在那儿。**
> 模板只有三个顶级目录（系统管理 / 系统监控 / 系统工具），**没有业务父菜单**，
> 所以默认值落不到对的地方（实测：不设置的话菜单会挂到 `/tool/xxx` 下面）。
>
> **先建一个「业务管理」目录**（`menu_type='M'`，`parent_id=0`），再把业务菜单挂在它下面
> —— 层次清楚，也避开 `docs/基建/框架分层与权限约定.md` 里那个「顶级菜单会多一层无名包装」的坑。
>
> 生成器界面上的「上级菜单」是要**手工选**的，别跳过。
- **扩展功能** — 「生成详情页」/「逻辑删除」，按需要勾
  （逻辑删除见 `docs/生成器/模板增强清单.md`）

然后 **生成代码**，会下载一个 zip。

### 查询条件分组

导入后按业务重要性改 `is_common`，让默认显示的条件恰好占满一行（约 3 个），
次要的收进「展开查看更多」。

**判断原则和 SQL 见 `docs/生成器/查询条件常用非常用.md`。**
（`design-schema` 那一步如果已经定好了分组，照它填即可。）

## 二、落地文件

zip 内路径 → 项目目标位置：

| zip 内 | 放到 |
|---|---|
| `main/java/<packageName>/domain/Xxx.java` | 业务模块 `src/main/java/<包根>/biz/domain/` |
| `.../mapper/XxxMapper.java` | 同模块 `.../biz/mapper/` |
| `.../service/IXxxService.java` | 同模块 `.../biz/service/` |
| `.../service/impl/XxxServiceImpl.java` | 同模块 `.../biz/service/impl/` |
| `.../controller/XxxController.java` | 同模块 `.../biz/controller/` |
| `main/resources/mapper/<moduleName>/XxxMapper.xml` | 业务模块 `src/main/resources/mapper/<moduleName>/` |
| `vue/api/<moduleName>/<businessName>.ts` | `frontend/src/api/<moduleName>/` |
| `vue/types/api/<moduleName>/<businessName>.ts` | `frontend/src/types/api/<moduleName>/` |
| `vue/views/<moduleName>/<businessName>/index.vue` | `frontend/src/views/<moduleName>/<businessName>/` |
| `<businessName>Menu.sql` | 见下一步 |
| ⚠️ `vue/types/api/index-bak.ts` | **不要整个覆盖**，见下 |

### 最容易漏的一步：合并 index-bak.ts

`src/types/api/index.ts` 是**统一导出文件**（barrel），生成器吐的是 `index-bak.ts`，
意思是「给你参考，自己合并进去」。把新模块那行加进 `src/types/api/index.ts`：

```ts
// biz 模块
export * from "./biz/workOrder";
```

**漏了这步，TS 类型不会被导出，页面里 import 类型会报错。**

## 三、导菜单 SQL

```bash
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    --default-character-set=utf8mb4 <DB_NAME> < workOrderMenu.sql
```

它插入 1 条菜单（`menu_type='C'`）+ 5 条按钮权限（`query`/`add`/`edit`/`remove`/`export`）。
**权限串必须和后端 Controller 上的 `@PreAuthorize` 完全一致**，否则按钮不显示或 403。

> ⚠️ 生成的菜单 SQL **不含角色授权行**（`sys_role_menu`）。`admin` 不受影响，
> 但**其他角色看不到新菜单**，要自己补。

## 四、重新打包并验证

```bash
mvn -f backend/pom.xml clean install -DskipTests
# 重启后端 jar
```

前端 Vite 热更新，一般不用重启。**必须重新登录** —— 菜单和权限是登录时缓存进 Redis 的，
不重登看不到新菜单。登进去看新菜单在不在。

然后跑门禁并建模块文档：

```bash
node scripts/typecheck.mjs --update     # 生成物每个模块约带 22 个类型错误，收进基线
node scripts/lint-ratchet.mjs --update  # lint 同理
node scripts/doc-scan.mjs               # 生成 docs/业务/<模块名>.md 骨架
```

**脚本抽不出来的三节（`业务规则` / `设计取舍` / `⚠️ 坑`）由你补** ——
见 `.claude/skills/update-docs/SKILL.md`。

想要功能验证（登录 → 列表 → 增删改查 → 权限）而不只是"点一遍"，跑 `/verify-module`。

## 排查

- **菜单不显示** → **重新登录**；再不行查 `sys_menu` 里 `perms` 和 Controller 的 `@PreAuthorize` 对不对得上
- **生成的页面字段名是英文** → 建表时字段注释漏了，补注释后**重新导表生成**
- **某个筛选条件没生成** → 多半是 `dictType` 为空或 `htmlType` 拼错，
  见 `docs/生成器/模板增强清单.md`（字段会**静默消失**的三种成因）
- **重复生成没覆盖旧文件** → `generator.yml` 的 `allowOverwrite` 默认 `false`，
  且生成器本就是「下载 zip 手工覆盖」模式，不会自动写进项目
- **页面 import 类型报错** → `src/types/api/index.ts` 的 barrel 没合并（见 §二）

## 汇报

```
模块：<功能名>（<表名>）
模式：单表 / 树表 / 主子表
权限串：<module>:<business>:{...}
落地：后端 N 个文件、前端 3 个文件、barrel 已合并、菜单 M 条
门禁：typecheck --update ✅ / lint-ratchet --update ✅
文档：docs/业务/<模块名>.md（叙述三节已补 / 待补）
验证：菜单可见 ✅ 列表 ✅ 新增 ✅ 修改 ✅ 删除 ✅（未验的明确说没验）
遗留：<没做完的、拿不准的，直说>
```
