import {
  type Group,
  type Category,
  type ExtendedTemplate,
  DEFAULT_CATEGORIES,
  DEFAULT_GROUPS,
  DEFAULT_SCROLL,
  type Scroll,
  type Quest,
} from './types'

/** Bump when default-extended sync logic changes so the UI reloads from storage. */
export const EXTENDED_SYNC_VERSION = 3

const KEYS = {
  groups: 'questhub_groups',
  categories: 'questhub_categories',
  battlePass: 'questhub_battlepass',
  extendedTemplate: 'questhub_extended_template',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

const GROUPS_CHANNEL = 'questhub-groups-sync'
const GROUPS_EVENT = 'questhub:groups-changed'

/** Notify other windows/tabs (and same window) that groups storage changed. */
export function notifyGroupsChanged(): void {
  try {
    window.dispatchEvent(new Event(GROUPS_EVENT))
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(GROUPS_CHANNEL)
    bc.postMessage({ type: 'groups-changed', at: Date.now() })
    bc.close()
  } catch {
    /* ignore — older browsers / SSR */
  }
}

/** Live-sync groups across main app + overlay windows. */
export function subscribeGroupsChanged(cb: () => void): () => void {
  const onLocal = () => cb()
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS.groups || e.key === KEYS.extendedTemplate) cb()
  }
  window.addEventListener(GROUPS_EVENT, onLocal)
  window.addEventListener('storage', onStorage)

  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel(GROUPS_CHANNEL)
    bc.onmessage = () => cb()
  } catch {
    bc = null
  }

  return () => {
    window.removeEventListener(GROUPS_EVENT, onLocal)
    window.removeEventListener('storage', onStorage)
    bc?.close()
  }
}

function questDefinitionMatches(
  a: Scroll['quests'][number],
  b: Scroll['quests'][number],
): boolean {
  return (
    a.categoryId === b.categoryId &&
    a.subCategoryId === b.subCategoryId &&
    a.amount === b.amount &&
    a.objective === b.objective &&
    a.objectiveId === b.objectiveId &&
    a.objectiveIcon === b.objectiveIcon
  )
}

function templateQuestsToLive(quests: ExtendedTemplate['quests']): Quest[] {
  return quests.map(q => ({
    id: q.id,
    categoryId: q.categoryId,
    subCategoryId: q.subCategoryId,
    amount: q.amount,
    objective: q.objective,
    objectiveId: q.objectiveId,
    objectiveIcon: q.objectiveIcon,
    description: q.description,
    order: q.order,
    counter: 0,
    completed: false,
  }))
}

// ─── Extended template (user-updated monthly default) ─────────────────────────

