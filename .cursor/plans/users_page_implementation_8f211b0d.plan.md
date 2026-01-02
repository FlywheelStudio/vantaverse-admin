---
name: Users Page Implementation
overview: Create a users management page with table, filters, import/export functionality, and admin management actions following the organizations page patterns.
todos:
  - id: extend-profiles-query
    content: Extend ProfilesQuery in src/lib/supabase/queries/profiles.ts with getList(), getListWithStats(), create(), update(), delete() methods
    status: pending
  - id: add-profile-stats-schema
    content: Add ProfileWithStats schema to src/lib/supabase/schemas/profiles.ts
    status: pending
  - id: create-users-hook
    content: Create useUsers hook in src/hooks/use-users.ts for React Query using getListWithStats
    status: pending
  - id: create-server-actions
    content: Create actions.ts with CRUD operations (createUser, updateUser, deleteUser), makeSuperAdmin, revokeSuperAdmin, and placeholder import/export functions (UI only)
    status: pending
  - id: create-table-columns
    content: Create columns.tsx with Name/Email, Badges, Progress, Journey Phase, and Actions columns
    status: pending
  - id: create-users-table
    content: Create users-table.tsx component with search, filters, and table rendering
    status: pending
  - id: create-filter-components
    content: Create nested org/team dropdown and journey phase dropdown filter components
    status: pending
  - id: create-import-menu
    content: Create import dropdown menu component with CSV/Excel options (UI only, placeholder functions)
    status: pending
  - id: create-main-page
    content: Create page.tsx that combines all components following organizations page pattern
    status: pending
---

# Users Page Implementation

## Overview

Create a users management page at `src/app/(authenticated)/users/page.tsx` that displays user data from the `profile_with_stats` view with filtering, import/export, and admin management capabilities.

## Database Structure

- **`profiles` table**: Basic profile data (first_name, last_name, email, journey_phase, consultation_completed, screening_completed, etc.)
- **`profiles_with_stats` view**: Extends profiles with calculated stats (program_completion_percentage, current_level, hp_points, points_required_for_next_level, etc.)
- **Super admin management**: Find organization where `is_super_admin = true`, add/remove users as members via `organization_members` table

## File Structure

### New Files

1. **`src/app/(authenticated)/users/page.tsx`** - Main page component
2. **`src/app/(authenticated)/users/users-table.tsx`** - Table component (similar to organizations-table.tsx)
3. **`src/app/(authenticated)/users/columns.tsx`** - Table column definitions
4. **`src/app/(authenticated)/users/actions.ts`** - Server actions (CRUD operations, make/revoke admin, import/export)
5. **`src/hooks/use-users.ts`** - React Query hook for users data

### Files to Modify

1. **`src/lib/supabase/queries/profiles.ts`** - Add CRUD operations and getListWithStats method
2. **`src/lib/supabase/schemas/profiles.ts`** - Add ProfileWithStats schema

### Components to Create

1. **User name/email cell** - Display first_name, last_name, email (copy pattern from `profile-item.tsx`)
2. **Badges cell** - Icons for consultation_completed and screening_completed with tooltips
3. **Progress bar cell** - Display program_completion_percentage using Progress component
4. **Journey phase cell** - Display journey_phase value
5. **Actions cell** - Delete button and Make/Revoke Admin button with icons and tooltips
6. **Filter dropdowns** - Org/Team nested dropdown, Journey Phase dropdown
7. **Import dropdown** - Menu with CSV/Excel template download and upload options

## Implementation Details

### 1. Query Layer (`src/lib/supabase/queries/profiles.ts`)

- Extend existing `ProfilesQuery` class
- **`getList()`** method: Query `profiles` table (basic list without stats)
- **`getListWithStats()`** method: Query `profiles_with_stats` view (includes stats like program_completion_percentage, current_level, hp_points, etc.)
- Support filtering by organization_id, team_id, journey_phase in both methods
- **`create(profileData)`** - Create new profile
- **`update(id, profileData)`** - Update existing profile
- **`delete(id)`** - Delete profile
- Return typed data using schema validation

