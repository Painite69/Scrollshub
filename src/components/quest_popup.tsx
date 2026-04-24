import { useState } from 'react'
import type { Quest, Category } from '../types/types'

interface Props {
  existing?: Quest
  categories: Category[]
  onSave: (quest: Quest) => void
  onClose: () => void
}

function QuestPopup({ existing, categories, onSave, onClose }: Props) {
  const firstCat = categories[0]
  const firstSub = firstCat?.subCategories[0]

  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? firstCat?.id ?? '')
  const [subCategoryId, setSubCategoryId] = useState(existing?.subCategoryId ?? firstSub?.id ?? '')
  const [amount, setAmount] = useState(existing?.amount ?? 1)
  const [objective, setObjective] = useState(existing?.objective ?? '')

  const activeCat = categories.find(c => c.id === categoryId)

  function handleCategoryChange(id: string) {
    setCategoryId(id)
    const cat = categories.find(c => c.id === id)
    setSubCategoryId(cat?.subCategories[0]?.id ?? '')
  }

  function handleSave() {
    if (!objective.trim() || !categoryId || !subCategoryId) return
    const quest: Quest = existing
      ? { ...existing, categoryId, subCategoryId, amount, objective: objective.trim() }
      : {
          id: crypto.randomUUID(),
          categoryId,
          subCategoryId,
          amount,
          objective: objective.trim(),
          counter: 0,
          completed: false,
          objectiveId: 'custom',
          order: Date.now(),
        }
    onSave(quest) 
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col gap-4 rounded border-2 border-[#190A21] bg-[#120413] p-6 w-80">
        <h2 className="font-exe-pixel text-xl text-[#FCFC40]">
          {existing ? 'Edit Quest' : 'Add Quest'}
        </h2>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="font-pixeloid-sans text-xs text-white">Category</label>
          <select
            className="rounded border border-[#190A21] bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-sm text-white"
            value={categoryId}
            onChange={e => handleCategoryChange(e.target.value)}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sub-category */}
        <div className="flex flex-col gap-1">
          <label className="font-pixeloid-sans text-xs text-white">Action</label>
          <select
            className="rounded border border-[#190A21] bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-sm text-white"
            value={subCategoryId}
            onChange={e => setSubCategoryId(e.target.value)}
          >
            {activeCat?.subCategories.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className="font-pixeloid-sans text-xs text-white">Amount</label>
          <input
            type="number"
            min={1}
            className="rounded border border-[#190A21] bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-sm text-white"
            value={amount}
            onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        {/* Objective */}
        <div className="flex flex-col gap-1">
          <label className="font-pixeloid-sans text-xs text-white">Objective (mob / item)</label>
          <input
            className="rounded border border-[#190A21] bg-[#1e0a2e] px-2 py-1 font-pixeloid-sans text-sm text-white"
            value={objective}
            onChange={e => setObjective(e.target.value)}
            placeholder="e.g. Creepers"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer rounded border border-white/30 px-3 py-1 font-pixeloid-sans text-sm text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!objective.trim() || !categoryId || !subCategoryId}
            className="cursor-pointer rounded border border-[#FCFC40] bg-[#FCFC40]/10 px-3 py-1 font-pixeloid-sans text-sm text-[#FCFC40] disabled:opacity-40"
          >
            {existing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestPopup
