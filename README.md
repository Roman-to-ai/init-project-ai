# @@PROJECT_NAME@@

前后端分离的工程模板：**Spring Boot 3 + Vue 3 + TypeScript**，内置代码生成器、
主题系统，以及一套**为 AI 协作设计的工程约定**。

> 这份 README 是**给人看**的。给 AI 看的那份是 [`CLAUDE.md`](./CLAUDE.md)
> （每次会话自动加载，只留索引和铁律）。

## 特色

| | |
|---|---|
| **代码生成器** | 导入表 → 一键出前后端 CRUD + 菜单权限 SQL。内置 17 种控件、前后端共用的校验规则、查询条件常用/非常用折叠 |
| **主题系统** | 10 套预设可切换。**加一套主题只需在 `src/config/themes.ts` 里加一个对象** |
| **知识分层** | `CLAUDE.md`（索引 + 铁律）+ `docs/`（基建 / 生成器 / 业务 三类），单份文档不超 400 行 |
| **质量门禁** | 类型检查**棘轮**（只报新增错误）+ 样式改动的**逐像素回归** |
| **模板化** | 项目标识全部占位符化（`@@PROJECT_NAME@@` 等），一条命令实例化成新项目 |

## 三步跑起来

```bash
# 1. 中间件（MySQL + Redis，Docker）
docker compose -f deploy/docker-compose.yml up -d   # MinIO 是可选的，默认用不到

# 2. 后端
mvn -f backend/pom.xml clean install -DskipTests
java -jar backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/target/@@MAVEN_ARTIFACT_PREFIX@@-admin.jar

# 3. 前端
pnpm -C frontend dev
```

打开 <http://localhost:@@FRONTEND_PORT@@>，默认账号 `admin` / `admin123`。

> ⚠️ **改后端代码必须重新 `mvn install` 再重启 jar**，直接重启 jar 不生效。
> 改了 `vm/` 下的生成器模板同理——模板是打在 jar 里的资源。
>
> 端口是刻意错开的（`@@MYSQL_PORT@@` / `@@REDIS_PORT@@`，不是标准的 3306/6379）——
> 开发机上常被别的项目占着，而且报错不会告诉你是谁占的。

## 目录

```
├── CLAUDE.md          给 AI 的索引 + 铁律（自动加载）
├── README.md          本文件 —— 给人看
├── docs/              知识主体：基建 / 生成器 / 业务
├── .claude/           skills（可复用的操作流程）、agents（子代理）、settings
├── scripts/           工具：初始化、文档生成、类型检查、截图回归
├── backend/           Java 后端（Spring Boot 3）
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-admin       HTTP 入口、配置、启动类
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-biz         ← 业务代码放这里
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-generator   代码生成器
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-system      框架自带的系统模块
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-common / -framework / -quartz
│   └── sql/                                  建库与初始化脚本
├── frontend/          前端（Vue 3 + TS）
├── deploy/            docker-compose.yml（MySQL + Redis + MinIO）
└── uploadPath/        后端文件上传目录
```

## 文档去哪找

| 想知道 | 去哪 |
|---|---|
| **有哪些功能模块、每个模块横跨哪些文件** | [`docs/业务/README.md`](docs/业务/README.md) |
| 怎么加一个新模块 | [`docs/业务/README.md`](docs/业务/README.md) + `/new-module` skill |
| 生成器能产出什么 / 字段用哪个控件、配什么规则 | [`docs/生成器/`](docs/生成器/) |
| 主题、类型检查、像素回归、环境与端口 | [`docs/基建/`](docs/基建/) |
| 总目录（按任务 / 按类型 / **按症状**） | [`docs/README.md`](docs/README.md) |
| 这个项目要做成什么样、还差什么 | [`AI工程化需求.txt`](./AI工程化需求.txt) |

## 开发约定

- **优先走代码生成器，不要手写 CRUD** —— 手写必漏菜单权限、字典、分页这些配套设施
- **权限串三处必须逐字一致**：Controller 的 `@PreAuthorize`、`sys_menu.perms`、
  前端的 `v-hasPermi`。对不上就是按钮不显示或 403
- **菜单/权限改动后必须重新登录** —— 缓存在 Redis 里
- **改样式后先全量刷新**再验证 —— Vite HMR 会留中间态，看着像真 bug

### 提交前跑一遍

```bash
node scripts/typecheck.mjs              # 类型检查棘轮：只报【新增】错误，有新增则 exit 1
node scripts/lint-ratchet.mjs           # ESLint 棘轮：同上
node scripts/doc-scan.mjs --check       # 文档与代码/数据库是否一致，有漂移则 exit 1
node scripts/skill-lint.mjs             # skill / 命令的 frontmatter 与引用完整性
node scripts/element-plus-scan.mjs --check   # 源码用到的组件都有对应技能
```

前三条是**棘轮** —— 存量记在 `scripts/*-baseline.json`，只对**新增**失败。
修掉问题后跑对应的 `--update` 让基线收紧。

> 这些已经挂进 `.gitlab-ci.yml`（`static` / `frontend` / `docs` 三段）。
> ⚠️ 但 **CI 是给实例化后的项目用的** —— 模板仓里 `typecheck` 必定失败
> （`vite.config.ts` 的占位符不是合法 TS），原因见 `docs/基建/类型检查棘轮.md`。

## 用这个模板起新项目

```bash
node scripts/init.mjs        # 交互式填：项目名、包根、模块前缀、库名、端口……
```

它会把所有 `@@KEY@@` 占位符换成你的值，**同时改文件内容和文件/目录名**
（比如 `backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/src/main/java/@@JAVA_PACKAGE_ROOT@@/@@APP_CLASS@@.java`
会变成 `backend/acme-admin/src/main/java/com/acme/AcmeApplication.java`）。

先体检、不落盘：

```bash
node scripts/init.mjs --check       # 列出仓库里所有占位符及其目标值，只读
node scripts/init.mjs --dry-run     # 演示会改什么，不写文件
```

## 许可

MIT。上游版权声明与许可全文见 [`backend/LICENSE`](./backend/LICENSE) 与
[`frontend/LICENSE`](./frontend/LICENSE)。
