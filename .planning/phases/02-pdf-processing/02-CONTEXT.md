# Phase 2: PDF Processing - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Take a loaded PDF (from Phase 1 file input), apply compression and/or page resize settings, show estimated output stats + thumbnail preview, and save to a chosen local path. File input shell, step navigation, and landing screen are already built — this phase adds the processing and output layer.

</domain>

<decisions>
## Implementation Decisions

### Compression controls
- Slider + numeric target size input side-by-side (e.g. "2 MB")
- Slider controls quality level — Claude's discretion on whether quality % (1–100) or named levels (Low/Med/High/Max) is more appropriate
- Compression AND page resize can be applied together in a single pass (not separate modes)
- If target size is unachievable: show warning with best achievable size, allow saving anyway (do NOT block Save)

### Page resize workflow
- Per-page selection — user can choose which pages to resize (not all-pages-only)
- Page selector UI: Claude's discretion (thumbnail strip with checkboxes or page range input)
- Presets (A4, A3, Letter) presented as a dropdown; last option is "Custom" which reveals width × height input fields
- Resize behavior: scale-to-fit — content scales to fill the new page size, always fully visible

### Size estimation & preview
- Show full stats: before size, output size (and savings), page count, dimensions
- Visual page thumbnail preview of first page output alongside the stats
- Trigger for estimation: Claude's discretion based on pdf-lib processing performance
- Step mapping: Compare step (Step 3 in StepBar) is used for the before/after stats + thumbnail — not inline on Configure

### Processing feedback
- Show progress bar with page count during processing (e.g. "Processing page 3 of 12")
- Cancel support: Claude's discretion based on typical Tauri/pdf-lib operation duration
- Post-save flow: Claude's discretion (toast + stay vs reset to Step 1)
- Error handling: Inline error on the current step — no modal/dialog for processing errors

### Claude's Discretion
- Quality slider implementation (% vs named levels)
- Page selector UI style (thumbnail strip vs page range input)
- Estimation trigger (live vs button-triggered)
- Cancel button during processing (yes or no, based on performance)
- Post-save flow (toast + stay vs reset to landing)

</decisions>

<specifics>
## Specific Ideas

- No specific references mentioned — open to standard approaches within the decisions above
- The StepBar flow for PDF: Pick (Step 1) → Configure (Step 2, compression + resize controls) → Compare (Step 3, stats + thumbnail) → Save (Step 4, native save dialog)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-pdf-processing*
*Context gathered: 2026-02-19*
