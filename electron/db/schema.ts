import { getDb } from './connection'

export function initializeDatabase() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS imported_files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      original_path TEXT,
      stored_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      mtime_ns INTEGER,
      modified_at TEXT,
      sha256 TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      latest_run_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_imported_files_original_name
      ON imported_files(original_name);

    CREATE INDEX IF NOT EXISTS idx_imported_files_sha256
      ON imported_files(sha256);

    CREATE INDEX IF NOT EXISTS idx_imported_files_imported_at
      ON imported_files(imported_at);

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      imported_file_id TEXT NOT NULL,
      status TEXT NOT NULL,
      tool_version TEXT,
      schema_name TEXT,
      schema_version TEXT,
      parameter_column TEXT,
      parameter_group_by TEXT,
      total_count INTEGER,
      result_json_path TEXT,
      error_message TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      read_at TEXT,
      FOREIGN KEY (imported_file_id) REFERENCES imported_files(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_analysis_runs_imported_file_id
      ON analysis_runs(imported_file_id);

    CREATE INDEX IF NOT EXISTS idx_analysis_runs_started_at
      ON analysis_runs(started_at);

    CREATE INDEX IF NOT EXISTS idx_analysis_runs_status
      ON analysis_runs(status);

    CREATE INDEX IF NOT EXISTS idx_analysis_runs_read_at
      ON analysis_runs(read_at);
  `)
}
