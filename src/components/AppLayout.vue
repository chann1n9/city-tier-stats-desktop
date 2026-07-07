<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NBadge,
  NFlex,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NTooltip,
} from 'naive-ui'
import {
  SearchOutline,
  HomeOutline,
  MoonOutline,
  SettingsOutline,
  SunnyOutline,
} from '@vicons/ionicons5'
import { useAppChromeStore } from '@/stores/appChrome'

const props = defineProps<{
  dark: boolean
}>()

const emit = defineEmits<{
  'update:dark': [value: boolean]
}>()

interface NavItem {
  label: string
  to: string
  icon: Component
  badgeDot?: boolean
}

const route = useRoute()
const router = useRouter()
const appChromeStore = useAppChromeStore()
const isMac = navigator.platform.toLowerCase().includes('mac')

const navItems = computed<NavItem[]>(() => [
  {
    label: '主页',
    to: '/home',
    icon: HomeOutline,
  },
  {
    label: '搜索',
    to: '/search',
    icon: SearchOutline,
  },
  {
    label: '设置',
    to: '/settings',
    icon: SettingsOutline,
    badgeDot: appChromeStore.hasAvailableUpdate,
  },
])

const themeIcon = computed(() => (props.dark ? SunnyOutline : MoonOutline))
const themeLabel = computed(() => (props.dark ? '浅色模式' : '深色模式'))

function isActive(to: string) {
  return route.path === to
}

function navigate(to: string, query?: Record<string, string>) {
  if (query) {
    router.push({
      path: to,
      query,
    })
    return
  }
  router.push(to)
}

function toggleTheme() {
  emit('update:dark', !props.dark)
}
</script>

<template>
  <n-layout class="app-layout" :class="{ 'app-layout--traffic-lights': isMac }" position="absolute">
    <n-layout-header class="app-layout__header">
      <div class="app-layout__brand">
        <slot name="brand">
          <img
            class="app-layout__brand-mark"
            :src="dark ? './eastun-icon-dark.svg' : './eastun-icon-light.svg'"
            alt=""
            aria-hidden="true"
          >
          <img
            class="app-layout__brand-image"
            :src="dark ? './city-tier-stats-brand-athletic-dark.svg' : './city-tier-stats-brand-athletic-light.svg'"
            alt="City Tier Stats"
          >
        </slot>
      </div>

      <!-- <n-flex
        class="app-layout__header-right"
        :wrap="false"
        :size="0"
        align="center"
        justify="end"
      >
        <slot name="header-right">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button class="layout-icon-button" quaternary size="large" aria-label="消息">
                <template #icon>
                  <n-icon :component="NotificationsOutline" />
                </template>
              </n-button>
            </template>
            消息
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button class="layout-icon-button" quaternary size="large" aria-label="我的">
                <template #icon>
                  <n-icon :component="PersonCircleOutline" />
                </template>
              </n-button>
            </template>
            我的
          </n-tooltip>
        </slot>
      </n-flex> -->
    </n-layout-header>

    <n-layout
      has-sider
      class="app-layout__body"
      :content-style="{ height: '100%' }"
    >
      <n-layout-sider
        class="app-layout__sider"
        :width="88"
        :native-scrollbar="false"
        :content-style="{ height: '100%' }"
      >
        <div class="app-layout__sider-content">
          <div class="app-layout__sider-top">
            <div v-if="isMac" class="app-layout__traffic-light-space" aria-hidden="true" />
          </div>

          <div class="app-layout__sider-inner">
            <slot name="sidebar">
              <n-flex vertical :size="0" align="center">
                <n-tooltip v-for="item in navItems" :key="item.label" trigger="hover" placement="right">
                  <template #trigger>
                    <n-button class="layout-icon-button"
                      size="large"
                      :type="isActive(item.to) ? 'primary' : 'default'"
                      :quaternary="!isActive(item.to)"
                      :aria-label="item.label"
                      @click="navigate(item.to, item.to === '/search' ? { from: 'home' } : undefined)"
                    >
                      <template #icon>
                        <n-badge v-if="item.badgeDot" dot>
                          <n-icon :component="item.icon" />
                        </n-badge>
                        <n-icon v-else :component="item.icon" />
                      </template>
                    </n-button>
                  </template>
                  {{ item.label }}
                </n-tooltip>
              </n-flex>
            </slot>
          </div>

          <div class="app-layout__sider-bottom">
            <slot name="sidebar-bottom">
              <n-tooltip trigger="hover" placement="right">
                <template #trigger>
                  <n-button
                    class="layout-icon-button"
                    quaternary
                    size="large"
                    :aria-label="themeLabel"
                    @click="toggleTheme"
                  >
                    <template #icon>
                      <n-icon :component="themeIcon" />
                    </template>
                  </n-button>
                </template>
                {{ themeLabel }}
              </n-tooltip>
            </slot>
          </div>
        </div>
      </n-layout-sider>

      <n-layout-content class="app-layout__content" :native-scrollbar="false">
        <div class="app-layout__content-inner">
          <slot />
          <div class="app-layout__content-chin" aria-hidden="true" />
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.app-layout {
  --app-header-height: 72px;
  --app-sider-width: 88px;
  --app-traffic-light-space-height: 10px;
  --app-content-chin-height: 28px;
  background: var(--app-bg, var(--n-color));
}

