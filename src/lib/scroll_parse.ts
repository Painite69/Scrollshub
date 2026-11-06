import { DEFAULT_CATEGORIES, type Quest, type ScrollType } from '../types/types'
import { MC_OBJECTIVES } from '../types/mc_objectives'
import mcAssetIndex from '../mc-asset-index.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrollQuestDraft {
  id: string
  rawLine: string
  categoryId: string
  subCategoryId: string
  amount: number
  objective: string
  objectiveId: string
  objectiveIcon?: string
  confidence: 'high' | 'low'
}

interface ActionMapEntry {
  categoryId: string
  subCategoryId: string
  key: string
  wordCount: number
}

interface McAsset { label: string; icon: string; icon3d?: string }
const MC_ASSETS: McAsset[] = mcAssetIndex as McAsset[]

// ─── Action map ───────────────────────────────────────────────────────────────

const EXTRA_ACTION_ALIASES: Array<{ alias: string; categoryId: string; subCategoryId: string }> = [
  { alias: 'log in', categoryId: 'interact', subCategoryId: 'login' },
  { alias: 'login', categoryId: 'interact', subCategoryId: 'login' },
  { alias: 'level up', categoryId: 'interact', subCategoryId: 'levelup' },
  { alias: 'levelup', categoryId: 'interact', subCategoryId: 'levelup' },
  { alias: 'travel to', categoryId: 'interact', subCategoryId: 'travel' },
  { alias: 'hoe till', categoryId: 'interact', subCategoryId: 'hoetill' },
  { alias: 'hoetill', categoryId: 'interact', subCategoryId: 'hoetill' },
]

/** Common Minecraft-font OCR misreads for action verbs. */
const ACTION_OCR_FIXES: Record<string, string> = {
  hill: 'kill',
  kiil: 'kill',
  kil: 'kill',
  klll: 'kill',
  ki11: 'kill',
  rill: 'kill', // K→R
  fide: 'ride',
  nde: 'ride',
  rlde: 'ride',
  r1de: 'ride',
  nide: 'ride',
  halk: 'walk',
  waik: 'walk',
  wakk: 'walk',
  wa1k: 'walk',
  vvalk: 'walk',
  eaf: 'eat',
  ea1: 'eat',
  lat: 'eat', // E→L
  crafl: 'craft',
  cratt: 'craft',
  mlne: 'mine',
  mirie: 'mine',
  mire: 'mine', // n→r
  harvesf: 'harvest',
  harvesl: 'harvest',
  piace: 'place',
  piacee: 'place',
  flace: 'place', // P→F
  bieak: 'break',
  breaik: 'break',
  figh: 'fish', // s→h
  fisn: 'fish',
}

/** Tiny English words — never fuzzy-match these into verbs (e.g. "at"→"eat"). */
const OCR_STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'for', 'on', 'of', 'in', 'at', 'is', 'or', 'so',
  'i', 'my', 'me', 'and', 'by', 'as', 'be', 'do', 'if', 'it', 'up', 'no',
  'have', 'has', 'had', 'from', 'with', 'this', 'that', 'sunday', 'monday',
  'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'october',
  'january', 'february', 'march', 'april', 'june', 'july', 'august',
  'september', 'november', 'december', 'utc', 'am', 'pm', 'fm',
])

function buildActionMap(): ActionMapEntry[] {
  const entries: ActionMapEntry[] = []

  for (const cat of DEFAULT_CATEGORIES) {
    for (const sub of cat.subCategories) {
      const key = sub.label.trim().toLowerCase()
      entries.push({
        categoryId: cat.id,
        subCategoryId: sub.id,
        key,
        wordCount: key.split(/\s+/).length,
      })
      if (sub.id !== key.replace(/\s+/g, '')) {
        entries.push({
          categoryId: cat.id,
          subCategoryId: sub.id,
          key: sub.id.toLowerCase(),
          wordCount: 1,
        })
      }
    }
  }

  for (const a of EXTRA_ACTION_ALIASES) {
    entries.push({
      categoryId: a.categoryId,
      subCategoryId: a.subCategoryId,
      key: a.alias,
      wordCount: a.alias.split(/\s+/).length,
    })
  }

  return entries.sort((a, b) => b.wordCount - a.wordCount || b.key.length - a.key.length)
}

const ACTION_MAP = buildActionMap()
const KNOWN_ACTIONS = [...new Set(ACTION_MAP.map(e => e.key.split(/\s+/)[0]))]

// ─── Noise / OCR cleanup ──────────────────────────────────────────────────────

