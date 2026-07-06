<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, useOsTheme } from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
import { RouterView } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { createAppThemeOptions } from '@/theme/appTheme'
import { useThemePreference } from '@/theme/themePreference'
import { useAppChromeStore } from '@/stores/appChrome'

const osTheme = useOsTheme()
const isDark = ref(osTheme.value === 'dark')
const { themeFamily } = useThemePreference()
const appChromeStore = useAppChromeStore()
const appTheme = computed(() => createAppThemeOptions(isDark.value, themeFamily.value))

onMounted(() => {
  window.setTimeout(() => {
    void checkUpdateSilently()
  }, 3000)
})

async function checkUpdateSilently() {
  try {
    const result = await window.ipcRenderer.invoke('app:check-update')

    appChromeStore.setHasAvailableUpdate(result.hasUpdate)
  } catch (error) {
    // noop
  }
}
</script>

<template>
  <n-config-provider :theme="appTheme.theme" :theme-overrides="appTheme.themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <div class="app-theme-root" :style="appTheme.cssVars">
      <n-message-provider>
        <AppLayout v-model:dark="isDark">
          <RouterView />
        </AppLayout>
      </n-message-provider>
    </div>
  </n-config-provider>
</template>
