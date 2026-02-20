# Phase 3: Image Processing - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete image processing workflow: compress (quality slider), resize (W×H with aspect ratio lock), convert format (JPG/PNG/WebP), side-by-side comparison, then save. Reuses the save dialog from Phase 2. No new file formats beyond JPG/PNG/WebP.

</domain>

<decisions>
## Implementation Decisions

### Quality slider behavior
- Processing fires on **mouse-up only** (not debounced on every drag tick) — balances responsiveness with Sharp performance
- Slider label shows **percentage + estimated file size**: e.g. "75% — ~420 KB"
- For **PNG output**: slider maps to PNG compression level (0–9) — smaller file, slower encode. Label updates accordingly (e.g. "Compression: 6")
- Controls adapt **instantly** when format changes — switching to PNG remaps slider to compression level; JPG/WebP show the standard quality slider

### Compare view layout
- **Side-by-side panels** — original on left, processed on right (same pattern as PDF compare step)
- Stats shown in the compare view: **file size (before → after + % reduction)**, **dimensions (W × H px, both)**, **format (original → output)**, **quality setting used**
- While regenerating (user changed settings): **show stale result with a "Regenerating…" indicator** — no blank screen between updates
- **Zoom slider** — same as PDF compare step; both panels zoom together

### Resize interaction
- Resize is **opt-in via a toggle** (off by default) — same pattern as PDF's "Resize pages" pill switch — clean for users who just want to compress
- Aspect ratio lock **defaults to unlocked** — user has full control from the start
- Unit: **pixels + percentage toggle** — user can switch between raw pixels and percentage scale
- **Presets available**: a small set of common web/social sizes (e.g. HD 1920×1080, Web 1280×720, Square 1080×1080, Thumbnail 400×400). Selecting a preset fills the fields; user can then fine-tune.

### Format conversion
- Default output format = **same as input** (open JPG → output defaults to JPG; open PNG → output defaults to PNG)
- Format selector is always visible in Configure — user can change before generating preview
- Output **filename updates automatically** when format changes (e.g. photo.png → photo.jpg) — Save As dialog still lets user rename
- **PNG → JPG transparency handling**: Claude's Discretion (fill with white is the standard Sharp approach)

### Claude's Discretion
- PNG→JPG transparency: fill transparent areas with white background (Sharp default — predictable, no data loss)
- Exact slider step increments (1% or 5%)
- Debounce vs mouse-up threshold tuning
- Preset list final values (above are guidelines)
- Error state styling for invalid dimension inputs

</decisions>

<specifics>
## Specific Ideas

- Quality slider + live size estimate feel: user should feel in control of the size/quality tradeoff at a glance — the "% + ~KB" label is the key UX moment
- Resize toggle should feel like the PDF "Resize pages" pill switch — prominent but not in the way

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-image-processing*
*Context gathered: 2026-02-20*
