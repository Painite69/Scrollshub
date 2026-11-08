import {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  screen,
  protocol,
  net,
  session,
} from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { APP_DEV_URL } from '../shared/constants'
import { setupAutoUpdater } from './updater'

/** Unique scheme (avoid generic `app` — Windows tries to find a Store app for it). */
const APP_SCHEME = 'scrollshub'
const APP_PARTITION = 'persist:questhub'

/** Must run before app is ready so absolute /asset paths resolve in production. */
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

const useBuiltApp = process.env.QUESTHUB_USE_BUILT === '1'
const isDev = !app.isPackaged && !useBuiltApp

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
/** Last click-through state — avoid spamming native calls from mousemove. */
let overlayClickThrough = true

function preloadPath(): string {
  return path.join(__dirname, '../preload/index.js')
}

function appIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'build', 'icon.ico')
  }
  return path.join(__dirname, '../../build/icon.ico')
}

function appRootDir(): string {
  if (!app.isPackaged) {
    return path.join(__dirname, '../../../dist')
  }
  return path.join(process.resourcesPath, 'app')
}

function resolveAppFile(pathname: string): string | null {
  const root = path.resolve(appRootDir())
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '')
  const filePath = path.resolve(root, relative || 'index.html')
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return null
  return filePath
}

function registerAppProtocol() {
  // Windows use a custom partition — register on that session, not the default one.
  const ses = session.fromPartition(APP_PARTITION)
  ses.protocol.handle(APP_SCHEME, (request) => {
    const { pathname } = new URL(request.url)
    const filePath = resolveAppFile(pathname === '/' ? '/index.html' : pathname)
    if (!filePath) return new Response('Forbidden', { status: 403 })
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

/** Hash routes; production uses scrollshub:// so absolute /mc_assets etc. work. */
function appUrl(route: string): string {
  const normalized = route.startsWith('/') ? route : `/${route}`
  if (isDev) return `${APP_DEV_URL}/#${normalized}`
  return `${APP_SCHEME}://localhost/index.html#${normalized}`
}

const sharedWebPreferences = {
  preload: preloadPath(),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  /** Shared localStorage between main and overlay windows. */
  partition: APP_PARTITION,
} as const

function virtualScreenBounds(): Electron.Rectangle {
  const displays = screen.getAllDisplays()
  if (displays.length === 0) return screen.getPrimaryDisplay().bounds
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x)
    minY = Math.min(minY, d.bounds.y)
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width)
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height)
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

type OverlayDisplayInfo = {
  id: number
  label: string
  primary: boolean
  bounds: { x: number; y: number; width: number; height: number }
}

type OverlayDisplayLayout = {
  virtual: { x: number; y: number; width: number; height: number }
  displays: OverlayDisplayInfo[]
}

function getOverlayDisplayLayout(): OverlayDisplayLayout {
  const virtual = virtualScreenBounds()
  const displays = screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    label: d.label || `Display ${i + 1}`,
    primary: d.id === screen.getPrimaryDisplay().id,
    bounds: {
      x: d.bounds.x,
      y: d.bounds.y,
      width: d.bounds.width,
      height: d.bounds.height,
    },
  }))
  return { virtual, displays }
}

function broadcastDisplayLayout() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  overlayWindow.webContents.send('questhub:display-layout', getOverlayDisplayLayout())
}

function applyOverlayWindowChrome(win: BrowserWindow) {
  const bounds = virtualScreenBounds()
  const current = win.getBounds()
  const needsMove =
    current.x !== bounds.x ||
    current.y !== bounds.y ||
    current.width !== bounds.width ||
    current.height !== bounds.height
  if (needsMove) win.setBounds(bounds)
  win.setMenu(null)
  win.setAutoHideMenuBar(true)
  win.setMenuBarVisibility(false)
  win.setBackgroundColor('#00000000')
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  overlayClickThrough = true
  win.setIgnoreMouseEvents(true, { forward: true })
}

/**
 * Windows Electron bug: frameless transparent windows can spawn a white
 * title bar on blur. Refresh chrome without unnecessary resize flicker.
 */
function scrubWindowsPhantomTitleBar(win: BrowserWindow) {
  if (process.platform !== 'win32' || win.isDestroyed()) return
  const target = virtualScreenBounds()
  const current = win.getBounds()
  const onTarget =
    current.x === target.x &&
    current.y === target.y &&
    current.width === target.width &&
    current.height === target.height
  if (!onTarget) win.setBounds(target)
  win.setBackgroundColor('#00000000')
  win.setMenu(null)
  win.setMenuBarVisibility(false)
  win.setAlwaysOnTop(true, 'screen-saver')
}

