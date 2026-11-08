import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

/** How often to poll GitHub Releases while the app is running. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes
/** Don't spam checks when the user alt-tabs a lot. */
const FOCUS_CHECK_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

export type AutoUpdaterHooks = {
  getMainWindow: () => BrowserWindow | null
  /** Close overlay/main, unregister shortcuts — must run before quitAndInstall. */
  prepareForInstall: () => void
}

/**
 * GitHub Releases auto-update (NSIS).
 *
 * Restart flow must fully tear down BrowserWindows (especially the overlay) or
 * the NSIS updater sticks on "ScrollsHub can't be closed".
 */
export function setupAutoUpdater(hooks: AutoUpdaterHooks) {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  let lastCheckAt = 0
  let checking = false
  let installing = false

  autoUpdater.on('error', err => {
    checking = false
    console.error('[ScrollsHub] auto-update error', err)
    if (!installing) return
    installing = false
    void dialog.showMessageBox({
      type: 'error',
      title: 'Update failed',
      message: 'Could not install the update.',
      detail:
        `${err?.message ?? String(err)}\n\n` +
        'If ScrollsHub is installed on a drive/folder that needs admin rights, ' +
        'approve the UAC prompt, or reinstall to a user folder ' +
        '(e.g. %LocalAppData%\\Programs\\ScrollsHub).',
    })
  })

  autoUpdater.on('update-available', info => {
    console.info('[ScrollsHub] update available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    checking = false
  })

  autoUpdater.on('update-downloaded', info => {
    checking = false
    const win = hooks.getMainWindow()
    const options: Electron.MessageBoxOptions = {
      type: 'info',
      title: 'Update ready',
      message: `ScrollsHub ${info.version} is ready to install.`,
      detail:
        'Restart now to apply the update, or choose Later and it will install when you quit.\n\n' +
        'If Windows asks for admin permission, allow it — needed when the app is installed in a protected folder.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }
    const prompt = win && !win.isDestroyed()
      ? dialog.showMessageBox(win, options)
      : dialog.showMessageBox(options)
    void prompt.then(({ response }) => {
      if (response === 0) installNow()
    })
  })

  function installNow() {
    if (installing) return
    installing = true

    try {
      hooks.prepareForInstall()
    } catch (err) {
      console.error('[ScrollsHub] prepareForInstall failed', err)
    }

    for (const win of BrowserWindow.getAllWindows()) {
      try {
        win.removeAllListeners('close')
        if (!win.isDestroyed()) win.destroy()
      } catch {
        /* ignore */
      }
    }

    // Avoid quit races with window-all-closed while the installer starts
    app.removeAllListeners('window-all-closed')

    setImmediate(() => {
      try {
        // Show UI if elevation is needed; relaunch after install
        autoUpdater.quitAndInstall(false, true)
      } catch (err) {
        console.error('[ScrollsHub] quitAndInstall failed', err)
        installing = false
        return
      }
      // Hard exit if Electron stays alive (leftover transparent/overlay chrome)
      setTimeout(() => {
        app.exit(0)
      }, 1500)
    })
  }

  const check = (reason: string, { force = false } = {}) => {
    if (installing) return
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

  setTimeout(() => check('startup', { force: true }), 8_000)
  setInterval(() => check('interval', { force: true }), CHECK_INTERVAL_MS)

  app.on('browser-window-focus', (_e, win) => {
    if (win === hooks.getMainWindow()) check('focus')
  })
}
