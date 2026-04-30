// ─── Categories ───────────────────────────────────────────────────────────────

export interface SubCategory {
  id: string
  label: string // e.g. "dig", "chop", "break"
}

export interface Category {
  id: string
  label: string // e.g. "Mine", "Kill"
  description?: string
  subCategories: SubCategory[]
  isCustom?: boolean // false = preset, true = user-added
}

// Preset sub-categories grouped under their main category
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'mine',
    label: 'Mine',
    description: 'Quests involving breaking blocks — Mine, Dig, Chop, and Break.',
    subCategories: [
      { id: 'mine', label: 'Mine' },
      { id: 'dig', label: 'Dig' },
      { id: 'chop', label: 'Chop' },
      { id: 'break', label: 'Break' },
    ],
  },
  {
    id: 'craft',
    label: 'Craft',
    description: 'Quests involving crafting table - Craft or Bake.',
    subCategories: [
      { id: 'craft', label: 'Craft' },
      { id: 'bake', label: 'Bake' },
    ],
  },
  {
    id: 'eat',
    label: 'Eat',
    description: 'Quests involving Eating.',
    subCategories: [{ id: 'eat', label: 'Eat' }],
  },
  {
    id: 'kill',
    label: 'Kill',
    description: 'Quests involving defeating mobs, players or bosses — kill, Slay 💅, or Defeat.',
    subCategories: [
      { id: 'kill', label: 'Kill' },
      { id: 'slay', label: 'Slay' },
      { id: 'defeat', label: 'Defeat' },
    ],
  },
  {
    id: 'ride',
    label: 'Ride',
    description: 'Quests involving riding minecarts, horses, pigs, or striders.',
    subCategories: [{ id: 'ride', label: 'Ride' }],
  },
  {
    id: 'animals',
    label: 'Animals',
    description: 'Quests involving interacting with animals — Shear, Fish, or Tame.',
    subCategories: [
      { id: 'shear', label: 'Shear' },
      { id: 'fish', label: 'Fish' },
      { id: 'tame', label: 'Tame' },
    ],
  },
  {
    id: 'cook',
    label: 'Cook',
    description: 'Quests involving cooking food or smelting ores and materials in a furnace.',
    subCategories: [
      { id: 'cook', label: 'Cook' },
      { id: 'smelt', label: 'Smelt' },
    ],
  },
  {
    id: 'harvest',
    label: 'Harvest',
    description: 'Quests involving harvesting crops or warts.',
    subCategories: [{ id: 'harvest', label: 'Harvest' }],
  },
  {
    id: 'movement',
    label: 'Movement',
    description: 'Quests involving traveling — Walk, Sprit, Swim, or Glide.',
    subCategories: [
      { id: 'walk', label: 'Walk' },
      { id: 'sprint', label: 'Sprint' },
      { id: 'swim', label: 'Swim' },
      { id: 'glide', label: 'Glide' },
    ],
  },
  {
    id: 'workbench',
    label: 'Workbench',
    description: 'Quests involving using special workbenches — enchanting at an enchanting table or brewing stand.',
    subCategories: [
      { id: 'enchant', label: 'Enchant' },
      { id: 'brew', label: 'Brew' },
    ],
  },
  {
    id: 'die',
    label: 'Die',
    description: 'Quests involving dying — yes, sometimes the server wants you to die a certain number of times.',
    subCategories: [{ id: 'die', label: 'Die' }],
  },
  {
    id: 'interact',
    label: 'Interact',
    description: 'Quests involving in-game interactions — Place, Convert, Fill, Empty, and more.',
    subCategories: [
      { id: 'place', label: 'Place' },
      { id: 'convert', label: 'Convert' },
      { id: 'fill', label: 'Fill' },
      { id: 'empty', label: 'Empty' },
      { id: 'apply', label: 'Apply' },
      { id: 'gain', label: 'Gain' },
      { id: 'speak', label: 'Speak' },
      { id: 'login', label: 'Log In' },
      { id: 'vote', label: 'Vote' },
      { id: 'levelup', label: 'Level Up' },
      { id: 'visit', label: 'Visit' },
      { id: 'travel', label: 'Travel To' },
    ],
  },
]

// ─── Default groups ───────────────────────────────────────────────────────────

