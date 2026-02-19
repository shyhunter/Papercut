# Phase 1: App Shell & File Input - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Launch the Tauri + React app shell: a centered card landing screen with file picker and drag-and-drop input, format detection, and a step progress indicator (Pick → Configure → Compare → Save). Users can open a supported file and see where they are in the workflow. Processing (PDF, image) is out of scope — this phase is the shell only.

</domain>

<decisions>
## Implementation Decisions

### Landing screen layout
- Centered card layout — not full-screen drop zone, not minimal empty screen
- File picker button and drop zone have equal visual prominence (side by side or stacked with equal weight)
- Visual tone: polished and modern — subtle gradients, shadows, touch of color; feels like a well-crafted native app
- Subtle tagline below or above the card (e.g. "Compress, resize, convert — stays on your device")

### Drag-and-drop feedback
- The entire window is a drop target, but the card animates in response (not just the card reacting to the card area)
- Card highlights on drag-over: border glows, background shifts, subtle scale
- Mid-drag validation: green signal for valid file types, red (or neutral) for unsupported — user knows before dropping
- On valid file drop: show a brief progress indicator (loading bar or skeleton) before advancing — acknowledges something is happening

### Step indicator
- Top bar — horizontal row spanning the top of the window, always visible
- Future/locked steps are clearly grayed out so users can see they can't access them yet
- Visual presentation style and navigation behavior: Claude's Discretion

### File rejection behavior
- Native file picker dialog restricts to supported types: PDF, JPG, PNG, WebP — user cannot select unsupported files in the dialog
- How to surface errors for drag-dropped unsupported files: Claude's Discretion
- Post-rejection state and multi-file drop handling: Claude's Discretion

### Claude's Discretion
- Step indicator visual style (numbered, dots, labels-only)
- Step indicator click navigation behavior
- File rejection error pattern (toast, inline, modal)
- Post-rejection reset behavior and timing
- Multi-file drop handling
- Loading skeleton/spinner design
- Exact spacing, typography, and color palette within "polished and modern" direction

</decisions>

<specifics>
## Specific Ideas

No specific product references — open to standard approaches within the polished/modern direction.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-app-shell-file-input*
*Context gathered: 2026-02-19*
