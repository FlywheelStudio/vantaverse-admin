# Dashboard widgets folder structure — design

**Date:** 2026-08-19  
**Scope:** Reestructurar solo los widgets `html-*` del dashboard  
**Destino:** `src/components/widgets/<name>/`

## Problem

Los widgets del dashboard viven como archivos flat en `src/app/(authenticated)/dashboard/` (`html-stat-tile`, `html-donut`, etc.). No siguen el contrato de componente armado:

```
<component>/
  ui.tsx      # solamente UI
  index.tsx   # lógica y datos / API pública
  *.stories.tsx
```

Eso dificulta Storybook, reuso limpio, y el recorrido página-por-página hacia el mismo patrón en todo el design system.

## Goals

1. Mover cada widget del dashboard a `src/components/widgets/<name>/` con `ui.tsx` + `index.tsx` + stories.
2. Mantener comportamiento visual y props actuales (HTML/MedVanta fidelity).
3. Actualizar imports en consumidores (dashboard page, users, groups, messages, `ui/avatar`).
4. Dejar `src/app/(authenticated)/dashboard/` vacío de widgets (o eliminado si ya no hay archivos).

## Non-goals

- Convertir MedVanta (`Button.tsx` + `Button.stories.tsx`) al folder pattern.
- Migrar `src/components/ui/` (shadcn).
- Rellenar `src/components/sidebar/` / `header/` vacíos.
- Unificar los dos `HtmlAvatar` (dashboard vs `users/html-helpers`) en esta pasada.
- Cambiar data fetching del home page (`page.tsx` sigue siendo el owner de queries).

## Target tree

```
src/components/widgets/
  avatar/
    ui.tsx
    index.tsx
    avatar.stories.tsx
  donut/
    ui.tsx
    index.tsx
    donut.stories.tsx
  sparkline/
    ui.tsx
    index.tsx
    sparkline.stories.tsx
  progress-bar/
    ui.tsx
    index.tsx
    progress-bar.stories.tsx
  stat-tile/
    ui.tsx
    index.tsx
    stat-tile.stories.tsx
  dashboard/
    ui.tsx
    index.tsx
    dashboard.stories.tsx
  app-bar-actions/
    ui.tsx
    index.tsx
    app-bar-actions.stories.tsx
  utils.ts
  index.ts                    # barrel opcional de exports públicos
```

### Source → destination map

| Actual | Nuevo |
|--------|--------|
| `dashboard/html-avatar.tsx` | `widgets/avatar/` |
| `dashboard/html-donut.tsx` | `widgets/donut/` |
| `dashboard/html-sparkline.tsx` | `widgets/sparkline/` |
| `dashboard/html-progress-bar.tsx` | `widgets/progress-bar/` |
| `dashboard/html-stat-tile.tsx` | `widgets/stat-tile/` |
| `dashboard/html-dashboard.tsx` | `widgets/dashboard/` |
| `dashboard/dashboard-app-bar-actions.tsx` | `widgets/app-bar-actions/` |
| `dashboard/html-utils.ts` | `widgets/utils.ts` |

## File responsibilities

### `ui.tsx`

- Solo presentational markup y classNames/styles.
- Recibe props ya resueltas (números clampados, paths SVG, tone class, etc.).
- Sin `'use client'` salvo que el markup lo exija de forma inherente (hoy solo `html-sparkline` lo tiene; preferir dejar client en `index` si el cálculo lo fuerza).
- Named exports: `AvatarUi`, `DonutUi`, … o `XxxUi` consistente.

### `index.tsx`

- API pública que los consumidores importan (`Avatar`, `Donut`, `StatTile`, `Dashboard`, …).
- Lógica: clamp de %, hash `avatarTone`, geometría SVG, defaults.
- Compone hijos vía otros widgets (`StatTile` → `Sparkline`).
- Re-exporta tipos de props públicos.
- Preferir drop `Html` prefix en el nombre público (`StatTile` no `HtmlStatTile`), con re-exports alias temporales solo si hace falta para un diff más chico — **recomendación: renombrar y actualizar imports en la misma PR**.

