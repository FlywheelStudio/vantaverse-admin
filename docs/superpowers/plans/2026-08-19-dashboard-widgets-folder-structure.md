# Dashboard widgets folder structure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move dashboard `html-*` widgets into `src/components/widgets/<name>/{ui,index,*.stories}.tsx` with updated imports and no intentional visual change.

**Architecture:** Each widget folder exposes a public API from `index.tsx` (logic: clamp, SVG geometry, tone helpers) and pure markup in `ui.tsx`. Shared helpers live in `widgets/utils.ts`. Home page RSC keeps data fetching; `Dashboard` remains a client presentational/container that receives props.

**Tech Stack:** Next.js App Router, React 19, Storybook 8 (`@storybook/react`), TypeScript strict, existing MedVanta CSS classes.

## Global Constraints

- Destination root: `src/components/widgets/<name>/` only (not medvanta).
- Contract per widget: `ui.tsx` + `index.tsx` + `<name>.stories.tsx`.
- Public names drop `Html` prefix (`StatTile`, `Donut`, …); update all imports in the same change set.
- Do not unify `users/html-helpers` `HtmlAvatar` with widgets avatar.
- Do not restyle; keep `.stat`, `.pbw`, `.av`, etc.
- Do not migrate MedVanta primitives or `src/components/ui/` in this plan.
- Verify with `corepack pnpm --config.engine-strict=false exec tsc --noEmit` (or project equivalent) after consumer updates.
- Commits: conventional `refactor(widgets): …` / `feat(widgets): …`.

## File map

| Create | Responsibility |
|--------|----------------|
| `src/components/widgets/utils.ts` | `avatarTone`, `initialsFromName`, `getGreeting`, `formatDashboardSubtitle` |
| `src/components/widgets/sparkline/{ui,index,sparkline.stories}.tsx` | SVG sparkline |
| `src/components/widgets/progress-bar/{ui,index,progress-bar.stories}.tsx` | `.pbw` bar |
| `src/components/widgets/donut/{ui,index,donut.stories}.tsx` | SVG donut |
| `src/components/widgets/avatar/{ui,index,avatar.stories}.tsx` | monogram `.av` |
| `src/components/widgets/stat-tile/{ui,index,stat-tile.stories}.tsx` | stat + optional sparkline |
| `src/components/widgets/app-bar-actions/{ui,index,app-bar-actions.stories}.tsx` | disabled filter selects |
| `src/components/widgets/dashboard/{ui,index,dashboard.stories}.tsx` | dashboard body container |
| `src/components/widgets/index.ts` | barrel of public exports |

| Delete after migrate | Was |
|----------------------|-----|
| `src/app/(authenticated)/dashboard/html-*.tsx` + `html-utils.ts` + `dashboard-app-bar-actions.tsx` | old locations |

| Modify imports | New path |
|----------------|----------|
| `src/app/(authenticated)/page.tsx` | `@/components/widgets/...` |
| `users/[id]/partials/html-program-tab.tsx` | progress-bar |
| `users/[id]/partials/html-onboarding-tab.tsx` | avatar |
| `users/[id]/partials/member-notes-tab.tsx` | avatar |
| `groups/**` + `components/ui/avatar.tsx` + `users/html-helpers.tsx` | `widgets/utils` for `avatarTone` |

---

### Task 1: `widgets/utils.ts`

**Files:**
- Create: `src/components/widgets/utils.ts`
- Modify: all files importing `@/app/(authenticated)/dashboard/html-utils` or `./html-utils` for utils only
- Delete later (Task 7): `src/app/(authenticated)/dashboard/html-utils.ts`

**Interfaces:**
- Produces:

```ts
export function avatarTone(seed: string): string;
export function initialsFromName(name: string): string;
export function getGreeting(): string;
export function formatDashboardSubtitle(needingAttentionTotal: number): string;
```

- Drop unused private `attentionIssueLabel` (lint warning today).

- [ ] **Step 1: Create `utils.ts`** — copy the four exported functions from `html-utils.ts` verbatim; omit `attentionIssueLabel`.

- [ ] **Step 2: Point utils consumers at `@/components/widgets/utils`**

Files (grep-confirmed):

- `src/components/ui/avatar.tsx`
- `src/app/(authenticated)/users/html-helpers.tsx`
- `src/app/(authenticated)/groups/groups/partials/columns.tsx`
- `src/app/(authenticated)/groups/[id]/partials/members-table-columns.tsx`
- `src/app/(authenticated)/groups/[id]/partials/group-hero-card.tsx`
- Keep `page.tsx` update for Task 7 with Dashboard (or update `getGreeting` / `formatDashboardSubtitle` imports now).

Leave `dashboard/html-avatar.tsx` temporarily importing old `./html-utils` until Task 4, **or** update it to widgets utils immediately once created.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/utils.ts \
  src/components/ui/avatar.tsx \
  'src/app/(authenticated)/users/html-helpers.tsx' \
  'src/app/(authenticated)/groups'
