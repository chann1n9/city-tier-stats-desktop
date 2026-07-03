import { app, BrowserWindow, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { closeDb } from './db/connection'
import { initializeDatabase } from './db/schema'
import { registerIpcHandlers } from './ipc'
import { ensureUserRulesFile } from './services/ruleService'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// i18n没搞，有的组件是英文

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let hasRegisteredIpcHandlers = false
let hasCompletedStartup = false
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const appIconPath = getAppIconPath()
const dockIconPath = path.join(process.env.APP_ROOT, 'build', 'icons', 'png', '512x512.png')

function getAppIconPath() {
  const iconsRoot = path.join(process.env.APP_ROOT, 'build', 'icons')

  if (isWindows) {
    return path.join(iconsRoot, 'win', 'icon.ico')
  }

  if (isMac) {
    return path.join(iconsRoot, 'mac', 'icon.icns')
  }

  return path.join(iconsRoot, 'png', '512x512.png')
}

function createWindow() {
  if (win && !win.isDestroyed()) {
    win.focus()
    return
  }

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 680,
    icon: appIconPath,
    autoHideMenuBar: isWindows,
    titleBarStyle: isMac ? 'hidden' : 'default',
    trafficLightPosition: isMac ? { x: 18, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  win.on('closed', () => {
    win = null
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function registerIpcHandlersOnce() {
  if (hasRegisteredIpcHandlers) {
    return
  }

  registerIpcHandlers()
  hasRegisteredIpcHandlers = true
}

function logStartupError(message: string, error: unknown) {
  console.error(message, error instanceof Error ? error.stack ?? error.message : error)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (hasCompletedStartup && BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  closeDb()
})

app.whenReady().then(async () => {
  if (isWindows) {
    Menu.setApplicationMenu(null)
  }

  if (isMac) {
    const dockIcon = nativeImage.createFromPath(dockIconPath)

    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    } else {
      console.warn(`Failed to load Dock icon from ${dockIconPath}`)
    }
  }

  registerIpcHandlersOnce()

  try {
    initializeDatabase()
  } catch (error) {
    logStartupError('Failed to initialize database', error)
  }

  try {
    await ensureUserRulesFile()
  } catch (error) {
    logStartupError('Failed to initialize user rules file', error)
  }

  hasCompletedStartup = true
  createWindow()
})
