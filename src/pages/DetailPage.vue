<script setup lang="ts">
import {
  useMessage,
  NGrid,
  NGi,
  NStatistic,
  NBreadcrumb,
  NBreadcrumbItem,
  NDivider,
  NH1,
  NH5,
  NTable,
  NCard,
  NButton,
  NIcon,
  NText,
  NFlex,
  NCollapseTransition,
  NNumberAnimation,
  NBackTop,
  NPopselect,
  NPopconfirm,
  NSwitch,
} from 'naive-ui'
import { ChevronForwardCircleOutline, DownloadOutline, ArrowUpOutline, TrashOutline } from '@vicons/ionicons5'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackFloatButton from '@/components/BackFloatButton.vue'
import { useInboxSessionStore } from '@/stores/inboxSession'
import { useSearchSessionStore } from '@/stores/searchSession'

const message = useMessage()
const route = useRoute()
const router = useRouter()
const inboxSessionStore = useInboxSessionStore()
const searchSessionStore = useSearchSessionStore()

interface ImportedFile {
  id: string
  original_name: string
  latest_run_id: string | null
}

interface AnalysisRun {
  id: string
  imported_file_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  error_message: string | null
  started_at: string
  result_json_path: string | null
  read_at: string | null
}

type ExportDetailFormat = 'xlsx' | 'csv'

interface ExportDetailResult {
  path: string
}

interface DeleteRunsResult {
  items: Array<{
    id: string
    importedFileId: string
    resultJsonPath: string | null
  }>
}

interface GroupTier {
  code: string
  label: string
  count: number
  percentage: number
}

interface GroupSummary {
  group_value: string
  total: number
  tiers: GroupTier[]
}

const groupJson = ref<GroupSummary[]>([])

interface InputAssetMeta {
  path: string
  name: string
  size_bytes: number
  modified_at: string
  mtime_ns: number
  sha256: string
}

interface CityTierStatsInput {
  file: InputAssetMeta
  config: InputAssetMeta
  parameters: {
    column: string
    group_by: string
  }
}

interface CityTierDetail {
  row_number: number
  location: string
  city: string
  normalized_city: string
  tier_code: string
  tier_label: string
  group_value: string
}

interface CityTierStatsJson {
  input: CityTierStatsInput
  summary: {
    total: number
    tiers: GroupTier[]
  }
  groups: GroupSummary[]
  details: CityTierDetail[]
}

const file = ref<ImportedFile | null>(null)
const run = ref<AnalysisRun | null>(null)
const inputJson = ref<CityTierStatsInput | null>(null)
const fileMeta = ref<InputAssetMeta | null>(null)
const configMeta = ref<InputAssetMeta | null>(null)
const summaryJson = ref<CityTierStatsJson['summary'] | null>(null)
const detailJson = ref<CityTierDetail[]>([])
const showDetail = ref(false)
const detailTableAnchor = ref<HTMLElement | null>(null)
const exportingDetail = ref(false)
const showMeta = ref(false)

const showTotal = ref(localStorage.getItem('showTotal') === 'true')
watch(showTotal, (value) => {
  localStorage.setItem('showTotal', String(value))
})

