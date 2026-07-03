import { defineStore } from 'pinia'

export type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface InboxSessionRun {
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

export interface InboxSnapshotSession {
  id: string
  createdAt: string
  items: InboxSessionRun[]
  total: number
  page: number
  pageSize: number
  scrollTop: number
}

interface CreateSessionInput {
  items?: InboxSessionRun[]
  total?: number
  page?: number
  pageSize?: number
  scrollTop?: number
}

interface SetResultsInput {
  items: InboxSessionRun[]
  total: number
  page: number
  pageSize: number
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useInboxSessionStore = defineStore('inboxSession', {
  state: () => ({
    session: null as InboxSnapshotSession | null,
  }),
  actions: {
    createSession(input: CreateSessionInput = {}) {
      this.session = {
        id: createSessionId(),
        createdAt: new Date().toISOString(),
        items: input.items ?? [],
        total: input.total ?? input.items?.length ?? 0,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 25,
        scrollTop: input.scrollTop ?? 0,
      }
    },
    clearSession() {
      this.session = null
    },
    setResults({ items, total, page, pageSize }: SetResultsInput) {
      if (!this.session) {
        this.createSession({ items, total, page, pageSize })
        return
      }

      this.session.items = items
      this.session.total = total
      this.session.page = page
      this.session.pageSize = pageSize
    },
    setScrollTop(scrollTop: number) {
      if (this.session) {
        this.session.scrollTop = Math.max(0, scrollTop)
      }
    },
    markRunRead(runId: string, readAt = new Date().toISOString()) {
      const item = this.session?.items.find((run) => run.id === runId)

      if (item) {
        item.read_at = readAt
      }
    },
    removeRun(runId: string) {
      if (!this.session) {
        return
      }

      const nextItems = this.session.items.filter((run) => run.id !== runId)

      if (nextItems.length !== this.session.items.length) {
        this.session.items = nextItems
        this.session.total = Math.max(0, this.session.total - 1)
      }
    },
  },
})
