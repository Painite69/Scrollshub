import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  dockPanelRect,
  type OverlayDisplayBounds,
  type OverlayDisplayLayoutLocal,
} from '../../lib/overlay_displays'
import {
  isVerticalDock,
  sizeFractionForDock,
  type OverlayDock,
  type OverlayRevealMethod,
  type OverlaySettings,
} from '../../types/overlay_settings'
import OverlayHomeBar from './overlay_home_bar'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from '../icons'
import { OVERLAY_MODAL_HOST_ID } from '../../lib/overlay_modal'

const RAIL_GAP_PX = 18
const RESIZE_BAR_THICK = 2
const RESIZE_BAR_LEN = 128
const RESIZE_HIT_THICK = 12

type OverlayShellProps = {
  settings: OverlaySettings
  onSettingsChange: (patch: Partial<OverlaySettings>) => void
  children: ReactNode
  controlRail?: ReactNode
  homeBounds: OverlayDisplayBounds
  displayLayout?: OverlayDisplayLayoutLocal
  showHomeBar?: boolean
  /** Keep panel expanded (e.g. while Add Scroll popup is open). */
  suppressAutoHide?: boolean
}

function panelBoxStyle(rect: OverlayDisplayBounds): CSSProperties {
  return { left: rect.x, top: rect.y, width: rect.width, height: rect.height }
}

function revealEdgeStyle(dock: OverlayDock, home: OverlayDisplayBounds): CSSProperties {
  const thick = 6
  switch (dock) {
    case 'left':
      return { left: home.x, top: home.y, width: thick, height: home.height }
    case 'right':
      return { left: home.x + home.width - thick, top: home.y, width: thick, height: home.height }
    case 'top':
      return { left: home.x, top: home.y, width: home.width, height: thick }
    case 'bottom':
      return { left: home.x, top: home.y + home.height - thick, width: home.width, height: thick }
  }
}

function railHostStyle(dock: OverlayDock): CSSProperties {
  switch (dock) {
    case 'left':
      return { left: '100%', top: '50%', transform: 'translateY(-50%)', paddingLeft: RAIL_GAP_PX }
    case 'right':
      return { right: '100%', top: '50%', transform: 'translateY(-50%)', paddingRight: RAIL_GAP_PX }
    case 'top':
      return { top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: RAIL_GAP_PX }
    case 'bottom':
      return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', paddingBottom: RAIL_GAP_PX }
  }
}

