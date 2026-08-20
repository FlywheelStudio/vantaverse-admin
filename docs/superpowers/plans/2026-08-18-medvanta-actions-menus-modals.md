# MedVanta Actions Menus + Modal Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Spec: `docs/superpowers/specs/2026-08-18-medvanta-actions-menus-modals-design.md`  
> Worktree: `.scratch/worktrees/afk-integrate` on `afk/medvanta-html-layout-fidelity`  
> HTML source: `/home/jose-carmona/Proyectos/vantaverse-admin-root/VantaThrive-admin-MedVanta-rebuild-v6.html`

**Goal:** Replace all Ellipsis tooltip placeholders with real dropdown menus, and bring six modals to HTML feature/layout fidelity using mock data where APIs are missing.

**Architecture:** One shared `HtmlActionsMenu` (Radix DropdownMenu + MedVanta `ib` trigger). Thin wrappers `HtmlRowMenu` / `HtmlMoreButton` delegate to it. Modal tasks extend existing `HtmlModal` screens toward HTML `md*` builders with colocated `*-mock-data.ts` when needed.

**Tech Stack:** Next.js App Router, React 19, Radix DropdownMenu (`@/components/ui/dropdown-menu`), MedVanta layout CSS, lucide via `@/components/medvanta` Icon, TypeScript, pnpm.

## Global Constraints

- Source of truth: HTML `moreBtn` / `rowMenu` / `mdInvite` / `mdExercise` / `mdDayEditor` / `mdAddGroupMembers` / `mdChangeOnboarding` / `mdUpdateDerived`.
- Approach A: shared menu + HTML modal parity + mocks.
- No new Postgres RPCs / Edge Functions.
- No remote `git push`.
- Do not invent Groups AppBar Ellipsis if that screen has none yet.
- Prefer MedVanta classes (`.choice`, `.rd`, `.sw`, `.alert`, `.tabs`, `.seg`) over inventing new chrome.
- Explicit return types on functions; no `any`; named exports.
- Verify per task: `corepack pnpm --config.engine-strict=false exec eslint <touched-files>`

## File map

| Path | Role |
|------|------|
| `src/components/medvanta/shell/HtmlActionsMenu.tsx` | Shared dropdown primitive |
| `src/app/(authenticated)/users/html-helpers.tsx` | Re-export / migrate `HtmlRowMenu` |
| `src/app/(authenticated)/builder/partials/html-toolbar.tsx` | Migrate `HtmlMoreButton` / `HtmlRowMenu` |
| Members/profile/messages/builder/exercises call sites | Wire items + handlers |
| Six modal files + optional `*-mock-data.ts` | HTML fidelity |

---

### Task 1: Shared `HtmlActionsMenu` + migrate wrappers

**Files:**
- Create: `src/components/medvanta/shell/HtmlActionsMenu.tsx`
- Modify: `src/app/(authenticated)/users/html-helpers.tsx`
- Modify: `src/app/(authenticated)/builder/partials/html-toolbar.tsx`
- Modify (if barrel exists): `src/components/medvanta/shell/index.ts` or `src/components/medvanta/index.ts` — only if other shells are exported there; otherwise import by path

**Interfaces:**
- Produces:

```tsx
export interface HtmlActionsMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface HtmlActionsMenuProps {
  items: HtmlActionsMenuItem[];
  size?: 'sm' | 'md';
  variant?: 'icon' | 'button';
  label?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}

export function HtmlActionsMenu(props: HtmlActionsMenuProps): React.ReactElement;
```

- Back-compat wrappers:
  - Users `HtmlRowMenu({ label, items? })` — if only `label` (legacy string of ` · `-joined names), parse into disabled items OR require callers to pass `items` (prefer **require `items`** and update all call sites in Task 2).
  - Builder `HtmlMoreButton({ items })` / `HtmlRowMenu({ items })` — remove `tooltip` prop.

- [ ] **Step 1: Implement `HtmlActionsMenu`**

Use `@/components/ui/dropdown-menu`. Trigger:

