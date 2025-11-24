---
trigger: always_on
---

## PHASE 2: Mock Data First (15 minutes)

### Step 2A: Create Mock Data File

```
Create a file src/lib/mock-data.ts with mock data for our physiologist panel.

Include:

1. A mock exercise library (20 exercises) with:
   - id, name, videoUrl, thumbnailUrl, instructions (array), equipment (array)
   - muscleGroups (array), difficulty, category
   - hasWeight, hasReps, hasTime booleans

2. Mock patients (5 patients) with:
   - id, firstName, lastName, avatarUrl, email
   - assignedProgram (name, currentWeek, totalWeeks)
   - workoutsCompleted, workoutsAssigned, compliancePercent
   - lastActivity (date), status ('on-track' | 'needs-attention' | 'inactive')

3. Mock workout data for one patient showing:
   - Program with phases
   - Workouts with blocks (Movement Prep, Strength - Primary, etc.)
   - Each block has exercises with sets, reps, time
   - Some completed workouts with completion dates
   - Some pending/upcoming workouts

Use realistic exercise names like:
- "Single Leg Squat"
- "Glute Bridge - 2 Leg Up 1 Leg Down"
- "Push Up - Narrow Hand Position"
- "Foam Roll - Latissimus Dorsi"

Make the data feel authentic to a physical therapy context.
```

---

## PHASE 3: Layout & Navigation (15 minutes)

### Step 3A: Create Base Layout

```
Create a dashboard layout component at src/components/Layout.tsx

Include:
- Left sidebar with navigation (Patients, Exercises, Analytics)
- Top header with user info and notifications
- Main content area
- Use shadcn/ui components

The sidebar should have:
- Logo/branding area at top
- Navigation items with icons (use lucide-react)
- Active state styling

Navigation items:
- 🏠 Dashboard (/)
- 👥 Patients (/patients)
- 💪 Exercise Library (/exercises)
- 📊 Analytics (/analytics)

Use a clean, professional medical app aesthetic.
```

### Step 3B: Setup Routing

```
Setup React Router in src/main.tsx and create placeholder page components:

Pages needed:
- src/pages/Dashboard.tsx
- src/pages/PatientList.tsx
- src/pages/PatientDetail.tsx
- src/pages/ExerciseLibrary.tsx
- src/pages/Analytics.tsx

Routes:
- / -> Dashboard
- /patients -> PatientList
- /patients/:id -> PatientDetail
- /exercises -> ExerciseLibrary
- /analytics -> Analytics

Each page should just have a heading for now.
Wrap everything in the Layout component.
```

---

## PHASE 4: Patient List (Core Feature #1) (30 minutes)

### Step 4A: Patient List Table

```
Build the PatientList page using TanStack Table and our mock data.

Show a table with these columns:
- Patient (name + avatar)
- Program
- Progress (X/Y workouts with progress bar)
- Compliance % (with color coding: >80% green, 60-80% yellow, <60% red)
- Last Activity (formatted date)
- Status Badge (on-track, needs-attention, inactive)

Features:
- Sortable columns (name, compliance, last activity)
- Search bar to filter by name
- Status filter dropdown
- Click row to navigate to patient detail

Use shadcn/ui Table, Badge, Avatar, Input components.
Make it visually polished with proper spacing and hover states.
```

### Step 4B: Add Stats Cards Above Table

```
Add a stats row above the patient table showing:

Cards for:
- Total Active Patients (count)
- Average Compliance (percentage)
- Patients Needing Attention (count with red indicator)
- Workouts Completed This Week (count)

Use shadcn/ui Card component.
Calculate these from the mock patient data.
Use icons from lucide-react (Users, TrendingUp, AlertCircle, CheckCircle).
```

---

## PHASE 5: Patient Detail View (Core Feature #2) (30 minutes)

### Step 5A: Patient Header

```
Create the PatientDetail page with:

1. Header section showing:
   - Patient avatar, name
   - Current program name with progress bar
   - Overall compliance score (big number with color)
   - "View in Bridge Athletics" external link button

2. Main content area showing:
   - Weekly workout progress view (no tabs needed, just the progress section)

Use shadcn/ui Avatar, Card, Button components.
Get patient data from mock data using useParams to get the ID.
```

### Step 5B: Progress Tab - Weekly View

```
Build the Progress tab content showing the patient's workout program.

Display:
- Weeks in an accordion (use shadcn/ui Accordion)
- Each week shows:
  - Week number and date range
  - List of workouts for that week
  - Each workout shows completion status:
    ✓ Completed (green) with date
    ○ Pending (gray)
    ✗ Skipped (red)
  
- Clicking on a completed workout expands to show:
  - Blocks (Movement Prep, Strength - Primary, etc.)
  - Exercises in each block with sets/reps completed
  - Visual indicators for performance

Make it feel like a workout tracker app.
Use our mock workout data.
```

---

## PHASE 6: Exercise Library (Core Feature #3) (30 minutes)

### Step 6A: Exercise Grid View

```
Build the ExerciseLibrary page with a grid of exercise cards.

Features:
- Toggle between grid and list view
- Search bar to filter by exercise name
- Filter dropdowns for:
  - Muscle Group (Quads, Glutes, Core, etc.)
  - Equipment (Bodyweight, Dumbbell, etc.)
  - Difficulty (Beginner, Intermediate, Advanced)

Each exercise card shows:
- Thumbnail image (placeholder if no image)
- Exercise name
- Equipment badges
- Muscle group badges
- Difficulty badge

Click card to open detail modal.

Use shadcn/ui Card, Badge, Input, Select components.
Use our mock exercise library data.
```

