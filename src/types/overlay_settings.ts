export type OverlayDock = 'left' | 'right' | 'top' | 'bottom'
export type OverlayRevealMethod = 'edge' | 'button' | 'both'

export type OverlaySettings = {
  dock: OverlayDock
  /** Fraction of home display for left/right docks. */
  sizeVertical: number
  /** Fraction of home display for top/bottom docks. */
  sizeHorizontal: number
  collapsed: boolean
  autoHide: boolean
  revealMethod: OverlayRevealMethod
  keepToolbarOpen: boolean
  /** Electron display id; null = primary. */
  homeDisplayId: number | null
  /** Group folder ids currently expanded in the panel. */
  openGroupIds: string[]
  /** Scroll ids currently expanded inside groups (separate display). */
  openScrollIds: string[]
  /**
   * Category / sub-category section keys expanded in categorized overlay views.
   * Format: `${groupId}::${sectionId}` (categoryId or subCategoryId).
   */
  openSectionIds: string[]
  /** Section keys that have been seen (used to seed open state once). */
  knownSectionIds: string[]
}

export const OVERLAY_DEFAULTS: OverlaySettings = {
  dock: 'left',
  sizeVertical: 0.18,
  sizeHorizontal: 0.28,
  collapsed: false,
  autoHide: true,
  revealMethod: 'both',
  keepToolbarOpen: false,
  homeDisplayId: null,
  openGroupIds: [],
  openScrollIds: [],
  openSectionIds: [],
  knownSectionIds: [],
}

const STORAGE_KEY = 'questhub_overlay_settings'
const SIZE_MIN = 0.08
const SIZE_MAX = 0.45

export function clampOverlaySize(n: number): number {
  if (!Number.isFinite(n)) return OVERLAY_DEFAULTS.sizeVertical
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, n))
}

export function normalizeOverlayDock(raw: unknown): OverlayDock {
  if (raw === 'right' || raw === 'top' || raw === 'bottom' || raw === 'left') return raw
  return 'left'
}

export function normalizeRevealMethod(raw: unknown): OverlayRevealMethod {
  if (raw === 'button' || raw === 'both' || raw === 'edge') return raw
  return 'both'
}

export function isVerticalDock(dock: OverlayDock): boolean {
  return dock === 'left' || dock === 'right'
}

export function sizeFractionForDock(settings: OverlaySettings, dock = settings.dock): number {
  return isVerticalDock(dock) ? settings.sizeVertical : settings.sizeHorizontal
}

function normalizeIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export function loadOverlaySettings(): OverlaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...OVERLAY_DEFAULTS }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      ...OVERLAY_DEFAULTS,
      dock: normalizeOverlayDock(parsed.dock),
      sizeVertical: clampOverlaySize(
        typeof parsed.sizeVertical === 'number' ? parsed.sizeVertical : OVERLAY_DEFAULTS.sizeVertical,
      ),
      sizeHorizontal: clampOverlaySize(
        typeof parsed.sizeHorizontal === 'number' ? parsed.sizeHorizontal : OVERLAY_DEFAULTS.sizeHorizontal,
      ),
      collapsed: Boolean(parsed.collapsed),
      autoHide: parsed.autoHide !== false,
      revealMethod: normalizeRevealMethod(parsed.revealMethod),
      keepToolbarOpen: Boolean(parsed.keepToolbarOpen),
      homeDisplayId:
        typeof parsed.homeDisplayId === 'number' && Number.isFinite(parsed.homeDisplayId)
          ? parsed.homeDisplayId
          : null,
      openGroupIds: normalizeIdList(parsed.openGroupIds),
      openScrollIds: normalizeIdList(parsed.openScrollIds),
      openSectionIds: normalizeIdList(parsed.openSectionIds),
      knownSectionIds: normalizeIdList(parsed.knownSectionIds),
    }
  } catch {
    return { ...OVERLAY_DEFAULTS }
  }
}

export function saveOverlaySettings(settings: OverlaySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* quota / private mode */
  }
}

export function patchOverlaySettings(
  prev: OverlaySettings,
  patch: Partial<OverlaySettings>,
): OverlaySettings {
  const next: OverlaySettings = {
    ...prev,
    ...patch,
    dock: patch.dock != null ? normalizeOverlayDock(patch.dock) : prev.dock,
    revealMethod:
      patch.revealMethod != null ? normalizeRevealMethod(patch.revealMethod) : prev.revealMethod,
    sizeVertical: clampOverlaySize(
      patch.sizeVertical != null ? patch.sizeVertical : prev.sizeVertical,
    ),
    sizeHorizontal: clampOverlaySize(
      patch.sizeHorizontal != null ? patch.sizeHorizontal : prev.sizeHorizontal,
    ),
    openGroupIds:
      patch.openGroupIds != null ? normalizeIdList(patch.openGroupIds) : prev.openGroupIds,
    openScrollIds:
      patch.openScrollIds != null ? normalizeIdList(patch.openScrollIds) : prev.openScrollIds,
    openSectionIds:
      patch.openSectionIds != null ? normalizeIdList(patch.openSectionIds) : prev.openSectionIds,
    knownSectionIds:
      patch.knownSectionIds != null
        ? normalizeIdList(patch.knownSectionIds)
        : prev.knownSectionIds,
  }
  saveOverlaySettings(next)
  return next
}

export function sectionStorageKey(groupId: string, sectionId: string): string {
  return `${groupId}::${sectionId}`
}
