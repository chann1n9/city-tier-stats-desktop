import { ref, watch } from 'vue'
import { DEFAULT_THEME_FAMILY, isThemeFamily, type ThemeFamily } from '@/theme/appTheme'

const STORAGE_KEY = 'city-tier-stats.theme-family'

function readStoredThemeFamily(): ThemeFamily {
  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (isThemeFamily(storedValue)) {
    return storedValue
  }

  return DEFAULT_THEME_FAMILY
}

const themeFamily = ref<ThemeFamily>(readStoredThemeFamily())

watch(themeFamily, value => {
  window.localStorage.setItem(STORAGE_KEY, value)
})

export function useThemePreference() {
  return {
    themeFamily,
  }
}
