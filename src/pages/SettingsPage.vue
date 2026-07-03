<script setup lang="ts">
// TODO: yaml预览？修改路径？
// TODO: settings没有左边栏
import {
  NH1,
  NDropdown,
  NInput,
  NButton,
  NH3,
  NFlex,
  NSelect,
  NTag,
  NText,
  NPopconfirm,
  NIcon,
  useMessage,
  NDivider,
  NCard,
  type DropdownOption,
} from 'naive-ui'
import { TrashOutline, AddOutline, TriangleOutline } from '@vicons/ionicons5'
import BackFloatButton from '@/components/BackFloatButton.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getThemeFamilyLabel,
  isThemeFamily,
  themeFamilyOptions,
} from '@/theme/appTheme'
import { useThemePreference } from '@/theme/themePreference'

type TierCode = 'first' | 'new_first' | 'second' | 'third' | 'fourth'

interface CityTiersConfig {
  tiers: Record<TierCode, string[]>
}

interface CityTierResult {
  code: TierCode
  label: string
  matchedCity: string
}

interface ReloadRulesResult {
  path: string
  rules: CityTiersConfig
}

interface AppAboutResult {
  appVersion: string
  runtimeVersion: string
}

const router = useRouter()
const message = useMessage()
const { themeFamily } = useThemePreference()
const cityName = ref('')
const selectedTier = ref<TierCode>('first')
const rulesPath = ref('')
const cityTiersConfig = ref<CityTiersConfig | null>(null)
const appVersion = ref('未知')
const runtimeVersion = ref('未知')
const themeDropdownOptions = computed<DropdownOption[]>(() => themeFamilyOptions.map(option => ({
  label: option.label,
  key: option.key,
})))
const currentThemeLabel = computed(() => getThemeFamilyLabel(themeFamily.value))

const tierLabels: Record<TierCode, string> = {
  first: '一线城市',
  new_first: '新一线城市',
  second: '二线城市',
  third: '三线城市',
  fourth: '四线城市',
}

const tierOptions = Object.entries(tierLabels).map(([value, label]) => ({
  label,
  value,
}))

const tierEntries = computed(() => {
  if (!cityTiersConfig.value) {
    return []
  }

  return Object.entries(cityTiersConfig.value.tiers) as Array<[TierCode, string[]]>
})
const normalizedCityName = computed(() => normalizeCityName(cityName.value))
const cityTierResult = computed(() => findCityTier(normalizedCityName.value))
const hasQuery = computed(() => normalizedCityName.value.length > 0)

onMounted(() => {
  void loadRules()
  void loadAbout()
})

async function loadRules() {
  const result = await window.ipcRenderer.invoke('rules:get') as ReloadRulesResult

  rulesPath.value = result.path
  cityTiersConfig.value = result.rules
}

async function loadAbout() {
  const result = await window.ipcRenderer.invoke('app:get-about') as AppAboutResult

  appVersion.value = result.appVersion
  runtimeVersion.value = result.runtimeVersion
}

function normalizeCityName(value: string) {
  return value.trim().replace(/\s+/g, '')
}

function handleCityTierSearch() {
  cityName.value = normalizedCityName.value
}

function getCityCandidates(value: string) {
  if (!value) {
    return []
  }

  const candidates = [value]

  if (!value.endsWith('市')) {
    candidates.push(`${value}市`)
  }

  return candidates
}

function findCityTier(value: string): CityTierResult | null {
  const candidates = getCityCandidates(value)

  for (const [code, cities] of tierEntries.value) {
    const matchedCity = candidates.find((candidate) => cities.includes(candidate))

    if (matchedCity) {
      return {
        code,
        label: tierLabels[code],
        matchedCity,
      }
    }
  }

  return null
}

async function removeMatchedCity() {
  if (!cityTierResult.value) {
    return
  }

  const result = await window.ipcRenderer.invoke('rules:remove-city', {
    tier: cityTierResult.value.code,
    city: cityTierResult.value.matchedCity,
  }) as ReloadRulesResult

  rulesPath.value = result.path
  cityTiersConfig.value = result.rules
  message.success(`已删除 ${cityTierResult.value.matchedCity}`)
}

async function addRules() {
  const city = normalizedCityName.value

  if (!city) {
    return
  }

  const result = await window.ipcRenderer.invoke('rules:add-city', {
    tier: selectedTier.value,
    city,
  }) as ReloadRulesResult

  rulesPath.value = result.path
  cityTiersConfig.value = result.rules
  message.success(`已添加 ${city} 到${tierLabels[selectedTier.value]}`)
}

async function resetRules() {
  const result = await window.ipcRenderer.invoke('rules:reset-default') as ReloadRulesResult

  rulesPath.value = result.path
  cityTiersConfig.value = result.rules
  message.success('已恢复默认规则')
}

async function openRulesFile() {
  await window.ipcRenderer.invoke('rules:open-file')
}

