# Phase 8: UX Polish & Refinements - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve the existing compression/processing flow with better feedback, flexible inputs, responsive layout, and clearer labels. Covers features F1, F2, F4, F5, F6, F7, F8 from the feature backlog. No new processing capabilities — this is pure UX improvement on the existing PDF and image workflows.

Saved presets (F3) and dashboard/multi-tool architecture (F9) belong in future phases.

</domain>

<decisions>
## Implementation Decisions

### Compression feedback (F1)
- Non-compressible files show a visible **inline warning in Configure step** (not a toast) explaining why compression won't help
- **Compressibility threshold info is always visible** in Configure step — user always sees guidance on what file sizes are compressible, not just when it fails
- **Block progression** — if file cannot be meaningfully compressed, user cannot proceed to Compare step for compression. Must be a hard block, not just a warning

### Custom target size (F2)
- "Custom" appears as a **5th radio option** alongside web/screen/print/archive in the quality selector
- Selecting "Custom" reveals an integer input field for target file size
- **MB/KB toggle** auto-selects based on uploaded file size (>= 1 MB shows MB, < 1 MB shows KB)
- **Validation blocks** if target >= original file size, with error message: "Target must be smaller than original (X MB)"

### Compare layout (F7)
- **Full stats row above panels** — original size, output size, percentage reduction, format, dimensions — all consolidated in one row above the before/after panels (below step bar)
- **Floating zoom toolbar** overlaying the comparison panels, always visible — applies to both PDF and image compare steps
- **Synced scrolling** — scrolling one panel scrolls the other to keep the same region in view
- Back and Save buttons remain at the bottom

### Save experience (F6)
- Save confirmation appears as a **card at the top of Save step** (below step bar, above everything else)
- Confirmation includes a **clickable link that opens the saved file directly** in the default app (Preview, etc.)
- Confirmation does **NOT auto-disappear** — stays until user dismisses with an **X close button**

### Post-save delight (F8)
- **Animated success icon** (checkmark with subtle sparkle/glow) — not confetti particles
- Brief, tasteful animation that adds a moment of delight without being overwhelming

### Label clarity (F5)
- Rename "Process Another" button in Compare step to **"Start Over"**
- Same navigation behavior (resets flow to pick a new file), clearer label

### Responsive scaling (F4)
- All step panels, fonts, buttons, inputs, sliders, and icons **scale proportionally with window size**
- **Font sizes scale with window** using vw/vh or CSS clamp()
- **Existing Tauri minWidth/minHeight is the scaling floor** — fonts and UI scale up from there
- Everything scales: containers, fonts, buttons, inputs, sliders, icons — full proportional scaling
- Applies to ALL steps (Pick, Configure, Compare, Save)

### Claude's Discretion
- Exact compressibility threshold values (what constitutes "non-compressible")
- Floating zoom toolbar design (button layout, opacity, position)
- Success icon animation implementation (CSS, Lottie, or canvas)
- Responsive scaling breakpoints and clamp() ranges
- Stats row layout and typography

</decisions>

<specifics>
## Specific Ideas

- Compressibility info should feel educational — user learns why some files can't be compressed further
- "Open file" link in save confirmation should use the OS default handler (Tauri shell.open or equivalent)
- The floating zoom toolbar should be unobtrusive — visible but not blocking the comparison content
- "Start Over" is the preferred label (not "Cancel" or "Back") for resetting the flow from Compare

</specifics>

<deferred>
## Deferred Ideas

- F3: Saved compression presets / history — future phase (persistence layer)
- F9: Dashboard + multi-feature architecture (iLovePDF-style) — future phase (full app restructure)
- Cross-feature access in Compare phase (e.g., trim pages while comparing compression) — part of F9 scope

</deferred>

---

*Phase: 08-newfeatures*
*Context gathered: 2026-02-27*
