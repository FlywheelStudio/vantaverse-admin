# MedVanta HTML Layout Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Fly-loop:** Frontier = Tasks 1–10 below. Spec: `docs/superpowers/specs/2026-08-17-medvanta-html-layout-fidelity-design.md`. Code on `afk/medvanta-ui-migration` via worktree `.scratch/worktrees/afk-integrate`.

**Goal:** Rebuild admin shell and all in-scope pages/modals so DOM + CSS match `VantaThrive-admin-MedVanta-rebuild-v6.html` 1:1, with placeholders where data/features are missing.

**Architecture:** Port HTML layout CSS into `medvanta-html-layout.css`. Replace authenticated layout with HTML `.app` / `.side` / `.main` / `.abar` / `.body`. Rebuild each screen from the corresponding `sc*` / `md*` HTML builders. Real data where it exists; otherwise `PlaceholderBlock` keeping the same grid/card structure.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, existing MedVanta tokens + primitives, lucide-react, pnpm, TypeScript. Worktree: `vantaverse-admin/.scratch/worktrees/afk-integrate`.

## Global Constraints

- Source of truth for layout: `VantaThrive-admin-MedVanta-rebuild-v6.html` (`shell`, `sidebar`, `appbar`, `sc*`, `md*`).
- Ignore prototype meta chrome: `pt-shell` / `pt-bar` (HTML page switcher only).
- Approach A: CSS class names from HTML + DOM 1:1; breaking current layout is expected.
- Placeholders required for missing sections that define composition (funnel, activity, notes tab, scheduling/settings, saved replies/attachments, review&assign, intake survey modal chrome, SLA mutation buttons disabled).
- Do not invent backends for features in `medvanta-ui-missing-features.md`.
- **Never `git push`** (standing order); commits local on `afk/medvanta-ui-migration` only.
- Package manager: `pnpm`. Node may need `--config.engine-strict=false` if local Node ≠ engines.

## File map

| Path | Role |
|------|------|
| `src/styles/medvanta-html-layout.css` | Ported HTML layout/primitives CSS |
| `src/app/globals.css` | Import layout CSS after tokens |
| `src/components/medvanta/shell/AppShell.tsx` | `.app` wrapper |
| `src/components/medvanta/shell/SideNav.tsx` | `.side` + NAV |
| `src/components/medvanta/shell/AppBar.tsx` | `.abar` ribbon + title |
| `src/components/medvanta/shell/PlaceholderBlock.tsx` | Missing-data section shell |
| `src/components/medvanta/shell/nav.ts` | NAV ids → routes |
| `src/app/(authenticated)/layout.tsx` | Use AppShell; remove old Sidebar margin |
| `src/components/sidebar/*`, VantaBuddy in auth layout | Stop using for authenticated chrome |
| Page/modal files under `src/app/(authenticated)/**` | DOM 1:1 rebuilds |

**Verify (per task):**

```bash
cd vantaverse-admin/.scratch/worktrees/afk-integrate
corepack pnpm --config.engine-strict=false exec eslint <touched-files>
# After shell + major pages:
corepack pnpm --config.engine-strict=false build
```

Visual: open HTML file in browser next to `pnpm dev` and compare shell + target screen.

---

### Task 1: Port HTML layout CSS

