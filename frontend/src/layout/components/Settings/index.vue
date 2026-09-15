<template>
  <el-drawer v-model="showSettings" :withHeader="false" :lock-scroll="false" direction="rtl" size="300px">
    <div class="setting-drawer-title">
      <h3 class="drawer-title">菜单导航设置</h3>
    </div>
    <div class="nav-wrap">
      <el-tooltip content="左侧菜单" placement="bottom">
        <div class="item left" @click="handleNavType(1)" :class="{ activeItem: navType == 1 }">
          <b></b><b></b>
        </div>
      </el-tooltip>

      <el-tooltip content="混合菜单" placement="bottom">
        <div class="item mix" @click="handleNavType(2)" :class="{ activeItem: navType == 2 }">
          <b></b><b></b>
        </div>
      </el-tooltip>
      <el-tooltip content="顶部菜单" placement="bottom">
        <div class="item top" @click="handleNavType(3)" :class="{ activeItem: navType == 3 }">
          <b></b><b></b>
        </div>
      </el-tooltip>
    </div>
    <div class="setting-drawer-title">
      <h3 class="drawer-title">主题风格设置</h3>
    </div>
    <div class="setting-drawer-block-checbox">
      <div class="setting-drawer-block-checbox-item" @click="handleTheme('theme-dark')">
        <img src="@/assets/images/dark.svg" alt="dark" />
        <div v-if="sideTheme === 'theme-dark'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
          <i aria-label="图标: check" class="anticon anticon-check">
            <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class>
              <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
            </svg>
          </i>
        </div>
      </div>
      <div class="setting-drawer-block-checbox-item" @click="handleTheme('theme-light')">
        <img src="@/assets/images/light.svg" alt="light" />
        <div v-if="sideTheme === 'theme-light'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
          <i aria-label="图标: check" class="anticon anticon-check">
            <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class>
              <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
            </svg>
          </i>
        </div>
      </div>
    </div>
    <div class="drawer-item theme-preset-label">
      <span>主题方案</span>
    </div>
    <!-- 主题色卡：每张缩略图用预设自己的颜色渲染，加一套主题自动多一张卡 -->
    <div class="theme-preset-grid">
      <el-tooltip
        v-for="p in themePresets"
        :key="p.id"
        :content="p.description"
        placement="bottom"
      >
        <div
          class="theme-preset-card"
          :class="{ active: settingsStore.themeId === p.id }"
          :style="{
            '--c-sidebar': p.light.sidebarBg,
            '--c-navbar': p.light.navbarBg,
            '--c-page': p.light.pageBg || '#ffffff',
            '--c-primary': p.light.primary
          }"
          @click="handlePresetChange(p.id)"
        >
          <span class="bar-side"></span>
          <span class="bar-top"></span>
          <span class="dot"></span>
          <span class="theme-name">{{ p.name }}</span>
        </div>
      </el-tooltip>
    </div>

    <div class="drawer-item">
      <span>主题颜色</span>
      <span class="comp-style">
        <el-color-picker v-model="customTheme" :predefine="predefineColors" @change="themeChange"/>
      </span>
    </div>
    <div v-if="settingsStore.customPrimary" class="drawer-item">
      <span></span>
      <span class="comp-style">
        <el-button link type="primary" size="small" @click="settingsStore.resetPrimary()">
          恢复预设主色
        </el-button>
      </span>
    </div>
    <el-divider />

    <h3 class="drawer-title">系统布局配置</h3>

    <div class="drawer-item">
      <span>开启页签</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>持久化标签页</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsViewPersist" :disabled="!settingsStore.tagsView" @change="tagsViewPersistChange" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示页签图标</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsIcon" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>标签页样式</span>
      <span class="comp-style">
        <el-radio-group v-model="settingsStore.tagsViewStyle" :disabled="!settingsStore.tagsView" size="small">
          <el-radio-button label="card">卡片</el-radio-button>
          <el-radio-button label="chrome">谷歌</el-radio-button>
        </el-radio-group>
      </span>
    </div>

    <div class="drawer-item">
      <span>固定 Header</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.fixedHeader" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示 Logo</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.sidebarLogo" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>动态标题</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.dynamicTitle" @change="dynamicTitleChange" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>底部版权</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.footerVisible" class="drawer-switch" />
      </span>
    </div>

    <el-divider />

    <el-button type="primary" plain icon="DocumentAdd" @click="saveSetting">保存配置</el-button>
    <el-button plain icon="Refresh" @click="resetSetting">重置配置</el-button>
  </el-drawer>

