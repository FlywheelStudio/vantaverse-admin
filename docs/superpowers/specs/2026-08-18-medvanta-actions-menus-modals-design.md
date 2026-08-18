# MedVanta Actions Menus + Modal Fidelity Design

**Date:** 2026-08-18  
**Status:** Approved for planning (Approach A)  
**Target:** `vantaverse-admin` worktree `.scratch/worktrees/afk-integrate` (`afk/medvanta-html-layout-fidelity`)  
**Source of truth:** `/home/jose-carmona/Proyectos/vantaverse-admin-root/VantaThrive-admin-MedVanta-rebuild-v6.html` (`moreBtn`, `rowMenu`, `mdInvite`, `mdExercise`, `mdDayEditor`, `mdAddGroupMembers`, `mdChangeOnboarding`, `mdUpdateDerived`)  
**Related:** `2026-08-17-medvanta-html-layout-fidelity-design.md`

---

## Goal

1. Replace every Ellipsis “more actions” control that currently uses CSS hover tooltips (`.tip` / `.tt`) with a real **dropdown menu** that navigates or opens modals.
2. Bring six modals to **HTML layout/feature fidelity**, filling gaps with **mock/placeholder data** when product APIs are missing.
3. Fix toggle/radio/tab **active/inactive color** bugs so MedVanta `.rd.on`, `.choice.on`, `.sw.on`, and accent tab styles match the prototype.

---

## Approach (locked): A — Shared menu + modal parity

- One reusable `HtmlActionsMenu` primitive; migrate all Ellipsis placeholders through it.
- Modal work targets HTML `md*` builders 1:1 for fields, alerts, footers, and decision chrome.
- Prefer real handlers when they already exist; otherwise mock data + visible placeholders (no invented backends).
- Scope: **all** Ellipsis placeholders in the app (not only Members/Profile).

---

## Part 1 — Shared actions menu

### Problem

Today:

| Primitive | Location | Behavior |
|-----------|----------|----------|
| `HtmlRowMenu` | `users/html-helpers.tsx` | CSS tip; no click menu |
| `HtmlMoreButton` / `HtmlRowMenu` | `builder/partials/html-toolbar.tsx` | CSS tip; **disabled** |
| Inline `.tip` | Members AppBar, profile header, messages, week actions, etc. | Tooltip label list only |

Profile header click wrongly jumps straight to Change Onboarding instead of opening a menu.

### Solution

Add a shared component (preferred path: `src/app/(authenticated)/users/html-helpers.tsx` or `src/components/medvanta/shell/HtmlActionsMenu.tsx` if builder/users both import it — **single export**, re-export from helpers/toolbar to avoid duplicate APIs).

```tsx
interface HtmlActionsMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

interface HtmlActionsMenuProps {
  items: HtmlActionsMenuItem[];
  size?: 'sm' | 'md'; // ib-sm vs ib / ib-sec
  variant?: 'icon' | 'button'; // ellipsis-only vs “Week actions”
  label?: string; // e.g. “Week actions”
  ariaLabel?: string;
}
```

**UI rules**

- Trigger: existing `ib` / `ib-sm` / `ib-sec` + Lucide `Ellipsis` (keep visual parity with HTML).
- Content: Radix `DropdownMenu` styled to MedVanta chrome (not generic ShadCN card look if it breaks layout CSS).
- No `.tip` / `.tt` for these controls after migration.
- Enabled by default when at least one item has `onSelect`; items without handlers stay `disabled` with the same label (visible placeholder).

### Migration inventory (must convert)

