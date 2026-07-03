import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'

export type ThemeFamily = 'default' | 'maroon'

export interface ThemeFamilyOption {
  label: string
  key: ThemeFamily
}

interface AppThemePalette {
  background: string
  card: string
  popover: string
  primary: string
  primaryHover: string
  primaryPressed: string
  accentHover: string
  accentPressed: string
  accent: string
  text: string
  textMuted: string
  border: string
}

export interface AppThemeOptions {
  theme: typeof darkTheme | null
  themeOverrides: GlobalThemeOverrides
  cssVars: Record<string, string>
}

export const DEFAULT_THEME_FAMILY = 'default' as ThemeFamily
export const themeFamilyOptions: ThemeFamilyOption[] = [
  {
    label: '默认主题',
    key: 'default',
  },
  {
    label: '酒红色',
    key: 'maroon',
  },
]

const maroonPalettes: Record<'light' | 'dark', AppThemePalette> = {
  light: {
    background: '#FBF7F9',
    card: 'rgba(255,255,255,0.82)',
    popover: '#FFFFFF',
    primary: '#860038',
    // primary: '#8A5A00',
    primaryHover: '#A10B4B',
    primaryPressed: '#65002A',
    // primary: '#FDBC31',
    // primaryHover: '#FFD05C',
    // primaryPressed: '#D99605',
    accent: '#FDBC31',
    accentHover: '#FFD05C',
    accentPressed: '#D99605',
    text: '#171114',
    textMuted: 'rgba(23,17,20,0.62)',
    border: 'rgba(134,0,56,0.14)',
  },
  dark: {
    background: '#13070D',
    card: 'rgba(255,255,255,0.06)',
    popover: '#24151C',
    primary: '#B51A58',
    // primary: '#C88A1E',
    primaryHover: '#CD3570',
    primaryPressed: '#8F0D42',
    // primary: '#F6C65B',
    // primaryHover: '#FFD778',
    // primaryPressed: '#C99221',
    accent: '#F6C65B',
    accentHover: '#FFD778',
    accentPressed: '#C99221',
    text: 'rgba(255,255,255,0.92)',
    textMuted: 'rgba(255,255,255,0.62)',
    border: 'rgba(255,255,255,0.12)',
  },
}

const baseThemeOverrides: GlobalThemeOverrides = {
  Button: {
    borderRadiusTiny: '8px',
    borderRadiusSmall: '10px',
    borderRadiusMedium: '12px',
    borderRadiusLarge: '14px',
  },
  Card: {
    borderRadius: '24px',
  },
  Input: {
    borderRadius: '24px',
  },
  Upload: {
    borderRadius: '24px',
  },
  List: {
    borderRadius: '24px',
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '24px',
      },
      InternalSelectMenu: {
        borderRadius: '24px',
      },
    },
  },
}

function getActivePalette(themeFamily: ThemeFamily, isDark: boolean) {
  if (themeFamily === 'default') {
    return null
  }

  return maroonPalettes[isDark ? 'dark' : 'light']
}

function createCssVars(palette: AppThemePalette | null, isDark: boolean): Record<string, string> {
  if (!palette) {
    return {
      '--app-accent': isDark ? '#70c0e8' : '#2080f0',
    }
  }

  return {
    '--app-bg': palette.background,
    '--app-card': palette.card,
    '--app-popover': palette.popover,
    '--app-primary': palette.primary,
    '--app-accent': palette.accent,
    '--app-text': palette.text,
    '--app-text-muted': palette.textMuted,
    '--app-border': palette.border,
  }
}

