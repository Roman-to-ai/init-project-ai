---
name: 业务模块总览
type: 业务
---

# 业务模块总览

> 本目录下每一个业务模块一份文档。**改代码前先看这里找模块**。
> 表格由 `scripts/doc-scan.mjs` 生成，不要手改；表外的说明可以随便写。
>
> 新建模块的完整步骤见 `.claude/skills/new-module/SKILL.md`。

<!-- BEGIN GENERATED: scripts/doc-scan.mjs — 勿手改，跑 `node scripts/doc-scan.mjs` 刷新 -->
<!-- generated-at: 2026-09-14T05:34:31.498Z -->

| 模块 | 表 | 模式 | 权限前缀 | 文档 |
|---|---|---|---|---|
| 演示工单 | `biz_demo_order` | 单表 | `biz:demoOrder` | [演示工单](./演示工单.md) |
| 演示产品分类 | `biz_demo_category` | 树表 | `biz:demoCategory` | [演示产品分类](./演示产品分类.md) |
| 演示生产计划 | `biz_demo_plan` | 主子表 | `biz:demoPlan` | [演示生产计划](./演示生产计划.md) |
| 演示产品 | `biz_demo_product` | 单表 | `biz:demoProduct` | [演示产品](./演示产品.md) |
| 演示标签 | `biz_demo_tag` | 单表 | `biz:demoTag` | [演示标签](./演示标签.md) |

> ⚠️ 以下表有 `gen_table` 记录但**没挂菜单**，未生成文档 —— 通常意味着生成到一半，
> 或是测试遗留。确认无用就删掉记录：`delete from gen_table where table_name = '<表名>';`

| 表 | 模块 | 业务名 |
|---|---|---|
<!-- END GENERATED -->

## 文档里哪部分是人写的

每份模块文档分成两半：

- **表格部分**（`<!-- BEGIN GENERATED -->` 块内）—— 脚本从数据库和代码目录抽出来的事实。
  改字段、改菜单、改权限串之后，跑一次 `node scripts/doc-scan.mjs` 就会自动刷新。
  **手工改这里没用，下次跑脚本会被覆盖。**
- **叙述部分**（`业务规则` / `设计取舍` / `⚠️ 坑`）—— 脚本抽不出来的理解，人工维护。
  脚本**永远不会碰**这三节。

> ⚠️ 表格里的字段、菜单、权限串如果和实际代码对不上，说明**有人改了代码但没跑脚本**。
> `node scripts/doc-scan.mjs --check` 会报出来（CI 里也能用，有漂移则 exit 1）。