.app-layout--traffic-lights {
  --app-traffic-light-space-height: 44px;
}

.app-layout__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: center;
  height: var(--app-header-height);
  margin-left: var(--app-sider-width);
  padding: 0 28px 0 0;
  /* background: var(--n-color); */
  background: transparent;
  -webkit-app-region: drag;
}

.app-layout__header-right {
  -webkit-app-region: no-drag;
}

.app-layout__header-right {
  grid-column: 2;
}

.app-layout__brand {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: min(420px, 42vw);
  height: var(--app-header-height);
  pointer-events: none;
}

.app-layout__brand-mark {
  display: block;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  object-fit: contain;
}

.app-layout__brand-image {
  display: block;
  width: auto;
  margin-left: -18px;
  max-width: 100%;
  height: min(44px, calc(var(--app-header-height) - 20px));
  object-fit: contain;
}

.app-layout__body {
  height: calc(100% - var(--app-header-height));
  background: var(--app-bg, var(--n-color));
}

.app-layout__sider {
  background: transparent;
}

.app-layout__sider :deep(.n-layout-sider-scroll-container) {
  height: 100%;
  background: transparent;
}

.app-layout__sider-content {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
}

.app-layout__sider-top {
  display: grid;
  justify-items: center;
  min-height: calc(var(--app-traffic-light-space-height) + 12px);
  padding-top: var(--app-traffic-light-space-height);
}

.app-layout__traffic-light-space {
  height: 0;
}

.app-layout__sider-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
}

.app-layout__sider-bottom {
  display: flex;
  justify-content: center;
  padding-bottom: 26px;
  -webkit-app-region: no-drag;
}

.app-layout__content {
  min-width: 0;
  background: var(--app-bg, var(--n-color));
}

.app-layout__content-inner {
  min-width: 0;
  padding: 0 28px 0 0;
}

.app-layout__content-chin {
  height: var(--app-content-chin-height);
}

.layout-icon-button {
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 14px;
  -webkit-app-region: no-drag;
}

.app-layout__sider :deep(.layout-icon-button:not(.n-button--primary-type)) {
  --n-color: rgba(128, 128, 128, 0.1) !important;
  --n-color-hover: rgba(128, 128, 128, 0.18) !important;
  --n-color-pressed: rgba(128, 128, 128, 0.24) !important;
  --n-color-focus: rgba(128, 128, 128, 0.18) !important;
}

@media (max-width: 720px) {
  .app-layout {
    --app-header-height: 64px;
    --app-content-chin-height: 18px;
  }

  .app-layout__header {
    grid-template-columns: minmax(0, 1fr) 112px;
    padding-right: 16px;
  }

  .app-layout__content-inner {
    padding-right: 16px;
  }

  .app-layout__brand {
    gap: 8px;
    width: min(360px, 52vw);
  }

  .app-layout__brand-mark {
    width: 34px;
    height: 34px;
  }
}
</style>