const NOISE_LINE =
  /^(clues?|clue\s*scroll|quest\s*scroll|easy|normal|hard|weekly|extended|easy\s+quest\s+scroll|normal\s+quest\s+scroll|hard\s+quest\s+scroll|weekly\s+quest\s+scroll|extended\s+quest\s+scroll|progress|reward|rewards|complete|completed|vulengate|\d+\s*\/\s*\d+)$/i

/** Header / footer / inventory chrome that must never become quests. */
function isNoiseContent(line: string): boolean {
  const lower = line.toLowerCase().replace(/[^a-z0-9\s:/]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!lower) return true
  if (NOISE_LINE.test(lower)) return true
  if (/\bexpires?\b/.test(lower)) return true
  if (/\bi\s+have\s+to\b/.test(lower)) return true
  if (/^so+\b/.test(lower) && lower.length < 40) return true
  if (/\bminecraft\s*:/.test(lower) || /^[\w]+:[\w/]+$/.test(lower)) return true
  if (/\bcomponent\(s\)\b/.test(lower)) return true
  if (/\b\d{1,2}(st|nd|rd|th)?\s+\d{4}\b/.test(lower) && /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|sunday|monday|utc)\b/.test(lower)) {
    return true
  }
  if (/^\d+\s*components?\b/.test(lower)) return true
  // Bare progress / inventory leftovers
  if (/^(none|empty|air)$/i.test(lower)) return true
  return false
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\|/g, 'I')
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/[©¢¤®™]/g, ' ')
    .replace(/\r\n/g, '\n')
    // Minecraft "0" often OCR'd as @, º, ° — do NOT globally map O/o (breaks "golden")
    .replace(/[@º°]/g, '0')
}

