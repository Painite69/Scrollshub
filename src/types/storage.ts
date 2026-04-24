import { type Group, type Category, DEFAULT_CATEGORIES, DEFAULT_GROUPS } from './types'

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

// ─── Groups ───────────────────────────────────────────────────────────────────

export function loadGroups(): Group[] {
  return load<Group[]>(KEYS.groups, DEFAULT_GROUPS)
}

export function saveGroups(groups: Group[]): void {
  save(KEYS.groups, groups)
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