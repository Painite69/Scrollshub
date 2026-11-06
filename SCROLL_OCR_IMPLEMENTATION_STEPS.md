# Scroll Screenshot OCR — Implementation Steps

This guide matches the current QuestHub codebase and coding style.  
Scope is **client-only**: paste a screenshot → OCR → review/edit → save.  
**No Minecraft mod. No Vulengate server API. No Electron required for this feature.**

You will implement; review after each step when you ask.

---

## 0) Product decisions (locked)

| Topic | Decision |
|---|---|
| Inventory / mod sync | **Out of scope.** Safe path only: user pastes a screenshot. |
| Battle Pass weeklies / goals | **Unchanged.** Keep hardcoded in `src/bp_data.ts`. You update them in code each season. |
| Battle Pass dailies | **Unchanged.** User adds manually in the BP page. Low priority. |
| Easy / Normal / Hard / Weekly scrolls | Paste screenshot → OCR → **review/edit** → add as a new scroll on the site. |
| Extended scrolls | Keep current template logic, but make the template **user-updatable** via screenshot. |
| OCR mistakes | Always show an editable review step before committing. |
| Desktop overlay (Inref-style) | **After this feature.** See [`OVERLAY_IMPLEMENTATION_STEPS.md`](./OVERLAY_IMPLEMENTATION_STEPS.md). |

### Extended template behavior (target)

1. Code still ships a fallback `DEFAULT_SCROLL` in `src/types/types.ts` (first-time / reset).
2. User clicks **Update Extended Scroll** → pastes a screenshot of the current monthly extended → OCR → review/edit → confirm.
3. Confirmed quests are saved as the **active extended template** in `localStorage`.
4. From then on:
   - The managed default extended (`id: '__default_scroll__'`) re-syncs definitions from that template (progress kept only when a quest definition still matches — same idea as today’s `normalizeDefaultExtendedScroll`).
   - Choosing type **Extended** when adding a scroll pre-fills from the **active template**, not the hardcoded code default.
5. Until the user updates again, every new extended uses that template.
6. Optional later: a **Reset to built-in default** that clears the user template and falls back to `DEFAULT_SCROLL`.

---

## 1) Current code you must respect

### Scroll model
- Quests live on a `Scroll`: `categoryId`, `subCategoryId`, `amount`, `objective`, `objectiveId`, `objectiveIcon`, `counter`, `completed`, `order`.
- Types: `easy` | `normal` | `hard` | `weekly` | `extended`.
- Add/edit UI: `src/components/scroll_popup.tsx` (`StepType` → `StepQuests`).
- Extended prefill today: `setPrefillQuests(t === 'extended' ? DEFAULT_SCROLL.quests : [])`.

### Extended sync today (`src/types/storage.ts`)
- Managed Extended group: `id === '__default_weekly__'` or `name === 'Extended'`.
- Reserved scroll id: `__default_scroll__`.
- On every `loadGroups` / `saveGroups`, `normalizeDefaultExtendedScroll` **overwrites quest definitions from code `DEFAULT_SCROLL`** and only keeps counters when definitions still match.
- **This must change** so the source of definitions is:  
  `loadExtendedTemplate() ?? DEFAULT_SCROLL`  
  not always `DEFAULT_SCROLL`.

### Storage keys today
- Groups: `questhub_groups`
- Categories: `questhub_categories`
- BP keys: separate `questhub_battlepass_*`

### Privacy
- App is local-only today. Prefer **in-browser OCR** (no image upload to a third-party API) so the privacy policy stays honest. If you later use a cloud OCR API, update Privacy Policy first.

---

## 2) Recommended OCR stack (browser)

### Library
- **Tesseract.js** (WASM, runs in the browser).
- Add dependency when implementing: `tesseract.js`.
- Worker language: English (`eng`) is enough for Vulengate scroll lore.

### Why this over cloud OCR
- No API keys.
- Images never leave the device.
- Fits current “no backend” app.

### UX constraints
- Screenshots should be **tight crops** of the scroll text (tooltip / book / HUD lore), high contrast if possible.
- Expect imperfect OCR → the review step is mandatory, not optional.
- Optional polish later: allow paste of **plain text** as a fallback if OCR fails.

