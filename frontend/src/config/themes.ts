/**
 * 主题预设注册表
 * =====================================================================
 * 【加一套主题】在 THEME_PRESETS 里加一个对象就行，不需要动其他文件。
 * 【改配色】直接改下面对象里的色值，刷新即生效（Vite 热更新）。
 *
 * 设计约束（改之前请先读）：
 *  1. `light` 是必填的，`dark` 是可选覆盖 —— 不写的键沿用 light 的值。
 *     之所以要分两套，是因为亮暗两种模式下同一个语义的取值本来就不同：
 *     例如侧边栏亮色下是 #1a1f2e、暗色下是 #141414。只定义一套会覆盖掉
 *     暗色的默认值，破坏既有外观。
 *  2. 色值一律用 6 位 hex（如 #409EFF）。`primary` 会被 JS 拿去推导
 *     --el-color-primary-light-1..9 / dark-1..9，rgba() 之类无法参与计算。
 *  3. 令牌最终写成 document.documentElement 的内联 CSS 变量，
 *     优先级高于 html.dark 与 :root，所以主题一定能生效。
 */

/** 一套主题在某个明暗模式下的配色令牌 */
export interface ThemeTokens {
  /** 品牌主色。驱动 Element Plus 组件高亮、按钮、链接、激活态、页签 */
  primary: string
  /** 侧边栏底色 */
  sidebarBg: string
  /** 侧边栏菜单文字 */
  sidebarText: string
  /** 侧边栏菜单悬停/选中底色（一级菜单用 --sidebar-hover-bg，二级用 --menu-hover，两个都会写） */
  sidebarHover: string
  /** 顶栏底色 */
  navbarBg: string
  /** 顶栏文字（含顶部模式下的横向菜单） */
  navbarText: string
  /** 顶栏右侧功能图标 */
  navbarIcon: string
  /** 标签栏底色 */
  tagsBg: string
  /** 标签栏页签文字 */
  tagsItemText: string
  /** 内容区背景。不填则沿用 Element Plus / 暗色模式的默认值（亮 #fff、暗 #141414） */
  pageBg?: string
  /**
   * 登录页底层背景（任意合法 CSS background-image 值，通常是渐变）。
   * 不填 = 沿用 variables.module.scss 里 :root / html.dark 的默认渐变。
   * 想换登录页底色的主题填这一项即可，不用再塞一张图片进仓库。
   */
  loginBg?: string
  /**
   * 登录页背景上的染色层，叠在 loginBg **之上**（任意合法 CSS background-image 值）。
   * 不填 = 透明（默认主题即如此）；填了就能让登录页也一眼看出是哪套主题。
   * 建议用主色或侧边栏色的半透明渐变。
   */
  loginOverlay?: string
}

/** 一套主题预设 */
export interface ThemePreset {
  /** 唯一标识。会写入 localStorage，**上线后不要改名** */
  id: string
  /** 设置面板里显示的名字 */
  name: string
  /** 一句话描述，用作 tooltip */
  description: string
  /**
   * 该主题偏好的明暗模式，**选中主题时会一并应用**（不填 = false = 亮色）。
   *
   * 主题包含明暗，所以选中一套主题 = 连明暗一起切换：
   * 选「暗夜」进暗色，选「清爽」回亮色。顶栏的太阳/月亮按钮仍然可以在当前主题内临时切，
   * 但只要再选一次主题就会回到该主题声明的模式。
   *
   * 注意这套令牌本身也是分 `light` / `dark` 两块的，二者配合：
   * `preferDark` 决定选中时用哪一块，用户在主题内手动切明暗则用另一块。
   */
  preferDark?: boolean
  /**
   * 侧边栏深浅。不填 = 不动用户当前的侧边栏设置。
   *
   * 设成 'theme-light' 可以做"浅色侧边栏"这类清爽风格 —— 但要注意框架的浅色侧边栏
   * 走的是另一套 CSS 分支（sidebar.scss 的 &.theme-light），内部的二级菜单底色、
   * 选中态文字都是给深色底写的。所以规则是：
   *   - 侧边栏令牌会自动下发到 --sidebar-light-* 那一族
   *   - **暗色模式下强制回到 theme-dark**（深色背景配浅色侧边栏不成体系，且框架
   *     在 html.dark 里对 .theme-light 有 !important 覆盖，硬来会打架）
   */
  sideTheme?: 'theme-dark' | 'theme-light'
  /** 亮色模式令牌（源数据，必填） */
  light: ThemeTokens
  /** 暗色模式覆盖（可选）。未列出的键沿用 light 的值 */
  dark?: Partial<ThemeTokens>
}

