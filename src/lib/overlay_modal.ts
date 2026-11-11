import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'
import type { OverlayDisplayBounds } from './overlay_displays'

export type OverlayScreenBounds = OverlayDisplayBounds

export const OVERLAY_MODAL_HOST_ID = 'questhub-overlay-modals'

/** True when rendering inside the Electron overlay (panel or home-display anchored). */
export function isOverlayModal(opts: {
  contained?: boolean
  screenBounds?: OverlayScreenBounds | null
}): boolean {
  return Boolean(opts.contained || opts.screenBounds)
}

export function overlayBackdropClass(opts: {
  contained?: boolean
  screenBounds?: OverlayScreenBounds | null
  z?: string
  bg?: string
}): string {
  const z = opts.z ?? 'z-50'
  const bg = opts.bg ?? 'bg-black/60'
  if (opts.screenBounds) {
    return `pointer-events-auto fixed flex items-center justify-center ${bg} ${z}`
  }
  return `${opts.contained ? 'absolute' : 'fixed'} inset-0 flex items-center justify-center ${bg} ${z}`
}

export function overlayBackdropStyle(
  screenBounds?: OverlayScreenBounds | null,
): CSSProperties | undefined {
  if (!screenBounds) return undefined
  return {
    left: screenBounds.x,
    top: screenBounds.y,
    width: screenBounds.width,
    height: screenBounds.height,
  }
}

export function overlayHitProps(opts: {
  contained?: boolean
  screenBounds?: OverlayScreenBounds | null
}): { 'data-questhub-overlay-hit'?: '' } {
  return isOverlayModal(opts) ? { 'data-questhub-overlay-hit': '' } : {}
}

/** Portal screen-anchored modals above the docked panel (avoids overflow clipping). */
export function portalOverlayModal(node: ReactNode, screenBounds?: OverlayScreenBounds | null): ReactNode {
  if (!screenBounds || typeof document === 'undefined') return node
  const host = document.getElementById(OVERLAY_MODAL_HOST_ID)
  if (!host) return node
  return createPortal(node, host)
}
