import { THEME_VAR_MAP, resolveTokens, type ThemePreset, type ThemeTokens } from '@/config/themes'

// 处理主题样式
// isDark 显式传入而不是从 documentElement 的 class 反推：
// useDark() 改 class 是异步的，反推会读到上一帧的旧状态，
// 导致"切到暗色但主色没柔化"这类时序 bug。不传时回退到读 class，兼容既有调用点。
export function handleThemeStyle(theme: string, isDark?: boolean): void {
  const dark = isDark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  const primary = dark ? softenPrimaryForDark(theme) : theme
  document.documentElement.style.setProperty('--el-color-primary', primary)
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, `${getLightColor(primary, i / 10)}`)
  }
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, `${getDarkColor(primary, i / 10)}`)
  }
}

/**
 * 主题引擎管理的全部内联 CSS 变量。
 * 切换主题前必须把它们清干净 —— 否则上一个主题设过、而新主题没有覆盖的键会残留下来，
 * 出现"换主题后某个角落还是旧颜色"的鬼影。
 */
const MANAGED_VARS: string[] = [
  ...Object.values(THEME_VAR_MAP),
  '--sidebar-hover-bg',
  '--menu-hover',
  '--current-color',
  '--current-color-light',
  '--current-color-dark-bg',
  // 浅色侧边栏一族（sideTheme: 'theme-light' 的预设会写）
  '--sidebar-light-bg',
  '--sidebar-light-text',
  '--sidebar-light-menu-text',
  '--sidebar-light-logo-text',
  '--sidebar-light-hover-bg',
  '--sidebar-light-hover-text',
  '--sidebar-light-sub-bg',
  '--sidebar-light-sub-hover',
  '--sidebar-light-border'
]

/**
 * 应用一套主题预设。
 *
 * 三个设计要点：
 *  1. **只写内联样式**（documentElement）。内联声明的优先级高于任何样式表规则，
 *     因此能稳定压过 html.dark 那一大块带 !important 的覆盖，不需要再加 !important。
 *  2. 主色派生色复用既有的 handleThemeStyle，不重写颜色算法。
 *  3. --current-color* 从 layout 的 .app-wrapper 提升到 :root：
 *     原先 el-dialog / el-drawer / el-message 都 teleport 到 body，取不到这些变量；
 *     提升后登录页（不在 layout 内）也能跟随主题。
 *
 * @param preset  主题预设
 * @param isDark  当前是否暗色模式（决定取 light 还是 light+dark 合并后的令牌）
 * @param primary 可选的主色覆盖值，用于「自定义主色」场景；不传则用预设自带的
 */
export function applyTheme(preset: ThemePreset, isDark: boolean, primary?: string): void {
  const root = document.documentElement
  const tokens: ThemeTokens = resolveTokens(preset, isDark)
  const effectivePrimary = primary || tokens.primary

  MANAGED_VARS.forEach((v) => root.style.removeProperty(v))

  // 主色及其 light-1..9 / dark-1..9 派生色
  handleThemeStyle(effectivePrimary, isDark)

  // 其余令牌
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    const value = tokens[key as keyof ThemeTokens]
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  }

  // 侧边栏悬停必须写两个变量：
  //   一级菜单读 --sidebar-hover-bg（sidebar.scss）
  //   二级菜单在暗色下由 html.dark 里带 !important 的规则读 --menu-hover
  root.style.setProperty('--sidebar-hover-bg', tokens.sidebarHover)
  root.style.setProperty('--menu-hover', tokens.sidebarHover)

  // 浅色侧边栏：预设声明 sideTheme: 'theme-light' 时，把侧边栏令牌转写到 --sidebar-light-*
  // 那一族（框架的浅色侧边栏走的是另一套 CSS 分支，读的是这组变量）。
  // 边框和二级菜单底色在预设里没有对应字段，按侧边栏色推导，保证整体协调。
  if (preset.sideTheme === 'theme-light') {
    root.style.setProperty('--sidebar-light-bg', tokens.sidebarBg)
    root.style.setProperty('--sidebar-light-text', tokens.sidebarText)
    root.style.setProperty('--sidebar-light-menu-text', tokens.sidebarText)
    root.style.setProperty('--sidebar-light-logo-text', tokens.sidebarText)
    root.style.setProperty('--sidebar-light-hover-bg', tokens.sidebarHover)
    root.style.setProperty('--sidebar-light-hover-text', tokens.sidebarText)
    root.style.setProperty('--sidebar-light-sub-bg', `color-mix(in srgb, ${tokens.sidebarHover} 50%, ${tokens.sidebarBg})`)
    root.style.setProperty('--sidebar-light-sub-hover', tokens.sidebarHover)
    root.style.setProperty('--sidebar-light-border', `color-mix(in srgb, ${tokens.sidebarText} 16%, transparent)`)
  }

  // --current-color* 兼容通道。
  // 用 color-mix 表达透明度，替代原先 theme + '1a' / theme + '33' 的字符串拼接
  // （那种写法只对 6 位 hex 有效，换个颜色格式就静默失效）。
  // 二者合成的结果与原先一致：0x1a/255 ≈ 10.2%，0x33/255 = 20%。
  root.style.setProperty('--current-color', effectivePrimary)
  root.style.setProperty('--current-color-light', `color-mix(in srgb, ${effectivePrimary} 10.2%, transparent)`)
  root.style.setProperty('--current-color-dark-bg', `color-mix(in srgb, ${effectivePrimary} 20%, transparent)`)
}


/** 混合两种十六进制颜色 */
export function mixHexColors(fg: string, bg: string, t: number): string {
  const a = hexToRgb(String(fg).replace('#', ''))
  const b = hexToRgb(String(bg).replace('#', ''))
  const out = [0, 1, 2].map((i) => Math.round(a[i] * (1 - t) + b[i] * t))
  return rgbToHex(out[0], out[1], out[2])
}

/** 暗色模式下柔化主题色 */
export function softenPrimaryForDark(theme: string): string {
  return mixHexColors(theme, '#2d3036', 0.34)
}

// hex颜色转rgb颜色
export function hexToRgb(str: string): number[] {
  str = str.replace('#', '')
  const hexs = str.match(/../g) || []
  for (let i = 0; i < 3; i++) {
    hexs[i] = String(parseInt(hexs[i], 16))
  }
  return hexs.map(h => parseInt(h))
}

// rgb颜色转Hex颜色
export function rgbToHex(r: number, g: number, b: number): string {
  const hexs = [r.toString(16), g.toString(16), b.toString(16)]
  for (let i = 0; i < 3; i++) {
    if (hexs[i].length == 1) {
      hexs[i] = `0${hexs[i]}`
    }
  }
  return `#${hexs.join('')}`
}

// 变浅颜色值
export function getLightColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  for (let i = 0; i < 3; i++) {
    rgb[i] = Math.floor((255 - rgb[i]) * level + rgb[i])
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2])
}

// 变深颜色值
export function getDarkColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  for (let i = 0; i < 3; i++) {
    rgb[i] = Math.floor(rgb[i] * (1 - level))
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2])
}