function createThemeOverrides(palette: AppThemePalette | null, isDark: boolean): GlobalThemeOverrides {
  if (!palette) {
    return baseThemeOverrides
  }

  const buttonPrimaryColor = isDark ? palette.accent : palette.primary
  const buttonPrimaryHover = isDark ? palette.accentHover : palette.primaryHover
  const buttonPrimaryPressed = isDark ? palette.accentPressed : palette.primaryPressed
  const buttonPrimaryText = isDark ? '#171114' : '#FFFFFF'

  return {
    ...baseThemeOverrides,
    common: {
      primaryColor: palette.primary,
      primaryColorHover: palette.primaryHover,
      primaryColorPressed: palette.primaryPressed,
      primaryColorSuppl: palette.accent,
      bodyColor: palette.background,
      cardColor: palette.card,
      modalColor: palette.popover,
      popoverColor: palette.popover,
      tableColor: palette.card,
      textColorBase: palette.text,
      textColor1: palette.text,
      textColor2: palette.textMuted,
      textColor3: palette.textMuted,
      borderColor: palette.border,
      dividerColor: palette.border,
    },
    Layout: {
      color: palette.background,
      colorEmbedded: palette.background,
      headerColor: palette.background,
      siderColor: palette.background,
      footerColor: palette.background,
    },
    Card: {
      ...baseThemeOverrides.Card,
      color: palette.card,
      colorEmbedded: palette.card,
      borderColor: palette.border,
    },
    Button: {
      ...baseThemeOverrides.Button,
      colorPrimary: buttonPrimaryColor,
      colorHoverPrimary: buttonPrimaryHover,
      colorPressedPrimary: buttonPrimaryPressed,
      colorFocusPrimary: buttonPrimaryHover,
      colorDisabledPrimary: buttonPrimaryColor,
      textColorPrimary: buttonPrimaryText,
      textColorHoverPrimary: buttonPrimaryText,
      textColorPressedPrimary: buttonPrimaryText,
      textColorFocusPrimary: buttonPrimaryText,
      textColorDisabledPrimary: buttonPrimaryText,
      textColorTextPrimary: buttonPrimaryColor,
      textColorTextHoverPrimary: buttonPrimaryHover,
      textColorTextPressedPrimary: buttonPrimaryPressed,
      textColorTextFocusPrimary: buttonPrimaryHover,
      textColorGhostPrimary: buttonPrimaryColor,
      textColorGhostHoverPrimary: buttonPrimaryHover,
      textColorGhostPressedPrimary: buttonPrimaryPressed,
      textColorGhostFocusPrimary: buttonPrimaryHover,
      textColorGhostDisabledPrimary: buttonPrimaryColor,
      borderPrimary: `1px solid ${buttonPrimaryColor}`,
      borderHoverPrimary: `1px solid ${buttonPrimaryHover}`,
      borderPressedPrimary: `1px solid ${buttonPrimaryPressed}`,
      borderFocusPrimary: `1px solid ${buttonPrimaryHover}`,
      borderDisabledPrimary: `1px solid ${buttonPrimaryColor}`,
      rippleColorPrimary: buttonPrimaryColor,
    },
    FloatButton: {
      colorPrimary: buttonPrimaryColor,
      colorPrimaryHover: buttonPrimaryHover,
      colorPrimaryPressed: buttonPrimaryPressed,
      textColorPrimary: buttonPrimaryText,
    },
    Checkbox: {
      checkMarkColor: isDark ? '#171114' : '#FFFFFF',
    },
    Typography: {
      headerBarColor: buttonPrimaryColor,
      headerBarColorPrimary: buttonPrimaryColor,
    },
    Input: {
      ...baseThemeOverrides.Input,
      color: palette.card,
      colorFocus: palette.card,
      border: `1px solid ${palette.border}`,
      borderHover: `1px solid ${palette.primary}`,
      borderFocus: `1px solid ${palette.primary}`,
    },
  }
}

export function isThemeFamily(value: unknown): value is ThemeFamily {
  return themeFamilyOptions.some(option => option.key === value)
}

export function getThemeFamilyLabel(themeFamily: ThemeFamily) {
  return themeFamilyOptions.find(option => option.key === themeFamily)?.label ?? '未知主题'
}

export function createAppThemeOptions(isDark: boolean, themeFamily = DEFAULT_THEME_FAMILY): AppThemeOptions {
  const palette = getActivePalette(themeFamily, isDark)

  return {
    theme: isDark ? darkTheme : null,
    themeOverrides: createThemeOverrides(palette, isDark),
    cssVars: createCssVars(palette, isDark),
  }
}
