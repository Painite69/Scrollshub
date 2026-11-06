# Desktop Overlay (Side Panels) — Implementation Steps

Do this **after** [`SCROLL_OCR_IMPLEMENTATION_STEPS.md`](./SCROLL_OCR_IMPLEMENTATION_STEPS.md) is done (or at least usable).  
Overlay is a separate product surface: Electron desktop app + always-on-top panel while you play Minecraft.

Reference implementation: **Inref** at `d:\webdev\webapp-04-Inref` (studio overlay shell + `apps/desktop` Electron glass).  
**Port behavior, not Inref’s visual theme.** QuestHub keeps its own borders, fonts, and colors.

You will implement; review after each step when you ask.

---

## 0) Product decisions (locked)

| Topic | Decision |
|---|---|
| When to build | **After** scroll screenshot OCR (and extended template update). |
| Floats | **No floats.** Panels only. |
| Panel docks | Left / right / top / bottom. |
| Auto-hide | Yes — leave panel → collapse after a short delay (Inref uses ~700ms). |
| Reveal | Edge strip and/or chevron button (Inref: `edge` \| `button` \| `both`). |
| Panel content | QuestHub **groups as folders** (collapsible): group → scrolls → quests with counters/checkboxes. |
| Battle Pass in overlay | Optional v1: link/button to open main window BP page. Full BP UI in panel can wait. |
| Scroll OCR in overlay | Nice-to-have later; v1 can open main window for import / update-extended. |
| Browser-only site | Unchanged. Overlay is an **extra** desktop wrapper, not a replacement for the web app. |

### Architecture (same as live Inref)

- One frameless, transparent, always-on-top Electron window covering the virtual desktop (“glass”).
- Empty glass is **click-through** (`setIgnoreMouseEvents`).
- The side panel is a **React DOM box** on that glass (not a separate OS window per dock).
- Interactive UI marks itself with a hit attribute (Inref: `data-inref-overlay-hit`) so the click-through hook re-enables mouse events over the panel / rail / buttons.

---

## 1) What to copy from Inref (concepts + files)

Use Inref as a map. Do not copy moodboards, floats, or eyedropper unless you need them.

| Layer | Inref location (approx.) | QuestHub target |
|---|---|---|
| Electron main | `apps/desktop/src/main/index.ts` | `desktop/src/main/index.ts` (or `electron/main.ts`) |
| Preload bridge | `apps/desktop/src/preload/index.ts` | `desktop/src/preload/index.ts` → `window.questHubDesktop` |
| Overlay route | studio `#/overlay` | React route `/overlay` (hash or path; hash is fine under `file://` / Electron) |
| Shell (dock/hide/resize) | `overlay-shell.tsx` | `src/components/overlay/overlay_shell.tsx` |
| Control rail | `overlay-control-rail.tsx` | `src/components/overlay/overlay_control_rail.tsx` |
| Click-through hook | `use-desktop-overlay-click-through.ts` | `src/hooks/use_overlay_click_through.ts` |
| Settings | `overlay-settings.ts` | `src/types/overlay_settings.ts` + localStorage |
| Display layout | `overlay-displays.ts` | `src/lib/overlay_displays.ts` |
| Panel body | folders / layer tree | QuestHub groups / scrolls / quests (compact) |

**Skip entirely:** `OverlayFloatLayer`, float drag, float OS windows, float hosts, eyedropper.

---

## 2) Electron window chrome (target)

Overlay `BrowserWindow` should roughly match:

```ts
frame: false
transparent: true
hasShadow: false
skipTaskbar: true
alwaysOnTop: true
backgroundColor: '#00000000'
resizable: false
maximizable: false
minimizable: false
fullscreenable: false
// win/linux: type 'toolbar' (or equivalent)
// darwin: type 'panel', titleBarStyle 'hidden'
```

After create:

- Bounds = union of all displays (virtual desktop).
- `setAlwaysOnTop(true, 'screen-saver')`
- `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`
- Default click-through: `setIgnoreMouseEvents(true, { forward: true })`
- Prefer `showInactive()` so Minecraft / the game keeps focus.

Also keep a normal **main** window that loads the full QuestHub UI (home, BP, about, OCR import, etc.).

### IPC surface (minimal)

