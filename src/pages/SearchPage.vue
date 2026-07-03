<script setup lang="ts">
import {
  NButton,
  NButtonGroup,
  NCollapseTransition,
  NDatePicker,
  NFlex,
  NH1,
  NH3,
  NIcon,
  NInput,
  NInputGroup,
  NPagination,
  NTag,
  NText,
  NBadge,
  NEllipsis,
  NCheckbox,
  NPopconfirm,
  useMessage,
} from 'naive-ui'
import { SearchOutline, TrashOutline } from '@vicons/ionicons5'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RunList, { type RunListItem } from '@/components/RunList.vue'
import { useSearchSessionStore } from '@/stores/searchSession'

type ReadStateFilter = 'all' | 'unread' | 'read'
type ActiveFilterKey = 'readState' | 'keyword' | 'startedAtRange'

interface ReadStateCounts {
  all: number
  unread: number
  read: number
}

interface SearchAnalysisRunsResult {
  items: RunListItem[]
  total: number
  readStateCounts: ReadStateCounts
}

interface ActiveFilterTag {
  key: ActiveFilterKey
  label: string
}

interface DeleteRunsResult {
  items: Array<{
    id: string
    importedFileId: string
    resultJsonPath: string | null
  }>
}

const router = useRouter()
const route = useRoute()
const message = useMessage()
const searchSessionStore = useSearchSessionStore()
const pageRoot = ref<HTMLElement | null>(null)
const runs = ref<RunListItem[]>([])
const loading = ref(false)
const total = ref(0)
const readStateCounts = ref<ReadStateCounts>({ all: 0, unread: 0, read: 0 })
const keyword = ref('')
const readState = ref<ReadStateFilter>('all')
const startedAtRange = ref<[number, number] | null>(null)
const page = ref(1)
const pageSize = ref(25)
const suppressKeywordSearch = ref(false)
const selectable = ref(false)
const selectedRunIds = ref<string[]>([])
const deleting = ref(false)
let keywordSearchTimer: number | undefined

const isSearching = computed(() => (
  keyword.value.trim().length > 0
  || readState.value !== 'all'
  || startedAtRange.value !== null
))

const readStateOptions: Array<{ label: string; value: ReadStateFilter }> = [
  { label: '全部', value: 'all' },
  { label: '未查看', value: 'unread' },
  { label: '已查看', value: 'read' },
]

const readStateLabels: Record<ReadStateFilter, string> = {
  all: '全部',
  unread: '未查看',
  read: '已查看',
}

const activeFilterTags = computed<ActiveFilterTag[]>(() => {
  const tags: ActiveFilterTag[] = []
  const normalizedKeyword = keyword.value.trim()

  if (readState.value !== 'all') {
    tags.push({
      key: 'readState',
      label: readStateLabels[readState.value],
    })
  }

  if (normalizedKeyword) {
    tags.push({
      key: 'keyword',
      label: `名称: ${normalizedKeyword}`,
    })
  }

  if (startedAtRange.value) {
    tags.push({
      key: 'startedAtRange',
      label: `日期: ${formatDate(startedAtRange.value[0])} - ${formatDate(startedAtRange.value[1])}`,
    })
  }

  return tags
})

const currentPageRunIds = computed(() => runs.value.map((run) => run.id))
const selectedRunIdSet = computed(() => new Set(selectedRunIds.value))
const isCurrentPageAllSelected = computed(() => (
  currentPageRunIds.value.length > 0
  && currentPageRunIds.value.every((runId) => selectedRunIdSet.value.has(runId))
))
const isCurrentPageIndeterminate = computed(() => (
  currentPageRunIds.value.some((runId) => selectedRunIdSet.value.has(runId))
  && !isCurrentPageAllSelected.value
))

onMounted(async () => {
  if (route.query.from !== 'home' && restoreSession()) {
    await restoreScrollPosition()
    return
  }

  searchSessionStore.clearSession()
  searchSessionStore.createSession()
  void loadRuns()
})

onBeforeUnmount(() => {
  window.clearTimeout(keywordSearchTimer)
  saveScrollPosition()
})

watch(keyword, () => {
  if (suppressKeywordSearch.value) {
    return
  }

  scheduleKeywordSearch()
})

watch(selectable, (value) => {
  if (!value) {
    selectedRunIds.value = []
  }
})

