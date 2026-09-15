#!/usr/bin/env node
/**
 * 截图采集器 —— 供 styles/主题改造的逐像素回归比对（配 scripts/imgdiff.py 使用）。
 *
 * 用法：
 *   node scripts/shot.mjs --out shots/before
 *   node scripts/shot.mjs --out shots/after --themes default,dark
 *   node scripts/shot.mjs --out shots/x --routes /index,/system/user --full-page
 *
 * 依赖 playwright（未安装时脚本会给出安装命令）：
 *   pnpm -C frontend add -D playwright
 *   pnpm -C frontend exec playwright install chromium
 *
 * ⚠️ 三个必须踩准的点，踩错了比对结果就是假阳性/假阴性：
 *
 * 1. **主题必须在应用启动前写入 localStorage**，否则第一帧会用错主题、
 *    截图落在过渡态上。这里用 context.addInitScript 而不是"先 goto 再 setItem"。
 *
 * 2. **每次采图前都要重新种一遍主题**。settings 存了
 *    'layout-setting'（themeId/customPrimary/sideTheme/isDark）和
 *    'vueuse-color-scheme'（useDark 的偏好），后者的 'auto' 会跟随系统
 *    prefers-color-scheme —— headless 下不可控，所以显式写 'light'/'dark'，不用 'auto'。
 *    不重种的话，采完 dark 再采 default 会拿到上一轮残留的暗色。
 *
 * 3. **动效必须禁掉**。Element Plus 的 message/tooltip 淡入、菜单展开动画都会
 *    让同一页面两次截图不一致。这里注入 CSS 全禁，并额外等一个 settle 时间。
 *
 * 另外：截图前**全量刷新**才有意义。Vite HMR 会留中间态，
 * 分两次编辑同一文件时浏览器可能停在中间那一刻（见 CLAUDE.md 的 HMR 已知坑）。
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_ROUTES = [
  '/login', // 公开页，独立布局，走 --login-* 令牌
  '/index', // 落地页，布局面最全
  '/system/user', // 表单 + 表格 + 查询栏 + 分页
  '/system/role',
  '/system/menu', // 树形
  '/system/dict', // 多 tab
  '/tool/gen', // 生成器，最密的表单
]

/**
 * 采集前要隐藏的易变元素（路由 → CSS 选择器）。
 *
 * 用 visibility:hidden 而不是 display:none —— 前者保留占位，布局不位移，
 * 像素位置才稳定。
 *
 * ⚠️ 为什么需要这个：这些元素的内容**每次请求都不同**，不隐藏的话
 * 同一个路由两次采集必然有差异，回归网会退化成"每次都说有问题"，
 * 然后人就学会无视它了。
 */
const HIDE_SELECTORS = {
  // 验证码图是随机算式，每次请求都变
  '/login': ['.login-code-img'],
}

/**
 * 不适合做像素回归的路由，**刻意不放进默认集**。
 *
 * /monitor/online 的表格内容是"当前有几个在线会话"，而本脚本自己每跑一次
 * 就登录一次、往 sys_user_online 里插一条 —— 于是第二轮采集必然比第一轮多一行
 * （分页的"共 N 条"也跟着变）。这是**采集行为本身在改动被采集的数据**，
 * 不是渲染不稳定，隐藏元素也救不了。列在这里是为了让下一个人别再踩。
 */
const VOLATILE_ROUTES_NOTE = ['/monitor/online', '/monitor/operlog']

/**
 * 公开路由：已登录时访问会被 permission.ts 重定向到 /index，
 * 所以必须在**不带 token** 的上下文里采，否则采到的是别的页面的副本。
 * 登录页是 --login-* 令牌最集中的地方，采成副本等于白采。
 */
const ANON_ROUTES = ['/login', '/register']

/** 主题档位 → localStorage 的内容。themeId 可用 --theme-id 覆盖。 */
const THEMES = {
  default: { scheme: 'light', isDark: false, sideTheme: 'theme-dark' },
  dark: { scheme: 'dark', isDark: true, sideTheme: 'theme-dark' },
}

