<template>
  <div class="component-upload-image">
    <!-- 单图（limit=1）：保留原来的 picture-card 风格 -->
    <template v-if="limit === 1">
      <el-upload
        :disabled="disabled"
        :action="uploadImgUrl"
        list-type="picture-card"
        :on-success="handleUploadSuccess"
        :before-upload="handleBeforeUpload"
        :data="data"
        :limit="limit"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        ref="imageUpload"
        :before-remove="handleRemove"
        :show-file-list="true"
        :headers="headers"
        :file-list="fileList"
        :on-preview="handlePictureCardPreview"
        :class="{ hide: fileList.length >= limit }"
      >
        <el-icon class="avatar-uploader-icon"><plus /></el-icon>
      </el-upload>

      <el-dialog v-model="dialogVisible" title="预览" width="800px" append-to-body>
        <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto" />
      </el-dialog>
    </template>

    <!-- 多图（limit>1）：小缩略图 + 点击放大并可左右切换 -->
    <template v-else>
      <div class="image-thumb-wrap">
        <div ref="thumbListRef" class="image-thumb-list">
          <div
            v-for="(file, index) in fileList"
            :key="file.uid || file.name"
            class="image-thumb-item"
          >
            <el-image
              :src="file.url"
              fit="cover"
              class="image-thumb-item__img"
              :preview-src-list="previewSrcList"
              :initial-index="index"
              preview-teleported
            />
            <el-icon
              v-if="!disabled"
              class="image-thumb-item__delete"
              @click.stop="handleDeleteByIndex(index)"
            ><circle-close-filled /></el-icon>
          </div>
        </div>

        <el-upload
          v-if="!disabled && fileList.length < limit"
          :action="uploadImgUrl"
          :before-upload="handleBeforeUpload"
          :data="data"
          :limit="limit"
          :on-error="handleUploadError"
          :on-exceed="handleExceed"
          :on-success="handleUploadSuccess"
          :show-file-list="false"
          :headers="headers"
          class="image-thumb-upload"
          ref="imageUpload"
        >
          <el-icon class="image-thumb-upload__icon"><plus /></el-icon>
        </el-upload>
      </div>
    </template>

    <!-- 上传提示 -->
    <div class="el-upload__tip upload-image-tip" v-if="showTip && !disabled">
      <el-icon><info-filled /></el-icon>
      <span>
        支持 <b v-if="fileType">{{ fileType.join(" / ") }}</b>
        <template v-if="fileSize">，单张不超过 <b>{{ fileSize }}MB</b></template>
        <template v-if="limit > 1">，点击图片可放大并左右切换</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getToken } from "@/utils/auth"
import { isExternal } from "@/utils/validate"
import Sortable from 'sortablejs'
import type { UploadFileResult } from '@/types/api/common'

interface UploadImageItem {
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
  // 图片数量限制
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
    default: () => ["png", "jpg", "jpeg"]
  },
  // 是否显示提示
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 禁用组件（仅查看图片）
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
const uploadList = ref<UploadImageItem[]>([])
const dialogImageUrl = ref("")
const dialogVisible = ref(false)
const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + props.action)
const headers = ref({ Authorization: "Bearer " + getToken() })
const fileList = ref<UploadImageItem[]>([])
const thumbListRef = ref()
const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
)
// 多图预览列表：点击任一张都能打开 el-image 的大图查看器，并在里面左右切换
const previewSrcList = computed(() => fileList.value.map((f) => f.url))

watch(() => props.modelValue, (val: any) => {
  if (val) {
    // 首先将值转为数组
    const list = Array.isArray(val) ? val : (props.modelValue as string).split(",")
    // 然后将数组转为对象数组
    fileList.value = list.map((item: any) => {
      if (typeof item === "string") {
        if (item.indexOf(baseUrl) === -1 && !isExternal(item)) {
          item = { name: baseUrl + item, url: baseUrl + item }
        } else {
          item = { name: item, url: item }
        }
      }
      return item
    })
  } else {
    fileList.value = []
    return []
  }
},{ deep: true, immediate: true })

