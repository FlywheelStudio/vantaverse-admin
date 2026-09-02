# MedVanta HTML Layout Fidelity Design

**Date:** 2026-08-17  
**Status:** Approved for planning (Approach A)  
**Target:** `vantaverse-admin` on `afk/medvanta-ui-migration` (worktree `.scratch/worktrees/afk-integrate`)  
**Source of truth:** `VantaThrive-admin-MedVanta-rebuild-v6.html`  
**Supersedes (layout only):** restyle-only approach in `2026-08-17-medvanta-ui-migration-design.md` where it conflicted with HTML DOM structure

---

## Goal

Rebuild authenticated admin chrome and every in-scope page/modal so the **DOM structure and CSS layout match the HTML prototype 1:1**. Where product data or features are missing, render **visible placeholders** that preserve the HTML layout (do not omit sections that define the composition). Breaking the current React layout is allowed and expected.

## Approach (locked): A — CSS from HTML + DOM 1:1

1. Port HTML layout CSS (`.app`, `.side`, `.nav-i`, `.main`, `.abar`, `.ribbon`, `.body`, `.g`, `.g4`, `.card`, `.tbl`, `.stat`, modal chrome, etc.) into the Next app.
2. Replace the current layout (VantaBuddy-offset light sidebar + `PageWrapper`) with HTML shell: `sidebar(active)` + `appbar(...)` + `body`.
3. Rebuild each screen/modal to emit the same structure as the corresponding `sc*` / `md*` HTML builders.
4. Wire real admin data where it already exists; otherwise use placeholders.
5. Keep MedVanta primitives where they fit inside HTML slots; do not invent a different composition for “React convenience.”

**Out of product chrome:** HTML `pt-shell` / `pt-bar` (prototype page switcher). That is **not** app navigation.

---

## Architecture

```
HTML rebuild v6
  shell(active, crumbs, title, sub, actions, body)
    sidebar(active)  →  .side (246px, navy-900)
    appbar(...)      →  .abar > .ribbon + .abar-row
    body             →  .body | .body-flush
         │
         ▼
 vantaverse-admin (AFK)
   src/styles/medvanta-html-layout.css   ← ported layout CSS
   src/components/medvanta/shell/
     AppShell.tsx | SideNav.tsx | AppBar.tsx | PlaceholderBlock.tsx
   src/app/(authenticated)/layout.tsx    ← AppShell wraps children
   pages/modals                          ← DOM matches sc*/md*
```

**Rules**

1. Layout fidelity > preserving current component tree.
2. Placeholders are **required** for missing data/features that occupy layout space in the HTML (funnel, activity, SLA actions UI chrome without mutations, etc.).
3. Do **not** invent backends; placeholders are static/disabled UI that look like the HTML.
4. Invite/create validators stay strict; read schemas may remain lenient (existing email fix).
5. No remote `git push` (standing order from prior loop).

---

## Shell (must match HTML)

| HTML piece | Spec |
|------------|------|
| `.app` | flex row, full height, `--bg-app` |
| `.side` | 246px, `--navy-900`, brand + nav sections + footer (Settings, Help, user chip) |
| `.nav-i` / `.nav-i.on` | cyan active pill; lucide icons |
| `.main` | flex column, overflow hidden |
| `.abar` | ribbon breadcrumbs + title/subtitle + actions |
| `.body` | padded scroll region |

**Nav mapping (HTML → routes)**

| HTML nav id / label | Route |
|---------------------|-------|
| dashboard | `/` |
| members | `/users` |
| groups | `/groups` |
| programs / builder | `/builder` |
| exercises | `/exercises` |
| messages | `/messages` |
| Settings / Help | placeholder routes or disabled buttons |

Remove VantaBuddy positioning from authenticated chrome (or relocate outside `.side` if product still needs it — default: **remove from layout path** so `.side` matches HTML).

---

## Screens inventory

| HTML | Route | Real data | Placeholders |
|------|-------|-----------|--------------|
| `scDashboard` | `/` | StatusCounts / Compliance / NeedingAttention mapped into HTML cards/tiles where possible | Onboarding funnel, Recent activity, sparklines if no series, group/date filters if no API |
| `scMembers` | `/users` | Users table | Bulk ops beyond invite/CSV (disabled chrome) |
| `scMemberDetail` | `/users/[id]` | Profile, assign/onboarding | Clinical notes tab UI, SLA mutation buttons (disabled), intake survey modal → read-only card + placeholder overlay trigger |
| `scGroups` / `scGroupDetail` | `/groups`, `/groups/[id]` | Members/programs | Scheduling tab, Settings domain/logo/booking |
| `scPrograms` / `scProgramBuilder` / `scBuildWorkout` | `/builder`, `/builder/[id]` | Templates/workouts | Duplicate/archive/push-schedule, saved blocks, partner import |
| `scExercises` | `/exercises` | Library | Partner import chrome |
| `scMessages` | `/messages` | Inbox/compose text | Saved replies, attachments |
| `scLoginEmail` | `/login` | Current auth | Visual layout only; no OTP MedVanta product |
| `scReviewAssign` | — | — | Standalone placeholder page **or** modal chrome reachable from builder (no assign-all backend) |
| `scFilterPanel` / `scAudit` | — | — | Skip audit; filters stay inline |

## Modals inventory

| HTML | Target | Notes |
|------|--------|-------|
| `mdInvite` | AddUserModal | Restyle to HTML modal DOM |
| `mdAssignProgram` / `mdAssignGroup` | existing modals | Exact modal chrome |
| `mdChangeOnboarding` | ChangeOnboardingDialog | Exact chrome |
| `mdAddGroupMembers` | AddMembersModal | Exact chrome |
| `mdExercise` / `mdDayEditor` / `mdUpdateDerived` | exercise/day/derived | Exact chrome; no saved blocks |
| `mdIntakeSurvey` | placeholder modal | Layout only; content from read-only intake or “No survey data” |

---

## Placeholder policy

`PlaceholderBlock` (or page-local equivalent):

- Same outer classes as the HTML section (`.card`, `.stat`, table columns, etc.)
- Label: short copy e.g. “Placeholder — data not available”
- Interactive controls that would mutate missing features: `disabled` + tooltip/title explaining unavailable
- Never remove a grid cell that the HTML uses for composition

---

## Delivery waves (for plan / fly-loop)

| Wave | Deliverable |
|------|-------------|
| 0 | Port HTML layout CSS; `AppShell` / `SideNav` / `AppBar`; rewrite authenticated `layout.tsx`; remove conflicting chrome |
| 1 | Dashboard DOM 1:1 + placeholders |
| 2 | Users list + member detail + related modals |
| 3 | Groups list + detail (+ scheduling/settings placeholders) |
| 4 | Builder / workout / exercises |
| 5 | Messages + login visual |
| 6 | Remaining modals + review&assign placeholder |
| 7 | Visual QA vs HTML + verify (lint/build) |

---

## Success criteria

1. Side-by-side with HTML: shell width, colors, appbar ribbon, and page grids match.
2. Every HTML section that defines layout exists in React (real or placeholder).
3. No new backends for excluded features.
4. Work stays on `afk/medvanta-ui-migration` locally (no push unless human lifts the ban).

## References

- `VantaThrive-admin-MedVanta-rebuild-v6.html` — `shell`, `sidebar`, `appbar`, `sc*`, `md*`
- `medvanta-ui-missing-features.md` / `docs/superpowers/medvanta-ui-missing-features.md`
- Prior migration spec/plan under `docs/superpowers/`
