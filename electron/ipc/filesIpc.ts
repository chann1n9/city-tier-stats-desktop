import { ipcMain } from 'electron'
import { getImportedFile, listImportedFiles } from '../db/importedFilesRepo'
import { importAndAnalyzeFiles } from '../services/analysisService'

interface ListFilesPayload {
  keyword?: string
}

interface GetFilePayload {
  id?: string
}

interface ImportAndAnalyzePayload {
  filePaths?: string[]
  groupBy?: boolean | string
}

export function registerFilesIpc() {
  ipcMain.handle('files:list', (_event, payload?: ListFilesPayload) => {
    return listImportedFiles(payload?.keyword ?? '')
  })

  ipcMain.handle('files:get', (_event, payload?: GetFilePayload) => {
    if (!payload?.id) {
      throw new Error('files:get requires id')
    }

    return getImportedFile(payload.id)
  })

  ipcMain.handle('files:import-and-analyze', async (_event, payload?: ImportAndAnalyzePayload) => {
    const filePaths = payload?.filePaths ?? []

    if (filePaths.length === 0) {
      throw new Error('files:import-and-analyze requires filePaths')
    }

    return importAndAnalyzeFiles(
      filePaths.map(filePath => ({ path: filePath })),
      { groupBy: payload?.groupBy },
    )
  })
}