function restoreSession() {
  const session = searchSessionStore.session

  if (!session) {
    return false
  }

  suppressKeywordSearch.value = true
  keyword.value = session.filters.keyword
  readState.value = session.filters.readState
  startedAtRange.value = session.filters.startedAtRange
  page.value = session.filters.page
  pageSize.value = session.filters.pageSize
  runs.value = session.items
  total.value = session.total
  readStateCounts.value = session.readStateCounts
  void nextTick(() => {
    suppressKeywordSearch.value = false
  })

  return true
}

function scheduleKeywordSearch() {
  window.clearTimeout(keywordSearchTimer)
  keywordSearchTimer = window.setTimeout(() => {
    void handleSearch()
  }, 300)
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
  searchSessionStore.setScrollTop(getScrollTop())
}

async function restoreScrollPosition() {
  await nextTick()
  window.requestAnimationFrame(() => {
    setScrollTop(searchSessionStore.session?.scrollTop ?? 0)
  })
}

function getStartedAtRange() {
  if (!startedAtRange.value) {
    return {
      startedAtFrom: undefined,
      startedAtTo: undefined,
    }
  }

  const [from, to] = startedAtRange.value
  const fromDate = new Date(from)
  const toDate = new Date(to)

  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(23, 59, 59, 999)

  return {
    startedAtFrom: fromDate.toISOString(),
    startedAtTo: toDate.toISOString(),
  }
}