function setOverlayClickThrough(ignore: boolean) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  if (overlayClickThrough === ignore) return
  overlayClickThrough = ignore
  if (ignore) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    scrubWindowsPhantomTitleBar(overlayWindow)
  } else {
    overlayWindow.setIgnoreMouseEvents(false)
  }
}

function focusMainWindow(opts?: { path?: string }) {
  const route = opts?.path && opts.path.startsWith('/') ? opts.path : '/'
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (opts?.path) void mainWindow.loadURL(appUrl(route))
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    return
  }
  createMainWindow()
  if (mainWindow && opts?.path) void mainWindow.loadURL(appUrl(route))
}

function closeOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  overlayWindow.close()
}

/** Ctrl+R / F5 reload the focused window (no menu bar). */
function attachReloadShortcut(win: BrowserWindow) {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const key = input.key.toLowerCase()
    const reload =
      key === 'f5' || ((input.control || input.meta) && key === 'r' && !input.alt && !input.shift)
    if (!reload) return
    event.preventDefault()
    win.webContents.reload()
  })
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus()
    return
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'ScrollsHub',
    icon: appIconPath(),
    backgroundColor: '#120413',
    webPreferences: sharedWebPreferences,
  })

  attachReloadShortcut(mainWindow)

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.show()
    mainWindow.focus()
  })
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[ScrollsHub] main window failed to load', { code, desc, url })
  })
  void mainWindow.loadURL(appUrl('/'))
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createOverlayWindow() {
  const url = appUrl('/overlay')

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    void overlayWindow.loadURL(url)
    applyOverlayWindowChrome(overlayWindow)
    overlayWindow.showInactive()
    return
  }

  const bounds = virtualScreenBounds()
  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    show: false,
    title: 'QuestHub Overlay',
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin'
      ? { type: 'panel' as const, titleBarStyle: 'hidden' as const }
      : { type: 'toolbar' as const }),
    webPreferences: sharedWebPreferences,
  })

  overlayWindow.setMenu(null)
  overlayWindow.setMenuBarVisibility(false)
  attachReloadShortcut(overlayWindow)

  overlayWindow.once('ready-to-show', () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    applyOverlayWindowChrome(overlayWindow)
    overlayWindow.showInactive()
    broadcastDisplayLayout()
  })
  void overlayWindow.loadURL(url)

  overlayWindow.on('blur', () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    scrubWindowsPhantomTitleBar(overlayWindow)
    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  })
  overlayWindow.on('focus', () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    scrubWindowsPhantomTitleBar(overlayWindow)
  })

  const onDisplayMetrics = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return
    overlayWindow.setBounds(virtualScreenBounds())
    scrubWindowsPhantomTitleBar(overlayWindow)
    broadcastDisplayLayout()
  }
  screen.on('display-metrics-changed', onDisplayMetrics)
  screen.on('display-added', onDisplayMetrics)
  screen.on('display-removed', onDisplayMetrics)

  overlayWindow.webContents.on('did-finish-load', () => {
    broadcastDisplayLayout()
  })

  overlayWindow.on('closed', () => {
    screen.removeListener('display-metrics-changed', onDisplayMetrics)
    screen.removeListener('display-added', onDisplayMetrics)
    screen.removeListener('display-removed', onDisplayMetrics)
    overlayWindow = null
    overlayClickThrough = true
  })
}

function toggleOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide()
      return
    }
    applyOverlayWindowChrome(overlayWindow)
    overlayWindow.showInactive()
    return
  }
  createOverlayWindow()
}

function registerGlobalShortcuts() {
  const toggleAccel = process.platform === 'darwin' ? 'Command+Shift+O' : 'Ctrl+Shift+O'
  globalShortcut.register(toggleAccel, () => toggleOverlayWindow())
  // Open overlay (same as former Window menu)
  const openAccel = process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O'
  globalShortcut.register(openAccel, () => createOverlayWindow())
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  if (process.platform === 'linux') {
    app.commandLine.appendSwitch('enable-transparent-visuals')
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      createMainWindow()
    }
  })

  app.whenReady().then(() => {
    registerAppProtocol()
    Menu.setApplicationMenu(null)
    createMainWindow()
    registerGlobalShortcuts()
    setupAutoUpdater(() => mainWindow)

    ipcMain.on('questhub:open-overlay', () => createOverlayWindow())
    ipcMain.on('questhub:toggle-overlay', () => toggleOverlayWindow())
    ipcMain.on('questhub:close-overlay', () => closeOverlayWindow())
    ipcMain.on('questhub:set-click-through', (_event, ignore: boolean) => {
      setOverlayClickThrough(Boolean(ignore))
    })
    ipcMain.on('questhub:focus-main', (_event, opts?: { path?: string }) => {
      focusMainWindow(opts)
    })
    ipcMain.handle('questhub:get-display-layout', () => getOverlayDisplayLayout())

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
