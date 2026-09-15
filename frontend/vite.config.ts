import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import createVitePlugins from './vite/plugins'

const baseUrl = 'http://localhost:@@BACKEND_PORT@@' // 后端接口

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    // 部署根路径。默认 '/'（应用部署在域名根下）。
    // 若部署到子路径（如 https://example.com/admin/），改成 '/admin/'。
    // 原先这里是个恒等的三元（两个分支都是 '/'），已收敛掉。
    base: '/',
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      // https://cn.vitejs.dev/config/#resolve-alias
      alias: {
        // 设置路径
        '~': path.resolve(__dirname, './'),
        // 设置别名
        '@': path.resolve(__dirname, './src')
      },
      // https://cn.vitejs.dev/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // 打包配置
    build: {
      // https://vite.dev/config/build-options.html
      sourcemap: command === 'build' ? false : 'inline',
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    // vite 相关配置
    server: {
      // ⚠️ 端口写成 `Number("…")` 而不是裸占位符 —— 裸着的话模板态是
      //    `port: @@FRONTEND_PORT@@,`，**不是合法 TS**，会让 vue-tsc 撞上语法错误
      //    直接中止整个程序，于是 `typecheck` 这道门禁在模板仓里整个失效
      //    （报 1 个错而不是 436 个，还容易让人误跑 `--update` 把基线压塌）。
      //    包成字符串再转数字：模板态是 `Number("@@FRONTEND_PORT@@")` → NaN（模板从不运行），
      //    实例态是 `Number("8082")` → 8082，两边都是合法 TS。
      port: Number("@@FRONTEND_PORT@@"),
      host: true,
      open: true,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/dev-api': {
          target: baseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, '')
        },
         // springdoc proxy
         '^/v3/api-docs/(.*)': {
          target: baseUrl,
          changeOrigin: true,
        }
      }
    },
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule: any) => {
                if (atRule.name === 'charset') {
                  atRule.remove()
                }
              }
            }
          }
        ]
      }
    }
  }
})