| API | Purpose |
|---|---|
| `openOverlay` / `toggleOverlay` / `closeOverlay` | Show glass + `/overlay` |
| `setClickThrough(enabled)` | Renderer hit-testing |
| `getDisplayLayout` + change events | Dock math / multi-monitor |
| `focusMain` / `openInApp(path)` | Jump to full app for OCR / BP / settings |
| `isDesktop` | Guard overlay-only UI |

Global shortcut (suggested): `Ctrl+Shift+O` (or `Cmd+Shift+O`) toggle overlay — match whatever feels right; document it in About.

---

## 3) Overlay settings (localStorage)

Key suggestion: `questhub_overlay_settings`

```ts
type OverlayDock = 'left' | 'right' | 'top' | 'bottom'

interface OverlaySettings {
  dock: OverlayDock
  sizeVertical: number    // fraction of home display, clamp ~0.08–0.45
  sizeHorizontal: number
  collapsed: boolean
  autoHide: boolean
  revealMethod: 'edge' | 'button' | 'both'
  keepToolbarOpen: boolean
  homeDisplayId?: string  // which monitor the panel docks on
}
```

Defaults: dock `left`, autoHide `true`, revealMethod `both`, sizes similar to Inref (~0.12 vertical / ~0.2 horizontal).

---

## 4) Panel content (QuestHub-specific)

### Folder tree
- Top level: **Groups** (collapsible folders), same order as homepage.
- Inside a group: **Scrolls** (by type color / label), collapsible.
- Inside a scroll: **Quests** — compact rows: objective text, counter steppers, checkbox.
- Categorized groups: optional nested category folders (can be v1.1 if separate mode is enough first).

### Interactions in panel
- Increment / decrement counter, toggle completed — **same storage helpers** as the web app (`saveGroups`, etc.).
- Shared `localStorage` / same Chromium partition so main window and overlay stay in sync.
- Collapse / expand folders; remember open-folder ids in overlay settings if useful.
- **Do not** put heavy editors in the panel (add scroll, OCR import, category manager). Provide “Open in app” instead.

### Visual style
- Transparent page background in overlay mode (`html.desktop-overlay` or route class) so only the panel paints.
- Panel chrome: QuestHub dark fill, `border-2`, pixel fonts, scroll-type accent colors from `SCROLL_STYLES`.
- Control rail + resize grip: appear on hover (Inref pattern); restyle to QuestHub, don’t ship Inref greys.
- Dense list: small type, tight rows, hide scrollbars if it matches the site’s density.

---

## 5) Repo / package layout

QuestHub is a single Vite app today. Suggested layout when Electron lands:

```
webapp-03-QuestHub/
  src/                    # existing React app (+ overlay route + components)
  desktop/                # new Electron package
    src/main/
    src/preload/
    package.json          # electron, electron-builder (or hoist in root)
  package.json            # existing vite scripts + desktop scripts
  OVERLAY_IMPLEMENTATION_STEPS.md
  SCROLL_OCR_IMPLEMENTATION_STEPS.md
```

### Scripts (illustrative)
- `dev:web` — current Vite.
- `dev:desktop` — Vite + wait-on + Electron loading `http://localhost:5173/#/overlay` (and main window `/`).
- `build:desktop` — `vite build` + compile main/preload + electron-builder.

Use a dedicated session partition (e.g. `persist:questhub`) so overlay and main share storage.

---

## 6) File plan

| File | Action |
|---|---|
| `desktop/src/main/index.ts` | New — main + overlay windows, IPC, shortcuts |
| `desktop/src/preload/index.ts` | New — `window.questHubDesktop` |
| `src/types/questhub-desktop.d.ts` | New — TS types for preload API |
| `src/types/overlay_settings.ts` | New — settings type + load/save |
| `src/lib/overlay_displays.ts` | New — `dockPanelRect`, home display helpers |
| `src/hooks/use_overlay_click_through.ts` | New — mousemove → hit test → IPC |
| `src/components/overlay/overlay_shell.tsx` | New — dock, collapse, auto-hide, resize, reveal |
| `src/components/overlay/overlay_control_rail.tsx` | New — dock picker, auto-hide, open in app, close |
| `src/components/overlay/overlay_panel_body.tsx` | New — groups-as-folders + quest rows |
| `src/pages/overlay.tsx` | New — composes shell + body; no site header/wallpaper |
| `src/router.tsx` | Edit — add `/overlay` route |
| `src/App.tsx` | Edit — detect overlay route: skip header/wallpaper; transparent root |
| `package.json` / desktop package | Edit — Electron deps + scripts |
| About page | Edit — how to run desktop overlay + shortcut |

