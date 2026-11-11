import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category, Group, Quest, Scroll } from '../../types/types'
import { CATEGORY_COLORS, SCROLL_STYLES } from '../../types/types'
import {
  loadCategories,
  loadCatOrder,
  loadGroups,
  loadSubOrder,
  saveCatOrder,
  saveGroups,
  saveSubOrder,
  subscribeGroupsChanged,
} from '../../types/storage'
import {
  sectionStorageKey,
  type OverlaySettings,
} from '../../types/overlay_settings'
import ScrollPopup from '../scroll_popup'
import GroupPopup from '../group_popup'
import { DeleteIcon, DragHandle, EditIcon, ListIcon, PlusIcon } from '../icons'
import type { OverlayDisplayBounds } from '../../lib/overlay_displays'
import {
  overlayBackdropClass,
  overlayBackdropStyle,
  portalOverlayModal,
} from '../../lib/overlay_modal'

type Props = {
  settings: OverlaySettings
  onSettingsChange: (patch: Partial<OverlaySettings>) => void
  /** External trigger (control rail + button). */
  addScrollRequest?: number
  onAddFlowChange?: (active: boolean) => void
  /** Home display bounds (window-local) — center popups on this screen. */
  homeBounds: OverlayDisplayBounds
}

type QuestPatch = Partial<Pick<Quest, 'counter' | 'completed'>>

function questLabel(q: Quest): string {
  const action = q.subCategoryId
  const amt = q.amount
  const obj = q.objective
  if (q.subCategoryId === 'ride') return `Ride ${obj} ${amt}`
  if (['walk', 'sprint', 'swim', 'glide'].includes(q.subCategoryId)) {
    return obj && obj !== 'blocks' && obj !== 'plain'
      ? `${action} ${amt} on ${obj}`
      : `${action} ${amt} blocks`
  }
  return `${action} ${amt}${obj ? ` ${obj}` : ''}`
}

function mergeOrderedIds(saved: string[], defaults: string[]): string[] {
  const missing = defaults.filter(id => !saved.includes(id))
  return [...saved.filter(id => defaults.includes(id)), ...missing]
}

function sectionIdsForScroll(scroll: Scroll, detail: boolean): string[] {
  const ids = scroll.quests.map(q => (detail ? q.subCategoryId : q.categoryId))
  return [...new Set(ids.filter(Boolean))]
}

