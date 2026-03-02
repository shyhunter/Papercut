# Phase 9: Dashboard & Multi-Tool Architecture - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform Papercut from a single-purpose compression tool into a multi-tool document toolkit. This phase delivers: (1) a dashboard entry point showing available tools as a card grid, (2) Merge PDFs tool, (3) Split PDF tool, (4) Rotate Pages tool. Existing compression and image processing flows must be fully preserved.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout & navigation
- Tool cards in a responsive grid, grouped by type (PDF Tools, Image Tools sections with headers)
- Back arrow + breadcrumb trail at the top for navigation (e.g., "Dashboard > Compress PDF")
- Dropping a file on the dashboard shows a tool picker — detect file type, show only compatible tools ("What do you want to do with this PDF?")

### Merge PDF experience
- Both multi-select file picker AND "Add more" button for adding files — most flexible
- Drag-and-drop reorder as primary, with up/down arrow buttons as accessible fallback
- Show thumbnail of first page for each PDF in the merge list — helps identify files visually
- Preview merged result before saving — show total page count + scrollable thumbnail strip

### Split PDF experience
- All three split modes: by page range, split every N pages, extract each page individually
- Both visual page grid (click/tap thumbnails) AND text input that syncs — visual as primary, text for power users
- Both save options: choose folder with auto-naming OR save as ZIP — user picks
- Preview splits before executing — summary of what each output file will contain

### Rotate Pages
- Both modes: "Rotate All" button for quick bulk rotation + individual per-page rotation via thumbnail grid
- Click a page thumbnail to cycle its rotation (0→90→180→270)

### Tool flow architecture
- Custom flows per tool — each tool has its own step sequence:
  - Compress: Pick → Configure → Compare → Save (existing)
  - Merge: Pick Files → Order → Save
  - Split: Pick → Select Pages → Save
  - Rotate: Pick → Select & Rotate → Save
- Adaptive StepBar — shows the steps relevant to the current tool (not hidden)
- Reuse SaveStep component for all tools — same save experience (Save As dialog, confirmation card, animated checkmark)

### Claude's Discretion
- Exact card design (icon style, card dimensions, hover effects)
- Dashboard grid responsive breakpoints
- Page thumbnail rendering implementation (reuse pdfThumbnail.ts or new approach)
- Drag-and-drop library choice for merge reorder
- ZIP creation library for split output
- How tool-specific flows share routing/state (React Router, context, or prop-based)

</decisions>

<specifics>
## Specific Ideas

- Reference: iLovePDF dashboard style — clean grid of tool cards, each with icon and name
- Tool picker on file drop is key UX — don't just auto-route, let user choose what to do
- Merge should feel like arranging documents on a desk — visual, drag-and-drop oriented
- Split page grid should show actual page thumbnails, not just numbered boxes
- Keep the privacy-first identity — all new tools process locally, no uploads

</specifics>

<deferred>
## Deferred Ideas

- Page trimming / extraction — could be a mode within Split or its own tool (future phase)
- Add watermark — future phase
- PDF to image / image to PDF conversion — future phase
- Page reordering within a single PDF — future phase (related to rotate)
- Cross-feature access in Compare phase (e.g., trim pages while comparing compression) — future phase
- Saved compression presets / history (F3) — future phase

</deferred>

---

*Phase: 09-dashboard-multi-tool-architecture*
*Context gathered: 2026-03-02*