**Files:**
- Create: `src/styles/medvanta-html-layout.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: HTML `<style>` rules starting at `.app{` through primitives (`.btn`, `.card`, `.tbl`, `.stat`, `.g`, `.g4`, `.modal`/dialog overlays used by screens)
- Produces: classes available app-wide after import

- [ ] **Step 1: Extract CSS from HTML into the new file**

```bash
cd /home/jose-carmona/Proyectos/vantaverse-admin-root
python3 <<'PY'
import re
from pathlib import Path
html = Path('VantaThrive-admin-MedVanta-rebuild-v6.html').read_text()
css = re.search(r'<style>([\s\S]*?)</style>', html).group(1)
start = css.find('.app{')
# Include from .app through modal overlay helpers commonly used by screens
end_markers = ['/* ============================================================\n   Prototype top bar', '/* pt-shell', '.pt-shell{']
end = len(css)
for m in end_markers:
    i = css.find(m, start)
    if i != -1:
        end = min(end, i)
chunk = css[start:end]
out = Path('vantaverse-admin/.scratch/worktrees/afk-integrate/src/styles/medvanta-html-layout.css')
out.write_text(
  '/* Ported from VantaThrive-admin-MedVanta-rebuild-v6.html — app shell + primitives */\n'
  + chunk
)
print('wrote', out, 'bytes', out.stat().st_size)
PY
```

- [ ] **Step 2: Import in globals.css (after tokens, before app rules)**

In `src/app/globals.css` add:

```css
@import '../styles/medvanta-html-layout.css';
```

Place after `@import '../styles/medvanta-tokens.css';` and after Tailwind import (same pattern as tokens). If `@import` order errors appear, keep Google Fonts first, then tailwind, then tokens, then this layout file.

- [ ] **Step 3: Smoke that CSS loads**

```bash
cd vantaverse-admin/.scratch/worktrees/afk-integrate
corepack pnpm --config.engine-strict=false build
```

Expected: build succeeds (or only pre-existing unrelated failures). No CSS `@import` parse error.

- [ ] **Step 4: Commit**

```bash
cd vantaverse-admin/.scratch/worktrees/afk-integrate
git add src/styles/medvanta-html-layout.css src/app/globals.css
git commit -m "$(cat <<'EOF'
feat(ui): port MedVanta HTML layout CSS into the admin app

EOF
)"
```

---

### Task 2: AppShell + SideNav + AppBar

**Files:**
- Create: `src/components/medvanta/shell/nav.ts`
- Create: `src/components/medvanta/shell/SideNav.tsx`
- Create: `src/components/medvanta/shell/AppBar.tsx`
- Create: `src/components/medvanta/shell/AppShell.tsx`
- Create: `src/components/medvanta/shell/PlaceholderBlock.tsx`
- Create: `src/components/medvanta/shell/index.ts`
- Modify: `src/app/(authenticated)/layout.tsx`

**Interfaces:**
- Consumes: layout CSS classes; `lucide-react` icons; auth user display from existing `UserAvatar` / profile query if available
- Produces:

```ts
export type ShellNavId =
  | 'dashboard' | 'messages' | 'members' | 'groups' | 'programs' | 'exercises';

export const SHELL_NAV: Array<
  | { section: string }
  | { id: ShellNavId; icon: string; label: string; href: string; badge?: boolean }
>;

export function SideNav(props: { active: ShellNavId }): JSX.Element;

export function AppBar(props: {
  crumbs: Array<{ label: string; href?: string }>;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}): JSX.Element;

export function AppShell(props: {
  active: ShellNavId;
  children: React.ReactNode;
}): JSX.Element;

export function PlaceholderBlock(props: {
  title: string;
  className?: string;
  children?: React.ReactNode;
}): JSX.Element;
```

- [ ] **Step 1: Add nav config matching HTML NAV**

`nav.ts`:

```ts
export type ShellNavId =
  | 'dashboard'
  | 'messages'
  | 'members'
  | 'groups'
  | 'programs'
  | 'exercises';

export const SHELL_NAV = [
  { section: 'Monitor' },
  { id: 'dashboard' as const, icon: 'LayoutDashboard', label: 'Dashboard', href: '/' },
  { id: 'messages' as const, icon: 'MessageSquare', label: 'Messages', href: '/messages', badge: true },
  { section: 'People' },
  { id: 'members' as const, icon: 'UsersRound', label: 'Members', href: '/users' },
  { id: 'groups' as const, icon: 'Building2', label: 'Groups', href: '/groups' },
  { section: 'Library' },
  { id: 'programs' as const, icon: 'ClipboardList', label: 'Programs', href: '/builder' },
  { id: 'exercises' as const, icon: 'Dumbbell', label: 'Exercises', href: '/exercises' },
];