```tsx
<button
  type="button"
  className={cn(
    size === 'sm' ? 'ib ib-sm' : variant === 'button' ? 'btn btn-sec btn-sm' : 'ib ib-sec',
    triggerClassName,
  )}
  aria-label={ariaLabel ?? 'More actions'}
>
  <Icon name="Ellipsis" size={size === 'sm' ? 17 : 18} />
  {variant === 'button' && label ? label : null}
</button>
```

Content: map `items` to `DropdownMenuItem`; call `onSelect` when present; `disabled` when `disabled || !onSelect`. Danger items use destructive text color (`var(--danger)` or existing danger token).

Do **not** render `.tip` / `.tt`.

- [ ] **Step 2: Point wrappers at `HtmlActionsMenu`**

`html-helpers.tsx` and `html-toolbar.tsx` become thin adapters. Keep exports named `HtmlRowMenu` / `HtmlMoreButton` so call sites can migrate gradually.

- [ ] **Step 3: Lint touched files**

```bash
cd /home/jose-carmona/Proyectos/vantaverse-admin-root/vantaverse-admin/.scratch/worktrees/afk-integrate
corepack pnpm --config.engine-strict=false exec eslint \
  src/components/medvanta/shell/HtmlActionsMenu.tsx \
  src/app/\(authenticated\)/users/html-helpers.tsx \
  src/app/\(authenticated\)/builder/partials/html-toolbar.tsx
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/medvanta/shell/HtmlActionsMenu.tsx \
  src/app/\(authenticated\)/users/html-helpers.tsx \
  src/app/\(authenticated\)/builder/partials/html-toolbar.tsx
git commit -m "feat(ui): add HtmlActionsMenu for MedVanta overflow actions"
```

---

### Task 2: Migrate all Ellipsis call sites

