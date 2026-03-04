---
phase: 09-dashboard-multi-tool-architecture
plan: 06
subsystem: ui
tags: [react, drag-drop, multi-file, context, useEffect]

requires:
  - phase: 09-dashboard-multi-tool-architecture
    provides: "ToolContext with pendingFile, Dashboard drag-drop, MergePickStep, SplitPickStep, RotateFlow"
provides:
  - "Multi-file drag-drop on Dashboard with tool filtering by file count"
  - "pendingFiles: string[] array replacing singular pendingFile in ToolContext"
  - "acceptsMultipleFiles flag on ToolDefinition (merge-pdf only)"
  - "Proper useEffect-based initial file loading (replaces useState side-effects)"
affects: []

tech-stack:
  added: []
  patterns: ["acceptsMultipleFiles tool filtering", "pendingFiles array forwarding", "useEffect for mount-time side effects"]

key-files:
  created: []
  modified:
    - src/types/tools.ts
    - src/context/ToolContext.tsx
    - src/components/Dashboard.tsx
    - src/components/merge/MergePickStep.tsx
    - src/components/merge/MergeFlow.tsx
    - src/components/split/SplitFlow.tsx
    - src/components/split/SplitPickStep.tsx
    - src/components/rotate/RotateFlow.tsx
    - src/App.tsx

key-decisions:
  - decision: "acceptsMultipleFiles is optional boolean on ToolDefinition, only set on merge-pdf"
    reason: "Only merge needs multiple files; keeps other tools simple"
  - decision: "Multi-file drop filters tool picker to only show acceptsMultipleFiles tools"
    reason: "Prevents user from selecting single-file tools when dropping multiple files"
  - decision: "Replaced useState-as-side-effect with useEffect in MergePickStep, SplitPickStep, RotateFlow"
    reason: "useState initializer should be synchronous; async side effects belong in useEffect"

gap_closure: true
---

## Summary

Closed the UAT gap for multi-file drag-and-drop on the dashboard. Added `acceptsMultipleFiles` flag to `ToolDefinition` and migrated `pendingFile: string | null` to `pendingFiles: string[]` throughout the app.

### What Changed

**Task 1** (commit `4e3cda1`): Added `acceptsMultipleFiles?: boolean` to `ToolDefinition` interface, set it on `merge-pdf` in `TOOL_REGISTRY`. Migrated `ToolContext` from `pendingFile`/`setPendingFile` to `pendingFiles`/`setPendingFiles` array.

**Task 2** (commit `db0bfb5`): Updated all consumers:
- **Dashboard.tsx**: Accepts multi-file drops, filters tools by file count (>1 file shows only merge)
- **MergeFlow.tsx**: Consumes `pendingFiles` array, passes to `MergePickStep` as `initialFiles`
- **MergePickStep.tsx**: Changed `initialFile` prop to `initialFiles: string[]`, replaced `useState` side-effect with `useEffect`
- **SplitFlow.tsx**: Consumes `pendingFiles[0]`, clears array
- **SplitPickStep.tsx**: Replaced `useState` side-effect with `useEffect`
- **RotateFlow.tsx**: Consumes `pendingFiles[0]`, replaced `useState` side-effect with `useEffect`
- **App.tsx**: ToolFlow migrated to `pendingFiles`/`setPendingFiles`

### Verification
- `npx tsc --noEmit` — zero errors
- All existing flows preserved (compress PDF, compress image, merge, split, rotate)
