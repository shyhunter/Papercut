# Phase 12: Advanced PDF Tools - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Four advanced PDF tools — Sign PDF (visual stamp v1), Redact PDF, PDF to PDF/A, and Repair PDF — expanding Papercut's professional toolkit. Digital certificate signing is deferred to a future phase. All tools accessible from the existing dashboard grid.

</domain>

<decisions>
## Implementation Decisions

### Sign PDF interaction
- **Creation methods:** All three — freehand canvas drawing, typed text with signature font, and image upload
- **Placement:** Drag-and-drop on page preview with resize handles (drag corners)
- **Multi-page:** User can choose: current page, all pages, or a custom page range
- **Persistence:** Signatures saved to local storage for reuse in future documents
- **Flow:** Custom step pattern (pick → create/select signature → place on page → save) — more interactive than standard tools

### Redact tool behavior
- **Selection methods:** Both — draw rectangles on page preview AND text search with highlight/confirm
- **Removal:** True permanent redaction — underlying content (text, images) actually removed from PDF, not just visually covered
- **Preview:** Live preview — redaction rectangles shown on the page in real-time as user adds them
- **Multi-page:** User can navigate between pages and add redactions across all pages before applying
- **Flow:** Custom step pattern (pick → navigate pages / draw+search redactions → save) — interactive, not standard configure

### PDF/A conversion
- **Conformance levels:** Multiple options — PDF/A-1b, PDF/A-2b, PDF/A-3b (user selects)
- **Processing:** GS sidecar with `-dPDFA` flag
- **Flow:** Pick → Configure (level selector) → Save

### Repair PDF
- **Processing:** GS sidecar re-process (read + rewrite)
- **Partial repair:** If GS produces output with warnings, offer the partial result with a warning about potential issues (don't just fail)
- **Flow:** Pick → Configure (info panel) → Save

### Shared patterns
- **SaveStep:** Reuse existing SaveStep component across all 4 tools
- **Dashboard:** Add to existing grid layout (no separate "Advanced" section)
- **Category:** All 4 are PDF tools in the tool registry

### Claude's Discretion
- Feedback level for PDF/A conversion (simple vs detailed report of what changed)
- Whether to show file size comparison after PDF/A and Repair processing
- Exact step naming and progress indicator for custom flows
- Signature font choices for typed signature mode
- Canvas drawing tool specifics (pen width, color, smoothing)

</decisions>

<specifics>
## Specific Ideas

- Sign PDF: visual stamp first (v1), digital certificate signing is a future enhancement
- Redact: must be true redaction (content removal), not just visual blackout — this is a professional/legal feature
- PDF/A and Repair are GS sidecar tools following the existing protect_pdf/unlock_pdf pattern in lib.rs
- Repair should be forgiving — partial results with warnings are better than hard failures

</specifics>

<deferred>
## Deferred Ideas

- Digital certificate signing (PFX/P12) for Sign PDF — future phase, significantly more complex
- PDF validation/compliance checking — could be its own tool
- Batch redaction across multiple PDFs — future phase

</deferred>

---

*Phase: 12-advanced-pdf-tools*
*Context gathered: 2026-03-04*