### `*.stories.tsx`

- Storybook title: `Widgets/<Name>` (ej. `Widgets/Donut`).
- Stories mínimas: Default + 1–2 variantes (tone, empty, sizes).
- Importar el export público desde `./index`, no desde `ui`.

### `utils.ts`

- Mover tal cual: `avatarTone`, `initialsFromName`, `getGreeting`, `formatDashboardSubtitle`, helpers internos usados por dashboard.
- Consumidores actuales (`groups`, `ui/avatar`, `users/html-helpers`, home `page.tsx`) pasan a `@/components/widgets/utils`.

## Public API (proposed names)

| Export | From |
|--------|------|
| `Avatar` | `widgets/avatar` |
| `Donut` | `widgets/donut` |
| `Sparkline` | `widgets/sparkline` |
| `ProgressBar` | `widgets/progress-bar` |
| `StatTile` | `widgets/stat-tile` |
| `Dashboard` | `widgets/dashboard` |
| `DashboardAppBarActions` | `widgets/app-bar-actions` |
| `avatarTone`, `initialsFromName`, `getGreeting`, `formatDashboardSubtitle` | `widgets/utils` |

Optional barrel `widgets/index.ts` re-exports the above. Avoid exporting `*Ui` from the barrel.

## Consumer update checklist

Must update imports:

1. `src/app/(authenticated)/page.tsx` — Dashboard, AppBar actions, utils
2. `src/app/(authenticated)/users/[id]/partials/html-program-tab.tsx` — ProgressBar
3. `src/app/(authenticated)/users/[id]/partials/html-onboarding-tab.tsx` — Avatar (dashboard one)
4. `src/app/(authenticated)/users/[id]/partials/member-notes-tab.tsx` — Avatar
5. `src/app/(authenticated)/groups/**` — `avatarTone` from utils
6. `src/components/ui/avatar.tsx` — `avatarTone`
7. Internal widget cross-imports (`stat-tile` → `sparkline`, `dashboard` → tiles/donut/avatar/progress)

**Do not change** in this pass:

- `users/html-helpers.tsx` `HtmlAvatar` (separate implementation used by tables/messages/builder)
- MedVanta shell / design-system primitives

## Migration order

1. `utils.ts` (no React deps; unblocks others)
2. Leaf presentational: `sparkline`, `progress-bar`, `donut`, `avatar`
3. `stat-tile` (depends on sparkline)
4. `app-bar-actions`
5. `dashboard` (depends on avatar, stat-tile, donut, progress-bar)
6. Update all external imports; delete old `dashboard/html-*` files
7. Stories for each moved widget
8. Verify: TypeScript + Storybook compile; smoke home page

## Risk notes

- **Duplicate Avatar:** dashboard `HtmlAvatar` ≠ `users/html-helpers` `HtmlAvatar`. Moving only the dashboard one; keep names clear (`@/components/widgets/avatar` vs helpers).
- **Client boundary:** sparkline is `'use client'`; parents that import it become client boundaries if they are client — dashboard container today is a server-compatible presentational tree fed by RSC `page.tsx`; preserve that (pass props down; no hooks in `dashboard/index` unless needed).
- **CSS classes:** widgets rely on global MedVanta HTML classes (`.stat`, `.pbw`, etc.) — do not restyle in this refactor.

## Success criteria

- [ ] Cada widget listado existe bajo `src/components/widgets/<name>/{ui,index,*.stories}.tsx`
- [ ] `src/app/(authenticated)/dashboard/` ya no contiene widgets `html-*`
- [ ] Home page y consumidores externos compilan con nuevos paths
- [ ] Stories visibles bajo `Widgets/*` en Storybook
- [ ] Sin cambio visual intencional

## Follow-ups (out of this spec)

- Aplicar el mismo folder pattern a MedVanta primitives (Button, Badge, Table, Tabs, SideNav, …).
- Unificar avatars / badges compartidos.
- Poblar `components/sidebar` y `header` si el shell deja de vivir solo en `medvanta/shell`.
