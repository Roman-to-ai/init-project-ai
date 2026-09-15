<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 v-else class="sidebar-title">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/logo/logo.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = import.meta.env.VITE_APP_TITLE
const settingsStore = useSettingsStore()
const sideTheme = computed(() => settingsStore.sideTheme)

// 说明：原先这里读的是 variables.module.scss 的 :export（variables.menuBg 等），
// 那是**构建期常量** —— 编译进 CSS Modules 后运行时无法随主题变化。
// 统一改为返回 CSS 变量引用，这样主题切换能即时生效。
// 各变量的取值与原 SCSS 常量逐一核对过，默认外观不变。

// 获取Logo背景色
const getLogoBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  if (settingsStore.navType == 3) {
    return 'var(--sidebar-light-bg)'
  }
  return sideTheme.value === 'theme-dark' ? 'var(--sidebar-bg)' : 'var(--sidebar-light-bg)'
})

// 获取Logo文字颜色
const getLogoTextColor = computed(() => {
  if (settingsStore.isDark) {
    // 深色模式下由 html.dark 提供 --sidebar-logo-text
    return 'var(--sidebar-logo-text)'
  }
  if (settingsStore.navType == 3) {
    return 'var(--sidebar-light-logo-text)'
  }
  // 原先 theme-dark 分支硬编码 '#fff'，现改为读令牌（:root 里同样是 #ffffff）
  return sideTheme.value === 'theme-dark' ? 'var(--sidebar-logo-text)' : 'var(--sidebar-light-logo-text)'
})
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  height: 50px;
  line-height: 50px;
  background: v-bind(getLogoBackground);
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: v-bind(getLogoTextColor);
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>