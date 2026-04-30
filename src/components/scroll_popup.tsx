import { useState, useRef, useEffect } from 'react'
import type { ScrollType, Scroll, Quest, Category } from '../types/types'
import { SCROLL_STYLES } from '../types/types'
import { MC_OBJECTIVES } from '../types/mc_objectives'
import { DeleteIcon } from './icons'
import mcAssetIndex from '../mc-asset-index.json'

// ── MC asset index types ──────────────────────────────────────────────────────
interface McAsset { label: string; icon: string; icon3d?: string }
const MC_ASSETS: McAsset[] = mcAssetIndex as McAsset[]

// Flat list of all icons including (2) variants — used by the icon selector grid
const ALL_ICONS: { label: string; icon: string }[] = MC_ASSETS.flatMap(a =>
  a.icon3d
    ? [{ label: a.label, icon: a.icon }, { label: `${a.label} (3D)`, icon: a.icon3d }]
    : [{ label: a.label, icon: a.icon }]
)

interface Props {
  categories: Category[]
  onSave: (scroll: Scroll) => void
  onClose: () => void
  allowExtended?: boolean
  existing?: Scroll // edit mode
}

const TYPES: ScrollType[] = ['easy', 'normal', 'hard', 'extended']

// ── Step 1 ────────────────────────────────────────────────────────────────────

