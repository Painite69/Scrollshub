# scrollshub - Structure Overview

## Pages
- **Home** — main quest organizer (groups + scrolls)
- **Battle Pass** — separate page for battle pass quests

---

## Core Concepts

### Groups
A group is a named collection of scrolls (e.g. "Dailies", "Weeklies").

| Field | Description |
|---|---|
| `name` | Group name |
| `icon` | Icon (from assets) |
| `display` | `"separate"` or `"categorized"` |

- Groups are **draggable** (6-dot handle on left)
- Added via **+** button → opens Group Popup
- Group Popup is used for both **create** and **edit**

---

### Scrolls
A scroll belongs to a group and holds quests.

- If group display is `separate` → scroll renders as its own block
- If group display is `categorized` → scroll quests are distributed into category blocks

- Scrolls have a **delete** button (clears all its quests from localStorage)

---

### Quests
A quest belongs to a scroll.

| Field | Type | Description |
|---|---|---|
| `category` | string | e.g. kill, mine, craft |
| `amount` | number | target count |
| `objective` | string | item or mob name |
| `objectiveIcon` | string? | path to mc asset icon |
| `counter` | number | current progress |
| `completed` | boolean | done state |

**Completion logic:**
- Counter reaching `amount` → auto-checks completed
- Checking the checkbox → sets counter to `amount`
- Both are in sync

**Separate display format:**
```
Kill 20 Creepers: 10 ☐
[category] [amount] [objective]: [counter ▲▼] [checkbox]
```

**Categorized display format (inside Kill block):**
```
20 Creepers: 10 ☐
[amount] [objective]: [counter ▲▼] [checkbox]
```

**Smart display overrides (display only, not stored):**
- `ride` → "ride a {objective} {amount} blocks"
- `walk`/`sprint` + plain → "walk/sprint {amount} blocks"
- `walk`/`sprint` + surface (ice, packed ice, blue ice, snow, underwater) → "walk/sprint {amount} on {surface} blocks"

- Quests are **draggable** within their scroll/category block (6-dot handle)
- Quests have a **delete** button

---

### Categories (Categorized Display)
Categories have a main label and sub-categories that map to quest action words.

| Main | Sub-categories |
|---|---|
| Mine | mine, dig, chop, break |
| Kill | kill, slay, defeat |
| Craft | craft, bake |
| Cook | cook, smelt |
| Eat | eat |
| Animals | shear, fish, tame |
| Movement | walk, sprint, swim, glide |
| Harvest | harvest |
| Ride | ride |
| Workbench | enchant, brew |
| Die | die |
| Interact | place, convert, fill, empty, apply, gain |

**Display modes:**
- `categorized` — groups by main category
- `categorized-detail` — groups by each sub-category individually

**User control:**
- Users can add, edit, or reorder categories
- A reset button restores defaults (destroys any quests using deleted categories)
- Category blocks are **draggable** (6-dot handle)

---

## Popups

| Popup | Purpose |
|---|---|
| Group Popup | Create or edit a group (name, icon, display type) |
| Scroll Popup | Add a scroll to a group |
| Quest Popup | Add a quest to a scroll |

---

## Battle Pass Page

The Battle Pass page has **three fixed sections** (not user-created groups). Their names and display modes are locked — users cannot rename or reconfigure them. Users **can** drag the sections to reorder them for personal prioritization.

The three sections are:
1. **Quests** — weekly quest blocks (weeks 1–7)
2. **Goals** — pass-wide goals
3. **Dailies** — user-managed daily quests

---

### Battle Pass — Quests Section

Weeks 1–7 are predefined by the site owner. Each week is a **collapsible/expandable card**.

**Week card header:**
- Week label (e.g. "Week: 2") in the week's accent color (uses `SCROLL_STYLES` palette in order: green, pink, orange, yellow, red, blue, cyan)
- Progress counter: `completed / total` (e.g. `6/11`)
- Expand/collapse chevron

**Week card body (when expanded):**
- "Free:" label → list of free quests
- "Premium:" label → list of premium quests
- Free/Premium is a **visual separator only** — no logic difference

**Each quest in a week is one of two types:**

#### Standard Quest
| Field | Type | Description |
|---|---|---|
| `id` | string | unique identifier |
| `text` | string | display text (e.g. "Kill 5 Creepers") |
| `icon` | string | path to mc asset icon |
| `amount` | number | target count |
| `counter` | number | user's current progress (persisted) |
| `completed` | boolean | user's done state (persisted) |
| `isPremium` | boolean | determines Free/Premium section |
| `stages` | null | null = standard quest |

#### Stage Quest
A quest with multiple sequential steps. The parent quest is completed only when **all stages** are completed.

| Field | Type | Description |
|---|---|---|
| `id` | string | unique identifier |
| `text` | string | parent quest display text |
| `icon` | string | parent icon |
| `completed` | boolean | true when all stages done (persisted) |
| `isPremium` | boolean | determines Free/Premium section |
| `stages` | Stage[] | array of stage steps (non-null) |

