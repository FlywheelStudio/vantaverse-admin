# MedVanta UI Migration Design

**Date:** 2026-08-17  
**Status:** Approved for planning (Approach A)  
**Target repo:** `vantaverse-admin/`  
**Sources:** `MedVanta Design System/`, `VantaThrive-admin-MedVanta-rebuild-v6.html`, `medvanta-ui-missing-features.md`  
**Execution:** fly-loop (`fly-loop/`) after implementation plan is written

---

## Goal

Migrate MedVanta design-system primitives, Storybook documentation, and in-scope HTML pages/modals into `vantaverse-admin` as a parallel component library, then restyle existing authenticated routes and modals to consume those primitives—without inventing product features that do not exist in the admin app (see exclusions).

## Approach (locked)

**A — Parallel design system + migrate screens**

- New folder: `vantaverse-admin/src/components/medvanta/`
- Existing `src/components/ui/` (shadcn/Radix) remains until each screen migrates away
- Tokens from `MedVanta Design System/tokens/` wired into the Next app
- Storybook documents only MedVanta primitives (and optionally shell composition)
- Pages/modals that already have backend/UI in admin are rebuilt to match HTML chrome using MedVanta components + existing data hooks
- Features listed as missing/skip in `medvanta-ui-missing-features.md` are **not** built as product features

---

## Architecture

```
MedVanta Design System/          HTML rebuild v6
  tokens/*.css                   15 screens + 9 modals
  components/**/*.jsx|.d.ts
         │                              │
         ▼                              ▼
 vantaverse-admin/
   src/styles/medvanta-tokens.css   ← copy/adapt tokens
   src/components/medvanta/         ← typed TSX primitives
   .storybook/ + *.stories.tsx
   src/app/(authenticated)/**       ← restyle in-scope routes
   existing feature modals          ← restyle; hide missing sub-features
```

**Rules**

1. Primitives are presentational: props in, UI out. No Supabase/React Query inside `medvanta/`.
2. Feature screens keep data fetching in existing hooks/services; swap layout/controls to MedVanta.
3. Prefer Tailwind + CSS variables mapped from MedVanta tokens over inline-style ports from JSX demos.
4. Prefer Radix primitives already in the app for accessible Dialog/Tooltip/Tabs/Checkbox when the DS demo is style-only; visual contract must match MedVanta (pill buttons, navy/cyan, radii, shadows).
5. `lucide-react` for icons (already a dependency). DS `Icon` wrapper may thin-wrap Lucide by name.

---

## Component inventory (Storybook required)

Port all 25 primitives from `_ds_manifest.json` / `components/`:

| Group | Components |
|-------|------------|
| Actions | `Button`, `IconButton`, `Icon` |
| Forms | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `FormField` |
| Data display | `Card`, `CardHeader`, `StatCard`, `Badge`, `Tag`, `Avatar`, `Table` |
| Feedback | `Alert`, `Dialog`, `Tooltip`, `ProgressBar` |
| Navigation | `Tabs`, `Breadcrumb`, `SidebarNavItem`, `Pagination` |

**Layout / kit (not Storybook-first, used by pages)**

- Admin shell pieces derived from `ui_kits/admin/` + HTML: sidebar, top bar, page chrome—implemented under `src/components/medvanta/shell/` or by updating existing `sidebar`/`header`/`page-wrapper` to consume MedVanta tokens and `SidebarNavItem`.

**Per-component deliverable**

- `Component.tsx` + exported props types (from `.d.ts` / `.prompt.md`)
- `Component.stories.tsx` covering variants/sizes/states from the DS card/prompt
- Barrel export from `src/components/medvanta/index.ts`

**Storybook**

- Add Storybook 8 (Vite or Next framework consistent with Next 16) under `vantaverse-admin`
- Scripts: `storybook`, `build-storybook`
- Global decorator imports MedVanta tokens + fonts
- No requirement to story every page; pages are verified in the Next app

---

## Pages & modals scope

### HTML screens → admin (migrate UI)

| HTML id | Action | Admin target |
|---------|--------|--------------|
| `scDashboard` | Migrate cards that already exist (StatusCounts / Compliance / NeedingAttention). **Omit** onboarding funnel + 24h activity feed | `/` or `/dashboard` |
| `scMembers` | Migrate list/table chrome; invite/CSV only for bulk; **omit** other bulk ops | `/users` |
| `scMemberDetail` | Migrate profile chrome; intake as read-only card; **omit** clinical notes tab, SLA mutation for due/overdue (badge/filter OK if data exists) | `/users/[id]` |
| `scGroups` / `scGroupDetail` | Migrate members/programs basics; **omit** scheduling tab & group settings (domain/logo/booking) | `/groups`, `/groups/[id]` |
| `scPrograms` / `scProgramBuilder` / `scBuildWorkout` | Migrate builder/workout UI; **omit** partner import, saved blocks, duplicate/archive/push-schedule product ops | `/builder`, `/builder/[id]` |
| `scExercises` | Migrate list/editor chrome | `/exercises` |
| `scMessages` | Migrate inbox; plain compose; **omit** saved replies + attachments | `/messages` |
| `scLoginEmail` / `scLoginOtp` | **Do not** replace auth with OTP MedVanta; keep current SSO/sign-in; optional visual restyle of login shell only | `/login` |
| `scReviewAssign` | **Skip** as product feature; keep assign via existing `AssignProgramModal` | — |
| `scFilterPanel` | Not a domain feature; keep inline filters where they already exist | — |
| `scAudit` | Ignore (prototype meta) | — |