const DISABLE_ANIMATIONS = `
*, *::before, *::after {
  animation: none !important;
  animation-duration: 0s !important;
  transition: none !important;
  transition-duration: 0s !important;
  caret-color: transparent !important;
}
`

function parseArgs(argv) {
  const opts = {
    base: 'http://localhost',
    apiPrefix: '/dev-api',
    out: 'shots',
    routes: DEFAULT_ROUTES,
    anonRoutes: new Set(ANON_ROUTES),
    hide: [],
    themes: ['default', 'dark'],
    themeId: null,
    width: 1600,
    height: 900,
    scale: 1,
    wait: 900,
    fullPage: false,
    user: 'admin',
    pass: 'admin123',
    token: null,
    expectTitle: null,
    redisContainer: '@@PROJECT_SLUG@@-redis',
    redisDb: 0,
    noAuth: false,
    keepOpen: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      const v = argv[++i]
      if (v === undefined) fail(`参数 ${a} 缺少值`)
      return v
    }
    switch (a) {
      case '--base': opts.base = next().replace(/\/$/, ''); break
      case '--api-prefix': opts.apiPrefix = next(); break
      case '--out': opts.out = next(); break
      case '--routes': opts.routes = next().split(',').map(normRoute).filter(Boolean); break
      case '--anon-routes': opts.anonRoutes = new Set(next().split(',').map(normRoute).filter(Boolean)); break
      case '--hide': opts.hide.push(next()); break
      case '--themes': opts.themes = next().split(',').map((s) => s.trim()).filter(Boolean); break
      case '--theme-id': opts.themeId = next(); break
      case '--width': opts.width = Number(next()); break
      case '--height': opts.height = Number(next()); break
      case '--scale': opts.scale = Number(next()); break
      case '--wait': opts.wait = Number(next()); break
      case '--user': opts.user = next(); break
      case '--pass': opts.pass = next(); break
      case '--token': opts.token = next(); break
      case '--expect-title': opts.expectTitle = next(); break
      case '--redis-container': opts.redisContainer = next(); break
      case '--redis-db': opts.redisDb = Number(next()); break
      case '--full-page': opts.fullPage = true; break
      case '--no-auth': opts.noAuth = true; break
      case '--keep-open': opts.keepOpen = true; break
      case '-h': case '--help': printHelp(); process.exit(0)
      default: fail(`未知参数 ${a}`)
    }
  }
  for (const t of opts.themes) {
    if (!THEMES[t]) fail(`未知主题档位 ${t}，可选：${Object.keys(THEMES).join(', ')}`)
  }
  const volatile = opts.routes.filter((r) => VOLATILE_ROUTES_NOTE.includes(r))
  if (volatile.length) {
    process.stdout.write(
      `⚠ 这些路由的内容会随采集行为本身变化，像素比对不稳定：${volatile.join(', ')}\n` +
        `  （例：/monitor/online 的表格行数 = 当前在线会话数，而本脚本每跑一次就登录一次）\n` +
        `  比对时它们必然报差异，建议用 --max-diff-pixels 放宽，或从 --routes 里去掉。\n\n`
    )
  }
  return opts
}

function fail(msg) {
  process.stderr.write(`${msg}\n\n用 --help 查看用法。\n`)
  process.exit(2)
}

