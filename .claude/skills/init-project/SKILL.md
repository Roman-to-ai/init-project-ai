---
name: init-project
description: 用当前模板起一个新项目——复制模板、实例化占位符、git 初始化、环境自检、首次启动验证。当用户说"用这个模板起一个新项目"、"初始化项目"、"实例化模板"、"开一个新工程"时使用。
---

# 用模板起一个新项目

## ⚠️ 第一条铁律：绝不在模板仓库里直接跑

`scripts/init.mjs` 是**原地转换** —— 它改名文件/目录、改文件内容，**不生成新目录**。
**在模板仓库里跑一次，模板就毁了。** 而且模板仓当前**没有 `.git`**，毁掉没有回滚。

**所以第一步永远是先复制出去。** 顺序反了就没救。

## 一、复制到新目录

⚠️ **别用裸 `cp -r`** —— `frontend/node_modules` 有 350MB+，`backend/*/target` 还有构建产物，
拷过去既慢又没必要（新项目要重新 `pnpm install` / `mvn install` 的）。

```bash
# 在模板仓库的**上一级**执行，别动模板本身
mkdir -p <新项目目录>
tar -cf - \
    --exclude=node_modules --exclude=target --exclude=dist --exclude=.git \
    --exclude=.ai-log --exclude='docs/业务' \
    -C <模板目录> . | tar -xf - -C <新项目目录>

# 复制后立刻确认：新目录是独立的，模板还在原处
ls <模板目录>/scripts/init.mjs <新项目目录>/scripts/init.mjs
```

**两类 `--exclude` 的理由不同，都别省**：前一类是依赖与构建产物（350MB+）；
后一类是**项目自己的历史与生成物**，模板的不该带过去。

> ⚠️ **`EXCLUDE_DIRS` 不负责这件事** —— 它的语义只是"不做占位符替换"
> （`init.mjs` 是原地转换，没有复制这一步）。真要不带过去，只能靠这里的 `--exclude`。

进去之后**所有命令都在新目录里跑**（下文默认 cwd 是新项目）。

## 二、定变量

变量定义在 `scripts/init.config.mjs`（单一事实来源），**一共 17 个**。
下面只说**容易漏的那几个**，完整清单以配置文件为准。

**① 必须问用户 —— 这几个的默认值就是占位符本身**，不填的话项目里会残留未替换的占位符
（`init --check` 会报出来）

| 变量 | 是什么 |
|---|---|
| `PROJECT_NAME` | 显示在浏览器标题、登录页、侧边栏 Logo、页脚 |
| `JAVA_PACKAGE_ROOT` | 包根，形如 `com.example`。**唯一会展开成目录层级的变量** |
| `APP_CLASS` | Spring Boot 启动类名 |
| `CONFIG_CLASS` | 配置类名 |
| `SERVLET_INITIALIZER` | Servlet 初始化类名 |

**② 有默认值但必须逐个跟用户确认** —— 默认值不是"安全值"，只是"某个起点"：

| 变量 | 默认 | 影响面 |
|---|---|---|
| `PROJECT_SLUG` | `app` | Docker 容器名与数据卷名前缀 |
| **`MAVEN_ARTIFACT_PREFIX`** | `app` | ⚠️ **所有 Maven 模块目录名、artifactId、构建出的 jar 名** |
| `DB_NAME` / `DB_PASSWORD` | `app_db` / `123456` | 库名、密码 |
| 端口 ×5 | 3307 / 6380 / 9002 / 9003 / 8080 / 80 | 见下面那条检查 |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | `minioadmin` | 对象存储凭据 |

> ⚠️ **`MAVEN_ARTIFACT_PREFIX` 最容易漏**（实测踩过）—— 它决定 `testinit-admin`
> 这样的模块目录名和 jar 名。不设它就默认 `app`，项目里一半叫 `app-*` 一半叫别的。
> 它**不在"默认值是占位符"那一类**里，所以容易以为是可选的。

### ⚠️ 开工前先查端口（这一步不能跳）

**默认端口会和同机上的另一个本模板实例撞车** —— 本项目刻意错开标准端口
（`3307` 而不是 `3306`），但**每个实例的默认值都一样**，所以机器上跑过第二个项目时必然冲突。

```bash
for p in 3307 6380 9002 9003 8080 80; do
  printf "%-6s " "$p"
  netstat -ano | grep -i LISTENING | grep -E ":$p\s" >/dev/null && echo "被占" || echo "空闲"
done
```

