# Member profile re-wire — design

**Date:** 2026-08-18  
**Route:** `/users/[id]` (member / patient)  
**Reference:** `VantaThrive-admin-MedVanta-rebuild-v6.html` (`scMemberDetail`, `programAwaitingPane`, insights rail)

## Problem

MedVanta shell exists (header + Onboarding / Program / Notes), but several widgets that the page already loads never render, and Program tab still uses mock week/day data. HTML prototype also has distinct **due** vs **overdue** profile modes that are only partially mirrored.

## Goals

1. Wire existing profile data into MedVanta chrome (no new backends).
2. Match HTML insights rail: VantaPoints, Empowerment, Pledge, Adherence.
3. Surface **due** and **overdue** assignment SLA states in header, Program tab badge, and awaiting pane.
4. Replace Program week/day mocks with schedule + completion data already fetched by `page.tsx`.

## Non-goals

- Clinical notes backend (Notes tab stays mock chrome).
- Intake survey full Q&A editor (placeholder modal stays).
- SLA mutations (Extend deadline, Reassign owner) — keep disabled + `toastUnavailable`.
- Restoring knip-deleted legacy cards (`hp-card`, `habit-pledge-card`, etc.) as-is — wrong design system; rebuild in MedVanta HTML chrome.
- Admin profile path (`AdminProfileView`) — unchanged.
- App opens / engagement metrics that do not exist in admin APIs — show "—" or omit rows.

## Profile modes

Derive with `getProgramSlaMode(user, programAssignment)`:

| Mode | Condition |
|------|-----------|
| `assigned` | `programAssignment` present (or assignment id on profile) |
| `overdue` | no assignment AND `program_due_date` parseable AND due date &lt; now |
| `due` | no assignment AND `program_due_date` parseable AND due date ≥ now |
| *(none)* | no assignment AND no due date → treat as awaiting without SLA badges |

**Visual rules (from HTML / design notes):**

- **due:** monotone SLA (hourglass, slate bar, outline badge). Not red.
- **overdue:** danger chrome (red badge, danger SLA bar, border tint on awaiting card).
- **assigned:** no program-overdue header badge; Program tab shows `week N of M`.

Surfaces:

1. `MemberDetailHeader` — badge for due / overdue.
2. Program tab `cnt` — `overdue` | `not assigned` | `week N of M`.
3. `ProgramAwaitingPane` — HTML-faithful due vs overdue copy, SLA bar, assignment deadline card; Assign program enabled; Extend/Reassign disabled.

## Insights rail (Onboarding tab)

Replace current thin InsightCards with HTML-aligned cards. Pass data from `ui.tsx` (today loaded on page, largely unused in tabs).

### VantaPoints

- Navy/cyan gradient card matching HTML.
- Level from `user.current_level`.
- Points from `user.hp_points`; progress toward next from `user.points_for_next_level` and/or `pointsMissingForNextLevel` / `hpLevelThreshold` as already fetched.
- Empty: "—" / 0% progress.

### Empowerment

- Compact card: shield icon, score %, progress bar, title badge (`empowerment_title` / threshold title).
- Use `user.empowerment`, `empowermentThreshold`, `gateInfo`, `pointsMissingForNextLevel`, `ipTransactions` only if needed for expand later — v1 can be summary only.

### Pledge

- Signed state from `habitPledge != null`.
- Date from `habitPledge.created_at`.
- "View pledge →" opens local expand (modal/drawer) with pledge text + photo/signature assets.
- Null → "Not signed", no active view link.

### Adherence / pre-program engagement

- **assigned:** Adherence card — this week / last week / 4-week average.
  - **Definition (explicit):** a "session day" = a schedule day with ≥1 expected set. Done if completion marks that day's sets complete (same source as week strip). Show `N of M sessions` and bar = N/M.
  - 4-week average = mean of those ratios over the last 4 program weeks that exist (pad with absent weeks omitted, not zeros).
- **due / overdue (awaiting):** "Pre-program engagement" card — only rows with real data (e.g. overall completion % if a shared pre-program exists on profile); otherwise omit or "—". Do not invent app-open counts.
- Do not show adherence session figures when there is no assignment (HTML audit note).

## Program tab — active

1. Remove `MOCK_WEEK_DAYS` / `MOCK_DAY_BLOCKS`.
2. Helpers in `program-week.ts`:
   - Current week index from `programAssignment.start_date` (or template weeks).
   - Week strip: 7 days with states `done` | `today` | `todo` | `rest`.
   - Labels: `current/total` sets or Rest.
   - Selected day → Day plan blocks from schedule groups/exercises via `exerciseNamesMap` / `groupsMap`.
3. Meta row: Started, Ends, Completion %, Adherence (derived), Remaining weeks.
4. Header compliance / week badge from real data.
5. Check-in responses + Adjustments remain stubs.

## Data flow

```
page.tsx (already fetches)
  → UserProfilePageUI props
    → MemberDetailHeader (sla mode)
    → HtmlOnboardingTab (insights + habitPledge + hp/ip props)
    → HtmlProgramTab (schedule, completion, maps, assignment, sla mode)
```

New pure helpers (no React):

- `partials/program-sla.ts` — mode + working-day label helpers (best-effort calendar days if working-day calc is complex; document approximation).
- `partials/program-week.ts` — week strip + day plan from schedule/completion (revive logic from deleted `program-status/*` where useful).

## File layout

**New**

- `src/app/(authenticated)/users/[id]/partials/insights/vantapoints-card.tsx`
- `.../insights/empowerment-card.tsx`
- `.../insights/pledge-card.tsx`
- `.../insights/adherence-card.tsx`
- `.../program-sla.ts`
- `.../program-week.ts`

**Edit**

- `html-onboarding-tab.tsx`
- `html-program-tab.tsx`
- `member-detail-header.tsx`
- `ui.tsx`

## Error / empty handling

| Case | Behavior |
|------|----------|
| No due date, no assignment | Awaiting UI without due/overdue badges |
| No schedule/completion | Empty/rest strip; adherence "—" |
| No habitPledge | Not signed |
| Null HP/IP | Em dashes / empty progress |
| Non-member role | Existing admin view; out of scope |

## Testing / verification

Manual:

1. Member **assigned** — insights show VantaPoints/Empowerment/Pledge/Adherence; Program week strip + day plan match schedule.
2. Member **due** (due date future, no assignment) — monotone SLA; no red overdue badge.
3. Member **overdue** — danger badge on header + tab; awaiting pane danger chrome.
4. Member without pledge / without HP — empty states, no crash.

Automated smoke: lint on touched files.

## Approach chosen

**Wire into HTML MedVanta chrome** (not restore legacy okLCH cards; not strip-only Program tab). Matches migration direction and approved brainstorming options A + full §1 re-wire.