**Stage step:**
| Field | Type | Description |
|---|---|---|
| `id` | string | unique step identifier |
| `text` | string | step description |
| `icon` | string | step icon |
| `amount` | number | target count for this step |
| `counter` | number | user's progress on this step (persisted) |
| `completed` | boolean | true when counter >= amount (persisted) |

**User interactions (quests are NOT editable/deletable/draggable):**
- Increment/decrement counter (▲▼ arrows)
- Toggle completed checkbox
- For stage quests: same per-stage, parent auto-completes when all stages done

**Storage:** Only `counter` and `completed` (and per-stage equivalents) are persisted. Quest definitions (text, icon, amount, isPremium, stages) are hardcoded in source.

---

### Battle Pass — Goals Section

Goals are predefined by the site owner. Displayed in a 4-column grid.

**Each goal is one of two types:**

#### Standard Goal
| Field | Type | Description |
|---|---|---|
| `id` | string | unique identifier |
| `text` | string | display text (e.g. "Reach tier 90") |
| `icon` | string? | optional mc asset icon |
| `amount` | number | target count |
| `counter` | number | user's current progress (persisted) |
| `completed` | boolean | user's done state (persisted) |
| `stages` | null | null = standard goal |

#### Stage Goal
Same structure as Stage Quest above but for goals. `stages` is a `Stage[]` instead of null.

When `stages` is non-null, the goal card expands to show each stage with its own counter and checkbox. The parent goal completes when all stages complete.

**Future-proofing:** All goals have a `stages` field. If `null`, it's a standard goal. The site owner can change any goal to a stage goal by populating the `stages` array — no structural changes needed.

**User interactions (goals are NOT editable/deletable/draggable):**
- Increment/decrement counter
- Toggle completed checkbox
- For stage goals: same per-stage

**Storage:** Only `counter`, `completed`, and per-stage progress are persisted. Goal definitions are hardcoded in source.

---

### Battle Pass — Dailies Section

Dailies are **fully user-managed**. Users can add, edit, delete, and drag to reorder them.

Each daily quest uses the same field structure as a homepage scroll quest:

| Field | Type | Description |
|---|---|---|
| `id` | string | unique identifier |
| `categoryId` | string | action category |
| `subCategoryId` | string | action sub-category |
| `amount` | number | target count |
| `objective` | string | item or mob name |
| `objectiveIcon` | string? | mc asset icon path |
| `description` | string? | optional note |
| `counter` | number | current progress |
| `completed` | boolean | done state |
| `order` | number | drag-and-drop order |

**Adding dailies:** "+ Add Daily" button opens the same quest form used in scroll popups (action picker, amount, objective with icon selector).

**Storage:** Dailies are stored under a **separate localStorage key** (`scrollshub_battlepass_dailies`) — completely independent from the homepage `Group`/`Scroll` structure. They reuse the `Quest` type internally.

**User interactions:**
- Add via "+ Add Daily"
- Edit via inline edit popup
- Delete via delete button
- Drag to reorder (6-dot handle)
- Increment/decrement counter
- Toggle completed checkbox

---

## Storage

- All data stored in **localStorage**
- No accounts, no auth, no backend
- **Cloudflare R2** used for static assets only

### Storage Keys

| Key | Contents |
|---|---|
| `scrollshub_groups` | All homepage groups, scrolls, and quests |
| `scrollshub_categories` | User-customized categories |
| `scrollshub_battlepass_progress` | Battle pass quest/goal counter+completed state only |
| `scrollshub_battlepass_dailies` | User's daily quests (full quest objects) |
| `scrollshub_battlepass_section_order` | User's drag order of the three BP sections |

### Clear / Delete
- Delete scroll → removes scroll + all its quests from localStorage
- Clear buttons available for scrolls and quests
- No orphaned data left behind on delete

---

## Draggable Elements (all have 6-dot handle on left)
- Groups (on home page)
- Category blocks (in categorized display)
- Quests (within their scroll or category block)
- Battle Pass sections (Quests / Goals / Dailies — reorder only)
- Daily quests (within the Dailies section)

---

## Asset Index (`public/mc-asset-index.json`)

Flat list of all MC assets available for icon selection.

```json
{ "label": "Cobblestone", "icon": "/mc_assets/COBBLESTONE.png" }
{ "label": "Armor Stand", "icon": "/mc_assets/ARMOR_STAND.png", "icon3d": "/mc_assets/ARMOR_STAND (2).png" }
```

- `icon` — flat/2D sprite
- `icon3d` — 3D render variant (shown in icon selector grid as a separate entry labeled "Name (3D)")
- Custom entries at top: `Blocks`, all 16 colored sheep variants

Used by:
- Objective picker dropdown (filters by typed text, shows up to 12 suggestions)
- Icon selector modal (full grid with search, opens from icon button next to objective input)
