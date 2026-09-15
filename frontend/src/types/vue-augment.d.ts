/**
 * Vue 全局属性的类型增强。
 *
 * ── 为什么单独一个文件 ──────────────────────────────────────────
 * `declare module 'vue'` 的含义取决于**本文件是不是模块**：
 *
 *   · 在**模块**文件里（有顶层 import / export）→ 类型**增强**（合并）
 *   · 在**非模块** .d.ts 里（没有顶层 import/export）→ **环境模块声明**，
 *     会把 vue 的整个类型**替换掉**
 *
 * 原先这段写在 src/types/global.d.ts（非模块）里，于是 vue 的类型被整体替换，
 * `App` / `createApp` / `DefineComponent` 等全部消失，vue-tsc 一跑就是一堆
 * "has no exported member"。末尾那个 `export {}` 就是把它变成模块的关键，
 * 别删。
 *
 * 这些属性注册在两处，改动时要同步：
 *   · src/main.ts          —— app.config.globalProperties.xxx
 *   · src/plugins/index.ts —— app.config.globalProperties.$xxx
 *
 * 类型一律用 `typeof import('...')` 内联引入，避免这个文件因为值导入
 * 而引入运行时依赖。
 */
export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    // ── 注册于 src/main.ts ──
    useDict: typeof import('@/utils/dict').useDict
    download: typeof import('@/utils/request').download
    parseTime: typeof import('@/utils/common').parseTime
    resetForm: typeof import('@/utils/common').resetForm
    handleTree: typeof import('@/utils/common').handleTree
    addDateRange: typeof import('@/utils/common').addDateRange
    getConfigKey: typeof import('@/api/system/config').getConfigKey
    selectDictLabel: typeof import('@/utils/common').selectDictLabel
    selectDictLabels: typeof import('@/utils/common').selectDictLabels

    // ── 注册于 src/plugins/index.ts ──
    $tab: typeof import('@/plugins/tab').default
    $auth: typeof import('@/plugins/auth').default
    $cache: typeof import('@/plugins/cache').default
    $modal: typeof import('@/plugins/modal').default
    $download: typeof import('@/plugins/download').default
  }
}
