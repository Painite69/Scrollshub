import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Scroll, Quest, Group, Category } from '../types/types'
import { SCROLL_STYLES, CATEGORY_COLORS, hiddenScrollId } from '../types/types'
import { saveGroups, loadGroups, loadCategories, loadCatOrder, saveCatOrder, loadSubOrder, saveSubOrder } from '../types/storage'
import { DragHandle, EditIcon, DeleteIcon, InfoIcon, DuplicateIcon } from './icons'
import ScrollPopup, { QuestEditPopup, LockedQuestAddPopup } from './scroll_popup'
import { MC_OBJECTIVES } from '../types/mc_objectives'
// ── Custom checkbox ───────────────────────────────────────────────────────────
// Placeholder — swap src for real images later

function QuestCheckbox({ checked, onChange, accentColor }: {
  checked: boolean
  onChange: () => void
  accentColor: string
}) {
  return (
    <button
      onClick={onChange}
      className="shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors cursor-pointer"
      style={{
        borderColor: accentColor,
        backgroundColor: checked ? accentColor : 'transparent',
      }}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#120413" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

// ── Quest row ─────────────────────────────────────────────────────────────────

function QuestRow({
  quest,
  accentColor,
  textColor,
  categories,
  onUpdate,
  onEdit,
  onDelete,
}: {
  quest: Quest
  accentColor: string
  textColor: string
  categories: Category[]
  onUpdate: (q: Quest) => void
  onEdit: (q: Quest) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: quest.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const subLabel = categories
    .flatMap(c => c.subCategories)
    .find(s => s.id === quest.subCategoryId)?.label ?? quest.subCategoryId

  // Smart display formatting for certain action types
  const SURFACE_LABELS = new Set(['ice', 'packed ice', 'blue ice', 'snow', 'underwater'])
  const SURFACE_IDS = new Set(['on_ice', 'on_packed_ice', 'on_blue_ice', 'on_snow', 'underwater'])
  const isRide = quest.subCategoryId === 'ride'
  const isMovement = quest.subCategoryId === 'walk' || quest.subCategoryId === 'sprint'
  const isSurface = SURFACE_IDS.has(quest.objectiveId) || SURFACE_LABELS.has(quest.objective.toLowerCase())

  let displayText: string
  if (isRide) {
    // "ride a Pig 3000 blocks"
    displayText = `${subLabel} a ${quest.objective} ${quest.amount} blocks`
  } else if (isMovement && isSurface) {
    // "walk 3000 on Ice blocks" / "sprint 3000 on Packed Ice blocks"
    displayText = `${subLabel} ${quest.amount} on ${quest.objective} blocks`
  } else if (isMovement) {
    // "walk 3000 blocks"
    displayText = `${subLabel} ${quest.amount} blocks`
  } else {
    displayText = `${subLabel} ${quest.amount} ${quest.objective}`
  }

  // Icon from quest data (set at creation time)
  const icon = quest.objectiveIcon ?? MC_OBJECTIVES.find(o => o.id === quest.objectiveId)?.icon ?? ''

  function setCounter(val: number) {
    const counter = Math.max(0, Math.min(val, quest.amount))
    onUpdate({ ...quest, counter, completed: counter >= quest.amount })
  }

  function toggleCompleted() {
    const completed = !quest.completed
    onUpdate({ ...quest, completed, counter: completed ? quest.amount : 0 })
  }

  const done = quest.completed

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 group/row">

      {/* LEFT: everything inline */}
      <div className="flex items-center gap-1 min-w-0">
        <button {...attributes} {...listeners}
          className="cursor-grab touch-none active:cursor-grabbing shrink-0"
          style={{ color: textColor + '50' }}>
          <DragHandle className="w-3 h-3" />
        </button>

        {icon && (
          <img src={icon} alt="" className="w-5 h-5 object-contain shrink-0 pixelated"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}

        <span className="font-pixeloid-sans text-xs"
          style={{ color: textColor, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.45 : 1 }}>
          * {displayText}:
        </span>

        <div className="flex items-center shrink-0">
          <input
            type="number" min={0} max={quest.amount} value={quest.counter}
            onChange={e => setCounter(parseInt(e.target.value) || 0)}
            className="w-10 bg-transparent text-right font-pixeloid-sans text-xs border-b focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: textColor, borderColor: textColor + '40' }}
          />
          <div className="flex flex-col ml-0.5 opacity-0 group-hover/row:opacity-80 transition-opacity">
            <button onClick={() => setCounter(quest.counter + 1)}
              className="cursor-pointer leading-none hover:opacity-100" style={{ color: textColor }}>
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
            </button>
            <button onClick={() => setCounter(quest.counter - 1)}
              className="cursor-pointer leading-none hover:opacity-100 mt-0.5" style={{ color: textColor }}>
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
            </button>
          </div>
        </div>

        <button onClick={() => onEdit(quest)}
          className="cursor-pointer sm:opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
          style={{ color: textColor + '80' }}>
          <EditIcon />
        </button>
        <button onClick={() => onDelete(quest.id)}
          className="cursor-pointer sm:opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0 text-red-400/60 hover:text-red-400">
          <DeleteIcon />
        </button>
      </div>

      {/* RIGHT: checkbox only */}
      <QuestCheckbox checked={done} onChange={toggleCompleted} accentColor={accentColor} />
    </div>
  )
}

// ── Sortable scroll card ──────────────────────────────────────────────────────

function ScrollCard({
  scroll,
  categories,
  onScrollUpdate,
  onScrollDelete,
  onScrollDuplicate,
}: {
  scroll: Scroll
  categories: Category[]
  onScrollUpdate: (s: Scroll) => void
  onScrollDelete: (id: string) => void
  onScrollDuplicate: (s: Scroll) => void
}) {
  const [editScrollOpen, setEditScrollOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const sensors = useSensors(useSensor(PointerSensor))

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scroll.id })

  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const scrollStyle = SCROLL_STYLES[scroll.type]
  const isExtended = scroll.type === 'extended'
  const subtitle = isExtended ? 'So... I have to:' : 'CLUES:'

  function updateQuests(quests: Quest[]) {
    onScrollUpdate({ ...scroll, quests })
  }

  function handleQuestDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = scroll.quests.findIndex(q => q.id === active.id)
    const newIdx = scroll.quests.findIndex(q => q.id === over.id)
    updateQuests(arrayMove(scroll.quests, oldIdx, newIdx).map((q, i) => ({ ...q, order: i })))
  }

  const sorted = [...scroll.quests].sort((a, b) => a.order - b.order)

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, borderColor: scrollStyle.stroke }}
      className="flex flex-col gap-2 rounded border-2 bg-[#120413] p-4 min-h-40 group/scroll"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        {/* Drag handle for scroll */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none active:cursor-grabbing shrink-0"
          style={{ color: scrollStyle.fill + '60' }}
        >
          <DragHandle className="w-3 h-3" />
        </button>

        <span className="flex-1 font-exe-pixel text-2xl" style={{ color: scrollStyle.fill }}>
          {isExtended && <span className="mr-1">★</span>}
          {scrollStyle.label}
          {isExtended && <span className="ml-1">★</span>}
        </span>

        <div className="flex gap-1 sm:opacity-0 group-hover/scroll:opacity-100 transition-opacity">
          <button
            onClick={() => setEditScrollOpen(true)}
            className="cursor-pointer hover:opacity-80"
            style={{ color: scrollStyle.fill + '80' }}
            aria-label="Edit scroll"
          >
            <EditIcon />
          </button>
          {isExtended && (
            <button
              onClick={() => onScrollDuplicate(scroll)}
              className="cursor-pointer hover:opacity-80"
              style={{ color: scrollStyle.fill + '80' }}
              aria-label="Duplicate scroll"
            >
              <DuplicateIcon className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onScrollDelete(scroll.id)}
            className="cursor-pointer text-red-400/50 hover:text-red-400"
            aria-label="Delete scroll"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <span className="font-exe-pixel text-sm" style={{ color: scrollStyle.fill }}>
        {subtitle}
      </span>

      {/* Quest list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQuestDragEnd}>
        <SortableContext items={sorted.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {sorted.map(quest => (
              <QuestRow
                key={quest.id}
                quest={quest}
                accentColor={scrollStyle.fill}
                textColor={scrollStyle.textFill}
                categories={categories}
                onUpdate={q => updateQuests(scroll.quests.map(x => x.id === q.id ? q : x))}
                onEdit={q => setEditingQuest(q)}
                onDelete={id => updateQuests(scroll.quests.filter(q => q.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => setEditScrollOpen(true)}
        className="cursor-pointer self-start font-pixeloid-sans text-xs mt-1 hover:opacity-80"
        style={{ color: scrollStyle.fill + '80' }}
      >
        + Add more
      </button>

      {editScrollOpen && (
        <ScrollPopup
          existing={scroll}
          categories={categories}
          onSave={s => { onScrollUpdate(s); setEditScrollOpen(false) }}
          onClose={() => setEditScrollOpen(false)}
        />
      )}
      {editingQuest && (
        <QuestEditPopup
          quest={editingQuest}
          categories={categories}
          accentColor={scrollStyle.fill}
          onSave={q => { updateQuests(scroll.quests.map(x => x.id === q.id ? q : x)); setEditingQuest(null) }}
          onClose={() => setEditingQuest(null)}
        />
      )}
    </div>
  )
}

// ── Category block ────────────────────────────────────────────────────────────

const CAT_COLOR_LIST = CATEGORY_COLORS.map(c => c.fill)

function CategoryBlock({
  label,
  description,
  colorIndex,
  categoryId,
  subCategoryId,
  quests,
  categories,
  onQuestUpdate,
  onQuestBatchUpdate,
  onQuestEdit,
  onQuestDelete,
  onAddQuest,
  dragHandleProps,
}: {
  label: string
  description?: string
  colorIndex: number
  categoryId: string
  subCategoryId?: string
  quests: Quest[]
  categories: Category[]
  onQuestUpdate: (q: Quest) => void
  onQuestBatchUpdate: (qs: Quest[]) => void
  onQuestEdit: (q: Quest) => void
  onQuestDelete: (id: string) => void
  onAddQuest: (categoryId: string, subCategoryId?: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(useSensor(PointerSensor))
  const fill = CAT_COLOR_LIST[colorIndex % CAT_COLOR_LIST.length]
  const stroke = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length].stroke
  const sorted = [...quests].sort((a, b) => a.order - b.order)

  // Close info on outside click
  useEffect(() => {
    if (!showInfo) return
    function handleClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showInfo])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sorted.findIndex(q => q.id === active.id)
    const newIdx = sorted.findIndex(q => q.id === over.id)
    // Reorder only within this block's quests, preserving order values relative to each other
    const reordered = arrayMove(sorted, oldIdx, newIdx)
    // Re-assign order using the original sorted order values so we don't collide with other scrolls
    const originalOrders = sorted.map(q => q.order).sort((a, b) => a - b)
    onQuestBatchUpdate(reordered.map((q, i) => ({ ...q, order: originalOrders[i] })))
  }

  return (
    <div
      className="flex flex-col gap-2 rounded border-2 bg-[#120413] p-4 h-full min-h-32"
      style={{ borderColor: stroke }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab touch-none active:cursor-grabbing shrink-0" style={{ color: fill + '60' }}>
              <DragHandle className="w-3 h-3" />
            </button>
          )}
          <span className="font-exe-pixel text-2xl" style={{ color: fill }}>{label}</span>
        </div>
        {description && (
          <div ref={infoRef} className="relative">
            <button
              onClick={() => setShowInfo(v => !v)}
              className="cursor-pointer transition-opacity hover:opacity-100 opacity-50"
              style={{ color: fill }}
              aria-label="Category info"
            >
              <InfoIcon />
            </button>
            {showInfo && (
              <div className="absolute right-0 top-6 z-20 w-56 rounded border bg-[#1e0a2e] p-3 shadow-lg" style={{ borderColor: stroke }}>
                <p className="font-pixeloid-sans text-xs text-white/80 leading-relaxed">{description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="font-exe-pixel text-sm" style={{ color: fill }}>To Do:</span>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {sorted.map(quest => (
              <QuestRow
                key={quest.id}
                quest={quest}
                accentColor={fill}
                textColor="#A9A1A8"
                categories={categories}
                onUpdate={onQuestUpdate}
                onEdit={onQuestEdit}
                onDelete={onQuestDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => onAddQuest(categoryId, subCategoryId)}
        className="cursor-pointer self-start font-pixeloid-sans text-xs mt-1 opacity-50 hover:opacity-80"
        style={{ color: fill }}
      >
        + Add more
      </button>
    </div>
  )
}

// ── Sortable wrapper for category blocks ──────────────────────────────────────

function SortableCategoryBlock({ id, ...props }: { id: string } & React.ComponentProps<typeof CategoryBlock>) {  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <CategoryBlock {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// ── Shared quest helpers for categorized views ────────────────────────────────
function useCategorizedQuests(group: Group, onGroupUpdate: (g: Group) => void) {
  const allQuests = group.scrolls.flatMap(s => s.quests)

  function updateQuest(updated: Quest) {
    onGroupUpdate({
      ...group,
      scrolls: group.scrolls.map(s => ({
        ...s, quests: s.quests.map(q => q.id === updated.id ? updated : q),
      })),
    })
  }

  // Update multiple quests at once (used for drag reorder within a category block)
  function batchUpdateQuests(updated: Quest[]) {
    const updatedMap = new Map(updated.map(q => [q.id, q]))
    onGroupUpdate({
      ...group,
      scrolls: group.scrolls.map(s => ({
        ...s, quests: s.quests.map(q => updatedMap.get(q.id) ?? q),
      })),
    })
  }

  function deleteQuest(id: string) {
    onGroupUpdate({
      ...group,
      scrolls: group.scrolls.map(s => ({
        ...s, quests: s.quests.filter(q => q.id !== id),
      })),
    })
  }

  function saveQuest(quest: Quest) {
    const hid = hiddenScrollId(group.id)
    const existing = group.scrolls.find(s => s.id === hid)
    if (existing) {
      // Append to the existing hidden scroll
      onGroupUpdate({
        ...group,
        scrolls: group.scrolls.map(s =>
          s.id === hid ? { ...s, quests: [...s.quests, quest] } : s
        ),
      })
    } else {
      // Create the hidden scroll for this group
      const hiddenScroll: Scroll = {
        id: hid,
        type: 'extended',
        quests: [quest],
        order: -1,
        hidden: true,
      }
      onGroupUpdate({ ...group, scrolls: [...group.scrolls, hiddenScroll] })
    }
  }

  return { allQuests, updateQuest, batchUpdateQuests, deleteQuest, saveQuest }
}

// ── Categorized view ──────────────────────────────────────────────────────────

function CategorizedView({ group, categories, onGroupUpdate }: {
  group: Group; categories: Category[]; onGroupUpdate: (g: Group) => void
}) {
  const [addPopup, setAddPopup] = useState<{ categoryId: string } | null>(null)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const defaultOrder = categories.map(c => c.id)
  const [catOrder, setCatOrder] = useState<string[]>(() =>
    loadCatOrder(group.id, defaultOrder)
  )
  const { allQuests, updateQuest, batchUpdateQuests, deleteQuest, saveQuest } = useCategorizedQuests(group, onGroupUpdate)
  const sensors = useSensors(useSensor(PointerSensor))

  const orderedCats = catOrder
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean) as typeof categories

  function handleCatDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = catOrder.indexOf(active.id as string)
    const newIdx = catOrder.indexOf(over.id as string)
    const next = arrayMove(catOrder, oldIdx, newIdx)
    setCatOrder(next)
    saveCatOrder(group.id, next)
  }

  const COLORS = CATEGORY_COLORS.map(c => c.fill)

  return (
    <div className="flex flex-col gap-3 mt-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
        <SortableContext items={catOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {orderedCats.map((cat, i) => (
              <SortableCategoryBlock
                key={cat.id}
                id={cat.id}
                label={cat.label}
                description={cat.description}
                colorIndex={i}
                categoryId={cat.id}
                quests={allQuests.filter(q => q.categoryId === cat.id)}
                categories={categories}
                onQuestUpdate={updateQuest}
                onQuestBatchUpdate={batchUpdateQuests}
                onQuestEdit={q => setEditingQuest(q)}
                onQuestDelete={deleteQuest}
                onAddQuest={catId => setAddPopup({ categoryId: catId })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {addPopup && (
        <LockedQuestAddPopup
          categories={categories}
          lockedCategoryId={addPopup.categoryId}
          accentColor={COLORS[orderedCats.findIndex(c => c.id === addPopup.categoryId) % COLORS.length]}
          onSave={q => { saveQuest(q); setAddPopup(null) }}
          onClose={() => setAddPopup(null)}
        />
      )}
      {editingQuest && (
        <QuestEditPopup
          quest={editingQuest}
          categories={categories}
          accentColor={COLORS[orderedCats.findIndex(c => c.id === editingQuest.categoryId) % COLORS.length]}
          onSave={q => { updateQuest(q); setEditingQuest(null) }}
          onClose={() => setEditingQuest(null)}
        />
      )}
    </div>
  )
}

// ── Categorized detail view ───────────────────────────────────────────────────

function CategorizedDetailView({ group, categories, onGroupUpdate }: {
  group: Group; categories: Category[]; onGroupUpdate: (g: Group) => void
}) {
  const [addPopup, setAddPopup] = useState<{ categoryId: string; subCategoryId: string } | null>(null)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const { allQuests, updateQuest, batchUpdateQuests, deleteQuest, saveQuest } = useCategorizedQuests(group, onGroupUpdate)

  const allSubs = categories.flatMap((cat, ci) =>
    cat.subCategories.map((sub, si) => ({ cat, sub, colorIndex: ci * 10 + si, id: sub.id }))
  )
  const defaultSubOrder = allSubs.map(s => s.id)
  const [subOrder, setSubOrder] = useState<string[]>(() =>
    loadSubOrder(group.id, defaultSubOrder)
  )
  const sensors = useSensors(useSensor(PointerSensor))

  const orderedSubs = subOrder
    .map(id => allSubs.find(s => s.id === id))
    .filter(Boolean) as typeof allSubs

  function handleSubDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = subOrder.indexOf(active.id as string)
    const newIdx = subOrder.indexOf(over.id as string)
    const next = arrayMove(subOrder, oldIdx, newIdx)
    setSubOrder(next)
    saveSubOrder(group.id, next)
  }

  const COLORS = CATEGORY_COLORS.map(c => c.fill)

  return (
    <div className="flex flex-col gap-3 mt-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
        <SortableContext items={subOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {orderedSubs.map(({ cat, sub, colorIndex }) => (
              <SortableCategoryBlock
                key={sub.id}
                id={sub.id}
                label={sub.label}
                description={cat.description}
                colorIndex={colorIndex}
                categoryId={cat.id}
                subCategoryId={sub.id}
                quests={allQuests.filter(q => q.subCategoryId === sub.id)}
                categories={categories}
                onQuestUpdate={updateQuest}
                onQuestBatchUpdate={batchUpdateQuests}
                onQuestEdit={q => setEditingQuest(q)}
                onQuestDelete={deleteQuest}
                onAddQuest={(catId, subId) => setAddPopup({ categoryId: catId, subCategoryId: subId ?? sub.id })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {addPopup && (
        <LockedQuestAddPopup
          categories={categories}
          lockedCategoryId={addPopup.categoryId}
          lockedSubId={addPopup.subCategoryId}
          accentColor={COLORS[orderedSubs.findIndex(s => s.sub.id === addPopup.subCategoryId) % COLORS.length]}
          onSave={q => { saveQuest(q); setAddPopup(null) }}
          onClose={() => setAddPopup(null)}
        />
      )}
      {editingQuest && (
        <QuestEditPopup
          quest={editingQuest}
          categories={categories}
          accentColor={COLORS[orderedSubs.findIndex(s => s.sub.id === editingQuest.subCategoryId) % COLORS.length]}
          onSave={q => { updateQuest(q); setEditingQuest(null) }}
          onClose={() => setEditingQuest(null)}
        />
      )}
    </div>
  )
}

// ── Scrolls container ─────────────────────────────────────────────────────────

function Scrolls({ group, onGroupUpdate }: {
  group: Group; onGroupUpdate: (g: Group) => void
}) {
  const [scrollPopup, setScrollPopup] = useState(false)
  const [editingScroll, setEditingScroll] = useState<Scroll | null>(null)
  const categories = loadCategories()
  const sensors = useSensors(useSensor(PointerSensor))

  function persistGroup(updated: Group) {
    onGroupUpdate(updated)
    saveGroups(loadGroups().map(g => g.id === updated.id ? updated : g))
  }

  function handleAddScroll(scroll: Scroll) {
    persistGroup({ ...group, scrolls: [...group.scrolls, { ...scroll, order: group.scrolls.length }] })
  }

  function handleEditScroll(scroll: Scroll) {
    persistGroup({ ...group, scrolls: group.scrolls.map(s => s.id === scroll.id ? scroll : s) })
  }

  function handleDuplicateScroll(scroll: Scroll) {
    const copy: Scroll = {
      ...scroll,
      id: crypto.randomUUID(),
      order: group.scrolls.length,
      quests: scroll.quests.map(q => ({ ...q, id: crypto.randomUUID() })),
    }
    persistGroup({ ...group, scrolls: [...group.scrolls, copy] })
  }

  function handleDeleteScroll(id: string) {
    persistGroup({ ...group, scrolls: group.scrolls.filter(s => s.id !== id) })
  }

  function handleScrollDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const s = [...group.scrolls].filter(x => !x.hidden).sort((a, b) => a.order - b.order)
    const oldIdx = s.findIndex(x => x.id === active.id)
    const newIdx = s.findIndex(x => x.id === over.id)
    const reordered = arrayMove(s, oldIdx, newIdx).map((x, i) => ({ ...x, order: i }))
    // Merge reordered visible scrolls back with hidden ones
    const hiddenScrolls = group.scrolls.filter(x => x.hidden)
    persistGroup({ ...group, scrolls: [...reordered, ...hiddenScrolls] })
  }

  const sorted = [...group.scrolls].sort((a, b) => a.order - b.order).filter(s => !s.hidden)

  // ── Shared scroll row (used in categorized modes) ──────────────────────────
  const ScrollRow = () => (
    <div className="flex flex-wrap gap-2 mt-2 items-center">
      {sorted.map(scroll => {
        const s = SCROLL_STYLES[scroll.type]
        const isExtended = scroll.type === 'extended'
        return (
          <div key={scroll.id}
            className="flex items-center gap-1.5 rounded border-2 bg-[#120413] px-2 group/pill"
            style={{ borderColor: s.stroke }}
          >
            <span className="font-exe-pixel text-xl" style={{ color: s.fill }}>
              {isExtended && '★ '}{s.label}{isExtended && ' ★'}
            </span>
            <div className="flex gap-1 sm:opacity-0 group-hover/pill:opacity-100 transition-opacity">
              <button onClick={() => setEditingScroll(scroll)}
                className="cursor-pointer hover:opacity-80" style={{ color: s.fill + '99' }}>
                <EditIcon />
              </button>
              {isExtended && (
                <button onClick={() => handleDuplicateScroll(scroll)}
                  className="cursor-pointer hover:opacity-80" style={{ color: s.fill + '99' }}>
                  <DuplicateIcon className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => handleDeleteScroll(scroll.id)}
                className="cursor-pointer text-red-400/50 hover:text-red-400">
                <DeleteIcon />
              </button>
            </div>
          </div>
        )
      })}
      <button
        onClick={() => setScrollPopup(true)}
        className="cursor-pointer flex items-center gap-1.5 rounded border-2 bg-[#120413] px-2  group/pill font-exe-pixel text-2xl text-white/30 hover:text-white/60"
      >
        + Add Scroll
      </button>
    </div>
  )

  // ── Categorized modes ──────────────────────────────────────────────────────
  if (group.display === 'categorized' || group.display === 'categorized-detail') {
    return (
      <div className="mt-1">
        <ScrollRow />
        {group.display === 'categorized'
          ? <CategorizedView group={group} categories={categories} onGroupUpdate={persistGroup} />
          : <CategorizedDetailView group={group} categories={categories} onGroupUpdate={persistGroup} />
        }
        {scrollPopup && (
          <ScrollPopup categories={categories} onSave={s => { handleAddScroll(s); setScrollPopup(false) }} onClose={() => setScrollPopup(false)} />
        )}
        {editingScroll && (
          <ScrollPopup existing={editingScroll} categories={categories} onSave={s => { handleEditScroll(s); setEditingScroll(null) }} onClose={() => setEditingScroll(null)} />
        )}
      </div>
    )
  }

  // ── Separate mode ──────────────────────────────────────────────────────────
  return (
    <div className="mt-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleScrollDragEnd}>
        <SortableContext items={sorted.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sorted.map(scroll => (
              <ScrollCard
                key={scroll.id}
                scroll={scroll}
                categories={categories}
                onScrollUpdate={s => persistGroup({ ...group, scrolls: group.scrolls.map(x => x.id === s.id ? s : x) })}
                onScrollDelete={handleDeleteScroll}
                onScrollDuplicate={handleDuplicateScroll}
              />
            ))}
            <button
              onClick={() => setScrollPopup(true)}
              className="cursor-pointer flex flex-col items-center justify-center rounded border-2 border-dashed border-[#190A21] bg-[#120413] min-h-40 font-pixeloid-sans text-sm text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <span className="text-4xl font-exe-pixel">+ Add Scroll</span>
              
            </button>
          </div>
        </SortableContext>
      </DndContext>
      {scrollPopup && (
        <ScrollPopup categories={categories} onSave={handleAddScroll} onClose={() => setScrollPopup(false)} />
      )}
      {editingScroll && (
        <ScrollPopup existing={editingScroll} categories={categories} onSave={s => { handleEditScroll(s); setEditingScroll(null) }} onClose={() => setEditingScroll(null)} />
      )}
    </div>
  )
}

export default Scrolls