### Input methods (all should work)
1. `Ctrl+V` / `Cmd+V` while the import popup is open (clipboard image).
2. Drag-and-drop image onto the drop zone.
3. File picker (`input type="file" accept="image/*"`).

---

## 3) Parse OCR text → quest drafts

### Goal
Turn raw OCR lines into editable **quest drafts** (not final `Quest` objects until the user confirms).

### Suggested draft shape
```ts
interface ScrollQuestDraft {
  id: string              // temp id for the review list
  rawLine: string         // original OCR line (for debugging / “reset line”)
  categoryId: string
  subCategoryId: string
  amount: number
  objective: string
  objectiveId: string     // start as 'custom' unless fuzzy-matched
  objectiveIcon?: string  // best-effort from mc_objectives / assets
  confidence?: 'high' | 'low'  // optional UI hint when parse is shaky
}
```

### Typical Vulengate-style lines (examples — tune against real screenshots)
```
Mine 2500 Obsidian
Kill 750 Hoglins
Craft 3500 Bookcases
Ride a Strider 10000 blocks
Walk 5000 blocks
Harvest 3500 Beetroot
```

### Parser rules (implement + iterate with real screenshots)
1. Split OCR text by newlines; trim; drop empty / noise lines (GUI chrome, “Clue Scroll”, rarity labels, empty boxes).
2. Normalize OCR quirks: `0`/`O`, `1`/`l`/`I`, weird spaces, lowercase.
3. Detect **action word** → map to existing `DEFAULT_CATEGORIES` / `subCategoryId` (reuse the same vocabulary as the quest form: mine, dig, chop, break, kill, craft, ride, harvest, walk, sprint, eat, …).
4. Detect **amount** (first integer, or the integer next to the action).
5. Remainder → **objective** string (clean plurals lightly if needed for icon match).
6. Special display cases already used in the app (`ride`, `walk`/`sprint` + surface) should parse into the same stored fields the manual form uses — display layer already formats them.
7. Icon: best-effort lookup against `mc_objectives` / asset index; if unknown → `objectiveId: 'custom'` and let the user pick an icon in review.
8. Unparseable lines: keep in the review list as **low confidence** with empty/default fields so the user can fix or delete them — do not silently drop without showing.

### Output of this step
- `ScrollQuestDraft[]` for the review UI.
- Also keep `rawOcrText` in state so the user can peek at / lightly edit raw text if you add that later.

---

## 4) Review / edit step (required)

Before anything is written to storage, show a review UI that reuses as much of `StepQuests` / quest edit controls as possible.

### Must allow
- Edit category / sub-category / amount / objective / icon per row.
- Add a blank quest row.
- Delete a row.
- Reorder (nice-to-have; can defer).
- See a thumbnail of the pasted screenshot (helps compare).
- Confirm / Cancel.

### Confirm actions depend on mode
| Mode | On confirm |
|---|---|
| **Import scroll** | Create a new `Scroll` of the chosen type with fresh quest ids, `counter: 0`, `completed: false`, and append to the target group (same as manual add). |
| **Update extended template** | Save drafts as the active extended template in `localStorage`, then re-run extended normalization so `__default_scroll__` picks up new definitions (reset progress for changed quests; keep progress only when definition still matches — same rule as today). |

Do **not** auto-save on OCR finish. OCR → drafts → user edits → Confirm.

---

## 5) Storage changes for extended template

### New key
```ts
questhub_extended_template  // stores Scroll-like quest list (definitions only)
```

Suggested stored shape (definitions only; no live counters required in the template):
```ts
interface ExtendedTemplate {
  updatedAt: number
  quests: Array<Pick<Quest,
    | 'id'
    | 'categoryId'
    | 'subCategoryId'
    | 'amount'
    | 'objective'
    | 'objectiveId'
    | 'objectiveIcon'
    | 'description'
    | 'order'
  >>
}
```

When applying as a live scroll, map each template quest to `{ ...q, counter: 0, completed: false }` (or preserve matching progress for `__default_scroll__` via the existing match helper).