| Screen | File | Expected items (from tooltip / HTML) |
|--------|------|--------------------------------------|
| Members AppBar | `users/ui.tsx` | Import from CSV · Export all · Choose columns · Manage admins |
| Members row | `users/users-table/components/columns.tsx` | View profile · Assign program · Add to group · Make admin · Remove |
| Profile header | `users/[id]/partials/member-detail-header.tsx` | Change onboarding · Move to another group · Swap program · Reset progress · Deactivate |
| Messages AppBar | `messages/messages-page-ui.tsx` | Message a group · Saved replies · Mark all read |
| Messages row | `messages/messages-chat-thread.tsx` | View program · Assign program · Mark unread · Mute |
| Programs AppBar | `builder/programs-ui.tsx` | Manage default values · Saved exercise blocks · Export · Show archived |
| Programs row | `builder/program/builder.tsx` | Edit template · Edit workout schedule · Duplicate · Assign to members · Archive · Delete |
| Builder save bar | `builder/partials/html-save-bar.tsx` | Discard changes · Duplicate template · Archive · Delete |
| Week actions | `builder/[id]/workout-schedule/ui.tsx` | Copy week · Paste into week · Duplicate to all weeks · Clear week |
| Review-assign row | `builder/review-assign/review-assign-ui.tsx` | Open week N · Copy week · Clear week |
| Exercises AppBar | `exercises/exercises-ui.tsx` | Import from a partner library · Bulk edit categories · Export |

**Wire when possible**

- Members row “View profile” → `router.push(/users/[id])`.
- Profile “Change onboarding” → existing `onChangeOnboarding`.
- Programs row “Edit template / Edit workout schedule” → existing builder routes.
- Other items: open existing modals if present, else disabled placeholder item (keep label).

**Out of scope for this spec**

- HTML-only menus not yet present in React (Groups AppBar/row, workout exercise-row menus, media editor). Add only if those screens already render Ellipsis; do not invent new AppBars solely for menus.

---

## Part 2 — Modal fidelity + mocks

Reference HTML IDs: `mdAddGroupMembers`, `mdExercise`, `mdDayEditor`, `mdChangeOnboarding`, `mdInvite`, `mdUpdateDerived`.

### 2.1 Add members — `groups/add-members/add-members-modal.tsx`

| Requirement | Detail |
|-------------|--------|
| Radio chrome | Role choices must use `<span className={cn('rd', selected && 'on')}><i /></span>` like HTML |
| Invite by email | Visible invite-new section (email + invite CTA); may be mock/no-op submit with alert |
| Selection meta | Footer or meta: “N selected”; optional “Showing N of M unassigned” |
| Move warning | `alert-i` when selecting someone already in another group (mock flag OK) |
| Save label | Prefer “Add N members” / “Replace physiologist” — avoid confusing `Add N → M Members` if HTML critique rejects it |

### 2.2 Edit Exercise — `exercises/exercise-library/partials/exercise-modal.tsx`

Add HTML structure (mock where needed):

- Media: Replace media + overflow menu (Set thumbnail · Trim · Download · Remove) — placeholders OK
- Fields: Category, Source, Default prescription (sets / reps / rest)
- Tags: Equipment / Body region / Muscle / Pattern chips (mock lists)
- Check-in: structured question rows (type badge, reorder, add/remove) instead of single blob only — keep existing text as first mock question if needed
- Footer: Cancel + Save exercise; “Last edited by …” mock; badges Unassigned / Used in N programs / ID

### 2.3 Edit Workout Day — `builder/[id]/workout-schedule/exercise-builder-modal.tsx`

| Requirement | Detail |
|-------------|--------|
| Title | Prefer “Edit {Weekday}” + program subtitle when data exists |
| Day nav | Prev/next day controls (wire if schedule context exists; else mock) |
| Rest day | `.sw` “Mark … as rest day” |
| Session note | Textarea matching HTML |
| Inline Rx | Sets/reps/rest on selected rows (or steppers); mock defaults OK |
| Volume footer | “N exercises · ~M min” (estimate mock OK) |
| Tabs color | Active tab uses MedVanta accent underline / `.tabs` pattern — not navy `bg-primary` pills that fight layout CSS |
| Tabs labels | Keep current Library / Templates / Groups / Default Values unless product insists on HTML “Saved blocks / From another program”; if skipping HTML tabs, document as intentional stub in UI via disabled tab or note — **default: keep current tabs, fix chrome colors** |

