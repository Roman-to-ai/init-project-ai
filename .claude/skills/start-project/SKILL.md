---
name: start-project
description: 启动或重启本项目（Docker 中间件 + Java 后端 + Vue3 前端），并验证全链路可用。当用户说"启动项目"、"重启服务"、"跑起来"、"前端/后端起不来"、"端口被占用"时使用。
---

# 启动项目

命令都在**仓库根目录**下执行。中间件在 Docker 里，前后端各自独立进程。

## 一、中间件（MySQL `@@MYSQL_PORT@@` + Redis `@@REDIS_PORT@@`，MinIO 可选）

```bash
docker ps --filter name=@@PROJECT_SLUG@@- --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 没在跑才启动
docker compose -f deploy/docker-compose.yml up -d
```

等 MySQL healthy 再继续（首次初始化约 30s）：

```bash
until [ "$(docker inspect @@PROJECT_SLUG@@-mysql --format '{{.State.Health.Status}}' 2>/dev/null)" = healthy ]; do sleep 5; done
```

> ⚠️ 开发机上常有别的项目占着标准的 3306 / 6379，本项目刻意错开到
> `@@MYSQL_PORT@@` / `@@REDIS_PORT@@`。**不要为了「统一」改回去** —— 会静默连到别人的库，
> 而且报错不会告诉你是谁占的。

## 二、后端（`@@BACKEND_PORT@@`）

**判断要不要重新构建**：`backend/` 下有 `.java` / `.xml` / `.yml` 改动就必须重新打包 ——
直接重启 jar **不会**加载新代码。改了 `vm/` 下的生成器模板同理（模板打在 jar 里）。

```bash
# 有代码改动时
mvn -f backend/pom.xml clean install -DskipTests

# 启动（前台观察日志；确认正常后可转后台）
java -jar backend/@@MAVEN_ARTIFACT_PREFIX@@-admin/target/@@MAVEN_ARTIFACT_PREFIX@@-admin.jar
```

启动成功的标志：日志出现 `Started @@APP_CLASS@@ in X seconds`。

> 控制台中文乱码是 Windows 代码页问题，**不影响功能**。需要的话加 `-Dfile.encoding=UTF-8`。

## 三、前端（`@@FRONTEND_PORT@@`）

```bash
pnpm -C frontend dev
```

`pnpm install` 只在依赖有变动时需要（比如刚补过 `sortablejs`）。首次安装 pnpm 会警告
`ERR_PNPM_IGNORED_BUILDS`（esbuild / @parcel/watcher / vue-demi）——**这是误报，可以忽略**，
`@esbuild/win32-x64` 已经作为 optionalDependency 装上了。

## 四、验证

```bash
curl -s -o /dev/null -w "后端 @@BACKEND_PORT@@: %{http_code}\n"  http://localhost:@@BACKEND_PORT@@/captchaImage
curl -s -o /dev/null -w "前端 @@FRONTEND_PORT@@:  %{http_code}\n"  http://localhost:@@FRONTEND_PORT@@/
curl -s -o /dev/null -w "代理:              %{http_code}\n"  http://localhost:@@FRONTEND_PORT@@/dev-api/captchaImage
```

三条都是 `200` 才算通。访问 <http://localhost:@@FRONTEND_PORT@@>，`admin` / `admin123`。

> ⚠️ **不要给 MinIO 加等待循环。** 后端**不依赖 MinIO 就能启动**（这是刻意的：
> 文件存储是旁路能力，MinIO 抖动不该让整个后台起不来）。加 `until healthy` 会把它变成硬依赖。
> 只在切了 `file.storage.type=minio` 时才需要确认它：看启动日志有没有
> `对象存储就绪：… / 桶 …`。

## 排查

**某端口被占**：

```bash
netstat -ano | grep LISTENING | grep -E ':(@@FRONTEND_PORT@@|@@BACKEND_PORT@@)\s'
```

拿到 PID 后**先确认是不是本项目的进程**，再杀：

```bash
# 确认身份（避免误杀 IIS 等系统服务）
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=<PID>' | Select-Object Name,CommandLine | Format-List"

# 杀
powershell -NoProfile -Command "Stop-Process -Id <PID> -Force"
```

> ⚠️ **别用 `taskkill /PID <pid>`** —— Git Bash 的 MSYS 会把 `/PID` 当成路径转换成
> `D:/Program Files/Git/PID`，直接报错。
>
> ⚠️ **停前端时父进程死了子进程会残留**，仍然占着 `@@FRONTEND_PORT@@`。停完务必回头
> `netstat` 确认端口真的释放了，否则下次启动会静默换到 `@@FRONTEND_PORT@@ + 1`。

**前端报 `Failed to resolve import "sortablejs"`**：上游 `package.json` 漏了这个依赖，
重新拉取上游代码后需要再补一次：

```bash
pnpm -C frontend add sortablejs@1.15.7 --save-exact
```

**后端连不上 MySQL**：JDBC URL 必须带 `useSSL=false&allowPublicKeyRetrieval=true`
（MySQL 8.4 的 `caching_sha2_password` 需要），见 `application-druid.yml`。
