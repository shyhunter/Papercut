# Feature Backlog

Captured 2026-02-27. To be prioritized and planned via `/gsd:discuss-phase`.

---

## F1: Transparency on non-compressible files

**Problem:** User uploads a file that is already small or incompressible, and the app gives a bad experience — no explanation of why compression didn't help.

**Requirements:**
- In the Configure phase, detect and inform the user if the file cannot be meaningfully compressed
- Explain WHY (e.g., "This PDF is already optimized" or "File is below the compression threshold")
- Clarify: does the threshold differ for MB-range vs KB-range files?
- Determine: at what size does a file become compressible?

---

## F2: Custom target size in compression level

**Problem:** The existing quality presets (web/screen/print/archive) don't let users specify an exact target size.

**Requirements:**
- Add a "Custom" option alongside existing compression level choices
- When selected, show an input field for target size (integer only)
- Add a MB/KB toggle — auto-select MB if the uploaded file is in MB range
- This is PDF Configure phase only (for now)

---

## F3: Saved compression presets / history

**Problem:** Users who repeatedly compress files with the same settings have to reconfigure each time.

**Requirements:**
- Users can save their compression settings (size, quality, resize options) as a named preset
- Presets persist across sessions (local storage or file-based)
- Quick-select from saved presets in Configure phase
- "Beloved" / favorites concept — user-created reusable profiles

---

## F4: Responsive / reflexive panels

**Problem:** When the window is resized larger, panels and fonts don't scale accordingly.

**Requirements:**
- All step panels should be responsive — grow with the window
- Font sizes should scale proportionally when window is made bigger
- All UI elements (buttons, inputs, sliders) should adapt
- Applies to ALL steps (Pick, Configure, Compare, Save)

---

## F5: Rename "Process Another" to "Cancel" in Compare

**Problem:** "Process Another" sounds like adding an additional file, not cancelling/going back.

**Requirements:**
- Replace "Process Another" button in Compare phase with a "Cancel" button
- Should navigate back (same behavior, clearer label)

---

## F6: Improved "File Saved" experience

**Problem:** Current save confirmation modal is poor — disappears and has no link to the file.

**Requirements:**
- Show a clickable link to the saved file location
- The confirmation should appear ABOVE the "Proceed locally" info
- Should NOT auto-disappear — user dismisses it manually
- Consider: "Open in Finder" / "Show in folder" action

---

## F7: Compare phase layout improvements

**Problem:** Info between Back and Save buttons is cramped. Zoom controls aren't prominent enough.

**Requirements:**
- Move all info (file stats, size comparison) to appear ABOVE the before/after panels, below the step bar
- Make zoom/dezoom controls more visible and prominent
- Keep Back and Save buttons at the bottom

---

## F8: Post-save confetti delight

**Requirements:**
- Small confetti animation after successful save
- Subtle — a brief moment of delight, not overwhelming

---

## F9: Dashboard + multi-feature architecture (iLovePDF-style)

**Problem:** Currently the app only does compression. The vision is a full document toolkit like iLovePDF but better, as a desktop app.

**Requirements:**
- Create a dashboard as the entry point — compression becomes the first "panel" / tool
- Keep the existing flow: Pick -> Configure -> Compare -> Save
- Users choose what they want to do from the dashboard, then enter the flow
- **Cross-feature access in Compare phase:** e.g., while comparing a compression result, user realizes they want to trim pages — they should be able to do that without leaving
- Future features to build (iLovePDF parity and beyond):
  - Page trimming / extraction
  - Merge PDFs
  - Split PDFs
  - Rotate pages
  - Add watermark
  - PDF to image / image to PDF
  - Page reordering
  - And more (image processing features already exist)

---

## Suggested milestone grouping (to be refined in discuss phase)

| Milestone | Features | Theme |
|---|---|---|
| v0.2 | F1, F2, F4, F5, F6, F7, F8 | Polish & UX improvements |
| v0.3 | F3 | User presets / persistence |
| v1.0 | F9 | Dashboard + multi-tool architecture |
