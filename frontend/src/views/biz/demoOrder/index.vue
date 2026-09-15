<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">



      <el-form-item label="工单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入工单编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工单状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="请选择工单状态" clearable>
          <el-option
            v-for="dict in biz_order_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="计划数量" prop="planQty" v-show="expandQuery">
        <el-input
          v-model="queryParams.planQty"
          placeholder="请输入计划数量"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="计划开工时间" style="width: 308px" v-show="expandQuery">
        <el-date-picker
          v-model="daterangePlanStart"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
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
          v-hasPermi="['biz:demoOrder:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['biz:demoOrder:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:demoOrder:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:demoOrder:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="demoOrderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="工单ID" align="center" prop="orderId" min-width="100" />
      <el-table-column label="工单编号" align="center" prop="orderNo" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.orderNo" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.orderNo }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.orderNo }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productName" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.productName" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.productName }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.productName }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="工单状态" align="center" prop="orderStatus" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_order_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="计划数量" align="center" prop="planQty" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.planQty" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.planQty }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.planQty }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="计划开工时间" align="center" prop="planStart" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.planStart, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
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
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:demoOrder:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:demoOrder:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改演示工单对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="demoOrderRef" :model="form" :rules="rules" label-width="auto">
        <el-row>
          <el-col :span="24">
            <el-form-item label="工单编号" prop="orderNo">
              <el-input v-model="form.orderNo" placeholder="请输入工单编号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="工单状态" prop="orderStatus">
              <el-radio-group v-model="form.orderStatus">
                <el-radio
                  v-for="dict in biz_order_status"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="计划数量" prop="planQty">
              <el-input v-model="form.planQty" placeholder="请输入计划数量" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="计划开工时间" prop="planStart">
              <el-date-picker clearable
                v-model="form.planStart"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择计划开工时间">
              </el-date-picker>
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

<script setup lang="ts" name="DemoOrder">
import type { BizDemoOrder, DemoOrderQueryParams } from "@/types/api/biz/demoOrder"
import { listDemoOrder, getDemoOrder, delDemoOrder, addDemoOrder, updateDemoOrder } from "@/api/biz/demoOrder"

const { proxy } = getCurrentInstance()
const { biz_order_status } = useDict('biz_order_status')

const demoOrderList = ref<BizDemoOrder[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
// 「展开查看更多」开关。控制非常用查询条件的显隐（模板里用 v-show 挂在 el-form-item 上，
// 而不是 v-if —— 这样 resetQuery 的 resetForm 仍能收集到被折叠的字段，
// 否则会出现「看不见但仍在生效」的筛选条件）
const expandQuery = ref<boolean>(false)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const daterangePlanStart = ref<string[]>([])

const data = reactive({
  form: {} as BizDemoOrder,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
    productName: undefined,
    orderStatus: undefined,
    planQty: undefined,
    planStart: undefined,
  } as DemoOrderQueryParams,
  rules: {
    orderNo: [
      { required: true, message: "工单编号不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

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

/** 查询演示工单列表 */
function getList() {
  loading.value = true
  queryParams.value.params = {}
  if (null != daterangePlanStart.value && '' != daterangePlanStart.value) {
    queryParams.value.params["beginPlanStart"] = daterangePlanStart.value[0]
    queryParams.value.params["endPlanStart"] = daterangePlanStart.value[1]
  }
  listDemoOrder(queryParams.value).then(response => {
    demoOrderList.value = response.rows
    total.value = response.total
    loading.value = false
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
    orderId: null,
    orderNo: null,
    productName: null,
    orderStatus: null,
    planQty: null,
    planStart: null,
    delFlag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("demoOrderRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  daterangePlanStart.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection: BizDemoOrder[]) {
  ids.value = selection.map(item => item.orderId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}


/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加演示工单"
}

/** 修改按钮操作 */
function handleUpdate(row: BizDemoOrder) {
  reset()
  const _orderId = row.orderId || ids.value[0]
  getDemoOrder(_orderId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改演示工单"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["demoOrderRef"].validate((valid: boolean) => {
    if (valid) {
      if (form.value.orderId != null) {
        updateDemoOrder(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDemoOrder(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row: BizDemoOrder) {
  const _orderIds = row.orderId || ids.value
  proxy.$modal.confirm('是否确认删除演示工单编号为"' + _orderIds + '"的数据项？').then(function() {
    return delDemoOrder(_orderIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('biz/demoOrder/export', {
    ...queryParams.value
  }, `demoOrder_${new Date().getTime()}.xlsx`)
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