async function openRulesDirectory() {
  await window.ipcRenderer.invoke('rules:open-directory')
}

function handleThemeSelect(key: string | number) {
  if (!isThemeFamily(key)) {
    return
  }

  themeFamily.value = key
}
</script>

<template>
  <BackFloatButton @click="router.back" />
  <section class="page-shell page-shell--narrow page-shell--top-with-floating-action">
    <n-h1 style="margin: 0">设置</n-h1>

    <section class="setting-section">
      <n-h3 prefix="bar">主题</n-h3>
      <n-dropdown
        trigger="click"
        :options="themeDropdownOptions"
        :value="themeFamily"
        @select="handleThemeSelect"
      >
        <n-button secondary icon-placement="right">
          {{ currentThemeLabel }}
          <template #icon>
            <n-icon size="12" style="transform: rotate(180deg);">
              <TriangleOutline />
            </n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </section>

    <section class="setting-section">
      <n-h3 prefix="bar">城市分类规则设置</n-h3>
      <n-text v-if="rulesPath" depth="3">{{ rulesPath }}</n-text>
      <n-flex :size="12" style="margin-top: 12px">
        <n-button secondary @click="openRulesFile">打开规则文件</n-button>
        <n-button secondary @click="openRulesDirectory">打开目录</n-button>
        <n-popconfirm @positive-click="resetRules">
          <template #trigger>
            <n-button secondary type="warning">恢复默认</n-button>
          </template>
          确定要用内置规则覆盖当前规则文件吗？
        </n-popconfirm>
      </n-flex>

      <n-divider title-placement="left">规则管理</n-divider>

      <n-flex :size="12" style="margin-top: 12px">
        <n-input
          v-model:value="cityName"
          clearable
          placeholder="请输入城市名称"
          style="max-width: 200px"
          @keyup.enter="handleCityTierSearch"
        />
        <template v-if="hasQuery && !cityTierResult">
          <n-select
            v-model:value="selectedTier"
            :options="tierOptions"
            style="max-width: 160px"
          />
          <n-popconfirm @positive-click="addRules">
            <template #trigger>
              <n-button strong type="success">
                <template #icon>
                  <n-icon :size="20">
                    <AddOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            确定要将 {{ normalizedCityName }} 添加到 {{ tierLabels[selectedTier] }} 吗？
          </n-popconfirm>
        </template>
      </n-flex>

      <section class="result-block">
        <n-flex align="center" :size="8">
          <template v-if="hasQuery && cityTierResult">
            <n-text>{{ cityTierResult.matchedCity }}</n-text>
            <n-tag type="success" round>{{ cityTierResult.label }}</n-tag>
            <n-text depth="3">{{ cityTierResult.code }}</n-text>
            <n-popconfirm @positive-click="removeMatchedCity">
              <template #trigger>
                <n-button strong type="error" style="margin-left: 16px">
                  <template #icon>
                    <n-icon :size="20">
                      <TrashOutline />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              确定要删除 {{ cityTierResult.matchedCity }} 吗？
            </n-popconfirm>
          </template>
          <n-text v-else-if="hasQuery">
            未找到该城市的分层
          </n-text>
          <n-text v-else >请输入城市名称进行查询</n-text>
        </n-flex>
      </section>
    </section>

    <section class="setting-section">
      <n-h3 prefix="bar">关于 City Tier Stats</n-h3>
      <n-card>
        <div class="about-text">
          <n-text depth="3">
            City Tier Stats 会从「重庆-重庆-九龙坡」这类归属地字段中提取城市名，并按照当前城市分层规则进行匹配，最终统计新一线、一线、二线、三线、四线及其他城市的数量和占比。
          </n-text>
          <n-text depth="3">
            本应用在本机完成文件读取与分析，不会上传你的 Excel 文件。
          </n-text>

          <div class="about-list">
            <n-text depth="3">开发者：© 2026 Eastun Tech</n-text>
            <n-text depth="3">
              官网：
              <a class="about-link" href="https://eastun.tech" target="_blank" rel="noreferrer">eastun.tech</a>
            </n-text>
            <n-text depth="3">
              联系我们：
              <a class="about-link" href="mailto:contact@eastun.tech">contact@eastun.tech</a>
            </n-text>
          </div>

          <div class="about-list">
            <n-text depth="3">版本信息</n-text>
            <n-text depth="3">应用版本：v{{ appVersion }}</n-text>
            <n-text depth="3">内置分析器版本：v{{ runtimeVersion }}</n-text>
          </div>
        </div>
      </n-card>
    </section>
  </section>
</template>

<style scoped>
.setting-section {
  margin: 28px 0 40px;
}

.result-block {
  min-height: 36px;
  margin-top: 12px;
}

.about-text {
  display: grid;
  gap: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.about-list {
  display: grid;
  gap: 4px;
}

.about-link {
  color: var(--app-accent);
}
</style>