function printHelp() {
  process.stdout.write(`截图采集器（配 scripts/imgdiff.py 做逐像素回归）

  node scripts/shot.mjs [options]

  --base URL        前端地址，默认 http://localhost
  --api-prefix P    接口前缀，默认 /dev-api（生产构建是 /prod-api）
  --out DIR         输出目录，默认 shots
  --routes A,B,C    要采的路由，默认：${DEFAULT_ROUTES.join(',')}
                    ⚠️ Git Bash 下**不要写前导斜杠**（MSYS 会把 /x 转成 Windows 路径）：
                       写 --routes demoOrder  而不是  --routes /demoOrder
                       已经带斜杠时可用 MSYS_NO_PATHCONV=1 或 //demoOrder 绕过。
  --anon-routes A,B 其中的公开路由，用不带登录态的上下文采，
                    默认：${ANON_ROUTES.join(',')}
  --hide SELECTOR   采集前隐藏的元素（可重复）。用于藏掉每次请求都变的
                    内容（验证码图等）。默认已藏：/login 的 .login-code-img
  --themes A,B      主题档位，可选 default,dark；默认两个都采
  --theme-id ID     覆盖主题预设 id（默认用应用自己的默认预设）
  --width N         视口宽，默认 1600
  --height N        视口高，默认 900
  --scale N         设备像素比，默认 1（**不要改**，否则两次截图尺寸可能不同）
  --wait MS         每页 settle 等待，默认 900
  --full-page       整页截图（默认只截视口；对比时整页更易受内容高度影响）
  --user / --pass   登录账号，默认 admin / admin123
  --token T         直接给一个已登录的 token，跳过登录
  --expect-title T  断言被采集应用的 <title> 等于 T，不符则中止。
                    **强烈建议每次都带上** —— 见下面"为什么要断言"。
  --redis-container 验证码兜底用的 Redis 容器名，默认 @@PROJECT_SLUG@@-redis
  --redis-db        Redis 库号，默认 0
  --no-auth         跳过登录（只采公开页时用）
  --keep-open       采完不关浏览器（调试用）

登录与验证码
  框架默认开启验证码（sys_config 的 sys.account.captchaEnabled=true），
  自动化登录会被挡。本脚本的兜底办法是：取 captchaImage 拿到 uuid 后，
  用 docker exec 从 Redis 读回答案（键 captcha_codes:<uuid>）——
  **只读，不改任何配置、不动数据库**。需要 docker 中间件在跑。

  若没有 docker，两条路二选一：
    a) 开发环境关掉验证码：
       update sys_config set config_value='false' where config_key='sys.account.captchaEnabled';
    b) 手工登录后把 cookie 里的 Admin-Token 传进来：--token <值>
`)
}

