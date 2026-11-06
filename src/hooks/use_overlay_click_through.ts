import { useEffect } from 'react'

/**
 * Empty glass passes mouse to apps underneath; `[data-questhub-overlay-hit]` captures.
 */
export function useOverlayClickThrough(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !window.questHubDesktop?.setClickThrough) return

    let lastIgnore: boolean | null = null

    function setIgnore(ignore: boolean) {
      if (lastIgnore === ignore) return
      lastIgnore = ignore
      window.questHubDesktop?.setClickThrough?.(ignore)
    }

    function isHitTarget(el: Element | null): boolean {
      if (!el) return false
      if (el === document.documentElement || el === document.body) return false
      if (el.id === 'root') return false
      return Boolean(el.closest('[data-questhub-overlay-hit]'))
    }

    function onMove(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      setIgnore(!isHitTarget(el))
    }

    function onLeave() {
      setIgnore(true)
    }

    setIgnore(true)
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      setIgnore(true)
    }
  }, [enabled])
}