export function navIdFromPathname(pathname: string): ShellNavId {
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/users')) return 'members';
  if (pathname.startsWith('/groups')) return 'groups';
  if (pathname.startsWith('/builder')) return 'programs';
  if (pathname.startsWith('/exercises')) return 'exercises';
  return 'dashboard';
}
```

- [ ] **Step 2: Implement SideNav DOM = HTML `sidebar()`**

Structure must be:

```tsx
<aside className="side">
  <div className="side-brand">…logo…<span className="side-pl">VantaThrive</span></div>
  {/* side-sec + button.nav-i / .nav-i.on */}
  <div className="side-foot">
    <button type="button" className="nav-i" disabled title="Placeholder">Settings</button>
    <button type="button" className="nav-i" disabled title="Placeholder">Help & docs</button>
    <div className="side-user">…avatar + name + role…</div>
  </div>
</aside>
```

Use `next/navigation` for active route + `router.push`. Unread badge on Messages: keep existing `hasUnreadMessagesForAdmin` query; show `.nav-b` only when unread (HTML had static `3` — prefer real badge).

- [ ] **Step 3: Implement AppBar DOM = HTML `appbar()`**

```tsx
<header className="abar">
  <nav className="ribbon" aria-label="Breadcrumb">…</nav>
  <div className="abar-row">
    <div className="abar-id"><h1>{title}</h1>{subtitle && <div className="abar-sub">{subtitle}</div>}</div>
    {actions && <div className="abar-acts">{actions}</div>}
  </div>
</header>
```

- [ ] **Step 4: AppShell + layout rewrite**

```tsx
// AppShell.tsx
export function AppShell({ active, children }: { active: ShellNavId; children: React.ReactNode }) {
  return (
    <div className="app" style={{ minHeight: '100vh', height: '100vh' }}>
      <SideNav active={active} />
      <div className="main">{children}</div>
    </div>
  );
}
```

`layout.tsx`:

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { AppShell, navIdFromPathname } from '@/components/medvanta/shell';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AppShell active={navIdFromPathname(pathname)}>{children}</AppShell>;
}
```

Remove `Sidebar`, `VantaBuddyTrigger`, and marginLeft main styles from this layout.

- [ ] **Step 5: PlaceholderBlock**

```tsx
export function PlaceholderBlock({ title, className, children }: {
  title: string; className?: string; children?: React.ReactNode;
}) {
  return (
    <div className={className ?? 'card'}>
      <div className="ch">
        <div>
          <div className="ch-t">{title}</div>
          <div className="ch-s">Placeholder — data not available</div>
        </div>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

```bash
corepack pnpm --config.engine-strict=false dev
```

Expected: left navy `.side` 246px, no VantaBuddy offset sidebar, main fills remainder.

- [ ] **Step 7: Commit**

```bash
git add src/components/medvanta/shell src/app/\(authenticated\)/layout.tsx
git commit -m "$(cat <<'EOF'
feat(ui): replace auth chrome with HTML AppShell side nav and app bar

EOF
)"
```

---

### Task 3: Dashboard page DOM 1:1

**Files:**
- Modify: `src/app/(authenticated)/page.tsx`
- Modify or replace: `src/app/(authenticated)/dashboard/*` cards to fit HTML slots
- Optionally create: `src/app/(authenticated)/dashboard/html-dashboard.tsx` client/server composition

**Interfaces:**
- Consumes: `AppBar`, existing dashboard queries (`StatusCounts`, `Compliance`, `NeedingAttention`)
- Produces: HTML `scDashboard` structure:
  - `.body` with `.g.g4` stat tiles
  - grid `1.65fr / 1fr`: Needs attention table + Program completion card
  - grid `1fr / 1fr`: Onboarding funnel **placeholder** + Recent activity **placeholder**

- [ ] **Step 1: Read HTML `scDashboard` body and list required nodes**

Confirm tiles, attention table columns (Member, Issue, Completion, action), donut+legend, funnel, recent.

- [ ] **Step 2: Rewrite home page**

Wrap content:

```tsx
<>
  <AppBar
    crumbs={[{ label: 'Dashboard' }]}
    title="Good afternoon" /* or time-based greeting from profile first name */
    subtitle={/* overdue / needing attention counts from real data */}
    actions={/* select placeholders: All groups / Last 30 days — disabled or local-only */}
  />
  <div className="body">
    <div className="g g4" style={{ marginBottom: 16 }}>…stat tiles…</div>
    {/* two-column needs attention + completion */}
    {/* two-column PlaceholderBlock funnel + PlaceholderBlock activity */}
  </div>
