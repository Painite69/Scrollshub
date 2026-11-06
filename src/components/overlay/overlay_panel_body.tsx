import { useCallback, useEffect, useState } from 'react'
import type { Group, Quest, Scroll } from '../../types/types'
import { SCROLL_STYLES } from '../../types/types'
import { loadCategories, loadGroups, saveGroups } from '../../types/storage'
import type { OverlaySettings } from '../../types/overlay_settings'
import ScrollPopup from '../scroll_popup'
import GroupPopup from '../group_popup'
import { EditIcon, PlusIcon } from '../icons'

type Props = {
  settings: OverlaySettings
  onSettingsChange: (patch: Partial<OverlaySettings>) => void
  /** External trigger (control rail + button). */
  addScrollRequest?: number
  onAddFlowChange?: (active: boolean) => void
}

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

export default function OverlayPanelBody({
  settings,
  onSettingsChange,
  addScrollRequest = 0,
  onAddFlowChange,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups())
  const [addOpen, setAddOpen] = useState(false)
  const [pickGroupId, setPickGroupId] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const categories = loadCategories()

  const refresh = useCallback(() => {
    setGroups(loadGroups())
  }, [])

  useEffect(() => {
    refresh()
    function onStorage(e: StorageEvent) {
      if (e.key?.startsWith('questhub_')) refresh()
    }
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(refresh, 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(id)
    }
  }, [refresh])

  useEffect(() => {
    onAddFlowChange?.(addOpen)
  }, [addOpen, onAddFlowChange])

  useEffect(() => {
    if (addScrollRequest <= 0) return
    beginAddScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addScrollRequest])

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

  function handleSaveGroup(group: Group) {
    const next = loadGroups()
    const updated = next.some(g => g.id === group.id)
      ? next.map(g => (g.id === group.id ? group : g))
      : [...next, group]
    setGroups(saveGroups(updated))
    setEditingGroup(null)
  }

  function handleAddScroll(scroll: Scroll) {
    const targetId = pickGroupId ?? loadGroups().sort((a, b) => a.order - b.order)[0]?.id
    if (!targetId) return
    const next = loadGroups().map(g => {
      if (g.id !== targetId) return g
      return {
        ...g,
        scrolls: [...g.scrolls, { ...scroll, order: g.scrolls.length }],
      }
    })
    setGroups(saveGroups(next))
    closeAdd()
    const groupIds =
      settings.openGroupIds.length === 0
        ? next.map(g => g.id)
        : settings.openGroupIds.includes(targetId)
          ? settings.openGroupIds
          : [...settings.openGroupIds, targetId]
    onSettingsChange({
      openGroupIds: groupIds,
      openScrollIds: settings.openScrollIds.includes(scroll.id)
        ? settings.openScrollIds
        : [...settings.openScrollIds, scroll.id],
    })
  }

  function updateQuest(
    groupId: string,
    scrollId: string,
    questId: string,
    patch: Partial<Pick<Quest, 'counter' | 'completed'>>,
  ) {
    const next = groups.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        scrolls: g.scrolls.map(s => {
          if (s.id !== scrollId) return s
          return {
            ...s,
            quests: s.quests.map(q => {
              if (q.id !== questId) return q
              const merged = { ...q, ...patch }
              if (patch.counter != null) {
                merged.completed = merged.counter >= merged.amount
              }
              return merged
            }),
          }
        }),
      }
    })
    setGroups(saveGroups(next))
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

  function toggleGroup(id: string) {
    const allIds = visible.map(g => g.id)
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
                <button
                  type="button"
                  title="Edit group"
                  onClick={() => setEditingGroup(group)}
                  className="cursor-pointer ml-auto shrink-0 rounded p-1 text-white/35 hover:bg-white/10 hover:text-[#FCFC40]"
                >
                  <EditIcon />
                </button>
              </div>

              {open && (
                <div className="ml-2.5 border-l border-white/10 pl-2">
                  {group.scrolls.map(scroll => (
                    <ScrollFolder
                      key={scroll.id}
                      scroll={scroll}
                      open={settings.openScrollIds.includes(scroll.id)}
                      onToggle={() => toggleScroll(scroll.id)}
                      onQuest={(questId, patch) =>
                        updateQuest(group.id, scroll.id, questId, patch)
                      }
                    />
                  ))}
                  {group.scrolls.length === 0 && (
                    <p className="px-1 py-1 font-pixeloid-sans text-xs text-white/30">
                      Empty group
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contained to the panel only — never fixed across the Electron glass */}
      {needsGroupPick && (
        <div
          className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 p-3"
          data-questhub-overlay-hit=""
        >
          <div
            className="flex w-full max-w-[320px] flex-col gap-3 rounded border-2 border-[#190A21] bg-[#120413] p-4"
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
        </div>
      )}

      {addOpen && pickGroupId && (
        <ScrollPopup
          contained
          categories={categories}
          onSave={handleAddScroll}
          onTemplateSaved={refresh}
          onClose={closeAdd}
        />
      )}

      {editingGroup && (
        <GroupPopup
          contained
          existing={editingGroup}
          onSave={handleSaveGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  )
}

function ScrollFolder({
  scroll,
  open,
  onToggle,
  onQuest,
}: {
  scroll: Scroll
  open: boolean
  onToggle: () => void
  onQuest: (questId: string, patch: Partial<Pick<Quest, 'counter' | 'completed'>>) => void
}) {
  const style = SCROLL_STYLES[scroll.type] ?? SCROLL_STYLES.easy
  const done = scroll.quests.filter(q => q.completed).length
  const total = scroll.quests.length

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-white/5"
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

      {open && (
        <div className="ml-3.5 flex flex-col gap-1 py-1">
          {scroll.quests
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(q => (
              <QuestRow key={q.id} quest={q} accent={style.fill} onChange={patch => onQuest(q.id, patch)} />
            ))}
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
  onChange: (patch: Partial<Pick<Quest, 'counter' | 'completed'>>) => void
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
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
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
        <span className="min-w-[2.6rem] text-center font-pixeloid-sans text-xs" style={{ color: accent }}>
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