### HTML modals → admin

| HTML id | Action | Admin target |
|---------|--------|--------------|
| `mdInvite` | Restyle | `AddUserModal` (+ CSV) |
| `mdAssignProgram` | Restyle | `AssignProgramModal` |
| `mdAssignGroup` | Restyle | `AssignGroupModal` |
| `mdChangeOnboarding` | Restyle | `ChangeOnboardingDialog` |
| `mdAddGroupMembers` | Restyle | `AddMembersModal` |
| `mdExercise` | Restyle | `ExerciseModal` / related |
| `mdDayEditor` | Restyle; no saved blocks | day editor / `ExerciseBuilderModal` |
| `mdUpdateDerived` | Restyle | `UpdateDerivedDialog` |
| `mdIntakeSurvey` | **Do not** build full survey modal; keep `mc-intake-card` read-only | profile |

### Explicit non-goals (from `medvanta-ui-missing-features.md`)

Do not implement: OTP MedVanta flow, clinical notes CRUD, group Calendly/scheduling tab, group settings domain/logo/booking URLs, messages saved replies/attachments, dashboard funnel + activity feed, members bulk assign/export/remove (beyond invite/CSV), program template duplicate/archive/push-to-existing, partner exercise library import, saved exercise blocks, review&assign wizard, SLA extend/reassign mutations.

Where the HTML shows those controls, **hide or omit**—do not stub empty interactive UI that implies a working feature.

---

## Fly-loop waves (frontier shape)

Designed so path-disjoint workers can drain issues without inventing scope.

| Wave | Focus | Path surfaces (approx.) |
|------|--------|-------------------------|
| **0** | Tokens + Storybook bootstrap + `medvanta/` scaffolding + barrel | `src/styles/`, `.storybook/`, `package.json`, `src/components/medvanta/` |
| **1** | Actions + Forms primitives + stories | `src/components/medvanta/actions/`, `forms/` |
| **2** | Data-display + Feedback + Navigation + stories | `src/components/medvanta/data-display/`, `feedback/`, `navigation/` |
| **3** | Shell (sidebar/header/page chrome) using MedVanta | `src/components/sidebar/`, `header/`, `page-wrapper`, `medvanta/shell/` |
| **4** | Pages: Dashboard, Users list/detail, Groups list/detail | `src/app/(authenticated)/{dashboard,users,groups}/**` |
| **5** | Pages: Builder/workout, Exercises, Messages; Login visual-only if cheap | `builder/`, `exercises/`, `messages/`, `login/` |
| **6** | In-scope modals restyle; hide excluded controls | feature modal files under `components/` / feature folders |

**Dependencies:** Wave N+1 blocked on Wave N for primitives/shell; pages may start once Waves 0–3 land. Modals (6) can parallelize with late pages if they only need Waves 0–2.

**Verification (per integrate)**

- `pnpm`/`npm` lint on touched files
- Storybook build or `storybook` smoke for new stories (Waves 0–2)
- `next build` or typed check before wave-end REPORT
- Manual visual check against HTML for each migrated screen (AC in jobs)

**Stop condition:** All in-scope primitives have stories; shell uses MedVanta tokens; listed pages/modals restyled; excluded features remain absent/hidden; no new product backends invented.

---

## Tech stack (constraints)

- Next.js 16.1.x, React 19, Tailwind CSS 4, existing Radix packages, `clsx`/`tailwind-merge`/`cva`, `lucide-react`
- Storybook 8.x (to be added)
- TypeScript strict as already configured in admin
- Copy tokens from design system; do not depend on runtime `_ds_bundle.js` in production

## Out of scope

- Backend/RPC/schema for missing features
- Replacing all `src/components/ui` usages in one PR
- Pixel-perfect OTP / review&assign / notes / Calendly product work
- Committing secrets or changing auth provider

## Success criteria

1. `src/components/medvanta/` exports all 25 primitives with Storybook coverage.
2. Authenticated shell + listed pages visually match MedVanta HTML intent using real admin data.
3. In-scope modals match MedVanta dialog chrome; excluded controls not shown.
4. Plan + this spec are sufficient for `/fly-loop` to drain without product grilling.

---

## References

- `MedVanta Design System/readme.md`, `_ds_manifest.json`, `components/**`, `tokens/**`, `ui_kits/admin/**`
- `VantaThrive-admin-MedVanta-rebuild-v6.html` (`sc*` screens, `md*` modals)
- `medvanta-ui-missing-features.md`
- `vantaverse-admin/docs/UI_COMPONENTS.md`, `ARCHITECTURE.md`
- `fly-loop/fly-loop.md`, `fly-loop/fly-loop/PROTOCOL.md`
