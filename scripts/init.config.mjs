/**
 * 模板变量规范 —— 单一事实来源。
 *
 * 这个文件定义：模板里有哪些占位符、默认值是什么、怎么校验、以及哪些目录不参与替换。
 * `scripts/templatize.mjs`（把字面量换成占位符，维护模板时用）和
 * `scripts/init.mjs`（把占位符换成新项目的值，使用者用）都读它。
 *
 * ── 占位符语法 `@@UPPER_SNAKE@@` ─────────────────────────────────
 * 为什么是双 @ ：本仓库同时存在三种会冲突的语法
 *   · `${...}`  —— Spring 占位符（application*.yml）与 Velocity（vm/**\/*.vm）
 *   · `%...%`   —— Vite 的 HTML 环境变量（index.html）
 *   · `{{ }}`   —— Vue 模板（97 个 .vue 文件）
 *   · `#{...}`  —— MyBatis 参数绑定（29 个 .xml）
 * 双 @ 在它们中间都不合法，实测对全仓库 `grep "@@"` 零命中。
 * ────────────────────────────────────────────────────────────────
 *
 * ── 默认值怎么定 ────────────────────────────────────────────────
 * **默认值应当是「一个合理的通用起点」**，不是当前仓库的值 ——
 * 模板态下仓库里存的是占位符，二者本来就不相等。
 *
 * 只有 `APP_CLASS` / `CONFIG_CLASS` / `SERVLET_INITIALIZER` / `JAVA_PACKAGE_ROOT` /
 * `PROJECT_NAME` 这五个的默认值**就是占位符本身**（自引用）—— 它们没有
 * 通用默认值可言，只能等使用者填。
 *
 * 体检用 `node scripts/init.mjs --check`（只读），别指望「跑一遍 init 没变化」这种闸门。
 */

/** 一个变量 */
// {
//   key       占位符名（即 @@KEY@@）
//   label     交互式提问时显示的文字
//   default   默认值（必须等于当前实际值）
//   group     分组，仅用于提问时归类
//   validate  正则，校验输入
//   apply     可选：把用户输入规范化（如小写、去空格）
//   hint      补充说明
//   secret    可选：true 表示是凭据。init.mjs 写 .template-init.json 时会打码，不落明文
// }

export const VARIABLES = [
  {
    key: 'PROJECT_NAME',
    label: '项目名称',
    group: '项目标识',
    default: '@@PROJECT_NAME@@',
    hint: '显示在浏览器标题、登录页、侧边栏 Logo、页脚版权',
  },
  {
    key: 'PROJECT_SLUG',
    label: '项目标识',
    group: '项目标识',
    default: 'app',
    hint: '小写字母/数字/连字符。用于 Docker 容器名与数据卷名前缀（@@PROJECT_SLUG@@-mysql）',
    validate: /^[a-z][a-z0-9-]*$/,
    validateMessage: '只能是小写字母开头，后接小写字母、数字或连字符',
  },
  {
    key: 'JAVA_PACKAGE_ROOT',
    label: 'Java 包根',
    group: '包与模块',
    default: '@@JAVA_PACKAGE_ROOT@@',
    hint: '全仓库替换。会同时改包目录树、package/import、MyBatis namespace、@MapperScan、typeAliasesPackage',
    validate: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    validateMessage: '形如 com.example，全小写，至少两段',
    // 作为**目录名**出现时，把值里的点展开成目录层级：
    // 模板里那个单独的 `@@JAVA_PACKAGE_ROOT@@` 目录要变成 `com/example/`。
    // 只有这一个变量有这需求 —— 其余变量的值都是单个路径段。
    asPath: true,
  },
  {
    key: 'MAVEN_ARTIFACT_PREFIX',
    label: 'Maven 模块前缀',
    group: '包与模块',
    default: 'app',
    hint: '各模块目录与 artifactId 的前缀（@@MAVEN_ARTIFACT_PREFIX@@-admin 等），以及构建出的 jar 名。' +
          '新增模块时别忘了顺带在 templatize.mjs 的模块前缀数组里加一项',
    validate: /^[a-z][a-z0-9-]*$/,
  },
  {
    key: 'APP_CLASS',
    label: '启动类名',
    group: '包与模块',
    default: '@@APP_CLASS@@',
    hint: 'Spring Boot 主类。注意：改它要连带改 skill 里的「启动成功」判据（Started <类名> in …）',
    validate: /^[A-Z][A-Za-z0-9]*$/,
  },
  {
    key: 'CONFIG_CLASS',
    label: '配置类名',
    group: '包与模块',
    default: '@@CONFIG_CLASS@@',
    hint: '读取 YAML 里那一组应用配置的类。只改类名；YAML 里的配置前缀不动（那是 @ConfigurationProperties 绑定的）',
    validate: /^[A-Z][A-Za-z0-9]*$/,
  },
  {
    key: 'SERVLET_INITIALIZER',
    label: 'Servlet 初始化类名',
    group: '包与模块',
    default: '@@SERVLET_INITIALIZER@@',
    validate: /^[A-Z][A-Za-z0-9]*$/,
  },
  {
    key: 'DB_NAME',
    label: '数据库名',
    group: '数据库',
    default: 'app_db',
    hint: '建议不带连字符 —— 带横线的库名在每条 SQL 里都要用反引号包起来（这条踩过）',
    validate: /^[a-z][a-z0-9_-]*$/,
  },
  {
    key: 'DB_PASSWORD',
    label: '数据库密码',
    group: '数据库',
    default: '123456',
    hint: '会同时写进 docker-compose 的 mysql 与 healthcheck、以及后端 JDBC',
    secret: true,
  },
  {
    key: 'MYSQL_PORT',
    label: 'MySQL 宿主端口',
    group: '端口',
    default: '3307',
    hint: '容器内仍是 3306。默认错开是因为开发机常有别的项目占着 3306',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'REDIS_PORT',
    label: 'Redis 宿主端口',
    group: '端口',
    default: '6380',
    hint: '容器内仍是 6379，理由同上',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'MINIO_PORT',
    label: 'MinIO 宿主端口',
    group: '端口',
    default: '9002',
    hint: 'S3 API，容器内仍是 9000。默认取 9002 而不是 9000 —— 9000/9001 常被别的服务占着。' +
          '改这里会同时影响 docker-compose 与 application.yml 的 file.storage.minio.endpoint',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'MINIO_CONSOLE_PORT',
    label: 'MinIO 控制台宿主端口',
    group: '端口',
    default: '9003',
    hint: '容器内仍是 9001。浏览器打开 http://localhost:<这个> 能看桶和对象',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'BACKEND_PORT',
    label: '后端端口',
    group: '端口',
    default: '8080',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'FRONTEND_PORT',
    label: '前端端口',
    group: '端口',
    default: '80',
    hint: 'Windows 上 80 端口通常需要管理员权限；被占会静默换到 81',
    validate: /^\d{2,5}$/,
  },
  {
    key: 'MINIO_ACCESS_KEY',
    label: 'MinIO 账号',
    group: '对象存储',
    default: 'minioadmin',
    hint: '会同时写进 docker-compose 与 application.yml，且写成 ${MINIO_ROOT_USER:占位符} —— ' +
          '运维 export MINIO_ROOT_USER 一次就能覆盖，不必重新 init',
    secret: true,
  },
  {
    key: 'MINIO_SECRET_KEY',
    label: 'MinIO 密码',
    group: '对象存储',
    default: 'minioadmin',
    hint: 'MinIO 要求至少 8 个字符。生产环境务必改掉 —— 更要紧的是给后端一个只授权本桶的账号，' +
          '而不是用 root 凭据（见 docs/基建/文件存储.md）',
    secret: true,
  },
]