/**
 * 令牌 → CSS 变量的映射。
 *
 * 新增一个令牌要动 **4 处**（别只改这里，漏了会静默失效）：
 *   1. ThemeTokens 类型（本文件）—— 声明字段
 *   2. THEME_VAR_MAP（本文件）—— 建立映射
 *   3. variables.module.scss 的 :root（及需要时的 html.dark）—— 给默认值，
 *      这样令牌没被预设设置时外观与改造前一致，是零视觉回归的前提
 *   4. 使用处 —— 一律写成 `var(--令牌, 回退值)`
 *
 * 不需要动 theme.ts 的 MANAGED_VARS：它是从本映射表派生的
 * （`...Object.values(THEME_VAR_MAP)`），加进来就自动纳管。
 * 只有像 --sidebar-hover-bg 那样"一个令牌写两个变量"的特例才要手工补进去。
 */
export const THEME_VAR_MAP: Record<string, string> = {
  sidebarBg: '--sidebar-bg',
  sidebarText: '--sidebar-text',
  navbarBg: '--navbar-bg',
  navbarText: '--navbar-text',
  navbarIcon: '--navbar-icon',
  tagsBg: '--tags-bg',
  tagsItemText: '--tags-item-text',
  pageBg: '--el-bg-color',
  loginBg: '--login-bg',
  loginOverlay: '--login-overlay'
}

/* =====================================================================
 *  主题清单
 * ===================================================================== */

