# @@PROJECT_NAME@@

前后端分离的工程模板：**Spring Boot 3 + Vue 3 + TypeScript**，内置代码生成器与主题系统。

但它真正的重点不是"能跑"，而是**为 AI 协作而设计** ——
让 Claude Code 这类 AI 能在这个工程里**独立、正确地干活**，而不是每次都要人从头解释一遍。

> ### ⚠️ 这是个模板仓库
>
> 下面出现的 `@@PROJECT_NAME@@` / `@@MAVEN_ARTIFACT_PREFIX@@` 这类**是占位符，不是没写完**。
> 用 `node scripts/init.mjs` 实例化时会全部换成你项目的值 ——
> **文件内容、文件/目录名、连这份 README 一起**。
>
> 为什么要这样：模板要靠"用时全局搜索替换"来复用的话，漏一处就编译不过。
> 占位符 + 一条命令，把这件事变成确定的。

---

## 为什么叫"AI 工程化"

大多数项目的 AI 配置就是往根目录丢一个 `CLAUDE.md`。这个模板做的是一整套**分层体系**：

| 层 | 位置 | 回答什么 | 加载方式 |
|---|---|---|---|
| 铁律 | `CLAUDE.md`（约 5KB） | 每次都必须记住的 | **每会话自动加载**，只留索引 |
| 知识 | `docs/`（三类，18 篇） | 是什么、为什么 | 按需读，每行索引带「什么时候读」 |
| 流程 | `.claude/skills/`（12 个自建 + 39 个组件技能） | 怎么做、按什么顺序 | 按触发词自动匹配 |
| 工具 | `scripts/`（12 个） | 算得准的 | 命令行，可进 CI |
| 长任务 | `.claude/agents/`（2 个） | 一条链跑到底 | 隔离上下文 |

**判断标准只有一条**：*新开一个会话，只给一个任务，AI 能不能不问人就把事办对。*

### 12 个 skill 覆盖开发生命周期

| 阶段 | skill |
|---|---|
| 起项目 | `init-project` |
| 需求 → 表设计 | `design-schema` |
| 生成 CRUD | `new-module` |
| 手写后端 | `backend-code` |
| 前端组件 | `frontend-component` |
| 验证 | `verify-module` |
| 数据库 | `db-manage` |
| 排查 | `troubleshoot` |
| 收尾 | `update-docs` · `ai-changelog` |
| 启动 | `start-project` |
| 与模板同步 | `sync-ai-layer` |

### 门禁不是"全绿"，是**棘轮**

存量问题太多时，"修完再上"等于永远上不了。所以：

- **类型检查棘轮** —— 存量 436 个错误记进基线，**只对新增失败**
- **ESLint 棘轮** —— 同上，存量 728 个问题
- **文档一致性** —— 业务模块文档由脚本从数据库反推，有漂移则 exit 1
- **引用体检** —— 全仓 `.md` / `.txt` 里引用的路径是否还有效
- **像素回归** —— 改主题或布局后必跑，`--tolerance 2` 是按实测校准的

> 全部挂进 `.gitlab-ci.yml`，模板仓和实例化后的项目里都能跑。

---

## 其它特色

| | |
|---|---|
| **代码生成器** | 导入表 → 一键出前后端 CRUD + 菜单权限 SQL。**17 种控件**、前后端共用的校验规则、查询条件常用/非常用折叠 |
| **主题系统** | 多套预设可切换。**加一套主题只需加一个对象** |
| **模板化** | 项目标识全部占位符化，一条命令实例化成新项目 |

## 三步跑起来

```bash
# 1. 中间件（MySQL + Redis，Docker）
docker compose -f deploy/docker-compose.yml up -d

# 2. 后端
mvn -f backend/pom.xml clean install -DskipTests
java -jar backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/target/@@MAVEN_ARTIFACT_PREFIX@@-admin.jar

# 3. 前端
pnpm -C frontend dev
```

打开 <http://localhost:@@FRONTEND_PORT@@>，默认账号 `admin` / `admin123`。

