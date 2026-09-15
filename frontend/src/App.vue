<template>
  <router-view />
</template>

<script setup lang="ts">
import useSettingsStore from '@/store/modules/settings'

// 启动即应用主题。
// 放在 setup 里同步执行（而不是原来的 onMounted + nextTick），
// 尽早把 CSS 变量写下去，缩短首屏闪一下默认配色的时间。
// 具体应用逻辑见 utils/theme.ts 的 applyTheme。
useSettingsStore().refreshTheme()
</script>