export default function OverlayPanelBody({
  settings,
  onSettingsChange,
  addScrollRequest = 0,
  onAddFlowChange,
  homeBounds,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups())
  const [addOpen, setAddOpen] = useState(false)
  const [pickGroupId, setPickGroupId] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [scrollsListGroup, setScrollsListGroup] = useState<Group | null>(null)
  const [editingScroll, setEditingScroll] = useState<{ groupId: string; scroll: Scroll } | null>(null)
  const categories = loadCategories()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const refresh = useCallback(() => {
    setGroups(loadGroups())
  }, [])

  useEffect(() => {
    refresh()
    const unsub = subscribeGroupsChanged(refresh)
    const id = window.setInterval(refresh, 2000)
    return () => {
      unsub()
      window.clearInterval(id)
    }
  }, [refresh])

  const modalOpen =
    addOpen || editingGroup != null || scrollsListGroup != null || editingScroll != null

  useEffect(() => {
    onAddFlowChange?.(modalOpen)
  }, [modalOpen, onAddFlowChange])

  useEffect(() => {
    if (addScrollRequest <= 0) return
    beginAddScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addScrollRequest])

  // Seed open sections once per section key: non-empty open, empty stay closed.
  useEffect(() => {
    const known = [...settings.knownSectionIds]
    const open = [...settings.openSectionIds]
    let changed = false

    for (const group of groups) {
      if (group.display !== 'categorized' && group.display !== 'categorized-detail') continue
      const detail = group.display === 'categorized-detail'
      const allQuests = group.scrolls.flatMap(s => s.quests)
      const sectionIds = detail
        ? categories.flatMap(c => c.subCategories.map(s => s.id))
        : categories.map(c => c.id)

      for (const sectionId of sectionIds) {
        const key = sectionStorageKey(group.id, sectionId)
        if (known.includes(key)) continue
        known.push(key)
        changed = true
        const count = allQuests.filter(q =>
          detail ? q.subCategoryId === sectionId : q.categoryId === sectionId,
        ).length
        if (count > 0) open.push(key)
      }
    }

    if (changed) onSettingsChange({ knownSectionIds: known, openSectionIds: open })
    // Only re-seed when group data / display mode changes — not when open toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, categories])

  function beginAddScroll() {
    const list = loadGroups().slice().sort((a, b) => a.order - b.order)
    if (list.length === 0) return
    if (list.length === 1) {
      setPickGroupId(list[0].id)
      setAddOpen(true)
      return
    }
    setPickGroupId(null)
    setAddOpen(true)
  }

  function closeAdd() {
    setAddOpen(false)
    setPickGroupId(null)
  }

  function persistGroups(next: Group[]) {
    setGroups(saveGroups(next))
  }

  function handleSaveGroup(group: Group) {
    const next = loadGroups()
    const updated = next.some(g => g.id === group.id)
      ? next.map(g => (g.id === group.id ? group : g))
      : [...next, group]
    persistGroups(updated)
    setEditingGroup(null)
  }

  function handleAddScroll(scroll: Scroll) {
    const targetId = pickGroupId ?? loadGroups().sort((a, b) => a.order - b.order)[0]?.id
    if (!targetId) return
    const current = loadGroups()
    const target = current.find(g => g.id === targetId)
    const next = current.map(g => {
      if (g.id !== targetId) return g
      return {
        ...g,
        scrolls: [...g.scrolls, { ...scroll, order: g.scrolls.filter(s => !s.hidden).length }],
      }
    })
    persistGroups(next)
    closeAdd()

    const groupIds =
      settings.openGroupIds.length === 0
        ? next.map(g => g.id)
        : settings.openGroupIds.includes(targetId)
          ? settings.openGroupIds
          : [...settings.openGroupIds, targetId]

    const detail = target?.display === 'categorized-detail'
    const sectionKeys =
      target?.display === 'categorized' || target?.display === 'categorized-detail'
        ? sectionIdsForScroll(scroll, detail).map(id => sectionStorageKey(targetId, id))
        : []

    onSettingsChange({
      openGroupIds: groupIds,
      openScrollIds: settings.openScrollIds.includes(scroll.id)
        ? settings.openScrollIds
        : [...settings.openScrollIds, scroll.id],
      openSectionIds: [...new Set([...settings.openSectionIds, ...sectionKeys])],
      knownSectionIds: [...new Set([...settings.knownSectionIds, ...sectionKeys])],
    })
  }

  function handleEditScroll(scroll: Scroll) {
    if (!editingScroll) return
    const { groupId } = editingScroll
    const next = loadGroups().map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        scrolls: g.scrolls.map(s => (s.id === scroll.id ? { ...scroll, order: s.order } : s)),
      }
    })
    persistGroups(next)
    setEditingScroll(null)
    // Keep scrolls list in sync if still open
    setScrollsListGroup(prev => {
      if (!prev || prev.id !== groupId) return prev
      return next.find(g => g.id === groupId) ?? prev
    })
  }

  function handleDeleteScroll(groupId: string, scrollId: string) {
    const next = loadGroups().map(g => {
      if (g.id !== groupId) return g
      return { ...g, scrolls: g.scrolls.filter(s => s.id !== scrollId) }
    })
    persistGroups(next)
    setScrollsListGroup(prev => {
      if (!prev || prev.id !== groupId) return prev
      return next.find(g => g.id === groupId) ?? null
    })
    if (editingScroll?.scroll.id === scrollId) setEditingScroll(null)
  }

  function updateQuest(groupId: string, questId: string, patch: QuestPatch) {
    const next = loadGroups().map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        scrolls: g.scrolls.map(s => ({
          ...s,
          quests: s.quests.map(q => {
            if (q.id !== questId) return q
            const merged = { ...q, ...patch }
            if (patch.counter != null) {
              merged.completed = merged.counter >= merged.amount
            }
            return merged
          }),
        })),
      }
    })
    persistGroups(next)
  }

  function reorderScrolls(groupId: string, activeId: string, overId: string) {
    const next = loadGroups().map(g => {
      if (g.id !== groupId) return g
      const visible = g.scrolls.filter(s => !s.hidden).slice().sort((a, b) => a.order - b.order)
      const oldIdx = visible.findIndex(s => s.id === activeId)
      const newIdx = visible.findIndex(s => s.id === overId)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return g
      const reordered = arrayMove(visible, oldIdx, newIdx).map((s, i) => ({ ...s, order: i }))
      const hidden = g.scrolls.filter(s => s.hidden)
      return { ...g, scrolls: [...reordered, ...hidden] }
    })
    persistGroups(next)
  }

  function toggleGroup(id: string) {
    const allIds = groups.map(g => g.id)
    const currentlyOpen = settings.openGroupIds.length === 0 ? allIds : settings.openGroupIds
    const open = currentlyOpen.includes(id)
    onSettingsChange({
      openGroupIds: open
        ? currentlyOpen.filter(x => x !== id)
        : [...currentlyOpen, id],
    })
  }

  function toggleScroll(id: string) {
    const open = settings.openScrollIds.includes(id)
    onSettingsChange({
      openScrollIds: open
        ? settings.openScrollIds.filter(x => x !== id)
        : [...settings.openScrollIds, id],
    })
  }

  function toggleSection(groupId: string, sectionId: string) {
    const key = sectionStorageKey(groupId, sectionId)
    const open = settings.openSectionIds.includes(key)
    onSettingsChange({
      openSectionIds: open
        ? settings.openSectionIds.filter(k => k !== key)
        : [...settings.openSectionIds, key],
      knownSectionIds: settings.knownSectionIds.includes(key)
        ? settings.knownSectionIds
        : [...settings.knownSectionIds, key],
    })
  }

  const visible = groups
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(g => ({
      ...g,
      scrolls: g.scrolls
        .filter(s => !s.hidden)
        .slice()
        .sort((a, b) => a.order - b.order),
    }))

  const needsGroupPick = addOpen && pickGroupId == null && visible.length > 1

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="font-exe-pixel text-2xl text-[#FCFC40]">QuestHub</span>
        <button
          type="button"
          onClick={beginAddScroll}
          className="cursor-pointer ml-auto flex items-center gap-1.5 rounded border border-[#3E3E11] px-2.5 py-1.5 font-pixeloid-sans text-sm text-[#FCFC40] hover:border-[#FCFC40] hover:bg-[#FCFC4015]"
          title="Add scroll — paste a screenshot or pick a type"
        >
          <PlusIcon className="size-4" strokeWidth={2} />
          Add Scroll
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:thin]">
        {visible.length === 0 && (
          <p className="px-1 py-3 font-pixeloid-sans text-sm text-white/40">
            No groups yet — open the app to create one, then add scrolls here.
          </p>
        )}

        {visible.map(group => {
          const open =
            settings.openGroupIds.length === 0 || settings.openGroupIds.includes(group.id)
          return (
            <div key={group.id} className="mb-1.5">
              <div className="flex items-center gap-1 rounded px-1.5 py-2 hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="cursor-pointer flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="w-4 shrink-0 font-pixeloid-sans text-sm text-white/40">
                    {open ? '▾' : '▸'}
                  </span>
                  <span className="truncate font-exe-pixel text-xl text-white">{group.name}</span>
                </button>
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    title="Scrolls list"
                    onClick={() => setScrollsListGroup(group)}
                    className="cursor-pointer rounded p-1 text-white/35 hover:bg-white/10 hover:text-[#FCFC40]"
                  >
                    <ListIcon className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    title="Edit group"
                    onClick={() => setEditingGroup(group)}
                    className="cursor-pointer rounded p-1 text-white/35 hover:bg-white/10 hover:text-[#FCFC40]"
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>

              {open && (
                <div className="ml-2.5 border-l border-white/10 pl-2">
                  {group.display === 'categorized' || group.display === 'categorized-detail' ? (
                    <CategorizedOverlay
                      group={group}
                      categories={categories}
                      detail={group.display === 'categorized-detail'}
                      openSectionIds={settings.openSectionIds}
                      sensors={sensors}
                      onToggleSection={sectionId => toggleSection(group.id, sectionId)}
                      onQuest={(questId, patch) => updateQuest(group.id, questId, patch)}
                      onReorderSections={order => {
                        if (group.display === 'categorized-detail') saveSubOrder(group.id, order)
                        else saveCatOrder(group.id, order)
                        refresh()
                      }}
                    />
                  ) : (
                    <SeparateOverlay
                      group={group}
                      openScrollIds={settings.openScrollIds}
                      sensors={sensors}
                      onToggleScroll={toggleScroll}
                      onQuest={(questId, patch) => updateQuest(group.id, questId, patch)}
                      onReorder={(activeId, overId) =>
                        reorderScrolls(group.id, activeId, overId)
                      }
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {needsGroupPick &&
        portalOverlayModal(
          <div
            className={`${overlayBackdropClass({ screenBounds: homeBounds, z: 'z-[90]', bg: 'bg-black/70' })} p-3`}
            style={overlayBackdropStyle(homeBounds)}
            data-questhub-overlay-hit=""
          >
            <div
              className="flex w-full max-w-[360px] flex-col gap-3 rounded border-2 border-[#190A21] bg-[#120413] p-4"
              data-questhub-overlay-hit=""
            >
              <span className="font-exe-pixel text-base text-[#FCFC40]">Add scroll to…</span>
              <div className="flex flex-col gap-1.5">
                {visible.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPickGroupId(g.id)}
                    className="cursor-pointer rounded border-2 border-[#3E3E11] px-3 py-2 text-left font-exe-pixel text-sm text-white hover:border-[#FCFC40]"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={closeAdd}
                className="cursor-pointer self-end font-pixeloid-sans text-xs text-white/40 hover:text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>,
          homeBounds,
        )}

      {scrollsListGroup &&
        portalOverlayModal(
          <div
            className={overlayBackdropClass({ screenBounds: homeBounds, z: 'z-[90]', bg: 'bg-black/70' })}
            style={overlayBackdropStyle(homeBounds)}
            data-questhub-overlay-hit=""
          >
            <div
              className="flex w-[min(420px,92vw)] max-h-[min(70vh,560px)] flex-col gap-3 overflow-hidden rounded border-2 border-[#190A21] bg-[#120413] p-4"
              data-questhub-overlay-hit=""
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-exe-pixel text-lg text-[#FCFC40]">
                  {scrollsListGroup.name} — Scrolls
                </span>
                <button
                  type="button"
                  onClick={() => setScrollsListGroup(null)}
                  className="cursor-pointer shrink-0 font-pixeloid-sans text-xs text-white/40 hover:text-white/70"
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto [scrollbar-width:thin]">
                {scrollsListGroup.scrolls.filter(s => !s.hidden).length === 0 ? (
                  <p className="py-4 text-center font-pixeloid-sans text-sm text-white/40">
                    No scrolls in this group yet.
                  </p>
                ) : (
                  scrollsListGroup.scrolls
                    .filter(s => !s.hidden)
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map(scroll => {
                      const style = SCROLL_STYLES[scroll.type]
                      const isExtended = scroll.type === 'extended'
                      return (
                        <div
                          key={scroll.id}
                          className="flex items-center gap-2 rounded border-2 bg-[#120413] px-3 py-2"
                          style={{ borderColor: style.stroke }}
                        >
                          <span
                            className="min-w-0 flex-1 truncate font-exe-pixel text-xl"
                            style={{ color: style.fill }}
                          >
                            {isExtended && '★ '}
                            {style.label}
                            {isExtended && ' ★'}
                          </span>
                          <button
                            type="button"
                            title="Edit scroll"
                            onClick={() =>
                              setEditingScroll({ groupId: scrollsListGroup.id, scroll })
                            }
                            className="cursor-pointer shrink-0 rounded p-1 hover:opacity-80"
                            style={{ color: `${style.fill}99` }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            title="Delete scroll"
                            onClick={() => handleDeleteScroll(scrollsListGroup.id, scroll.id)}
                            className="cursor-pointer shrink-0 rounded p-1 text-red-400/70 hover:text-red-400"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>,
          homeBounds,
        )}

      {addOpen && pickGroupId && (
        <ScrollPopup
          screenBounds={homeBounds}
          categories={categories}
          onSave={handleAddScroll}
          onTemplateSaved={refresh}
          onClose={closeAdd}
        />
      )}

      {editingScroll && (
        <ScrollPopup
          screenBounds={homeBounds}
          existing={editingScroll.scroll}
          categories={categories}
          onSave={handleEditScroll}
          onTemplateSaved={refresh}
          onClose={() => setEditingScroll(null)}
        />
      )}

      {editingGroup && (
        <GroupPopup
          screenBounds={homeBounds}
          existing={editingGroup}
          onSave={handleSaveGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  )
}

function SeparateOverlay({
  group,
  openScrollIds,
  sensors,
  onToggleScroll,
  onQuest,
  onReorder,
}: {
  group: Group
  openScrollIds: string[]
  sensors: ReturnType<typeof useSensors>
  onToggleScroll: (id: string) => void
  onQuest: (questId: string, patch: QuestPatch) => void
  onReorder: (activeId: string, overId: string) => void
}) {
  const scrolls = group.scrolls
    .filter(s => !s.hidden)
    .slice()
    .sort((a, b) => a.order - b.order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  if (scrolls.length === 0) {
    return (
      <p className="px-1 py-1 font-pixeloid-sans text-xs text-white/30">Empty group</p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={scrolls.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {scrolls.map(scroll => (
          <SortableScrollFolder
            key={scroll.id}
            scroll={scroll}
            open={openScrollIds.includes(scroll.id)}
            onToggle={() => onToggleScroll(scroll.id)}
            onQuest={onQuest}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableScrollFolder({
  scroll,
  open,
  onToggle,
  onQuest,
}: {
  scroll: Scroll
  open: boolean
  onToggle: () => void
  onQuest: (questId: string, patch: QuestPatch) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scroll.id,
  })
  const style = SCROLL_STYLES[scroll.type] ?? SCROLL_STYLES.easy
  const done = scroll.quests.filter(q => q.completed).length
  const total = scroll.quests.length

  return (
    <div
      ref={setNodeRef}
      className="mb-1"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-1 rounded px-1.5 py-1.5 hover:bg-white/5">
        <button
          type="button"
          className="cursor-grab touch-none text-white/30 hover:text-white/60"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <DragHandle className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="cursor-pointer flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="w-4 font-pixeloid-sans text-sm text-white/40">
            {open ? '▾' : '▸'}
          </span>
          <span className="truncate font-exe-pixel text-lg" style={{ color: style.fill }}>
            {style.label.replace(' Quest Scroll', '')}
          </span>
          <span className="ml-auto font-pixeloid-sans text-sm text-white/40">
            {done}/{total}
          </span>
        </button>
      </div>

      {open && (
        <div className="ml-3.5 flex flex-col gap-1 py-1">
          {scroll.quests
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(q => (
              <QuestRow
                key={q.id}
                quest={q}
                accent={style.fill}
                onChange={patch => onQuest(q.id, patch)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function CategorizedOverlay({
  group,
  categories,
  detail,
  openSectionIds,
  sensors,
  onToggleSection,
  onQuest,
  onReorderSections,
}: {
  group: Group
  categories: Category[]
  detail: boolean
  openSectionIds: string[]
  sensors: ReturnType<typeof useSensors>
  onToggleSection: (sectionId: string) => void
  onQuest: (questId: string, patch: QuestPatch) => void
  onReorderSections: (order: string[]) => void
}) {
  const allQuests = useMemo(() => group.scrolls.flatMap(s => s.quests), [group.scrolls])

  const sections = useMemo(() => {
    if (detail) {
      return categories.flatMap((cat, ci) =>
        cat.subCategories.map((sub, si) => ({
          id: sub.id,
          label: sub.label,
          colorIndex: ci * 10 + si,
          quests: allQuests.filter(q => q.subCategoryId === sub.id),
        })),
      )
    }
    return categories.map((cat, i) => ({
      id: cat.id,
      label: cat.label,
      colorIndex: i,
      quests: allQuests.filter(q => q.categoryId === cat.id),
    }))
  }, [allQuests, categories, detail])

  const defaultOrder = sections.map(s => s.id)
  const [order, setOrder] = useState(() =>
    mergeOrderedIds(
      detail ? loadSubOrder(group.id, defaultOrder) : loadCatOrder(group.id, defaultOrder),
      defaultOrder,
    ),
  )

  useEffect(() => {
    const defaults = (
      detail
        ? categories.flatMap(c => c.subCategories.map(s => s.id))
        : categories.map(c => c.id)
    )
    setOrder(
      mergeOrderedIds(
        detail ? loadSubOrder(group.id, defaults) : loadCatOrder(group.id, defaults),
        defaults,
      ),
    )
  }, [group.id, detail, categories])

  const ordered = order
    .map(id => sections.find(s => s.id === id))
    .filter(Boolean) as typeof sections

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = order.indexOf(String(active.id))
    const newIdx = order.indexOf(String(over.id))
    if (oldIdx < 0 || newIdx < 0) return
    const next = arrayMove(order, oldIdx, newIdx)
    setOrder(next)
    onReorderSections(next)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {ordered.map(section => {
          const key = sectionStorageKey(group.id, section.id)
          const open = openSectionIds.includes(key)
          const accent =
            CATEGORY_COLORS[section.colorIndex % CATEGORY_COLORS.length]?.fill ?? '#FCFC40'
          return (
            <SortableSection
              key={section.id}
              id={section.id}
              label={section.label}
              accent={accent}
              open={open}
              quests={section.quests}
              onToggle={() => onToggleSection(section.id)}
              onQuest={onQuest}
            />
          )
        })}
      </SortableContext>
    </DndContext>
  )
}

function SortableSection({
  id,
  label,
  accent,
  open,
  quests,
  onToggle,
  onQuest,
}: {
  id: string
  label: string
  accent: string
  open: boolean
  quests: Quest[]
  onToggle: () => void
  onQuest: (questId: string, patch: QuestPatch) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const done = quests.filter(q => q.completed).length

  return (
    <div
      ref={setNodeRef}
      className="mb-1"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-1 rounded px-1.5 py-1.5 hover:bg-white/5">
        <button
          type="button"
          className="cursor-grab touch-none text-white/30 hover:text-white/60"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <DragHandle className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="cursor-pointer flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="w-4 font-pixeloid-sans text-sm text-white/40">
            {open ? '▾' : '▸'}
          </span>
          <span className="truncate font-exe-pixel text-base" style={{ color: accent }}>
            {label}
          </span>
          <span className="ml-auto font-pixeloid-sans text-sm text-white/40">
            {done}/{quests.length}
          </span>
        </button>
      </div>

      {open && (
        <div className="ml-3.5 flex flex-col gap-1 py-1">
          {quests.length === 0 ? (
            <p className="px-1 font-pixeloid-sans text-xs text-white/25">No tasks</p>
          ) : (
            quests
              .slice()
              .sort((a, b) => a.order - b.order)
              .map(q => (
                <QuestRow
                  key={q.id}
                  quest={q}
                  accent={accent}
                  onChange={patch => onQuest(q.id, patch)}
                />
              ))
          )}
        </div>
      )}
    </div>
  )
}

function QuestRow({
  quest,
  accent,
  onChange,
}: {
  quest: Quest
  accent: string
  onChange: (patch: QuestPatch) => void
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${
        quest.completed ? 'opacity-50' : ''
      }`}
    >
      <button
        type="button"
        title={quest.completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={() =>
          onChange({
            completed: !quest.completed,
            counter: !quest.completed ? quest.amount : Math.min(quest.counter, quest.amount - 1),
          })
        }
        className="cursor-pointer flex size-4 shrink-0 items-center justify-center rounded-sm border"
        style={{
          borderColor: accent,
          background: quest.completed ? accent : 'transparent',
          color: '#120413',
          fontSize: 10,
        }}
      >
        {quest.completed ? '✓' : ''}
      </button>

      {quest.objectiveIcon && (
        <img
          src={quest.objectiveIcon}
          alt=""
          className="size-4 shrink-0 object-contain pixelated"
          onError={e => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )}

      <span
        className={`min-w-0 flex-1 truncate font-pixeloid-sans text-xs ${
          quest.completed ? 'line-through text-white/40' : 'text-white/85'
        }`}
        title={questLabel(quest)}
      >
        {questLabel(quest)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="cursor-pointer px-1 font-pixeloid-sans text-sm text-white/45 hover:text-white"
          onClick={() => onChange({ counter: Math.max(0, quest.counter - 1) })}
        >
          −
        </button>
        <span
          className="min-w-[2.6rem] text-center font-pixeloid-sans text-xs"
          style={{ color: accent }}
        >
          {quest.counter}/{quest.amount}
        </span>
        <button
          type="button"
          className="cursor-pointer px-1 font-pixeloid-sans text-sm text-white/45 hover:text-white"
          onClick={() => onChange({ counter: Math.min(quest.amount, quest.counter + 1) })}
        >
          +
        </button>
      </div>
    </div>
  )
}
