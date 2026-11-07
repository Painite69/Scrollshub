import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours

/**
 * GitHub Releases auto-update (NSIS). Requires a published latest.yml + Setup exe.
 * Dev / unpackaged builds skip checks.
 */
export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null) {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('error', err => {
    console.error('[ScrollsHub] auto-update error', err)
  })

  autoUpdater.on('update-available', info => {
    console.info('[ScrollsHub] update available', info.version)
  })

  autoUpdater.on('update-downloaded', info => {
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

  const check = () => {
    void autoUpdater.checkForUpdates().catch(err => {
      console.error('[ScrollsHub] checkForUpdates failed', err)
    })
  }

  // Delay first check so startup stays snappy
  setTimeout(check, 8_000)
  setInterval(check, CHECK_INTERVAL_MS)
}
