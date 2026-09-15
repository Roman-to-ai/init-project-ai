# @@MAVEN_ARTIFACT_PREFIX@@-biz —— 业务模块

新业务代码统一放这里，**不要散在 `@@MAVEN_ARTIFACT_PREFIX@@-system` 里**。

## 演示模块一览（都可整份删除）

本模块预置了一组演示，用来**展示生成器能产出什么**。启动后侧边栏能看到四个顶级菜单：

| 菜单 | 表 | 模板模式 | 展示什么 |
|---|---|---|---|
| 演示工单 | `biz_demo_order` | 单表 | 基础 CRUD、**`is_common` 查询条件折叠**、字典、日期区间 |
| 演示产品 | `biz_demo_product` | 单表 | **字段类型大全**：26 个字段，11 种控件全用上 |
| 演示产品分类 | `biz_demo_category` | **树表** | 树形表格、展开/折叠、行内新增子节点、树形选择器 |
| 演示生产计划 | `biz_demo_plan` + `_item` | **主子表** | 一对多：新增/修改页里带可增删的明细子表格 |

演示产品的字段按控件类型分组（表单设成 **3 列布局**，一屏看得全）：

| 控件 | 字段 |
|---|---|
| 文本框 ×9 | 产品编码 / 产品名称 / 规格型号 / 条形码 / 供应商 / 单价 / 库存数量 |
| 下拉框 ×4 | 产品类型 / 产品等级 / 计量单位 / 产地 |
| 单选框 ×2 | 产品状态 / 是否危险品 |
| 复选框 ×2 | 产品标签 / 适用场景（多选） |
| 日期 ×2 | 生产日期 / 上市日期 |
| **时间 ×1** | 每日盘点时间 |
| 日期时间 ×2 | 入库时间 / 过期时间 |
| 图片上传 ×1 | 产品主图 |
| 文件上传 ×2 | 规格书 / 质检报告 |
| 富文本 ×1 | 产品描述 |
| 文本域 ×2 | 使用说明 / 备注 |

> 若要自己加：`date` / `time` / `datetime` 三种选择器是**本项目给生成器模板补的**
> （上游原版只有 `datetime`，且它渲染出来是个纯日期选择器，名字名不副实）。
> 见 `@@MAVEN_ARTIFACT_PREFIX@@-generator/src/main/resources/vm/vue/v3ts/index.vue.vm`。
> **改模板必须 `mvn clean install` 再重启** —— 模板是打在 jar 里的资源。

对照看点：
- **演示工单**的搜索栏：3 个常用条件占满一行，2 个收进「展开查看更多」
- **演示产品**的每一列几乎都是一种控件，且字典字段在列表里渲染成彩色标签
- **演示产品分类**的左侧箭头可逐级展开，状态是带颜色的标签
- **演示生产计划的「新增」**：主表字段在上，「明细信息」子表格在下，可点「添加」加行

> 演示表的建表与字典在 `sql/biz_demo.sql`（工单）和 `sql/biz_demo_showcase.sql`（其余三个）。
> 各表的菜单 SQL 在 `sql/biz_demo_*_menu.sql`。

## 为什么单独一个模块

`@@MAVEN_ARTIFACT_PREFIX@@-system` 是框架的框架模块（`Sys*` 那一堆），把它当业务目录用会有两个后果：
一是业务代码和框架代码混在一起，将来升级框架要逐个分辨；二是早期图省事放进去，
后期想搬出来成本很高（包名、Mapper 命名空间、前端路径都要跟着动）。

本模块已预置好，所以「代码放哪个包」不再是每次新建模块时都要重新纠结的决策。

## 为什么只依赖 @@MAVEN_ARTIFACT_PREFIX@@-common

照抄 `@@MAVEN_ARTIFACT_PREFIX@@-generator` 的既有做法——它自带 `GenController`（Controller 就在模块内），
依赖也只有 `common + velocity + druid`。生成的 Controller 模板
（`vm/java/controller.java.vm`）import 的集合与之完全一致，全部在模块内。

**刻意不加 `@@MAVEN_ARTIFACT_PREFIX@@-framework`**：用不上，还会把 druid / kaptcha / oshi 一起拖进来。

## 生成器已经指向这里

`@@MAVEN_ARTIFACT_PREFIX@@-generator/src/main/resources/generator.yml` 的 `packageName` 默认就是
`@@JAVA_PACKAGE_ROOT@@.biz`，所以在生成器里**什么都不用改**，生成的 CRUD 直接落进本模块。

> 改 `generator.yml` 属于改后端资源，**必须 `mvn clean install` 再重启 jar 才生效**。

## 接线（新建模块时只需两处）

