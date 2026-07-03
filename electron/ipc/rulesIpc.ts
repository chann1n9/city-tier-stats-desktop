import { ipcMain } from 'electron'
import {
  addCityToTier,
  openRulesDirectory,
  openRulesFile,
  reloadRules,
  removeCityFromRules,
  resetRulesToDefault,
  type CityTierCode,
} from '../services/ruleService'

interface AddCityPayload {
  tier?: CityTierCode
  city?: string
}

interface RemoveCityPayload {
  tier?: CityTierCode
  city?: string
}

export function registerRulesIpc() {
  ipcMain.handle('rules:get', () => {
    return reloadRules()
  })

  ipcMain.handle('rules:reload', () => {
    return reloadRules()
  })

  ipcMain.handle('rules:reset-default', () => {
    return resetRulesToDefault()
  })

  ipcMain.handle('rules:open-file', () => {
    return openRulesFile()
  })

  ipcMain.handle('rules:open-directory', () => {
    return openRulesDirectory()
  })

  ipcMain.handle('rules:add-city', (_event, payload?: AddCityPayload) => {
    if (!payload?.tier) {
      throw new Error('rules:add-city requires tier')
    }

    if (!payload.city) {
      throw new Error('rules:add-city requires city')
    }

    return addCityToTier({
      tier: payload.tier,
      city: payload.city,
    })
  })

  ipcMain.handle('rules:remove-city', (_event, payload?: RemoveCityPayload) => {
    if (!payload?.city) {
      throw new Error('rules:remove-city requires city')
    }

    return removeCityFromRules({
      tier: payload.tier,
      city: payload.city,
    })
  })
}
