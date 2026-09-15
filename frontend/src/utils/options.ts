import request from '@/utils/request'

/**
 * 选项的统一形状 —— 与 `useDict` 的产物**刻意保持一致**，
 * 这样模板里「字典」和「接口」两个分支可以共用同一段 `v-for`。
 *
 * 与 `@/components/DictTag` 里的 `DictOption` 结构兼容（那两个可选字段不给就行），
 * 所以结果可以直接喂 `<dict-tag :options="..."/>`。
 */
export interface FieldOption {
  label: string
  value: string | number
}

/**
 * 按接口取选项。
 *
 * 与 {@link useDict} 的分工：
 * - `useDict` —— 走**字典**接口，结果按 `dictType` 缓存进 Pinia，适合稳定的枚举
 * - `useApiOptions` —— 走**任意业务接口**，适合会变的数据（部门、设备、物料、客户…）
 *
 * 接口返回的数组元素用 `labelField` / `valueField` 指定取哪两个属性。
 * 这是沿用了 `treeselect` 的 `labelField` / `valueField` 惯例，全项目一致。
 *
 * @param url        接口地址（相对路径即可，走 `VITE_APP_BASE_API`）
 * @param labelField 显示字段名，默认 `label`
 * @param valueField 取值字段名，默认 `value`
 *
 * @example
 * // 生成器里的配置：
 * //   {"optionsApi":"/biz/demoCategory/list","optionLabel":"categoryName","optionValue":"categoryId"}
 * const options = useApiOptions('/biz/demoCategory/list', 'categoryName', 'categoryId')
 */
export function useApiOptions(url: string, labelField = 'label', valueField = 'value') {
  const options = ref<FieldOption[]>([])

  request({ url, method: 'get' })
    .then((resp: any) => {
      // 接口可能返回 TableDataInfo（{rows}）或 AjaxResult（{data}），两种都认
      const list = resp?.rows ?? resp?.data ?? []
      options.value = (Array.isArray(list) ? list : []).map((it: any) => ({
        label: String(it?.[labelField] ?? ''),
        // value 保持原始类型：ID 字段（categoryId / tagId）是数字，el-select 要用数字去匹配；
        // 强转成 String 会让「数字 id」对不上「字符串选项」，多选/回显就会显示成裸 id。
        value: it?.[valueField] ?? '',
      }))
    })
    .catch((e: unknown) => {
      // ⚠️ 不静默：接口挂了或路径写错，控件就是一个**空下拉**，用户只会觉得"没数据"。
      // 至少把地址和原因留在控制台，别让人从零开始猜。
      console.error(`[useApiOptions] 取选项失败：${url}`, e)
    })

  return options
}
