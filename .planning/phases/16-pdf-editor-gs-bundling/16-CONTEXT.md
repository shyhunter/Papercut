# Phase 16: PDF Editor & GS Bundling - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-page PDF editor with text editing, tool sidebar, page panel, system file association, and Ghostscript bundling as a sidecar binary. The editor is a new view alongside the existing dashboard — all existing step-by-step tool flows remain functional. This phase does NOT add new tools; it provides a unified editor experience for existing PDF tools and bundles GS to eliminate the external install requirement.

</domain>

<decisions>
## Implementation Decisions

### Editor Canvas & Navigation
- Continuous scroll layout — all pages stacked vertically in one scrollable canvas (like Google Docs / Acrobat)
- Default zoom: fit to editor width on open; user can zoom via Cmd+/- or pinch
- Zoom toolbar with level indicator and presets (50%, 75%, 100%, 150%, Fit Width)
- Text editing: click to select (shows bounding box), double-click to enter inline editing with cursor
- Fixed top toolbar for text formatting (font, size, color, bold/italic/underline) — always visible, like Google Docs

### Tool Sidebar
- Collapsible sidebar on the right — collapsed state shows thin icon strip (like VS Code activity bar)
- Click an icon to expand the tool panel with settings
- PDF-only tools shown — excludes image tools, JPG-to-PDF, and standalone convert
- Tools operate inline: settings appear in the sidebar panel, user configures and sees a before/after preview, then clicks "Apply" to commit changes to the document
- After applying, canvas refreshes with the updated PDF

### Page Panel
- Collapsible page panel on the left — can be collapsed to maximize canvas space
- Clicking a thumbnail scrolls the canvas to that page
- All four page operations: drag to reorder, add pages (blank or from another PDF file), delete pages, duplicate pages
- Multi-select support: Cmd+click for individual selection, Shift+click for range — operations apply to all selected pages
- "Add pages" offers both "Insert blank page" and "Insert from PDF file" (opens file picker)

### File Association & Launch Flow
- System file association: when PDF opened via "Open with Papercut", it launches straight into the editor view (bypasses dashboard)
- No first-launch prompt for default PDF handler — user registers manually via system settings or right-click "Open with"
- Breadcrumb navigation at top: Dashboard > filename.pdf — click "Dashboard" to return
- Unsaved changes warning when navigating away from editor (back to dashboard or closing app)
- Save model: Cmd+S saves in-place (first save prompts for location, subsequent saves overwrite), Cmd+Shift+S always opens Save As dialog

### Claude's Discretion
- Canvas background color and page gap spacing
- Thumbnail rendering resolution and panel width
- Icon choices for tool sidebar
- Exact GS binary bundling strategy per platform (macOS, Windows, Linux)
- Page panel collapse/expand animation
- Keyboard shortcuts beyond Cmd+S and Cmd+Shift+S

</decisions>

<specifics>
## Specific Ideas

- Tool sidebar collapsed state should feel like VS Code's activity bar — thin icon strip that expands on click
- Editor should feel like a real document editor (Google Docs / Acrobat), not a viewer with editing bolted on
- Breadcrumb navigation pattern: "Dashboard > document.pdf" at top-left of editor toolbar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-pdf-editor-gs-bundling*
*Context gathered: 2026-03-16*
