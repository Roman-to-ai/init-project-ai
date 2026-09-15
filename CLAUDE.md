# @@PROJECT_NAME@@

前后端分离的工程模板：Spring Boot 3 + Vue 3 + TypeScript，内置代码生成器与 AI 工程化协作配置。

## 文档

**改代码前先读 `docs/README.md`（总目录）。** 本文件只留索引和铁律，正文都在 `docs/`。

高频入口：

- 新增 / 改造业务模块 → `docs/业务/README.md`
- 改代码生成器模板 → `docs/生成器/模板增强清单.md`
- 改主题、配色、侧边栏 → `docs/基建/主题系统.md`

改完代码按 `.claude/skills/update-docs/SKILL.md` 的路由表更新文档（或直接喊 `/update-docs`）。

## 铁律

最高频的七条，**每次都要遵守**。其余细节见 `docs/`。

- **改后端代码必须 `mvn install` 再重启 jar** —— 直接重启 jar 不生效
- **改了 `vm/` 下的生成器模板也必须重新 `mvn install`** —— 模板打在 jar 里
- **改样式 / `app-main` / 布局后必须全量刷新**再跑像素回归 —— HMR 会留中间态
- **新增生成模块后跑 `node scripts/typecheck.mjs --update`** —— 每模块约带 22 个类型错误
- **菜单 / 权限改动后必须重新登录** —— 缓存在 Redis 里
- **别把 `@@MYSQL_PORT@@` / `@@REDIS_PORT@@` 改回 3306 / 6379** —— 开发机上被别人占着
- **改完代码按 `/update-docs` 的路由表更新文档**

## 仓库结构

```
/
├── CLAUDE.md                本文件：索引 + 铁律
├── docs/                    知识主体，分三类
│   ├── README.md            总目录 —— 从这里进
│   ├── 基建/                 换一个业务模块仍然成立的：环境、主题、工具链、约定
│   ├── 生成器/               改它会影响所有生成物的
│   └── 业务/                 一个模块一份（表格部分由脚本生成）
├── .claude/skills/          自建 skill（14 个）：
│                              ai-changelog / backend-code / db-manage / design-schema /
│                              frontend-component / init-project / new-module / release /
│                              start-project / sync-ai-layer / task-brief / troubleshoot /
│                              update-docs / verify-module
│                            引用的 39 个 Element Plus 组件 skill（由 scripts/element-plus-scan.mjs 生成）
├── .gitlab-ci.yml           CI：static / frontend / docs 三段（**给实例化后的项目用**）
├── .claude/commands/        斜杠命令（commit）
├── scripts/                 工具：init / templatize / doc-scan / typecheck / shot / imgdiff
│                            element-plus-scan / skill-lint / db-query / lint-ratchet
├── backend/                 Java 后端（Spring Boot 3）
├── frontend/                前端（Vue 3 + TypeScript）
├── deploy/                  docker-compose.yml（MySQL + Redis + MinIO）
└── uploadPath/              后端文件上传目录
```

> `backend/` 与 `frontend/` 是**挂载路径**，不参与占位符替换；
> 其余项目标识（容器名、库名、端口、包根、模块前缀、启动类名）**全部是占位符**。

## 这是一个模板

占位符形如 `@@PROJECT_SLUG@@` / `@@DB_NAME@@` / `@@JAVA_PACKAGE_ROOT@@` /
`@@MAVEN_ARTIFACT_PREFIX@@` / `@@APP_CLASS@@`，定义在 `scripts/init.config.mjs`。

**它们同时作用于文件内容和文件 / 目录名** —— 所以模板仓库里会有
`backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/src/main/java/@@JAVA_PACKAGE_ROOT@@/@@APP_CLASS@@.java`
这样的路径。这是**刻意**的：本仓库存的是模板态，**不直接可编译**。

```bash
node scripts/init.mjs            # 交互式给新项目实例化
node scripts/init.mjs --defaults # 用默认值（用于校验占位符是否自洽）
```

> ⚠️ **新增文件时沿用占位符，别写死字面量。**
> 写完之后跑一次 `node scripts/templatize.mjs --dry-run`，看有没有漏网的。

## 技术栈

| | |
|---|---|
| 后端 | JDK 21 / Spring Boot 3.5 / MyBatis / Druid / Quartz / JWT |
| 前端 | Vue 3.5 / TypeScript 5.6 / Vite 6 / Element Plus / Pinia / pnpm |
| 中间件 | MySQL 8.4（`@@MYSQL_PORT@@`）+ Redis 7（`@@REDIS_PORT@@`）+ MinIO（可选，`@@MINIO_PORT@@`），见 `deploy/docker-compose.yml` |

## 启动

```bash
# 1. 中间件（首次已初始化过，日常只需这条）
docker compose -f deploy/docker-compose.yml up -d

# 2. 后端 —— 改代码后需要重新打包
mvn -f backend/pom.xml clean install -DskipTests
java -jar backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/target/@@MAVEN_ARTIFACT_PREFIX@@-admin.jar

# 3. 前端
pnpm -C frontend dev
```

访问 <http://localhost:@@FRONTEND_PORT@@>，默认账号 `admin` / `admin123`。

**启动 / 重启整个项目请用 `/start-project` skill**，它会连带验证全链路。

## 端口

| 服务 | 端口 | 配置在哪 |
|---|---|---|
| 前端 Vite | `@@FRONTEND_PORT@@` | `frontend/vite.config.ts` 的 `server.port` |
| 后端 | `@@BACKEND_PORT@@` | `backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/src/main/resources/application.yml` |
| MySQL | `@@MYSQL_PORT@@` | `deploy/docker-compose.yml`，容器内仍是 3306 |
| Redis | `@@REDIS_PORT@@` | 同上，容器内仍是 6379 |

排查占用：`netstat -ano | grep LISTENING | grep ':<端口>\s'`

## 数据库

库名 `@@DB_NAME@@`，root 密码 `@@DB_PASSWORD@@`。初始化脚本在 `backend/sql/`，
**脚本不含建库语句**，需先建库。细节见 `docs/基建/数据库.md`。

```bash
docker exec -i @@PROJECT_SLUG@@-mysql mysql -uroot -p@@DB_PASSWORD@@ --default-character-set=utf8mb4 @@DB_NAME@@ < 脚本.sql
```

> 注意库名 `@@DB_NAME@@` 带横线时，写 SQL 要用反引号包起来。
