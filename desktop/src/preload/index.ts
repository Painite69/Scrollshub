import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

export type OverlayDisplayInfo = {
  id: number
  label: string
  primary: boolean
  bounds: { x: number; y: number; width: number; height: number }
}

export type OverlayDisplayLayout = {
  virtual: { x: number; y: number; width: number; height: number }
  displays: OverlayDisplayInfo[]
}

contextBridge.exposeInMainWorld('questHubDesktop', {
  isDesktop: true,
  platform: process.platform as 'win32' | 'darwin' | 'linux',
  openOverlay: () => {
    ipcRenderer.send('questhub:open-overlay')
  },
  toggleOverlay: () => {
    ipcRenderer.send('questhub:toggle-overlay')
  },
  closeOverlay: () => {
    ipcRenderer.send('questhub:close-overlay')
  },
  focusMain: (opts?: { path?: string }) => {
    ipcRenderer.send('questhub:focus-main', opts ?? {})
  },
  setClickThrough: (ignore: boolean) => {
    ipcRenderer.send('questhub:set-click-through', ignore)
  },
  getDisplayLayout: (): Promise<OverlayDisplayLayout> => {
    return ipcRenderer.invoke('questhub:get-display-layout')
  },
  onDisplayLayoutChanged: (cb: (layout: OverlayDisplayLayout) => void) => {
    const handler = (_event: IpcRendererEvent, layout: OverlayDisplayLayout) => {
      cb(layout)
    }
    ipcRenderer.on('questhub:display-layout', handler)
    return () => {
      ipcRenderer.removeListener('questhub:display-layout', handler)
    }
  },
})
