<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { NIcon, NUpload, NUploadDragger, NText, NP, NGradientText, NButton, type UploadFileInfo } from 'naive-ui'

defineProps<{
  analyzing?: boolean
}>()

const emit = defineEmits<{
  analyze: [payload: { filePaths: string[]; groupBy: boolean }]
}>()

const fileList = ref<UploadFileInfo[]>([])

const filePaths = computed(() => {
  return fileList.value
    .map(fileInfo => fileInfo.file ? window.fileSystem.getPathForFile(fileInfo.file) : '')
    .filter((filePath): filePath is string => Boolean(filePath))
})

function handleAnalyze() {
  try {
    if (filePaths.value.length === 0) {
      return
    }

    emit('analyze', {
      filePaths: filePaths.value,
      groupBy: true,
    })
  } finally {
    fileList.value = []
  }
}
</script>

<template>
  <n-upload
    v-model:file-list="fileList"
    multiple
    directory-dnd
    accept=".xlsx,.csv"
    :default-upload="false"
  >
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <ArchiveIcon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px">
        点击或者拖动文件到该区域来上传
      </n-text>
      <n-p depth="3" style="margin: 8px 0 0 0">
        支持xlsx、csv格式的文件
      </n-p>
    </n-upload-dragger>
  </n-upload>

  <div>
    给 
    <n-gradient-text style="color: var(--app-accent);">
      归属地
    </n-gradient-text>
    做城市等级分类，并按
    <n-gradient-text style="color: var(--app-accent);">
      企微名称
    </n-gradient-text>
    分组统计。
  </div>

  <n-button
    type="primary"
    style="margin-top: 12px"
    :disabled="filePaths.length === 0"
    :loading="analyzing"
    @click="handleAnalyze"
  >
    开始分析
  </n-button>

</template>