const breadcrumbFileName = computed(() => file.value?.original_name ?? '文件详情')
const breadcrumbRunCreatedTime = computed(() => {
  if (!run.value?.started_at) {
    return '分析记录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(run.value.started_at))
})

const summaryTiers = computed(() => summaryJson.value?.tiers ?? [])
const exportOptions: Array<{ label: string; value: ExportDetailFormat }> = [
  { label: 'Excel (.xlsx)', value: 'xlsx' },
  { label: 'CSV (.csv)', value: 'csv' },
]

function handleBack() {
  if (route.query.from === 'search') {
    router.push({ name: 'search' })
    return
  }

  if (route.query.from === 'inbox') {
    router.push({ name: 'inbox' })
    return
  }

  router.push({ name: 'home' })
}

async function toggleDetail() {
  showDetail.value = !showDetail.value

  if (showDetail.value) {
    await nextTick()
    await new Promise<void>((resolve) => window.setTimeout(resolve, 320))

    if (!showDetail.value) {
      return
    }

    detailTableAnchor.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

onMounted(async () => {
  await loadDetail()
})

async function loadDetail() {
  const fileId = route.params.fileId

  if (typeof fileId !== 'string') {
    message.error('缺少文件 ID')
    return
  }

  file.value = await window.ipcRenderer.invoke('files:get', { id: fileId }) as ImportedFile | null

  if (!file.value) {
    message.error('文件不存在')
    return
  }

  const runId = typeof route.query.runId === 'string'
    ? route.query.runId
    : file.value.latest_run_id

  if (!runId) {
    message.warning('暂无分析记录')
    return
  }

  run.value = await window.ipcRenderer.invoke('runs:get', { id: runId }) as AnalysisRun | null

  if (!run.value) {
    message.error('分析记录不存在')
    return
  }

  const readRun = await window.ipcRenderer.invoke('runs:mark-read', { id: runId }) as AnalysisRun | null
  if (readRun?.read_at) {
    run.value = readRun
    inboxSessionStore.markRunRead(runId, readRun.read_at)
    searchSessionStore.markRunRead(runId, readRun.read_at)
  }

  const resultJson = await window.ipcRenderer.invoke('runs:get-result', { id: runId }) as CityTierStatsJson | null

  inputJson.value = resultJson?.input ?? null
  summaryJson.value = resultJson?.summary ?? null
  groupJson.value = resultJson?.groups ?? []
  detailJson.value = resultJson?.details ?? []
  fileMeta.value = resultJson?.input?.file ?? null
  configMeta.value = resultJson?.input?.config ?? null
}

function formatPercentage(percentage: number) {
  return `${(percentage * 100).toFixed(2)}%`
}

async function exportDetail(format: ExportDetailFormat) {
  if (!run.value) {
    message.error('缺少分析记录')
    return
  }

  exportingDetail.value = true

  try {
    const result = await window.ipcRenderer.invoke('runs:export-detail', {
      id: run.value.id,
      format,
    }) as ExportDetailResult | null

    if (result) {
      message.success(`已导出：${result.path}`)
    }
  } finally {
    exportingDetail.value = false
  }
}

async function handleDelete() {
  if (!run.value) {
    message.error('缺少分析记录')
    return
  }

  const runId = run.value.id

  try {
    const result = await window.ipcRenderer.invoke('runs:delete', {
      ids: [runId],
    }) as DeleteRunsResult

    if (result.items.length === 0) {
      message.warning('分析记录已不存在')
    } else {
      inboxSessionStore.removeRun(runId)
      searchSessionStore.removeRun(runId)
      message.success('已删除分析记录')
    }

    handleBack()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  }
}
</script>

<template>
  <BackFloatButton @click="handleBack" />
  <section class="page-shell page-shell--wide page-shell--top-with-floating-action detail-page">
    <n-flex align="center" justify="space-between">
      <n-h1 style="margin: 0 0 8px">分析结果</n-h1>
      <n-popconfirm @positive-click="handleDelete">
        <template #trigger>
          <n-button strong secondary type="error"><n-icon><TrashOutline /></n-icon></n-button>
        </template>
        确认删除该分析记录吗？此操作不可撤销。
      </n-popconfirm>
    </n-flex>

    <section style="margin-bottom: 18px">
      <n-flex align="center" :size="12">
        <n-breadcrumb>
          <n-breadcrumb-item :clickable="false">{{ breadcrumbFileName }}</n-breadcrumb-item>
          <n-breadcrumb-item :clickable="false">{{ breadcrumbRunCreatedTime }}</n-breadcrumb-item>
        </n-breadcrumb>
        <n-button text type="primary" @click="showMeta = !showMeta">{{ showMeta ? '收起元数据' : '展开元数据' }}</n-button>
      </n-flex>
      <n-collapse-transition :show="showMeta" style="padding: 0 4px">
        <n-flex vertical :size="0" style="line-height: 1.25">
          <div>
            <span class="meta-key">文件路径</span>
            <span>
              <n-text depth="3" tag="span">{{ fileMeta?.path }}</n-text>
            </span>
          </div>
          <div>
            <span class="meta-key">修改时间</span>
            <span>
              <n-text depth="3">{{ fileMeta?.modified_at }}</n-text>
            </span>
          </div>
          <div>
            <span class="meta-key">SHA256</span>
            <span>
              <n-text depth="3">{{ fileMeta?.sha256 }}</n-text>
            </span>
          </div>
          <div>
            <span class="meta-key">配置路径</span>
            <span>
              <n-text depth="3" tag="span">{{ configMeta?.path }}</n-text>
            </span>
          </div>
        </n-flex>
      </n-collapse-transition>
    </section>

    <n-card>
      <n-text type="error" v-if="run?.status === 'failed'">{{ run?.error_message }}</n-text>
      <n-flex v-else vertical align="space-between">
        <n-text depth="2">共统计了 {{ summaryJson?.total }} 个</n-text>
        <n-grid :cols="6">
          <n-gi
            v-for="tier in summaryTiers"
            :key="tier.code"
          >
            <n-statistic :label="tier.label" tabular-nums>
              <n-number-animation :from="0" :to="tier.percentage * 100" :precision="2"/>%
            </n-statistic>
            <n-text depth="3">{{ tier.count }}个</n-text>
          </n-gi>
        </n-grid>
      </n-flex>
    </n-card>

    <template v-if="groupJson.length > 0">
      <n-divider title-placement="left">分组统计</n-divider>
      <n-flex align="center" :size="12" style="margin-bottom: 18px">
        <n-h5 prefix="bar" style="margin: 0">
          给 <n-text style="color: var(--app-accent)">{{ inputJson?.parameters.column }}</n-text> 做城市等级分类，并按 <n-text style="color: var(--app-accent)">{{ inputJson?.parameters.group_by }}</n-text> 分组统计。
        </n-h5>
        <n-text>显示个数</n-text><n-switch v-model:value="showTotal"></n-switch>
      </n-flex>
      <n-table :bordered="false">
        <thead>
          <tr>
            <th>{{ inputJson?.parameters.group_by }}</th>
            <th v-for="tier in summaryTiers" :key="tier.code">{{ tier.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groupJson" :key="group.group_value">
            <td>
              <div>{{ group.group_value }}</div>
              <n-text v-if="showTotal" depth="3">{{ group.total }}</n-text>
            </td>
            <td v-for="tier in group.tiers" :key="tier.code">
              <div>{{ formatPercentage(tier.percentage) }}</div>
              <n-text v-if="showTotal" depth="3">{{ tier.count }}</n-text>
            </td>
          </tr>
        </tbody>
      </n-table>
    </template>

    <n-divider title-placement="left">更多细节</n-divider>

    <n-flex align="center" justify="space-between" style="margin-bottom: 18px">
      <n-flex align="center" justify="start">
        <n-h5 prefix="bar" style="margin: 0 4px 0 0">分析详情</n-h5>

        <n-button
          text
          type="primary"
          :aria-label="showDetail ? '收起分析详情' : '展开分析详情'"
          @click="toggleDetail"
        >
          <template #icon>
            <n-icon
              class="detail-toggle-icon"
              :class="{ 'detail-toggle-icon--expanded': showDetail }"
              size="20"
            >
              <ChevronForwardCircleOutline />
            </n-icon>
          </template>
        </n-button>
      </n-flex>

      <transition-group name="detail-actions" tag="div" class="detail-actions">
        <div v-if="showDetail" key="download" class="detail-action-item">
          <n-popselect
            :options="exportOptions"
            trigger="click"
            @update:value="exportDetail"
          >
            <n-button
              circle
              strong
              secondary
              type="primary"
              aria-label="导出详情"
              :loading="exportingDetail"
            >
              <template #icon>
                <n-icon size="20">
                  <DownloadOutline />
                </n-icon>
              </template>
            </n-button>
          </n-popselect>
        </div>
      </transition-group>
    </n-flex>

    <div ref="detailTableAnchor" class="detail-table-anchor">
      <n-collapse-transition :show="showDetail">
        <n-table :bordered="false">
          <thead>
            <tr>
              <th>归属地</th>
              <th>城市</th>
              <th>城市归一化</th>
              <th>分层代码</th>
              <th>分层</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="detail in detailJson" :key="detail.row_number">
              <td>{{ detail.location }}</td>
              <td>{{ detail.city }}</td>
              <td>{{ detail.normalized_city }}</td>
              <td>{{ detail.tier_code }}</td>
              <td>{{ detail.tier_label }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-collapse-transition>
    </div>
  </section>

  <n-back-top :bottom="28" :right="32" :visibility-height="500">
    <n-button circle type="primary" size="large" style="font-size: 24px">
      <n-icon><ArrowUpOutline /></n-icon>
    </n-button>
  </n-back-top>
</template>

<style scoped>
.detail-toggle-icon {
  transition: transform 0.2s ease;
}

.detail-toggle-icon--expanded {
  transform: rotate(90deg);
}

.detail-table-anchor {
  scroll-margin-top: 120px;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-action-item {
  display: flex;
}

.detail-actions-enter-active,
.detail-actions-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.detail-actions-enter-from,
.detail-actions-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.meta-key {
  display: inline-block;
  width: 82px;
}
</style>
