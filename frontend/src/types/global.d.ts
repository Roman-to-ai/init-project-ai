/**
 * 环境模块声明 —— 只给**自身不带类型**的包补声明。
 *
 * ⚠️ 本文件是**非模块**的 .d.ts（没有顶层 import / export）。
 *    在这里写 `declare module 'x'` 是「环境模块声明」，会**整体替换** x 的类型，
 *    而不是给它做增强。所以：
 *
 *      · 对**自带类型**的包写声明 = 把人家好好的类型抹成 `any`（破坏性）
 *      · 对 vue 写 `declare module 'vue'` = 把 vue 的类型整个替换掉，
 *        `App` / `createApp` 等全部消失
 *
 *    增强 vue 全局属性请改 src/types/vue-augment.d.ts（那里是模块文件）。
 *
 * 判断某个包该不该写在这里：看它 package.json 有没有 types/typings 字段，
 * 或包内有没有 .d.ts。
 *     node -e "console.log(require('./node_modules/<包名>/package.json').types)"
 *
 * 当前清单（均已核对：这些包自身不带类型）
 *   nprogress / js-cookie / file-saver / sortablejs —— 无 types 字段
 *   jsencrypt/bin/jsencrypt.min —— jsencrypt 本体有类型，但这个**子路径**没有
 *   vuedraggable/dist/vuedraggable.common —— 同上，子路径没有
 *
 * 已移除（都自带类型，之前的声明是破坏性的）
 *   element-plus (es/index.d.ts) / axios (index.d.ts)
 *   @vueup/vue-quill (dist/vue-quill.d.ts) / fuse.js (dist/fuse.d.ts)
 *   vue-cropper (lib/typings/index.d.ts) / splitpanes（未安装且无引用）
 */

/** 让 TS 认识 .vue 单文件组件 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** Vite 环境变量类型（与 .env.* 里的键一一对应） */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_BASE_API: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ── 以下为无类型包的补声明 ──────────────────────────────────────

// nprogress
declare module 'nprogress' {
  export interface NProgressOptions {
    minimum?: number
    template?: string
    easing?: string
    speed?: number
    trickle?: boolean
    trickleSpeed?: number
    showSpinner?: boolean
    parent?: string
    barSelector?: string
  }

  export interface NProgress {
    start(): NProgress
    set(n: number): NProgress
    inc(amount?: number): NProgress
    done(force?: boolean): NProgress
    remove(): void
    configure(options: NProgressOptions): NProgress
    status: number | null
  }

  const nprogress: NProgress
  export default nprogress
}

// js-cookie
declare module 'js-cookie' {
  export default Cookies
}

// file-saver
declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, options?: any): void
  export function saveAs(data: Blob | string, filename?: string, disableAutoBOM?: boolean): void
  export default saveAs
}

// jsencrypt 的压缩包入口（主包自带类型，这个子路径没有）
declare module 'jsencrypt/bin/jsencrypt.min' {
  import JSEncrypt from 'jsencrypt'
  export default JSEncrypt
}

// sortablejs
declare module 'sortablejs' {
  export interface SortableEvent {
    oldIndex: number;
    newIndex: number;
  }

  export interface SortableOptions {
    ghostClass?: string;
    onEnd?: (evt: SortableEvent) => void;
  }

  export default class Sortable {
    static create(el: HTMLElement, options: SortableOptions): Sortable;
  }
}

// vuedraggable 的 common 入口（主包在 src/vuedraggable.d.ts，这个子路径没有）
declare module 'vuedraggable/dist/vuedraggable.common' {
  import { DefineComponent } from 'vue'
  const draggable: DefineComponent
  export default draggable
}