</template>

<script setup lang="ts">
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import { THEME_PRESETS } from '@/config/themes'

const { proxy } = getCurrentInstance()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const showSettings = ref<boolean>(false)
const themePresets = THEME_PRESETS
// 下面几个原先都是本地 ref 快照，与 store 构成两份真源、容易不同步，统一改成只读 computed。
// 注意 watch(() => navType, ...) 的写法保持不变：getter 返回的是 ref 对象本身，
// 回调里的 val.value 正是取值方式，实测该 watcher 工作正常，不要"顺手"改成 val。
const navType = computed(() => settingsStore.navType)
const sideTheme = computed(() => settingsStore.sideTheme)
const tagsViewPersist = computed(() => settingsStore.tagsViewPersist)
const storeSettings = computed(() => settingsStore)
// 主题色取色器：显示当前生效的主色；用户改动即视为自定义主色，压过预设
const customTheme = computed({
  get: () => settingsStore.theme,
  set: (v: string) => {
    if (v) settingsStore.setCustomPrimary(v)
  }
})
// 预置色 = 各主题自带的主色 + 原有常用色。加主题时预置色自动增加
const predefineColors = ref<string[]>([
  ...THEME_PRESETS.map((p) => p.light.primary),
  "#ff4500", "#ff8c00", "#ffd700", "#90ee90", "#00ced1", "#1e90ff", "#c71585"
])

/** 是否需要dynamicTitle */
function dynamicTitleChange(): void {
  useSettingsStore().setTitle(useSettingsStore().title)
}

function tagsViewPersistChange(val: boolean): void {
  settingsStore.tagsViewPersist = val
}

/** 切换主题预设 */
function handlePresetChange(id: string): void {
  settingsStore.setTheme(id)
}

function themeChange(val: string | null): void {
  if (val) settingsStore.setCustomPrimary(val)
}

function handleTheme(val: string): void {
  settingsStore.sideTheme = val
}

function handleNavType(val: number): void {
  settingsStore.navType = val
}

/** 菜单导航设置 */
watch(() => navType, (val: any) => {
  if (val.value == 1) {
    appStore.sidebar.opened = true
    appStore.toggleSideBarHide(false)
  }
  if (val.value == 2) {
    appStore.sidebar.opened = true
  }
  if (val.value == 3) {
    appStore.sidebar.opened = false
    appStore.toggleSideBarHide(true)
  }
  if ([1, 3].includes(val.value)) {
      permissionStore.setSidebarRouters(permissionStore.defaultRoutes)
  }
  }, { immediate: true, deep: true }
)

function saveSetting(): void {
  proxy.$modal.loading("正在保存到本地，请稍候...")
  if (!tagsViewPersist.value) {
    proxy.$cache.local.remove('tags-view-visited')
  }
  // 字段清单集中在 store 的 persistSetting 里维护，不再在这里硬编码，
  // 避免"加了设置项但忘了加进保存列表"
  settingsStore.persistSetting()
  setTimeout(proxy.$modal.closeLoading(), 1000)
}

