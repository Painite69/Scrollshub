import { type Group, type Category, DEFAULT_CATEGORIES, DEFAULT_GROUPS, DEFAULT_SCROLL, type Scroll } from './types'

/** Bump when default-extended sync logic changes so the UI reloads from storage. */
export const EXTENDED_SYNC_VERSION = 2

const KEYS = {
  groups: 'questhub_groups',
  categories: 'questhub_categories',
  battlePass: 'questhub_battlepass',
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

function normalizeDefaultExtendedScroll(scroll: Scroll): Scroll {
  if (scroll.id !== DEFAULT_SCROLL.id) return scroll

  const previousById = new Map(scroll.quests.map(q => [q.id, q]))

  // Always take quest definitions from DEFAULT_SCROLL; keep progress only when
  // the quest itself is unchanged (same id + same definition).
  const quests = DEFAULT_SCROLL.quests.map(template => {
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
    ...DEFAULT_SCROLL,
    id: scroll.id,
    order: typeof scroll.order === 'number' ? scroll.order : DEFAULT_SCROLL.order,
    hidden: scroll.hidden,
    titleColors: scroll.titleColors,
    quests,
  }
}

function cloneDefaultScroll(order = DEFAULT_SCROLL.order): Scroll {
  return {
    ...DEFAULT_SCROLL,
    order,
    quests: DEFAULT_SCROLL.quests.map(q => ({ ...q })),
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

/** Always re-syncs the default extended scroll from DEFAULT_SCROLL before writing. */
export function saveGroups(groups: Group[]): Group[] {
  const normalizedGroups = normalizeGroups(groups)
  save(KEYS.groups, normalizedGroups)
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