function resizeBarStyle(dock: OverlayDock): CSSProperties {
  const halfGap = RAIL_GAP_PX / 2
  switch (dock) {
    case 'left':
      return {
        left: `calc(100% + ${halfGap}px - ${RESIZE_HIT_THICK / 2}px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: RESIZE_HIT_THICK,
        height: RESIZE_BAR_LEN,
        cursor: 'ew-resize',
      }
    case 'right':
      return {
        right: `calc(100% + ${halfGap}px - ${RESIZE_HIT_THICK / 2}px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: RESIZE_HIT_THICK,
        height: RESIZE_BAR_LEN,
        cursor: 'ew-resize',
      }
    case 'top':
      return {
        top: `calc(100% + ${halfGap}px - ${RESIZE_HIT_THICK / 2}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: RESIZE_BAR_LEN,
        height: RESIZE_HIT_THICK,
        cursor: 'ns-resize',
      }
    case 'bottom':
      return {
        bottom: `calc(100% + ${halfGap}px - ${RESIZE_HIT_THICK / 2}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: RESIZE_BAR_LEN,
        height: RESIZE_HIT_THICK,
        cursor: 'ns-resize',
      }
  }
}

export default function OverlayShell({
  settings,
  onSettingsChange,
  children,
  controlRail,
  homeBounds,
  displayLayout,
  showHomeBar = true,
  suppressAutoHide = false,
}: OverlayShellProps) {
  const { dock, collapsed, autoHide, revealMethod, keepToolbarOpen } = settings
  const fraction = sizeFractionForDock(settings)
  const panelRect = dockPanelRect(homeBounds, dock, fraction)
  const [chromeHovered, setChromeHovered] = useState(false)
  const [homeBarHovered, setHomeBarHovered] = useState(false)
  const [railVisible, setRailVisible] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const railHideTimerRef = useRef<number | null>(null)
  const dragRef = useRef<{
    start: number
    startFraction: number
    axis: 'x' | 'y'
    span: number
  } | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const clearRailHideTimer = useCallback(() => {
    if (railHideTimerRef.current != null) {
      window.clearTimeout(railHideTimerRef.current)
      railHideTimerRef.current = null
    }
  }, [])

  const scheduleAutoHide = useCallback(() => {
    clearHideTimer()
    if (!autoHide || collapsed || suppressAutoHide) return
    hideTimerRef.current = window.setTimeout(() => {
      onSettingsChange({ collapsed: true })
      hideTimerRef.current = null
    }, 700)
  }, [autoHide, collapsed, suppressAutoHide, clearHideTimer, onSettingsChange])

  useEffect(() => () => {
    clearHideTimer()
    clearRailHideTimer()
  }, [clearHideTimer, clearRailHideTimer])

  useEffect(() => {
    if (keepToolbarOpen || chromeHovered || isResizing) {
      clearRailHideTimer()
      setRailVisible(true)
      return
    }
    clearRailHideTimer()
    railHideTimerRef.current = window.setTimeout(() => {
      setRailVisible(false)
      railHideTimerRef.current = null
    }, 180)
  }, [chromeHovered, keepToolbarOpen, isResizing, clearRailHideTimer])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      e.preventDefault()
      if (drag.span <= 0) return
      const delta = (drag.axis === 'x' ? e.clientX : e.clientY) - drag.start
      let next = drag.startFraction
      if (dock === 'left') next = drag.startFraction + delta / drag.span
      else if (dock === 'right') next = drag.startFraction - delta / drag.span
      else if (dock === 'top') next = drag.startFraction + delta / drag.span
      else next = drag.startFraction - delta / drag.span
      if (drag.axis === 'x') onSettingsChange({ sizeVertical: next })
      else onSettingsChange({ sizeHorizontal: next })
    }
    function onUp() {
      if (!dragRef.current) return
      dragRef.current = null
      setIsResizing(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dock, onSettingsChange])

  function beginResize(e: ReactPointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    clearHideTimer()
    setChromeHovered(true)
    setIsResizing(true)
    const vertical = isVerticalDock(dock)
    dragRef.current = {
      start: vertical ? e.clientX : e.clientY,
      startFraction: fraction,
      axis: vertical ? 'x' : 'y',
      span: vertical ? homeBounds.width : homeBounds.height,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function expand() {
    clearHideTimer()
    onSettingsChange({ collapsed: false })
  }

  const showRail = keepToolbarOpen || railVisible || isResizing

  if (collapsed) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40">
        <CollapsedReveal
          dock={dock}
          homeBounds={homeBounds}
          method={revealMethod}
          onReveal={expand}
        />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-label="QuestHub overlay">
      <div
        className="pointer-events-auto absolute flex flex-col border-2 border-[#190A21] bg-[#120413]/95 text-white shadow-2xl"
        data-overlay-panel=""
        data-questhub-overlay-hit=""
        style={panelBoxStyle(panelRect)}
        onPointerEnter={() => {
          clearHideTimer()
          setChromeHovered(true)
        }}
        onPointerLeave={() => {
          if (isResizing || homeBarHovered || suppressAutoHide) return
          setChromeHovered(false)
          scheduleAutoHide()
        }}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-8">
          {children}
        </div>

        {showHomeBar && displayLayout ? (
          <OverlayHomeBar
            layout={displayLayout}
            visible={chromeHovered || homeBarHovered || keepToolbarOpen}
            onHoverChange={setHomeBarHovered}
            onMoveHome={({ displayId, dock: nextDock }) => {
              onSettingsChange({ homeDisplayId: displayId, dock: nextDock, collapsed: false })
            }}
          />
        ) : null}

        <div
          className={`absolute z-30 transition-opacity ${
            showRail ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={railHostStyle(dock)}
          data-questhub-overlay-hit=""
          onPointerEnter={() => {
            clearHideTimer()
            setChromeHovered(true)
          }}
          onPointerLeave={() => {
            if (!isResizing) setChromeHovered(false)
          }}
        >
          {controlRail}
        </div>

        <button
          type="button"
          aria-label="Resize overlay"
          title="Resize"
          data-questhub-overlay-hit=""
          className={`absolute z-40 flex cursor-ew-resize items-center justify-center transition ${
            showRail ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={resizeBarStyle(dock)}
          onPointerDown={beginResize}
          onPointerEnter={() => {
            clearHideTimer()
            setChromeHovered(true)
          }}
        >
          <span
            className="block rounded-full bg-[#FCFC40]/50 transition hover:bg-[#FCFC40]/80"
            style={
              isVerticalDock(dock)
                ? { width: RESIZE_BAR_THICK, height: '100%' }
                : { height: RESIZE_BAR_THICK, width: '100%' }
            }
            aria-hidden
          />
        </button>
      </div>

      {/* Screen-centered popups (siblings of the docked panel — not clipped by it). */}
      <div id={OVERLAY_MODAL_HOST_ID} className="pointer-events-none absolute inset-0 z-[95]" />
    </div>
  )
}

function CollapsedReveal({
  dock,
  homeBounds,
  method,
  onReveal,
}: {
  dock: OverlayDock
  homeBounds: OverlayDisplayBounds
  method: OverlayRevealMethod
  onReveal: () => void
}) {
  const showEdge = method === 'edge' || method === 'both'
  const showButton = method === 'button' || method === 'both'

  const RevealIcon =
    dock === 'right'
      ? ChevronLeftIcon
      : dock === 'top'
        ? ChevronDownIcon
        : dock === 'bottom'
          ? ChevronUpIcon
          : ChevronRightIcon

  const buttonStyle = ((): CSSProperties => {
    const pad = 8
    switch (dock) {
      case 'left':
        return { left: homeBounds.x + pad, top: homeBounds.y + homeBounds.height / 2, transform: 'translateY(-50%)' }
      case 'right':
        return {
          left: homeBounds.x + homeBounds.width - pad,
          top: homeBounds.y + homeBounds.height / 2,
          transform: 'translate(-100%, -50%)',
        }
      case 'top':
        return { left: homeBounds.x + homeBounds.width / 2, top: homeBounds.y + pad, transform: 'translateX(-50%)' }
      case 'bottom':
        return {
          left: homeBounds.x + homeBounds.width / 2,
          top: homeBounds.y + homeBounds.height - pad,
          transform: 'translate(-50%, -100%)',
        }
    }
  })()

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {showEdge ? (
        <button
          type="button"
          aria-label="Show overlay"
          title="Show overlay"
          data-questhub-overlay-hit=""
          className="pointer-events-auto absolute bg-transparent"
          style={revealEdgeStyle(dock, homeBounds)}
          onPointerEnter={onReveal}
          onFocus={onReveal}
        />
      ) : null}
      {showButton ? (
        <button
          type="button"
          aria-label="Show overlay"
          title="Show overlay"
          data-questhub-overlay-hit=""
          className="pointer-events-auto absolute z-10 flex size-8 items-center justify-center rounded border-2 border-[#3E3E11] bg-[#120413]/95 text-[#FCFC40] shadow-lg"
          style={buttonStyle}
          onClick={onReveal}
        >
          <RevealIcon className="size-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}