</>
```

Map real StatusCounts → tiles where labels align; if a tile has no metric, still render `.stat` with `—` and foot text “Placeholder”.

- [ ] **Step 3: Stop using PageWrapper on home** (it fights `.abar` / `.body`).

- [ ] **Step 4: Visual compare vs HTML dashboard; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(dashboard): rebuild home layout to match HTML scDashboard

EOF
)"
```

---

### Task 4: Members list + member detail

**Files:**
- Modify: `src/app/(authenticated)/users/page.tsx` and table UI under `users-table/`
- Modify: `src/app/(authenticated)/users/[id]/page.tsx` + partials
- Modals: invite / assign / onboarding (structure in Task 8 if shared)

**Interfaces:**
- Consumes: AppBar, profile queries, HTML `scMembers` / `scMemberDetail` structure
- Produces: members table chrome matching HTML; profile tabs matching HTML; notes tab = PlaceholderBlock; SLA action buttons disabled placeholders; intake = read-only + optional placeholder modal trigger

- [ ] **Step 1: Rebuild `/users` with `.body`, HTML toolbar/filters, `.tbl`**
- [ ] **Step 2: Rebuild `/users/[id]` header + tabs to HTML member detail**
- [ ] **Step 3: Add placeholder notes tab panel (layout only)**
- [ ] **Step 4: Verify routes; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): match HTML members list and member detail layout

EOF
)"
```

---

### Task 5: Groups list + detail

**Files:**
- Modify: `src/app/(authenticated)/groups/page.tsx`
- Modify: `src/app/(authenticated)/groups/[id]/page.tsx` + children

**Interfaces:**
- Consumes: AppBar, group queries
- Produces: HTML `scGroups` / `scGroupDetail` layout; Scheduling + Settings tabs as PlaceholderBlock panels

- [ ] **Step 1: Rebuild groups list table/cards to HTML**
- [ ] **Step 2: Rebuild group detail with tabs; placeholder Scheduling/Settings**
- [ ] **Step 3: Verify; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(groups): match HTML groups list and detail layout

EOF
)"
```

---

### Task 6: Programs / builder / workout / exercises

**Files:**
- Modify: `src/app/(authenticated)/builder/page.tsx`
- Modify: `src/app/(authenticated)/builder/[id]/page.tsx` + workout-schedule UI
- Modify: `src/app/(authenticated)/exercises/page.tsx` + library partials

**Interfaces:**
- Consumes: AppBar, template/exercise queries
- Produces: HTML `scPrograms` / `scProgramBuilder` / `scBuildWorkout` / `scExercises` structure; placeholders for duplicate/archive/push-schedule, partner import, saved blocks

- [ ] **Step 1: Rebuild builder list (Programs)**
- [ ] **Step 2: Rebuild builder/[id] + workout week UI chrome to HTML**
- [ ] **Step 3: Rebuild exercises library chrome**
- [ ] **Step 4: Verify; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(builder): match HTML programs, workout, and exercises layouts

EOF
)"
```

---

### Task 7: Messages + login visual

**Files:**
- Modify: `src/app/(authenticated)/messages/page.tsx` (+ inbox components)
- Modify: `src/app/(public)/login/page.tsx`

**Interfaces:**
- Consumes: AppBar (messages), public login layout
- Produces: HTML inbox/compose chrome; hide or disable saved replies/attachments with placeholder buttons; login visual closer to `scLoginEmail` without OTP product

- [ ] **Step 1: Rebuild messages layout**
- [ ] **Step 2: Restyle login shell to HTML login panel (keep SSO/sign-in)**
- [ ] **Step 3: Verify; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(messages): match HTML messages layout; restyle login shell

EOF
)"
```

---

### Task 8: Modals DOM 1:1