> ⚠️ **改后端代码必须重新 `mvn install` 再重启 jar**，直接重启不生效。
> 改了 `vm/` 下的生成器模板同理 —— 模板是打在 jar 里的资源。
>
> ⚠️ 端口**刻意错开**标准端口（`@@MYSQL_PORT@@` / `@@REDIS_PORT@@`，不是 3306/6379）——
> 开发机上常被别的项目占着，而且报错只会说「连接被拒」，不会告诉你是谁占的。

## 目录

```
├── CLAUDE.md          给 AI 的索引 + 铁律（自动加载）
├── README.md          本文件 —— 给人看
├── docs/              知识主体：基建 / 生成器 / 业务
├── .claude/           skills（可复用流程）、agents（子代理）、commands、settings
├── scripts/           工具：初始化、文档生成、棘轮门禁、引用体检、截图回归
├── backend/           Java 后端（Spring Boot 3）
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-admin       HTTP 入口、配置、启动类
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-biz         ← 业务代码放这里
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-generator   代码生成器
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-system      框架自带的系统模块
│   ├── @@MAVEN_ARTIFACT_PREFIX@@-common / -framework / -quartz / -storage-minio
│   └── sql/                                  建库与初始化脚本
├── frontend/          前端（Vue 3 + TS + Element Plus）
├── deploy/            docker-compose.yml（MySQL + Redis + MinIO）
├── .gitlab-ci.yml     CI：static / frontend / docs 三段
└── uploadPath/        后端文件上传目录
```

## 文档去哪找

| 想知道 | 去哪 |
|---|---|
| 总目录（**按任务 / 按类型 / 按症状**） | [`docs/README.md`](docs/README.md) |
| 有哪些业务模块、每个横跨哪些文件 | [`docs/业务/README.md`](docs/业务/README.md) |
| 生成器能产出什么、字段用哪个控件 | [`docs/生成器/`](docs/生成器/) |
| 主题、类型检查、像素回归、环境与端口 | [`docs/基建/`](docs/基建/) |
| **这套 AI 工程化是怎么设计的、还差什么** | [`AI工程化需求.txt`](./AI工程化需求.txt) |

## 开发约定

- **优先走代码生成器，不要手写 CRUD** —— 手写必漏菜单权限、字典、分页这些配套设施
- **权限串三处必须逐字一致**：Controller 的 `@PreAuthorize`、`sys_menu.perms`、前端的 `v-hasPermi`。
  对不上就是按钮不显示或 403
- **菜单/权限改动后必须重新登录** —— 缓存在 Redis 里
- **改样式后先全量刷新**再验证 —— Vite HMR 会留中间态，看着像真 bug

### 提交前跑一遍

```bash
node scripts/typecheck.mjs                    # 类型检查棘轮：只报【新增】，有则 exit 1
node scripts/lint-ratchet.mjs                 # ESLint 棘轮：同上
node scripts/doc-scan.mjs --check             # 文档与代码/数据库是否一致
node scripts/skill-lint.mjs                   # skill / 命令的 frontmatter 与结构
node scripts/ref-check.mjs --check            # 全仓 .md / .txt 里的路径引用是否还有效
node scripts/element-plus-scan.mjs --check    # 源码用到的组件都有对应技能
```

棘轮类的存量记在 `scripts/*-baseline.json`，修掉问题后跑对应的 `--update` 让基线收紧。

## 用这个模板起新项目

```bash
node scripts/init.mjs          # 交互式填：项目名、包根、模块前缀、库名、端口……
```

先体检、不落盘：

```bash
node scripts/init.mjs --check     # 列出所有占位符及其目标值，只读
node scripts/init.mjs --dry-run   # 演示会改什么，不写文件
```

> ⚠️ `init.mjs` 是**原地转换**，不生成新目录。**先 `cp -r` 出去再跑**，
> 别在模板仓里直接跑（会毁掉模板）。完整的起项目流程见 `/init-project` skill。

## 许可

MIT。上游版权声明与许可全文见 [`backend/LICENSE`](./backend/LICENSE) 与
[`frontend/LICENSE`](./frontend/LICENSE)。
