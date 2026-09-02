# MedVanta UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Fly-loop:** Seed frontier from **Appendix A**. Spec: `docs/superpowers/specs/2026-08-17-medvanta-ui-migration-design.md` (repo root `vantaverse-admin-root`). All code changes land in `vantaverse-admin/` (git root).

**Goal:** Port MedVanta design-system tokens + 25 primitives with Storybook into `vantaverse-admin`, then restyle in-scope pages/modals to match `VantaThrive-admin-MedVanta-rebuild-v6.html` using existing data—skipping features listed in `medvanta-ui-missing-features.md`.

**Architecture:** Parallel library at `src/components/medvanta/` (Approach A). Tokens as CSS variables imported by Next + Storybook. Primitives are presentational (no Supabase). Pages keep existing hooks; swap chrome to MedVanta. Prefer Tailwind + CSS vars; use existing Radix for Dialog/Tooltip/Tabs/Checkbox accessibility when styling to MedVanta.

**Tech Stack:** Next.js 16.1.1, React 19, Tailwind 4, Radix UI, CVA/clsx/tailwind-merge, lucide-react, Storybook 8, pnpm, TypeScript.

## Global Constraints

- Work only inside `vantaverse-admin/` for commits; read sources from sibling folders under `vantaverse-admin-root/`.
- Do **not** invent backends for: OTP MedVanta, clinical notes, group scheduling/settings, saved replies/attachments, dashboard funnel/activity, bulk members ops beyond invite/CSV, program duplicate/archive/push-schedule, partner exercise import, saved blocks, review&assign wizard, SLA mutations.
- Hide/omit HTML controls for those features; do not stub interactive empty UI.
- Keep `src/components/ui/` until a screen migrates; do not mass-replace all shadcn imports in one task.
- Icons via `lucide-react` (PascalCase names for DS `Icon` wrapper).
- Package manager: `pnpm` (`pnpm-lock.yaml`).
- Commits on feature/AFK branch only; never force-push `develop`/`main`.

## File map (create / modify)

| Path | Responsibility |
|------|----------------|
| `src/styles/medvanta-tokens.css` | Copied/adapted DS tokens |
| `src/app/globals.css` | `@import` tokens; map theme aliases if needed |
| `.storybook/*` | Storybook 8 config + preview with tokens |
| `src/components/medvanta/**` | 25 primitives + stories + barrel |
| `src/components/sidebar/*`, `header/*`, `page-wrapper.tsx` | Shell restyle |
| App pages under `src/app/(authenticated)/**` | In-scope page restyles |
| Modal files listed in Tasks 12–13 | Modal restyles |
| `package.json` | storybook scripts + deps |

**Source of truth for visuals/API:** `../MedVanta Design System/components/**/*.{jsx,d.ts,prompt.md}` and HTML rebuild. Port behavior from `.d.ts`; implement with Tailwind/Radix, not CDN Babel demos.

---

### Task 1: Tokens + Storybook bootstrap + medvanta scaffold

**Files:**
- Create: `src/styles/medvanta-tokens.css`
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `src/components/medvanta/index.ts`
- Create: `src/components/medvanta/utils/cn.ts` (re-export `@/lib/utils` `cn` or thin wrapper)
- Modify: `src/app/globals.css` (add token import after `@import 'tailwindcss'`)
- Modify: `package.json` (scripts + Storybook deps)

**Interfaces:**
- Consumes: DS files `MedVanta Design System/tokens/{fonts,colors,typography,spacing,base}.css`, `styles.css`
- Produces: CSS variables `--navy-*`, `--cyan-*`, `--slate-*`, semantic `--bg-app`, `--primary`, `--accent`, `--radius-pill`, etc. available in app + Storybook; empty barrel `export {}` until Task 2

- [ ] **Step 1: Copy tokens into the admin app**

From repo root `vantaverse-admin-root`, run inside admin:

```bash
cd vantaverse-admin
mkdir -p src/styles
# Concatenate DS token sheets into one file (preserve order: fonts → colors → typography → spacing → base)
cat "../MedVanta Design System/tokens/fonts.css" \
    "../MedVanta Design System/tokens/colors.css" \
    "../MedVanta Design System/tokens/typography.css" \
    "../MedVanta Design System/tokens/spacing.css" \
    "../MedVanta Design System/tokens/base.css" \
  > src/styles/medvanta-tokens.css
```