**Files:**
- Modify: `src/app/(authenticated)/users/ui.tsx`
- Modify: `src/app/(authenticated)/users/users-table/components/columns.tsx`
- Modify: `src/app/(authenticated)/users/[id]/partials/member-detail-header.tsx`
- Modify: `src/app/(authenticated)/messages/messages-page-ui.tsx`
- Modify: `src/app/(authenticated)/messages/messages-chat-thread.tsx`
- Modify: `src/app/(authenticated)/builder/programs-ui.tsx`
- Modify: `src/app/(authenticated)/builder/program/builder.tsx`
- Modify: `src/app/(authenticated)/builder/partials/html-save-bar.tsx`
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/ui.tsx`
- Modify: `src/app/(authenticated)/builder/review-assign/review-assign-ui.tsx`
- Modify: `src/app/(authenticated)/exercises/exercises-ui.tsx`

**Interfaces:**
- Consumes: `HtmlActionsMenu` / updated wrappers from Task 1
- Produces: working dropdowns; wire handlers listed below

**Wire (required):**

| Site | Item | Behavior |
|------|------|----------|
| Members row | View profile | `router.push(\`/users/${userId}\`)` — pass user id into `ActionsCell` |
| Profile header | Change onboarding | existing `onChangeOnboarding` |
| Programs row | Edit template / Edit workout schedule | existing builder routes if props/ids available |
| Builder save bar / others | remaining | `disabled` items OK if no handler |

**Profile header:** remove click-on-ellipsis → only Change onboarding; menu opens instead.

- [ ] **Step 1: Convert each call site**

Replace `.tip` blocks and old `HtmlRowMenu label="a · b"` with explicit `items` arrays matching prior tooltip labels.

Example members row:

```tsx
<HtmlRowMenu
  items={[
    { id: 'view', label: 'View profile', onSelect: () => router.push(`/users/${userId}`) },
    { id: 'assign', label: 'Assign program' },
    { id: 'group', label: 'Add to group' },
    { id: 'admin', label: 'Make admin' },
    { id: 'remove', label: 'Remove', danger: true },
  ]}
/>
```

- [ ] **Step 2: Grep for leftover tip menus**

```bash
rg -n "className=\"tip\"|HtmlRowMenu label=|HtmlMoreButton tooltip=" \
  src/app/\(authenticated\) --glob '*.tsx'
```

Expected: no Ellipsis-related hits (other tips OK if unrelated).

- [ ] **Step 3: Lint + commit**

```bash
git add src/app/\(authenticated\)/users src/app/\(authenticated\)/messages \
  src/app/\(authenticated\)/builder src/app/\(authenticated\)/exercises
git commit -m "feat(ui): wire Ellipsis overflow menus to HtmlActionsMenu"
```

---

### Task 3: Add members modal fidelity

**Files:**
- Modify: `src/app/(authenticated)/groups/add-members/add-members-modal.tsx`
- Create (optional): `src/app/(authenticated)/groups/add-members/add-members-mock-data.ts`

**Interfaces:**
- Consumes: existing selection hooks
- Produces: HTML-parity chrome + invite-by-email placeholder + alerts

- [ ] **Step 1: Fix role radio `.rd.on`**

Selected role choice must render:

```tsx
<span className={cn('rd', role === 'member' && 'on')}>
  {role === 'member' ? <i /> : null}
</span>
```

Same for physiologist.

- [ ] **Step 2: Add invite-by-email block + selection meta + move warning**

- Email input + “Invite” button (mock: append a pending row or show `alert` success — no backend).
- Footer/meta: “{n} selected”.
- When a selected member has another group (mock flag or real field if present): show `alert alert-i` move warning.
- Prefer save label `Add {n} members` / `Replace physiologist`.

- [ ] **Step 3: Lint + commit**

```bash
git commit -m "feat(groups): add-members modal HTML fields and radio chrome"
```

---

### Task 4: Invite members modal fidelity

**Files:**
- Modify: `src/app/(authenticated)/users/users-table/components/add-user-modal.tsx`
- Create: `src/app/(authenticated)/users/users-table/components/invite-mock-data.ts`
- Modify related helpers only if required (`pending-users-view.tsx` etc.)

**Interfaces:**
- Mock invitee shape:

```ts
export interface MockInvitee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
  groupId: string | null;
  groupName: string | null;
  onboarding: 'full' | 'screening' | 'consultation';
}
```

- [ ] **Step 1: Add Role / Group / Onboarding editors on compose step**

Bulk apply when multi-select. Show `alert` / footer gate when any selected invitee missing group (“N missing a group”).

- [ ] **Step 2: Fix Select all + Paste parse**

- Select all selects every pending invitee.
- Paste: enable button; parse emails (one per line / comma-separated) into invitee rows with mock defaults.

- [ ] **Step 3: Seed mock invitees for empty-state layout QA** (dev-only or when list empty after open — prefer a “Load sample invitees” ghost button if auto-seed is too aggressive).

- [ ] **Step 4: Lint + commit**

```bash
git commit -m "feat(users): invite modal role/group/onboarding and paste parse"
```

---

### Task 5: Edit Exercise modal fidelity

**Files:**
- Modify: `src/app/(authenticated)/exercises/exercise-library/partials/exercise-modal.tsx`
- Create: `src/app/(authenticated)/exercises/exercise-library/partials/exercise-modal-mock-data.ts`

- [ ] **Step 1: Add HTML sections with mocks**

Category, Source, Default prescription (sets/reps/rest), Tags chips (Equipment / Body region / Muscle / Pattern), structured check-in rows (at least one from existing text), media actions menu via `HtmlActionsMenu` (placeholders), badges (Unassigned / Used in N / ID).

- [ ] **Step 2: Footer Cancel + Save exercise**

Keep blur-save if already present; still show explicit Save that closes/saves. Footer info: “Last edited by …” mock.

- [ ] **Step 3: Lint + commit**

```bash
git commit -m "feat(exercises): edit exercise modal HTML fields and mocks"
```

---

### Task 6: Edit Workout Day modal fidelity

**Files:**
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/exercise-builder-modal.tsx`
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/partials/exercise-tab-switcher.tsx` (or wherever tabs live)
- Create (optional): `.../exercise-builder-mock-data.ts`

- [ ] **Step 1: Fix tab active chrome**

Replace navy `bg-primary` pills with MedVanta `.tabs` / accent underline pattern from layout CSS.

- [ ] **Step 2: Add rest-day switch, session note, volume footer, day nav**

- `.sw` Mark as rest day
- Session note textarea
- Footer “N exercises · ~M min” (estimate: `exercises * 5` or mock)
- Prev/next day buttons (call parent callbacks if available; else local mock index)

- [ ] **Step 3: Inline Rx on selected rows** if list component allows; otherwise steppers in a detail strip. Use mock defaults `3×10 · 60s`.

- [ ] **Step 4: Lint + commit**

```bash
git commit -m "feat(builder): day editor rest day, note, tabs, and volume footer"
```

---

### Task 7: Change Onboarding + Save Template modals

**Files:**
- Modify: `src/app/(authenticated)/users/[id]/partials/change-onboarding-dialog.tsx`
- Create: `src/app/(authenticated)/users/[id]/partials/change-onboarding-mock-data.ts` (optional)
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/update-derived-dialog.tsx`
- Create: `src/app/(authenticated)/builder/[id]/workout-schedule/update-derived-mock-data.ts`

**Change Onboarding**

- [ ] **Step 1: Badge “Gate N of 4”** (mock `gateIndex` default 2).
- [ ] **Step 2: Personalized `alert`** using `user.first_name` + completed gates copy.
- [ ] **Step 3: Preselect path** from props if parent can pass `currentPath`; else keep state but do not no-op Full — on Full save show toast/alert “Restored full onboarding (preview)” and close (or call refresh). Do not silently close without feedback.

**Save Template**

- [ ] **Step 4: Title/subtitle** “Save changes to this template?” + `templateName` prop (optional string, mock fallback).
- [ ] **Step 5: Top `alert-i`** with member count + “completed weeks never changed”.
- [ ] **Step 6: Option copy with counts** from mock `{ activePrograms: 14, members: 28, groups: 3 }`.
- [ ] **Step 7: Affected members panel** — avatar stack (initials), “across N groups”, “Review the list” button (disabled/placeholder OK).
- [ ] **Step 8: Dynamic primary CTA** — “Save template only” vs “Save and update programs”.

- [ ] **Step 9: Lint + commit**

```bash
git commit -m "feat(ui): onboarding and save-template modal HTML decision chrome"
```

---

### Task 8: Cross-check + smoke verify

- [ ] **Step 1: Spec coverage grep**

```bash
rg -n "className=\"tip\"" src/app/\(authenticated\) --glob '*.tsx' | rg -i "Ellipsis|More actions|Week actions" || true
rg -n "HtmlActionsMenu|HtmlRowMenu|HtmlMoreButton" src --glob '*.tsx' | head -40
```

- [ ] **Step 2: Typecheck/lint focused paths**

```bash
corepack pnpm --config.engine-strict=false exec tsc --noEmit -p tsconfig.json 2>&1 | head -80
```

Fix any errors introduced by these tasks only.

- [ ] **Step 3: Manual checklist** (document results in commit message or leave for human)

- Members AppBar + row menus open
- Profile menu → Change onboarding
- Each of 6 modals: fields/alerts/toggles visible; active colors correct

- [ ] **Step 4: Final commit if fixes**

```bash
git commit -m "fix(ui): polish actions menus and modal fidelity leftovers"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Shared HtmlActionsMenu | 1 |
| All Ellipsis inventory migrated | 2 |
| Add members radios/invite/alerts | 3 |
| Invite role/group/onboarding/paste/select-all | 4 |
| Edit Exercise fields/media/footer | 5 |
| Day editor rest/note/tabs/volume | 6 |
| Change Onboarding + Save Template | 7 |
| Success criteria smoke | 8 |

No TBD placeholders. Types consistent (`HtmlActionsMenuItem` reused).
