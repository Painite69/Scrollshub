import { useCallback, useEffect, useState } from 'react'
import OverlayShell from '../components/overlay/overlay_shell'
import OverlayControlRail from '../components/overlay/overlay_control_rail'
import OverlayPanelBody from '../components/overlay/overlay_panel_body'
import { useOverlayClickThrough } from '../hooks/use_overlay_click_through'
import {
  fallbackSingleDisplayLayout,
  resolveHomeDisplay,
  toLocalDisplayLayout,
  type OverlayDisplayLayoutLocal,
} from '../lib/overlay_displays'
import {
  loadOverlaySettings,
  patchOverlaySettings,
  type OverlaySettings,
} from '../types/overlay_settings'

export default function OverlayPage() {
  const [settings, setSettings] = useState<OverlaySettings>(() => loadOverlaySettings())
  const [layout, setLayout] = useState<OverlayDisplayLayoutLocal>(() =>
    fallbackSingleDisplayLayout(),
  )
  const [addScrollRequest, setAddScrollRequest] = useState(0)
  const [addFlowActive, setAddFlowActive] = useState(false)
  const isDesktop = Boolean(window.questHubDesktop?.isDesktop)

  useOverlayClickThrough(isDesktop)

  useEffect(() => {
    document.documentElement.classList.add('desktop-overlay')
    document.body.classList.add('desktop-overlay')
    return () => {
      document.documentElement.classList.remove('desktop-overlay')
      document.body.classList.remove('desktop-overlay')
    }
  }, [])

  useEffect(() => {
    const api = window.questHubDesktop
    if (!api?.getDisplayLayout) {
      function onResize() {
        setLayout(fallbackSingleDisplayLayout())
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let unsub = () => {}
    void api.getDisplayLayout().then(raw => {
      setLayout(toLocalDisplayLayout(raw))
    })
    unsub = api.onDisplayLayoutChanged(raw => {
      setLayout(toLocalDisplayLayout(raw))
    })
    return () => unsub()
  }, [])

  const onSettingsChange = useCallback((patch: Partial<OverlaySettings>) => {
    setSettings(prev => patchOverlaySettings(prev, patch))
  }, [])

  const home = resolveHomeDisplay(layout, settings.homeDisplayId)

  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent">
      <OverlayShell
        settings={settings}
        onSettingsChange={onSettingsChange}
        homeBounds={home.bounds}
        displayLayout={layout}
        showHomeBar
        suppressAutoHide={addFlowActive}
        controlRail={
          <OverlayControlRail
            settings={settings}
            onSettingsChange={onSettingsChange}
            onAddScroll={() => setAddScrollRequest(n => n + 1)}
            onOpenInApp={() => window.questHubDesktop?.focusMain({ path: '/' })}
            onCloseOverlay={
              isDesktop ? () => window.questHubDesktop?.closeOverlay() : undefined
            }
          />
        }
      >
        <OverlayPanelBody
          settings={settings}
          onSettingsChange={onSettingsChange}
          addScrollRequest={addScrollRequest}
          onAddFlowChange={setAddFlowActive}
          homeBounds={home.bounds}
        />
      </OverlayShell>
    </div>
  )
}