/** key → 默认值 的便捷映射 */
export const DEFAULTS = Object.fromEntries(VARIABLES.map((v) => [v.key, v.default]))

/**
 * 本文件里**用来说明语法**的示例占位符，不是真的变量。
 * `scripts/init.mjs` 扫描「还剩哪些没被替换」时要跳过它们，
 * 否则每次体检都会报两个假警报。
 */
export const IGNORE_PLACEHOLDERS = ['UPPER_SNAKE', 'KEY']

/**
 * 不参与**占位符替换**的路径（相对仓库根）。
 *
 * ⚠️ 语义只是「不做替换」，**不是「不复制」**。
 *    `init.mjs` 是**原地转换**（改名 + 改内容），**没有复制这一步** ——
 *    新目录是使用者自己 `cp` / `tar` 出来的。
 *    所以这里列的东西**照样会出现在新项目里**（实测确认：`.ai-log/` 与
 *    `docs/业务/` 实例化后都还在）。想真的不带过去，得在**复制那一步**排除 ——
 *    见 `.claude/skills/init-project/SKILL.md` 的命令。
 *
 * 用最小匹配：只有确实含二进制或生成物的目录才列进来。
 */
export const EXCLUDE_DIRS = [
  '.git',
  'node_modules',
  'target',
  'dist',
  'shots',        // 截图回归产物，每台机器自己采
  '.upstream',    // upstream-diff 的工作区
  '.claude/.state',
  // 业务模块文档：**生成物**，不是模板源码。
  // 里面的代码落点是 `scripts/doc-scan.mjs` 从磁盘上读出来的**真实路径**
  // （含真实的 Maven 模块目录名），换成占位符就成了指不到的文件。
  // 它们本来就该在新项目里**重新生成**，而不是做文本替换。
  // ⚠️ 只排除 `业务/` —— `基建/` 与 `生成器/` 是手写的，其中的占位符是刻意写的。
  'docs/业务',
  // AI 变更日志：**这个模板自己的开发历史**，不是模板资产。
  // 新项目该从空白开始记自己的（`ai-changelog` skill 会按需创建目录）。
  // ⚠️ 列在这里只保证「不被替换」；要真的不带过去，复制那步得排除 `--exclude=.ai-log`。
  '.ai-log',
]

/** 不参与替换的文件（相对仓库根，支持简单后缀匹配） */
export const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
]

/**
 * 二进制后缀 —— 按**内容**判断（前 8192 字节含 0x00）为主，这个列表只是兜底加速。
 * 二进制文件原样复制，不做替换。
 */
export const BINARY_EXT = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.jar', '.war', '.zip', '.gz', '.7z', '.tar',
  '.xlsx', '.xls', '.docx', '.doc', '.pdf',
  '.exe', '.dll', '.so', '.dylib', '.class',
  '.mp3', '.mp4', '.avi', '.mov',
]