git commit -m "$(cat <<'EOF'
refactor(widgets): extract dashboard html-utils to widgets/utils

EOF
)"
```

---

### Task 2: Leaf widgets — sparkline, progress-bar, donut

**Files:**
- Create: `src/components/widgets/sparkline/ui.tsx`
- Create: `src/components/widgets/sparkline/index.tsx`
- Create: `src/components/widgets/sparkline/sparkline.stories.tsx`
- Create: `src/components/widgets/progress-bar/ui.tsx`
- Create: `src/components/widgets/progress-bar/index.tsx`
- Create: `src/components/widgets/progress-bar/progress-bar.stories.tsx`
- Create: `src/components/widgets/donut/ui.tsx`
- Create: `src/components/widgets/donut/index.tsx`
- Create: `src/components/widgets/donut/donut.stories.tsx`

**Interfaces:**
- Produces:

```ts
// sparkline
export function Sparkline(props: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}): React.ReactElement | null;

// progress-bar
export function ProgressBar(props: {
  pct: number;
  height?: 4 | 6 | 8;
  tone?: 'navy' | 'cyan' | 'danger';
  showLabel?: boolean;
}): React.ReactElement;

// donut
export interface DonutProps {
  pct: number;
  size?: number;
  label: string;
  sub?: string;
}
export function Donut(props: DonutProps): React.ReactElement;
```

**Split rules:**
- `index.tsx`: clamp %, compute SVG `circumference`/`offset`/`pts`/`area`/`gid`/`barClass`.
- `ui.tsx`: receive precomputed values and render only.

Example progress-bar:

```tsx
// index.tsx
export function ProgressBar({ pct, height = 6, tone = 'navy', showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const barClass =
    tone === 'cyan' ? 'pb pb-6 pb-c' : tone === 'danger' ? 'pb pb-6 pb-d' : 'pb pb-6 pb-n';
  return (
    <ProgressBarUi
      clamped={clamped}
      height={height}
      barClass={barClass}
      showLabel={showLabel}
    />
  );
}
```

Sparkline: keep `'use client'` on `index.tsx` if still required; `ui.tsx` receives `line`, `area`, `gid`, `color`, `height`, `className`, `w`.

- [ ] **Step 1: Implement the three folders** from current `html-sparkline.tsx`, `html-progress-bar.tsx`, `html-donut.tsx`.

- [ ] **Step 2: Add Storybook stories** — title `Widgets/Sparkline`, `Widgets/ProgressBar`, `Widgets/Donut`; Default + one variant each.

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Donut } from './index';

const meta = {
  title: 'Widgets/Donut',
  component: Donut,
  args: { pct: 72, label: '72%', sub: 'aggregate' },
} satisfies Meta<typeof Donut>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 96, pct: 40, label: '40%' } };
```

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(widgets): add sparkline, progress-bar, and donut folders

EOF
)"
```

---

### Task 3: Avatar + StatTile + AppBarActions

**Files:**
- Create: `src/components/widgets/avatar/{ui,index,avatar.stories}.tsx`
- Create: `src/components/widgets/stat-tile/{ui,index,stat-tile.stories}.tsx`
- Create: `src/components/widgets/app-bar-actions/{ui,index,app-bar-actions.stories}.tsx`

**Interfaces:**
- Consumes: `avatarTone`, `initialsFromName` from `../utils`; `Sparkline` from `../sparkline`; `Icon` from `@/components/medvanta`
- Produces:

```ts
export function Avatar(props: {
  name: string;
  size?: 24 | 28 | 32 | 36 | 44 | 56 | 72;
  title?: string;
}): React.ReactElement;

export function StatTile(props: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: string;
  footer?: string;
  spark?: number[];
}): React.ReactElement;