If `fonts.css` uses Google Fonts `@import`, keep it for Storybook; for Next, prefer `next/font` later—do **not** block Wave 0 on font hosting. Ensure file starts with a comment:

```css
/* MedVanta tokens — sourced from MedVanta Design System/tokens */
```

- [ ] **Step 2: Import tokens in globals.css**

At the top of `src/app/globals.css`, immediately after `@import 'tailwindcss';`, add:

```css
@import '../styles/medvanta-tokens.css';
```

- [ ] **Step 3: Install Storybook 8 and add scripts**

```bash
cd vantaverse-admin
pnpm dlx storybook@8 init --yes --builder vite --type nextjs
```

If interactive prompts appear, choose Next.js + Vite. Then ensure `package.json` contains:

```json
"scripts": {
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

- [ ] **Step 4: Wire preview to tokens**

`.storybook/preview.ts`:

```ts
import type { Preview } from '@storybook/nextjs';
import '../src/styles/medvanta-tokens.css';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
```

- [ ] **Step 5: Scaffold barrel**

`src/components/medvanta/index.ts`:

```ts
/** MedVanta design-system primitives. Prefer these for migrated screens. */
export {};
```

`src/components/medvanta/utils/cn.ts`:

```ts
export { cn } from '@/lib/utils';
```

- [ ] **Step 6: Verify Storybook boots**

```bash
cd vantaverse-admin
pnpm exec storybook build --quiet
```

Expected: exit 0 (or Storybook empty build success). If `storybook build` fails on missing stories, add a placeholder story in Task 2 first then re-run.

- [ ] **Step 7: Commit**

```bash
cd vantaverse-admin
git add src/styles/medvanta-tokens.css src/app/globals.css src/components/medvanta .storybook package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(medvanta): add tokens, Storybook scaffold, and medvanta barrel

EOF
)"
```

---

### Task 2: Actions — Icon, Button, IconButton + stories

**Files:**
- Create: `src/components/medvanta/actions/Icon.tsx`
- Create: `src/components/medvanta/actions/Button.tsx`
- Create: `src/components/medvanta/actions/IconButton.tsx`
- Create: `src/components/medvanta/actions/Icon.stories.tsx`
- Create: `src/components/medvanta/actions/Button.stories.tsx`
- Create: `src/components/medvanta/actions/IconButton.stories.tsx`
- Modify: `src/components/medvanta/index.ts`

**Interfaces:**
- Consumes: Task 1 tokens + `cn`; DS `Button.d.ts`, `Icon.d.ts`, `IconButton.d.ts`
- Produces:

```ts
export function Icon(props: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}): JSX.Element;

export function Button(props: {
  children?: React.ReactNode;
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}): JSX.Element;

export function IconButton(props: {
  icon: string;
  variant?: 'ghost' | 'secondary' | 'primary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
  label?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}): JSX.Element;
```

- [ ] **Step 1: Write a failing Storybook/render smoke for Button**

Create `Button.stories.tsx` first that imports `Button` from `./Button` (file not yet created—TypeScript/story will fail until Step 3):

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './Button';

const meta = {
  title: 'MedVanta/Actions/Button',
  component: Button,
  args: { children: 'Continue', variant: 'primary', size: 'md' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Accent: Story = { args: { variant: 'accent' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Loading: Story = { args: { loading: true } };
```

- [ ] **Step 2: Confirm import fails / story missing module**

```bash
cd vantaverse-admin
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

Expected: error resolving `./Button` or equivalent.

- [ ] **Step 3: Implement Icon**

`Icon.tsx` — resolve Lucide by dynamic name:

```tsx
'use client';

