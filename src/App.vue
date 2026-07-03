<script setup lang="ts">
import { computed, ref } from 'vue'
import { NConfigProvider, NMessageProvider, useOsTheme } from 'naive-ui'
import { RouterView } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { createAppThemeOptions } from '@/theme/appTheme'
import { useThemePreference } from '@/theme/themePreference'

const osTheme = useOsTheme()
const isDark = ref(osTheme.value === 'dark')
const { themeFamily } = useThemePreference()
const appTheme = computed(() => createAppThemeOptions(isDark.value, themeFamily.value))
</script>

<template>
  <n-config-provider :theme="appTheme.theme" :theme-overrides="appTheme.themeOverrides">
    <div class="app-theme-root" :style="appTheme.cssVars">
      <n-message-provider>
        <AppLayout v-model:dark="isDark">
          <RouterView />
        </AppLayout>
      </n-message-provider>
    </div>
  </n-config-provider>
</template>