function StepType({ onSelect }: { onSelect: (t: ScrollType) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-exe-pixel text-xl text-[#FCFC40]">Add a Scroll</h2>
      <p className="font-pixeloid-sans text-xs text-white/50">Pick a scroll type to get started.</p>
      <div className="flex flex-col gap-2">
        {TYPES.map(type => {
          const s = SCROLL_STYLES[type]
          return (
            <button key={type} onClick={() => onSelect(type)}
              className="cursor-pointer rounded border-2 px-4 py-2 font-exe-pixel text-sm text-left hover:opacity-90 transition-opacity"
              style={{ color: s.fill, borderColor: s.stroke, background: s.stroke + '44' }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Icon selector modal ───────────────────────────────────────────────────────

function IconSelectorModal({ current, onSelect, onClose }: {
  current: string
  onSelect: (icon: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = search.trim().length === 0
    ? ALL_ICONS
    : ALL_ICONS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70">
      <div className="flex flex-col gap-3 rounded border-2 border-[#190A21] bg-[#120413] p-4 w-[480px] max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-exe-pixel text-sm text-[#FCFC40]">Choose Icon</span>
          <button onClick={onClose} className="cursor-pointer font-pixeloid-sans text-xs text-white/30 hover:text-white/60">✕</button>
        </div>

        {/* Search */}
        <input
          ref={inputRef}
          className="w-full rounded border border-white/20 bg-[#1e0a2e] px-2 py-1.5 font-pixeloid-sans text-xs text-white placeholder-white/30 focus:outline-none"
          placeholder="Search icons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Grid */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-8 gap-1 p-1">
            {filtered.map(a => (
              <button
                key={a.icon}
                onMouseDown={() => { onSelect(a.icon); onClose() }}
                title={a.label}
                className={`cursor-pointer rounded p-1 flex items-center justify-center hover:bg-white/10 transition-colors ${current === a.icon ? 'bg-white/20 ring-1 ring-[#FCFC40]' : ''}`}
              >
                <img src={a.icon} alt={a.label} className="w-8 h-8 object-contain pixelated"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </button>
            ))}
          </div>
        </div>

        <p className="font-pixeloid-sans text-xs text-white/20 text-right">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

function ObjectivePicker({ value, onChange, onOpenIconSelector }: {
  value: { label: string; icon: string } | null
  onChange: (v: { label: string; icon: string }) => void
  onOpenIconSelector: () => void
}) {
  const [search, setSearch] = useState(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync label if parent resets value (e.g. after add)
  useEffect(() => { setSearch(value?.label ?? '') }, [value?.label])

  // Reset highlight when suggestions change
  useEffect(() => { setHighlightedIndex(-1) }, [search])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return
    const item = listRef.current.children[highlightedIndex] as HTMLElement
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const suggestions = search.trim().length === 0
    ? []
    : MC_ASSETS
        .filter(a => {
          const q = search.toLowerCase()
          const label = a.label.toLowerCase()
          // For short queries (≤3 chars), only match from the start of the label or a word
          if (q.length <= 3) return label.startsWith(q) || label.split(' ').some(word => word.startsWith(q))
          return label.includes(q)
        })
        .sort((a, b) => {
          const q = search.toLowerCase()
          const aLabel = a.label.toLowerCase()
          const bLabel = b.label.toLowerCase()
          const aExact = aLabel === q
          const bExact = bLabel === q
          const aStart = aLabel.startsWith(q)
          const bStart = bLabel.startsWith(q)
          if (aExact !== bExact) return aExact ? -1 : 1
          if (aStart !== bStart) return aStart ? -1 : 1
          return aLabel.localeCompare(bLabel)
        })
        .slice(0, 12)

  function select(a: McAsset) {
    setSearch(a.label)
    onChange({ label: a.label, icon: a.icon })
    setOpen(false)
    setHighlightedIndex(-1)
  }

  function handleChange(raw: string) {
    setSearch(raw)
    setOpen(true)
    onChange({ label: raw, icon: value?.icon ?? '' })
  }

  return (
    <div ref={ref} className="flex items-center gap-1 flex-1 min-w-0">
      <div className="relative flex-1 min-w-0">
        <input
          className="w-full rounded border border-white/20 bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-xs text-white placeholder-white/30 focus:outline-none"
          placeholder="Item / Mob / Block..."
          value={search}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (search.trim()) setOpen(true) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlightedIndex(i => Math.max(i - 1, -1))
            } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              const target = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0]
              if (target) select(target)
            } else if (e.key === 'Escape') {
              setOpen(false)
              setHighlightedIndex(-1)
            }
          }}
        />
        {open && suggestions.length > 0 && (
          <div ref={listRef} className="absolute left-0 right-0 top-full z-30 mt-0.5 rounded border border-white/20 bg-[#1e0a2e] shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((a, i) => (
              <button key={a.label} onMouseDown={() => select(a)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full flex items-center gap-2 cursor-pointer px-3 py-1.5 text-left font-pixeloid-sans text-xs text-white ${i === highlightedIndex ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <img src={a.icon} alt="" className="w-5 h-5 object-contain shrink-0 pixelated"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Icon button — shows current icon, click to open selector */}
      <button
        type="button"
        onClick={onOpenIconSelector}
        title="Choose icon"
        className="cursor-pointer shrink-0 w-7 h-7 rounded border border-white/20 bg-[#1e0a2e] flex items-center justify-center hover:border-white/40 transition-colors"
      >
        {value?.icon ? (
          <img src={value.icon} alt="" className="w-5 h-5 object-contain pixelated"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Sub-category picker (searchable, shows all subs flat) ─────────────────────

function SubCategoryPicker({ categories, value, onChange, accentColor }: {
  categories: Category[]
  value: { catId: string; subId: string; label: string }
  onChange: (v: { catId: string; subId: string; label: string }) => void
  accentColor: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const allSubs = categories.flatMap(cat =>
    cat.subCategories.map(sub => ({ catId: cat.id, subId: sub.id, label: sub.label }))
  )
  const withCustom = [...allSubs, { catId: 'custom', subId: 'custom', label: 'other' }]
  const filtered = withCustom.filter(s =>
    search.length === 0 || s.label.toLowerCase().includes(search.toLowerCase())
  )

  function select(s: typeof withCustom[0]) {
    setSearch('')
    onChange(s)
    setOpen(false)
  }

  // On blur/tab: auto-select the top filtered match if there is one
  function handleBlur() {
    if (filtered.length > 0 && search.trim().length > 0) {
      select(filtered[0])
    } else {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative w-24 shrink-0">
      <div
        className="flex items-center gap-1 rounded border border-white/20 bg-[#1e0a2e] px-2 py-1 cursor-text"
        onClick={() => setOpen(true)}
      >
        {/* show selected label or placeholder */}
        {!open && value.subId ? (
          <span className="flex-1 font-pixeloid-sans text-xs truncate" style={{ color: accentColor }}>
            {value.label}
          </span>
        ) : (
          <input
            autoFocus={open}
            className="flex-1 w-0 bg-transparent font-pixeloid-sans text-xs focus:outline-none"
            style={{ color: accentColor }}
            placeholder="Action..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={e => {
              if ((e.key === 'Tab' || e.key === 'Enter') && filtered.length > 0 && search.trim().length > 0) {
                e.preventDefault()
                select(filtered[0])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
        )}
        <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor" className="shrink-0 opacity-40" style={{ color: accentColor }}>
          <polygon points="4,6 0,0 8,0" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-0.5 rounded border border-white/20 bg-[#1e0a2e] shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(s => (
            <button key={`${s.catId}-${s.subId}`} onMouseDown={() => select(s)}
              className="w-full cursor-pointer px-3 py-1.5 text-left font-pixeloid-sans text-xs text-white hover:bg-white/10"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Quest draft form ──────────────────────────────────────────────────────────

interface QuestDraft {
  id: string
  categoryId: string
  subCategoryId: string
  amount: number
  objective: string
  objectiveId: string
  objectiveIcon: string
  description: string
}

function QuestForm({ categories, accentColor, onAdd, initialDraft }: {
  categories: Category[]
  accentColor: string
  onAdd: (q: QuestDraft) => void
  initialDraft?: QuestDraft
}) {
  const [sub, setSub] = useState(() => initialDraft
    ? { catId: initialDraft.categoryId, subId: initialDraft.subCategoryId, label: categories.flatMap(c => c.subCategories).find(s => s.id === initialDraft.subCategoryId)?.label ?? initialDraft.subCategoryId }
    : { catId: '', subId: '', label: '' }
  )
  const [amount, setAmount] = useState(initialDraft?.amount ?? 0)
  const [objective, setObjective] = useState<{ label: string; icon: string } | null>(
    initialDraft ? { label: initialDraft.objective, icon: initialDraft.objectiveIcon } : null
  )
  const [description, setDescription] = useState(initialDraft?.description ?? '')
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)

  function handleAdd() {
    if (!objective?.label.trim() || !sub.subId || amount < 1) return
    onAdd({
      id: crypto.randomUUID(),
      categoryId: sub.catId,
      subCategoryId: sub.subId,
      amount,
      objective: objective.label,
      objectiveId: 'custom',
      objectiveIcon: objective.icon,
      description,
    })
    setObjective(null)
    setDescription('')
    setAmount(0)
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/5 p-3">
      {/* Row: × | action | amount▲▼ | item/mob | icon btn */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-pixeloid-sans text-xs text-white/40 shrink-0">×</span>

        {/* Action — fixed narrow width */}
        <SubCategoryPicker
          categories={categories}
          value={sub}
          onChange={setSub}
          accentColor={accentColor}
        />

        {/* Amount — number right-aligned + stacked arrows */}
        <div className="flex items-center rounded border border-white/20 bg-[#1e0a2e] shrink-0">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount === 0 ? '' : amount}
            placeholder="Amt"
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && v >= 1) setAmount(v)
              else if (e.target.value === '') setAmount(0)
            }}
            className="w-12 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white text-right focus:outline-none placeholder-white/20"
          />
          <div className="flex flex-col border-l border-white/20">
            <button type="button" onClick={() => setAmount(a => Math.max(1, a + 1))}
              className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none">
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
            </button>
            <button type="button" onClick={() => setAmount(a => Math.max(1, a - 1))}
              className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none border-t border-white/20">
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
            </button>
          </div>
        </div>

        {/* Objective — takes remaining space */}
        <ObjectivePicker
          value={objective}
          onChange={setObjective}
          onOpenIconSelector={() => setIconSelectorOpen(true)}
        />
      </div>

      {/* Description */}
      <input
        className="w-full rounded border border-white/10 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white/60 placeholder-white/20 focus:outline-none"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={handleAdd}
          disabled={!objective?.label.trim() || !sub.subId}
          className="cursor-pointer rounded border px-4 py-1.5 font-exe-pixel text-sm disabled:opacity-30"
          style={{ color: accentColor, borderColor: accentColor, background: accentColor + '22' }}
        >
          + Add
        </button>
      </div>

      {/* Icon selector */}
      {iconSelectorOpen && (
        <IconSelectorModal
          current={objective?.icon ?? ''}
          onSelect={icon => setObjective(prev => prev ? { ...prev, icon } : { label: '', icon })}
          onClose={() => setIconSelectorOpen(false)}
        />
      )}
    </div>
  )
}

// ── Inline draft edit modal ───────────────────────────────────────────────────

function DraftEditModal({ draft, categories, accentColor, onSave, onClose }: {
  draft: QuestDraft
  categories: Category[]
  accentColor: string
  onSave: (d: QuestDraft) => void
  onClose: () => void
}) {
  const allSubs = categories.flatMap(c => c.subCategories.map(s => ({ catId: c.id, subId: s.id, label: s.label })))
  const subLabel = allSubs.find(s => s.subId === draft.subCategoryId)?.label ?? draft.subCategoryId

  const [sub, setSub] = useState({ catId: draft.categoryId, subId: draft.subCategoryId, label: subLabel })
  const [amount, setAmount] = useState(draft.amount)
  const [objective, setObjective] = useState<{ label: string; icon: string }>({
    label: draft.objective, icon: draft.objectiveIcon,
  })
  const [description, setDescription] = useState(draft.description)
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)

  function handleSave() {
    onSave({ ...draft, categoryId: sub.catId, subCategoryId: sub.subId, amount, objective: objective.label, objectiveId: 'custom', objectiveIcon: objective.icon, description })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="flex flex-col gap-3 rounded border-2 border-[#190A21] bg-[#120413] p-5 w-[400px]">
        <span className="font-exe-pixel text-sm" style={{ color: accentColor }}>Edit Quest</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-pixeloid-sans text-xs text-white/40 shrink-0">×</span>
          <SubCategoryPicker categories={categories} value={sub} onChange={setSub} accentColor={accentColor} />
          <div className="flex items-center rounded border border-white/20 bg-[#1e0a2e] shrink-0">
            <input type="text" inputMode="numeric" value={amount}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setAmount(v) }}
              className="w-12 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white text-right focus:outline-none"
            />
            <div className="flex flex-col border-l border-white/20">
              <button type="button" onClick={() => setAmount(a => a + 1)} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
              </button>
              <button type="button" onClick={() => setAmount(a => Math.max(1, a - 1))} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none border-t border-white/20">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
              </button>
            </div>
          </div>
          <ObjectivePicker value={objective} onChange={setObjective} onOpenIconSelector={() => setIconSelectorOpen(true)} />
        </div>
        <input className="w-full rounded border border-white/10 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white/60 placeholder-white/20 focus:outline-none"
          placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="cursor-pointer font-pixeloid-sans text-xs text-white/30 hover:text-white/60">Cancel</button>
          <button onClick={handleSave} className="cursor-pointer rounded border px-4 py-1.5 font-exe-pixel text-sm"
            style={{ color: accentColor, borderColor: accentColor, background: accentColor + '22' }}>Save</button>
        </div>
        {iconSelectorOpen && (
          <IconSelectorModal
            current={objective.icon}
            onSelect={icon => setObjective(prev => ({ ...prev, icon }))}
            onClose={() => setIconSelectorOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function StepQuests({ scrollType, categories, onBack, onDone, existingQuests = [], isEdit = false }: {
  scrollType: ScrollType
  categories: Category[]
  onBack: () => void
  onDone: (quests: Quest[]) => void
  existingQuests?: Quest[]
  isEdit?: boolean
}) {
  const [drafts, setDrafts] = useState<QuestDraft[]>(() =>
    existingQuests.map(q => ({
      id: q.id,
      categoryId: q.categoryId,
      subCategoryId: q.subCategoryId,
      amount: q.amount,
      objective: q.objective,
      objectiveId: q.objectiveId ?? 'custom',
      objectiveIcon: q.objectiveIcon ?? MC_OBJECTIVES.find(o => o.id === q.objectiveId)?.icon ?? '',
      description: q.description ?? '',
    }))
  )
  const [editingDraft, setEditingDraft] = useState<QuestDraft | null>(null)
  const s = SCROLL_STYLES[scrollType]

  const subMap = Object.fromEntries(
    categories.flatMap(c => c.subCategories.map(sub => [sub.id, sub.label]))
  )

  function handleDone() {
    onDone(drafts.map((d, i) => ({
      id: d.id,
      categoryId: d.categoryId,
      subCategoryId: d.subCategoryId,
      amount: d.amount,
      objective: d.objective,
      objectiveId: d.objectiveId,
      objectiveIcon: d.objectiveIcon,
      description: d.description || undefined,
      counter: 0,
      completed: false,
      order: i,
    })))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="cursor-pointer font-pixeloid-sans text-xs text-white/40 hover:text-white">← back</button>
        <span className="font-exe-pixel text-base" style={{ color: s.fill }}>{s.label}</span>
      </div>

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
          {drafts.map(d => (
            <div key={d.id} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1">
              {d.objectiveIcon && (
                <img src={d.objectiveIcon} alt="" className="w-5 h-5 object-contain shrink-0 pixelated"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <span className="flex-1 font-pixeloid-sans text-xs" style={{ color: s.textFill }}>
                <span style={{ color: s.fill }}>{subMap[d.subCategoryId] ?? d.subCategoryId}</span>
                {' '}{d.amount} {d.objective}
                {d.description && <span className="text-white/40"> — {d.description}</span>}
              </span>
              <button onClick={() => setEditingDraft(d)}
                className="cursor-pointer text-white/30 hover:text-white shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => setDrafts(p => p.filter(x => x.id !== d.id))}
                className="cursor-pointer text-red-400/50 hover:text-red-400 shrink-0">
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <QuestForm categories={categories} accentColor={s.fill} onAdd={d => setDrafts(p => [...p, d])} />

      {/* Done */}
      <button onClick={handleDone}
        className="cursor-pointer rounded border px-4 py-2 font-exe-pixel text-sm"
        style={{ color: s.fill, borderColor: s.stroke, background: s.stroke + '44' }}
      >
      {isEdit ? 'Edit Scroll' : drafts.length === 0 ? 'Add Empty Scroll' : `Add Scroll (${drafts.length} quest${drafts.length !== 1 ? 's' : ''})`}
      </button>

      {/* Inline draft edit */}
      {editingDraft && (
        <DraftEditModal
          draft={editingDraft}
          categories={categories}
          accentColor={s.fill}
          onSave={updated => { setDrafts(p => p.map(x => x.id === updated.id ? updated : x)); setEditingDraft(null) }}
          onClose={() => setEditingDraft(null)}
        />
      )}
    </div>
  )
}

// ── Single quest edit popup ───────────────────────────────────────────────────

export function QuestEditPopup({ quest, categories, accentColor = '#FCFC40', onSave, onClose }: {
  quest: Quest
  categories: Category[]
  accentColor?: string
  onSave: (q: Quest) => void
  onClose: () => void
}) {
  const allSubs = categories.flatMap(c => c.subCategories.map(s => ({ catId: c.id, subId: s.id, label: s.label })))
  const subLabel = allSubs.find(s => s.subId === quest.subCategoryId)?.label ?? quest.subCategoryId

  const [sub, setSub] = useState({ catId: quest.categoryId, subId: quest.subCategoryId, label: subLabel })
  const [amount, setAmount] = useState(quest.amount)
  const [objective, setObjective] = useState<{ label: string; icon: string }>({
    label: quest.objective,
    icon: quest.objectiveIcon ?? MC_OBJECTIVES.find(o => o.id === quest.objectiveId)?.icon ?? '',
  })
  const [description, setDescription] = useState(quest.description ?? '')
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)

  function handleSave() {
    if (!objective.label.trim() || !sub.subId || amount < 1) return
    onSave({ ...quest, categoryId: sub.catId, subCategoryId: sub.subId, amount, objective: objective.label, objectiveId: quest.objectiveId, objectiveIcon: objective.icon, description: description || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col gap-4 rounded border-2 border-[#190A21] bg-[#120413] p-6 w-[420px]">
        <span className="font-exe-pixel text-base" style={{ color: accentColor }}>Edit Quest</span>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-pixeloid-sans text-xs text-white/40 shrink-0">×</span>
          <SubCategoryPicker categories={categories} value={sub} onChange={setSub} accentColor={accentColor} />
          <div className="flex items-center rounded border border-white/20 bg-[#1e0a2e] shrink-0">
            <input type="text" inputMode="numeric" value={amount === 0 ? '' : amount}
              placeholder="Amt"
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setAmount(v); else if (e.target.value === '') setAmount(0) }}
              className="w-12 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white text-right focus:outline-none placeholder-white/20"
            />
            <div className="flex flex-col border-l border-white/20">
              <button type="button" onClick={() => setAmount(a => Math.max(1, a + 1))} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
              </button>
              <button type="button" onClick={() => setAmount(a => Math.max(1, a - 1))} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none border-t border-white/20">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
              </button>
            </div>
          </div>
          <ObjectivePicker value={objective} onChange={setObjective} onOpenIconSelector={() => setIconSelectorOpen(true)} />
        </div>

        <input
          className="w-full rounded border border-white/10 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white/60 placeholder-white/20 focus:outline-none"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="cursor-pointer font-pixeloid-sans text-xs text-white/30 hover:text-white/60">Cancel</button>
          <button onClick={handleSave}
            disabled={!objective.label.trim() || !sub.subId || amount < 1}
            className="cursor-pointer rounded border px-4 py-1.5 font-exe-pixel text-sm disabled:opacity-30"
            style={{ color: accentColor, borderColor: accentColor, background: accentColor + '22' }}>
            Save
          </button>
        </div>

        {iconSelectorOpen && (
          <IconSelectorModal
            current={objective.icon}
            onSelect={icon => setObjective(prev => ({ ...prev, icon }))}
            onClose={() => setIconSelectorOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

function ScrollPopup({ categories, onSave, onClose, allowExtended = true, existing }: Props) {
  const [step, setStep] = useState<'type' | 'quests'>(() => existing ? 'quests' : 'type')
  const [scrollType, setScrollType] = useState<ScrollType>(existing?.type ?? 'easy')

  function handleDone(quests: Quest[]) {
    onSave({
      id: existing?.id ?? crypto.randomUUID(),
      type: scrollType,
      quests,
      order: existing?.order ?? Date.now(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col gap-4 rounded border-2 border-[#190A21] bg-[#120413] p-6 w-[420px] max-h-[90vh] overflow-y-auto">
        {step === 'type'
          ? <StepType onSelect={t => { if (allowExtended || t !== 'extended') { setScrollType(t); setStep('quests') } }} />
          : <StepQuests
              scrollType={scrollType}
              categories={categories}
              onBack={existing ? onClose : () => setStep('type')}
              onDone={handleDone}
              existingQuests={existing?.quests}
              isEdit={!!existing}
            />
        }
        <button onClick={onClose} className="cursor-pointer self-end font-pixeloid-sans text-xs text-white/30 hover:text-white/60">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ScrollPopup

// ── Locked quest add popup (for categorized views) ────────────────────────────
// Sub-category is pre-set; in categorized mode shows all subs for that category.
// In categorized-detail mode the sub is fully locked.

export function LockedQuestAddPopup({ categories, lockedCategoryId, lockedSubId, accentColor, onSave, onClose }: {
  categories: Category[]
  lockedCategoryId: string       // always set
  lockedSubId?: string           // set in detail mode → fully locked
  accentColor: string
  onSave: (q: Quest) => void
  onClose: () => void
}) {
  const cat = categories.find(c => c.id === lockedCategoryId)
  const firstSub = lockedSubId
    ? cat?.subCategories.find(s => s.id === lockedSubId) ?? cat?.subCategories[0]
    : cat?.subCategories[0]

  const [sub, setSub] = useState({
    catId: lockedCategoryId,
    subId: lockedSubId ? (firstSub?.id ?? '') : (cat?.subCategories[0]?.id ?? ''),
    label: lockedSubId ? (firstSub?.label ?? '') : (cat?.subCategories[0]?.label ?? ''),
  })
  const [amount, setAmount] = useState(0)
  const [objective, setObjective] = useState<{ label: string; icon: string } | null>(null)
  const [description, setDescription] = useState('')
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)

  // Filtered sub-category options — only subs of the locked category
  const subOptions = cat?.subCategories ?? []

  function handleSave() {
    if (!objective?.label.trim() || !sub.subId || amount < 1) return
    onSave({
      id: crypto.randomUUID(),
      categoryId: sub.catId,
      subCategoryId: sub.subId,
      amount,
      objective: objective.label,
      objectiveId: 'custom',
      objectiveIcon: objective.icon,
      description: description || undefined,
      counter: 0,
      completed: false,
      order: Date.now(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col gap-4 rounded border-2 border-[#190A21] bg-[#120413] p-6 w-[420px]">
        <span className="font-exe-pixel text-base" style={{ color: accentColor }}>Add Quest</span>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-pixeloid-sans text-xs text-white/40 shrink-0">×</span>

          {/* Sub-category — locked to category's subs only, or fully locked in detail mode */}
          {lockedSubId ? (
            // Fully locked — just show the label
            <span className="w-24 shrink-0 rounded border border-white/20 bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-xs"
              style={{ color: accentColor }}>
              {firstSub?.label ?? lockedSubId}
            </span>
          ) : (
            // Category locked, sub selectable within category
            <div className="relative w-24 shrink-0">
              <select
                className="w-full rounded border border-white/20 bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-xs focus:outline-none appearance-none"
                style={{ color: accentColor }}
                value={sub.subId}
                onChange={e => {
                  const s = subOptions.find(s => s.id === e.target.value)
                  if (s) setSub({ catId: lockedCategoryId, subId: s.id, label: s.label })
                }}
              >
                {subOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* Amount */}
          <div className="flex items-center rounded border border-white/20 bg-[#1e0a2e] shrink-0">
            <input type="text" inputMode="numeric" value={amount === 0 ? '' : amount}
              placeholder="Amt"
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setAmount(v); else if (e.target.value === '') setAmount(0) }}
              className="w-12 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white text-right focus:outline-none placeholder-white/20"
            />
            <div className="flex flex-col border-l border-white/20">
              <button type="button" onClick={() => setAmount(a => Math.max(1, a + 1))} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
              </button>
              <button type="button" onClick={() => setAmount(a => Math.max(1, a - 1))} className="cursor-pointer px-1 py-0.5 text-white/50 hover:text-white leading-none border-t border-white/20">
                <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
              </button>
            </div>
          </div>

          {/* Objective */}
          <ObjectivePicker value={objective} onChange={setObjective} onOpenIconSelector={() => setIconSelectorOpen(true)} />
        </div>

        <input
          className="w-full rounded border border-white/10 bg-transparent px-2 py-1 font-pixeloid-sans text-xs text-white/60 placeholder-white/20 focus:outline-none"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="cursor-pointer font-pixeloid-sans text-xs text-white/30 hover:text-white/60">Cancel</button>
          <button onClick={handleSave}
            disabled={!objective?.label.trim() || amount < 1 || !sub.subId}
            className="cursor-pointer rounded border px-4 py-1.5 font-exe-pixel text-sm disabled:opacity-30"
            style={{ color: accentColor, borderColor: accentColor, background: accentColor + '22' }}>
            Add
          </button>
        </div>

        {iconSelectorOpen && (
          <IconSelectorModal
            current={objective?.icon ?? ''}
            onSelect={icon => setObjective(prev => prev ? { ...prev, icon } : { label: '', icon })}
            onClose={() => setIconSelectorOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