import * as Lucide from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { cn } from '../utils/cn';

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, strokeWidth = 2, className, style }: IconProps) {
  const Comp = (Lucide as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Comp) return null;
  return <Comp size={size} strokeWidth={strokeWidth} className={cn(className)} style={style} aria-hidden />;
}
```

- [ ] **Step 4: Implement Button and IconButton**

Port visual contract from `MedVanta Design System/components/actions/Button.jsx` / `IconButton.jsx` using Tailwind classes bound to MedVanta CSS vars, e.g. primary → `bg-[var(--primary)] text-[var(--text-inverse)] rounded-[var(--radius-pill)]`, accent → cyan tokens, sizes sm/md/lg matching DS heights 32/40/48. Use `Icon` for `iconLeft`/`iconRight`/`loading` (`LoaderCircle`). Accept `className` in addition to DS props.

Reference implementation shape for Button (complete in file; match DS variants exactly):

```tsx
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { Icon } from './Icon';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-[var(--radius-pill)] transition-transform active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)]',
        accent: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]',
        secondary: 'bg-transparent border border-[var(--border-default)] text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
        ghost: 'bg-transparent text-[var(--text-body)] hover:bg-[var(--bg-subtle)]',
        danger: 'bg-[var(--danger)] text-[var(--text-inverse)] hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3.5 text-[length:var(--text-sm)] gap-1.5',
        md: 'h-10 px-[18px] text-[length:var(--text-md)] gap-2',
        lg: 'h-12 px-6 text-[length:var(--text-base)] gap-2.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    iconLeft?: string;
    iconRight?: string;
    fullWidth?: boolean;
    loading?: boolean;
  };

