import { useState } from 'react'
import type { Group, DisplayMode } from '../types/types'

interface Props {
  existing?: Group
  onSave: (group: Group) => void
  onClose: () => void
}

const DISPLAY_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'separate', label: 'Separate', desc: 'Each scroll has its own block' },
  { value: 'categorized', label: 'Categorized', desc: 'Clues grouped in main category' },
  { value: 'categorized-detail', label: 'Categorized Detail', desc: 'Clues grouped in more categories' },
]

function GroupPopup({ existing, onSave, onClose }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [display, setDisplay] = useState<DisplayMode>(existing?.display ?? 'separate')

  const isEdit = !!existing

  function handleSave() {
    if (!name.trim()) return
    const group: Group = existing
      ? { ...existing, name: name.trim(), display }
      : {
          id: crypto.randomUUID(),
          name: name.trim(),
          icon: { source: 'custom', value: '' },
          display,
          scrolls: [],
          order: Date.now(),
        }
    onSave(group)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-white/80 font-exe-pixel">
      <div className="flex flex-col gap-4 rounded border-2 border-[#190A21] bg-[#120413] p-6">
        <h2 className="font-exe-pixel text-4xl">{isEdit ? 'Edit Group' : 'New Group'}</h2>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-2xl">Group Name</label>
          <input
            className="rounded border text-2xl border-[#4B3B58] bg-[#1E0A2E] px-2 py-1 "
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Daily Quests"
            maxLength={32}
          />
        </div>

        {/* Display mode */}
        <div className="flex flex-col gap-1">
          <label className="text-2xl">Display</label>
          {DISPLAY_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="display"
                value={opt.value}
                checked={display === opt.value}
                onChange={() => setDisplay(opt.value)}
                className="mt-2"
              />
              <span className=" text-lg">
                <span className="text-2xl">{opt.label}</span> — {opt.desc}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer rounded w-20 bg-black/50 px-3 py-1 text-2xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="cursor-pointer rounded w-20 bg-purple-800 px-3 py-1  text-2xl text-white disabled:opacity-40"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupPopup
