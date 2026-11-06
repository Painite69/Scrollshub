import { createWorker } from 'tesseract.js'
import {
  parseScrollText,
  scrubObjectiveText,
  isGarbageDraft,
  correctMcAmount,
  type ScrollQuestDraft,
} from './scroll_parse'

type SoftOpts = {
  scale: number
  /** Stretch contrast without destroying glyphs (no hard 1-bit threshold, no invert). */
  normalize: boolean
  /** Extra contrast punch after normalize — helps 3↔2 on purple tooltips. */
  punch?: boolean
}

/**
 * Gentle upscale only. Hard invert/threshold made MC tooltip OCR *worse*
 * (bench on Easy Scroll: invert = 0/5 key numbers; raw/gray upscale kept 5 golden / 1364).
 */
async function softPreprocess(image: Blob | File, opts: SoftOpts): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(image)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * opts.scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * opts.scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return image
    }

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    if (opts.normalize) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = img.data
      let min = 255
      let max = 0
      for (let i = 0; i < d.length; i += 4) {
        const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        if (y < min) min = y
        if (y > max) max = y
      }
      const range = Math.max(1, max - min)
      for (let i = 0; i < d.length; i += 4) {
        let y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        y = ((y - min) / range) * 255
        // mild contrast — keep greys for thin pixel strokes
        y = y < 128 ? y * 0.9 : 128 + (y - 128) * 1.15
        if (opts.punch) {
          // strong punch similar to sharp linear(1.6,-40)
          y = y * 1.55 - 35
        }
        y = Math.max(0, Math.min(255, y))
        d[i] = d[i + 1] = d[i + 2] = y
      }
      ctx.putImageData(img, 0, 0)
    }

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(b => resolve(b), 'image/png')
    })
    return blob ?? image
  } catch {
    return image
  }
}