### 2.4 Change Onboarding — `users/[id]/partials/change-onboarding-dialog.tsx`

- Badge: “Gate N of 4” (mock from member state or placeholder)
- Preselect current path from user/onboarding state when available
- Personalized warning copy using member first name + completed gates (mock gates OK)
- Saving “Full onboarding” must not be a silent no-op: either call API or show success toast + mock state update
- Keep `.rd` / `.choice.on` pattern (already correct)

### 2.5 Invite members — `users/users-table/components/add-user-modal.tsx`

Match `mdInvite` decision surface:

- Per-invitee (or bulk) editable: **Role**, **Group\***, **Onboarding path**
- Fix Select all (all rows, not first only)
- Enable Paste parse with mock parser (split emails / names) or clear placeholder that still populates list
- “N missing a group” banner/footer gate before send
- Prefer MedVanta `.cb` / `.choice` chrome on review step when practical; if `PendingUsersView` stays ShadCN, bring Role/Group/Onboarding into the compose step so HTML fidelity is visible before review
- Seed mock invitees when list empty in demo/dev if useful for layout QA

### 2.6 Save Template — `builder/[id]/workout-schedule/update-derived-dialog.tsx`

Match `mdUpdateDerived`:

- Title/subtitle: “Save changes to this template?” + program/template name
- Top alert: member count + “completed weeks never changed”
- Option copy with counts (“rebuild N active programs”, mid-week note)
- **Affected members** panel: avatar stack, “across N groups”, “Review the list” (mock members OK)
- Primary CTA label dynamic: “Save template only” vs push-to-programs wording

---

## Part 3 — Color / interaction fixes (cross-cutting)

1. Any `.choice` with radio must toggle `.rd.on` + inner `<i />`.
2. Switches: `.sw` / `.sw.on` (or existing Switch with `--accent`) — verify contrast against layout CSS.
3. Segmented controls / tabs in modals: use layout `.seg` / `.tabs` patterns; avoid `bg-primary` active pills that read as wrong brand state.
4. Alerts: use HTML `alert` / `alert-i` / `alert-w` classes already in `medvanta-html-layout.css` when present.

---

## Architecture (implementation split for subagents)

```
Agent 1 — HtmlActionsMenu + migrate all Ellipsis call sites
Agent 2 — Add members + Invite members modals
Agent 3 — Edit Exercise + Edit Workout Day modals
Agent 4 — Change Onboarding + Save Template modals
```

Agents must not rewrite shared `HtmlModal` shell casually; extend props if needed. Prefer mock constants colocated as `*-mock-data.ts` next to each modal.

---

## Non-goals

- Inventing new Postgres RPCs or Edge Functions for invite/group assignment.
- Full Groups-list Ellipsis menus if those screens do not already render Ellipsis.
- Pixel-perfect ShadCN theming outside MedVanta layout CSS.
- Remote `git push` (standing order).

---

## Success criteria

1. No Ellipsis control in the migrated inventory relies on `.tip`/`.tt` for its action list.
2. Members row can navigate to profile; profile menu opens Change Onboarding (and other items as wired/disabled).
3. Each of the six modals shows the HTML-critical fields/alerts/footers listed above (real or mock).
4. Role radios in Add members show active `.rd.on` state.
5. Day editor tabs no longer use incorrect primary-pill active styling.
6. Save Template shows affected-members decision chrome with mock counts if live data absent.

---

## Testing (manual)

- Members list: AppBar menu opens; row menu → View profile navigates.
- Profile: Ellipsis opens dropdown; Change onboarding opens dialog.
- Spot-check Messages / Programs / Exercises / Week actions menus open.
- Walk each of the six modals against HTML `md*` sections for fields, alerts, toggle colors.
- Toggle options on/off; confirm active/inactive colors readable.