### New helpers in `src/types/storage.ts`
- `loadExtendedTemplate(): ExtendedTemplate | null`
- `saveExtendedTemplate(template: ExtendedTemplate): void`
- `clearExtendedTemplate(): void` (optional reset)
- `getActiveExtendedScroll(): Scroll`  
  → builds a `Scroll` with `id: '__default_scroll__'`, `type: 'extended'`, quests from template or `DEFAULT_SCROLL`

### Change normalization
- Replace every hard use of `DEFAULT_SCROLL` quest definitions in `normalizeDefaultExtendedScroll` / `cloneDefaultScroll` / extended prefill with `getActiveExtendedScroll()`.
- Keep `DEFAULT_SCROLL` in `types.ts` as the **built-in fallback only**.
- Bump `EXTENDED_SYNC_VERSION` when this logic ships so existing clients re-run sync once.

### Change scroll popup prefill
```ts
// today
setPrefillQuests(t === 'extended' ? DEFAULT_SCROLL.quests : [])

// target
setPrefillQuests(t === 'extended' ? getActiveExtendedScroll().quests : [])
```

---

## 6) UI entry points

### A) Import scroll from screenshot
Where: group “add scroll” flow and/or a clear **Paste screenshot** action next to add-scroll.

Suggested flow:
1. User opens Add Scroll (or Import).
2. Pick scroll type (easy / normal / hard / weekly) — **or** detect later; for v1 let the user pick type first.
3. Paste / drop / pick image.
4. Show OCR progress (“Reading scroll…”).
5. Review/edit drafts.
6. Confirm → scroll added to the current group.

Extended type in this flow: either hide it here (extended has its own Update button), or allow it but make it clear that **Update Extended** is the way to change the monthly template.

### B) Update Extended Scroll
Where: on the Extended group header, or on the default extended scroll card — a button labeled **Update Extended Scroll** (or **Update from screenshot**).

Suggested flow:
1. Click **Update Extended Scroll**.
2. Paste / drop / pick image of this month’s extended.
3. OCR → review/edit.
4. Confirm → `saveExtendedTemplate` + refresh groups UI.
5. Toast / short note: “Extended template updated. New extended scrolls will use these tasks.”

### Visual style
- Match existing popups: dark panel, `border-2`, pixeloid fonts, same accent colors as scroll type borders (`SCROLL_STYLES`).
- Do not invent a new design language.

---

## 7) File plan

| File | Action |
|---|---|
| `src/lib/scroll_ocr.ts` | New — wrap Tesseract, expose `ocrScrollImage(file \| Blob): Promise<string>` |
| `src/lib/scroll_parse.ts` | New — `parseScrollText(text): ScrollQuestDraft[]` + action→category maps |
| `src/components/scroll_import_popup.tsx` | New — paste/drop UI, OCR state, wires into review |
| `src/components/scroll_quest_review.tsx` | New — or fold into import popup; editable draft list |
| `src/types/storage.ts` | Edit — extended template load/save; normalization uses active template |
| `src/types/types.ts` | Keep `DEFAULT_SCROLL` as fallback; no monthly edits required in code anymore |
| `src/components/scroll_popup.tsx` | Edit — extended prefill from `getActiveExtendedScroll()` |
| `src/components/groups.tsx` / `scrolls.tsx` | Edit — entry buttons for Import / Update Extended |
| `package.json` | Add `tesseract.js` |
| Privacy / About (optional) | Mention on-device OCR if you want to be explicit |

Battle Pass files: **do not touch** for this feature.

---

## 8) Step-by-step checklist

Use this as the build order. Check off as you go.

### Phase A — Extended template storage (no OCR yet)
- [x] **A1.** Add `ExtendedTemplate` type + `questhub_extended_template` key in `storage.ts`.
- [x] **A2.** Implement `loadExtendedTemplate` / `saveExtendedTemplate` / `clearExtendedTemplate` / `getActiveExtendedScroll`.
- [x] **A3.** Point `normalizeDefaultExtendedScroll` + `cloneDefaultScroll` at `getActiveExtendedScroll()` instead of raw `DEFAULT_SCROLL`.
- [x] **A4.** Point scroll popup extended prefill at `getActiveExtendedScroll().quests`.
- [x] **A5.** Bump `EXTENDED_SYNC_VERSION`.
- [ ] **A6.** Manual test: with no template, app behaves exactly like today (code `DEFAULT_SCROLL`).
- [ ] **A7.** Manual test: `saveExtendedTemplate` with fake quests → reload → default extended + “add extended” both use the new quests; counters preserved only for unchanged definitions.

