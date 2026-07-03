<script setup lang="ts">
import { NFlex, NDivider } from 'naive-ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UploadDragger from '@/components/UploadDragger.vue'
import InboxEntrance from '@/components/InboxEntrance.vue'
import History from '@/components/History.vue'

interface ImportAndAnalyzeResult {
  items: Array<{
    importedFileId: string
    runId: string
    status: 'completed' | 'failed'
    resultJsonPath: string | null
    errorMessage: string | null
  }>
}

const router = useRouter()
const analyzing = ref(false)
const historyKey = ref(0)
const flashKey = ref(0)

async function handleAnalyze(payload: { filePaths: string[]; groupBy: boolean }) {
  analyzing.value = true

  try {
    const result = await window.ipcRenderer.invoke(
      'files:import-and-analyze',
      payload,
    ) as ImportAndAnalyzeResult

    historyKey.value += 1
    flashKey.value += 1

    if (result.items.length === 1 && result.items[0].status === 'completed') {
      await router.push({
        name: 'detail',
        params: {
          fileId: result.items[0].importedFileId,
        },
        query: {
          runId: result.items[0].runId,
          from: 'home',
        },
      })
    }
  } finally {
    analyzing.value = false
  }
}
</script>

<template>
  <section class="page-shell page-shell--narrow">
    <n-flex vertical>
      <UploadDragger :analyzing="analyzing" @analyze="handleAnalyze" />
      <InboxEntrance :flash-key="flashKey" />
      <n-divider title-placement="center">历史分析</n-divider>
      <History :key="historyKey" />
    </n-flex>
  </section>
</template>