export function DashboardAppBarActions(): React.ReactElement;
```

- [ ] **Step 1: Avatar** — `index` computes `toneClass = avatarTone(name)`, `initials = initialsFromName(name)`; `ui` renders `<span className={...}>`.

- [ ] **Step 2: StatTile** — `index` maps `trend` → icon name; `ui` layout `.stat`; compose `<Sparkline values={spark} />` inside ui or index (prefer index passes spark node or imports Sparkline in ui — **prefer compose Sparkline in `index` and pass `sparkSlot?: ReactNode` to ui** to keep ui free of widget imports).

- [ ] **Step 3: AppBarActions** — mostly pure; `ui` can hold markup, `index` re-exports.

- [ ] **Step 4: Stories** for all three under `Widgets/*`.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(widgets): add avatar, stat-tile, and app-bar-actions folders

EOF
)"
```

---

### Task 4: Dashboard container split

**Files:**
- Create: `src/components/widgets/dashboard/ui.tsx`
- Create: `src/components/widgets/dashboard/index.tsx`
- Create: `src/components/widgets/dashboard/dashboard.stories.tsx`
- Source: `src/app/(authenticated)/dashboard/html-dashboard.tsx` (441 lines, `'use client'`)

**Interfaces:**
- Consumes: `Avatar`, `StatTile`, `Donut`, `ProgressBar`, `AssignProgramModal`, dashboard query types
- Produces:

```ts
export type DashboardStatusCountsProp = DashboardStatusCounts & {
  programCompleted?: number;
};

export function Dashboard(props: {
  statusCounts: DashboardStatusCountsProp;
  needingAttention: UserNeedingAttention[];
  compliancePct: number;
}): React.ReactElement;
```

**Split:**
- `index.tsx`: `'use client'`; `useRouter`, `useState`, `useMemo`; helpers `pct`, `isUrgentAttention`, `attentionReason`; MOCK_* constants; build `legend`, `overdue`, `rows`; pass callbacks + derived data to `DashboardUi`.
- `ui.tsx`: entire JSX tree from current return; imports only UI widgets + `Icon` + modal; **no hooks**.

Props sketch for ui (expand as needed while porting):

```ts
interface DashboardUiProps {
  statusCounts: DashboardStatusCountsProp;
  compliancePct: number;
  rows: UserNeedingAttention[];
  overdue: UserNeedingAttention[];
  legend: Array<{ label: string; value: number; color: string }>;
  assignProgramUser: UserNeedingAttention | null;
  onAssignOpen: (user: UserNeedingAttention) => void;
  onAssignClose: () => void;
  onNavigateUser: (userId: string) => void;
  // plus any other handlers currently inline
}
```

- [ ] **Step 1: Port helpers + state into `index.tsx`; move JSX into `ui.tsx`.** Replace `Html*` imports with widgets paths. Rename export `HtmlDashboard` → `Dashboard`.

- [ ] **Step 2: Story with mock args** (empty needingAttention, sample statusCounts) under `Widgets/Dashboard`.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(widgets): move HtmlDashboard into widgets/dashboard folder

EOF
)"
```

---

### Task 5: Barrel + consumer import rewrite + delete old files

**Files:**
- Create: `src/components/widgets/index.ts`
- Modify: consumers listed in File map
- Delete: all `src/app/(authenticated)/dashboard/*` widget files

**Barrel:**

```ts
export { Avatar } from './avatar';
export { Donut } from './donut';
export { Sparkline } from './sparkline';
export { ProgressBar } from './progress-bar';
export { StatTile } from './stat-tile';
export { Dashboard } from './dashboard';
export { DashboardAppBarActions } from './app-bar-actions';
export {
  avatarTone,
  initialsFromName,
  getGreeting,
  formatDashboardSubtitle,
} from './utils';
```

- [ ] **Step 1: Update `page.tsx`**

```ts
import { AppBar } from '@/components/medvanta/shell';
import {
  Dashboard,
  DashboardAppBarActions,
  formatDashboardSubtitle,
  getGreeting,
} from '@/components/widgets';
// ...
<DashboardAppBarActions />
<Dashboard statusCounts={...} compliancePct={...} needingAttention={...} />
```

- [ ] **Step 2: Update remaining consumers**

| File | Old | New |
|------|-----|-----|
| `html-program-tab.tsx` | `HtmlProgressBar` from dashboard | `ProgressBar` from `@/components/widgets/progress-bar` |
| `html-onboarding-tab.tsx` | `HtmlAvatar` from dashboard | `Avatar` from `@/components/widgets/avatar` |
| `member-notes-tab.tsx` | same | same |

- [ ] **Step 3: Delete old dashboard widget files** (entire folder if empty).

- [ ] **Step 4: Grep for stale paths**

```bash
grep -RniE 'dashboard/html-|HtmlStatTile|HtmlDonut|HtmlSparkline|HtmlProgressBar|HtmlDashboard|from \\./html-' src || true
```

Expect: no hits except possibly comments; `users/html-helpers` `HtmlAvatar` must remain.

- [ ] **Step 5: Typecheck**

```bash
corepack pnpm --config.engine-strict=false exec tsc --noEmit
```

Expected: PASS (0 errors).

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(widgets): rewire consumers and remove dashboard html-* files

EOF
)"
```

---

### Task 6: Verification

- [ ] **Step 1: ESLint touched paths**

```bash
corepack pnpm --config.engine-strict=false exec eslint \
  src/components/widgets \
  'src/app/(authenticated)/page.tsx'
```

- [ ] **Step 2: Confirm Storybook titles exist** — files under `Widgets/*` for all seven widgets.

- [ ] **Step 3: Final commit only if verification fixed anything**; otherwise done.

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Target tree under `widgets/` | 1–4 |
| `ui` / `index` / stories split | 2–4 |
| `utils.ts` move | 1 |
| Rename drop `Html` + import updates | 5 |
| Delete old dashboard widgets | 5 |
| No MedVanta/shadcn migration | — |
| No avatar unification | — |
| Success: tsc + stories present | 5–6 |

## Self-review notes

- ProgressBar / Avatar names collide with MedVanta **only if** both barrels imported with same binding — consumers use path or widgets barrel; OK.
- StatTile keeps UI free of Sparkline via `sparkSlot` composition in index.
- Dashboard stays client in `index.tsx`; page remains RSC data owner.
