<script setup lang="ts">
import { NBadge, NCard, NSpace, NText, NThing, NNumberAnimation, useThemeVars } from 'naive-ui'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

interface AnalysisRunListItem {
  id: string
  original_name: string
  started_at: string
}

interface SearchAnalysisRunsResult {
  items: AnalysisRunListItem[]
  total: number
}

const router = useRouter()
const themeVars = useThemeVars()
const loading = ref(false)
const unreadTotal = ref(0)
const latestRun = ref<AnalysisRunListItem | null>(null)
const shouldFlash = ref(false)

const props = defineProps<{
  flashKey?: number
}>()

watch(() => props.flashKey, async () => {
  await loadInbox()
  playFlash()
})

const inboxDescription = computed(() => {
  return `${unreadTotal.value} 个待查看的分析结果`
})

onMounted(() => {
  void loadInbox()
})

async function playFlash() {
  if (unreadTotal.value === 0) {
    return
  }

  shouldFlash.value = false
  await nextTick()
  window.requestAnimationFrame(() => {
    shouldFlash.value = true
  })
}

async function loadInbox() {
  loading.value = true

  try {
    const result = await window.ipcRenderer.invoke('runs:search', {
      readState: 'unread',
      page: 1,
      pageSize: 1,
    }) as SearchAnalysisRunsResult

    unreadTotal.value = result.total
    latestRun.value = result.items[0] ?? null
  } finally {
    loading.value = false
  }
}

function openInbox() {
  void router.push({
    name: 'inbox',
    query: {
      from: 'home',
    },
  })
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <n-card
    class="analysis-card"
    :class="{ 'flash-border': shouldFlash }"
    :style="{ '--flash-color': themeVars.primaryColor }"
    @animationend="shouldFlash = false"
    v-if="unreadTotal != 0" hoverable role="button" :aria-busy="loading" @click="openInbox">
    <n-thing>
      <template #header>
        <n-space align="center" :size="8">
          <span>未查看</span>
          <n-badge v-if="unreadTotal > 0">
            <template #value>
              <n-number-animation :from="0" :to="unreadTotal" />
            </template>
          </n-badge>
        </n-space>
      </template>

      <template #description>
        <n-text depth="3">{{ inboxDescription }}</n-text>
      </template>

      <n-text v-if="latestRun" depth="3">
        最新：{{ latestRun.original_name }} · {{ formatDateTime(latestRun.started_at) }}
      </n-text>
    </n-thing>
  </n-card>
</template>

<style scoped>
.analysis-card {
  cursor: pointer;
}

.analysis-card.flash-border {
  animation: card-border-flash 0.8s ease-in-out 3;
}

@keyframes card-border-flash {
  0% {
    border-color: var(--n-border-color);
    box-shadow: none;
  }

  50% {
    /* border-color: var(--flash-color);
    box-shadow:
      0 0 0 2px var(--flash-color),
      0 0 18px var(--flash-color); */
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 2px var(--app-accent),
      0 0 18px var(--app-accent);
  }

  100% {
    border-color: var(--n-border-color);
    box-shadow: none;
  }
}

/* 整卡变色版本，先保留，方便对比闪烁手感。
.analysis-card.flash-card {
  animation: card-attention-flash 0.8s ease-in-out 3;
}

@keyframes card-attention-flash {
  0% {
    background-color: var(--n-color);
    box-shadow: none;
  }

  50% {
    background-color: var(--flash-color);
    box-shadow:
      0 0 0 2px var(--flash-color),
      0 0 18px var(--flash-color);
  }

  100% {
    background-color: var(--n-color);
    box-shadow: none;
  }
}
*/
</style>
