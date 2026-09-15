<template>
  <div class="upload-file">
    <el-upload
      multiple
      drag
      :action="uploadFileUrl"
      :before-upload="handleBeforeUpload"
      :file-list="fileList"
      :data="data"
      :limit="limit"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      :headers="headers"
      class="upload-file-uploader"
      ref="fileUpload"
      v-if="!disabled"
    >
      <el-icon class="upload-file-uploader__icon"><upload-filled /></el-icon>
      <div class="upload-file-uploader__text">将文件拖到此处，或<em>点击上传</em></div>
    </el-upload>

    <div class="el-upload__tip upload-file-tip" v-if="showTip && !disabled">
      <el-icon><info-filled /></el-icon>
      <span>
        支持 <b v-if="fileType">{{ fileType.join(" / ") }}</b>
        <template v-if="fileSize">，单文件不超过 <b>{{ fileSize }}MB</b></template>
      </span>
    </div>

    <transition-group ref="uploadFileList" name="el-fade-in-linear" tag="ul" class="upload-file-list">
      <li :key="file.uid" class="upload-file-item" v-for="(file, index) in fileList">
        <el-icon class="upload-file-item__icon"><document /></el-icon>
        <el-link class="upload-file-item__name" :href="`${baseUrl}${file.url}`" underline="never" target="_blank">
          {{ getFileName(file.name) }}
        </el-link>
        <el-icon v-if="!disabled" class="upload-file-item__remove" @click="handleDelete(index)"><delete /></el-icon>
      </li>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { getToken } from "@/utils/auth"
import Sortable from 'sortablejs'
import type { UploadFileResult } from '@/types/api/common'

interface UploadFileItem {
  uid?: number | string;
  name: string;
  url: string;
}

const props = defineProps({
  modelValue: [String, Object, Array],
  // 上传接口地址
  action: {
    type: String,
    default: "/common/upload"
  },
  // 上传携带的参数
  data: {
    type: Object
  },
  // 数量限制
  limit: {
    type: Number,
    default: 5
  },
  // 大小限制(MB)
  fileSize: {
    type: Number,
    default: 5
  },
  // 文件类型, 例如['png', 'jpg', 'jpeg']
  fileType: {
    type: Array as () => string[],
    default: () => ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf"]
  },
  // 是否显示提示
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 禁用组件（仅查看文件）
  disabled: {
    type: Boolean,
    default: false
  },
  // 拖动排序
  drag: {
    type: Boolean,
    default: true
  }
})

const { proxy } = getCurrentInstance()
const emit = defineEmits()
const number = ref(0)
const uploadList = ref<UploadFileItem[]>([])
const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action) // 上传文件服务器地址
const headers = ref({ Authorization: "Bearer " + getToken() })
const fileList = ref<UploadFileItem[]>([])
const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
)

watch(() => props.modelValue, (val: any) => {
  if (val) {
    let temp = 1
    // 首先将值转为数组
    const list = Array.isArray(val) ? val : props.modelValue.split(',')
    // 然后将数组转为对象数组
    fileList.value = list.map((item: any) => {
      if (typeof item === "string") {
        item = { name: item, url: item }
      }
      item.uid = item.uid || new Date().getTime() + temp++
      return item
    })
  } else {
    fileList.value = []
    return []
  }
},{ deep: true, immediate: true })

// 上传前校检格式和大小
function handleBeforeUpload(file: File): boolean {
  // 校检文件类型
  if (props.fileType.length > 0) {
    const fileName = file.name.split('.')
    const fileExt = fileName[fileName.length - 1]
    const isTypeOk = props.fileType.indexOf(fileExt) >= 0
    if (!isTypeOk) {
      proxy.$modal.msgError(`文件格式不正确，请上传${props.fileType.join("/")}格式文件!`)
      return false
    }
  }
  // 校检文件名是否包含特殊字符
  if (file.name.includes(',')) {
    proxy.$modal.msgError('文件名不正确，不能包含英文逗号!')
    return false
  }
  // 校检文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      proxy.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }
  proxy.$modal.loading("正在上传文件，请稍候...")
  number.value++
  return true
}

