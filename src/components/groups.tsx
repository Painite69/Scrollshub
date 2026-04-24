import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Group } from '../types/types'
import { loadGroups, saveGroups, deleteGroup } from '../types/storage'
import GroupPopup from './group_popup'
import Scrolls from './scrolls'
import { DragHandle, EditIconGroup, DeleteIconGroup } from './icons'

// ── Sortable group card ────────────────────────────────────────────────────────

function GroupCard({
  group,
  onEdit,
  onDelete,
  onUpdate,
}: {
  group: Group
  onEdit: (g: Group) => void
  onDelete: (id: string) => void
  onUpdate: (g: Group) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 p-4 bg-white/40 hover:bg-white/50 rounded"
    >
      {/* Group header row */}
      <div className="flex items-center gap-3 group/group">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-black active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <DragHandle />
        </button>

        <div className="flex flex-1 flex-col">
          <span className="font-exe-pixel text-2xl sm:text-4xl">{group.name}</span>
        </div>



        <button
          onClick={() => onEdit(group)}
          className="cursor-pointer rounded p-1 text-gray-700 hover:text-black sm:opacity-0 group-hover/group:opacity-100 transition-opacity"
          aria-label="Edit group"
        >
          <EditIconGroup />
        </button>
        <button
          onClick={() => onDelete(group.id)}
          className="cursor-pointer rounded p-1 text-red-500 hover:text-red-700 sm:opacity-0 group-hover/group:opacity-100 transition-opacity"
          aria-label="Delete group"
        >
          <DeleteIconGroup />
        </button>
      </div>

      {/* Scrolls section */}
      <Scrolls group={group} onGroupUpdate={onUpdate} />
    </div>
  )
}

// ── Main Groups component ──────────────────────────────────────────────────────

function Groups() {
  const [groups, setGroups] = useState<Group[]>(() =>
    loadGroups().sort((a, b) => a.order - b.order)
  )
  const [popupOpen, setPopupOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined)

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groups.findIndex(g => g.id === active.id)
    const newIndex = groups.findIndex(g => g.id === over.id)
    const reordered = arrayMove(groups, oldIndex, newIndex).map((g, i) => ({
      ...g,
      order: i,
    }))
    setGroups(reordered)
    saveGroups(reordered)
  }

  function handleSave(group: Group) {
    const updated = groups.some(g => g.id === group.id)
      ? groups.map(g => (g.id === group.id ? group : g))
      : [...groups, { ...group, order: groups.length }]
    setGroups(updated)
    saveGroups(updated)
  }

  function handleDelete(groupId: string) {
    deleteGroup(groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  function openCreate() {
    setEditingGroup(undefined)
    setPopupOpen(true)
  }

  function openEdit(group: Group) {
    setEditingGroup(group)
    setPopupOpen(true)
  }

  return (
    <>
      {groups.length === 0 ? (
        // ── Empty state ────────────────────────────────────────────────────
        <div className="flex w-full items-center justify-center p-6">
          <button
            onClick={openCreate}
            className="hover:scale-110 cursor-pointer ml-4 rounded border-2 border-dashed border-[#190A21] bg-[#120413] text-white/80 hover:text-white/60 px-4 py-2 font-exe-pixel"
          >
            + Add Group
          </button>
        </div>
      ) : (
        // ── Groups list ────────────────────────────────────────────────────
        <div className="flex flex-col gap-4 p-3 sm:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groups.map(g => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {groups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onUpdate={handleSave}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="flex w-full items-center justify-center p-6">
            <button
              onClick={openCreate}
              className="hover:scale-110 cursor-pointer ml-4 rounded border-2 border-dashed border-[#190A21] bg-[#120413] text-white/80 px-4 py-2 font-exe-pixel"
            >
              + Add Group
            </button>
          </div>
        </div>
      )}

      {popupOpen && (
        <GroupPopup
          existing={editingGroup}
          onSave={handleSave}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  )
}

export default Groups
