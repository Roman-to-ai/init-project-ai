<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">



      <el-form-item label="标签名称" prop="tagName">
        <el-input
          v-model="queryParams.tagName"
          placeholder="请输入标签名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="标签颜色" prop="tagColor">
        <el-input
          v-model="queryParams.tagColor"
          placeholder="请输入标签颜色"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="状态" prop="status">
        <el-input
          v-model="queryParams.status"
          placeholder="请输入状态"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['biz:demoTag:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['biz:demoTag:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:demoTag:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:demoTag:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="demoTagList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="标签ID" align="center" prop="tagId" min-width="100" />
      <el-table-column label="标签名称" align="center" prop="tagName" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.tagName" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.tagName }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.tagName }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="标签颜色" align="center" prop="tagColor" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.tagColor" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.tagColor }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.tagColor }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="100" />
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
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:demoTag:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:demoTag:remove']">删除</el-button>
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

    <!-- 添加或修改æ¼”ç¤ºæ ‡ç­¾对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="demoTagRef" :model="form" :rules="rules" label-width="auto">
        <el-row>
          <el-col :span="24">
            <el-form-item label="标签名称" prop="tagName">
              <el-input v-model="form.tagName" placeholder="请输入标签名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标签颜色" prop="tagColor">
              <el-input v-model="form.tagColor" placeholder="请输入标签颜色" />
            </el-form-item>
          </el-col>
          <!-- ⚠️ 兜底分支，不要删。
               以前这里没有兜底 —— htmlType 没配或拼错时整个 el-form-item 不渲染，
               字段**静默消失**。「配了模板不认识的 htmlType 字段就没了」那类坑
               的根源就在这儿。现在退化成普通文本框。
               注：这段注释里**不能出现那个指令名本身** —— Velocity 连 HTML 注释
               里的指令也会解析，写了会直接报 "Encountered ... Was expecting"。 -->
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-input v-model="form.status" placeholder="请输入状态" />
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
          <el-button @click="clearForm">清 空</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DemoTag">
import type { BizDemoTag, DemoTagQueryParams } from "@/types/api/biz/demoTag"
import { listDemoTag, getDemoTag, delDemoTag, addDemoTag, updateDemoTag } from "@/api/biz/demoTag"

const { proxy } = getCurrentInstance()

const demoTagList = ref<BizDemoTag[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")

const data = reactive({
  form: {} as BizDemoTag,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    tagName: undefined,
    tagColor: undefined,
    status: undefined,
  } as DemoTagQueryParams,
  rules: {
    tagName: [
      { required: true, message: "标签名称不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)


/** 查询æ¼”ç¤ºæ ‡ç­¾列表 */
function getList() {
  loading.value = true
  listDemoTag(queryParams.value).then(response => {
    demoTagList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 清空按钮操作：不关弹窗，只把字段（含子表）恢复成初始状态。
 *  **文本字段写空串而不是 null** —— RuoYi 的 update 是「只写非 null 字段」的部分更新，
 *  留在 null 的话点确定时老值会**静默保留**（界面上看着清了、库里没清）。
 *  数字/日期类没法这么办（只吃 null，而 null 会被跳过），仍是保留原值。
 *  **保留主键** —— 编辑态下清空是「把这条记录抹掉重填」，清完点确定仍更新这条，
 *  而不是静默变成新增（标题还写着「修改」却插了一条，那太意外了）。 */
function clearForm() {
  proxy.$modal.confirm('确认清空已填内容？').then(() => {
    const _tagId = form.value.tagId
    reset()
    form.value.tagId = _tagId
    form.value.tagName = ''
    form.value.tagColor = ''
    form.value.status = ''
    form.value.remark = ''
  }).catch(() => {})
}

/** 表单重置 */
function reset() {
  form.value = {
    tagId: null,
    tagName: null,
    tagColor: null,
    status: null,
    delFlag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("demoTagRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection: BizDemoTag[]) {
  ids.value = selection.map(item => item.tagId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}


/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加æ¼”ç¤ºæ ‡ç­¾"
}

/** 修改按钮操作 */
function handleUpdate(row: BizDemoTag) {
  reset()
  const _tagId = row.tagId || ids.value[0]
  getDemoTag(_tagId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = "修改æ¼”ç¤ºæ ‡ç­¾"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["demoTagRef"].validate((valid: boolean) => {
    if (valid) {
      if (form.value.tagId != null) {
        updateDemoTag(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDemoTag(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row: BizDemoTag) {
  const _tagIds = row.tagId || ids.value
  proxy.$modal.confirm('是否确认删除æ¼”ç¤ºæ ‡ç­¾编号为"' + _tagIds + '"的数据项？').then(function() {
    return delDemoTag(_tagIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('biz/demoTag/export', {
    ...queryParams.value
  }, `demoTag_${new Date().getTime()}.xlsx`)
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
