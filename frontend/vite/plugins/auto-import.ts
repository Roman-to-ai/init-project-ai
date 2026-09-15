import autoImport from 'unplugin-auto-import/vite'

export default function createAutoImport() {
  return autoImport({
    imports: [
      'vue',
      'vue-router',
      'pinia',
      {
        '@/utils/dict': ['useDict'],
        // 按接口取选项 —— 生成器产出的页面用它，所以要和 useDict 一样自动导入，
        // 否则每个生成的页面都得手写一行 import
        '@/utils/options': ['useApiOptions'],
        '@/utils/common': ['selectDictLabel']
      }
    ],
    dts: true
  })
}

