<template>
  <div>
    <el-button v-if="list.length" link type="primary" @click="visible = true">查看</el-button>
    <span v-else>-</span>

    <el-dialog :title="title" v-model="visible" width="640px" append-to-body>
      <el-table :data="list" size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="文件名" prop="name" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="90">
          <template #default="scope">
            <el-button link type="primary" @click="handleDownload(scope.row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import request from '@/utils/request'
import { saveAs } from 'file-saver'

const props = defineProps({
  // 多值列出参是数组（@MultiValue），老数据/手写页面也可能是逗号串 —— 两种都吃
  value: { type: [Array, String], default: () => [] },
  label: { type: String, default: '附件列表' }
})

const visible = ref(false)
const title = computed(() => props.label)

interface FileItem {
  url: string
  name: string
}

const list = computed<FileItem[]>(() => {
  const arr: string[] = Array.isArray(props.value)
    ? (props.value as string[])
    : props.value ? String(props.value).split(',') : []
  return arr.filter(Boolean).map(url => ({ url, name: getFileName(url) }))
})

// 上传文件名形如 原文件名_序列号.扩展名（FileUploadUtils.extractFilename），展示时去掉序列号
function getFileName(url: string): string {
  const seg = url.split('/').pop() || url
  return seg.replace(/_\d+(?=\.[^.]+$)/, '')
}

async function handleDownload(row: FileItem) {
  try {
    // 走 /common/download/resource 才能带 token（浏览器直接 window.open 导航不带 Authorization），
    // 响应是 blob（响应拦截器对 blob 直接返回 data），再用 file-saver 存盘。
    const data: any = await request.get('/common/download/resource', {
      params: { resource: row.url },
      responseType: 'blob'
    })
    saveAs(new Blob([data]), row.name)
  } catch (e) {
    console.error('下载失败', e)
  }
}
</script>
