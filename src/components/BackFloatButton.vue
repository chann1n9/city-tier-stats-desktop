<script setup lang="ts">
import { ArrowBackOutline } from '@vicons/ionicons5'
import { NFloatButton, NIcon } from 'naive-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  click: []
}>()

const root = ref<InstanceType<typeof NFloatButton> | null>(null)
const left = ref(88)
let scrollElement: HTMLElement | null = null
let scrollFrame = 0

const leftStart = 88
const leftEnd = 24
const shiftDistance = 40

onMounted(() => {
  scrollElement = getScrollElement()
  scrollElement?.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('scroll', handleScroll, { passive: true })
  updateLeft()
})

onBeforeUnmount(() => {
  scrollElement?.removeEventListener('scroll', handleScroll)
  window.removeEventListener('scroll', handleScroll)

  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame)
  }
})

function getScrollElement() {
  let element = root.value?.$el?.parentElement as HTMLElement | null

  while (element) {
    const style = window.getComputedStyle(element)

    if (['auto', 'scroll', 'overlay'].includes(style.overflowY)) {
      return element
    }

    element = element.parentElement
  }

  return null
}

function getScrollTop() {
  return scrollElement?.scrollTop ?? window.scrollY
}

function handleScroll() {
  if (scrollFrame) {
    return
  }

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateLeft()
  })
}

function updateLeft() {
  const progress = Math.min(1, Math.max(0, getScrollTop() / shiftDistance))
  left.value = leftStart - (leftStart - leftEnd) * progress
}
</script>

<template>
  <n-float-button
    ref="root"
    :left="left"
    :top="72"
    type="primary"
    style="z-index: var(--z-toast);"
    @click="emit('click')"
  >
    <n-icon><ArrowBackOutline /></n-icon>
  </n-float-button>
</template>