export const THEME_PRESETS: ThemePreset[] = [
  /* ------------------------------------------------------------------
   * 「默认蓝」—— 默认主题。
   * 取值严格等于改造前的实际值，保证升级后外观逐像素不变。
   * 改这里的色值前请想清楚，它会成为所有老用户的默认观感。
   *
   * ⚠️ id 必须保持 'default-blue' 不要改：它已写进老用户的 localStorage，
   *    改名会让存量用户静默回落到默认主题。要改显示名改 name 即可。
   * ---------------------------------------------------------------- */
  {
    id: 'default-blue',
    name: '默认蓝',
    description: '经典深藏青侧边栏 + 白色顶栏（默认）',
    light: {
      primary: '#409EFF',
      sidebarBg: '#1a1f2e',
      sidebarText: '#bfcbd9',
      sidebarHover: 'rgba(0, 0, 0, 0.06)',
      navbarBg: '#ffffff',
      navbarText: '#303133',
      navbarIcon: '#5a5e66',
      tagsBg: '#ffffff',
      tagsItemText: '#495060'
    },
    dark: {
      primary: '#409EFF',
      sidebarBg: '#141414',
      sidebarText: '#ffffff',
      sidebarHover: '#2d2d2d',
      navbarBg: '#141414',
      navbarText: '#ffffff',
      navbarIcon: '#d0d0d0',
      tagsBg: '#141414',
      tagsItemText: '#d0d0d0'
    }
  },

  /* 「商务藏青」—— 更深、更沉稳，适合对外演示与长时间值守 */
  {
    id: 'navy',
    name: '商务藏青',
    description: '深蓝主色 + 藏青侧边栏，稳重克制',
    light: {
      primary: '#2b6cb0',
      sidebarBg: '#12294a',
      sidebarText: '#a8bcd8',
      sidebarHover: '#1b3a63',
      navbarBg: '#f6f9fd',
      navbarText: '#1f2937',
      navbarIcon: '#4b5563',
      tagsBg: '#f6f9fd',
      tagsItemText: '#4b5563',
      pageBg: '#f1f5fa',
      loginOverlay: 'linear-gradient(135deg, rgba(18, 41, 74, 0.74), rgba(18, 41, 74, 0.34))'
    },
    dark: {
      primary: '#4a8fd4',
      pageBg: '#0a1119',
      sidebarBg: '#0b1420',
      sidebarText: '#c3cedd',
      sidebarHover: '#16263a',
      navbarBg: '#0b1420',
      navbarText: '#e5eaf1',
      navbarIcon: '#93a1b5',
      tagsBg: '#0b1420',
      tagsItemText: '#c3cedd'
    }
  },

  /* 「科技青」—— 冷色调，产线看板常用 */
  {
    id: 'tech-cyan',
    name: '科技青',
    description: '青绿主色 + 墨青侧边栏，偏冷偏科技感',
    light: {
      primary: '#0e9ea8',
      sidebarBg: '#0a3a40',
      sidebarText: '#9dd0d5',
      sidebarHover: '#0f4f57',
      navbarBg: '#f4fbfb',
      navbarText: '#16302f',
      navbarIcon: '#3d6b6b',
      tagsBg: '#f4fbfb',
      tagsItemText: '#356b6b',
      pageBg: '#eff7f8',
      loginOverlay: 'linear-gradient(135deg, rgba(10, 58, 64, 0.74), rgba(10, 58, 64, 0.34))'
    },
    dark: {
      primary: '#2bb8c2',
      pageBg: '#071417',
      sidebarBg: '#081619',
      sidebarText: '#bcd8dc',
      sidebarHover: '#122a2f',
      navbarBg: '#081619',
      navbarText: '#ddeef0',
      navbarIcon: '#8fb4ba',
      tagsBg: '#081619',
      tagsItemText: '#bcd8dc'
    }
  },

  /* 「护眼绿」—— 长时间盯屏场景，降低蓝光刺激 */
  {
    id: 'eye-green',
    name: '护眼绿',
    description: '柔和绿主色 + 墨绿侧边栏，适合长时间值守',
    light: {
      primary: '#2f9e44',
      sidebarBg: '#123a22',
      sidebarText: '#a6d3b4',
      sidebarHover: '#1a5232',
      navbarBg: '#f5fbf6',
      navbarText: '#1c2c20',
      navbarIcon: '#456b50',
      tagsBg: '#f5fbf6',
      tagsItemText: '#3f6b4a',
      pageBg: '#f0f8f2',
      loginOverlay: 'linear-gradient(135deg, rgba(18, 58, 34, 0.74), rgba(18, 58, 34, 0.34))'
    },
    dark: {
      primary: '#40b356',
      pageBg: '#0b1410',
      sidebarBg: '#0d1712',
      sidebarText: '#c2d9c9',
      sidebarHover: '#182a1f',
      navbarBg: '#0d1712',
      navbarText: '#e2efe6',
      navbarIcon: '#8fb09a',
      tagsBg: '#0d1712',
      tagsItemText: '#c2d9c9'
    }
  },

  /* 「工业橙」—— 高警示度，适合生产异常看板 */
  {
    id: 'industry-orange',
    name: '工业橙',
    description: '琥珀橙主色 + 古铜侧边栏，警示感强',
    light: {
      primary: '#d97706',
      sidebarBg: '#3a2410',
      sidebarText: '#d8be9c',
      sidebarHover: '#543417',
      navbarBg: '#fdfaf4',
      navbarText: '#2e2519',
      navbarIcon: '#6b5c4a',
      tagsBg: '#fdfaf4',
      tagsItemText: '#6b5c4a',
      pageBg: '#faf6ee',
      loginOverlay: 'linear-gradient(135deg, rgba(58, 36, 16, 0.74), rgba(58, 36, 16, 0.34))'
    },
    dark: {
      primary: '#f0932b',
      pageBg: '#120e08',
      sidebarBg: '#15100a',
      sidebarText: '#dcc9b0',
      sidebarHover: '#2a2116',
      navbarBg: '#15100a',
      navbarText: '#f5ead9',
      navbarIcon: '#b09879',
      tagsBg: '#15100a',
      tagsItemText: '#dcc9b0'
    }
  },

  /* 「暗夜」—— 全暗色，适合光线不足的车间/中控室 */
  {
    id: 'midnight',
    name: '暗夜',
    description: '整体暗色 + 柔化蓝主色，弱光环境友好',
    // 这套主题主打暗色，选中即切到暗色模式；其余主题不设置，保持用户当前的明暗选择
    preferDark: true,
    light: {
      // 该主题主打暗色，但用户若手动切回亮色也应得到一套协调的配色
      primary: '#3b6ea5',
      sidebarBg: '#1b2230',
      sidebarText: '#9aa4b5',
      sidebarHover: '#28303f',
      navbarBg: '#fafbfc',
      navbarText: '#1f2937',
      navbarIcon: '#5b6675',
      tagsBg: '#fafbfc',
      tagsItemText: '#4b5563',
      pageBg: '#eef1f5'
    },
    dark: {
      primary: '#5b9bd5',
      sidebarBg: '#0f1219',
      sidebarText: '#8b94a7',
      sidebarHover: '#1a1f2e',
      navbarBg: '#0f1219',
      navbarText: '#d0d0d0',
      navbarIcon: '#a0a8b8',
      tagsBg: '#141414',
      tagsItemText: '#c0c0c0',
      pageBg: '#0a0c10'
    }
  },

  /* 「清爽」—— 浅色侧边栏，通透轻盈。
   * 注意这套用了 sideTheme: 'theme-light'，暗色模式下会自动回到深色侧边栏。 */
  {
    id: 'fresh',
    name: '清爽',
    description: '浅色侧边栏 + 天空蓝主色，通透轻盈',
    sideTheme: 'theme-light',
    light: {
      primary: '#0ea5e9',
      sidebarBg: '#ffffff',
      sidebarText: '#334155',
      sidebarHover: '#e0f2fe',
      navbarBg: '#ffffff',
      navbarText: '#334155',
      navbarIcon: '#64748b',
      tagsBg: '#ffffff',
      tagsItemText: '#475569',
      pageBg: '#f8fafc',
      loginOverlay: 'linear-gradient(135deg, rgba(224, 242, 254, 0.78), rgba(14, 165, 233, 0.26))'
    },
    dark: {
      primary: '#38bdf8',
      pageBg: '#0b1220',
      sidebarBg: '#0f172a',
      sidebarText: '#cbd5e1',
      sidebarHover: '#1e293b',
      navbarBg: '#0f172a',
      navbarText: '#e2e8f0',
      navbarIcon: '#94a3b8',
      tagsBg: '#0f172a',
      tagsItemText: '#cbd5e1'
    }
  },

  /* 「科幻」—— 近黑底 + 霓虹青，中控大屏风格 */
  {
    id: 'scifi',
    name: '科幻',
    description: '近黑底 + 霓虹青主色，中控大屏风格',
    preferDark: true,
    light: {
      // 这套主打暗色。但仍给一套冷冽的亮色配色，避免用户手动切亮色时观感崩掉
      primary: '#0891b2',
      sidebarBg: '#0b1220',
      sidebarText: '#67e8f9',
      sidebarHover: '#152a3d',
      navbarBg: '#f6fdfe',
      navbarText: '#0e2933',
      navbarIcon: '#3f7d8c',
      tagsBg: '#f6fdfe',
      tagsItemText: '#336b78',
      pageBg: '#f0fafc',
      loginOverlay: 'linear-gradient(135deg, rgba(11, 18, 32, 0.88), rgba(8, 145, 178, 0.42))'
    },
    dark: {
      primary: '#22d3ee',
      sidebarBg: '#050810',
      sidebarText: '#7dd3fc',
      sidebarHover: '#0f2233',
      navbarBg: '#050810',
      navbarText: '#a5f3fc',
      navbarIcon: '#4dd0e1',
      tagsBg: '#050810',
      tagsItemText: '#a5f3fc',
      pageBg: '#03060d'
    }
  },

  /* 「紫罗兰」—— 深靛侧边栏 + 紫色主色 */
  {
    id: 'violet',
    name: '紫罗兰',
    description: '紫罗兰主色 + 深靛侧边栏，偏设计感',
    light: {
      primary: '#7c3aed',
      sidebarBg: '#251352',
      sidebarText: '#c4b5fd',
      sidebarHover: '#38207a',
      navbarBg: '#faf8ff',
      navbarText: '#2e1065',
      navbarIcon: '#6d28d9',
      tagsBg: '#faf8ff',
      tagsItemText: '#5b21b6',
      pageBg: '#f7f4ff',
      loginOverlay: 'linear-gradient(135deg, rgba(37, 19, 82, 0.78), rgba(124, 58, 237, 0.34))'
    },
    dark: {
      primary: '#a78bfa',
      pageBg: '#0e0819',
      sidebarBg: '#120a26',
      sidebarText: '#c4b5fd',
      sidebarHover: '#241348',
      navbarBg: '#120a26',
      navbarText: '#ede9fe',
      navbarIcon: '#a78bfa',
      tagsBg: '#120a26',
      tagsItemText: '#c4b5fd'
    }
  },

  /* 「石墨」—— 纯中性灰阶，不带色彩倾向 */
  {
    id: 'graphite',
    name: '石墨',
    description: '中性灰阶，无色彩倾向，适合正式汇报',
    light: {
      primary: '#475569',
      sidebarBg: '#1e293b',
      sidebarText: '#cbd5e1',
      sidebarHover: '#334155',
      navbarBg: '#ffffff',
      navbarText: '#1e293b',
      navbarIcon: '#64748b',
      tagsBg: '#ffffff',
      tagsItemText: '#475569',
      pageBg: '#f8fafc'
    },
    dark: {
      primary: '#94a3b8',
      pageBg: '#0b1220',
      sidebarBg: '#0f172a',
      sidebarText: '#cbd5e1',
      sidebarHover: '#1e293b',
      navbarBg: '#0f172a',
      navbarText: '#e2e8f0',
      navbarIcon: '#94a3b8',
      tagsBg: '#0f172a',
      tagsItemText: '#cbd5e1'
    }
  }
]

