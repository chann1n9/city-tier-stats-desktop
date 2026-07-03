import { getDb } from './connection'

export interface ImportedFile {
  id: string
  original_name: string
  original_path: string | null
  stored_path: string
  size_bytes: number
  mtime_ns: number | null
  modified_at: string | null
  sha256: string
  imported_at: string
  latest_run_id: string | null
}

export interface ImportedFileListItem extends ImportedFile {
  latest_run_status: string | null
  latest_run_started_at: string | null
  latest_run_finished_at: string | null
  latest_run_total_count: number | null
}

export interface CreateImportedFileInput {
  id: string
  originalName: string
  originalPath?: string | null
  storedPath: string
  sizeBytes: number
  mtimeNs?: number | null
  modifiedAt?: string | null
  sha256: string
  importedAt: string
}

export function createImportedFile(input: CreateImportedFileInput) {
  const db = getDb()

  db.prepare(`
    INSERT INTO imported_files (
      id,
      original_name,
      original_path,
      stored_path,
      size_bytes,
      mtime_ns,
      modified_at,
      sha256,
      imported_at
    ) VALUES (
      @id,
      @originalName,
      @originalPath,
      @storedPath,
      @sizeBytes,
      @mtimeNs,
      @modifiedAt,
      @sha256,
      @importedAt
    )
  `).run({
    ...input,
    originalPath: input.originalPath ?? null,
    mtimeNs: input.mtimeNs ?? null,
    modifiedAt: input.modifiedAt ?? null,
  })
}

export function getImportedFile(id: string) {
  return getDb()
    .prepare<string, ImportedFile>(`
      SELECT *
      FROM imported_files
      WHERE id = ?
    `)
    .get(id) ?? null
}

export function listImportedFiles(keyword = '') {
  const normalizedKeyword = keyword.trim()
  const pattern = `%${normalizedKeyword}%`

  return getDb()
    .prepare<string, ImportedFileListItem>(`
      SELECT
        imported_files.*,
        analysis_runs.status AS latest_run_status,
        analysis_runs.started_at AS latest_run_started_at,
        analysis_runs.finished_at AS latest_run_finished_at,
        analysis_runs.total_count AS latest_run_total_count
      FROM imported_files
      LEFT JOIN analysis_runs
        ON analysis_runs.id = imported_files.latest_run_id
      WHERE imported_files.original_name LIKE ?
      ORDER BY imported_files.imported_at DESC
    `)
    .all(pattern)
}

export function setLatestRunId(fileId: string, runId: string | null) {
  getDb()
    .prepare(`
      UPDATE imported_files
      SET latest_run_id = ?
      WHERE id = ?
    `)
    .run(runId, fileId)
}
