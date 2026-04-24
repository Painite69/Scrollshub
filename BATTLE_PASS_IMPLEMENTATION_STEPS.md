# Battle Pass Implementation Steps

This guide matches your current codebase and coding style.  
You will implement, and I will review after each attempt when you ask.

---

## 0) Current State (already done)

- `src/types.ts` already includes Battle Pass types (`BPWeek`, `BPQuest`, `BPGoal`, `BPItemProgress`, `BPDaily`, etc.).
- `src/storage.ts` already includes Battle Pass storage helpers:
  - `loadBPProgress` / `saveBPProgress`
  - `loadBPDailies` / `saveBPDailies`
  - `loadBPSectionOrder` / `saveBPSectionOrder`
- `src/pages/battle_pass.tsx` exists but is empty.
- No battle pass data file exists yet (quests/goals definitions are still missing).

---

## 1) Add static Battle Pass definitions

### File to create
- `src/bp_data.ts`

### What to add
- Export two constants:
  - `BP_WEEKS: BPWeek[]`
  - `BP_GOALS: BPGoal[]`
- Keep only definition fields in this file (site-owner controlled defaults):
  - Quests/goals IDs, labels, icons, `isPremium`, `amount`, and `stages`.
- For initial state values:
  - standard item: `counter: 0`, `completed: false`
  - stage step: `counter: 0`, `completed: false`
- Keep IDs stable and unique forever (never auto-generate with `crypto.randomUUID()` here).

### Notes
- This file is source-of-truth for BP definitions.
- Storage must persist user progress only, not rewritten definitions.

---

## 2) Build progress merge helpers (inside `battle_pass.tsx`)

### Goal
Hydrate static definitions (`BP_WEEKS`, `BP_GOALS`) with saved progress from `loadBPProgress()`.

### Add helper functions
- `progressMap(progress: BPItemProgress[]) => Map<string, BPItemProgress>`
- `hydrateQuest(quest, progressMap) => questWithProgress`
- `hydrateGoal(goal, progressMap) => goalWithProgress`

### Merge rules
- Standard quest/goal:
  - use saved `counter` and `completed` if found
  - otherwise default from definition
- Stage quest/goal:
  - each stage gets saved `counter`/`completed` by `stepId`
  - parent `completed` should be recomputed from all stages (`every(step.completed)`)
  - parent `counter` can stay `0` for stage items (not used), or you can keep saved value if you prefer consistency

---

## 3) Build progress extraction + persistence helpers

### Add helper functions
- `toProgressItems(weeks, goals): BPItemProgress[]`
  - flatten all quests + goals into persisted shape
- `persistProgress(weeks, goals)`
  - `saveBPProgress(toProgressItems(...))`

### Important
- Persist only:
  - `id`
  - `counter`
  - `completed`
  - `stepProgress` (for staged items)
- Do not persist display metadata (`text`, `icon`, `isPremium`, labels).

---

## 4) Add section order and Dailies state in page

### In `src/pages/battle_pass.tsx`
Initialize state:

- `sectionOrder` from `loadBPSectionOrder()`
- `weeks` from `hydrate(BP_WEEKS, loadBPProgress())`
- `goals` from `hydrate(BP_GOALS, loadBPProgress())`
- `dailies` from `loadBPDailies()`

Add `useEffect` persistence:

- when `sectionOrder` changes -> `saveBPSectionOrder`
- when `dailies` changes -> `saveBPDailies`
- when `weeks` or `goals` changes -> `saveBPProgress`

---

## 5) Build the three section components

Recommended split:

- `BPQuestsSection`
- `BPGoalsSection`
- `BPDailiesSection`

You can keep them in `battle_pass.tsx` first, then extract later.

### Quests section behavior
- Show fixed Week 1..7 cards.
- Collapsible per week (local UI state like `expandedWeekIds`).
- Header:
  - `Week: N` with color from `BP_WEEK_COLORS`
  - `completed / total`
  - chevron
- Body when expanded:
  - `Free:` list
  - `Premium:` list
- No add/edit/delete/drag for week quests.

