<template>
  <div class="table-select">
    <el-input
      v-model="displayText"
      readonly
      :placeholder="placeholder"
      class="table-select__trigger"
      @click="open"
    >
      <template #append>
        <el-button icon="Search" @click="open" />
      </template>
    </el-input>

    <el-dialog :title="title" v-model="visible" width="800px" top="5vh" append-to-body @closed="handleClosed">
      <el-form :inline="true" @submit.prevent>
        <el-form-item>
          <el-input
            v-model="keyword"
            :placeholder="isTree ? '输入关键字过滤' : '输入关键字搜索'"
            clearable
            style="width: 220px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="rows"
        height="360px"
        highlight-current-row
        :row-key="valueField"
        :tree-props="{ children: 'children' }"
        :default-expand-all="isTree"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="multiple" type="selection" width="55" align="center" />
        <el-table-column
          v-for="col in tableColumns"
          :key="col.prop"
          :label="col.label"
          :prop="col.prop"
          show-overflow-tooltip
        >
          <template v-if="col.dictType" #default="scope">
            <dict-tag :options="dictRefs[col.dictType]" :value="scope.row[col.prop]" />
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="getList"
      />

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirm">确 定</el-button>
          <el-button @click="visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 表格选择器：点开弹窗 → 搜索 + 表格（目标带 parentField 时是树形表格）→ 选一条（或多条）
// → 回传 id（update:modelValue）与选中行（select，父页面拿它把名称写进冗余显示列）。
//
// 数据来源就是目标模块的**列表接口**：平铺目标走后端分页 + 关键字搜索；
// 树形目标没法分页（分页的树没意义），一次拉全量后在本地过滤。
import request from '@/utils/request'
import { useDict } from '@/utils/dict'

interface PickerColumn {
  label: string
  prop: string
  /** 字典类型（可选）：配了就把该列原始值（0/1）显示成字典标签 */
  dictType?: string
}

const props = defineProps({
  /** 选中的 id（multiple 时是 id 数组） */
  modelValue: { type: [Number, String, Array], default: null },
  /** 目标模块的列表接口，如 /biz/demoCategory/list */
  api: { type: String, required: true },
  /** 取值字段（对应接口返回的键） */
  valueField: { type: String, default: 'id' },
  /** 名称字段（对应接口返回的键） */
  labelField: { type: String, default: 'label' },
  /** 有它就按**树形**处理（后端不分页，表格可展开） */
  parentField: { type: String, default: '' },
  /** 表格要展示的列；不传则只显示名称列 */
  columns: { type: Array as () => PickerColumn[], default: () => [] },
  multiple: { type: Boolean, default: false },
  placeholder: { type: String, default: '点击选择' },
  title: { type: String, default: '选择记录' },
  /** 平铺目标的每页条数 */
  pageSize: { type: Number, default: 10 }
})

const emit = defineEmits(['update:modelValue', 'select'])

const { proxy } = getCurrentInstance() as any

const visible = ref(false)
const loading = ref(false)
const keyword = ref('')
/** 表格里显示的行（树形目标是树） */
const rows = ref<any[]>([])
const total = ref(0)
const query = ref({ pageNum: 1, pageSize: props.pageSize })
/** 弹窗里当前勾选/点选的行 */
const current = ref<any[]>([])
/** 已确认的行 —— 只用来显示名称，避免为了显示再去查一次 */
const picked = ref<any[]>([])

const isTree = computed(() => !!props.parentField)
const tableColumns = computed<PickerColumn[]>(() =>
  props.columns && props.columns.length ? props.columns : [{ label: '名称', prop: props.labelField }]
)
// 字典列（pickerColumns 里带 dictType）的选项：把 0/1 显示成字典标签
const dictTypes = (props.columns || []).filter((c) => c.dictType).map((c) => c.dictType as string)
const dictRefs = reactive<Record<string, any>>({})
if (dictTypes.length) {
  const refs = useDict(...dictTypes)
  dictTypes.forEach((t) => { dictRefs[t] = refs[t] })
}
const selectedIds = computed<any[]>(() => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') return []
  return Array.isArray(v) ? v : [v]
})
const displayText = computed(() => {
  const names = picked.value.map((r: any) => r?.[props.labelField]).filter(Boolean)
  // 名称还没解析出来时退化成显示 id —— 至少知道「筛了哪一条」
  return names.length ? names.join(', ') : selectedIds.value.join(', ')
})

/** 打开弹窗：清空上一次的选择状态，再拉数据 */
function open(): void {
  visible.value = true
  keyword.value = ''
  query.value.pageNum = 1
  current.value = []
  getList()
}

function handleClosed(): void {
  rows.value = []
  total.value = 0
}

/**
 * 取数据。
 * 树形：一次拉全量 → 建树 → 关键字在本地过滤（分页的树没意义）。
 * 平铺：后端分页 + 关键字（关键字发到 labelField 对应的那个查询列上）。
 */
