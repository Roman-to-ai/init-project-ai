---
name: release
description: 把项目打包并交付出去——前端构建、后端打 jar、生产配置检查、交付物清单、回滚点。当用户说"发版"、"打包"、"部署"、"交付"、"上生产"、"build 一个包"时使用。
---

# 打包与交付

**这个项目的运行形态**（已确认）：中间件走 Docker，代码走本地 `pnpm` / `java`，
**没有远程生产环境**。所以"部署"实际是**打一个能交给别人的包 + 检查配置**。

> 日常**启动**用 `/start-project`，不要用这个 —— 那个会带全链路验证。
> 这个管的是"**要交出去了**"：编译产物、配置、别人拿到能不能跑。

## 一、先问清楚：这份包给谁

| 给谁 | 意味着什么 |
|---|---|
| **自己本机跑** | 不用打生产包，`/start-project` 就够了 |
| **给同事/测试** | 要打生产包 + 一份"怎么跑起来"的说明 |
| **上服务器** | ⚠️ 当前形态**不覆盖这个** —— 需要先定反向代理、HTTPS、进程守护、备份策略 |

**没定清楚就别开打。** 打错了要重来一遍。

## 二、打包

### 后端

```bash
mvn -f backend/pom.xml clean package -DskipTests
```

产物：`backend/<模块前缀>-admin/target/<模块前缀>-admin.jar`（约 100MB，自带依赖）。

> ⚠️ **`-DskipTests`**：这个项目没有单元测试（见 `AI工程化需求.txt` §3.6），
> 所以跳不跳一样。**质量靠的是那几道门禁，不是测试** —— 见第四节。

### 前端

```bash
pnpm -C frontend install --frozen-lockfile   # 交付构建要锁依赖版本
pnpm -C frontend build:prod
```

产物：`frontend/dist/`。

> ⚠️ **必须用 `build:prod` 不是 `build:stage`** —— 两者读的是不同的 `.env.*`，
> 接口前缀不一样（`/prod-api` vs `/stage-api`）。打错了前端连不上后端。

## 三、⭐ 生产配置检查（最容易漏的一步）

**模板里的默认值是"开发者本机"的值，不是"能交付"的值。** 逐项过：

| 项 | 在哪 | 检查什么 |
|---|---|---|
| 数据库连接 | `backend/*/src/main/resources/application-druid.yml` | 库名、密码、**端口** |
| 端口 | 同上 + `docker-compose.yml` | 交付目标机上**端口没被占**（这个项目刻意错开到 3307/6380 等，不是标准端口 —— 但也可能撞上别的） |
| **JWT 密钥** | `application.yml` | ⚠️ **必须换掉默认值**，且**不能提交进版本库** |
| 上传路径 | `application.yml` 的 `ruoyi.profile` | 交付目标上这个目录**存在且可写** |
| 文件存储 | 同上 | 用本地磁盘还是 MinIO？MinIO 的话桶建了吗（见 `docs/基建/文件存储.md`）|
| 前端接口前缀 | `frontend/.env.production` | 和反向代理配的对得上吗 |

> ⚠️ **`deploy/docker-compose.yml` 现在带 `name: <项目标识>`** —— 这是为了
> **同一台机器上跑多个实例时互不干扰**（见文件头的警告。以前没这行，
> 新实例 `up` 会把别的实例的容器**删掉**）。
> 交付时如果目标机上已有同项目的实例，先确认这个 `name` 不冲突。

## 四、交付前跑一遍门禁

**这个项目没有单元测试，质量靠这几道门禁。** 打包之前跑：

```bash
node scripts/typecheck.mjs                    # 类型棘轮：只报新增
node scripts/lint-ratchet.mjs                 # ESLint 棘轮
node scripts/doc-scan.mjs --check             # 文档与库一致（需要数据库）
node scripts/ref-check.mjs --check            # 引用是否还有效
node scripts/skill-lint.mjs                   # skill / 命令结构
node scripts/element-plus-scan.mjs --check    # 组件技能齐不齐
```

**这些已经挂进 `.gitlab-ci.yml`**（`static` / `frontend` / `docs` 三段）。
有 CI 的话让它跑；没有就手动跑。

> ⚠️ `doc-scan --check` 走 `docker exec` 进容器，**普通 CI job 里跑不了**
> （需要 shell runner）—— CI 里那一段标了 `manual`，见文件里的注释。

## 五、交付物清单

给别人时，这几样要一起给（或写清在哪）：

```
backend/<前缀>-admin/target/<前缀>-admin.jar   后端可执行包
frontend/dist/                                 前端构建产物
backend/sql/                                   建库与种子脚本（★ 导入顺序有讲究）
deploy/docker-compose.yml                      中间件编排
README.md                                      怎么跑起来
```

> ⚠️ **`backend/sql/` 的脚本不含建库语句**，且**必须按顺序导**
> （基线种子 → 业务表 → 菜单）。顺序错了会中途报错停下，
> **后面全不执行**（实测踩过，见 `AI工程化需求.txt` §3.23）。

## 六、留一个回滚点

**交付之前**，把当前这个"能跑的版本"记下来：

```bash
git tag <版本号>          # 例如 v1.0.0
git push origin <版本号>
```

出问题时回到那个 tag 重新打包。**没有 tag 就没法回滚** ——
而这个项目**只做了运行时数据的备份约定**（见 `.claude/skills/db-manage/SKILL.md`），
代码侧靠的就是 git tag。

## 排查

- **前端打包后接口全 404** → 打成了 `build:stage`，或 `.env.production` 的前缀和反向代理对不上
- **后端起来但连不上库** → 交付目标上的端口/库名/密码跟 `application-druid.yml` 不一致
- **`java -jar` 报端口被占** → `netstat` 找 PID；这个项目的端口是刻意错开的，但也可能撞
- **上传的图打不开** → `ruoyi.profile` 指向的目录不存在或不可写
- **改了代码但包是旧的** → 忘了 `mvn clean package`（**`clean` 不能省**）
- **CI 里 `doc-scan` 那步失败** → 它是 `manual` 的，需要 shell runner 才跑得了

## 汇报

```
目标：<给谁、什么环境>
打包：后端 jar ✅（<大小>）｜ 前端 dist ✅
配置检查：<逐项过没过的结论 —— 尤其 JWT 密钥换没换>
门禁：<跑了哪几道、结果>
交付物：<清单，及各自在哪>
回滚点：<tag 名；没打就写"未打">
没做的：<没验的、拿不准的>
```

**没打包就别说"可以发了"。** 报"配置已检查、门禁已过、**未实际打包**"也是合格结论 —— 比假通过好得多。
