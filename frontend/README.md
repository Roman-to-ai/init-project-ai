# 前端（Vue 3 + TypeScript）

> **本目录是模板的「前端」一半，不是独立仓库。**
> 项目说明、启动方式、文档索引都在**仓库根**：见 [`../CLAUDE.md`](../CLAUDE.md)
> 和 [`../docs/README.md`](../docs/README.md)。

## 技术栈

Vue 3.5 / TypeScript 5.6 / Vite 6 / Element Plus / Pinia / pnpm。

## 目录

| 目录 | 内容 |
|---|---|
| `src/api/<模块>/` | 请求封装（一个业务模块一个文件） |
| `src/views/<模块>/` | 页面 |
| `src/types/api/<模块>/` | 类型定义（barrel 在 `src/types/api/index.ts`） |
| `src/config/themes.ts` | **主题注册表** —— 加一套主题只需在这里加一个对象 |
| `src/layout/` | 布局、侧边栏、设置面板 |
| `src/components/` | 通用组件（含上传、富文本、`RightToolbar` 等） |
| `src/utils/theme.ts` | 主题引擎（`applyTheme`） |

## 开发

```bash
pnpm -C frontend dev      # http://localhost，端口 @@FRONTEND_PORT@@
```

> `pnpm install` 只在依赖有变动时需要。首次安装会有 `ERR_PNPM_IGNORED_BUILDS` 警告 ——
> **是误报**，可以忽略。

## 约定

- 权限用 `v-hasPermi`，串必须和后端 `@PreAuthorize` / `sys_menu.perms` 逐字一致
- 改样式一律写 `var(--token, 当前值)`，不要硬编码颜色
- 类型检查是**棘轮**：`node scripts/typecheck.mjs`（只报新增错误）

细节见：

- [`docs/基建/主题系统.md`](../docs/基建/主题系统.md)
- [`docs/基建/类型检查棘轮.md`](../docs/基建/类型检查棘轮.md)
- [`docs/基建/像素回归测试.md`](../docs/基建/像素回归测试.md)

## 许可

MIT。上游版权声明与许可全文见 [`LICENSE`](./LICENSE)。
