import { getDb } from './connection'
import { setLatestRunId } from './importedFilesRepo'

export type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface AnalysisRun {
  id: string
  imported_file_id: string
  status: AnalysisRunStatus
  tool_version: string | null
  schema_name: string | null
  schema_version: string | null
  parameter_column: string | null
  parameter_group_by: string | null
  total_count: number | null
  result_json_path: string | null
  error_message: string | null
  started_at: string
  finished_at: string | null
  read_at: string | null
}

export interface AnalysisRunListItem extends AnalysisRun {
  original_name: string
  original_path: string | null
}

export type AnalysisRunSortOrder = 'started_at_desc' | 'started_at_asc' | 'original_name_asc'
export type AnalysisRunReadState = 'all' | 'unread' | 'read'

export interface SearchAnalysisRunsInput {
  keyword?: string
  readState?: AnalysisRunReadState
  startedAtFrom?: string
  startedAtTo?: string
  sortOrder?: AnalysisRunSortOrder
  page?: number
  pageSize?: number
}

export interface AnalysisRunReadStateCounts {
  all: number
  unread: number
  read: number
}

interface AnalysisRunReadStateCountRow {
  all_count: number | null
  unread_count: number | null
  read_count: number | null
}

export interface PaginatedAnalysisRuns {
  items: AnalysisRunListItem[]
  total: number
  readStateCounts: AnalysisRunReadStateCounts
}

function normalizePositiveInteger(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(maximum, Math.max(1, Math.trunc(value as number)))
}

export interface CreateAnalysisRunInput {
  id: string
  importedFileId: string
  status: AnalysisRunStatus
  toolVersion?: string | null
  schemaName?: string | null
  schemaVersion?: string | null
  parameterColumn?: string | null
  parameterGroupBy?: string | null
  totalCount?: number | null
  resultJsonPath?: string | null
  errorMessage?: string | null
  startedAt: string
  finishedAt?: string | null
  readAt?: string | null
}

export function createAnalysisRun(input: CreateAnalysisRunInput) {
  const db = getDb()
  const createRun = db.transaction(() => {
    db.prepare(`
      INSERT INTO analysis_runs (
        id,
        imported_file_id,
        status,
        tool_version,
        schema_name,
        schema_version,
        parameter_column,
        parameter_group_by,
        total_count,
        result_json_path,
        error_message,
        started_at,
        finished_at,
        read_at
      ) VALUES (
        @id,
        @importedFileId,
        @status,
        @toolVersion,
        @schemaName,
        @schemaVersion,
        @parameterColumn,
        @parameterGroupBy,
        @totalCount,
        @resultJsonPath,
        @errorMessage,
        @startedAt,
        @finishedAt,
        @readAt
      )
    `).run({
      ...input,
      toolVersion: input.toolVersion ?? null,
      schemaName: input.schemaName ?? null,
      schemaVersion: input.schemaVersion ?? null,
      parameterColumn: input.parameterColumn ?? null,
      parameterGroupBy: input.parameterGroupBy ?? null,
      totalCount: input.totalCount ?? null,
      resultJsonPath: input.resultJsonPath ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt: input.finishedAt ?? null,
      readAt: input.readAt ?? null,
    })

    setLatestRunId(input.importedFileId, input.id)
  })

  createRun()
}

export function getAnalysisRun(id: string) {
  return getDb()
    .prepare<string, AnalysisRun>(`
      SELECT *
      FROM analysis_runs
      WHERE id = ?
    `)
    .get(id) ?? null
}

export function listAnalysisRunsByFile(importedFileId: string) {
  return getDb()
    .prepare<string, AnalysisRun>(`
      SELECT *
      FROM analysis_runs
      WHERE imported_file_id = ?
      ORDER BY started_at DESC
    `)
    .all(importedFileId)
}

export function listAnalysisRuns(keyword = '') {
  const normalizedKeyword = keyword.trim()
  const pattern = `%${normalizedKeyword}%`

  return getDb()
    .prepare<string, AnalysisRunListItem>(`
      SELECT
        analysis_runs.*,
        imported_files.original_name,
        imported_files.original_path
      FROM analysis_runs
      INNER JOIN imported_files
        ON imported_files.id = analysis_runs.imported_file_id
      WHERE imported_files.original_name LIKE ?
      ORDER BY analysis_runs.started_at DESC
    `)
    .all(pattern)
}