/** 默认主题 id（首次访问 / 数据损坏时的兜底） */
export const DEFAULT_THEME_ID = 'default-blue'

/**
 * 按 id 取主题预设。
 * 传入未定义的 id（含 undefined / 空串）时回退到默认主题，不抛错。
 */
export function getPreset(id?: string): ThemePreset {
  return (
    THEME_PRESETS.find((p) => p.id === id) ??
    THEME_PRESETS.find((p) => p.id === DEFAULT_THEME_ID)!
  )
}

/**
 * 取某主题在指定明暗模式下的最终令牌（dark 覆盖合并到 light 之上）。
 *
 * ⚠️ 这里有一处刻意的例外，见下方 pageBg 的注释。
 */
export function resolveTokens(preset: ThemePreset, isDark: boolean): ThemeTokens {
  if (!isDark) {
    return { ...preset.light }
  }
  const merged: ThemeTokens = { ...preset.light, ...preset.dark }
  // pageBg 是"表面色"，亮色的取值在暗色下**一定**不合适：
  // 它会被写成 --el-bg-color，覆盖掉 html.dark 里的 #141414，
  // 而 html.dark 同时把 --el-text-color-primary 设成了 #ffffff ——
  // 于是整个内容区变成白底白字（设置抽屉、el-tooltip 首当其冲）。
  // 所以暗色块没显式给 pageBg 就置空，让 html.dark / Element Plus 的默认值兜底。
  // 其余令牌不受此限：它们不像 pageBg 那样与 EP 的暗色默认值直接冲突。
  if (!preset.dark?.pageBg) {
    merged.pageBg = undefined
  }
  return merged
}
