import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

/** How often to poll GitHub Releases while the app is running. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes
/** Don't spam checks when the user alt-tabs a lot. */
const FOCUS_CHECK_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

/**
 * GitHub Releases auto-update (NSIS). Requires a published latest.yml + Setup exe.
 * Dev / unpackaged builds skip checks.
 *
 * Checks: shortly after startup, on an interval, and when the main window is focused
 * again after being away (same pattern many desktop apps use).
 */
export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null) {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  let lastCheckAt = 0
  let checking = false

  autoUpdater.on('error', err => {
    checking = false
    console.error('[ScrollsHub] auto-update error', err)
  })

  autoUpdater.on('update-available', info => {
    console.info('[ScrollsHub] update available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    checking = false
  })

  autoUpdater.on('update-downloaded', info => {
    checking = false
    const win = getMainWindow()
    const options: Electron.MessageBoxOptions = {
      type: 'info',
      title: 'Update ready',
      message: `ScrollsHub ${info.version} is ready to install.`,
      detail: 'Restart now to apply the update, or choose Later and it will install when you quit.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }
    const prompt = win && !win.isDestroyed()
      ? dialog.showMessageBox(win, options)
      : dialog.showMessageBox(options)
    void prompt.then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true)
      }
    })
  })

  const check = (reason: string, { force = false } = {}) => {
    const now = Date.now()
    if (checking) return
    if (!force && now - lastCheckAt < FOCUS_CHECK_COOLDOWN_MS && reason === 'focus') return
    checking = true
    lastCheckAt = now
    console.info('[ScrollsHub] checking for updates', reason)
    void autoUpdater
      .checkForUpdates()
      .catch(err => {
        console.error('[ScrollsHub] checkForUpdates failed', err)
      })
      .finally(() => {
        checking = false
      })
  }

  // Startup (slight delay so the window can show first)
  setTimeout(() => check('startup', { force: true }), 8_000)
  // Regular polling while the app stays open
  setInterval(() => check('interval', { force: true }), CHECK_INTERVAL_MS)

  // When user comes back to the app
  app.on('browser-window-focus', (_e, win) => {
    if (win === getMainWindow()) check('focus')
  })
}
