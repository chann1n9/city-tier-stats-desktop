import { app } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createAnalysisRun, deleteAnalysisRun } from '../db/analysisRunsRepo'
import { createImportedFile } from '../db/importedFilesRepo'
import { ensureUserRulesFile } from './ruleService'
import { runCityTierStats, type RunCityTierStatsOptions } from './runtimeService'

interface CityTierStatsJson {
  schema: {
    name: string
    version: string
  }
  tool: {
    version: string
  }
  input: {
    file: {
      path: string
      name: string
      size_bytes: number
      modified_at: string
      mtime_ns: number
      sha256: string
    }
    parameters: {
      column: string
      group_by: string
    }
  }
  summary: {
    total: number
  }
}

export interface ImportAndAnalyzeFileInput {
  path: string
}

export interface ImportAndAnalyzeOptions extends RunCityTierStatsOptions {}

export interface ImportAndAnalyzeItem {
  importedFileId: string
  runId: string
  status: 'completed' | 'failed'
  resultJsonPath: string | null
  errorMessage: string | null
}

export async function importAndAnalyzeFiles(
  files: ImportAndAnalyzeFileInput[],
  options: ImportAndAnalyzeOptions = {},
) {
  const items: ImportAndAnalyzeItem[] = []

  for (const file of files) {
    items.push(await importAndAnalyzeFile(file.path, options))
  }

  return { items }
}

export async function deleteAnalysisRuns(ids: string[]) {
  const items = []

  for (const id of ids) {
    const deleted = deleteAnalysisRun(id)

    if (!deleted) {
      continue
    }

    if (deleted.resultJsonPath) {
      await unlink(deleted.resultJsonPath).catch(() => {
        // 可以忽略，避免 DB 已删但文件不存在导致整体失败
      })
    }

    items.push({
      id,
      importedFileId: deleted.importedFileId,
      resultJsonPath: deleted.resultJsonPath,
    })
  }

  return { items }
}

async function importAndAnalyzeFile(filePath: string, options: ImportAndAnalyzeOptions) {
  const importedFileId = randomUUID()
  const runId = randomUUID()
  const startedAt = new Date().toISOString()

  try {
    const configPath = await ensureUserRulesFile()
    const result = await runCityTierStats(filePath, {
      ...options,
      configPath,
    })
    const json = assertCityTierStatsJson(result.json)
    const resultJsonPath = await writeResultJson(runId, result.json)
    const finishedAt = new Date().toISOString()

    createImportedFile({
      id: importedFileId,
      originalName: json.input.file.name,
      originalPath: json.input.file.path,
      storedPath: filePath,
      sizeBytes: json.input.file.size_bytes,
      mtimeNs: json.input.file.mtime_ns,
      modifiedAt: json.input.file.modified_at,
      sha256: json.input.file.sha256,
      importedAt: startedAt,
    })

    createAnalysisRun({
      id: runId,
      importedFileId,
      status: 'completed',
      toolVersion: json.tool.version,
      schemaName: json.schema.name,
      schemaVersion: json.schema.version,
      parameterColumn: json.input.parameters.column,
      parameterGroupBy: json.input.parameters.group_by,
      totalCount: json.summary.total,
      resultJsonPath,
      startedAt,
      finishedAt,
    })

    return {
      importedFileId,
      runId,
      status: 'completed',
      resultJsonPath,
      errorMessage: null,
    } satisfies ImportAndAnalyzeItem
  } catch (error) {
    return createFailedRun(importedFileId, runId, filePath, startedAt, error)
  }
}

async function createFailedRun(
  importedFileId: string,
  runId: string,
  filePath: string,
  startedAt: string,
  error: unknown,
) {
  const finishedAt = new Date().toISOString()
  const fileStats = await stat(filePath)
  const sha256 = await hashFile(filePath)

  createImportedFile({
    id: importedFileId,
    originalName: path.basename(filePath),
    originalPath: filePath,
    storedPath: filePath,
    sizeBytes: fileStats.size,
    mtimeNs: Math.round(fileStats.mtimeMs * 1_000_000),
    modifiedAt: fileStats.mtime.toISOString(),
    sha256,
    importedAt: startedAt,
  })

  createAnalysisRun({
    id: runId,
    importedFileId,
    status: 'failed',
    errorMessage: error instanceof Error ? error.message : String(error),
    startedAt,
    finishedAt,
  })

  return {
    importedFileId,
    runId,
    status: 'failed',
    resultJsonPath: null,
    errorMessage: error instanceof Error ? error.message : String(error),
  } satisfies ImportAndAnalyzeItem
}

async function writeResultJson(runId: string, json: unknown) {
  const resultsDir = path.join(app.getPath('userData'), 'results')
  await mkdir(resultsDir, { recursive: true })

  const resultJsonPath = path.join(resultsDir, `${runId}.json`)
  await writeFile(resultJsonPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8')

  return resultJsonPath
}

async function hashFile(filePath: string) {
  const hash = createHash('sha256')

  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve)
  })

  return hash.digest('hex')
}

function assertCityTierStatsJson(json: unknown): CityTierStatsJson {
  if (!isObject(json)) {
    throw new Error('city-tier-stats JSON output must be an object')
  }

  return json as unknown as CityTierStatsJson
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
