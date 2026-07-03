import { BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  getAnalysisRun,
  listAnalysisRuns,
  listAnalysisRunsByFile,
  markAnalysisRunRead,
  searchAnalysisRuns,
  type SearchAnalysisRunsInput,
} from '../db/analysisRunsRepo'
import { getImportedFile } from '../db/importedFilesRepo'
import { deleteAnalysisRuns } from '../services/analysisService'
import { exportCityTierStatsDetailFromJson } from '../services/runtimeService'

interface ListRunsByFilePayload {
  importedFileId?: string
}

interface ListRunsPayload {
  keyword?: string
}

type SearchRunsPayload = SearchAnalysisRunsInput

interface GetRunPayload {
  id?: string
}

type ExportDetailFormat = 'xlsx' | 'csv'

interface ExportDetailPayload {
  id?: string
  format?: ExportDetailFormat
}

interface DeleteRunsPayload {
  ids?: string[]
}

export function registerRunsIpc() {
  ipcMain.handle('runs:list', (_event, payload?: ListRunsPayload) => {
    return listAnalysisRuns(payload?.keyword ?? '')
  })

  ipcMain.handle('runs:search', (_event, payload?: SearchRunsPayload) => {
    return searchAnalysisRuns(payload)
  })

  ipcMain.handle('runs:list-by-file', (_event, payload?: ListRunsByFilePayload) => {
    if (!payload?.importedFileId) {
      throw new Error('runs:list-by-file requires importedFileId')
    }

    return listAnalysisRunsByFile(payload.importedFileId)
  })

  ipcMain.handle('runs:get', (_event, payload?: GetRunPayload) => {
    if (!payload?.id) {
      throw new Error('runs:get requires id')
    }

    return getAnalysisRun(payload.id)
  })

  ipcMain.handle('runs:mark-read', (_event, payload?: GetRunPayload) => {
    if (!payload?.id) {
      throw new Error('runs:mark-read requires id')
    }

    return markAnalysisRunRead(payload.id)
  })

  ipcMain.handle('runs:get-result', async (_event, payload?: GetRunPayload) => {
    if (!payload?.id) {
      throw new Error('runs:get-result requires id')
    }

    const run = getAnalysisRun(payload.id)

    if (!run?.result_json_path) {
      return null
    }

    const resultJson = await readFile(run.result_json_path, 'utf8')
    return JSON.parse(resultJson)
  })

  ipcMain.handle('runs:delete', async (_event, payload?: DeleteRunsPayload) => {
    const ids = payload?.ids ?? []

    if (ids.length === 0) {
      throw new Error('runs:delete requires ids')
    }

    return deleteAnalysisRuns(ids)
  })

  ipcMain.handle('runs:export-detail', async (event, payload?: ExportDetailPayload) => {
    if (!payload?.id) {
      throw new Error('runs:export-detail requires id')
    }

    const format = payload.format ?? 'xlsx'

    if (format !== 'xlsx' && format !== 'csv') {
      throw new Error(`unsupported export format: ${format}`)
    }

    const run = getAnalysisRun(payload.id)

    if (!run?.result_json_path) {
      throw new Error('分析结果不存在，无法导出')
    }

    const file = getImportedFile(run.imported_file_id)
    const defaultFileName = buildExportFileName(file?.original_name ?? '分析详情', format)
    const ownerWindow = BrowserWindow.fromWebContents(event.sender)
    const saveDialogOptions = {
      title: '导出分析详情',
      defaultPath: defaultFileName,
      filters: [
        {
          name: format === 'xlsx' ? 'Excel 文件' : 'CSV 文件',
          extensions: [format],
        },
      ],
    }
    const saveResult = ownerWindow
      ? await dialog.showSaveDialog(ownerWindow, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions)

    if (saveResult.canceled || !saveResult.filePath) {
      return null
    }

    const outputPath = ensureExtension(saveResult.filePath, format)
    await exportCityTierStatsDetailFromJson(run.result_json_path, outputPath)

    return {
      path: outputPath,
    }
  })
}

function buildExportFileName(originalName: string, format: ExportDetailFormat) {
  const parsedName = path.parse(originalName).name || '分析详情'
  return `${sanitizeFileName(`ctt详情-${parsedName}`)}.${format}`
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
}

function ensureExtension(filePath: string, format: ExportDetailFormat) {
  return path.extname(filePath).toLowerCase() === `.${format}`
    ? filePath
    : `${filePath}.${format}`
}
