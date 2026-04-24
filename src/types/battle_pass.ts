// ─── Battle Pass Types ────────────────────────────────────────────────────────

// Week accent colors — one per week (matches SCROLL_STYLES palette order)
export const BP_WEEK_COLORS = [
  { fill: '#64FC65', stroke: '#193B11' }, // week 1 — green
  { fill: '#F755ED', stroke: '#570A54' }, // week 2 — pink
  { fill: '#FCA900', stroke: '#835034' }, // week 3 — orange
  { fill: '#FCFC40', stroke: '#3E3E11' }, // week 4 — yellow
  { fill: '#FF3333', stroke: '#7A0000' }, // week 5 — red
  { fill: '#3399FF', stroke: '#003380' }, // week 6 — blue
  { fill: '#33FFFF', stroke: '#007A7A' }, // week 7 — cyan
] as const

// ── Stage step (shared by quests and goals) ───────────────────────────────────

export interface BPStageStep {
  id: string
  title: string
  text: string
  icon: string    // mc asset path
  amount: number  // target count for this step
  counter: number
  completed: boolean
}

// ── BP Quest (one entry inside a week) ───────────────────────────────────────

export interface BPQuest {
  id: string
  title: string
  text: string
  icon: string
  isPremium: boolean          // false = Free section, true = Premium section
  stages: BPStageStep[] | null  // null = standard quest
  amount: number              // used only when stages === null
  counter: number
  completed: boolean
}

// ── BP Week ───────────────────────────────────────────────────────────────────

export interface BPWeek {
  weekNumber: number  // 1–7
  quests: BPQuest[]
}

// ── BP Goal ───────────────────────────────────────────────────────────────────

export interface BPGoal {
  id: string
  title: string
  text: string
  icon?: string               // optional mc asset path
  stages: BPStageStep[] | null  // null = standard goal
  amount: number              // used only when stages === null
  counter: number
  completed: boolean
}

// ── BP Daily (reuses Quest shape, stored separately) ─────────────────────────
// Stored under questhub_battlepass_dailies, NOT inside any Group/Scroll.

import type { Quest } from './types'
export type BPDaily = Quest

// ── Section order ─────────────────────────────────────────────────────────────

export type BPSectionId = 'quests' | 'goals' | 'dailies'
export const DEFAULT_ORDER: BPSectionId[] = ['quests', 'goals', 'dailies']
