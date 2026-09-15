/**
 * ESLint 扁平配置（Vue 3 + TypeScript）
 *
 * ── 为什么是这个档位，不是更严的 ────────────────────────────────
 * 本仓库此前**完全没有 lint**，一上来跑最严的规则只会在存量噪音里淹掉信号。
 * 所以只取两个**正确性**档位：
 *
 *   · `flat/essential`        —— Vue 的必需规则（写法错误、易错点）
 *   · `vueTsConfigs.recommended` —— TS 推荐规则
 *
 * **刻意不加** `stylistic` / `strictTypeChecked`：
 *   · 格式类规则是 Prettier 的活，放进 ESLint 只会和 Prettier 打架
 *   · strict 档在 436 个存量类型错误之上再加噪音，基线会长到没法看
 *
 * 存量问题记进 `scripts/lint-baseline.json`，之后**只报新增**
 * （与 `typecheck.mjs` 同一个棘轮模式，见 `docs/基建/前端代码规范.md`）。
 *
 * ⚠️ 改这里的规则会让棘轮基线**大面积失效**（老问题全变成"新增"）。
 *    改完记得跑 `node scripts/lint-ratchet.mjs --update`。
 */

import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      // 自动生成，改了也会被覆盖（.editorconfig 同样排除它们）
      'src/auto-imports.d.ts',
      'src/components.d.ts',
      // ⚠️ 这个文件含**表达式位置**的模板占位符（`port: @@FRONTEND_PORT@@`），
      //    在模板态下不是合法 TS，解析失败。留着它会让棘轮基线在
      //    「模板态报 1 个解析错误 / 实例态报若干真问题」之间反复跳 ——
      //    而**基线必须在两种状态下都成立**，否则每次切状态都是假漂移。
      //    前端其余含占位符的文件（3 个 .vue）占位符都在字符串里，解析正常，不用排除。
      //    这个文件的正确性由 `vite build` 兜底。
      'vite.config.ts',
    ],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
)