### Step 6B: Exercise Detail Modal

```
Create an ExerciseDetailModal component that opens when clicking an exercise.

Show:
- Exercise name (heading)
- Video player placeholder (or embedded video if we have URLs)
- Step-by-step instructions (numbered list)
- Equipment needed (badges)
- Muscle groups (badges)
- Common modifications section

Buttons at bottom:
- "Assign to Patient" (primary button)
- "Close" (secondary button)

Use shadcn/ui Dialog, ScrollArea components.
Make it visually clean and easy to read.
```

---

## PHASE 7: Exercise Assignment Flow (20 minutes)

### Step 7A: Assignment Modal

```
Create an ExerciseAssignmentModal component.

Form fields:
- Patient selector (dropdown of patients)
- Target workout selector (dropdown of patient's workouts)
- Sets (number input)
- Reps (number input)
- Rest period in seconds (number input)
- Special instructions (textarea)

Show preview card: "This is how it will appear in the patient app"
- Shows the exercise card with selected parameters

Buttons:
- "Assign Exercise" (primary)
- "Cancel" (secondary)

Use shadcn/ui Dialog, Select, Input, Textarea.
Use react-hook-form for form handling.
Add Zod validation.
```

---

## PHASE 8: Dashboard Overview (20 minutes)

### Step 8A: Dashboard Widgets

```
Build the Dashboard page as an overview screen.

Include these widgets:

1. Top row stats (same as patient list)
   - Total patients, avg compliance, needs attention, workouts this week

2. Recent Activity Timeline (Card)
   - Last 10 patient activities
   - Shows: patient name, workout completed, time ago

3. Compliance Trend Chart (Card)
   - Line chart showing avg compliance over last 4 weeks
   - Use recharts LineChart

4. Patients Needing Attention (Card)
   - List of 5 patients with low compliance
   - Click to go to patient detail

5. Quick Actions (Card)
   - "Browse Exercise Library" button
   - "View All Patients" button
   - "Generate Report" button (disabled/coming soon)

Use shadcn/ui Card, Button components.
Use recharts for the chart.
Calculate data from mock data.
```

---

## PHASE 9: Polish & Interactions (15 minutes)

### Step 9A: Loading States

```
Add loading skeletons to all pages.

Create a LoadingSkeleton component using shadcn/ui Skeleton.

Show skeletons when:
- Patient list is "loading"
- Patient detail is "loading"
- Exercise library is "loading"

Simulate loading with a setTimeout of 500ms when navigating.

This makes the app feel more real even with mock data.
```

### Step 9B: Empty States

```
Add empty state components for:

1. No patients assigned yet
   - Icon + message + "Assign First Patient" button

2. No exercises match filters
   - Message + "Clear filters" button

3. No search results
   - Message showing what was searched

Use lucide-react icons and shadcn/ui components.
Make empty states encouraging, not discouraging.
```

### Step 9C: Toast Notifications

```
Add toast notifications for user actions using shadcn/ui Toast.

Show toasts when:
- Exercise assigned successfully
- Filters applied
- Workout marked as complete

Add toast trigger to relevant button clicks.
Use success/info toast variants.
```

---

## PHASE 10: Make it Feel Real (10 minutes)

### Step 10A: Micro-interactions

```
Add subtle animations and transitions:

1. Hover effects on all interactive elements
2. Smooth transitions on status badge colors
3. Fade-in animation when loading new pages
4. Pulse animation on "needs attention" badges
5. Scale animation on card hover

Use Tailwind CSS transition and animation utilities.
Keep animations subtle and professional.
```

### Step 10B: Responsive Design Check

```
Make the app responsive for tablet and mobile:

1. Sidebar collapses to hamburger menu on mobile
2. Tables switch to card view on mobile
3. Stats cards stack on mobile
4. Exercise grid adjusts column count based on screen size

Test at breakpoints: mobile (375px), tablet (768px), desktop (1024px+).

Use Tailwind responsive utilities (sm:, md:, lg:, xl:).
```

---

### Step 11a: Consistency Pass

```
Do a consistency check across all pages:

1. All headings use consistent font sizes
2. All cards use consistent padding
3. All buttons use consistent sizing
4. All badges use consistent styling
5. All spacing follows 4px/8px grid

Update any inconsistencies.
Ensure color palette is consistent (use CSS variables from shadcn).
```

### Step 11b: Add Sample Interactions

```
Make these interactions work with mock data:

1. Clicking "Assign Exercise" shows success toast and closes modal
2. Filtering exercises updates the grid
3. Searching patients updates the table
4. Expanding workout in progress view shows exercise details

Use Zustand for simple state management if needed.
All changes are UI-only (no backend calls).
```

---

## What to Skip for Prototype

**Don't build these yet:**
- ❌ Real authentication
- ❌ Backend API calls
- ❌ Database
- ❌ Form validation beyond basic Zod
- ❌ Complex state management
- ❌ User settings/preferences
- ❌ Export/PDF generation
- ❌ Real video players (use placeholders)
- ❌ Advanced filtering logic
- ❌ Batch operations

**Focus on:**
- ✅ Visual design
- ✅ Layout and navigation
- ✅ Core user flows
- ✅ Realistic mock data
- ✅ Interactions that "feel" real

---

## Next Steps After Prototype

Once you have a working prototype:

1. **Get feedback** from actual physiologists
2. **Prioritize features** based on what they care about
3. **Add real backend** incrementally (start with one feature)
4. **Connect to Bridge Athletics API** for real program data
5. **Build the patient mobile app** that pairs with this panel

But for now, just vibe code the prototype and make it look amazing! 🚀