// 上传前loading加载
function handleBeforeUpload(file: File): boolean {
  let isImg = false
  if (props.fileType.length) {
    let fileExtension = ""
    if (file.name.lastIndexOf(".") > -1) {
      fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1)
    }
    isImg = props.fileType.some((type: string) => {
      if (file.type.indexOf(type) > -1) return true
      if (fileExtension && fileExtension.indexOf(type) > -1) return true
      return false
    })
  } else {
    isImg = file.type.indexOf("image") > -1
  }
  if (!isImg) {
    proxy.$modal.msgError(`文件格式不正确，请上传${props.fileType.join("/")}图片格式文件!`)
    return false
  }
  if (file.name.includes(',')) {
    proxy.$modal.msgError('文件名不正确，不能包含英文逗号!')
    return false
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      proxy.$modal.msgError(`上传头像图片大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }
  proxy.$modal.loading("正在上传图片，请稍候...")
  number.value++
  return true
}

// 文件个数超出
function handleExceed(): void {
  proxy.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
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
    proxy.$refs.imageUpload.handleRemove(file)
    uploadedSuccessfully()
  }
}

// 单图（picture-card）删除：before-remove 返回 false，由这里自己 splice
function handleRemove(file: any): boolean {
  const findex = fileList.value.map((f: UploadImageItem) => f.name).indexOf(file.name)
  if (findex > -1 && uploadList.value.length === number.value) {
    fileList.value.splice(findex, 1)
    emitValue()
    return false
  }
  return true
}

// 多图（缩略图）删除：按索引删
function handleDeleteByIndex(index: number): void {
  fileList.value.splice(index, 1)
  emitValue()
}

// 上传结束处理
function uploadedSuccessfully(): void {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter((f: UploadImageItem) => f.url !== undefined).concat(uploadList.value)
    uploadList.value = []
    number.value = 0
    emitValue()
    proxy.$modal.closeLoading()
  }
}

// 上传失败
function handleUploadError(): void {
  proxy.$modal.msgError("上传图片失败")
  proxy.$modal.closeLoading()
}

// 单图预览
function handlePictureCardPreview(file: any): void {
  dialogImageUrl.value = file.url || ''
  dialogVisible.value = true
}

// 对象转成指定字符串分隔
function listToString(list: UploadImageItem[], separator?: string): string {
  let strs = ""
  separator = separator || ","
  for (let i in list) {
    if (undefined !== list[i].url && list[i].url.indexOf("blob:") !== 0) {
      strs += list[i].url.replace(baseUrl, "") + separator
    }
  }
  return strs != "" ? strs.substr(0, strs.length - 1) : ""
}

// 对象数组转成 URL 数组（过滤与去 baseUrl 的规则和 listToString 完全一致，只是不拼逗号）
function listToArray(list: UploadImageItem[]): string[] {
  const urls: string[] = []
  for (const item of list) {
    if (undefined !== item.url && item.url.indexOf("blob:") !== 0) {
      urls.push(item.url.replace(baseUrl, ""))
    }
  }
  return urls
}

// 值的形状**跟父组件绑的一致**：绑数组就发数组、绑逗号串就发逗号串。
function emitValue(): void {
  emit("update:modelValue", Array.isArray(props.modelValue) ? listToArray(fileList.value) : listToString(fileList.value))
}

// 多图拖拽排序（拖缩略图本身，上传按钮不参与）
onMounted(() => {
  if (props.drag && !props.disabled && props.limit > 1) {
    nextTick(() => {
      const element = thumbListRef.value as HTMLElement
      if (element) {
        Sortable.create(element, {
          onEnd: (evt: any) => {
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
// 单图 picture-card：控制加号部分
:deep(.hide .el-upload--picture-card) {
  display: none;
}

:deep(.el-upload.el-upload--picture-card.is-disabled) {
  display: none !important;
}

// 多图缩略图
.image-thumb-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.image-thumb-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-thumb-item {
  position: relative;
  width: 64px;
  height: 64px;

  &__img {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    cursor: pointer;
    :deep(.el-image__inner) {
      border-radius: 4px;
    }
  }

  &__delete {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 16px;
    color: #909399;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s;
  }

  &:hover &__delete {
    opacity: 1;
  }
  &__delete:hover {
    color: #f56c6c;
  }
}

.image-thumb-upload {
  position: relative;
  width: 64px;
  height: 64px;
  border: 1px dashed #c0c4cc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;

  &__icon {
    font-size: 20px;
    color: #c0c4cc;
  }

  &:hover {
    border-color: var(--el-color-primary);
    .image-thumb-upload__icon {
      color: var(--el-color-primary);
    }
  }
}

.upload-image-tip {
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
</style>
