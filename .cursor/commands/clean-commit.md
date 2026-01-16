---
description: Analyze uncommitted changes and suggest focused, high-signal code improvements
---

# Clean Commit Analysis

## Analysis Strategy (Diff-First)

1. Get list of uncommitted changed files using:
   - `git diff --name-only`
   - `git diff --cached --name-only`

2. Analyze **diff hunks first** for each file using `git diff`:
   - Focus on added and modified lines
   - Avoid full-file analysis by default

3. Load **full file context only when needed**, including when:
   - A function exceeds 50 lines
   - A file exceeds 300 lines
   - State complexity issues are suspected
   - Duplicate or repeated type structures are detected

---

## Improvement Categories

### Code Simplification
- Look for complex or deeply nested conditionals introduced in the diff
- Identify verbose patterns that could be simplified
- Detect redundant logic added or duplicated in this change
- Suggest early returns or guard clauses when they reduce nesting

### Component Extraction
- Flag files exceeding 300 lines for potential extraction
- Identify newly added large functions (>50 lines)
- Look for repeated JSX patterns introduced in the diff
- Detect newly added sections handling distinct concerns

### State Management (Improved Accuracy)
- Count `useState` / `useReducer` hooks per component
- Flag components with 5+ state variables **only if**:
  - State variables are tightly coupled
  - State updates are interdependent
- Detect **derived state** that could be computed from props or existing state
- Flag state that mirrors props without transformation
- Identify reducers with 1–2 actions that may be unnecessary
- Look for new or increased prop drilling caused by this change

### Unused Code
- Detect unused imports, variables, functions, or types added in this diff
- Flag commented-out code blocks
- Identify dead or unreachable code paths introduced by the change

### Repeated Type Declarations
- Scan for duplicate or highly similar type/interface definitions
- Flag inline types added where shared types already exist
- Identify structurally similar types that could be unified
- Prefer shared type files over repeated local definitions

### Direct supabase queries
- Scan for direct use of supabase queries that are not in the "queries" directory
- All supabase queries should be centralized in the "queries" directory and not be scattered in different files

---

## Output Requirements

Generate a **concise, prioritized markdown list** of improvements:

- Each item must be **1–2 sentences maximum**
- Focus on **actionable, specific changes**
- Order by **impact (highest first)**
- Avoid filler or speculative language
- Reference **file name + symbol/function/component name**
  - Avoid raw line numbers

### Severity & Confidence Scoring
Each recommendation must include:
- **Severity:** `high | medium | low`
- **Confidence:** `certain | likely | heuristic`

Example format:
- **[high | certain]** `UserProfile.tsx → handleSubmit`: Function exceeds 70 lines and mixes validation and network logic; consider extracting validation into a helper.

---

## Do NOT Suggest (Guardrails)

Do **not** recommend:
- Renaming public APIs
- Large-scale architectural rewrites
- File moves or directory restructuring
- Introducing new libraries
- Converting state management paradigms (e.g., Redux → Context)

Only flag these if explicitly requested by the user.

---

## Final Output Format

- Clean markdown bullet list
- No preamble or summary paragraphs
- No repetition of category headers in output
- Recommendations only