function singularizeKey(s: string): string {
  return s
    .split(' ')
    .map(w => {
      if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`
      if (w.endsWith('sses')) return w.slice(0, -2)
      if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1)
      return w
    })
    .join(' ')
}

function normObj(s: string): string {
  const cleaned = scrubObjectiveText(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return singularizeKey(cleaned)
}

function draftKey(d: ScrollQuestDraft): string {
  let obj = normObj(d.objective)
  // "o0 pickaxes" / noisy prefixes → keep the recognizable item tail for grouping
  obj = obj.replace(/^(o0|0o)\s+/, '')
  // Group plain movement / break-blocks together
  const objKey =
    obj === 'plain' || obj === 'block' || obj === 'blocks' ? 'blocks' : obj
  return `${d.subCategoryId}::${objKey}`
}

/** Collapse near-duplicate objective keys (purpkin/pumpkin, cobupsbs/cobwebs). */
function findCompatibleKey(
  groups: Map<string, ScrollQuestDraft[]>,
  d: ScrollQuestDraft,
): string {
  const exact = draftKey(d)
  if (groups.has(exact)) return exact
  const obj = normObj(d.objective)
  if (obj.length < 5) return exact
  for (const key of groups.keys()) {
    const [sub, otherObj] = key.split('::')
    if (sub !== d.subCategoryId || !otherObj || otherObj.length < 5) continue
    const max = Math.max(obj.length, otherObj.length) >= 7 ? 3 : 2
    if (levenshtein(obj, otherObj) <= max) return key
  }
  return exact
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

function scoreText(text: string): number {
  const drafts = parseScrollText(text)
  let s = drafts.length * 4
  for (const d of drafts) {
    if (d.confidence === 'high') s += 6
    if (d.objectiveIcon) s += 2
    if (/[©@#*¢£]/.test(d.objective) || /\b0o\b/i.test(d.objective)) s -= 8
    if (d.amount >= 1) s += 1
  }
  // Prefer texts that still contain intact clue words
  const lower = text.toLowerCase()
  for (const w of ['kill', 'eat', 'ride', 'walk', 'blocks', 'chicken', 'golden', 'minecart']) {
    if (lower.includes(w)) s += 2
  }
  s -= (text.match(/[©¢]/g) ?? []).length * 4
  return s
}

function countMap(nums: number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const a of nums) counts.set(a, (counts.get(a) ?? 0) + 1)
  return counts
}

/**
 * Vote on amount across OCR passes using systemic MC digit variants
 * (0↔8, 3↔2, 5↔9) + quest-like roundness — not per-quest hardcodes.
 */
function pickAmount(amounts: number[], subCategoryId: string): number {
  const raw = amounts.filter(n => n > 0)
  if (raw.length === 0) return 1

  const pool: number[] = []
  for (const a of raw) {
    const corrected = correctMcAmount(a)
    pool.push(corrected)
    // A literal leading "3" in any OCR pass is strong evidence (3 often collapses to 2).
    // Extra-weight that corrected reading so 3588+2588 ties resolve toward 3500.
    if (String(a).startsWith('3')) {
      pool.push(corrected, corrected)
    }
  }

  const counts = countMap(pool)
  const uniq = [...counts.keys()]

  const score = (n: number) => {
    let s = (counts.get(n) ?? 0) * 10
    if (n % 1000 === 0) s += 12
    else if (n % 500 === 0) s += 10
    else if (n % 250 === 0) s += 8
    else if (n % 100 === 0) s += 6
    else if (n % 50 === 0) s += 4
    else if (n % 10 === 0) s += 2
    s -= (String(n).match(/8/g) ?? []).length * 5

    if (subCategoryId === 'ride') {
      if (n % 50 === 0) s += 6
      if (n % 10 === 0) s += 2
    }
    if (subCategoryId === 'walk' || subCategoryId === 'sprint' || subCategoryId === 'swim' || subCategoryId === 'glide') {
      if (n >= 1000 && n <= 9999) s += 5
      if (n >= 10000) s -= 10
    }
    return s
  }

  uniq.sort((a, b) => score(b) - score(a) || b - a)
  return correctMcAmount(uniq[0])
}

function mergeDraftLists(lists: ScrollQuestDraft[][]): ScrollQuestDraft[] {
  const groups = new Map<string, ScrollQuestDraft[]>()
  for (const list of lists) {
    for (const d of list) {
      // Scrub again so "chickens B" / "ore: 0" / "o0 pickaxes" collapse
      const cleaned: ScrollQuestDraft = {
        ...d,
        objective: scrubObjectiveText(d.objective),
      }
      if (isGarbageDraft(cleaned)) continue
      if (
        !cleaned.objective &&
        !['walk', 'sprint', 'swim', 'glide', 'break'].includes(cleaned.subCategoryId)
      ) {
        continue // drop empty junk rows
      }
      if (cleaned.subCategoryId === 'break' && !cleaned.objective) {
        cleaned.objective = 'blocks'
      }
      const k = findCompatibleKey(groups, cleaned)
      const arr = groups.get(k) ?? []
      arr.push(cleaned)
      groups.set(k, arr)
    }
  }

  const merged: ScrollQuestDraft[] = []
  for (const [, arr] of groups) {
    const amounts = arr.map(d => d.amount)
    const amount = pickAmount(amounts, arr[0].subCategoryId)
    // Prefer cleanest objective (shortest / no leftover glyphs) + icon + winning amount
    const ranked = [...arr].sort((a, b) => {
      const cleanScore = (d: ScrollQuestDraft) =>
        (d.objectiveIcon ? 5 : 0) +
        (d.amount === amount ? 3 : 0) +
        (d.confidence === 'high' ? 2 : 0) -
        d.objective.length * 0.01
      return cleanScore(b) - cleanScore(a)
    })
    const best = ranked[0]
    merged.push({
      ...best,
      amount,
      objective: scrubObjectiveText(best.objective),
    })
  }

  return merged
}

/**
 * Multi-pass OCR without invert/threshold. Merges parsed quests across passes
 * so e.g. one pass’s “1364” and another’s “Eat 5 golden” can both win.
 */
export async function ocrScrollImage(image: Blob | File | string): Promise<string> {
  if (typeof image === 'string') {
    const worker = await createWorker('eng')
    try {
      const { data: { text } } = await worker.recognize(image)
      return text ?? ''
    } finally {
      await worker.terminate()
    }
  }

  const variants: SoftOpts[] = [
    { scale: 1, normalize: false }, // raw
    { scale: 3, normalize: false },
    { scale: 3, normalize: true },
    { scale: 4, normalize: true },
    { scale: 4, normalize: true, punch: true }, // stronger contrast — helps leading "3" digits
  ]

  const prepared: Blob[] = []
  for (const opts of variants) {
    if (opts.scale === 1 && !opts.normalize) {
      prepared.push(image)
    } else {
      prepared.push(await softPreprocess(image, opts))
    }
  }

  const worker = await createWorker('eng')
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as unknown as undefined,
      preserve_interword_spaces: '1',
    })

    const texts: string[] = []
    let bestText = ''
    let bestScore = -Infinity

    for (const blob of prepared) {
      const { data: { text } } = await worker.recognize(blob)
      const t = text ?? ''
      texts.push(t)
      const sc = scoreText(t)
      if (sc > bestScore) {
        bestScore = sc
        bestText = t
      }
    }

    // Merge structured quests from all passes; stash as a synthetic clean text
    // so the existing parseScrollText pipeline still runs once in the popup.
    const merged = mergeDraftLists(texts.map(t => parseScrollText(t)))
    if (merged.length === 0) return bestText

    // Rebuild lore-like lines the parser already understands
    const lines = merged.map(d => {
      const sub = d.subCategoryId
      if (sub === 'ride') return `Ride a ${d.objective} for ${d.amount} blocks`
      if (sub === 'walk' || sub === 'sprint' || sub === 'swim' || sub === 'glide') {
        if (d.objective === 'blocks' || d.objective === 'plain') {
          return `${sub} ${d.amount} blocks`
        }
        return `${sub} ${d.amount} on ${d.objective} blocks`
      }
      return `${sub} ${d.amount} ${d.objective}`
    })

    // Keep type header from best full OCR if present
    const typeLine =
      bestText.match(/\b(easy|normal|hard|weekly|extended)\s+quest\s+scroll\b/i)?.[0] ??
      bestText.match(/\b(easy|normal|hard|weekly|extended)\b/i)?.[0] ??
      ''

    return [typeLine, 'CLUES:', ...lines].filter(Boolean).join('\n')
  } finally {
    await worker.terminate()
  }
}