function cleanLine(line: string): string {
  return line
    // leading bullets / ✖ / ★ / #*
    .replace(/^[\s*•\-–—·▪▸►✖✗✘★☆xX#“”"]+/, '')
    .replace(/[\s.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Strip Vulengate progress suffix / OCR junk at end of a clue line or objective.
 * Handles ": 0", ": B", ": @", trailing " B", " ©", etc.
 */
export function stripProgressSuffix(line: string): string {
  return line
    .replace(/:\s*.*$/u, '') // anything from the progress colon onward
    .replace(/\s+[\d@Ooº°AIlBb©¢&%]\s*$/u, '') // trailing single progress glyph (no colon)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize objective text for storage + dedupe keys. */
export function scrubObjectiveText(objective: string): string {
  let s = stripProgressSuffix(objective)
    .replace(/[©¢¤®™]+/g, ' ')
    .replace(/=+/g, ' ')
    .replace(/[;,:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Drop leading OCR digit-garbage tokens: "o0 pickaxes" → "pickaxes"
  s = s.replace(/^(?:o0|0o|0O|Oo)\s+/i, '')
  // Drop embedded lone garbage tokens + mixed digit/letter crumbs ("50H", "6FM")
  s = s
    .split(' ')
    .filter(tok => {
      if (/^(o0|0o)$/i.test(tok)) return false
      if (/^\d+[a-z]+$/i.test(tok) || /^[a-z]+\d+$/i.test(tok)) return false
      if (/^[;,:]+$/.test(tok)) return false
      return true
    })
    .join(' ')
    .trim()

  return s
}

function looksLikeKnownItem(objective: string): boolean {
  const key = normalizeObjectiveKey(objective)
  if (!key) return false
  if (key === 'blocks' || key === 'block' || key === 'plain') return true
  const candidates = [key, singularize(key), ...key.split(' ').filter(w => w.length >= 4)]
  for (const c of candidates) {
    for (const a of MC_ASSETS) {
      const label = normalizeObjectiveKey(a.label)
      if (!label) continue
      if (label === c || singularize(label) === c) return true
      if (c.length >= 5 && label.length >= 5 && levenshtein(c, label) <= 2) return true
      if (c.length >= 5 && singularize(label).length >= 5 && levenshtein(c, singularize(label)) <= 2) return true
    }
    for (const o of MC_OBJECTIVES) {
      const label = normalizeObjectiveKey(o.label)
      if (label === c || singularize(label) === c) return true
      if (c.length >= 5 && label.length >= 5 && levenshtein(c, label) <= 2) return true
    }
  }
  return false
}

/** True when a draft looks like OCR noise (should not survive merge). */
export function isGarbageDraft(d: {
  objective: string
  amount: number
  subCategoryId: string
  confidence: 'high' | 'low'
  objectiveIcon?: string
}): boolean {
  const obj = scrubObjectiveText(d.objective).toLowerCase()
  if (!obj) {
    return !['walk', 'sprint', 'swim', 'glide', 'break'].includes(d.subCategoryId)
  }
  if (isNoiseContent(obj)) return true
  if (/\b(have\s+to|expires?|utc|sunday|monday|component)\b/.test(obj)) return true
  if (/o0|0o/.test(obj)) return true
  // Mixed alphanumerics glued in the objective ("50H", "FM") — allow known item names with numbers later
  if (/^[a-z]{1,3}\d|\d[a-z]{1,3}$/i.test(obj.replace(/\s/g, ''))) return true
  if (/[a-z]+\d+\w*|\d+[a-z]+/i.test(obj.replace(/\s/g, '')) && !/[a-z]{4,}/i.test(obj)) return true
  // Objectives that are just leftover header fragments
  if (obj.length <= 2) return true
  if (/^(i\s+have|so+|fm|utc|\d+)$/i.test(obj)) return true
  // Long consonant runs = OCR mush ("cobupsbs")
  if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(obj.replace(/\s/g, ''))) return true
  // No icon and not close to any known item/mob name → OCR garbage
  if (!d.objectiveIcon && !looksLikeKnownItem(obj)) return true
  return false
}

/** Prefer icons that actually ship in public/mc_assets (mc-assets-main is not in this repo). */
function resolveLocalIcon(label: string, preferred?: string): string | undefined {
  const keys = [normalizeObjectiveKey(label), singularize(normalizeObjectiveKey(label))].filter(Boolean)

  for (const key of keys) {
    const asset =
      MC_ASSETS.find(a => normalizeObjectiveKey(a.label) === key) ??
      MC_ASSETS.find(a => singularize(normalizeObjectiveKey(a.label)) === key)
      // Prefer flat 2D "(2)" sheet when present (animals), never icon3d
    if (asset) {
      const base = asset.label.replace(/\s+/g, '_').toUpperCase()
      const flat =
        MC_ASSETS.find(a => a.icon.toUpperCase().includes(`/${base} (`)) ??
        MC_ASSETS.find(a => normalizeObjectiveKey(a.label) === key && a.icon.includes(' ('))
      return flat?.icon ?? asset.icon
    }
  }

  if (preferred?.startsWith('/mc_assets/') && !preferred.includes('(3D)') && preferred.includes(' (')) {
    return preferred
  }

  // Map /mc-assets-main/.../CHICKEN.png → /mc_assets/CHICKEN (2).png (2D)
  if (preferred) {
    const base = preferred.split('/').pop()?.replace(/\.png$/i, '')
    if (base) {
      const upper = base.toUpperCase()
      const hit =
        MC_ASSETS.find(a => a.icon.toUpperCase().includes(`/${upper} (`)) ??
        MC_ASSETS.find(a => a.icon.toUpperCase().includes(`/${upper}.PNG`))
      if (hit) {
        const flat = MC_ASSETS.find(a => a.icon.toUpperCase().includes(`/${upper} (`))
        return flat?.icon ?? hit.icon
      }
    }
  }

  return undefined
}

const MOVEMENT_ICONS: Record<string, string> = {
  walk: '/mc_assets/LEATHER_BOOTS.png',
  sprint: '/mc_assets/LEATHER_BOOTS.png',
  glide: '/mc_assets/ELYTRA.png',
  swim: '/mc_assets/WATER_BUCKET.png',
}

function newDraftId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 0; i < a.length; i++) {
    let prev = i + 1
    for (let j = 0; j < b.length; j++) {
      const cur = a[i] === b[j] ? row[j] : Math.min(row[j], row[j + 1], prev) + 1
      row[j] = prev
      prev = cur
    }
    row[b.length] = prev
  }
  return row[b.length]
}

function fixOcrWord(word: string): string {
  const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!lower) return word
  // Already a real action — never fuzzy away (ride ≠ glide)
  if (KNOWN_ACTIONS.includes(lower)) return lower
  if (ACTION_OCR_FIXES[lower]) return ACTION_OCR_FIXES[lower]
  // Never turn "at"/"to"/"so" into verbs
  if (OCR_STOP_WORDS.has(lower)) return word

  // Fuzzy only for misread verbs (Hill→kill, Fide→ride, Halk→walk).
  // Require same first letter so "at"≠"eat", "on"≠"mine".
  let best: string | null = null
  let bestDist = 99
  for (const action of KNOWN_ACTIONS) {
    if (action.includes(' ')) continue
    if (action[0] !== lower[0]) continue
    const d = levenshtein(lower, action)
    const max = action.length <= 4 ? 1 : 2
    if (d > 0 && d <= max && d < bestDist) {
      best = action
      bestDist = d
    }
  }
  return best ?? word
}

// ─── Objective icon lookup ────────────────────────────────────────────────────

function normalizeObjectiveKey(s: string): string {
  return s
    .toLowerCase()
    // Asset index uses "Nether Gold Ore/s" — treat /s as plural marker
    .replace(/\/s\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularize(s: string): string {
  const words = s.split(' ')
  return words
    .map(w => {
      if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`
      if (w.endsWith('sses')) return w.slice(0, -2)
      if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1)
      return w
    })
    .join(' ')
}

function lookupObjective(objective: string): {
  objectiveId: string
  objectiveIcon?: string
  /** Canonical spelling when fuzzy-matched (purpkin→pumpkin pie). */
  canonicalObjective?: string
} {
  // Clean leftover progress junk on the objective itself
  const cleaned = stripProgressSuffix(objective).replace(/:\s*.*$/, '').trim()
  const raw = normalizeObjectiveKey(cleaned)
  if (!raw || raw === 'plain' || raw === 'blocks' || raw === 'block') {
    return { objectiveId: 'custom' }
  }

  const candidates = [raw, singularize(raw)]
  const sortedObjectives = [...MC_OBJECTIVES].sort((a, b) => b.label.length - a.label.length)

  for (const key of candidates) {
    const exact = sortedObjectives.find(o => normalizeObjectiveKey(o.label) === key)
    if (exact) {
      return {
        objectiveId: exact.id,
        objectiveIcon: resolveLocalIcon(exact.label, exact.icon) ?? resolveLocalIcon(key),
      }
    }
  }

  // Exact / near-exact asset match BEFORE loose substring matches
  // (otherwise "nether gold ore" wrongly becomes plain "gold ore")
  for (const key of candidates) {
    const icon = resolveLocalIcon(key)
    if (icon) return { objectiveId: 'custom', objectiveIcon: icon }
  }

  for (const key of candidates) {
    const partial = sortedObjectives.find(o => {
      const label = normalizeObjectiveKey(o.label)
      // Require near-full match — don't let short labels steal longer names
      if (label === key) return true
      if (label.length < 6) return false
      return key === label || (key.includes(label) && label.length >= key.length - 2)
    })
    if (partial) {
      return {
        objectiveId: partial.id,
        objectiveIcon: resolveLocalIcon(partial.label, partial.icon) ?? resolveLocalIcon(key),
      }
    }
  }

  if (raw.length >= 4) {
    const loose = sortedObjectives.find(o => {
      const label = normalizeObjectiveKey(o.label)
      return label.length >= 4 && (label.includes(raw) || raw.includes(label))
    })
    if (loose) {
      return {
        objectiveId: loose.id,
        objectiveIcon: resolveLocalIcon(loose.label, loose.icon),
      }
    }
  }

  // Fuzzy asset label (purpkin→pumpkin, etc.) — systemic edit distance, not per-item
  if (raw.length >= 5) {
    let bestLabel: string | null = null
    let bestDist = 99
    for (const a of MC_ASSETS) {
      const label = normalizeObjectiveKey(a.label)
      if (label.length < 5) continue
      const dFull = levenshtein(raw, label)
      const max = label.length <= 6 ? 1 : 2
      if (dFull > 0 && dFull <= max && dFull < bestDist) {
        bestLabel = a.label
        bestDist = dFull
      }
      // Word-wise: "purpkin pies" vs "pumpkin pie"
      const rawWords = raw.split(' ')
      const labelWords = label.split(' ')
      if (rawWords.length === labelWords.length && rawWords.length >= 1) {
        let wd = 0
        let ok = true
        for (let i = 0; i < rawWords.length; i++) {
          const rw = singularize(rawWords[i])
          const lw = singularize(labelWords[i])
          const d = levenshtein(rw, lw)
          const m = lw.length <= 6 ? 1 : 2
          if (d > m) { ok = false; break }
          wd += d
        }
        if (ok && wd > 0 && wd < bestDist) {
          bestLabel = a.label
          bestDist = wd
        }
      }
    }
    if (bestLabel) {
      return {
        objectiveId: 'custom',
        objectiveIcon: resolveLocalIcon(bestLabel),
        canonicalObjective: bestLabel.toLowerCase(),
      }
    }
  }

  return { objectiveId: 'custom', objectiveIcon: resolveLocalIcon(cleaned) }
}

// ─── Line parsers ─────────────────────────────────────────────────────────────

function matchActionAt(
  words: string[],
  start: number,
): { entry: ActionMapEntry; consumed: number } | null {
  const slice = words.slice(start).map(w => fixOcrWord(w).toLowerCase().replace(/[^a-z0-9\s]/g, ''))
  for (const entry of ACTION_MAP) {
    const parts = entry.key.split(/\s+/)
    if (parts.length > slice.length) continue
    if (parts.every((p, i) => slice[i] === p)) {
      return { entry, consumed: parts.length }
    }
  }
  return null
}

/** Find the first action verb in the line (skips OCR junk before it). */
function findAction(words: string[]): { entry: ActionMapEntry; index: number; consumed: number } | null {
  for (let i = 0; i < words.length; i++) {
    const hit = matchActionAt(words, i)
    if (hit) return { ...hit, index: i }
  }
  return null
}

/**
 * Minecraft pixel-font digit confusions seen across Vulengate tooltips:
 * 0↔8, 3↔2, 5↔9, 5↔S. Generate candidates then prefer round quest-like amounts.
 */
function digitEditDistance(a: number, b: number): number {
  const sa = String(a)
  const sb = String(b)
  const n = Math.max(sa.length, sb.length)
  const pa = sa.padStart(n, ' ')
  const pb = sb.padStart(n, ' ')
  let e = Math.abs(sa.length - sb.length)
  for (let i = 0; i < n; i++) if (pa[i] !== pb[i]) e++
  return e
}

/** 0↔8 variants without turning 2808 into 2000 (mid 8 + existing 0). */
function eightToZeroForms(s: string): string[] {
  const forms = new Set<string>()
  const eightCount = (s.match(/8/g) ?? []).length
  // Trailing 8s are almost always misread 0s (758→750, 208→200)
  forms.add(s.replace(/8+$/, m => '0'.repeat(m.length)))
  // Single-position flips
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '8') continue
    forms.add(`${s.slice(0, i)}0${s.slice(i + 1)}`)
  }
  // Full replace when 8s are a zero-cluster (2588→2500, 2888→2000), not 2808→2000
  if (eightCount >= 3 || (eightCount >= 2 && !s.includes('0'))) {
    forms.add(s.replace(/8/g, '0'))
  }
  return [...forms]
}

function mcAmountVariants(n: number): number[] {
  const out = new Set<number>([n])
  for (const seed of [...out]) {
    const s = String(seed)
    for (const f of eightToZeroForms(s)) out.add(Number(f))
    out.add(Number(s.replace(/9/g, '5')))
    for (const f of eightToZeroForms(s.replace(/9/g, '5'))) out.add(Number(f))
    // 3 often reads as 2 — try flipping each 2→3 then re-apply 8→0 / 9→5
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '2') continue
      const flipped = `${s.slice(0, i)}3${s.slice(i + 1)}`
      out.add(Number(flipped))
      for (const f of eightToZeroForms(flipped)) out.add(Number(f))
      for (const f of eightToZeroForms(flipped.replace(/9/g, '5'))) out.add(Number(f))
    }
  }
  // Progress digit glued on (25000 / 13649)
  for (const v of [...out]) {
    if (v >= 10000) {
      out.add(Math.floor(v / 10))
      out.add(Math.floor(v / 100))
    }
  }
  return [...out].filter(x => Number.isFinite(x) && x > 0 && x < 1_000_000)
}

function questAmountRoundness(n: number): number {
  let s = 0
  if (n % 1000 === 0) s += 12
  if (n % 500 === 0) s += 10
  if (n % 250 === 0) s += 8
  if (n % 100 === 0) s += 6
  if (n % 50 === 0) s += 4
  if (n % 25 === 0) s += 3
  if (n % 10 === 0) s += 2
  if (n % 5 === 0) s += 1
  // Raw OCR noise digits
  s -= (String(n).match(/8/g) ?? []).length * 4
  return s
}

/** Pick the most quest-like reading of an OCR'd amount (systemic, not per-quest). */
export function correctMcAmount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1
  const variants = mcAmountVariants(n)
  variants.sort((a, b) => {
    const r = questAmountRoundness(b) - questAmountRoundness(a)
    if (r) return r
    return digitEditDistance(a, n) - digitEditDistance(b, n) || Math.abs(a - n) - Math.abs(b - n)
  })
  const best = variants[0] ?? n
  // Only rewrite when the winner is meaningfully rounder (avoids churn on already-clean 9, 12, …)
  if (questAmountRoundness(best) - questAmountRoundness(n) >= 2) return best
  return n
}

function parseAmountToken(token: string): number | null {
  // MC font: S/s→5, O/o/@/º→0; trailing letter often a misread 0/8 or progress glyph ("50H")
  let scrubbed = token
    .replace(/[@º°]/g, '0')
    .replace(/[Ss]/g, '5')
    .replace(/[Oo]/g, '0')

  if (/^\d+[A-Za-z]$/.test(scrubbed)) {
    const digits = scrubbed.slice(0, -1)
    const candidates = [
      Number(digits),
      Number(`${digits}0`),
      Number(`${digits}8`),
    ].filter(n => Number.isFinite(n) && n > 0)
    if (candidates.length === 0) return null
    candidates.sort((a, b) => questAmountRoundness(b) - questAmountRoundness(a))
    return correctMcAmount(candidates[0])
  }

  if (!/^\d+$/.test(scrubbed)) return null
  const n = Number(scrubbed)
  if (!Number.isFinite(n) || n <= 0) return null
  return correctMcAmount(n)
}

function looksLikeKillTarget(objective: string): boolean {
  const key = normalizeObjectiveKey(objective)
  if (!key) return false
  const hit = MC_OBJECTIVES.find(o => {
    const label = normalizeObjectiveKey(o.label)
    return (
      label === key ||
      singularize(label) === singularize(key) ||
      (label.length >= 4 && (key.includes(label) || label.includes(key)))
    )
  })
  return !!hit?.categoryHints?.includes('kill')
}

function draftFrom(
  rawLine: string,
  entry: ActionMapEntry,
  amount: number,
  objective: string,
  confidence: 'high' | 'low',
): ScrollQuestDraft {
  // OCR often turns hyphens/spaces into "=" ("red=stone")
  let cleanObjective = scrubObjectiveText(objective.replace(/=+/g, ' '))

  let resolvedEntry = entry
  // Kill↔Fill: K reads as F in MC font; Fill+mob is almost always Kill
  if (
    (entry.subCategoryId === 'fill' || entry.subCategoryId === 'empty') &&
    looksLikeKillTarget(cleanObjective)
  ) {
    resolvedEntry = {
      categoryId: 'kill',
      subCategoryId: 'kill',
      key: 'kill',
      wordCount: 1,
    }
  }

  const sub = resolvedEntry.subCategoryId
  const isMovement = sub === 'walk' || sub === 'sprint' || sub === 'swim' || sub === 'glide'
  if (isMovement) {
    const lower = cleanObjective.toLowerCase()
    if (!lower || lower === 'plain' || lower === 'blocks' || lower === 'block') {
      cleanObjective = 'blocks'
    }
  }

  let icon = lookupObjective(cleanObjective)
  // Movement defaults: boots / elytra / water bucket (override only when no surface item)
  if (isMovement && (cleanObjective === 'blocks' || cleanObjective === 'plain') && MOVEMENT_ICONS[sub]) {
    icon = { objectiveId: 'custom', objectiveIcon: MOVEMENT_ICONS[sub] }
  }
  // Break/mine plain blocks → cobblestone icon
  if ((sub === 'break' || sub === 'mine') && cleanObjective === 'blocks' && !icon.objectiveIcon) {
    icon = {
      objectiveId: 'custom',
      objectiveIcon: resolveLocalIcon('cobblestone') ?? '/mc_assets/COBBLESTONE.png',
    }
  }
  // Generic "pickaxes" / "swords" → default diamond tool icons
  if (!icon.objectiveIcon) {
    const lower = cleanObjective.toLowerCase()
    if (/pickaxe/.test(lower)) {
      icon = { objectiveId: 'custom', objectiveIcon: resolveLocalIcon('diamond pickaxe') ?? '/mc_assets/DIAMOND_PICKAXE.png' }
    } else if (/^swords?$/.test(lower) || lower === 'diamond swords' || lower === 'diamond sword') {
      icon = { objectiveId: 'custom', objectiveIcon: resolveLocalIcon('diamond sword') ?? '/mc_assets/DIAMOND_SWORD.png' }
    }
  }

  if (icon.canonicalObjective) cleanObjective = icon.canonicalObjective
  const { canonicalObjective: _c, ...iconFields } = icon

  return {
    id: newDraftId(),
    rawLine,
    categoryId: resolvedEntry.categoryId,
    subCategoryId: resolvedEntry.subCategoryId,
    amount: Math.max(1, correctMcAmount(amount)),
    objective: cleanObjective,
    ...iconFields,
    confidence,
  }
}

function scoreDraft(d: ScrollQuestDraft): number {
  let s = 0
  if (d.confidence === 'high') s += 2
  if (d.objectiveId !== 'custom') s += 6
  if (d.objectiveIcon) s += 3
  if (['kill', 'ride', 'walk', 'eat', 'mine', 'craft', 'harvest', 'sprint'].includes(d.subCategoryId)) {
    s += 5
  }
  // OCR often invents a leading "Place 1 …" before the real verb
  if (d.subCategoryId === 'place' && d.amount === 1) s -= 4
  if (/^[#*•]/.test(d.objective) || /\b(hill|fide|halk)\b/i.test(d.objective)) s -= 6
  if (d.amount >= 2) s += 1
  if (
    (d.objective === 'blocks' || d.objective === 'plain') &&
    (d.subCategoryId === 'walk' || d.subCategoryId === 'sprint' || d.subCategoryId === 'swim' || d.subCategoryId === 'glide')
  ) {
    s += 2
  }
  return s
}

function parseFromAction(
  rawLine: string,
  entry: ActionMapEntry,
  rest: string[],
): ScrollQuestDraft {
  const sub = entry.subCategoryId

  // Ride a <mount> for <n> blocks  |  Ride a <mount> <n> blocks
  if (sub === 'ride') {
    let tokens = [...rest]
    if (/^(a|an)$/i.test(tokens[0] ?? '')) tokens = tokens.slice(1)

    const forIdx = tokens.findIndex(t => /^for$/i.test(t))
    if (forIdx >= 0) {
      const afterFor = tokens.slice(forIdx + 1)
      const amount = parseAmountToken(afterFor[0] ?? '') ?? 1
      const objective = tokens.slice(0, forIdx).join(' ').trim() || 'mount'
      return draftFrom(rawLine, entry, amount, objective, objective !== 'mount' ? 'high' : 'low')
    }

    const blocksIdx = tokens.findIndex(t => /^blocks?$/i.test(t))
    const beforeBlocks = blocksIdx >= 0 ? tokens.slice(0, blocksIdx) : tokens
    let amount = 1
    let objectiveWords = beforeBlocks
    for (let i = beforeBlocks.length - 1; i >= 0; i--) {
      const n = parseAmountToken(beforeBlocks[i])
      if (n != null) {
        amount = n
        objectiveWords = beforeBlocks.slice(0, i)
        break
      }
    }
    const objective = objectiveWords.join(' ').trim() || 'mount'
    return draftFrom(rawLine, entry, amount, objective, objective !== 'mount' ? 'high' : 'low')
  }

  // Walk / Sprint / Swim / Glide <n> [on <surface>] blocks
  if (sub === 'walk' || sub === 'sprint' || sub === 'swim' || sub === 'glide') {
    let tokens = [...rest]
    const blocksIdx = tokens.findIndex(t => /^blocks?$/i.test(t))
    if (blocksIdx >= 0) tokens = tokens.slice(0, blocksIdx)

    let amount = 1
    let objective = 'blocks'
    const amountIdx = tokens.findIndex(t => parseAmountToken(t) != null)
    if (amountIdx >= 0) {
      amount = parseAmountToken(tokens[amountIdx]) ?? 1
      const after = tokens.slice(amountIdx + 1)
      if (/^on$/i.test(after[0] ?? '') && after.length > 1) {
        objective = after.slice(1).join(' ').trim() || 'blocks'
      }
    }
    return draftFrom(rawLine, entry, amount, objective, amountIdx >= 0 ? 'high' : 'low')
  }

  // Default: ACTION <amount> <objective…>
  if (rest.length === 0) {
    return draftFrom(rawLine, entry, 1, '', 'low')
  }

  let amount = 1
  let objectiveWords: string[] = []
  const firstAmount = parseAmountToken(rest[0])
  if (firstAmount != null) {
    amount = firstAmount
    objectiveWords = rest.slice(1)
  } else {
    const idx = rest.findIndex(t => parseAmountToken(t) != null)
    if (idx >= 0) {
      amount = parseAmountToken(rest[idx]) ?? 1
      objectiveWords = [...rest.slice(0, idx), ...rest.slice(idx + 1)]
    } else {
      objectiveWords = rest
    }
  }

  // Drop leftover OCR junk tokens before the real objective ("#*", "×", "o0")
  while (
    objectiveWords.length &&
    (/^[#*•·▪]+$/i.test(objectiveWords[0]) || /^(o0|0o)$/i.test(objectiveWords[0]))
  ) {
    objectiveWords = objectiveWords.slice(1)
  }

  // "Break 442 blocks" / "Mine 100 blocks" — keep "blocks" as the objective
  const endsWithBlocks =
    objectiveWords.length > 0 && /^blocks?$/i.test(objectiveWords[objectiveWords.length - 1])
  if (endsWithBlocks) {
    if (objectiveWords.length === 1 || sub === 'break' || sub === 'mine') {
      return draftFrom(
        rawLine,
        entry,
        amount,
        'blocks',
        firstAmount != null ? 'high' : 'low',
      )
    }
    objectiveWords = objectiveWords.slice(0, -1)
  }

  const objective = objectiveWords.join(' ').trim()
  return draftFrom(
    rawLine,
    entry,
    amount,
    objective,
    firstAmount != null && objective.length > 0 ? 'high' : 'low',
  )
}

/**
 * Vulengate clue shapes (after stripping ": progress"):
 * - "Kill 9 chickens"
 * - "Eat 3 cooked chicken"
 * - "Ride a minecart for 250 blocks"
 * - "Ride a Strider 10000 blocks"
 * - "Walk 1364 blocks"
 * - "Walk 3000 on Ice blocks"
 * - "Mine 2500 Obsidian"
 */
function parseLine(rawLine: string): ScrollQuestDraft {
  const stripped = stripProgressSuffix(cleanLine(normalizeOcrText(rawLine)))
  const words = stripped.split(' ').filter(Boolean)

  // Try every action position — OCR often prefixes junk like "Place 1 #* Hill 9…"
  let best: ScrollQuestDraft | null = null
  let bestScore = -Infinity

  for (let i = 0; i < words.length; i++) {
    const hit = matchActionAt(words, i)
    if (!hit) continue
    const candidate = parseFromAction(rawLine, hit.entry, words.slice(i + hit.consumed))
    const s = scoreDraft(candidate)
    if (s > bestScore) {
      best = candidate
      bestScore = s
    }
  }

  if (best) return best

  // No recognizable action — do NOT invent a Place-1 junk quest
  return {
    id: newDraftId(),
    rawLine,
    categoryId: 'interact',
    subCategoryId: 'place',
    amount: 1,
    objective: stripped,
    objectiveId: 'custom',
    confidence: 'low',
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function detectScrollType(text: string): ScrollType | null {
  const lower = normalizeOcrText(text).toLowerCase()
  const patterns: Array<[ScrollType, RegExp]> = [
    ['extended', /\bextended(?:\s+quest)?(?:\s+scroll)?\b/],
    ['weekly', /\bweekly(?:\s+quest)?(?:\s+scroll)?\b/],
    ['normal', /\bnormal(?:\s+quest)?(?:\s+scroll)?\b/],
    ['hard', /\bhard(?:\s+quest)?(?:\s+scroll)?\b/],
    ['easy', /\beasy(?:\s+quest)?(?:\s+scroll)?\b/],
  ]
  for (const [type, re] of patterns) {
    if (re.test(lower)) return type
  }
  return null
}

export function draftsToQuests(drafts: ScrollQuestDraft[]): Quest[] {
  return drafts.map((d, i) => ({
    id: newDraftId(),
    categoryId: d.categoryId,
    subCategoryId: d.subCategoryId,
    amount: Math.max(1, d.amount || 1),
    objective: d.objective,
    objectiveId: d.objectiveId || 'custom',
    objectiveIcon: d.objectiveIcon,
    counter: 0,
    completed: false,
    order: i,
  }))
}

export function parseScrollText(text: string): ScrollQuestDraft[] {
  const normalized = normalizeOcrText(text)
  const lines = normalized
    .split('\n')
    .map(l => stripProgressSuffix(cleanLine(l)))
    .filter(Boolean)

  const drafts: ScrollQuestDraft[] = []

  for (const line of lines) {
    if (isNoiseContent(line)) continue
    if (!/[a-zA-Z]/.test(line)) continue

    const draft = parseLine(line)
    const words = line.split(' ').filter(Boolean)
    const hasAction = findAction(words)
    // Require a real action verb — drop header/footer fragments even if they contain digits
    if (!hasAction) continue
    if (isGarbageDraft(draft)) continue

    drafts.push(draft)
  }

  // Dedupe identical action+objective (multi-pass OCR leftovers / ": B" / "o0" variants)
  const seen = new Map<string, ScrollQuestDraft>()
  for (const d of drafts) {
    if (isGarbageDraft(d)) continue
    const obj = scrubObjectiveText(d.objective)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const singular = singularize(obj)
    const key = `${d.subCategoryId}::${singular === 'plain' || singular === 'block' ? 'blocks' : singular}`
    const cleaned = {
      ...d,
      objective: scrubObjectiveText(d.objective) || (d.subCategoryId === 'break' ? 'blocks' : d.objective),
    }
    const prev = seen.get(key)
    if (!prev) {
      seen.set(key, { ...cleaned, amount: correctMcAmount(cleaned.amount) })
      continue
    }
    // Prefer the rounder systemic correction when the same clue appears twice
    const amount = correctMcAmount(
      questAmountRoundness(cleaned.amount) >= questAmountRoundness(prev.amount)
        ? cleaned.amount
        : prev.amount,
    )

    const score = (x: ScrollQuestDraft) =>
      (x.objectiveIcon ? 4 : 0) + (x.confidence === 'high' ? 2 : 0) + (x.amount >= 1 ? 1 : 0)
    const winner = score(cleaned) > score(prev) ? cleaned : prev
    const objective = scrubObjectiveText(winner.objective) || winner.objective
    seen.set(key, {
      ...winner,
      amount,
      objective,
      // Keep a real icon if either reading had one
      objectiveIcon: winner.objectiveIcon || prev.objectiveIcon || cleaned.objectiveIcon,
      objectiveId: winner.objectiveId !== 'custom' ? winner.objectiveId : (prev.objectiveId || cleaned.objectiveId),
    })
  }

  return [...seen.values()]
}
