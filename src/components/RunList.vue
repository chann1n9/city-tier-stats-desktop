<script setup lang="ts">
import {
  NBadge,
  NEllipsis,
  NEmpty,
  NList,
  NListItem,
  NSpace,
  NSpin,
  NTag,
  NText,
  NThing,
  NCheckbox,
} from 'naive-ui'

type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface RunListItem {
  id: string
  imported_file_id: string
  status: AnalysisRunStatus
  total_count: number | null
  error_message: string | null
  started_at: string
  finished_at: string | null
  read_at: string | null
  original_name: string
  original_path: string | null
}

const props = withDefaults(defineProps<{
  runs: RunListItem[]
  loading: boolean
  emptyDescription?: string
  selectable?: boolean
  selectedRunIds?: string[]
}>(), {
  selectable: false,
  selectedRunIds: () => [],
})

const emit = defineEmits<{
  open: [run: RunListItem]
  'update:selectedRunIds': [selectedRunIds: string[]]
}>()

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

function handleClick(run: RunListItem) {
  if (props.selectable) {
    toggleSelected(run.id)
    return
  }

  emit('open', run)
}

function isSelected(runId: string) {
  return props.selectedRunIds.includes(runId)
}

function toggleSelected(runId: string) {
  setSelected(runId, !isSelected(runId))
}

function setSelected(runId: string, selected: boolean) {
  const nextSelectedRunIds = selected
    ? [...new Set([...props.selectedRunIds, runId])]
    : props.selectedRunIds.filter((id) => id !== runId)

  emit('update:selectedRunIds', nextSelectedRunIds)
}
</script>

<template>
  <n-spin :show="loading">
    <n-empty v-if="runs.length === 0" :description="emptyDescription ?? '暂无分析记录'" />

    <n-list v-else bordered hoverable clickable>
      <n-list-item
        v-for="run in runs"
        :key="run.id"
        @click="handleClick(run)"
      >
        <n-space align="center">
          <n-checkbox
            v-if="selectable"
            :checked="isSelected(run.id)"
            @click.stop="handleClick(run)"
          />
          <n-thing>
            <template #header>
              <n-badge v-if="run.read_at === null" dot style="margin-right: 6px" />
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
            <n-ellipsis v-else style="max-width: 900px;">
              <n-text depth="3">{{ run.original_path }}</n-text>
            </n-ellipsis>
          </n-thing>
        </n-space>
      </n-list-item>
    </n-list>
  </n-spin>
</template>
