# Member Profile Re-wire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Spec: `docs/superpowers/specs/2026-08-18-member-profile-rewire-design.md`
> Worktree: `.scratch/worktrees/afk-integrate`
> HTML source: `/home/jose-carmona/Proyectos/vantaverse-admin-root/VantaThrive-admin-MedVanta-rebuild-v6.html` (`scMemberDetail`, `programAwaitingPane`)
> Tokens: `src/styles/medvanta-tokens.css`

**Goal:** Wire existing member-profile data into MedVanta HTML chrome — insights rail (VantaPoints, Empowerment, Pledge, Adherence), due/overdue SLA modes, and real Program week/day schedule — using design-system color tokens only.

**Architecture:** Pure helpers (`program-sla.ts`, `program-week.ts`) derive SLA mode and week/adherence from schedule + completion. Four MedVanta insight cards render the HTML rail. `ui.tsx` passes page props into Onboarding/Program tabs and header. No new RPCs.

**Tech Stack:** Next.js App Router, React 19, TypeScript, MedVanta CSS tokens/classes (`.card`, `.bdg`, `.pb`, `.sla`, `.wstrip`/`.wk`), Node.js built-in test runner (`node --experimental-strip-types --test` + `node:test`/`node:assert` — no Vitest in this repo), pnpm.

## Global Constraints

- Source of truth: HTML `scMemberDetail` / `programAwaitingPane` + approved spec.
- No new Postgres RPCs / Edge Functions.
- No remote `git push` unless user asks.
- Explicit return types; no `any`; named exports; `function` for components.
- Prefer MedVanta tokens/classes over hex/rgb inventiveness.
- **Color rules (design system):**
  - VantaPoints: solid `var(--navy-900)` + cyan radial accent (`color-mix` with `var(--cyan-500)`); progress bar `var(--cyan-400)`. **Never** purple/violet gradient; **never** `--brand-gradient` behind body content.
  - Due SLA: monotone navy/slate (`var(--navy-50)`, `var(--navy-600)`, `var(--text-muted)`). Not red.
  - Overdue: `var(--danger)` / `var(--danger-soft)` / `bdg-d` only.
  - Positive/neutral status: navy (`bdg-b`, `--navy-600`), not green/amber rainbow.
  - Progress bars for adherence/empowerment: `.pb.pb-n` (navy), not red for low %.
  - No rainbow avatars; use existing `HtmlAvatar`.
- Revive `parseCompletion` / `getDayDate` logic from deleted `program-status/card-utils.ts` (commit before `7aafd82`) into `program-week.ts` — do **not** revive `getProgressColor` red→green lerp.
- Extend/Reassign owner stay disabled + `toastUnavailable` / title placeholder.
- Notes tab / intake full editor / admin profile: out of scope.
- Verify per task: `corepack pnpm --config.engine-strict=false exec eslint <touched-files>`
- Commit after each task with conventional message.

## File map

| File | Responsibility |
|------|----------------|
| `partials/program-sla.ts` | `getProgramSlaMode`, working-day label helpers |
| `partials/program-week.ts` | parseCompletion, current week, strip days, day plan, adherence ratios |
| `partials/insights/vantapoints-card.tsx` | Navy VantaPoints card |
| `partials/insights/empowerment-card.tsx` | Empowerment compact card |
| `partials/insights/pledge-card.tsx` | Pledge + expand modal |
| `partials/insights/adherence-card.tsx` | Adherence vs Pre-program engagement |
| `html-onboarding-tab.tsx` | Compose insights rail |
| `html-program-tab.tsx` | Awaiting due/overdue fidelity + active real week |
| `member-detail-header.tsx` | Due/overdue badges |
| `ui.tsx` | Pass props |
| `partials/program-sla.test.ts` | Unit tests |
| `partials/program-week.test.ts` | Unit tests |

---

### Task 1: `program-sla` helper + tests