export function searchAnalysisRuns(input: SearchAnalysisRunsInput = {}): PaginatedAnalysisRuns {
  const keyword = input.keyword?.trim() ?? ''
  const page = normalizePositiveInteger(input.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = normalizePositiveInteger(input.pageSize, 25, 100)
  const baseConditions: string[] = []
  const baseParameters: Array<string | number> = []

  if (keyword) {
    baseConditions.push('(imported_files.original_name LIKE ? OR imported_files.original_path LIKE ?)')
    const pattern = `%${keyword}%`
    baseParameters.push(pattern, pattern)
  }

  if (input.startedAtFrom) {
    baseConditions.push('analysis_runs.started_at >= ?')
    baseParameters.push(input.startedAtFrom)
  }

  if (input.startedAtTo) {
    baseConditions.push('analysis_runs.started_at <= ?')
    baseParameters.push(input.startedAtTo)
  }

  const conditions = [...baseConditions]
  const parameters = [...baseParameters]

  if (input.readState === 'unread') {
    conditions.push('analysis_runs.read_at IS NULL')
  }

  if (input.readState === 'read') {
    conditions.push('analysis_runs.read_at IS NOT NULL')
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''
  const baseWhereClause = baseConditions.length > 0
    ? `WHERE ${baseConditions.join(' AND ')}`
    : ''
  const db = getDb()
  const readStateCounts = db
    .prepare<Array<string | number>, AnalysisRunReadStateCountRow>(`
      SELECT
        COUNT(*) AS all_count,
        SUM(CASE WHEN analysis_runs.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count,
        SUM(CASE WHEN analysis_runs.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_count
      FROM analysis_runs
      INNER JOIN imported_files
        ON imported_files.id = analysis_runs.imported_file_id
      ${baseWhereClause}
    `)
    .get(...baseParameters) ?? { all_count: 0, unread_count: 0, read_count: 0 }
  const total = db
    .prepare<Array<string | number>, { total: number }>(`
      SELECT COUNT(*) AS total
      FROM analysis_runs
      INNER JOIN imported_files
        ON imported_files.id = analysis_runs.imported_file_id
      ${whereClause}
    `)
    .get(...parameters)?.total ?? 0
  const offset = (page - 1) * pageSize
  const items = db
    .prepare<Array<string | number>, AnalysisRunListItem>(`
      SELECT
        analysis_runs.*,
        imported_files.original_name,
        imported_files.original_path
      FROM analysis_runs
      INNER JOIN imported_files
        ON imported_files.id = analysis_runs.imported_file_id
      ${whereClause}
      ORDER BY analysis_runs.started_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(...parameters, pageSize, offset)

  return {
    items,
    total,
    readStateCounts: {
      all: readStateCounts.all_count ?? 0,
      unread: readStateCounts.unread_count ?? 0,
      read: readStateCounts.read_count ?? 0,
    },
  }
}

export function markAnalysisRunRead(id: string, readAt = new Date().toISOString()) {
  getDb()
    .prepare(`
      UPDATE analysis_runs
      SET read_at = COALESCE(read_at, @readAt)
      WHERE id = @id
    `)
    .run({
      id,
      readAt,
    })

  return getAnalysisRun(id)
}

export function updateAnalysisRunStatus(
  id: string,
  status: AnalysisRunStatus,
  fields: Partial<Pick<AnalysisRun, 'error_message' | 'finished_at' | 'result_json_path' | 'total_count'>> = {},
) {
  getDb()
    .prepare(`
      UPDATE analysis_runs
      SET
        status = @status,
        error_message = @errorMessage,
        finished_at = @finishedAt,
        result_json_path = @resultJsonPath,
        total_count = @totalCount
      WHERE id = @id
    `)
    .run({
      id,
      status,
      errorMessage: fields.error_message ?? null,
      finishedAt: fields.finished_at ?? null,
      resultJsonPath: fields.result_json_path ?? null,
      totalCount: fields.total_count ?? null,
    })
}

export function deleteAnalysisRun(id: string) {
  const db = getDb()
  const deleteRun = db.transaction(() => {
    const run = db
      .prepare<string, Pick<AnalysisRun, 'imported_file_id'> & { result_json_path: string | null }>(`
        SELECT imported_file_id, result_json_path
        FROM analysis_runs
        WHERE id = ?
      `)
      .get(id)

    if (!run) {
      return null
    }

    db.prepare(`
      DELETE FROM analysis_runs
      WHERE id = ?
    `).run(id)

    const latestRun = db
      .prepare<string, Pick<AnalysisRun, 'id'>>(`
        SELECT id
        FROM analysis_runs
        WHERE imported_file_id = ?
        ORDER BY started_at DESC
        LIMIT 1
      `)
      .get(run.imported_file_id)

    setLatestRunId(run.imported_file_id, latestRun?.id ?? null)

    return {
      importedFileId: run.imported_file_id,
      resultJsonPath: run.result_json_path,
    }
  })

  return deleteRun()
}
