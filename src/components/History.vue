<script setup lang="ts">
import { NEllipsis, NEmpty, NList, NListItem, NSpace, NTag, NText, NThing } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'

interface AnalysisRunListItem {
  id: string
  imported_file_id: string
  status: AnalysisRunStatus
  total_count: number | null
  error_message: string | null
  started_at: string
  finished_at: string | null
  original_name: string
  original_path: string | null
}

interface SearchAnalysisRunsResult {
  items: AnalysisRunListItem[]
  total: number
}

const router = useRouter()
const runs = ref<AnalysisRunListItem[]>([])

onMounted(() => {
  void loadRuns()
})

async function loadRuns() {
  const result = await window.ipcRenderer.invoke('runs:search', {
    sortOrder: 'started_at_desc',
    page: 1,
    pageSize: 5,
  }) as SearchAnalysisRunsResult

  runs.value = result.items
}

function openRun(run: AnalysisRunListItem) {
  void router.push({
    name: 'detail',
    params: { fileId: run.imported_file_id },
    query: { runId: run.id, from: 'home' },
  })
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusType(statusValue: AnalysisRunStatus) {
  if (statusValue === 'completed') return 'success'
  if (statusValue === 'failed') return 'error'
  if (statusValue === 'running') return 'warning'
  return 'default'
}

function statusLabel(statusValue: AnalysisRunStatus) {
  const labels: Record<AnalysisRunStatus, string> = {
    queued: '排队中',
    running: '分析中',
    completed: '已完成',
    failed: '失败',
  }

  return labels[statusValue]
}
</script>

<template>
  <div class="history">
    <n-empty v-if="runs.length === 0" description="暂无历史记录" />

    <n-list v-else bordered hoverable clickable>
      <n-list-item
        v-for="run in runs"
        :key="run.id"
        @click="openRun(run)"
      >
        <n-thing>
          <template #header>
            <n-ellipsis>
              {{ run.original_name }}
            </n-ellipsis>
          </template>

          <template #description>
            <n-space>
              <n-tag size="small" :type="statusType(run.status)">
                {{ statusLabel(run.status) }}
              </n-tag>
              <n-text depth="3">{{ formatDateTime(run.started_at) }}</n-text>
              <n-text v-if="run.total_count !== null" depth="3">
                {{ run.total_count }} 行
              </n-text>
            </n-space>
          </template>

          <n-ellipsis v-if="run.error_message" :line-clamp="2">
            <n-text type="error">{{ run.error_message }}</n-text>
          </n-ellipsis>
          <n-ellipsis v-else style="max-width: 800px">
            <n-text depth="3">{{ run.original_path }}</n-text>
          </n-ellipsis>
        </n-thing>
      </n-list-item>

      <n-list-item align="center" @click="router.push({ name: 'search', query: { from: 'home' } })">
        <n-text>展示更多</n-text>
      </n-list-item>
    </n-list>
  </div>
</template>

<style scoped>
.history :deep(.n-list-item__divider) {
  left: 20px;
  right: 20px;
}
</style>