**Files:**
- Create: `src/app/(authenticated)/users/[id]/partials/program-sla.ts`
- Create: `src/app/(authenticated)/users/[id]/partials/program-sla.test.ts`

**Interfaces:**
- Produces:

```ts
export type ProgramSlaMode = 'assigned' | 'due' | 'overdue' | 'none';

export function getProgramSlaMode(args: {
  programDueDate: string | null | undefined;
  hasAssignment: boolean;
  now?: Date;
}): ProgramSlaMode;

/** Best-effort calendar-day label; document that working-day calc is approximate. */
export function formatDueLabel(args: {
  programDueDate: string;
  mode: 'due' | 'overdue';
  now?: Date;
}): { pct: number; label: string; dueText: string };
```

- [ ] **Step 1: Write failing tests**

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getProgramSlaMode, formatDueLabel } from './program-sla.ts';

describe('getProgramSlaMode', () => {
  const now = new Date('2026-08-18T12:00:00');

  it('returns assigned when hasAssignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-01',
        hasAssignment: true,
        now,
      }),
      'assigned',
    );
  });

  it('returns overdue when past due and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-01',
        hasAssignment: false,
        now,
      }),
      'overdue',
    );
  });

  it('returns due when future due and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-25',
        hasAssignment: false,
        now,
      }),
      'due',
    );
  });

  it('returns none when no due date and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: null,
        hasAssignment: false,
        now,
      }),
      'none',
    );
  });
});

