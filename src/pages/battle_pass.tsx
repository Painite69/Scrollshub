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
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BPSectionId, BPWeek, BPQuest, BPStageStep, BPGoal, BPDaily } from '../types/battle_pass'
import { BP_WEEK_COLORS } from '../types/battle_pass'
import {
  loadBPSectionOrder, saveBPSectionOrder,
  loadBPWeeks, saveBPWeeks,
  loadBPGoals, saveBPGoals,
  loadBPDailies, saveBPDailies,
} from '../types/storage'
import { BP_WEEKS, BP_GOALS } from '../bp_data'
import { DragHandle, DeleteIcon, EditIcon } from '../components/icons'
import { QuestEditPopup, DailyQuestPopup } from '../components/scroll_popup'
import { loadCategories } from '../types/storage'

// ── Progress hydration ────────────────────────────────────────────────────────
// Merge static definitions with any saved progress.
// If nothing is saved yet, the static defaults (counter:0, completed:false) are used.

function hydrateWeeks(saved: BPWeek[]): BPWeek[] {
  if (saved.length === 0) return BP_WEEKS

  const savedMap = new Map(saved.map(w => [w.weekNumber, w]))

  return BP_WEEKS.map(staticWeek => {
    const savedWeek = savedMap.get(staticWeek.weekNumber)
    if (!savedWeek) return staticWeek

    const savedQuestMap = new Map(savedWeek.quests.map(q => [q.id, q]))

    return {
      ...staticWeek,
      quests: staticWeek.quests.map(staticQ => {
        const savedQ = savedQuestMap.get(staticQ.id)
        if (!savedQ) return staticQ

        if (staticQ.stages === null) {
          // Standard quest — restore counter + completed
          return { ...staticQ, counter: savedQ.counter, completed: savedQ.completed }
        } else {
          // Stage quest — restore per-step progress
          const savedStepMap = new Map((savedQ.stages ?? []).map((s: BPStageStep) => [s.id, s]))
          const hydratedStages = staticQ.stages.map(step => {
            const saved = savedStepMap.get(step.id)
            return saved ? { ...step, counter: saved.counter, completed: saved.completed } : step
          })
          const allDone = hydratedStages.every(s => s.completed)
          return { ...staticQ, stages: hydratedStages, completed: allDone, counter: savedQ.counter }
        }
      }),
    }
  })
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function BPCheckbox({ checked, onChange, accentColor }: {
  checked: boolean
  onChange: () => void
  accentColor: string
}) {
  return (
    <button
      onClick={onChange}
      className="shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors cursor-pointer"
      style={{ borderColor: accentColor, backgroundColor: checked ? accentColor : 'transparent' }}
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

// ── Counter control ───────────────────────────────────────────────────────────

function CounterControl({ value, max, onChange, textColor }: {
  value: number
  max: number
  onChange: (v: number) => void
  textColor: string
}) {
  function set(v: number) {
    onChange(Math.max(0, Math.min(v, max)))
  }

  return (
    <div className="flex items-end shrink-0 group/counter">
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => set(parseInt(e.target.value) || 0)}
        className="w-10 bg-transparent text-right font-pixeloid-sans text-xs border-b focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ color: textColor, borderColor: textColor + '40' }}
      />
      <div className="flex flex-col ml-0.5 opacity-0 group-hover/counter:opacity-80 transition-opacity">
        <button onClick={() => set(value + 1)} className="cursor-pointer leading-none" style={{ color: textColor }}>
          <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
        </button>
        <button onClick={() => set(value - 1)} className="cursor-pointer leading-none mt-0.5" style={{ color: textColor }}>
          <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
        </button>
      </div>
    </div>
  )
}

// ── Standard quest row ────────────────────────────────────────────────────────

function StandardQuestRow({ quest, accentColor, onUpdate }: {
  quest: BPQuest
  accentColor: string
  onUpdate: (q: BPQuest) => void
}) {
  const textColor = '#A9A1A8'
  const done = quest.completed

  function handleCounterChange(v: number) {
    onUpdate({ ...quest, counter: v, completed: v >= quest.amount })
  }

  function handleCheckbox() {
    const completed = !quest.completed
    onUpdate({ ...quest, completed, counter: completed ? quest.amount : 0 })
  }

  return (
    <div className="flex items-end gap-2">
      {/* Icon */}
      <img src={quest.icon} alt="" className="w-8 h-8 object-contain shrink-0 pixelated"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      {/* Title + task row */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-pixeloid-sans text-xs" style={{ color: accentColor }}>
          {quest.title}
        </span>
        <div className="flex items-end gap-1.5">
          <span
            className="font-pixeloid-sans text-xs"
            style={{ color: textColor, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.45 : 1 }}
          >
            * {quest.text}
          </span>
          <CounterControl value={quest.counter} max={quest.amount} onChange={handleCounterChange} textColor={textColor} />
        </div>
      </div>
      {/* Checkbox aligned to bottom */}
      <BPCheckbox checked={done} onChange={handleCheckbox} accentColor={accentColor} />
    </div>
  )
}

// ── Stage quest row ───────────────────────────────────────────────────────────

function StageQuestRow({ quest, accentColor, onUpdate }: {
  quest: BPQuest
  accentColor: string
  onUpdate: (q: BPQuest) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const textColor = '#A9A1A8'
  const done = quest.completed

  function handleStepCounterChange(stepId: string, v: number) {
    const stages = (quest.stages ?? []).map(s =>
      s.id === stepId ? { ...s, counter: v, completed: v >= s.amount } : s
    )
    const allDone = stages.every(s => s.completed)
    onUpdate({ ...quest, stages, completed: allDone })
  }

  function handleStepCheckbox(stepId: string) {
    const stages = (quest.stages ?? []).map(s => {
      if (s.id !== stepId) return s
      const completed = !s.completed
      return { ...s, completed, counter: completed ? s.amount : 0 }
    })
    const allDone = stages.every(s => s.completed)
    onUpdate({ ...quest, stages, completed: allDone })
  }

  function handleParentCheckbox() {
    const completing = !done
    const stages = (quest.stages ?? []).map(s => ({
      ...s,
      completed: completing,
      counter: completing ? s.amount : 0,
    }))
    onUpdate({ ...quest, stages, completed: completing })
  }

  const stagesCompleted = (quest.stages ?? []).filter(s => s.completed).length
  const stagesTotal = (quest.stages ?? []).length

  return (
    <div className="flex flex-col gap-1">
      {/* Header: icon | title + collapsible text row | checkbox */}
      <div className="flex items-end gap-2">
        <img src={quest.icon} alt="" className="w-8 h-8 object-contain shrink-0 pixelated"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-pixeloid-sans text-xs" style={{ color: accentColor }}>
            {quest.title}
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="cursor-pointer flex items-center gap-1 text-left"
          >
            <span
              className="font-pixeloid-sans text-xs"
              style={{ color: textColor, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.45 : 1 }}
            >
              * {quest.text}
            </span>
            <span className="font-pixeloid-sans text-xs ml-1" style={{ color: accentColor }}>
              {stagesCompleted}/{stagesTotal}
            </span>
            <svg
              width="8" height="6" viewBox="0 0 8 6" fill="currentColor"
              style={{ color: accentColor, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
            >
              <polygon points="4,6 0,0 8,0" />
            </svg>
          </button>
        </div>
        {/* Checkbox aligned to bottom */}
        <BPCheckbox checked={done} onChange={handleParentCheckbox} accentColor={accentColor} />
      </div>
      {/* Stage steps — collapsible */}
      {expanded && (
        <div className="flex flex-col gap-1 ml-10">
          {(quest.stages ?? []).map(step => (
            <div key={step.id} className="flex items-end gap-1.5 group/row">
              <img src={step.icon} alt="" className="w-4 h-4 object-contain shrink-0 pixelated"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span
                className="font-pixeloid-sans text-xs"
                style={{ color: textColor, textDecoration: step.completed ? 'line-through' : 'none', opacity: step.completed ? 0.45 : 1 }}
              >
                * {step.text}:
              </span>
              <CounterControl value={step.counter} max={step.amount} onChange={v => handleStepCounterChange(step.id, v)} textColor={textColor} />
              <span className="flex-1" />
              <BPCheckbox checked={step.completed} onChange={() => handleStepCheckbox(step.id)} accentColor={accentColor} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Week card ─────────────────────────────────────────────────────────────────

function WeekCard({ week, onUpdate }: {
  week: BPWeek
  onUpdate: (w: BPWeek) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const colors = BP_WEEK_COLORS[(week.weekNumber - 1) % BP_WEEK_COLORS.length]

  const total = week.quests.length
  const completed = week.quests.filter(q => q.completed).length

  const freeQuests = week.quests.filter(q => !q.isPremium)
  const premiumQuests = week.quests.filter(q => q.isPremium)

  function updateQuest(updated: BPQuest) {
    onUpdate({ ...week, quests: week.quests.map(q => q.id === updated.id ? updated : q) })
  }

  function renderQuest(q: BPQuest) {
    return q.stages === null
      ? <StandardQuestRow key={q.id} quest={q} accentColor={colors.fill} onUpdate={updateQuest} />
      : <StageQuestRow key={q.id} quest={q} accentColor={colors.fill} onUpdate={updateQuest} />
  }

  return (
    <div
      className="flex flex-col rounded border-2 bg-[#120413] self-start"
      style={{ borderColor: colors.stroke }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="cursor-pointer flex items-center justify-between px-3 py-2 w-full"
      >
        <span className="font-exe-pixel text-2xl" style={{ color: colors.fill }}>
          Week: {week.weekNumber}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-pixeloid-sans text-xs" style={{ color: colors.fill }}>
            {completed}/{total}
          </span>
          <svg
            width="10" height="7" viewBox="0 0 10 7" fill="currentColor"
            style={{ color: colors.fill, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          >
            <polygon points="5,7 0,0 10,0" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
          {freeQuests.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-pixeloid-sans text-xs text-white/40">Free:</span>
              {freeQuests.map(renderQuest)}
            </div>
          )}
          {premiumQuests.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-pixeloid-sans text-xs text-white/40">Premium:</span>
              {premiumQuests.map(renderQuest)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Quests section ────────────────────────────────────────────────────────────

function BPQuestsSection() {
  const [weeks, setWeeks] = useState<BPWeek[]>(() =>
    hydrateWeeks(loadBPWeeks())
  )

  function updateWeek(updated: BPWeek) {
    const next = weeks.map(w => w.weekNumber === updated.weekNumber ? updated : w)
    setWeeks(next)
    saveBPWeeks(next)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {weeks.map(week => (
        <WeekCard key={week.weekNumber} week={week} onUpdate={updateWeek} />
      ))}
    </div>
  )
}

// ── Goals hydration ───────────────────────────────────────────────────────────

function hydrateGoals(saved: BPGoal[]): BPGoal[] {
  if (saved.length === 0) return BP_GOALS

  const savedMap = new Map(saved.map(g => [g.id, g]))

  return BP_GOALS.map(staticGoal => {
    const savedGoal = savedMap.get(staticGoal.id)
    if (!savedGoal) return staticGoal

    if (staticGoal.stages === null) {
      return { ...staticGoal, counter: savedGoal.counter, completed: savedGoal.completed }
    } else {
      const savedStepMap = new Map((savedGoal.stages ?? []).map((s: BPStageStep) => [s.id, s]))
      const hydratedStages = staticGoal.stages.map(step => {
        const saved = savedStepMap.get(step.id)
        return saved ? { ...step, counter: saved.counter, completed: saved.completed } : step
      })
      const allDone = hydratedStages.every(s => s.completed)
      return { ...staticGoal, stages: hydratedStages, completed: allDone }
    }
  })
}

// ── Standard goal card ────────────────────────────────────────────────────────

function StandardGoalCard({ goal, index, onUpdate }: {
  goal: BPGoal
  index: number
  onUpdate: (g: BPGoal) => void
}) {
  const colors = BP_WEEK_COLORS[index % BP_WEEK_COLORS.length]
  const textColor = '#A9A1A8'
  const done = goal.completed

  function handleCounterChange(v: number) {
    onUpdate({ ...goal, counter: v, completed: v >= goal.amount })
  }

  function handleCheckbox() {
    const completed = !goal.completed
    onUpdate({ ...goal, completed, counter: completed ? goal.amount : 0 })
  }

  return (
    <div className="flex flex-col gap-1 rounded border-2 bg-[#120413] p-3 self-start" style={{ borderColor: colors.stroke }}>
      {/* Goal N — top of card, full width */}
      <span className="font-pixeloid-sans text-xs" style={{ color: colors.fill }}>Goal {index + 1}</span>
      {/* Icon | title above text */}
      <div className="flex items-end gap-2">
        {goal.icon && (
          <img src={goal.icon} alt="" className="w-8 h-8 object-contain shrink-0 pixelated"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-pixeloid-sans text-xs font-bold" style={{ color: colors.fill }}>{goal.title}</span>
          <div className="flex items-end gap-1.5">
            <span
              className="font-pixeloid-sans text-xs"
              style={{ color: textColor, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.45 : 1 }}
            >
              {goal.text}
            </span>
            <CounterControl value={goal.counter} max={goal.amount} onChange={handleCounterChange} textColor={textColor} />
          </div>
        </div>
        <BPCheckbox checked={done} onChange={handleCheckbox} accentColor={colors.fill} />
      </div>
    </div>
  )
}

// ── Stage goal card ───────────────────────────────────────────────────────────

function StageGoalCard({ goal, index, onUpdate }: {
  goal: BPGoal
  index: number
  onUpdate: (g: BPGoal) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const colors = BP_WEEK_COLORS[index % BP_WEEK_COLORS.length]
  const textColor = '#A9A1A8'
  const done = goal.completed

  function handleStepCounterChange(stepId: string, v: number) {
    const stages = (goal.stages ?? []).map(s =>
      s.id === stepId ? { ...s, counter: v, completed: v >= s.amount } : s
    )
    const allDone = stages.every(s => s.completed)
    onUpdate({ ...goal, stages, completed: allDone })
  }

  function handleStepCheckbox(stepId: string) {
    const stages = (goal.stages ?? []).map(s => {
      if (s.id !== stepId) return s
      const completed = !s.completed
      return { ...s, completed, counter: completed ? s.amount : 0 }
    })
    const allDone = stages.every(s => s.completed)
    onUpdate({ ...goal, stages, completed: allDone })
  }

  function handleParentCheckbox() {
    const completing = !done
    const stages = (goal.stages ?? []).map(s => ({
      ...s,
      completed: completing,
      counter: completing ? s.amount : 0,
    }))
    onUpdate({ ...goal, stages, completed: completing })
  }

  const stagesCompleted = (goal.stages ?? []).filter(s => s.completed).length
  const stagesTotal = (goal.stages ?? []).length

  return (
    <div className="flex flex-col gap-1 rounded border-2 bg-[#120413] p-3 self-start" style={{ borderColor: colors.stroke }}>
      {/* Goal N — top of card, full width */}
      <span className="font-pixeloid-sans text-xs" style={{ color: colors.fill }}>Goal {index + 1}</span>
      {/* Icon | title above text+toggle */}
      <div className="flex items-end gap-2">
        {goal.icon && (
          <img src={goal.icon} alt="" className="w-8 h-8 object-contain shrink-0 pixelated"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-pixeloid-sans text-xs font-bold" style={{ color: colors.fill }}>{goal.title}</span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="cursor-pointer flex items-center gap-1 text-left"
          >
            <span
              className="font-pixeloid-sans text-xs"
              style={{ color: textColor, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.45 : 1 }}
            >
              {goal.text}
            </span>
            <span className="font-pixeloid-sans text-xs ml-1" style={{ color: colors.fill }}>
              {stagesCompleted}/{stagesTotal}
            </span>
            <svg
              width="8" height="6" viewBox="0 0 8 6" fill="currentColor"
              style={{ color: colors.fill, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
            >
              <polygon points="4,6 0,0 8,0" />
            </svg>
          </button>
        </div>
        <BPCheckbox checked={done} onChange={handleParentCheckbox} accentColor={colors.fill} />
      </div>
      {/* Stage steps — collapsible */}
      {expanded && (
        <div className="flex flex-col gap-1 mt-1">
          {(goal.stages ?? []).map(step => (
            <div key={step.id} className="flex items-end gap-1.5 group/row">
              <img src={step.icon} alt="" className="w-4 h-4 object-contain shrink-0 pixelated"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span
                className="font-pixeloid-sans text-xs"
                style={{ color: textColor, textDecoration: step.completed ? 'line-through' : 'none', opacity: step.completed ? 0.45 : 1 }}
              >
                * {step.text}:
              </span>
              <CounterControl value={step.counter} max={step.amount} onChange={v => handleStepCounterChange(step.id, v)} textColor={textColor} />
              <span className="flex-1" />
              <BPCheckbox checked={step.completed} onChange={() => handleStepCheckbox(step.id)} accentColor={colors.fill} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Goals section ─────────────────────────────────────────────────────────────

function BPGoalsSection() {
  const [goals, setGoals] = useState<BPGoal[]>(() =>
    hydrateGoals(loadBPGoals())
  )

  function updateGoal(updated: BPGoal) {
    const next = goals.map(g => g.id === updated.id ? updated : g)
    setGoals(next)
    saveBPGoals(next)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {goals.map((goal, i) =>
        goal.stages === null
          ? <StandardGoalCard key={goal.id} goal={goal} index={i} onUpdate={updateGoal} />
          : <StageGoalCard key={goal.id} goal={goal} index={i} onUpdate={updateGoal} />
      )}
    </div>
  )
}

// ── Daily row ─────────────────────────────────────────────────────────────────

function DailyRow({ daily, subLabelMap, accentColor, textColor, onSetCounter, onToggle, onEdit, onDelete }: {
  daily: BPDaily
  subLabelMap: Record<string, string>
  accentColor: string
  textColor: string
  onSetCounter: (daily: BPDaily, val: number) => void
  onToggle: (daily: BPDaily) => void
  onEdit: (daily: BPDaily) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: daily.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const done = daily.completed
  const icon = daily.objectiveIcon ?? ''
  const subLabel = subLabelMap[daily.subCategoryId] ?? daily.subCategoryId

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center justify-between gap-2 group/row rounded border border-white/10 bg-[#120413] px-2 py-1.5"
    >
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
          * {subLabel} {daily.amount} {daily.objective}:
        </span>
        {/* Counter */}
        <div className="flex items-center shrink-0 group/counter">
          <input type="number" min={0} max={daily.amount} value={daily.counter}
            onChange={e => onSetCounter(daily, parseInt(e.target.value) || 0)}
            className="w-8 align-baseline bg-transparent text-right font-pixeloid-sans text-xs border-b focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: textColor, borderColor: textColor + '40' }}
          />
          <div className="flex flex-col ml-0.5 opacity-0 group-hover/counter:opacity-80 transition-opacity">
            <button onClick={() => onSetCounter(daily, daily.counter + 1)} className="cursor-pointer leading-none" style={{ color: textColor }}>
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,0 0,5 7,5" /></svg>
            </button>
            <button onClick={() => onSetCounter(daily, daily.counter - 1)} className="cursor-pointer leading-none mt-0.5" style={{ color: textColor }}>
              <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"><polygon points="3.5,5 0,0 7,0" /></svg>
            </button>
          </div>
        </div>
        {/* Edit / Delete — hover reveal */}
        <button onClick={() => onEdit(daily)}
          className="cursor-pointer sm:opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
          style={{ color: textColor + '80' }}>
          <EditIcon />
        </button>
        <button onClick={() => onDelete(daily.id)}
          className="cursor-pointer sm:opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0 text-red-400/60 hover:text-red-400">
          <DeleteIcon />
        </button>
      </div>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(daily)}
        className="shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors cursor-pointer"
        style={{ borderColor: accentColor, backgroundColor: done ? accentColor : 'transparent' }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#120413" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Dailies section ───────────────────────────────────────────────────────────

function BPDailiesSection() {
  const categories = loadCategories()
  const accentColor = '#FCFC40'
  const textColor = '#A9A1A8'

  const [dailies, setDailies] = useState<BPDaily[]>(() =>
    loadBPDailies().sort((a, b) => a.order - b.order)
  )
  const [addOpen, setAddOpen] = useState(false)
  const [editingDaily, setEditingDaily] = useState<BPDaily | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  function persist(next: BPDaily[]) {
    setDailies(next)
    saveBPDailies(next)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = dailies.findIndex(d => d.id === active.id)
    const newIdx = dailies.findIndex(d => d.id === over.id)
    persist(arrayMove(dailies, oldIdx, newIdx).map((d, i) => ({ ...d, order: i })))
  }

  function handleAdd(quests: BPDaily[]) {
    persist(quests.map((q, i) => ({ ...q, order: i })))
    setAddOpen(false)
  }

  function handleEdit(updated: BPDaily) {
    persist(dailies.map(d => d.id === updated.id ? updated : d))
    setEditingDaily(null)
  }

  function handleDelete(id: string) {
    persist(dailies.filter(d => d.id !== id).map((d, i) => ({ ...d, order: i })))
  }

  function setCounter(daily: BPDaily, val: number) {
    const counter = Math.max(0, Math.min(val, daily.amount))
    persist(dailies.map(d => d.id === daily.id ? { ...d, counter, completed: counter >= daily.amount } : d))
  }

  function toggleCompleted(daily: BPDaily) {
    const completed = !daily.completed
    persist(dailies.map(d => d.id === daily.id ? { ...d, completed, counter: completed ? daily.amount : 0 } : d))
  }

  const subLabelMap = Object.fromEntries(
    categories.flatMap(c => c.subCategories.map(s => [s.id, s.label]))
  )

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={dailies.map(d => d.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {dailies.map(daily => (
              <DailyRow
                key={daily.id}
                daily={daily}
                subLabelMap={subLabelMap}
                accentColor={accentColor}
                textColor={textColor}
                onSetCounter={setCounter}
                onToggle={toggleCompleted}
                onEdit={setEditingDaily}
                onDelete={handleDelete}
              />
            ))}
            {/* + Add Daily pill — lives in the grid alongside dailies */}
            <button
              onClick={() => setAddOpen(true)}
              className="cursor-pointer flex items-center justify-center rounded bg-[#120413] font-pixeloid-sans text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors py-1.5"
            >
              {dailies.length === 0 ? '+ Add Daily Quests' : '✎ Edit Daily Quests'}
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* Add/edit dailies popup — scroll-like multi-quest editor */}
      {addOpen && (
        <DailyQuestPopup
          categories={categories}
          existingQuests={dailies}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* Edit popup */}
      {editingDaily && (
        <QuestEditPopup
          quest={editingDaily}
          categories={categories}
          accentColor={accentColor}
          onSave={handleEdit}
          onClose={() => setEditingDaily(null)}
        />
      )}
    </div>
  )
}

// ── Section definitions ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<BPSectionId, string> = {
  quests:  'Quests',
  goals:   'Goals',
  dailies: 'Dailies',
}

// ── Sortable section card ─────────────────────────────────────────────────────

function SectionCard({ id }: { id: BPSectionId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-2 p-4  bg-black/20 hover:bg-black/30  rounded">
      <div className="flex items-center gap-3 group/section">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-white active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <DragHandle />
        </button>
        <span className="font-exe-pixel text-white text-2xl sm:text-4xl">{SECTION_LABELS[id]}</span>
      </div>

      <div className="ml-7">
        {id === 'quests' && <BPQuestsSection />}
        {id === 'goals' && <BPGoalsSection />}
        {id === 'dailies' && <BPDailiesSection />}
      </div>
    </div>
  )
}

// ── Main BattlePass page ──────────────────────────────────────────────────────

function BattlePass() {
  const [sectionOrder, setSectionOrder] = useState<BPSectionId[]>(() =>
    loadBPSectionOrder()
  )

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionOrder.indexOf(active.id as BPSectionId)
    const newIndex = sectionOrder.indexOf(over.id as BPSectionId)
    const reordered = arrayMove(sectionOrder, oldIndex, newIndex)
    setSectionOrder(reordered)
    saveBPSectionOrder(reordered)
  }

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map(id => (
            <SectionCard key={id} id={id} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default BattlePass
