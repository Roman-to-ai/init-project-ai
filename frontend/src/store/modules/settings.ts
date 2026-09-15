import defaultSettings from '@/settings'
import { useDark } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import { applyTheme } from '@/utils/theme'
import { getPreset, resolveTokens, DEFAULT_THEME_ID } from '@/config/themes'

const isDark = useDark()

const { sideTheme, showSettings, navType, tagsView, tagsViewPersist, tagsIcon, tagsViewStyle, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

const STORAGE_KEY = 'layout-setting'

/**
 * 不入 localStorage 的瞬态字段。
 * 用**黑名单**而不是白名单：新增设置项时默认就会被持久化，
 * 不会出现"加了个字段但忘了加进保存列表"的漏字段问题
 * （原来读/写两端各硬编码一份字段清单，加字段必漏一处）。
 */
const TRANSIENT_KEYS = ['title', 'showSettings']

function loadSetting(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}
  } catch {
    // 顺带修掉一个坑：localStorage 里的 JSON 损坏时，原先会直接抛错导致整个应用起不来
    localStorage.removeItem(STORAGE_KEY)
    return {}
  }
}

const storageSetting = loadSetting()

interface SettingsState {
  title: string
  /** 当前主题预设 id，见 @/config/themes */
  themeId: string
  /** 自定义主色。空串 = 跟随主题预设。保留"自定义取色"这条既有能力 */
  customPrimary: string
  sideTheme: string
  showSettings: boolean
  navType: number
  tagsView: boolean
  tagsViewPersist: boolean
  tagsViewStyle: string
  tagsIcon: boolean
  fixedHeader: boolean
  sidebarLogo: boolean
  dynamicTitle: boolean
  footerVisible: boolean
  footerContent: string
  isDark: boolean
}

const useSettingsStore = defineStore(
  'settings',
  {
    state: (): SettingsState => ({
      title: '',
      // 老数据兼容：以前只存了 theme（主色 hex），没有 themeId。
      // 此时归入默认预设，并把老的主色当作自定义主色继续生效。
      themeId: storageSetting.themeId || DEFAULT_THEME_ID,
      customPrimary: storageSetting.customPrimary || (storageSetting.themeId ? '' : (storageSetting.theme || '')),
      sideTheme: storageSetting.sideTheme || sideTheme,
      showSettings: showSettings,
      navType: storageSetting.navType === undefined ? navType : storageSetting.navType,
      tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
      tagsViewPersist: storageSetting.tagsViewPersist === undefined ? tagsViewPersist : storageSetting.tagsViewPersist,
      tagsIcon: storageSetting.tagsIcon === undefined ? tagsIcon : storageSetting.tagsIcon,
      tagsViewStyle: storageSetting.tagsViewStyle === undefined ? tagsViewStyle : storageSetting.tagsViewStyle,
      fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
      sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
      dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
      footerVisible: storageSetting.footerVisible === undefined ? footerVisible : storageSetting.footerVisible,
      footerContent: footerContent,
      isDark: isDark.value
    }),

    getters: {
      /**
       * 当前生效的主色。
       * 做成 getter 而不是 state，是因为预设区分明暗两套主色 ——
       * 存进 state 会和明暗模式不同步（切暗色后还留着亮色的主色）。
       */
      theme(state): string {
        if (state.customPrimary) {
          return state.customPrimary
        }
        return resolveTokens(getPreset(state.themeId), state.isDark).primary
      },
      /** 当前预设对象 */
      preset(state) {
        return getPreset(state.themeId)
      }
    },

    actions: {
      // 修改布局设置
      changeSetting(data: { key: string; value: any }) {
        const { key, value } = data
        if (this.hasOwnProperty(key)) {
          (this as any)[key] = value
        }
      },
      // 设置网页标题
      setTitle(title: string) {
        this.title = title
        useDynamicTitle()
      },

      /**
       * 按当前 themeId / customPrimary / isDark 重新应用主题。
       * 任何会影响主题的字段变更后都要调它，是唯一的"重算入口"。
       */
      refreshTheme() {
        applyTheme(getPreset(this.themeId), this.isDark, this.customPrimary || undefined)
      },

      /**
       * 按当前预设同步侧边栏深浅。
       *
       * 规则：只有预设**显式声明** sideTheme: 'theme-light' 且当前是亮色模式，才用浅色侧边栏；
       * 其余情况一律回到 theme-dark（框架的默认值）。
       *
       * 这里刻意不做"预设没声明就不动"的保守处理 —— 那样从「清爽」切到别的主题时，
       * theme-light 会残留在新主题上，出现深色主题配浅色侧边栏的错配。
       * 另外暗色模式下强制 theme-dark：深底配浅侧边栏不成体系，
       * 而且框架在 html.dark 里对 .theme-light 有 !important 覆盖，硬来会打架。
       */
      syncSideTheme() {
        const preset = getPreset(this.themeId)
        const want = !this.isDark && preset.sideTheme === 'theme-light' ? 'theme-light' : 'theme-dark'
        if (this.sideTheme !== want) {
          this.sideTheme = want
        }
      },

      /** 切换主题预设。主题包含明暗，所以这里会一并切换模式 */
      setTheme(themeId: string) {
        const preset = getPreset(themeId)
        this.themeId = themeId
        // 换预设时清掉自定义主色，否则会一直压着预设的颜色
        this.customPrimary = ''
        // 直接应用该主题声明的模式（不填 = 亮色）。
        // 注意这里用的是 ===，所以从「暗夜」切回「默认蓝」也会正确回到亮色；
        // setDark 内部会 syncSideTheme + refreshTheme + 落盘，不用重复调
        this.setDark(preset.preferDark === true)
      },

      /** 自定义主色 */
      setCustomPrimary(color: string) {
        this.customPrimary = color
        this.refreshTheme()
        this.persistThemeSetting()
      },

      /** 恢复预设自带的主色 */
      resetPrimary() {
        this.customPrimary = ''
        this.refreshTheme()
        this.persistThemeSetting()
      },

      /**
       * 只把「主题相关」的字段合并进已存的配置。
       *
       * 刻意不用 persistSetting() 整体覆盖 —— 那样会把用户在布局设置里改过、
       * 但还没点「保存配置」的项也一并固化，属于意外副作用。
       */
      persistThemeSetting() {
        const stored = loadSetting()
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...stored,
            themeId: this.themeId,
            customPrimary: this.customPrimary,
            sideTheme: this.sideTheme,
            isDark: this.isDark
          })
        )
      },

      /** 统一控制明暗，避免 isDark 的两个真源（pinia state / vueuse ref）不一致 */
      setDark(value: boolean) {
        isDark.value = value
        this.isDark = value
        this.syncSideTheme()
        // 自己负责重算与落盘，保证任何调用点离开时状态都是一致的 ——
        // 之前 setDark 单独调用时既不重算也不保存，导致"切了明暗刷新就没了"
        // （useDark 改 class 是异步的，等一帧再算，否则主色柔化会读到旧状态）
        nextTick(() => {
          this.refreshTheme()
          this.persistThemeSetting()
        })
      },

      // 切换暗黑模式
      toggleTheme() {
        this.setDark(!this.isDark)
      },

      /**
       * 把设置写入 localStorage。
       * 集中在这里构建对象，取代原先散在设置面板里的 11 行硬编码字段清单。
       */
      persistSetting() {
        const out: Record<string, any> = {}
        for (const [k, v] of Object.entries(this.$state)) {
          if (!TRANSIENT_KEYS.includes(k) && typeof v !== 'function') {
            out[k] = v
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(out))
      }
    }
  })

export default useSettingsStore