/** 路由 → 文件名片段：/system/user → system-user */
function slugify(route) {
  return route.replace(/^\//, '').replace(/[^\w.-]+/g, '-').replace(/-+$/, '') || 'root'
}

/**
 * 归一化路由参数。
 *
 * ★ 为什么需要这一步（Git Bash 用户的真实坑）：
 *   MSYS 会把看起来像路径的参数**自动转成 Windows 路径** ——
 *   `--routes /demoOrder` 会变成 `D:/Program Files/Git/demoOrder`，
 *   于是请求发到 http://localhostd/Program%20Files/Git/demoOrder 并报
 *   ERR_NAME_NOT_RESOLVED。（和 `taskkill /PID` 被转成路径是同一类问题。）
 *
 *   所以这里允许**不带前导斜杠**：写 `--routes demoOrder` 就完全绕开了 MSYS 转换，
 *   我们在这里补上 `/`。已经带斜杠的就照原样用；若已经被转坏（含盘符）则原样返回，
 *   让它去报一个能看懂的错，而不是悄悄采错页面。
 */
function normRoute(raw) {
  const v = String(raw).trim()
  if (!v) return ''
  if (v.startsWith('//')) return v.slice(1)          // //demoOrder → /demoOrder
  if (v.startsWith('/')) return v                    // 正常情况
  if (/^[A-Za-z]:[\\/]/.test(v)) return v            // 已被 MSYS 转坏，别自作聪明
  return '/' + v                                     // demoOrder → /demoOrder
}

async function importPlaywright() {
  // playwright 装在 frontend 里（UI 测试工具跟着前端走，且那里已有 node_modules）。
  // 本脚本在仓库根的 scripts/ 下，Node 默认的向上解析到不了前端，所以显式指过去。
  const { createRequire } = await import('node:module')
  const require = createRequire(new URL('../frontend/package.json', import.meta.url))
  try {
    return require('playwright')
  } catch {
    process.stderr.write(
      '找不到 playwright。先安装：\n\n' +
        '  pnpm -C frontend add -D playwright\n' +
        '  pnpm -C frontend exec playwright install chromium\n\n' +
        '（浏览器二进制约 150MB，只需装一次。）\n'
    )
    process.exit(2)
  }
}

/**
 * 从 Redis 读回验证码答案。
 *
 * 只读操作：不改配置、不动数据库。框架把答案写在 `captcha_codes:<uuid>`，
 * 有效期内取一次即可（登录成功即被消费，所以每次尝试都要取新的 uuid）。
 */
async function captchaFromRedis(uuid, opts) {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const run = promisify(execFile)
  const { stdout } = await run(
    'docker',
    ['exec', '-i', opts.redisContainer, 'redis-cli', '-n', String(opts.redisDb), 'get', `captcha_codes:${uuid}`],
    { timeout: 15000 }
  )
  // redis-cli 对字符串会带双引号输出
  const value = stdout.trim().replace(/^"(.*)"$/s, '$1')
  if (!value) throw new Error(`Redis 里没有 captcha_codes:${uuid}（可能已过期被消费）`)
  return value
}

/** 通过接口拿 token —— 比走 UI 登录稳，不受动画和前端路由影响。 */
async function login(request, opts) {
  const api = `${opts.base}${opts.apiPrefix}`

  // 先问要不要验证码；要的话就把答案从 Redis 捞回来给上去
  let code = ''
  let uuid = ''
  try {
    const capBody = await (await request.get(`${api}/captchaImage`)).json()
    if (capBody.captchaEnabled) {
      uuid = capBody.uuid
      code = await captchaFromRedis(uuid, opts)
      process.stdout.write('  验证码已从 Redis 取回（只读，未改任何配置）\n')
    }
  } catch (e) {
    process.stderr.write(
      `\n取验证码失败：${e.message}\n\n` +
        `验证码是开着的，自动登录需要从 Redis 读答案，但读不到。两条路二选一：\n\n` +
        `  a) 开发环境关掉验证码（可逆）：\n` +
        `     docker exec -i ${opts.redisContainer.replace(/-redis$/, '-mysql')} mysql -uroot -p<密码> ry-vue -e \\\n` +
        `       "update sys_config set config_value='false' where config_key='sys.account.captchaEnabled';"\n\n` +
        `  b) 浏览器里手工登录，然后 F12 复制 cookie 里的 Admin-Token，用 --token 传进来\n\n` +
        `若 Redis 不在 docker 里，用 --redis-container / --redis-db 指定，或加 --no-auth 只采公开页。\n`
    )
    process.exit(2)
  }

  const res = await request.post(`${api}/login`, {
    data: { username: opts.user, password: opts.pass, code, uuid },
  })
  if (!res.ok()) {
    throw new Error(`登录接口返回 ${res.status()}：${(await res.text()).slice(0, 200)}`)
  }
  const body = await res.json()
  if (body.code !== 200 || !body.token) {
    throw new Error(`登录失败：${JSON.stringify(body).slice(0, 200)}`)
  }
  return body.token
}

/**
 * 建一个带主题种子的浏览器上下文。
 *
 * ★ 每个上下文都必须全新：localStorage / cookie 完全隔离，
 *   否则"上一轮主题残留"会让暗色图其实是亮色的。
 */
async function makeContext(browser, opts, theme, token) {
  const context = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: opts.scale,
    colorScheme: theme.scheme, // 同时对齐 prefers-color-scheme
    reducedMotion: 'reduce',
  })

  const setting = {
    themeId: opts.themeId || undefined,
    customPrimary: '',
    sideTheme: theme.sideTheme,
    isDark: theme.isDark,
  }
  for (const k of Object.keys(setting)) if (setting[k] === undefined) delete setting[k]

  // ★ 关键：在应用脚本之前种 localStorage，否则第一帧会用错主题
  await context.addInitScript(
    ([payload, scheme]) => {
      try {
        localStorage.setItem('layout-setting', payload)
        localStorage.setItem('vueuse-color-scheme', scheme)
      } catch { /* 个别 about:blank 上下文没有 localStorage，忽略 */ }
    },
    [JSON.stringify(setting), theme.scheme]
  )

  if (token) {
    await context.addCookies([
      { name: 'Admin-Token', value: token, domain: new URL(opts.base).hostname, path: '/' },
    ])
  }
  return context
}

