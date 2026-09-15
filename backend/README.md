# 后端（Spring Boot 3）

> **本目录是模板的「后端」一半，不是独立仓库。**
> 项目说明、启动方式、文档索引都在**仓库根**：见 [`../CLAUDE.md`](../CLAUDE.md)
> 和 [`../docs/README.md`](../docs/README.md)。

## 技术栈

JDK 21 / Spring Boot 3.5 / MyBatis / Druid / Quartz / JWT。

## 目录

| 目录 | 内容 |
|---|---|
| `@@MAVEN_ARTIFACT_PREFIX@@-admin` | HTTP 入口（Controller）、全局配置、`application*.yml`、启动类 |
| `@@MAVEN_ARTIFACT_PREFIX@@-framework` | 框架层：安全、拦截器、数据源配置 |
| `@@MAVEN_ARTIFACT_PREFIX@@-system` | 框架自带的系统模块（`Sys*`） |
| `@@MAVEN_ARTIFACT_PREFIX@@-common` | 工具类、通用实体、注解 |
| `@@MAVEN_ARTIFACT_PREFIX@@-generator` | **代码生成器**（含 `vm/` 模板） |
| `@@MAVEN_ARTIFACT_PREFIX@@-quartz` | 定时任务 |
| `@@MAVEN_ARTIFACT_PREFIX@@-biz` | **业务模块** —— 新业务代码统一放这里 |
| `sql/` | 建库与初始化脚本 |
| `bin/` | 启停脚本 |

## 构建与运行

```bash
mvn -f backend/pom.xml clean install -DskipTests
java -jar backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/target/@@MAVEN_ARTIFACT_PREFIX@@-admin.jar
```

> ⚠️ 改代码后**必须重新 `mvn install`** 再重启 jar，直接重启不生效。
> 改了 `@@MAVEN_ARTIFACT_PREFIX@@-generator/src/main/resources/vm/` 下的模板同理 ——
> 模板是打在 jar 里的资源。

## 约定

分层、权限串、生成器用法、以及踩过的坑，都在 `docs/`：

- [`docs/基建/框架分层与权限约定.md`](../docs/基建/框架分层与权限约定.md)
- [`docs/生成器/模板增强清单.md`](../docs/生成器/模板增强清单.md)
- [`docs/业务/README.md`](../docs/业务/README.md)

## 许可

MIT。上游版权声明与许可全文见 [`LICENSE`](./LICENSE)。
