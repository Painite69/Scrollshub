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

export type QuestHubDesktopApi = {
  isDesktop: true
  platform: 'win32' | 'darwin' | 'linux'
  openOverlay: () => void
  toggleOverlay: () => void
  closeOverlay: () => void
  focusMain: (opts?: { path?: string }) => void
  setClickThrough: (ignore: boolean) => void
  getDisplayLayout: () => Promise<OverlayDisplayLayout>
  onDisplayLayoutChanged: (cb: (layout: OverlayDisplayLayout) => void) => () => void
}

declare global {
  interface Window {
    questHubDesktop?: QuestHubDesktopApi
  }
}

export {}