**被占的端口要在 `--set` 里换掉**，别等 `docker compose up` 报错才发现 ——
那时候前几步的活儿都白干了（实测踩过：四个端口全被另一个实例占着）。

> ⚠️ `APP_CLASS` 改了要连带改**启动成功判据** ——
> `start-project` skill 里按 `Started <类名> in` 判断后端起没起来。
> 这条写在 `init.config.mjs` 的 `hint` 里。

## 三、先 dry-run，再落盘

```bash
# 先看会改什么（只读）
node scripts/init.mjs --set PROJECT_NAME=... --set JAVA_PACKAGE_ROOT=com.acme \
                      --set APP_CLASS=AcmeApplication --set CONFIG_CLASS=AcmeConfig \
                      --set SERVLET_INITIALIZER=AcmeServletInitializer --dry-run

# 确认无误再落盘
node scripts/init.mjs --set ... --yes
```

落盘后：

```bash
# 体检：确认没有漏网的占位符（这一步不能跳）
node scripts/init.mjs --check
```

它应当报告"没有未定义的占位符"。**还有残留就说明有变量没填**，别往下走。

> `init.mjs` 会写 `.template-init.json` 记录本次用的值 —— 它已在 `.gitignore` 里，**不要提交**。

## 四、git 初始化 + 首次提交

模板仓**没有 `.git`**（`.gitignore` / `.gitattributes` 是备好但还没用上的）。
新项目要自己初始化：

```bash
git init
git add <具体文件>      # 别用 git add -A，先看 git status 确认没有敏感文件
git commit -m "chore: 从模板初始化项目"
```

之后用 `/commit` 按项目规范提交。

> ⚠️ 确认 `.claude/settings.local.json` **没有被提交** —— 那是个人权限设置，
> 优先级高于团队设置，已经写进 `.gitignore` 了。

## 五、环境自检

```bash
node -v          # ≥ 20
pnpm -v
java -version    # 需要 JDK 21
mvn -v
docker -v
```

依赖安装：

```bash
pnpm -C frontend install
```

**Java 代码必须重新打包** —— 实例化改了包路径和模块名，`target/` 里的旧产物已经对不上：

```bash
mvn -f backend/pom.xml clean install -DskipTests
```

## 六、建库并导 SQL

```bash
docker compose -f deploy/docker-compose.yml up -d

# 建库（sql/ 下的脚本不含建库语句，需先建）
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    -e "create database \`<DB_NAME>\` default character set utf8mb4"

# 导入
docker exec -i <PROJECT_SLUG>-mysql mysql -uroot -p<DB_PASSWORD> \
    --default-character-set=utf8mb4 <DB_NAME> < backend/sql/<脚本>.sql
```

> 库名带横线时 SQL 里要用反引号包起来（这条踩过）。

## 七、首次启动

**用 `/start-project`** —— 它会把中间件、后端、前端连同全链路验证一起跑完，
还带端口占用排查。这里不重复它的步骤。

起来后确认：能打开登录页、`admin` / `admin123` 能登录、能看到菜单。

## 排查

- **还有占位符残留** → 有变量没填。跑 `node scripts/init.mjs --check` 看是哪个
- **前端起不来 / 端口是 80** → Windows 上 80 端口通常要管理员权限，且被占会**静默换到 81**
- **后端启动类找不到** → 改了 `APP_CLASS` 但没重新 `mvn install`
- **菜单空白 / 登录失败** → SQL 没导全，或导到了别的库（确认端口是 3307 不是 3306）
- **`.ai-log/` 或 `docs/业务/` 里有模板的内容** → 复制那步漏了 `--exclude`
  （见第一步的表格）。删掉它们：那是模板的历史与生成物，新项目该重新生成自己的

## 汇报

```
项目：<PROJECT_NAME>（<PROJECT_SLUG>）
包根：<JAVA_PACKAGE_ROOT>，启动类：<APP_CLASS>
端口：后端 <BACKEND_PORT> / 前端 <FRONTEND_PORT> / MySQL <MYSQL_PORT> / Redis <REDIS_PORT>
实例化：--check 通过 ✅（残留 0）
git：已初始化，首次提交 ✅ / 未做 ❌
环境：pnpm install ✅ / mvn install ✅ / 建库导 SQL ✅
首次启动：登录页 ✅ 登录 ✅ 菜单 ✅（未验的明确说没验）
遗留：<没做完的、拿不准的>
```

**没做的事就不要写成做了。** 验证没跑完就明说哪一步没验证。