describe('formatDueLabel', () => {
  it('includes overdue wording when mode overdue', () => {
    const r = formatDueLabel({
      programDueDate: '2026-08-01',
      mode: 'overdue',
      now: new Date('2026-08-18T12:00:00'),
    });
    assert.match(r.label.toLowerCase(), /overdue|past/);
    assert.ok(r.pct > 0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/jose-carmona/Proyectos/vantaverse-admin-root/vantaverse-admin/.scratch/worktrees/afk-integrate
node --experimental-strip-types --test \
  'src/app/(authenticated)/users/[id]/partials/program-sla.test.ts'
```

- [ ] **Step 3: Implement `program-sla.ts`**

Parse `YYYY-MM-DD` as local date. Invalid/empty date + no assignment → `none`. `formatDueLabel`: calendar days between now and due; overdue `pct` clamp 100; due `pct` = progress toward 5-day window or days elapsed/remaining heuristic (document in JSDoc).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Lint + commit**

```bash
corepack pnpm --config.engine-strict=false exec eslint \
  'src/app/(authenticated)/users/[id]/partials/program-sla.ts' \
  'src/app/(authenticated)/users/[id]/partials/program-sla.test.ts'
git add src/app/\(authenticated\)/users/\[id\]/partials/program-sla.ts \
  src/app/\(authenticated\)/users/\[id\]/partials/program-sla.test.ts
git commit -m "$(cat <<'EOF'
feat(users): add program SLA mode helpers for member profile

EOF
)"
```

---

### Task 2: `program-week` helpers + tests

**Files:**
- Create: `src/app/(authenticated)/users/[id]/partials/program-week.ts`
- Create: `src/app/(authenticated)/users/[id]/partials/program-week.test.ts`

**Interfaces:**
- Consumes: `DatabaseSchedule` from `@/app/(authenticated)/builder/[id]/workout-schedule/utils`
- Produces:

```ts
export type CompletionDay = {
  status: 'complete' | 'incomplete';
  started_at: string;
  total_sets: number;
  current_set: number;
  completed_at: string | null;
} | null;

export type WeekDayState = 'done' | 'today' | 'todo' | 'rest';

export interface WeekStripDay {
  label: string; // Mon…Sun
  dateLabel: string;
  state: WeekDayState;
  currentSets: number;
  totalSets: number;
  dayIndex: number;
}

export interface DayPlanBlock {
  title: string;
  items: string[];
}

export interface AdherencePeriod {
  label: string;
  doneSessions: number;
  expectedSessions: number;
  pct: number;
}

export function parseCompletion(
  completion: Array<Array<unknown>> | null | undefined,
): Array<Array<CompletionDay>>;

export function getCurrentWeekIndex(args: {
  startDate: string | null | undefined;
  weekCount: number;
  now?: Date;
}): number;

export function buildWeekStrip(args: {
  schedule: DatabaseSchedule | null;
  completion: Array<Array<CompletionDay>>;
  startDate: string | null | undefined;
  weekIndex: number;
  now?: Date;
}): WeekStripDay[];

export function buildDayPlan(args: {
  schedule: DatabaseSchedule | null;
  weekIndex: number;
  dayIndex: number;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
}): DayPlanBlock[];

export function buildAdherencePeriods(args: {
  schedule: DatabaseSchedule | null;
  completion: Array<Array<CompletionDay>>;
  weekIndex: number;
}): AdherencePeriod[]; // This week, Last week, 4-week average
```

**Session-day definition (spec):** expected session day = schedule day with ≥1 set/exercise entry. Done if completion day `status === 'complete'` OR (`total_sets > 0` && `current_set >= total_sets`). Omit missing weeks from 4-week average (do not zero-pad).

- [ ] **Step 1: Write failing tests** covering parseCompletion, week index, strip rest vs done, adherence this week.

- [ ] **Step 2: Run — expect FAIL**

```bash
node --experimental-strip-types --test \
  'src/app/(authenticated)/users/[id]/partials/program-week.test.ts'
```

- [ ] **Step 3: Implement** — port `parseCompletion` / `getDayDate` from `git show '7aafd82^:…/card-utils.ts'`. Resolve exercise/group names like deleted program-status day cards. Count sets from schedule day exercises array length (or nested set counts if present in day shape — inspect `DatabaseScheduleDay` in utils).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Lint + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): add program week strip and adherence helpers

EOF
)"
```

---

### Task 3: Insight cards (VantaPoints, Empowerment, Pledge, Adherence)

**Files:**
- Create: `…/partials/insights/vantapoints-card.tsx`
- Create: `…/partials/insights/empowerment-card.tsx`
- Create: `…/partials/insights/pledge-card.tsx`
- Create: `…/partials/insights/adherence-card.tsx`

**Interfaces:**
- Consumes: `HabitPledge`, `AdherencePeriod`, profile stats fields
- Produces: named card components matching HTML `scMemberDetail` insights markup + color rules

**Color checklist (must follow Global Constraints):**
- VantaPoints: `--navy-900` bg, cyan radial, label `--cyan-200`/`--cyan-300`, bar `--cyan-400`
- Empowerment/Pledge: white `.card`, icons `--navy-600`, signed check `--navy-600` (not green)
- Adherence bars: `.pb.pb-4.pb-n`
- Pre-program: same card chrome; only rows with real data (omit App opens)

- [ ] **Step 1: Implement four cards** mirroring HTML structure (inline styles with CSS vars like existing tabs).

VantaPoints props example:

```tsx
interface VantapointsCardProps {
  level: number | null;
  hpPoints: number | null;
  pointsForNextLevel: number | null;
  pointsMissingForNextLevel: number | null;
}
```

Pledge: `habitPledge: HabitPledge | null`; View opens Radix dialog showing text + photo/signature `image_url` (Next/Image or img).

Adherence: `variant: 'assigned' | 'preprogram'`; `periods: AdherencePeriod[]` or preprogram rows `{ label, value, pct }[]`.

- [ ] **Step 2: Lint insight files**

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): add MedVanta insight cards for member profile rail

EOF
)"
```

---

### Task 4: Wire Onboarding tab insights rail

**Files:**
- Modify: `src/app/(authenticated)/users/[id]/partials/html-onboarding-tab.tsx`
- Modify: `src/app/(authenticated)/users/[id]/ui.tsx` (pass new props only as needed for onboarding)

**Interfaces:**
- Consumes: insight cards + `getProgramSlaMode` / adherence from Task 2 when assigned

- [ ] **Step 1: Extend `HtmlOnboardingTab` props** with `habitPledge`, HP/IP-related fields already on page, `schedule`, `completion`, `programAssignment`, maps as needed for adherence.

- [ ] **Step 2: Replace thin InsightCards** with HTML rail composition (VantaPoints → g2 Empowerment+Pledge → Adherence/Pre-program).

- [ ] **Step 3: Pass props from `ui.tsx`**

- [ ] **Step 4: Lint + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): wire onboarding insights rail with real profile data

EOF
)"
```

---

### Task 5: Program tab — awaiting due/overdue + active week/day

**Files:**
- Modify: `src/app/(authenticated)/users/[id]/partials/html-program-tab.tsx`
- Modify: `src/app/(authenticated)/users/[id]/ui.tsx`

- [ ] **Step 1: Expand `HtmlProgramTab` props** — `schedule`, `completion`, `exerciseNamesMap`, `groupsMap`, `programAssignment`, `compliance`.

- [ ] **Step 2: Rewrite `ProgramAwaitingPane`** to match HTML `programAwaitingPane(overdue)`:
  - Icon box: overdue → danger-soft; due → navy-50
  - Title, `bdg` / `bdg-d`, SLA bar (danger fill only if overdue)
  - Assign enabled; Extend/Reassign disabled
  - Shortcuts card OK to keep simplified

- [ ] **Step 3: Rewrite `ProgramActivePane`** — remove MOCK_*; use `buildWeekStrip` / `buildDayPlan`; selectable day state; meta Completion + Adherence; compliance from prop/`user.program_completion_percentage`.

- [ ] **Step 4: Lint + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): wire program tab week strip and due/overdue awaiting pane

EOF
)"
```

---

### Task 6: Header + tab badge SLA + color audit

**Files:**
- Modify: `src/app/(authenticated)/users/[id]/partials/member-detail-header.tsx`
- Modify: `src/app/(authenticated)/users/[id]/ui.tsx`
- Optionally touch: onboarding/program insight files if audit finds token violations

- [ ] **Step 1: Header badges** via `getProgramSlaMode`:
  - `overdue` → `bdg bdg-d` + CircleAlert (“Program overdue” / days if easy)
  - `due` → monotone `bdg` + Hourglass (“Program due” / due date) — **not** `bdg-d`
  - `assigned` / `none` → no SLA program badge

- [ ] **Step 2: Tab `cnt`** already partially wired — ensure due shows `not assigned` (not overdue red); overdue uses danger-soft cnt.

- [ ] **Step 3: Color audit** on all member-profile files touched in this plan:

```bash
# Fail if purple/violet hex or brand-gradient used in profile partials
grep -RniE 'purple|violet|#7c3aed|#8b5cf6|brand-gradient|oklch\(.*0\.[78].*280' \
  'src/app/(authenticated)/users/[id]/partials' \
  'src/app/(authenticated)/users/[id]/ui.tsx' || true
```

Fix any hits to MedVanta tokens. Confirm overdue-only red; VantaPoints navy+cyan.

- [ ] **Step 4: Lint all touched profile files + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): align member header SLA badges and design-system colors

EOF
)"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Insights VantaPoints / Empowerment / Pledge / Adherence | 3, 4 |
| Due vs overdue modes | 1, 5, 6 |
| Real week/day schedule | 2, 5 |
| Wire ui props | 4, 5, 6 |
| No SLA mutations | 5 |
| Design-system colors | Global + 3 + 6 |
| Admin / Notes / intake out of scope | — |

## Self-review notes

- Adherence math explicit in Task 2 interfaces.
- `getProgressColor` intentionally not ported (violates color rules).
- Working-day labels are best-effort calendar days (documented).