function resetSetting(): void {
  proxy.$cache.local.remove('tags-view-visited')
  proxy.$modal.loading("正在清除设置缓存并刷新，请稍候...")
  localStorage.removeItem("layout-setting")
  // 原先漏了这一句：不清 vueuse 的明暗缓存，导致"重置"后明暗模式不还原
  localStorage.removeItem("vueuse-color-scheme")
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

function openSetting(): void {
  showSettings.value = true
}

defineExpose({
  openSetting
})
</script>

<style lang='scss' scoped>
.setting-drawer-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary, rgba(0, 0, 0, 0.85));
  line-height: 22px;
  font-weight: bold;

  .drawer-title {
    font-size: 14px;
  }
}

/* ---------------- 主题方案色卡 ----------------
 * 每张卡是一个「迷你界面」示意：左侧竖条=侧边栏、顶部横条=顶栏、中央圆点=主色。
 * 颜色全部来自 :style 绑定的 --c-* 变量（取值即预设自己的颜色），
 * 所以新增一套主题会自动多出一张正确的缩略图，不需要配图。
 */
.theme-preset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 16px;
}

.theme-preset-card {
  position: relative;
  width: 74px;
  height: 56px;
  border-radius: 6px;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  background: var(--c-page);
  /* 亮色主题的顶栏本身是白的，没有这圈内描边卡片会糊在抽屉背景里看不出边界 */
  box-shadow: inset 0 0 0 1px var(--el-border-color-lighter, #e4e7ed);
  transition: border-color 0.2s, transform 0.15s;

  .bar-side {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 15px;
    background: var(--c-sidebar);
  }

  .bar-top {
    position: absolute;
    left: 15px;
    right: 0;
    top: 0;
    height: 12px;
    background: var(--c-navbar);
  }

  .dot {
    position: absolute;
    left: 15px;
    right: 0;
    top: 22px;
    margin: 0 auto;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--c-primary);
  }

  .theme-name {
    position: absolute;
    left: 15px;
    right: 0;
    bottom: 5px;
    text-align: center;
    font-size: 10px;
    line-height: 1;
    white-space: nowrap;
    color: var(--el-text-color-secondary, #909399);
  }

  &:hover {
    transform: translateY(-1px);
  }

  &.active {
    border-color: var(--c-primary);

    .theme-name {
      color: var(--c-primary);
      font-weight: 600;
    }
  }
}

.setting-drawer-block-checbox {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 20px;

  .setting-drawer-block-checbox-item {
    position: relative;
    margin-right: 16px;
    border-radius: 2px;
    cursor: pointer;

    img {
      width: 48px;
      height: 48px;
    }

    .setting-drawer-block-checbox-selectIcon {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      padding-top: 15px;
      padding-left: 24px;
      color: #1890ff;
      font-weight: 700;
      font-size: 14px;
    }
  }
}

.drawer-item {
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
  padding: 12px 0;
  font-size: 14px;

  .comp-style {
    float: right;
    margin: -3px 8px 0px 0px;
  }
}

// 导航模式
.nav-wrap {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 20px;

  .activeItem {
    border: 2px solid var(--el-color-primary) !important;
  }

  .item {
    position: relative;
    margin-right: 16px;
    cursor: pointer;
    width: 56px;
    height: 48px;
    border-radius: 4px;
    background: #f0f2f5;
    border: 2px solid transparent;
  }

  .left {
    b:first-child {
      display: block;
      height: 30%;
      background: #fff;
    }
    b:last-child {
      width: 30%;
      background: #1b2a47;
      position: absolute;
      height: 100%;
      top: 0;
      border-radius: 4px 0 0 4px;
    }
  }
  .mix {
    b:first-child {
      border-radius: 4px 4px 0 0;
      display: block;
      height: 30%;
      background: #1b2a47;
    }
    b:last-child {
      width: 30%;
      background: #1b2a47;
      position: absolute;
      height: 70%;
      border-radius: 0 0 0 4px;
    }
  }
  .top {
    b:first-child {
      display: block;
      height: 30%;
      background: #1b2a47;
      border-radius: 4px 4px 0 0;
    }
  }
}
</style>