export function loadExtendedTemplate(): ExtendedTemplate | null {
  try {
    const raw = localStorage.getItem(KEYS.extendedTemplate)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExtendedTemplate
    if (!parsed || !Array.isArray(parsed.quests) || parsed.quests.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function saveExtendedTemplate(template: ExtendedTemplate): void {
  save(KEYS.extendedTemplate, template)
  notifyGroupsChanged()
}

export function clearExtendedTemplate(): void {
  localStorage.removeItem(KEYS.extendedTemplate)
}

/** Active extended scroll definitions: user template if set, else built-in DEFAULT_SCROLL. */
export function getActiveExtendedScroll(): Scroll {
  const template = loadExtendedTemplate()
  if (!template) {
    return {
      ...DEFAULT_SCROLL,
      quests: DEFAULT_SCROLL.quests.map(q => ({ ...q })),
    }
  }
  return {
    ...DEFAULT_SCROLL,
    quests: templateQuestsToLive(template.quests),
  }
}

/** Signature of active extended quest definitions — use to re-sync UI when template/code changes. */
export function getActiveExtendedSignature(): string {
  const scroll = getActiveExtendedScroll()
  return JSON.stringify(
    scroll.quests.map(q => [q.id, q.categoryId, q.subCategoryId, q.amount, q.objective, q.objectiveIcon]),
  )
}

function normalizeDefaultExtendedScroll(scroll: Scroll): Scroll {
  if (scroll.id !== DEFAULT_SCROLL.id) return scroll

  const active = getActiveExtendedScroll()
  const previousById = new Map(scroll.quests.map(q => [q.id, q]))

  // Take quest definitions from the active template; keep progress only when
  // the quest itself is unchanged (same id + same definition).
  const quests = active.quests.map(template => {
    const previous = previousById.get(template.id)
    if (previous && questDefinitionMatches(previous, template)) {
      return {
        ...template,
        counter: previous.counter,
        completed: previous.completed,
        description: previous.description ?? template.description,
      }
    }
    return { ...template }
  })

  return {
    ...active,
    id: scroll.id,
    order: typeof scroll.order === 'number' ? scroll.order : active.order,
    hidden: scroll.hidden,
    titleColors: scroll.titleColors,
    quests,
  }
}

function cloneDefaultScroll(order = DEFAULT_SCROLL.order): Scroll {
  const active = getActiveExtendedScroll()
  return {
    ...active,
    order,
    quests: active.quests.map(q => ({ ...q })),
  }
}

function isManagedExtendedGroup(group: Group): boolean {
  return group.id === '__default_weekly__' || group.name === 'Extended'
}

function normalizeGroups(groups: Group[]): Group[] {
  return groups.map(group => {
    let scrolls = group.scrolls.map(scroll => {
      if (scroll.id === DEFAULT_SCROLL.id) {
        return normalizeDefaultExtendedScroll(scroll)
      }
      return scroll
    })

    if (isManagedExtendedGroup(group)) {
      const defaultIdx = scrolls.findIndex(s => s.id === DEFAULT_SCROLL.id)
      if (defaultIdx >= 0) {
        // already normalized above
      } else {
        // Stored extended scroll lost the reserved id — adopt it and overwrite quests
        const adoptIdx = scrolls.findIndex(s => s.type === 'extended' && !s.hidden)
        if (adoptIdx >= 0) {
          const adopted = scrolls[adoptIdx]
          scrolls = scrolls.map((s, i) =>
            i === adoptIdx
              ? normalizeDefaultExtendedScroll({ ...adopted, id: DEFAULT_SCROLL.id })
              : s
          )
        } else {
          scrolls = [cloneDefaultScroll(0), ...scrolls]
        }
      }
    }

    return {
      ...group,
      scrolls,
    }
  })
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export function loadGroups(): Group[] {
  const groups = load<Group[]>(KEYS.groups, DEFAULT_GROUPS)
  const normalizedGroups = normalizeGroups(groups)

  if (JSON.stringify(normalizedGroups) !== JSON.stringify(groups)) {
    save(KEYS.groups, normalizedGroups)
  }

  return normalizedGroups
}

/** Always re-syncs the default extended scroll from the active template before writing. */
export function saveGroups(groups: Group[]): Group[] {
  const normalizedGroups = normalizeGroups(groups)
  save(KEYS.groups, normalizedGroups)
  notifyGroupsChanged()
  return normalizedGroups
}

export function deleteGroup(groupId: string): void {
  const groups = loadGroups().filter(g => g.id !== groupId)
  saveGroups(groups)
}

// ─── Scrolls (operated via their parent group) ────────────────────────────────

export function deleteScroll(groupId: string, scrollId: string): void {
  const groups = loadGroups().map(g => {
    if (g.id !== groupId) return g
    return { ...g, scrolls: g.scrolls.filter(s => s.id !== scrollId) }
  })
  saveGroups(groups)
}

export function clearScroll(groupId: string, scrollId: string): void {
  const groups = loadGroups().map(g => {
    if (g.id !== groupId) return g
    return {
      ...g,
      scrolls: g.scrolls.map(s =>
        s.id === scrollId ? { ...s, quests: [] } : s
      ),
    }
  })
  saveGroups(groups)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function loadCategories(): Category[] {
  return load<Category[]>(KEYS.categories, DEFAULT_CATEGORIES)
}

export function saveCategories(categories: Category[]): void {
  save(KEYS.categories, categories)
}

export function resetCategories(): void {
  // Wipes stored categories back to defaults (caller should also wipe quests)
  save(KEYS.categories, DEFAULT_CATEGORIES)
}

// ─── Battle Pass ──────────────────────────────────────────────────────────────

import type { BPWeek, BPGoal, BPDaily, BPSectionId } from './battle_pass'
import { DEFAULT_ORDER } from './battle_pass'

const BP_KEYS = {
  weeks: 'questhub_battlepass_weeks',
  goals: 'questhub_battlepass_goals',
  dailies:  'questhub_battlepass_dailies',
  order:    'questhub_battlepass_section_order',
} as const

export function loadBPWeeks(): BPWeek[] {
  return load<BPWeek[]>(BP_KEYS.weeks, [])
}

export function saveBPWeeks(weeks: BPWeek[]): void {
  save(BP_KEYS.weeks, weeks)
}

export function loadBPGoals(): BPGoal[] {
  return load<BPGoal[]>(BP_KEYS.goals, [])
}

export function saveBPGoals(goals: BPGoal[]): void {
  save(BP_KEYS.goals, goals)
}

export function loadBPDailies(): BPDaily[] {
  return load<BPDaily[]>(BP_KEYS.dailies, [])
}

export function saveBPDailies(dailies: BPDaily[]): void {
  save(BP_KEYS.dailies, dailies)
}

export function loadBPSectionOrder(): BPSectionId[] {
  return load<BPSectionId[]>(BP_KEYS.order, DEFAULT_ORDER)
}

export function saveBPSectionOrder(order: BPSectionId[]): void {
  save(BP_KEYS.order, order)
}

// ─── Category order (per group, for categorized views) ────────────────────────

export function loadCatOrder(groupId: string, fallback: string[]): string[] {
  return load<string[]>(`questhub_cat_order_${groupId}`, fallback)
}

export function saveCatOrder(groupId: string, order: string[]): void {
  save(`questhub_cat_order_${groupId}`, order)
}

export function loadSubOrder(groupId: string, fallback: string[]): string[] {
  return load<string[]>(`questhub_sub_order_${groupId}`, fallback)
}

export function saveSubOrder(groupId: string, order: string[]): void {
  save(`questhub_sub_order_${groupId}`, order)
}

// ─── Nuke everything ──────────────────────────────────────────────────────────

export function clearAllData(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  Object.values(BP_KEYS).forEach(k => localStorage.removeItem(k))
}