async function loadRuns() {
  loading.value = true

  try {
    const { startedAtFrom, startedAtTo } = getStartedAtRange()
    const result = await window.ipcRenderer.invoke('runs:search', {
      keyword: keyword.value.trim(),
      readState: readState.value === 'all' ? undefined : readState.value,
      startedAtFrom,
      startedAtTo,
      page: page.value,
      pageSize: pageSize.value,
    }) as SearchAnalysisRunsResult

    runs.value = result.items
    total.value = result.total
    readStateCounts.value = result.readStateCounts
    searchSessionStore.updateFilters({
      keyword: keyword.value,
      readState: readState.value,
      startedAtRange: startedAtRange.value,
      page: page.value,
      pageSize: pageSize.value,
    })
    searchSessionStore.setResults({
      items: result.items,
      total: result.total,
      readStateCounts: result.readStateCounts,
    })
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  page.value = 1
  await loadRuns()
}

async function resetFilters() {
  keyword.value = ''
  readState.value = 'all'
  startedAtRange.value = null
  page.value = 1
  await loadRuns()
}

async function clearFilter(key: ActiveFilterKey) {
  if (key === 'readState') {
    readState.value = 'all'
  }

  if (key === 'keyword') {
    keyword.value = ''
  }

  if (key === 'startedAtRange') {
    startedAtRange.value = null
  }

  page.value = 1
  await loadRuns()
}

async function handlePageChange() {
  await loadRuns()
}

async function handlePageSizeChange() {
  page.value = 1
  await loadRuns()
}

async function handleFilterChange() {
  page.value = 1
  await loadRuns()
}

async function selectReadState(value: ReadStateFilter) {
  if (readState.value === value) {
    return
  }

  readState.value = value
  await handleFilterChange()
}

function readStateCount(value: ReadStateFilter) {
  return readStateCounts.value[value]
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function openRun(run: RunListItem) {
  void router.push({
    name: 'detail',
    params: { fileId: run.imported_file_id },
    query: { runId: run.id, from: 'search' },
  })
}

function toggleCurrentPageSelection() {
  if (isCurrentPageAllSelected.value) {
    const currentPageIdSet = new Set(currentPageRunIds.value)
    selectedRunIds.value = selectedRunIds.value.filter((runId) => !currentPageIdSet.has(runId))
    return
  }

  selectedRunIds.value = Array.from(new Set([
    ...selectedRunIds.value,
    ...currentPageRunIds.value,
  ]))
}

async function deleteSelectedRuns() {
  if (selectedRunIds.value.length === 0) {
    return
  }

  deleting.value = true

  try {
    const result = await window.ipcRenderer.invoke('runs:delete', {
      ids: [...selectedRunIds.value],
    }) as DeleteRunsResult

    const nextTotal = Math.max(0, total.value - result.items.length)
    const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize.value))

    if (page.value > maxPage) {
      page.value = maxPage
    }

    selectedRunIds.value = []
    selectable.value = false
    await loadRuns()
    message.success(`已删除 ${result.items.length} 条分析记录`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section ref="pageRoot" class="page-shell search-page">
    <n-flex vertical :size="24">
      <n-h1 style="margin: 0">搜索</n-h1>
      <n-input-group>
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索文件名或路径"
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
      </n-input-group>

      <n-flex class="search-filters" align="center" justify="space-between" :size="12">
        <n-button-group>
          <n-button
            v-for="option in readStateOptions"
            :key="option.value"
            round
            :ghost="readState !== option.value"
            :type="readState === option.value ? 'primary' : 'default'"
            native-type="button"
            :aria-selected="readState === option.value"
            @click="selectReadState(option.value)"
          >
            {{ option.label }}
            <n-badge v-if="option.value === 'unread' && readStateCount('unread') > 0" :value="readStateCount('unread')" style="margin-left: 6px" />
          </n-button>
        </n-button-group>

        <n-flex align="center" justify="end" :size="12">
          <n-date-picker
            v-model:value="startedAtRange"
            type="daterange"
            clearable
            @update:value="handleFilterChange"
          />
        </n-flex>
      </n-flex>

      <n-collapse-transition :show="activeFilterTags.length > 0">
        <n-flex justify="space-between">
          <n-flex :size="4">
            <n-tag
              v-for="tag in activeFilterTags"
              :key="tag.key"
              round
              closable
              :bordered="false"
              @close="clearFilter(tag.key)"
            >
              <n-ellipsis style="max-width: 252px">{{ tag.label }}</n-ellipsis>
            </n-tag>
          </n-flex>
          <n-button strong secondary type="error" :disabled="!isSearching" @click="resetFilters">
            清除所有条件
          </n-button>
        </n-flex>
      </n-collapse-transition>

      <n-flex align="center" justify="space-between">
        <n-flex align="center" justify="start" :size="12">
          <n-h3 prefix="bar" style="margin: 0">
            {{ isSearching ? '搜索结果' : '最近分析记录' }}
          </n-h3>
          <n-button
            :type="selectable ? 'warning' : 'default'"
            :secondary="!selectable"
            :strong="selectable"
            @click="selectable = !selectable"
          >
            {{ selectable ? '取消' : '选择' }}
          </n-button>
        </n-flex>
        <n-text v-if="selectable" depth="3">已选 {{ selectedRunIds.length }} 条</n-text>
        <n-text v-else depth="3">共 {{ total }} 条</n-text>
      </n-flex>

      <n-collapse-transition :show="selectable">
        <n-flex class="selection-toolbar" align="center" justify="space-between">
          <n-flex align="center" :size="12">
            <n-checkbox
              :checked="isCurrentPageAllSelected"
              :indeterminate="isCurrentPageIndeterminate"
              :disabled="runs.length === 0"
              @click.stop="toggleCurrentPageSelection"
            />
            <n-button :disabled="runs.length === 0" @click="toggleCurrentPageSelection">
              {{ isCurrentPageAllSelected ? '取消本页' : '全选本页' }}
            </n-button>
          </n-flex>
          <n-popconfirm
            :disabled="selectedRunIds.length === 0"
            @positive-click="deleteSelectedRuns"
          >
            <template #trigger>
              <n-button
                strong
                secondary
                icon-placement="left"
                type="error"
                :disabled="selectedRunIds.length === 0"
                :loading="deleting"
              >
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
                删除
              </n-button>
            </template>
            确定要删除选中的 {{ selectedRunIds.length }} 条分析记录吗？此操作无法恢复。
          </n-popconfirm>
        </n-flex>
      </n-collapse-transition>

      <RunList
        v-model:selected-run-ids="selectedRunIds"
        :runs="runs"
        :loading="loading"
        :selectable="selectable"
        @open="openRun"
      />

      <n-flex v-if="total > 0" justify="end">
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[5, 25, 50, 100]"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-flex>
    </n-flex>
  </section>
</template>

<style scoped>
.search-page :deep(.n-list-item__divider) {
  left: 20px;
  right: 20px;
}

.selection-toolbar {
  padding-left: 20px;
  animation: selection-toolbar-enter 160ms ease-out;
}

@keyframes selection-toolbar-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