**Files:**
- `users/users-table/components/add-user-modal.tsx`
- `users/[id]/partials/assign-program-modal.tsx`
- `users/[id]/partials/assign-group-modal.tsx`
- `users/[id]/partials/change-onboarding-dialog.tsx`
- `groups/add-members/add-members-modal.tsx`
- `exercises/.../exercise-modal.tsx`
- `builder/.../exercise-builder-modal.tsx`
- `builder/.../update-derived-dialog.tsx`
- Create: `users/[id]/partials/intake-survey-placeholder-modal.tsx` (layout only)

**Interfaces:**
- Consumes: MedVanta `Dialog` or HTML modal markup classes from ported CSS (`.modal` / overlay rules present in layout CSS)
- Produces: each modal matches corresponding `md*` structure; intake survey is placeholder

- [ ] **Step 1: Align invite + assign + onboarding + add-members modals**
- [ ] **Step 2: Align exercise / day / derived modals**
- [ ] **Step 3: Add intake survey placeholder modal**
- [ ] **Step 4: Verify open/close; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(modals): match HTML modal chrome for in-scope dialogs

EOF
)"
```

---

### Task 9: Review & assign placeholder surface

**Files:**
- Create: `src/app/(authenticated)/builder/review-assign/page.tsx` **or** a modal opened from builder primary action
- Modify: builder AppBar actions to link to it

**Interfaces:**
- Consumes: AppBar, PlaceholderBlock
- Produces: visual layout of HTML `scReviewAssign` with disabled primary actions and copy “Placeholder — assign flow not available”; do not call new RPCs

- [ ] **Step 1: Implement placeholder page/modal from HTML `scReviewAssign`**
- [ ] **Step 2: Wire entry from Programs/builder without enabling bulk push**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(builder): add review-and-assign layout placeholder matching HTML

EOF
)"
```

---

### Task 10: Visual QA + verify

**Files:**
- Modify: loop/docs only if recording results
- No product feature files unless fixing regressions found in QA

**Interfaces:**
- Consumes: all prior tasks
- Produces: green verify commands + short checklist note in `docs/superpowers/plans/` or AFK loop REPORT appendix

- [ ] **Step 1: Side-by-side checklist**

For each: Shell, Dashboard, Members, Member detail, Groups, Group detail, Programs, Builder/workout, Exercises, Messages, Login, each modal, Review&assign placeholder — confirm layout present (real or placeholder).

- [ ] **Step 2: Run verify**

```bash
cd vantaverse-admin/.scratch/worktrees/afk-integrate
corepack pnpm --config.engine-strict=false exec eslint src/components/medvanta/shell src/app/\(authenticated\)/layout.tsx
CI=1 STORYBOOK_DISABLE_TELEMETRY=1 corepack pnpm --config.engine-strict=false exec storybook build --quiet
corepack pnpm --config.engine-strict=false build
```

Expected: exit 0 (document pre-existing unrelated failures only).

- [ ] **Step 3: Final commit if QA fixes landed**

```bash
git commit -m "$(cat <<'EOF'
chore(ui): layout fidelity QA fixes vs HTML rebuild

EOF
)"
```

---

## Appendix A — Fly-loop frontier IDs

| ID | Task | Wave |
|----|------|------|
| `layout-css` | Task 1 | 0 |
| `layout-shell` | Task 2 | 0 |
| `layout-dashboard` | Task 3 | 1 |
| `layout-users` | Task 4 | 2 |
| `layout-groups` | Task 5 | 3 |
| `layout-builder-exercises` | Task 6 | 4 |
| `layout-messages-login` | Task 7 | 5 |
| `layout-modals` | Task 8 | 6 |
| `layout-review-assign` | Task 9 | 6 |
| `layout-verify` | Task 10 | end |

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Port HTML CSS | 1 |
| App shell .side/.abar | 2 |
| Remove conflicting chrome | 2 |
| Dashboard 1:1 + placeholders | 3 |
| Users/detail | 4 |
| Groups + scheduling/settings placeholders | 5 |
| Builder/exercises placeholders | 6 |
| Messages/login | 7 |
| Modals + intake placeholder | 8 |
| Review&assign placeholder | 9 |
| Verify | 10 |