const DEFAULT_SCROLL: Scroll = {
  id: '__default_scroll__',
  type: 'extended',
  order: 0,
  quests: [
    { id: '__dq_1__',  categoryId: 'harvest', subCategoryId: 'harvest', amount: 3225,  objective: 'Carrot',            objectiveId: 'custom', objectiveIcon: '/mc_assets/CARROT.png',             counter: 0, completed: false, order: 0 },
    { id: '__dq_2__',  categoryId: 'craft',   subCategoryId: 'craft',   amount: 300,   objective: 'Golden Carrot',     objectiveId: 'custom', objectiveIcon: '/mc_assets/GOLDEN_CARROT.png',      counter: 0, completed: false, order: 1 },
    { id: '__dq_3__',  categoryId: 'kill',    subCategoryId: 'kill',    amount: 2000,  objective: 'Chicken',           objectiveId: 'custom', objectiveIcon: '/mc_assets/CHICKEN (2).png',        counter: 0, completed: false, order: 2 },
    { id: '__dq_4__',  categoryId: 'interact',subCategoryId: 'place',   amount: 500,   objective: 'Cactus Flower',     objectiveId: 'custom', objectiveIcon: '/mc_assets/CACTUS_FLOWER.png',      counter: 0, completed: false, order: 3 },
    { id: '__dq_5__',  categoryId: 'ride',    subCategoryId: 'ride',    amount: 3000,  objective: 'Nautilus',          objectiveId: 'custom', objectiveIcon: '/mc_assets/NAUTILUS.png',           counter: 0, completed: false, order: 4 },
    { id: '__dq_6__',  categoryId: 'mine',    subCategoryId: 'mine',    amount: 2000,  objective: 'Lapis Ore',         objectiveId: 'custom', objectiveIcon: '/mc_assets/LAPIS_ORE.png',          counter: 0, completed: false, order: 5 },
    { id: '__dq_7__',  categoryId: 'animals', subCategoryId: 'shear',   amount: 600,   objective: 'Yellow Sheep',      objectiveId: 'custom', objectiveIcon: '/mc_assets/YELLOW_WOOL.png',        counter: 0, completed: false, order: 6 },
    { id: '__dq_8__',  categoryId: 'interact',subCategoryId: 'gain',    amount: 25000, objective: 'Experience Bottle', objectiveId: 'custom', objectiveIcon: '/mc_assets/EXPERIENCE_BOTTLE.png',  counter: 0, completed: false, order: 7 },
    { id: '__dq_9__',  categoryId: 'mine',    subCategoryId: 'chop',    amount: 2260,  objective: 'Pale Oak Wood',     objectiveId: 'custom', objectiveIcon: '/mc_assets/PALE_OAK_WOOD.png',      counter: 0, completed: false, order: 8 },
    { id: '__dq_10__', categoryId: 'craft',   subCategoryId: 'craft',   amount: 1900,  objective: 'Spectral Arrow',    objectiveId: 'custom', objectiveIcon: '/mc_assets/SPECTRAL_ARROW.png',     counter: 0, completed: false, order: 9 },
  ],
}

export const DEFAULT_GROUPS: Group[] = [
  {
    id: '__default_daily__',
    name: 'Daily Quests',
    icon: { source: 'minecraft', value: 'CLOCK' },
    display: 'categorized',
    scrolls: [],
    order: 0,
  },
  {
    id: '__default_weekly__',
    name: 'Extended',
    icon: { source: 'minecraft', value: 'BOOK' },
    display: 'separate',
    scrolls: [DEFAULT_SCROLL],
    order: 1,
  }
]

export const CATEGORY_COLORS = [
  { label: 'Green',   fill: '#64FC65', stroke: '#193B11' },
  { label: 'Pink',    fill: '#F755ED', stroke: '#570A54' },
  { label: 'Orange',  fill: '#FCA900', stroke: '#835034' },
  { label: 'Yellow',  fill: '#FCFC40', stroke: '#3E3E11' },
  { label: 'Red',     fill: '#FF3333', stroke: '#7A0000' },
  { label: 'Blue',    fill: '#3399FF', stroke: '#003380' },
  { label: 'Cyan',    fill: '#33FFFF', stroke: '#007A7A' },
  { label: 'Purple',  fill: '#AA00FF', stroke: '#440066' },
  { label: 'Lime',    fill: '#AAFF00', stroke: '#3A5500' },
  { label: 'White',   fill: '#FFFFFF', stroke: '#888888' },
  { label: 'Gray',    fill: '#888888', stroke: '#333333' },
  { label: 'Brown',   fill: '#A0522D', stroke: '#3B1A0A' },
  { label: 'Magenta', fill: '#FF55FF', stroke: '#7A007A' },
  { label: 'Black',   fill: '#333333', stroke: '#000000' },
] as const

// ─── Quests ───────────────────────────────────────────────────────────────────

export interface Quest {
  id: string
  categoryId: string    // matches Category.id
  subCategoryId: string // matches SubCategory.id
  amount: number        // target count
  objective: string     // item or mob name
  objectiveId: string   // mc_objectives id for icon lookup
  objectiveIcon?: string // path to mc asset icon e.g. /mc_assets/COBBLESTONE.png
  description?: string  // optional extra info
  counter: number       // current progress
  completed: boolean
  order: number         // for drag-and-drop ordering
}

// ─── Scrolls ──────────────────────────────────────────────────────────────────

export type ScrollType = 'easy' | 'normal' | 'hard' | 'extended' | 'weekly'

