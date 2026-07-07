import { app, ipcMain, shell } from 'electron'
import { getCityTierStatsRuntimeVersion } from '../services/runtimeService'

const latestMetadataUrl = 'https://downloads.eastun.tech/city-tier-stats-desktop/latest.json'
const updateCheckTimeoutMs = 8000

interface LatestMetadata {
  version: string
  releaseDate: string
  minimumVersion: string
  notes: string[]
  downloads: {
    mac_arm64?: string
    win_x64?: string
  }
  releaseNotesUrl?: string
  mandatory?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertLatestMetadata(value: unknown): LatestMetadata {
  if (!isRecord(value)) {
    throw new Error('Invalid latest metadata response.')
  }

  const downloads = value.downloads

  if (
    typeof value.version !== 'string'
    || typeof value.releaseDate !== 'string'
    || typeof value.minimumVersion !== 'string'
    || !Array.isArray(value.notes)
    || !value.notes.every((note) => typeof note === 'string')
    || !isRecord(downloads)
  ) {
    throw new Error('Invalid latest metadata response.')
  }

  return {
    version: value.version,
    releaseDate: value.releaseDate,
    minimumVersion: value.minimumVersion,
    notes: value.notes,
    downloads: {
      mac_arm64: typeof downloads.mac_arm64 === 'string' ? downloads.mac_arm64 : undefined,
      win_x64: typeof downloads.win_x64 === 'string' ? downloads.win_x64 : undefined,
    },
    releaseNotesUrl: typeof value.releaseNotesUrl === 'string' ? value.releaseNotesUrl : undefined,
    mandatory: typeof value.mandatory === 'boolean' ? value.mandatory : false,
  }
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = right.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0

    if (leftPart > rightPart) {
      return 1
    }

    if (leftPart < rightPart) {
      return -1
    }
  }

  return 0
}

function getCurrentDownloadUrl(downloads: LatestMetadata['downloads']) {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return downloads.mac_arm64
  }

  if (process.platform === 'win32' && process.arch === 'x64') {
    return downloads.win_x64
  }

  return undefined
}

function assertHttpUrl(rawUrl: string) {
  const url = new URL(rawUrl)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Unsupported external URL protocol.')
  }

  return url.toString()
}

export function registerAppIpc() {
  ipcMain.handle('app:get-about', async () => {
    return {
      appVersion: app.getVersion(),
      runtimeVersion: await getCityTierStatsRuntimeVersion(),
    }
  })

  ipcMain.handle('app:check-update', async () => {
    const abortController = new AbortController()
    const timeout = setTimeout(() => {
      abortController.abort()
    }, updateCheckTimeoutMs)

    try {
      const response = await fetch(latestMetadataUrl, {
        headers: {
          accept: 'application/json',
        },
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch latest metadata: ${response.status}`)
      }

      const latest = assertLatestMetadata(await response.json())
      const currentVersion = app.getVersion()

      return {
        currentVersion,
        latest,
        hasUpdate: compareVersions(latest.version, currentVersion) > 0,
        downloadUrl: getCurrentDownloadUrl(latest.downloads),
      }
    } finally {
      clearTimeout(timeout)
    }
  })

  ipcMain.handle('app:open-external', async (_event, rawUrl: string) => {
    if (typeof rawUrl !== 'string') {
      throw new Error('External URL must be a string.')
    }

    await shell.openExternal(assertHttpUrl(rawUrl))
  })
}
