<template>
  <div :class="['sidebar-theme-wrapper', {'has-logo':showLogo}, sideTheme]" class="sidebar-container">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <!--
        注意：这里刻意不再传 :background-color / :text-color / :active-text-color。
        Element Plus 内部会用 new TinyColor(props.backgroundColor).shade(20) 计算悬停色，
        遇到 'var(--sidebar-bg)' 这类 CSS 变量字符串会解析失败、产出 rgb(0,0,0)，
        目前只是被样式块里那条 !important 规则掩盖着。
        配色改由下方 CSS 变量下发，主题切换也能即时生效。
      -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        :class="sideTheme"
      >
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="route.path + index"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const showLogo = computed(() => settingsStore.sidebarLogo)
const sideTheme = computed(() => settingsStore.sideTheme)
const theme = computed(() => settingsStore.theme)
const isCollapse = computed(() => !appStore.sidebar.opened)

// 获取菜单背景色
// 说明：原先 light 分支读的是 variables.module.scss 的 :export（构建期常量，运行时无法随主题变），
// 现改为返回 CSS 变量引用。取值已与原常量逐一对齐：menuBg=#1a1f2e、menuLightBg=#ffffff。
const getMenuBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  return sideTheme.value === 'theme-dark' ? 'var(--sidebar-bg)' : 'var(--sidebar-light-bg)'
})

// 获取菜单文字颜色
// 对齐关系：menuText=#bfcbd9、menuLightText=#303133
const getMenuTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)'
  }
  return sideTheme.value === 'theme-dark' ? 'var(--sidebar-text)' : 'var(--sidebar-light-text)'
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})
</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: v-bind(getMenuBackground);
  
  .scrollbar-wrapper {
    background-color: v-bind(getMenuBackground);
  }

  // .el-menu 是 ElMenu 组件的根元素，会继承父组件的 scope 属性，所以这里的规则能生效。
  // 而 .el-menu-item / .el-sub-menu__title 不是组件根，拿不到 scope 属性
  // （实测 hasScopeAttr 均为 false）—— 它们原先那几条 color: v-bind(...) 规则从未匹配过，已删除。
  // 菜单项最终颜色 = 全局 sidebar.scss 的规则 + 下面这几个 --el-menu-* 变量。
  .el-menu {
    --el-menu-bg-color: v-bind(getMenuBackground);
    --el-menu-text-color: v-bind(getMenuTextColor);
    --el-menu-active-color: v-bind(theme);
    --el-menu-hover-bg-color: var(--menu-hover, rgba(0, 0, 0, 0.06));

    border: none;
    height: 100%;
    width: 100% !important;
  }
}
</style>