> **前提**：新模块的**包根必须在 `@@JAVA_PACKAGE_ROOT@@` 之下** —— 下面三个自动机制都靠它。
> 放别的包根（如 `io.acme.foo`）就要另配扫描。
>
> **若模块自带第三方依赖**（如 `@@MAVEN_ARTIFACT_PREFIX@@-storage-minio` 用了 MinIO SDK），
> 还要在根 `pom.xml` 的 `<properties>` + `<dependencyManagement>` 里声明它的版本。
> 顺带别忘在 `scripts/templatize.mjs` 的模块前缀数组里加一项。

1. 根 `pom.xml`：`<dependencyManagement>` 加一条 + `<modules>` 加一行
2. `@@MAVEN_ARTIFACT_PREFIX@@-admin/pom.xml`：加 `<dependency>`

以下三处**都不用改**，因为 `@@APP_CLASS@@` 在 `@@JAVA_PACKAGE_ROOT@@` 包下：

| 机制 | 现有配置 | 是否覆盖 `@@JAVA_PACKAGE_ROOT@@.biz` |
|---|---|---|
| 组件扫描 | `@SpringBootApplication` 在 `@@JAVA_PACKAGE_ROOT@@` | ✅ 天然覆盖 |
| Mapper 扫描 | `@MapperScan("@@JAVA_PACKAGE_ROOT@@.**.mapper")` | ✅ 通配符 |
| 类型别名 | `mybatis.typeAliasesPackage: @@JAVA_PACKAGE_ROOT@@.**.domain` | ✅ 通配符 |

---

# 删除示例（demoOrder）

`demo/` 目录下是**可整份删除**的演示，占位证明三条链是通的：

1. 代码生成器 → 本模块 → 前端
2. `is_common`（查询条件常用/非常用）折叠
3. 字典 + `status` 类字段的正确配法

## 删除步骤

```bash
cd <仓库根>

# 1. 后端生成物
rm -rf backend/@@MAVEN_ARTIFACT_PREFIX@@-biz/src/main/java/@@JAVA_PACKAGE_ROOT@@/biz/demo
rm -f  backend/@@MAVEN_ARTIFACT_PREFIX@@-biz/src/main/resources/mapper/biz/BizDemoOrderMapper.xml

# 2. 前端生成物
rm -rf frontend/src/views/biz/demoOrder
rm -f  frontend/src/api/biz/demoOrder.ts
rm -f  frontend/src/types/api/biz/demoOrder.ts

# 3. 去掉 barrel 导出行（src/types/api/index.ts 里 "// biz 模块" 那两行）
#    手工编辑：删掉 export * from "./biz/demoOrder";

# 4. 数据库：表 + 字典 + 菜单
docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ -e "
drop table if exists biz_demo_order;
delete from sys_dict_data where dict_type = 'biz_order_status';
delete from sys_dict_type where dict_type = 'biz_order_status';
delete from sys_role_menu where menu_id in (select menu_id from sys_menu where perms like 'biz:demoOrder:%');
delete from sys_menu where perms like 'biz:demoOrder:%';
delete from sys_menu where menu_name = '演示工单' and path = 'demoOrder';
"

# 5. 删掉 SQL 文件
rm -f backend/sql/biz_demo.sql backend/sql/biz_demo_menu.sql

# 6. 重新打包并重启（删了 Java 文件必须重打包）
mvn -f backend/pom.xml clean install -DskipTests
```

**记得重新登录** —— 菜单和权限是登录时缓存进 Redis 的，不重登看不到菜单变化。

## 演示里刻意踩到并处理了的坑

- **列名以 `status` 结尾会被自动设成 `radio`**，而模板的 radio/select 分支依赖
  `dictType`；`dictType` 为空时生成的 `el-form-item` **整个消失**，一个查询条件
  就这么静默丢了。所以 `biz_demo.sql` 里配了 `biz_order_status` 字典。
- **`is_common` 不是在生成器界面上点的**（虽然现在也支持），而是导入后按业务
  重要性改的：编号/名称/状态三个常用条件占满一行，数量与日期区间收进
  「展开查看更多」。
- **`types/api/index.ts` 的 barrel 必须手工合并**，生成器只吐一个
  `index-bak.ts` 作参考。

## 另外两条实测发现

**1. 生成的菜单 SQL 不含角色授权行。**
它只插 `sys_menu`，不插 `sys_role_menu`。`admin` 不受影响（框架对超级管理员
直接返回全部菜单），但**其他角色看不到新菜单**，要自己补：

```sql
insert into sys_role_menu values ('<roleId>', '<menuId>');
```

**2. 顶级 `menu_type='C'` 菜单会多出一层无名包装。**
本示例把「演示工单」挂在顶级（`parent_id=0`），框架的 `getRouters` 会为它生成
一个 `name=None, path='/'` 的 Layout 包装层，实际 URL 是 `/demoOrder`。
功能正常，但真实项目更推荐**先建一个「业务管理」目录（`menu_type='M'`），
再把业务菜单挂在它下面**——层次清楚，也避免这层无名包装。
