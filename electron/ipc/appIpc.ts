import { app, ipcMain } from 'electron'
import { getCityTierStatsRuntimeVersion } from '../services/runtimeService'

export function registerAppIpc() {
  ipcMain.handle('app:get-about', async () => {
    return {
      appVersion: app.getVersion(),
      runtimeVersion: await getCityTierStatsRuntimeVersion(),
    }
  })
}
