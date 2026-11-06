import type { OverlayDock } from '../types/overlay_settings'

export type OverlayDisplayBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type OverlayDisplayInfo = {
  id: number
  label: string
  primary: boolean
  /** Window-local coordinates (virtual desktop origin = 0,0). */
  bounds: OverlayDisplayBounds
}

export type OverlayDisplayLayoutLocal = {
  virtual: OverlayDisplayBounds
  displays: OverlayDisplayInfo[]
}

/** Convert absolute screen layout → window-local (origin at virtual top-left). */
export function toLocalDisplayLayout(layout: {
  virtual: OverlayDisplayBounds
  displays: Array<{
    id: number
    label: string
    primary: boolean
    bounds: OverlayDisplayBounds
  }>
}): OverlayDisplayLayoutLocal {
  const { virtual } = layout
  return {
    virtual: { x: 0, y: 0, width: virtual.width, height: virtual.height },
    displays: layout.displays.map(d => ({
      id: d.id,
      label: d.label,
      primary: d.primary,
      bounds: {
        x: d.bounds.x - virtual.x,
        y: d.bounds.y - virtual.y,
        width: d.bounds.width,
        height: d.bounds.height,
      },
    })),
  }
}

export function fallbackSingleDisplayLayout(
  width = typeof window !== 'undefined' ? window.innerWidth : 1280,
  height = typeof window !== 'undefined' ? window.innerHeight : 800,
): OverlayDisplayLayoutLocal {
  return {
    virtual: { x: 0, y: 0, width, height },
    displays: [
      {
        id: 0,
        label: 'Display',
        primary: true,
        bounds: { x: 0, y: 0, width, height },
      },
    ],
  }
}

export function resolveHomeDisplay(
  layout: OverlayDisplayLayoutLocal,
  homeDisplayId: number | null,
): OverlayDisplayInfo {
  if (homeDisplayId != null) {
    const found = layout.displays.find(d => d.id === homeDisplayId)
    if (found) return found
  }
  return layout.displays.find(d => d.primary) ?? layout.displays[0]!
}

/** Panel box inside a home display (window-local). */
export function dockPanelRect(
  home: OverlayDisplayBounds,
  dock: OverlayDock,
  fraction: number,
): OverlayDisplayBounds {
  const f = Math.min(0.45, Math.max(0.08, fraction))
  switch (dock) {
    case 'left':
      return { x: home.x, y: home.y, width: home.width * f, height: home.height }
    case 'right':
      return {
        x: home.x + home.width * (1 - f),
        y: home.y,
        width: home.width * f,
        height: home.height,
      }
    case 'top':
      return { x: home.x, y: home.y, width: home.width, height: home.height * f }
    case 'bottom':
      return {
        x: home.x,
        y: home.y + home.height * (1 - f),
        width: home.width,
        height: home.height * f,
      }
  }
}

function pointInBounds(x: number, y: number, b: OverlayDisplayBounds): boolean {
  return x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height
}

function nearestDisplay(
  layout: OverlayDisplayLayoutLocal,
  x: number,
  y: number,
): OverlayDisplayInfo {
  const hit = layout.displays.find(d => pointInBounds(x, y, d.bounds))
  if (hit) return hit
  let best = layout.displays[0]!
  let bestDist = Infinity
  for (const d of layout.displays) {
    const cx = d.bounds.x + d.bounds.width / 2
    const cy = d.bounds.y + d.bounds.height / 2
    const dist = (cx - x) ** 2 + (cy - y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = d
    }
  }
  return best
}

/** Pick display + dock edge from a window-local pointer position (home-bar drag). */
export function snapOverlayHomeAtPoint(
  layout: OverlayDisplayLayoutLocal,
  x: number,
  y: number,
): { displayId: number; dock: OverlayDock } {
  const display = nearestDisplay(layout, x, y)
  const b = display.bounds
  const distLeft = Math.abs(x - b.x)
  const distRight = Math.abs(x - (b.x + b.width))
  const distTop = Math.abs(y - b.y)
  const distBottom = Math.abs(y - (b.y + b.height))
  const nearest = Math.min(distLeft, distRight, distTop, distBottom)
  let dock: OverlayDock = 'left'
  if (nearest === distRight) dock = 'right'
  else if (nearest === distTop) dock = 'top'
  else if (nearest === distBottom) dock = 'bottom'
  else dock = 'left'
  return { displayId: display.id, dock }
}