---

## 7) Step-by-step checklist

### Phase F — Electron shell (empty glass)
- [x] **F1.** Add Electron main + preload package (`desktop/`) without breaking `npm run dev` / Cloudflare Pages web build.
- [x] **F2.** Create normal main window loading the Vite app.
- [x] **F3.** Create transparent overlay window (chrome flags above) covering virtual desktop.
- [x] **F4.** IPC: open / toggle / close overlay; `setClickThrough`; `isDesktop`.
- [x] **F5.** Overlay loads `#/overlay` (or `/overlay`) with transparent HTML background.
- [ ] **F6.** Manual test: overlay shows empty glass; clicks pass through to apps underneath; toggle shortcut works.

### Phase G — Shell UX (no QuestHub data yet)
- [x] **G1.** Port dock settings + `dockPanelRect` math (left/right/top/bottom, size clamps).
- [x] **G2.** Build `overlay_shell` with a placeholder panel (solid QuestHub-styled box).
- [x] **G3.** Collapse / expand; edge + button reveal.
- [x] **G4.** Auto-hide on pointer leave (~700ms); toggle in control rail.
- [x] **G5.** Resize grip updating size fraction.
- [x] **G6.** Click-through hook + `data-questhub-overlay-hit` on panel, rail, reveal controls.
- [ ] **G7.** Manual test: dock all four sides; auto-hide; resize; Minecraft (or Notepad) usable through empty areas.

### Phase H — Multi-monitor + polish shell
- [x] **H1.** `getDisplayLayout` + react to display changes.
- [ ] **H2.** Home display selection (which monitor the panel lives on).
- [ ] **H3.** Optional: home-bar drag to re-dock (Inref pattern) — can defer.
- [x] **H4.** Windows phantom title-bar scrub if you hit Electron’s white bar bug (Inref already solved this).

### Phase I — QuestHub panel body
- [x] **I1.** `overlay_panel_body`: load groups via existing `loadGroups` / subscribe to storage updates.
- [x] **I2.** Render groups as collapsible folders → scrolls → quest rows.
- [x] **I3.** Wire counter + checkbox to the same save path as homepage (progress syncs with main window).
- [x] **I4.** Compact QuestHub styling (borders, scroll type colors, pixel fonts).
- [x] **I5.** “Open in app” for full homepage / BP / OCR import.
- [ ] **I6.** Manual test: tick a quest in overlay → refresh main window (or focus it) → same progress; reverse also works.

### Phase J — Desktop product finish
- [ ] **J1.** electron-builder (or similar) for Windows install / portable build.
- [ ] **J2.** Dev scripts documented in README or About.
- [ ] **J3.** Global shortcut + in-rail close / open main.
- [ ] **J4.** Smoke test while playing: auto-hide panel, update counters mid-game, no focus steal when showing overlay.
- [ ] **J5.** Confirm web-only Cloudflare deploy still builds without Electron (desktop code tree-shaken or outside web entry).

---

## 8) Out of scope (do not sneak in)

- Floating quest windows / detachable cards.
- Mods or live game memory reading.
- Replacing the website with Electron-only.
- Full OCR / BP editors inside the thin panel (use main window).
- Copying Inref’s grey Refbox look.

---

## 9) Acceptance criteria

Feature is done when:

1. User can run a desktop build with a toggleable always-on-top overlay.
2. Panel docks left/right/top/bottom, auto-hides, and reappears via edge and/or button.
3. Empty screen areas are click-through so Minecraft stays playable.
4. Panel shows groups as folders with working quest progress shared with the web UI storage.
5. Visuals match QuestHub (not Inref).
6. No floats.
7. Web app continues to work standalone in the browser.

---

## 10) Suggested order relative to OCR

```
Scroll OCR Phases A → E   (browser feature, ships on the site)
        ↓
Overlay Phases F → J      (desktop wrapper; reuses OCR via “Open in app”)
```

If you ever need a thin vertical slice of overlay earlier for motivation, do **F + G** with a placeholder panel only — but do not block OCR on Electron.