export const SCROLL_STYLES: Record<ScrollType, { fill: string; stroke: string; label: string; textFill: string; textStroke: string }> = {
  easy:     { fill: '#64FC65', stroke: '#193B11', label: 'Easy Quest Scroll',     textFill: '#A9A1A8', textStroke: '#2F2734' },
  normal:   { fill: '#F755ED', stroke: '#570A54', label: 'Normal Quest Scroll',   textFill: '#A9A1A8', textStroke: '#2F2734' },
  hard:     { fill: '#FCA900', stroke: '#835034', label: 'Hard Quest Scroll',     textFill: '#A9A1A8', textStroke: '#2F2734' },
  extended: { fill: '#FCFC40', stroke: '#3E3E11', label: 'Extended Quest Scroll', textFill: '#A9A1A8', textStroke: '#2F2734' },
  weekly:   { fill: '#5454FC', stroke: '#0A1A4A', label: 'Weekly Quest Scroll',   textFill: '#A9A1A8', textStroke: '#2F2734' },
}

export interface Scroll {
  id: string
  type: ScrollType
  quests: Quest[]
  order: number
  hidden?: boolean      // true = internal container, never shown in UI
  // extended only — per-letter color customization (future)
  titleColors?: string[]
}

// Reserved ID for the per-group hidden scroll that holds individually-added quests
export const HIDDEN_SCROLL_ID_PREFIX = '__hidden__'
export function hiddenScrollId(groupId: string) {
  return `${HIDDEN_SCROLL_ID_PREFIX}${groupId}`
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type DisplayMode =
  | 'separate'           // each scroll is its own block
  | 'categorized'        // quests grouped by main category
  | 'categorized-detail' // quests grouped by sub-category

export type IconSource = 'custom' | 'minecraft'

export interface GroupIcon {
  source: IconSource
  value: string // filename or asset key
}

export interface Group {
  id: string
  name: string
  icon: GroupIcon
  display: DisplayMode
  scrolls: Scroll[]
  order: number
}

// // ─── Battle Pass ──────────────────────────────────────────────────────────────

// // Week accent colors — one per week, cycling SCROLL_STYLES order
// export const BP_WEEK_COLORS = [
//   { fill: '#64FC65', stroke: '#193B11' }, // week 1 — green
//   { fill: '#F755ED', stroke: '#570A54' }, // week 2 — pink
//   { fill: '#FCA900', stroke: '#835034' }, // week 3 — orange
//   { fill: '#FCFC40', stroke: '#3E3E11' }, // week 4 — yellow
//   { fill: '#FF3333', stroke: '#7A0000' }, // week 5 — red
//   { fill: '#3399FF', stroke: '#003380' }, // week 6 — blue
//   { fill: '#33FFFF', stroke: '#007A7A' }, // week 7 — cyan
// ] as const

// // ── Stage step (shared by quests and goals) ───────────────────────────────────

// export interface BPStageStep {
//   id: string
//   text: string
//   icon: string        // mc asset path
//   amount: number      // target count for this step
//   // persisted:
//   counter: number
//   completed: boolean
// }

// // ── BP Quest (one entry inside a week) ───────────────────────────────────────

// export interface BPQuest {
//   id: string
//   text: string
//   icon: string        // mc asset path
//   isPremium: boolean  // false = Free section, true = Premium section
//   // null = standard quest; Stage[] = stage quest
//   stages: BPStageStep[] | null
//   // for standard quests only (ignored when stages !== null):
//   amount: number
//   // persisted:
//   counter: number
//   completed: boolean
// }

// // ── BP Week ───────────────────────────────────────────────────────────────────

// export interface BPWeek {
//   weekNumber: number  // 1–7
//   quests: BPQuest[]
// }

// // ── BP Goal ───────────────────────────────────────────────────────────────────

// export interface BPGoal {
//   id: string
//   text: string
//   icon?: string       // optional mc asset path
//   // null = standard goal; Stage[] = stage goal
//   stages: BPStageStep[] | null
//   // for standard goals only (ignored when stages !== null):
//   amount: number
//   // persisted:
//   counter: number
//   completed: boolean
// }

// // ── BP Daily (reuses Quest type, stored separately) ───────────────────────────

// // Daily quests are user-created and have the full Quest shape.
// // They are stored under questhub_battlepass_dailies, NOT inside any Group/Scroll.
// export type BPDaily = Quest

// // ── Persisted progress (counter + completed only) ────────────────────────────
// // Quest/goal definitions are hardcoded in bp_data.ts.
// // Only user state is persisted.

// export interface BPStepProgress {
//   stepId: string
//   counter: number
//   completed: boolean
// }

// export interface BPItemProgress {
//   id: string
//   counter: number
//   completed: boolean
//   // populated only for stage quests/goals:
//   stepProgress: BPStepProgress[]
// }

// // ── BP section order (user drag preference) ───────────────────────────────────

// export type BPSectionId = 'quests' | 'goals' | 'dailies'
// export const BP_DEFAULT_SECTION_ORDER: BPSectionId[] = ['quests', 'goals', 'dailies']
