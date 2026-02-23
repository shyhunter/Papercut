# Phase 5: PDF Real Compression — Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the no-op pdf-lib "structural-only" PDF processing with real image recompression via Ghostscript. Quality levels (currently producing identical output) must produce measurably smaller files. The existing PDF pipeline UI (ConfigureStep, CompareStep) is updated to reflect real compression. No new file types or processing modes are added in this phase.

</domain>

<decisions>
## Implementation Decisions

### Bundling approach
- Bundle Ghostscript as a binary inside the Tauri app — fully self-contained, zero user setup steps
- macOS: ship `gs` binary inside the `.app` bundle (Tauri sidecar mechanism)
- Ghostscript invoked as a Rust subprocess: PDF in → compressed PDF out
- Progress feedback: spinner/existing progress indicator is sufficient — no per-page streaming needed
- Error handling on Ghostscript failure: Claude's discretion (match existing error handling patterns in the codebase)

### Quality level semantics
- **Rename** quality levels from Low/Medium/High/Best to **Web / Screen / Print / Archive** (intent-based labels)
- Map directly to Ghostscript's native presets: Web → screen (72 dpi), Screen → ebook (150 dpi), Print → printer (300 dpi), Archive → prepress (lossless)
- No expected size reduction hints on the ConfigureStep quality selector — let CompareStep show the real result
- **Target size is the primary driver**: when user sets a target size, the quality level auto-suggests the preset most likely to hit that target; user can override the quality selection independently
- Both controls react to each other: target-first, quality follows with a recommendation; user always has final say

### CompareStep UI update
- Remove the "structural only — image quality unchanged" notice silently — no replacement text needed
- Add percentage saved to the size display: e.g. `4.2 MB → 1.1 MB (74% smaller)`
- If output is larger than input: just show the numbers, no extra warning message
- Thumbnails: render the compressed PDF thumbnail at actual output resolution (reflecting the DPI of the quality preset used) — not a fixed high-res render

### Text-only PDF handling
- No special-casing in the UI: show the quality selector as-is regardless of PDF content
- Pre-scan at load time: detect image count + estimated compressibility (how image-heavy the PDF is)
- Pre-scan result feeds into the target-drives-quality recommendation logic (e.g. image-free PDF → quality recommendation is less meaningful → still show selector, no UI change)
- Pre-scan does NOT change the ConfigureStep UI appearance

### Claude's Discretion
- Exact Ghostscript failure error message and recovery flow (match existing toast/error patterns)
- Pre-scan implementation: which PDF inspection approach (pdf-lib metadata, pdfinfo, or lightweight Rust scan)
- Exact compressibility estimation algorithm
- Sidecar binary naming and Tauri config for bundling Ghostscript

</decisions>

<specifics>
## Specific Ideas

- "Two bars that react to each other" — target size and quality level are visually linked controls, not independent dropdowns. Target is primary, quality is secondary/responsive.
- Ghostscript native presets used as-is — no custom tuning of DPI or JPEG quality values beyond what GS ships with

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-pdf-real-compression-critical*
*Context gathered: 2026-02-23*