// 文件个数超出
function handleExceed(): void {
  proxy.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
}

// 上传失败
function handleUploadError(err: Error): void {
  proxy.$modal.msgError("上传文件失败")
  proxy.$modal.closeLoading()
}

// 上传成功回调
function handleUploadSuccess(res: UploadFileResult, file: any): void {
  if (res.code === 200) {
    uploadList.value.push({ name: res.fileName, url: res.fileName })
    uploadedSuccessfully()
  } else {
    number.value--
    proxy.$modal.closeLoading()
    proxy.$modal.msgError(res.msg)
    proxy.$refs.fileUpload.handleRemove(file)
    uploadedSuccessfully()
  }
}

// 删除文件
function handleDelete(index: number): void {
  fileList.value.splice(index, 1)
  emitValue()
}

// 上传结束处理
function uploadedSuccessfully(): void {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter((f: UploadFileItem) => f.url !== undefined).concat(uploadList.value)
    uploadList.value = []
    number.value = 0
    emitValue()
    proxy.$modal.closeLoading()
  }
}

// 获取文件名称
function getFileName(name: string): string {
  // 如果是url那么取最后的名字 如果不是直接返回
  if (name.lastIndexOf("/") > -1) {
    return name.slice(name.lastIndexOf("/") + 1)
  } else {
    return name
  }
}

// 对象转成指定字符串分隔
function listToString(list: UploadFileItem[], separator?: string): string {
  let strs = ""
  separator = separator || ","
  for (let i in list) {
    if (list[i].url) {
      strs += list[i].url + separator
    }
  }
  return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

// 对象数组转成 URL 数组（过滤规则与 listToString 完全一致，只是不拼逗号）
function listToArray(list: UploadFileItem[]): string[] {
  const urls: string[] = []
  for (const item of list) {
    if (item.url) {
      urls.push(item.url)
    }
  }
  return urls
}

// 值的形状**跟父组件绑的一致**：绑数组就发数组、绑逗号串就发逗号串。
// 生成器产出的页面绑的是数组（后端 @MultiValue 的出参就是数组、入参也收数组），
// 手写页面绑字符串的照旧 —— 所以这个改动对既有页面是透明的。
function emitValue(): void {
  emit("update:modelValue", Array.isArray(props.modelValue) ? listToArray(fileList.value) : listToString(fileList.value))
}

// 初始化拖拽排序
onMounted(() => {
  if (props.drag && !props.disabled) {
    nextTick(() => {
      const element = proxy.$refs.uploadFileList?.$el || proxy.$refs.uploadFileList as HTMLElement
      if (element) {
        Sortable.create(element, {
          ghostClass: 'file-upload-darg',
          onEnd: (evt) => {
            const movedItem = fileList.value.splice(evt.oldIndex, 1)[0]
            fileList.value.splice(evt.newIndex, 0, movedItem)
            emitValue()
          }
        })
      }
    })
  }
})
</script>
<style scoped lang="scss">
.file-upload-darg {
  opacity: 0.5;
  background: #c8ebfb;
}
.upload-file-uploader {
  margin-bottom: 8px;
  :deep(.el-upload-dragger) {
    padding: 24px 16px;
    border-radius: 6px;
  }
  &__icon {
    font-size: 32px;
    color: #c0c4cc;
    margin-bottom: 8px;
  }
  &__text {
    color: #909399;
    font-size: 13px;
    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }
}
.upload-file-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  b {
    color: #f56c6c;
    font-weight: 400;
  }
}
.upload-file-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  .upload-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-bottom: 6px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
    &__icon {
      font-size: 20px;
      color: var(--el-color-primary);
      flex-shrink: 0;
    }
    &__name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }
    &__remove {
      font-size: 16px;
      color: #909399;
      cursor: pointer;
      flex-shrink: 0;
      &:hover {
        color: #f56c6c;
      }
    }
  }
}
</style>