/**
 * 采集前确认"采的到底是哪个应用"。
 *
 * ★ 为什么必须有这一步（本机真实踩过两次的坑）：
 *   同一台机器上可能同时存在多份同构副本（如 E:\mes\code 和它的模板化副本），
 *   而 Vite dev server 监听同一个端口。两种情况都发生过：
 *     1. 服务端跑的是原件、改的是副本 → 截图全是旧页面，比对报"14/14 无变化"，
 *        看着一片绿，实际零信息量；
 *     2. 原件进程被杀后其**子进程残留**继续占着 80 端口，副本的 vite 抢不到，
 *        采到的又是原件。
 *   两种情况下 imgdiff 都会给出"无变化"的**假阴性**。绿不等于对。
 *
 *   所以这里先把被采集应用的 <title> 打出来并写进 manifest：
 *   比对前先核对两边的 title，不一致就说明采错了对象。
 *   带上 --expect-title 可以直接中止。
 */
async function probeApp(request, opts) {
  const res = await request.get(`${opts.base}/`, { timeout: 15000 })
  const html = await res.text()
  const m = html.match(/<title>([^<]*)<\/title>/i)
  return { title: m ? m[1].trim() : '', status: res.status() }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const { chromium } = await importPlaywright()

  await mkdir(opts.out, { recursive: true })

  const browser = await chromium.launch()
  const results = []
  let token = null
  let capturedTitle = ''

  try {
    if (opts.token) {
      token = opts.token
      process.stdout.write('使用 --token 提供的 token\n')
    } else if (!opts.noAuth) {
      const probe = await browser.newContext()
      token = await login(probe.request, opts)
      await probe.close()
      process.stdout.write(`已登录（${opts.user}）\n`)
    }

    // ★ 前置校验：确认被采集的应用是谁，避免"改了 A、测了 B"的假阴性
    {
      const ctx = await browser.newContext()
      const info = await probeApp(ctx.request, opts)
      await ctx.close()
      capturedTitle = info.title
      process.stdout.write(`采集目标: ${opts.base}  <title>${info.title}</title>\n`)
      if (opts.expectTitle && info.title !== opts.expectTitle) {
        process.stderr.write(
          `\n❌ <title> 与 --expect-title 不符：期望「${opts.expectTitle}」，实际「${info.title}」\n\n` +
            `   说明你正在采集的应用**不是**你刚改的那个。常见原因：\n` +
            `     • 服务是从另一份同构副本启动的（本机可能有多份）\n` +
            `     • 上一份 dev server 的**子进程残留**占着端口，新的没绑定上\n\n` +
            `   排查：确认监听该端口的进程，命令行指向哪个目录 ——\n` +
            `     netstat -ano | grep LISTENING | grep ':80\\s'\n` +
            `     powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=<PID>' | Select-Object CommandLine | Format-List"\n`
        )
        process.exit(2)
      }
    }

    for (const themeName of opts.themes) {
      const theme = THEMES[themeName]

      const context = await makeContext(browser, opts, theme, token)
      // 公开路由要另开一个**不带 token** 的上下文：已登录时访问 /login 会被
      // permission.ts 重定向到 /index，采到的就是 dashboard 的副本 —— 而登录页
      // 恰恰是 --login-* 令牌最集中的地方，采成副本等于这个路由白采。
      const anonContext = token ? await makeContext(browser, opts, theme, null) : null

      const page = await context.newPage()
      const pageErrors = []
      page.on('pageerror', (e) => pageErrors.push(String(e)))
      let anonPage = null
      if (anonContext) {
        anonPage = await anonContext.newPage()
        anonPage.on('pageerror', (e) => pageErrors.push(`[anon] ${e}`))
      }

      for (const route of opts.routes) {
        const file = path.join(opts.out, `${themeName}-${slugify(route)}.png`)
        const isAnon = opts.anonRoutes.has(route)
        const target = isAnon && anonPage ? anonPage : page
        const tag = isAnon && anonPage ? '（未登录上下文）' : ''
        try {
          await target.goto(`${opts.base}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
          // networkidle 之后仍可能有 el-table 布局跳动 / 图标懒加载
          await target.waitForTimeout(opts.wait)

          // 禁动效 + 藏掉每次请求都变的元素（验证码图等）
          const hideList = [...(HIDE_SELECTORS[route] || []), ...opts.hide]
          const css =
            DISABLE_ANIMATIONS +
            hideList.map((s) => `${s}{visibility:hidden !important}`).join('\n')
          await target.addStyleTag({ content: css })
          await target.waitForTimeout(120)

          await target.screenshot({ path: file, fullPage: opts.fullPage })
          results.push({ theme: themeName, route, file, ok: true })
          process.stdout.write(`  ✓ ${themeName.padEnd(8)} ${route}${tag}\n`)
        } catch (e) {
          results.push({ theme: themeName, route, file, ok: false, error: String(e.message || e) })
          process.stdout.write(`  ✗ ${themeName.padEnd(8)} ${route}  ${e.message || e}\n`)
        }
      }

      if (pageErrors.length) {
        process.stdout.write(
          `  ⚠ ${themeName} 页面报错 ${pageErrors.length} 条，截图可能是错误态：\n` +
            pageErrors.slice(0, 3).map((m) => `      ${m}\n`).join('')
        )
      }

      await context.close()
      if (anonContext) await anonContext.close()
    }
  } finally {
    if (!opts.keepOpen) await browser.close()
  }

  const ok = results.filter((r) => r.ok).length
  process.stdout.write(`\n采集完成：${ok}/${results.length} 张 → ${opts.out}/\n`)

  // manifest：记录这批图是"哪个应用、什么参数"下采的。
  // 比对前先核对两边的 title —— 不一致就说明采错了对象（见 probeApp 的注释）。
  await writeFile(
    path.join(opts.out, 'capture-meta.json'),
    JSON.stringify(
      {
        base: opts.base,
        appTitle: capturedTitle,
        capturedAt: new Date().toISOString(),
        viewport: { width: opts.width, height: opts.height, scale: opts.scale },
        themes: opts.themes,
        themeId: opts.themeId,
        routes: opts.routes,
        fullPage: opts.fullPage,
        ok,
        total: results.length,
      },
      null,
      2
    )
  )

  if (ok !== results.length) {
    process.stdout.write('\n失败明细：\n')
    for (const r of results.filter((r) => !r.ok)) {
      process.stdout.write(`  ${r.theme} ${r.route}  ${r.error}\n`)
    }
    process.stdout.write('\n路由采不到多为两种原因：路由不存在（看菜单名对不对），或未登录被重定向到 /login。\n')
    process.exit(1)
  }

  process.stdout.write(
    `\n下一步比对（默认主题要求 0 像素差异）：\n` +
      `  python scripts/imgdiff.py ${opts.out}/default-index.png ${opts.out.replace(/before$/, 'after')}/default-index.png\n`
  )
}

main().catch((e) => {
  process.stderr.write(`\n采集失败：${e.message || e}\n`)
  process.exit(2)
})