### 2. Schema (`src/lib/supabase/schemas/profiles.ts`)

- Add `ProfileWithStats` schema based on database.types.ts profiles_with_stats view
- Include all fields from profiles_with_stats view (extends Profile with stats fields)

### 3. Server Actions (`src/app/(authenticated)/users/actions.ts`)

- **CRUD Operations:**
- `createUser(profileData)` - Create new user profile
- `updateUser(userId: string, profileData)` - Update user profile
- `deleteUser(userId: string)` - Delete user profile
- **Admin Management:**
- `makeSuperAdmin(userId: string)` - Add user to super admin organization
- `revokeSuperAdmin(userId: string)` - Remove user from super admin organization
- **Import/Export (UI only for now):**
- `downloadTemplateCSV()` - Placeholder function (UI only, implementation later)
- `downloadTemplateExcel()` - Placeholder function (UI only, implementation later)
- `uploadUsersCSV(file: File)` - Placeholder function (UI only, implementation later)
- `uploadUsersExcel(file: File)` - Placeholder function (UI only, implementation later)

### 4. Table Component (`src/app/(authenticated)/users/users-table.tsx`)

- Follow pattern from `organizations-table.tsx`
- Use `@tanstack/react-table` for sorting, filtering, pagination
- Include search bar in subheader
- Filter dropdowns: Org/Team (nested), Journey Phase
- Import dropdown menu in header
- Table columns: Name/Email, Badges, Progress, Journey Phase, Actions

### 5. Column Definitions (`src/app/(authenticated)/users/columns.tsx`)

- **Name/Email column**: Display first_name + last_name, email below (like profile-item.tsx)
- **Badges column**: CheckCircle icons for consultation_completed and screening_completed with tooltips
- **Progress column**: Progress bar showing program_completion_percentage
- **Journey Phase column**: Display journey_phase enum value
- **Actions column**: Delete button (Trash2 icon) and Admin toggle (Shield/ShieldOff icon) with tooltips

### 6. Filter Components

- **Org/Team nested dropdown**: 
- Use DropdownMenu with nested structure
- Show organizations, then teams under each org
- Filter users by selected org or team
- **Journey Phase dropdown**: 
- Options: discovery, onboarding, scaffolding, All
- Filter by journey_phase column

### 7. Import Dropdown (`src/app/(authenticated)/users/import-menu.tsx`)

- Button labeled "Import" (using DropdownMenu component)
- Dropdown menu items:
- Download icon + "Template CSV"
- Upload icon + "Upload CSV"
- Download icon + "Template Excel"
- Upload icon + "Upload Excel"
- **UI only for now**: Menu items are clickable but trigger placeholder functions
- File upload input handling (UI ready, backend implementation later)
- Use Download and Upload icons from lucide-react

### 8. Styling

- Follow design system from `DESIGN_SYSTEM.md`
- Use colors: `#2454FF` (primary), `#1E3A5F` (text), `#64748B` (muted)
- Match table styling from organizations page
- Use Card component with rounded-3xl, shadow-2xl
- Responsive design with mobile considerations

## Dependencies Needed

- CSV parsing: `papaparse` or similar
- Excel parsing: `xlsx` (SheetJS) or `exceljs`
- File download: Native browser APIs

## Key Patterns to Follow

1. Use same table structure as `organizations-table.tsx`
2. Use same card/layout pattern as `organizations/page.tsx`
3. Use same profile display pattern as `profile-item.tsx`
4. Use same action button patterns (delete with AlertDialog)
5. Use same filter/search patterns with debounce
6. Use same pagination pattern

## Notes

- Super admin org: Query organizations where `is_super_admin = true`, then manage membership
- Badges: Use CheckCircle icon from lucide-react with tooltips
- Progress bar: Use Progress component, show percentage value
- Import/Export: UI components only for now, backend implementation to be addressed later