### Phase B — Parser (text only, no OCR)
- [x] **B1.** Create `src/lib/scroll_parse.ts` with draft type + `parseScrollText`.
- [x] **B2.** Map action words to existing category / subCategory ids.
- [x] **B3.** Extract amount + objective; mark weak parses as `confidence: 'low'`.
- [x] **B4.** Best-effort icon / `objectiveId` lookup; fallback `'custom'`.
- [x] **B5.** Unit-style sanity checks (even if just a small `parse` playground or console tests) with sample lore strings from real Vulengate scrolls.
- [ ] **B6.** Keep iterating on real paste samples until easy/normal/hard/extended lines mostly land correctly.

### Phase C + D — Add Scroll popup (paste → detect → edit → save)
> **UX decision:** No separate import popup. Paste lives in the existing **Add a Scroll** flow (`scroll_popup.tsx`). OCR fills type + quests; `StepQuests` is the review/edit step.

- [x] **C1–C3 / D1–D4.** Integrated into `ScrollPopup`:
  - Paste / drop / file picker on type step
  - `tesseract.js` + `src/lib/scroll_ocr.ts`
  - `detectScrollType` + `parseScrollText` + `draftsToQuests`
  - Lands in existing `StepQuests` (edit / add / delete / save)
- [x] **C4 / E2.** **Update Extended Scroll** button → same OCR path but `saveExtendedTemplate` (on Extended group)
- [ ] **D5.** Manual test with real cropped screenshots (easy / normal / hard / extended)
- [ ] **D6.** Confirm bad OCR is fixable in `StepQuests` without re-pasting
- [ ] **E3.** Optional: **Reset extended to built-in default** (`clearExtendedTemplate`)
- [ ] **E4.** Optional: show / lightly edit raw OCR text before parse
- [ ] **E5.** Optional: accept plain-text paste as OCR fallback
- [ ] **E7.** Smoke test full paths (import + update-extended + BP untouched)
- [ ] **E8.** If privacy copy needs a line about on-device OCR, update Privacy / About

---

## 9) Out of scope (do not sneak in)

- Minecraft mods, inventory readers, packet sniffing.
- Fetching BP or scrolls from Vulengate servers.
- Auto-checking quest completion from the game.
- Electron overlay / side panels (tracked separately in [`OVERLAY_IMPLEMENTATION_STEPS.md`](./OVERLAY_IMPLEMENTATION_STEPS.md) — start only after Phases A–E here).
- Cloud OCR APIs (unless you consciously change privacy + add a key flow).
- Auto-updating monthly extended from the internet.

---

## 10) Acceptance criteria

Feature is done when:

1. User can paste/drop a scroll screenshot and get a new scroll on the site after reviewing/editing tasks.
2. User can update the monthly extended template the same way; new extended scrolls use it until the next update.
3. Incorrect OCR can be fixed in the review step before save.
4. BP weeklies/goals remain code-owned; dailies remain manual.
5. No mod and no server credentials are required.
6. Data stays in the browser (`localStorage`), consistent with the rest of the app.

---

## 11) Suggested first coding session

Start with **Phase A only** (template storage + wiring).  
That unlocks the extended monthly workflow even before OCR — you could temporarily paste JSON or use a stub review list. Then **B → C → D → E**.

---

## 12) What comes next

After OCR Phases **A–E** are done, continue with desktop overlay Phases **F–J** in:

→ [`OVERLAY_IMPLEMENTATION_STEPS.md`](./OVERLAY_IMPLEMENTATION_STEPS.md)

Summary: Electron glass window, docked left/right/top/bottom panel, auto-hide, QuestHub look, groups as folders, **no floats**. OCR/import stays in the main window (“Open in app”) for v1.
