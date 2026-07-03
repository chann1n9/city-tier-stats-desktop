<script setup lang="ts">
import {
  NFlex,
  NH1,
  NPagination,
  NSpace,
  NText,
} from 'naive-ui'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RunList from '@/components/RunList.vue'
import BackFloatButton from '@/components/BackFloatButton.vue'
import { useInboxSessionStore, type InboxSessionRun } from '@/stores/inboxSession'

interface SearchAnalysisRunsResult {
  items: InboxSessionRun[]
  total: number
}

const route = useRoute()
const router = useRouter()
const inboxSessionStore = useInboxSessionStore()
const pageRoot = ref<HTMLElement | null>(null)
const runs = ref<InboxSessionRun[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(25)

onMounted(async () => {
  if (route.query.from !== 'home' && restoreSession()) {
    await restoreScrollPosition()
    return
  }

  inboxSessionStore.clearSession()
  inboxSessionStore.createSession()
  void loadRuns()
})

onBeforeUnmount(() => {
  saveScrollPosition()
})

function restoreSession() {
  const session = inboxSessionStore.session

  if (!session) {
    return false
  }

  runs.value = session.items
  total.value = session.total
  page.value = session.page
  pageSize.value = session.pageSize

  return true
}

function getScrollElement() {
  let element = pageRoot.value?.parentElement ?? null

  while (element) {
    const style = window.getComputedStyle(element)
    const canScroll = element.scrollHeight > element.clientHeight
      && ['auto', 'scroll', 'overlay'].includes(style.overflowY)

    if (canScroll) {
      return element
    }

    element = element.parentElement
  }

  return null
}

function getScrollTop() {
  return getScrollElement()?.scrollTop ?? window.scrollY
}

function setScrollTop(value: number) {
  const scrollElement = getScrollElement()

  if (scrollElement) {
    scrollElement.scrollTop = value
    return
  }

  window.scrollTo({ top: value })
}

function saveScrollPosition() {
  inboxSessionStore.setScrollTop(getScrollTop())
}

async function restoreScrollPosition() {
  await nextTick()
  window.requestAnimationFrame(() => {
    setScrollTop(inboxSessionStore.session?.scrollTop ?? 0)
  })
}

async function loadRuns() {
  loading.value = true

  try {
    const result = await window.ipcRenderer.invoke('runs:search', {
      readState: 'unread',
      page: page.value,
      pageSize: pageSize.value,
    }) as SearchAnalysisRunsResult

    runs.value = result.items
    total.value = result.total
    inboxSessionStore.setResults({
      items: result.items,
      total: result.total,
      page: page.value,
      pageSize: pageSize.value,
    })
  } finally {
    loading.value = false
  }
}

async function handlePageChange() {
  await loadRuns()
}

async function handlePageSizeChange() {
  page.value = 1
  await loadRuns()
}

function openRun(run: InboxSessionRun) {
  void router.push({
    name: 'detail',
    params: { fileId: run.imported_file_id },
    query: { runId: run.id, from: 'inbox' },
  })
}
</script>

<template>
  <BackFloatButton @click="router.push({ name: 'home' })" />
  <section ref="pageRoot" class="page-shell page-shell--top-with-floating-action inbox-page">
    <n-flex vertical :size="24">
      <n-flex align="center" justify="space-between">
        <n-h1 style="margin: 0">未查看结果</n-h1>
        <n-space align="center">
          <n-text depth="3">共 {{ total }} 条</n-text>
        </n-space>
      </n-flex>

      <RunList
        :runs="runs"
        :loading="loading"
        empty-description="暂无待查看分析结果"
        @open="openRun"
      />

      <n-flex v-if="total > 0" justify="end">
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[25, 50, 100]"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-flex>
    </n-flex>
  </section>
</template>

<style scoped>
.inbox-page :deep(.n-list-item__divider) {
  left: 20px;
  right: 20px;
}
</style>