### Goals section behavior
- Grid layout (4 columns on large screens, responsive down).
- Standard goal row/card:
  - icon, text, counter control, checkbox
- Stage goal row/card:
  - parent title
  - expandable list of stages with same controls
- No add/edit/delete/drag for goals.

### Dailies section behavior
- Reuse same quest UX style as scroll quests:
  - add (popup/form)
  - edit
  - delete
  - drag reorder
  - counter +/- and checkbox sync
- Dailies are fully user-managed and stored separately from groups/scrolls.

---

## 6) Reuse popup/form for Dailies

### Option A (faster)
- Reuse `QuestEditPopup` and/or `LockedQuestAddPopup` patterns from `src/components/scroll_popup.tsx`.
- Build a small `BPDailyPopup` local wrapper in `battle_pass.tsx` that outputs `BPDaily`.

### Option B (cleaner long-term)
- Extract shared quest form UI from `scroll_popup.tsx` into a reusable component.
- Use it in both scroll flow and battle pass dailies.

### Recommendation
- Start with Option A, then refactor only after it works.

---

## 7) Add drag-and-drop for section order

### Requirement
User can reorder only these 3 fixed sections:

- `quests`
- `goals`
- `dailies`

### Implementation
- Use existing dnd-kit pattern from `groups.tsx` / `scrolls.tsx`.
- `BPSectionId[]` from `types.ts` already exists.
- Save on every reorder with `saveBPSectionOrder`.

---

## 8) Add drag-and-drop for daily quests

### Requirement
- Dailies can be reordered by handle.
- Persist `order` numbers after every reorder.

### Implementation
- Same approach already used in `scrolls.tsx` quest list:
  - `arrayMove`
  - remap `.order = index`

---

## 9) Implement counter + checkbox sync logic everywhere

Apply this to:

- standard week quests
- stage steps
- goals
- daily quests

Rules:

- counter change:
  - clamp `0..amount`
  - `completed = counter >= amount`
- checkbox toggle:
  - checked -> set counter to `amount`
  - unchecked -> set counter to `0`
- staged parent:
  - recompute parent `completed` from children after every child update

---

## 10) Wire page into app navigation

Your `App.tsx` currently only renders `Header + Groups`.

### Add one routing strategy

#### Option A (recommended): react-router
- Add `react-router-dom`
- Create routes for:
  - `/` -> home (groups)
  - `/battle-pass` -> `BattlePassPage`
- Update `Header` links/buttons.

#### Option B: internal tab state
- Keep single-page conditional rendering in `App.tsx`.
- Header toggles between home and battle pass views.

Pick one and stay consistent.

---

## 11) Visual consistency pass

Match existing design language:

- dark panels, pixel fonts (`font-exe-pixel`, `font-pixeloid-sans`)
- same border radius/border colors
- icon sizes and checkbox behavior from existing quest rows
- hover-to-reveal edit/delete where appropriate (for dailies only)

---

## 12) Manual test checklist

### Quests section
- Week cards collapse/expand correctly.
- Free vs Premium split is correct.
- Counter and checkbox sync works.
- Stage quest parent completion updates correctly.
- Refresh keeps progress.

### Goals section
- Standard and stage goals both work.
- Stage updates persist.
- Parent completion derives correctly from stages.
- Refresh keeps progress.

### Dailies section
- Add daily works.
- Edit daily works.
- Delete daily works.
- Drag reorder works and persists.
- Refresh keeps dailies independent from homepage groups.

### Section ordering
- Drag Quests/Goals/Dailies sections.
- Refresh keeps same section order.

---

## 13) Suggested commit order (optional)

1. `feat(bp): add static battle pass data definitions`
2. `feat(bp): implement progress hydration and persistence`
3. `feat(bp): build quests and goals sections`
4. `feat(bp): add dailies management with drag reorder`
5. `feat(bp): add battle pass page navigation`

---

## 14) What to send me for review after each step

After each implementation chunk, send:

- which step number(s) you implemented
- any error or blocker
- if available: screenshots or copy of error text

Then I will review, point out precise fixes, and only patch code if you ask.