export function Button({
  children, variant, size, iconLeft, iconRight, fullWidth, loading, disabled, className, type = 'button', ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Icon name="LoaderCircle" size={iconSize} className="animate-spin" /> : iconLeft ? <Icon name={iconLeft} size={iconSize} /> : null}
      {children}
      {!loading && iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}
```

Implement `IconButton` with same token language; `aria-label={label}`; shapes `circle` | `rounded`.

- [ ] **Step 5: Stories for Icon and IconButton; export barrel**

```ts
// index.ts
export { Icon } from './actions/Icon';
export type { IconProps } from './actions/Icon';
export { Button } from './actions/Button';
export type { ButtonProps } from './actions/Button';
export { IconButton } from './actions/IconButton';
export type { IconButtonProps } from './actions/IconButton';
```

- [ ] **Step 6: Verify**

```bash
cd vantaverse-admin
pnpm exec storybook build --quiet
pnpm lint
```

Expected: build OK; lint clean on new files.

- [ ] **Step 7: Commit**

```bash
git add src/components/medvanta
git commit -m "$(cat <<'EOF'
feat(medvanta): add Icon, Button, IconButton with Storybook

EOF
)"
```

---

### Task 3: Forms primitives + stories

**Files:**
- Create: `src/components/medvanta/forms/{Input,Textarea,Select,Checkbox,Radio,Switch,FormField}.tsx`
- Create: matching `*.stories.tsx` for each
- Modify: `src/components/medvanta/index.ts`

**Interfaces:**
- Consumes: `Icon`, tokens, `cn`
- Produces exports matching DS `.d.ts` for:

```ts
InputProps: { value?, defaultValue?, placeholder?, type?, iconLeft?, iconRight?, size?: 'sm'|'md'|'lg', invalid?, disabled?, onChange?, className?, style? }
TextareaProps: { value?, defaultValue?, placeholder?, rows?, disabled?, invalid?, onChange?, className?, style? }
SelectOption: { value: string; label: string }
SelectProps: { value?, defaultValue?, options?: (string|SelectOption)[], placeholder?, size?, disabled?, invalid?, onChange?, className?, style? }
CheckboxProps: { checked?, defaultChecked?, label?, disabled?, onChange?: (checked: boolean) => void, className?, style? }
RadioProps: { checked?, defaultChecked?, label?, name?, value?, disabled?, onChange?: (value?: string) => void, className?, style? }
SwitchProps: { checked?, defaultChecked?, label?, disabled?, onChange?: (checked: boolean) => void, className?, style? }
FormFieldProps: { label?, htmlFor?, hint?, error?, required?, children?, className?, style? }
```

Use `@radix-ui/react-checkbox` for Checkbox if already available; native `<select>` OK for Select to match DS. Cyan checked state via `--accent`.

- [ ] **Step 1: Add FormField + Input stories (failing imports)**

Stories titled `MedVanta/Forms/Input`, `MedVanta/Forms/FormField` importing local modules.

- [ ] **Step 2: Implement all seven form components**

Read each `MedVanta Design System/components/forms/*.jsx` for spacing/radius; implement with Tailwind + CSS vars. FormField renders label, required asterisk, children, then `error` (danger) or `hint` (muted).

- [ ] **Step 3: Export from barrel; add remaining stories**

Cover: Input sizes, invalid, with icons; Select with options; Checkbox/Radio/Switch checked+disabled; Textarea rows; FormField with error.

- [ ] **Step 4: Verify**

```bash
cd vantaverse-admin
pnpm exec storybook build --quiet
pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components/medvanta/forms src/components/medvanta/index.ts
git commit -m "$(cat <<'EOF'
feat(medvanta): add form primitives with Storybook

EOF
)"
```

---

### Task 4: Data-display primitives + stories

**Files:**
- Create: `src/components/medvanta/data-display/{Avatar,Badge,Card,StatCard,Table,Tag}.tsx` (`CardHeader` may live in `Card.tsx`)
- Create: `*.stories.tsx`
- Modify: `index.ts`

**Interfaces:**
- Produces DS APIs:

```ts
AvatarProps: { name?, src?, size?: 'sm'|'md'|'lg', status?: 'online'|'away'|'offline', className?, style? }
BadgeProps: { children?, tone?: 'neutral'|'brand'|'accent'|'success'|'warning'|'danger', dot?, className?, style? }
CardProps: { children?, padding?: number, interactive?, onClick?, className?, style? }
CardHeaderProps: { title?, subtitle?, action?, className?, style? }
StatCardProps: { label: string; value: React.ReactNode; delta?, trend?: 'up'|'down'|'flat', icon?, accent?, spark?, sparkId?, className?, style? }
TableColumn: { key: string; header: React.ReactNode; width?, align?: 'left'|'center'|'right', render?: (row: any) => React.ReactNode }
TableProps: { columns?, rows?, onRowClick?, className?, style? }
TagProps: { children?, onRemove?, tone?: 'neutral'|'accent', className?, style? }
```

StatCard sparkline: simple SVG polyline; if `spark` omitted, omit chart. Avatar: initials from `name` when no `src`.

- [ ] **Step 1: Implement Card + CardHeader + stories**
- [ ] **Step 2: Implement Badge, Tag, Avatar + stories**
- [ ] **Step 3: Implement StatCard + Table + stories**
- [ ] **Step 4: Barrel exports + verify storybook build + lint**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(medvanta): add data-display primitives with Storybook

EOF
)"
```

---

### Task 5: Feedback primitives + stories

**Files:**
- Create: `src/components/medvanta/feedback/{Alert,Dialog,ProgressBar,Tooltip}.tsx` + stories
- Modify: `index.ts`

**Interfaces:**

```ts
AlertProps: { kind?: 'info'|'success'|'warning'|'danger', title?, children?, onClose?, className?, style? }
DialogProps: { open?, title?, children?, footer?, onClose?, width?, className?, style? }
ProgressBarProps: { value?, max?, tone?: 'accent'|'brand'|'success'|'warning', showLabel?, height?, className?, style? }
TooltipProps: { label: React.ReactNode, placement?: 'top'|'bottom'|'left'|'right', children?, className?, style? }
```

Implement `Dialog` on `@radix-ui/react-dialog` and `Tooltip` on `@radix-ui/react-tooltip` with MedVanta radii (`--radius-xl` ~24px modal), scrim, footer slot. `ProgressBar` can wrap `@radix-ui/react-progress`.

- [ ] **Step 1: Implement Alert + ProgressBar + stories**
- [ ] **Step 2: Implement Dialog + Tooltip with Radix + stories**
- [ ] **Step 3: Export + `pnpm exec storybook build --quiet` + lint**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(medvanta): add feedback primitives with Storybook

EOF
)"
```

---

### Task 6: Navigation primitives + stories

**Files:**
- Create: `src/components/medvanta/navigation/{Tabs,Breadcrumb,SidebarNavItem,Pagination}.tsx` + stories
- Modify: `index.ts`

**Interfaces:**

```ts
TabItem: { id: string; label: React.ReactNode }
TabsProps: { tabs?, value?, defaultValue?, onChange?: (id: string) => void, className?, style? }
Crumb: { label: React.ReactNode; href?: string }
BreadcrumbProps: { items?, className?, style? }
SidebarNavItemProps: { icon: string; label: React.ReactNode; active?, badge?, collapsed?, onClick?, className?, style? }
PaginationProps: { page?, pageCount?, onChange?: (page: number) => void, className?, style? }
```

Tabs: underline style per DS; may use `@radix-ui/react-tabs`. SidebarNavItem: navy active + cyan accent per DS JSX.

- [ ] **Step 1: Implement all four + stories**
- [ ] **Step 2: Ensure barrel exports **all 25** primitives from Tasks 2–6**
- [ ] **Step 3: Verify**

```bash
cd vantaverse-admin
pnpm exec storybook build --quiet
pnpm lint
```

Confirm Storybook sidebar groups: Actions, Forms, Data display, Feedback, Navigation.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(medvanta): add navigation primitives; complete primitive set

EOF
)"
```

---

### Task 7: Admin shell restyle (sidebar, header, page chrome)

**Files:**
- Modify: `src/components/sidebar/sidebar.tsx`
- Modify: `src/components/header/*` (as present)
- Modify: `src/components/page-wrapper.tsx`
- Optionally create: `src/components/medvanta/shell/AdminShell.tsx` if composition helps—prefer updating existing shell to consume `SidebarNavItem`, tokens, `Button`/`IconButton`

**Interfaces:**
- Consumes: `SidebarNavItem`, `Icon`, `IconButton`, `Breadcrumb`, tokens
- Produces: Authenticated chrome matching HTML left rail (navy/collapsed states) without changing route map

- [ ] **Step 1: Read current shell and HTML/nav structure**

```bash
cd vantaverse-admin
# open sidebar.tsx + compare to HTML scDashboard chrome / DS ui_kits/admin/Shell.jsx
```

- [ ] **Step 2: Restyle sidebar nav rows via `SidebarNavItem`**

Replace bespoke nav row markup with:

```tsx
import { SidebarNavItem } from '@/components/medvanta';

<SidebarNavItem
  icon="LayoutDashboard"
  label="Dashboard"
  active={pathname === '/'}
  onClick={() => router.push('/')}
  collapsed={collapsed}
/>
```

Keep existing auth/org logic; only visual + MedVanta components.

- [ ] **Step 3: Restyle header + page-wrapper backgrounds to `--bg-app` / `--surface-card`**
- [ ] **Step 4: Manual verify**

```bash
pnpm dev
# Visit / — sidebar + header match MedVanta navy/cyan; no route regressions
```

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ui): restyle admin shell with MedVanta navigation

EOF
)"
```

---

### Task 8: Dashboard page restyle

**Files:**
- Modify: `src/app/(authenticated)/page.tsx` and/or `src/app/(authenticated)/dashboard/**`
- Modify: dashboard cards under `src/app/(authenticated)/` / components used by home (`status-counts-card.tsx`, `compliance-card.tsx`, `needing-attention-card.tsx`, etc.)

**Interfaces:**
- Consumes: `Card`, `CardHeader`, `StatCard`, `Badge`, `Button`, shell
- Produces: Dashboard using **existing** StatusCounts / Compliance / NeedingAttention data only
- **Out of scope:** onboarding funnel, 24h activity feed (omit; do not add empty sections)

- [ ] **Step 1: Inventory current dashboard widgets and data hooks**
- [ ] **Step 2: Restyle three existing cards with MedVanta `Card`/`StatCard`/`Badge`**
- [ ] **Step 3: Remove or avoid adding funnel/activity UI**
- [ ] **Step 4: Verify in browser against HTML dashboard KPI area (not funnel)**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(dashboard): restyle home cards with MedVanta primitives

EOF
)"
```

---

### Task 9: Users list + member profile restyle

**Files:**
- Modify: `src/app/(authenticated)/users/page.tsx`
- Modify: `src/app/(authenticated)/users/[id]/page.tsx` and partials
- Modify: `src/components/users/**` / table components as needed
- Touch invite modal only for shared styles if required; full modal pass is Task 12

**Interfaces:**
- Consumes: `Table`, `Tag`, `Badge`, `Avatar`, `Button`, `Tabs`, `Input`
- Produces: Members list + profile chrome matching HTML; intake remains read-only card; **no** clinical notes tab; due/overdue = badge/filter only if `program_due_date` exists—**no** SLA mutation buttons

- [ ] **Step 1: Restyle users table with MedVanta Table/Badge/Avatar**
- [ ] **Step 2: Restyle profile header + tabs; keep existing tabs/data**
- [ ] **Step 3: Ensure notes tab / intake survey modal / SLA actions are absent**
- [ ] **Step 4: Verify `/users` and `/users/[id]`**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(users): restyle members list and profile with MedVanta

EOF
)"
```

---

### Task 10: Groups list + detail restyle

**Files:**
- Modify: `src/app/(authenticated)/groups/page.tsx`
- Modify: `src/app/(authenticated)/groups/[id]/page.tsx` and children

**Interfaces:**
- Consumes: MedVanta table/card/tabs/button
- Produces: Groups UI for members/programs basics
- **Omit:** `groupSchedulingTab`, group settings (domain/logo/booking URLs)

- [ ] **Step 1: Restyle groups list**
- [ ] **Step 2: Restyle group detail; do not add Scheduling/Settings tabs**
- [ ] **Step 3: Verify `/groups`, `/groups/[id]`**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(groups): restyle groups list and detail with MedVanta

EOF
)"
```

---

### Task 11: Builder, Exercises, Messages (+ optional login visual)

**Files:**
- Modify: `src/app/(authenticated)/builder/page.tsx`, `builder/[id]/**` (layout chrome)
- Modify: `src/app/(authenticated)/exercises/**`
- Modify: `src/app/(authenticated)/messages/page.tsx`
- Optionally: `src/app/(public)/login/page.tsx` visual-only (keep SSO; no OTP flow)

**Interfaces:**
- Consumes: MedVanta primitives
- **Omit:** partner import, saved blocks, review&assign, saved replies, attachments, program duplicate/archive/push

- [ ] **Step 1: Restyle builder list + builder/[id] chrome without new template ops**
- [ ] **Step 2: Restyle exercises library chrome**
- [ ] **Step 3: Restyle messages inbox; plain compose only—hide saved reply/attach if present in HTML parity attempts**
- [ ] **Step 4: Optional login shell visual restyle without OTP**
- [ ] **Step 5: Verify routes `/builder`, `/builder/[id]`, `/exercises`, `/messages`**
- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(app): restyle builder, exercises, and messages with MedVanta

EOF
)"
```

---

### Task 12: In-scope modals restyle (batch A)

**Files:**
- Modify: `src/app/(authenticated)/users/users-table/components/add-user-modal.tsx`
- Modify: `src/app/(authenticated)/users/[id]/partials/assign-program-modal.tsx`
- Modify: `src/app/(authenticated)/users/[id]/partials/assign-group-modal.tsx`
- Modify: `src/app/(authenticated)/users/[id]/partials/change-onboarding-dialog.tsx`
- Modify: `src/app/(authenticated)/groups/add-members/add-members-modal.tsx`

**Interfaces:**
- Consumes: MedVanta `Dialog`, `Button`, `FormField`, `Input`, `Select`, `Alert`
- Produces: Visual parity with `mdInvite`, `mdAssignProgram`, `mdAssignGroup`, `mdChangeOnboarding`, `mdAddGroupMembers`
- Keep existing submit/mutation logic

- [ ] **Step 1: Wrap/restyle each modal header/body/footer with MedVanta Dialog + Button**
- [ ] **Step 2: Smoke-open each modal in `pnpm dev`**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(modals): restyle invite, assign, onboarding, add-members with MedVanta

EOF
)"
```

---

### Task 13: Exercise / day / derived modals restyle (batch B)

**Files:**
- Modify: `src/app/(authenticated)/exercises/exercise-library/partials/exercise-modal.tsx`
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/exercise-builder-modal.tsx`
- Modify: `src/app/(authenticated)/builder/[id]/workout-schedule/update-derived-dialog.tsx`

**Interfaces:**
- Consumes: MedVanta Dialog/forms
- Produces: Parity with `mdExercise`, `mdDayEditor`, `mdUpdateDerived`
- **Omit:** saved blocks UI; **do not** build `mdIntakeSurvey`

- [ ] **Step 1: Restyle three modals; strip any new “saved blocks” affordances**
- [ ] **Step 2: Verify open/save flows still work**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(modals): restyle exercise, day editor, and derived dialogs

EOF
)"
```

---

### Task 14: Wave-end verification + docs pointer

**Files:**
- Modify (optional): `vantaverse-admin/docs/UI_COMPONENTS.md` — short section “MedVanta primitives” pointing to `@/components/medvanta` + Storybook
- No product feature docs for skipped HTML features

- [ ] **Step 1: Run full verification**

```bash
cd vantaverse-admin
pnpm lint
pnpm exec storybook build --quiet
pnpm build
```

Expected: all three green. If `pnpm build` fails on pre-existing unrelated errors, document in commit message / HUMAN soft-ask; do not expand scope.

- [ ] **Step 2: Checklist against exclusions**

Confirm absent/hidden: OTP, notes, group scheduling/settings, funnel/activity, bulk ops beyond invite/CSV, review&assign, intake survey modal, partner import, saved blocks, saved replies/attachments.

- [ ] **Step 3: Commit docs if touched**

```bash
git commit -m "$(cat <<'EOF'
docs: document MedVanta component entry points

EOF
)"
```

---

## Appendix A — Fly-loop frontier mapping

Use as `$ARGUMENTS` / PROTOCOL waves when running `/fly-loop`:

| Issue id | Wave | Plan tasks | Allowed paths (hint) |
|----------|------|------------|----------------------|
| `mv-tokens-storybook` | 0 | Task 1 | `src/styles/`, `.storybook/`, `package.json`, `src/components/medvanta/index.ts`, `globals.css` |
| `mv-actions` | 1 | Task 2 | `src/components/medvanta/actions/` |
| `mv-forms` | 1 | Task 3 | `src/components/medvanta/forms/` |
| `mv-data-display` | 2 | Task 4 | `src/components/medvanta/data-display/` |
| `mv-feedback` | 2 | Task 5 | `src/components/medvanta/feedback/` |
| `mv-navigation` | 2 | Task 6 | `src/components/medvanta/navigation/` |
| `mv-shell` | 3 | Task 7 | `src/components/sidebar/`, `header/`, `page-wrapper.tsx` |
| `mv-dashboard` | 4 | Task 8 | dashboard/home cards + `(authenticated)/page.tsx` |
| `mv-users` | 4 | Task 9 | `src/app/(authenticated)/users/**`, `src/components/users/**` |
| `mv-groups` | 4 | Task 10 | `src/app/(authenticated)/groups/**` |
| `mv-builder-exercises-messages` | 5 | Task 11 | `builder/**`, `exercises/**`, `messages/**`, optional `login/**` |
| `mv-modals-a` | 6 | Task 12 | listed user/group modals |
| `mv-modals-b` | 6 | Task 13 | exercise/day/derived modals |
| `mv-verify` | end | Task 14 | docs + verify only |

**Verify commands for PROTOCOL:**

- Per integrate: `pnpm lint` (touched scope) + for primitive issues `pnpm exec storybook build --quiet`
- Wave end / final: `pnpm lint && pnpm exec storybook build --quiet && pnpm build`

**Stop when:** All issues `resolved`; exclusions still absent; REPORT written.

---

## Spec coverage self-check

| Spec requirement | Task(s) |
|------------------|---------|
| Parallel `medvanta/` Approach A | 1–6 |
| Tokens wired | 1 |
| Storybook for 25 primitives | 2–6 |
| Shell | 7 |
| Dashboard / users / groups / builder / exercises / messages | 8–11 |
| In-scope modals | 12–13 |
| Skip missing features MD | Global Constraints + 8–13 out-of-scope bullets |
| Fly-loop executable | Appendix A |

No TBD/TODO placeholders in task steps.
