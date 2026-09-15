<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">



      <el-form-item label="分类名称" prop="categoryName">
        <el-input
          v-model="queryParams.categoryName"
          placeholder="请输入分类名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status" v-show="expandQuery">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in biz_category_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button link type="primary" :icon="expandQuery ? 'ArrowUp' : 'ArrowDown'" @click="toggleExpandQuery">{{ expandQuery ? '收起' : '展开查看更多' }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['biz:demoCategory:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Sort"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="demoCategoryList"
      row-key="categoryId"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column label="分类名称" prop="categoryName" min-width="100" />
      <el-table-column label="父分类ID" align="center" prop="parentId" min-width="110">
        <template #default="scope">
          <el-tooltip v-if="scope.row.parentId" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.parentId }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.parentId }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="祖级列表" align="center" prop="ancestors" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.ancestors" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.ancestors }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.ancestors }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="显示顺序" align="center" prop="orderNum" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.orderNum" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.orderNum }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.orderNum }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_category_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.remark" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.remark }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.remark }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:demoCategory:edit']">修改</el-button>
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['biz:demoCategory:add']">新增</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:demoCategory:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改演示产品分类对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="demoCategoryRef" :model="form" :rules="rules" label-width="auto">
        <el-row>
          <el-col :span="24">
            <el-form-item label="分类名称" prop="categoryName">
              <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="父分类ID" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="demoCategoryOptions"
                :props="{ value: 'categoryId', label: 'categoryName', children: 'children' }"
                value-key="categoryId"
                placeholder="请选择父分类ID"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="显示顺序" prop="orderNum">
              <el-input v-model="form.orderNum" placeholder="请输入显示顺序" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in biz_category_status"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DemoCategory">
import { listDemoCategory, getDemoCategory, delDemoCategory, addDemoCategory, updateDemoCategory } from "@/api/biz/demoCategory"
import type { BizDemoCategory, DemoCategoryQueryParams } from "@/types/api/biz/demoCategory"
import type { TreeSelect } from '@/types/api/common'

const { proxy } = getCurrentInstance()
const { biz_category_status } = useDict('biz_category_status')

const demoCategoryList = ref<any[]>([])
const demoCategoryOptions = ref<TreeSelect[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
// 「展开查看更多」开关。控制非常用查询条件的显隐（模板里用 v-show 挂在 el-form-item 上，
// 而不是 v-if —— 这样 resetQuery 的 resetForm 仍能收集到被折叠的字段，
// 否则会出现「看不见但仍在生效」的筛选条件）
const expandQuery = ref<boolean>(false)
const title = ref<string>("")
const isExpandAll = ref<boolean>(true)
const refreshTable = ref<boolean>(true)

const data = reactive({
  form: {} as BizDemoCategory,
  queryParams: {
    categoryName: undefined,
    status: undefined,
  } as DemoCategoryQueryParams,
  rules: {
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询演示产品分类列表 */
function getList() {
  loading.value = true
  listDemoCategory(queryParams.value).then(response => {
    demoCategoryList.value = proxy.handleTree(response.data, "categoryId", "parentId")
    loading.value = false
  })
}

/** 查询演示产品分类下拉树结构 */
function getTreeselect() {
  listDemoCategory().then(response => {
    demoCategoryOptions.value = []
    const data = { categoryId: 0, categoryName: '顶级节点', children: [] }
    data.children = proxy.handleTree(response.data, "categoryId", "parentId")
    demoCategoryOptions.value.push(data)
  })
}
	
/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    categoryId: null,
    categoryName: null,
    parentId: null,
    ancestors: null,
    orderNum: null,
    status: null,
    remark: null,
    delFlag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  }
  proxy.resetForm("demoCategoryRef")
}

/** 展开/收起非常用查询条件 */
function toggleExpandQuery() {
  expandQuery.value = !expandQuery.value
  // 右侧 RightToolbar 的放大镜在收起/展开整个搜索区时，会在 el-form 上留下内联的
  // max-height 且不保证清理掉（它的 setTimeout 调度在双层 requestAnimationFrame 之外，
  // 存在竞态）。而本页的「展开查看更多」会改变表单高度，一旦那个过期的 max-height 还在，
  // 新增的那一行就会被截断、点了没反应。这里主动清一次，代价可忽略。
  nextTick(() => {
    // 取 el-form 的根元素。**必须走 proxy.$refs** —— 模板里 ref="queryRef" 并不会
    // 在 <script setup> 里自动生成一个 queryRef 变量（除非显式 const queryRef = ref()），
    // 直接写 queryRef.value 会抛 ReferenceError。上游各页面统一用 proxy.$refs["xxx"]。
    const form = (proxy?.$refs["queryRef"] as { $el?: HTMLElement } | undefined)?.$el
    if (form && form.style.maxHeight) {
      form.style.maxHeight = ''
      form.style.overflow = ''
      form.style.transition = ''
      form.style.opacity = ''
    }
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}


/** 新增按钮操作 */
function handleAdd(row: BizDemoCategory) {
  reset()
  getTreeselect()
  if (row != null && row.categoryId) {
    form.value.parentId = row.categoryId
  } else {
    form.value.parentId = 0
  }
  open.value = true
  title.value = "添加演示产品分类"
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

/** 修改按钮操作 */
async function handleUpdate(row: BizDemoCategory) {
  reset()
  await getTreeselect()
  if (row != null) {
    form.value.parentId = row.parentId
  }
  getDemoCategory(row.categoryId!).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改演示产品分类"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["demoCategoryRef"].validate((valid: boolean) => {
    if (valid) {
      if (form.value.categoryId != null) {
        updateDemoCategory(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDemoCategory(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row: BizDemoCategory) {
  proxy.$modal.confirm('是否确认删除演示产品分类编号为"' + row.categoryId + '"的数据项？').then(function() {
    return delDemoCategory(row.categoryId!)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
/* 长文本单元格：最多两行，超出用省略号。完整内容由 el-tooltip 展示。
   注意 tooltip 的 popper 是 teleport 到 body 的，scoped 样式够不到它，
   所以那段宽度/换行控制写在列定义的**内联 style** 上。 */
.cell-clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 富文本查看弹窗。v-html 的内容不会被 scoped 加属性，内部元素要用 :deep() */
.rich-text-body {
  max-height: 60vh;
  overflow: auto;
  line-height: 1.7;

  :deep(img) {
    max-width: 100%;
  }
}
</style>
