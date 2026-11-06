import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  snapOverlayHomeAtPoint,
  type OverlayDisplayLayoutLocal,
} from '../../lib/overlay_displays'
import type { OverlayDock } from '../../types/overlay_settings'

type OverlayHomeBarProps = {
  layout: OverlayDisplayLayoutLocal
  visible: boolean
  onMoveHome: (next: { displayId: number; dock: OverlayDock }) => void
  onHoverChange?: (hovered: boolean) => void
}

/**
 * iPhone-style home indicator at the bottom of the overlay panel.
 * Drag to snap the panel to any edge of any display.
 */
export default function OverlayHomeBar({
  layout,
  visible,
  onMoveHome,
  onHoverChange,
}: OverlayHomeBarProps) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<{
    displayId: number
    dock: OverlayDock
    x: number
    y: number
  } | null>(null)
  const activeRef = useRef(false)

  useEffect(() => {
    if (!dragging) return
    function onMove(e: PointerEvent) {
      if (!activeRef.current) return
      const snap = snapOverlayHomeAtPoint(layout, e.clientX, e.clientY)
      setPreview({ ...snap, x: e.clientX, y: e.clientY })
    }
    function onUp(e: PointerEvent) {
      if (!activeRef.current) return
      activeRef.current = false
      setDragging(false)
      onHoverChange?.(false)
      const snap = snapOverlayHomeAtPoint(layout, e.clientX, e.clientY)
      onMoveHome(snap)
      setPreview(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, layout, onMoveHome, onHoverChange])

  function beginDrag(e: ReactPointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    activeRef.current = true
    setDragging(true)
    const snap = snapOverlayHomeAtPoint(layout, e.clientX, e.clientY)
    setPreview({ ...snap, x: e.clientX, y: e.clientY })
  }

  const show = visible || dragging
  const previewDisplay = preview
    ? layout.displays.find(d => d.id === preview.displayId)
    : null

  return (
    <>
      <div
        className={`pointer-events-auto absolute inset-x-0 bottom-0 z-50 flex h-10 items-end justify-center pb-2 transition-opacity duration-150 ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
        data-questhub-overlay-hit=""
        onPointerEnter={() => onHoverChange?.(true)}
        onPointerLeave={() => {
          if (!dragging) onHoverChange?.(false)
        }}
        onPointerDown={beginDrag}
      >
        <button
          type="button"
          title="Drag to move overlay to another edge or display"
          aria-label="Move overlay"
          tabIndex={show ? 0 : -1}
          className="flex h-7 w-32 cursor-grab items-center justify-center active:cursor-grabbing"
        >
          <span className="block h-1.5 w-24 rounded-full bg-[#FCFC40]/55 shadow-sm transition hover:bg-[#FCFC40]/90" />
        </button>
      </div>

      {dragging && preview && previewDisplay
        ? createPortal(
            <>
              {layout.displays.map(d => (
                <div
                  key={d.id}
                  className="pointer-events-none fixed z-[70] border border-white/15 bg-black/25"
                  data-questhub-overlay-hit=""
                  style={{
                    left: d.bounds.x,
                    top: d.bounds.y,
                    width: d.bounds.width,
                    height: d.bounds.height,
                  }}
                />
              ))}
              <EdgePreview bounds={previewDisplay.bounds} dock={preview.dock} />
              <div
                className="pointer-events-none fixed z-[80] flex h-6 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: preview.x, top: preview.y }}
              >
                <span className="block h-1.5 w-24 rounded-full bg-[#FCFC40] shadow-lg" />
              </div>
              <div className="pointer-events-none fixed bottom-8 left-1/2 z-[80] -translate-x-1/2 rounded border border-[#3E3E11] bg-[#120413]/90 px-3 py-1.5 font-pixeloid-sans text-xs text-[#FCFC40]">
                {previewDisplay.label} · {preview.dock}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}

function EdgePreview({
  bounds,
  dock,
}: {
  bounds: { x: number; y: number; width: number; height: number }
  dock: OverlayDock
}) {
  const thick = 12
  const style =
    dock === 'left'
      ? { left: bounds.x, top: bounds.y, width: thick, height: bounds.height }
      : dock === 'right'
        ? {
            left: bounds.x + bounds.width - thick,
            top: bounds.y,
            width: thick,
            height: bounds.height,
          }
        : dock === 'top'
          ? { left: bounds.x, top: bounds.y, width: bounds.width, height: thick }
          : {
              left: bounds.x,
              top: bounds.y + bounds.height - thick,
              width: bounds.width,
              height: thick,
            }

  return (
    <div
      className="pointer-events-none fixed z-[75] rounded-sm bg-[#FCFC40]/80 shadow-[0_0_24px_rgba(252,252,64,0.35)]"
      style={style}
    />
  )
}
