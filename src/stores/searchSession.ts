import { defineStore } from 'pinia'

export type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'
export type ReadStateFilter = 'all' | 'unread' | 'read'

export interface SearchSessionRun {
  id: string
  imported_file_id: string
  status: AnalysisRunStatus
  total_count: number | null
  error_message: string | null
  started_at: string
  finished_at: string | null
  original_name: string
  original_path: string | null
  read_at: string | null
}

export interface SearchSessionReadStateCounts {
  all: number
  unread: number
  read: number
}

export interface SearchSessionFilters {
  keyword: string
  readState: ReadStateFilter
  startedAtRange: [number, number] | null
  page: number
  pageSize: number
}

export interface SearchSnapshotSession {
  id: string
  createdAt: string
  filters: SearchSessionFilters
  items: SearchSessionRun[]
  total: number
  readStateCounts: SearchSessionReadStateCounts
  scrollTop: number
}

interface CreateSessionInput {
  filters?: Partial<SearchSessionFilters>
  items?: SearchSessionRun[]
  total?: number
  readStateCounts?: SearchSessionReadStateCounts
  scrollTop?: number
}

interface SetResultsInput {
  items: SearchSessionRun[]
  total: number
  readStateCounts: SearchSessionReadStateCounts
}

const defaultFilters: SearchSessionFilters = {
  keyword: '',
  readState: 'all',
  startedAtRange: null,
  page: 1,
  pageSize: 25,
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useSearchSessionStore = defineStore('searchSession', {
  state: () => ({
    session: null as SearchSnapshotSession | null,
  }),
  getters: {
    hasSession: (state) => state.session !== null,
  },
  actions: {
    createSession(input: CreateSessionInput = {}) {
      this.session = {
        id: createSessionId(),
        createdAt: new Date().toISOString(),
        filters: {
          ...defaultFilters,
          ...input.filters,
        },
        items: input.items ?? [],
        total: input.total ?? input.items?.length ?? 0,
        readStateCounts: input.readStateCounts ?? {
          all: input.total ?? input.items?.length ?? 0,
          unread: input.items?.filter((run) => run.read_at === null).length ?? 0,
          read: input.items?.filter((run) => run.read_at !== null).length ?? 0,
        },
        scrollTop: input.scrollTop ?? 0,
      }
    },
    clearSession() {
      this.session = null
    },
    updateFilters(filters: Partial<SearchSessionFilters>) {
      if (!this.session) {
        this.createSession({ filters })
        return
      }

      this.session.filters = {
        ...this.session.filters,
        ...filters,
      }
    },
    setResults({ items, total, readStateCounts }: SetResultsInput) {
      if (!this.session) {
        this.createSession({ items, total, readStateCounts })
        return
      }

      this.session.items = items
      this.session.total = total
      this.session.readStateCounts = readStateCounts
    },
    setScrollTop(scrollTop: number) {
      if (this.session) {
        this.session.scrollTop = Math.max(0, scrollTop)
      }
    },
    markRunRead(runId: string, readAt = new Date().toISOString()) {
      const item = this.session?.items.find((run) => run.id === runId)

      if (item) {
        const wasUnread = item.read_at === null
        item.read_at = readAt

        if (wasUnread && this.session) {
          this.session.readStateCounts.unread = Math.max(0, this.session.readStateCounts.unread - 1)
          this.session.readStateCounts.read += 1
        }
      }
    },
    removeRun(runId: string) {
      if (!this.session) {
        return
      }

      const item = this.session.items.find((run) => run.id === runId)

      if (!item) {
        return
      }

      this.session.items = this.session.items.filter((run) => run.id !== runId)
      this.session.total = Math.max(0, this.session.total - 1)
      this.session.readStateCounts.all = Math.max(0, this.session.readStateCounts.all - 1)

      if (item.read_at === null) {
        this.session.readStateCounts.unread = Math.max(0, this.session.readStateCounts.unread - 1)
      } else {
        this.session.readStateCounts.read = Math.max(0, this.session.readStateCounts.read - 1)
      }
    },
  },
})