function getList(): void {
  loading.value = true
  const params: Record<string, any> = isTree.value
    ? {}
    : {
        pageNum: query.value.pageNum,
        pageSize: query.value.pageSize,
        ...(keyword.value ? { [props.labelField]: keyword.value } : {})
      }
  request({ url: props.api, method: 'get', params })
    .then((res: any) => {
      const list = res?.rows ?? res?.data ?? []
      const data = Array.isArray(list) ? list : []
      if (isTree.value) {
        const tree = proxy.handleTree(data, props.valueField, props.parentField) || []
        rows.value = keyword.value ? filterTree(tree, keyword.value) : tree
        total.value = 0
      } else {
        rows.value = data
        total.value = res?.total ?? data.length
      }
    })
    .catch((e: unknown) => {
      // ⚠️ 不静默：接口挂了或路径写错，用户只会看到空表格
      proxy.$modal.msgError('取数据失败，请检查接口地址')
      console.error(`[TableSelect] 取数据失败：${props.api}`, e)
    })
    .finally(() => {
      loading.value = false
      // 回显：把已选 id 对应的行标出来
      nextTick(() => markCurrent())
    })
}

/** 树形目标的关键字过滤：命中节点自己或它的任一祖先/后代就保留 */
function filterTree(nodes: any[], kw: string): any[] {
  const lower = kw.toLowerCase()
  const result: any[] = []
  nodes.forEach((node: any) => {
    const children = node.children ? filterTree(node.children, kw) : []
    const hit = String(node[props.labelField] ?? '').toLowerCase().includes(lower)
    if (hit || children.length) {
      result.push({ ...node, children })
    }
  })
  return result
}

/** 把已选的行在表格里选中（翻开第一页时能对上就行） */
function markCurrent(): void {
  const table = proxy.$refs['tableRef']
  if (!table) return
  const ids = selectedIds.value.map((v) => String(v))
  const matched = flatten(rows.value).filter((r: any) => ids.includes(String(r?.[props.valueField])))
  matched.forEach((row: any) => {
    if (props.multiple) {
      table.toggleRowSelection(row, true)
    } else if (matched.length === 1) {
      table.setCurrentRow(row)
      current.value = [row]
    }
  })
}

function flatten(nodes: any[]): any[] {
  const out: any[] = []
  nodes.forEach((n: any) => {
    out.push(n)
    if (n.children?.length) out.push(...flatten(n.children))
  })
  return out
}

function search(): void {
  query.value.pageNum = 1
  getList()
}

function reset(): void {
  keyword.value = ''
  query.value.pageNum = 1
  getList()
}

/** 行点击：单选直接选中；多选由 selection 列负责 */
function handleRowClick(row: any): void {
  if (props.multiple) {
    proxy.$refs['tableRef']?.toggleRowSelection(row)
  } else {
    current.value = [row]
    proxy.$refs['tableRef']?.setCurrentRow(row)
  }
}

function handleSelectionChange(rows: any[]): void {
  current.value = rows
}

function confirm(): void {
  const rows = props.multiple ? current.value : current.value.slice(0, 1)
  if (!rows.length) {
    proxy.$modal.msgWarning('请先选择一条记录')
    return
  }
  picked.value = rows
  emit('update:modelValue', props.multiple ? rows.map((r) => r[props.valueField]) : rows[0]?.[props.valueField])
  emit('select', props.multiple ? rows : rows[0])
  visible.value = false
}

/**
 * 回显名称：值是从外面进来的（新增页没有、编辑页有 id），而我们手上只有 id。
 * 走**详情接口**（`{列表地址}/{id}`，生成器产物的标准路由）拿一次名称，拿不到就退化成显示 id。
 */
function resolveLabel(): void {
  const ids = selectedIds.value
  if (!ids.length) {
    picked.value = []
    return
  }
  // 已知的直接跳过（比如刚从弹窗里选完）
  const known = new Set(picked.value.map((r: any) => String(r?.[props.valueField])))
  const need = ids.filter((id) => !known.has(String(id)))
  if (!need.length) return
  const base = props.api.replace(/\/list$/, '')
  need.forEach((id) => {
    request({ url: `${base}/${id}`, method: 'get' })
      .then((res: any) => {
        const row = res?.data
        if (row && row[props.labelField] !== undefined) {
          picked.value = [...picked.value, row]
        }
      })
      .catch((e: unknown) => {
        console.error(`[TableSelect] 回显名称失败：${base}/${id}`, e)
      })
  })
}

watch(() => props.modelValue, () => {
  if (props.multiple) {
    // 多选时整组变化就重查，简单可靠
    if (selectedIds.value.length !== picked.value.length) resolveLabel()
  } else {
    resolveLabel()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.table-select {
  width: 100%;
}
.table-select__trigger {
  :deep(.el-input__inner) {
    cursor: pointer;
  }
}
</style>
