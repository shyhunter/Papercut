# Phase 2: PDF Processing - Research

**Researched:** 2026-02-19
**Domain:** PDF manipulation (pdf-lib), PDF rendering (pdfjs-dist), Tauri v2 file system + dialog plugins
**Confidence:** HIGH for page resize, MEDIUM for compression (fundamental library limitation discovered)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Compression controls**
- Slider + numeric target size input side-by-side (e.g. "2 MB")
- Slider controls quality level — Claude's discretion on whether quality % (1–100) or named levels (Low/Med/High/Max) is more appropriate
- Compression AND page resize can be applied together in a single pass (not separate modes)
- If target size is unachievable: show warning with best achievable size, allow saving anyway (do NOT block Save)

**Page resize workflow**
- Per-page selection — user can choose which pages to resize (not all-pages-only)
- Page selector UI: Claude's discretion (thumbnail strip with checkboxes or page range input)
- Presets (A4, A3, Letter) presented as a dropdown; last option is "Custom" which reveals width × height input fields
- Resize behavior: scale-to-fit — content scales to fill the new page size, always fully visible

**Size estimation & preview**
- Show full stats: before size, output size (and savings), page count, dimensions
- Visual page thumbnail preview of first page output alongside the stats
- Trigger for estimation: Claude's discretion based on pdf-lib processing performance
- Step mapping: Compare step (Step 3 in StepBar) is used for the before/after stats + thumbnail — not inline on Configure

**Processing feedback**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PDF-01 | User can compress a PDF to a specified target file size (e.g. "under 2MB") | pdf-lib has no true compression; strategy is re-save with `useObjectStreams: true` (structural packing only). Must set expectations: size reduction is modest and unpredictable. Target-size UI must use the "best achievable + warning" path almost always. |
| PDF-02 | User can resize PDF page dimensions (preset sizes: A4, A3, Letter; or custom width × height) | Fully supported via pdf-lib `setSize()` + `scaleContent()` + `translateContent()`. PageSizes constants built-in. Per-page selection via `getPages()[i]`. |
| PDF-03 | User sees estimated output file size before committing to save | Must process the full PDF in JS and call `pdfDoc.save()` to get the actual byte count — no shortcut estimate. Run on "Generate Preview" button click, not live. |
| UX-02 | User can save the processed file to a chosen local path (Save As dialog) | Tauri `plugin-dialog` `save()` returns path. Then write with `plugin-fs` `writeFile()`. Requires adding `dialog:allow-save`, `fs:allow-write-file` permissions and `tauri-plugin-fs` Rust + JS setup. |
</phase_requirements>

---

## Summary

pdf-lib is the right tool for **page resizing** — it has first-class, verified API for `setSize`, `scaleContent`, and `translateContent` that together implement scale-to-fit correctly. The `PageSizes` export provides A4, A3, and Letter constants in PDF points (1 pt = 1/72 inch). Per-page selective resize is straightforward: call `getPages()`, iterate the user-selected indices, apply transforms only to those pages.

**The critical finding for PDF-01 (compression):** pdf-lib has no true compression capability. It cannot downsample images, recompress streams, or remove unused resources. The only size-reduction mechanism is `useObjectStreams: true` in `save()`, which packs cross-reference tables into compressed object streams — a purely structural optimisation with unpredictable and often modest results. The `useCompression: true` flag has a documented open bug (issue #1445) causing file corruption. The target-size feature must be redesigned as: re-save with object-stream packing, report the actual resulting size, and if it misses the user's target, show the warning and allow saving anyway — which matches the locked decision exactly.

For the **thumbnail preview** (Compare step), pdf-lib cannot render pages visually. pdfjs-dist (Mozilla PDF.js) is the standard library for rendering PDF pages to an HTML Canvas. It requires a Web Worker for its parser. In Vite/Tauri, the worker is configured via `GlobalWorkerOptions.workerSrc` using `import.meta.url`.

The **save flow** requires two new Tauri plugins: `plugin-dialog` (already in Cargo.toml / package.json for `open`) needs `dialog:allow-save` added to capabilities; `plugin-fs` must be added (Rust + JS) with `fs:allow-write-file` to write the processed bytes to the path the dialog returns.

**Primary recommendation:** Implement compression as structural re-save only; be honest in UI copy ("Optimised" not "Compressed"). Process on button click for estimation. Use pdfjs-dist for thumbnail rendering from the processed bytes. Never use `useCompression: true`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-lib | 1.17.1 (latest) | Load, modify, and serialize PDFs in JS | Decided by project; runs in webview, no Rust needed, full TypeScript |
| pdfjs-dist | 4.x (latest) | Render PDF page to canvas for thumbnail | Mozilla's reference implementation; no alternatives in pure JS |
| @tauri-apps/plugin-fs | 2.x | Read source PDF bytes, write processed PDF bytes | Required to access arbitrary paths chosen via dialog |
| @tauri-apps/plugin-dialog | 2.6.0 (already installed) | Native save-as dialog returning file path | Already in project; just needs `save()` permission added |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner (already installed) | 2.x | Toast notification for post-save feedback | Post-save success/error notification |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdfjs-dist for thumbnail | convertFileSrc + `<img>` or `<iframe>` | `convertFileSrc` requires asset protocol config + CSP changes; more complex than reading bytes and rendering to canvas. Canvas approach works with bytes already in memory. |
| plugin-fs writeFile | Rust command via invoke | No benefit — plugin-fs is the idiomatic Tauri v2 approach. |
| pdf-lib for compression | Ghostscript / server-side tool | Out of scope — no Rust backend, no server, Tauri JS-only constraint. |

**Installation (new packages only):**
```bash
npm install pdf-lib pdfjs-dist @tauri-apps/plugin-fs
```

Rust (add to `src-tauri/Cargo.toml` `[dependencies]`):
```toml
tauri-plugin-fs = "2"
```

Register in `src-tauri/src/lib.rs`:
```rust
.plugin(tauri_plugin_fs::init())
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── fileValidation.ts        # already exists
│   ├── pdfProcessor.ts          # NEW — pdf-lib: load, resize, re-save, estimate size
│   └── pdfThumbnail.ts          # NEW — pdfjs-dist: render page 1 to canvas → data URL
├── hooks/
│   ├── useFileDrop.ts           # already exists
│   ├── useFileOpen.ts           # already exists
│   └── usePdfProcessor.ts       # NEW — React hook wrapping pdfProcessor with progress state
├── components/
│   ├── StepBar.tsx              # already exists — needs currentStep advancing
│   ├── LandingCard.tsx          # already exists — untouched
│   ├── ConfigureStep.tsx        # NEW — compression slider + page resize controls
│   ├── CompareStep.tsx          # NEW — stats panel + thumbnail
│   └── SaveStep.tsx             # NEW — triggers native save dialog, shows progress + errors
└── types/
    └── file.ts                  # already exists — may need PdfProcessingOptions type added
```

### Pattern 1: PDF Load → Process → Estimate → Save

**What:** Single processing pipeline. Source bytes are read once from disk (plugin-fs), processed in JS (pdf-lib), saved to memory as `Uint8Array`, then written to disk via the save dialog path (plugin-fs).

**When to use:** Always — this is the only pattern for this phase.

```typescript
// Source: pdf-lib.js.org + Tauri plugin-fs docs
import { readFile } from '@tauri-apps/plugin-fs';
import { writeFile } from '@tauri-apps/plugin-fs';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { save } from '@tauri-apps/plugin-dialog';

async function processPdf(
  sourcePath: string,
  options: PdfProcessingOptions
): Promise<{ bytes: Uint8Array; size: number }> {
  // 1. Read source bytes
  const sourceBytes = await readFile(sourcePath);

  // 2. Load into pdf-lib
  const pdfDoc = await PDFDocument.load(sourceBytes);

  // 3. Apply page resize to selected pages
  if (options.resizeEnabled) {
    const pages = pdfDoc.getPages();
    const [targetW, targetH] = options.targetPageSize; // in PDF points
    for (const idx of options.selectedPageIndices) {
      const page = pages[idx];
      const { width: origW, height: origH } = page.getSize();
      const scale = Math.min(targetW / origW, targetH / origH);
      page.setSize(targetW, targetH);
      page.scaleContent(scale, scale);
      // Center the scaled content within the new page
      const xOffset = (targetW - origW * scale) / 2;
      const yOffset = (targetH - origH * scale) / 2;
      page.translateContent(xOffset, yOffset);
    }
  }

  // 4. Re-save with structural packing (only viable "compression")
  const processedBytes = await pdfDoc.save({ useObjectStreams: true });

  return { bytes: processedBytes, size: processedBytes.byteLength };
}

// Save to disk after user picks path
async function savePdfToDisk(bytes: Uint8Array, defaultName: string): Promise<string | null> {
  const savePath = await save({
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: defaultName,
  });
  if (!savePath) return null;
  await writeFile(savePath, bytes);
  return savePath;
}
```

### Pattern 2: Thumbnail Rendering via pdfjs-dist

**What:** Render the first page of the processed PDF (as bytes already in memory) to an offscreen canvas, return a data URL for display. This avoids needing to write to disk first or use `convertFileSrc`.

**When to use:** Compare step — show thumbnail of the processed output.

```typescript
// Source: pdf-lib.js.org/examples + Mozilla pdf.js examples page
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker — must be set before any getDocument() call.
// Vite resolves this correctly via import.meta.url.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export async function renderPdfThumbnail(
  pdfBytes: Uint8Array,
  scale = 0.5,
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1); // first page only

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport }).promise;

  // Clean up to avoid memory leaks
  pdfDoc.destroy();

  return canvas.toDataURL('image/png');
}
```

### Pattern 3: Page Size Constants and Custom Dimensions

```typescript
// Source: pdf-lib.js.org — PageSizes export
import { PageSizes } from 'pdf-lib';

// Built-in presets (width, height in PDF points — 1pt = 1/72 inch)
const PAGE_PRESETS = {
  A4:     PageSizes.A4,     // [595.28, 841.89]
  A3:     PageSizes.A3,     // [841.89, 1190.55]
  Letter: PageSizes.Letter, // [612, 792]
} as const;

// Convert mm to points for custom input
function mmToPoints(mm: number): number {
  return (mm / 25.4) * 72;
}
```

### Anti-Patterns to Avoid

- **Never use `useCompression: true` in pdfDoc.save():** Open bug (pdf-lib issue #1445) causes corrupted output files. This flag is not safe to use.
- **Do not try to estimate output size without actually calling pdfDoc.save():** There is no shortcut formula. The only way to know the output size is to produce the bytes.
- **Do not load pdfjs-dist worker from CDN in production:** The Tauri app is a local desktop app and may run offline. Use the bundled worker via `import.meta.url`.
- **Do not call translateContent before setSize:** The content positioning offset is relative to the new page dimensions; set the page size first.
- **Do not use `convertFileSrc` for thumbnail rendering:** Requires asset protocol CSP configuration, scope setup, and has known 403 bugs in Tauri v2. Rendering from in-memory bytes (already loaded) is simpler and more reliable.
- **Do not process on every slider change:** pdf-lib processing is synchronous but can be slow on large PDFs. Trigger on button click ("Generate Preview"), not on input change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF page size constants | Manual lookup table | `PageSizes` from pdf-lib | pdf-lib exports all standard page sizes in points |
| Scale factor for scale-to-fit | Custom math | `Math.min(targetW / origW, targetH / origH)` — 2 lines | Simple but the centering offset is non-obvious; see Pattern 1 |
| Canvas → data URL | Custom serialisation | `canvas.toDataURL('image/png')` | Standard DOM API |
| Native save dialog | Custom UI | `save()` from `@tauri-apps/plugin-dialog` | Already installed; returns null on cancel |
| Write binary file | Rust invoke command | `writeFile()` from `@tauri-apps/plugin-fs` | Idiomatic Tauri v2; handles permissions model |

**Key insight:** The only genuinely novel code in this phase is the resize transform (setSize + scaleContent + translateContent) and the size-estimation UX pattern (process → measure → display warning if over target).

---

## Common Pitfalls

### Pitfall 1: Expecting Real Compression from pdf-lib

**What goes wrong:** The UI promises "compress to 2 MB" but output is 8 MB — or larger than the input.
**Why it happens:** pdf-lib cannot downsample images, recompress JPEG streams, or strip unused objects. `useObjectStreams: true` only packs cross-reference tables. Re-saving a PDF that was already structurally optimised can produce output larger than the input.
**How to avoid:** Do not market the feature as "compression" in UI copy. Use language like "Optimise" or "Re-save". The size target should always go through the "best achievable + warning if over" path. Test with image-heavy PDFs to set expectations during development.
**Warning signs:** A 10 MB image-heavy PDF returns 10.2 MB after processing.

### Pitfall 2: `useCompression: true` Corrupts Output

**What goes wrong:** Processed PDF cannot be opened. Adobe Reader, Preview, and Chrome all reject it.
**Why it happens:** Documented open bug in pdf-lib (issue #1445, filed 2023, unresolved as of 2026-02-19).
**How to avoid:** Never set `useCompression: true`. Use only `{ useObjectStreams: true }` in `pdfDoc.save()`.
**Warning signs:** PDF file opens in no viewer after processing.

### Pitfall 3: pdfjs-dist Worker Resolution in Vite

**What goes wrong:** `Cannot read properties of undefined (reading 'promise')` or worker 404 error.
**Why it happens:** Vite hashes output filenames; the worker `.mjs` file may not resolve if loaded via a string literal path. Additionally, the worker must be set before any `getDocument()` call.
**How to avoid:** Use `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()`. Set `GlobalWorkerOptions.workerSrc` at module load time (top level of the thumbnail module, not inside a function).
**Warning signs:** Thumbnail renders fine in dev, breaks in built Tauri app.

### Pitfall 4: Memory Leak from pdfjs-dist Document

**What goes wrong:** App memory grows unboundedly if the user processes many PDFs in one session.
**Why it happens:** pdfjs-dist `PDFDocumentProxy` objects hold parsed page data in memory. If never destroyed, they accumulate.
**How to avoid:** Always call `pdfDoc.destroy()` after `toDataURL()` completes.
**Warning signs:** Memory usage in Tauri DevTools grows with each "Generate Preview" click.

### Pitfall 5: translateContent Y-Axis Direction

**What goes wrong:** Content is off-center or positioned outside the page after resize.
**Why it happens:** PDF coordinate origin is bottom-left. After `setSize` and `scaleContent`, the content origin is at the bottom-left of the old (scaled) content area. The centering offset formula must account for this correctly.
**How to avoid:** Use `xOffset = (targetW - origW * scale) / 2` and `yOffset = (targetH - origH * scale) / 2`, then call `translateContent(xOffset, yOffset)`. Test visually with both portrait→landscape and landscape→portrait transforms.
**Warning signs:** Content appears in the lower-left quadrant of a larger page.

### Pitfall 6: plugin-fs Not Registered

**What goes wrong:** `writeFile` throws "plugin not found" or similar at runtime.
**Why it happens:** Tauri v2 plugins must be registered in Rust (`lib.rs`) AND in capabilities (JSON). Forgetting either step silently fails at different points.
**How to avoid:** Checklist — (1) `tauri-plugin-fs = "2"` in Cargo.toml, (2) `.plugin(tauri_plugin_fs::init())` in lib.rs, (3) `npm install @tauri-apps/plugin-fs`, (4) `fs:allow-write-file` in capabilities JSON.
**Warning signs:** JS import works but runtime call throws.

### Pitfall 7: Save Dialog Permission Missing

**What goes wrong:** `save()` from plugin-dialog throws a Tauri IPC permission error.
**Why it happens:** Current capabilities only include `dialog:allow-open`. The `save()` function needs `dialog:allow-save` added separately.
**How to avoid:** Add `"dialog:allow-save"` to `src-tauri/capabilities/default.json` alongside the existing `"dialog:allow-open"`.
**Warning signs:** File open dialog works, save dialog throws.

---

## Code Examples

Verified patterns from official sources:

### Load + Save (pdf-lib basic round-trip)
```typescript
// Source: pdf-lib.js.org
import { PDFDocument } from 'pdf-lib';

const sourceBytes = await readFile(filePath); // Uint8Array from plugin-fs
const pdfDoc = await PDFDocument.load(sourceBytes);
// ... mutations ...
const outputBytes = await pdfDoc.save({ useObjectStreams: true });
// outputBytes is Uint8Array — pass directly to writeFile()
```

### Per-Page Resize with Scale-to-Fit
```typescript
// Source: pdf-lib.js.org/docs/api/classes/pdfpage + issue #128 discussion
import { PDFDocument, PageSizes } from 'pdf-lib';

const pages = pdfDoc.getPages();
const [targetW, targetH] = PageSizes.A4; // [595.28, 841.89]

for (const idx of selectedPageIndices) {
  const page = pages[idx];
  const { width: origW, height: origH } = page.getSize();

  // 1. Calculate uniform scale factor (preserves aspect ratio, fits within target)
  const scale = Math.min(targetW / origW, targetH / origH);

  // 2. Resize the page media box
  page.setSize(targetW, targetH);

  // 3. Scale page content to match the new dimensions
  page.scaleContent(scale, scale);

  // 4. Center the scaled content within the new page
  const xOffset = (targetW - origW * scale) / 2;
  const yOffset = (targetH - origH * scale) / 2;
  page.translateContent(xOffset, yOffset);
}
```

### Native Save Dialog + Write
```typescript
// Source: v2.tauri.app/plugin/dialog + v2.tauri.app/plugin/file-system
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

const savePath = await save({
  filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  defaultPath: 'processed.pdf',
});

if (savePath) {
  await writeFile(savePath, processedBytes); // processedBytes: Uint8Array from pdfDoc.save()
}
```

### Capability Configuration (src-tauri/capabilities/default.json)
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default app capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:allow-open",
    "dialog:allow-save",
    {
      "identifier": "fs:allow-read-file",
      "allow": [{ "path": "$HOME/**" }]
    },
    {
      "identifier": "fs:allow-write-file",
      "allow": [{ "path": "$HOME/**" }]
    }
  ]
}
```

---

## Discretion Recommendations

Based on research, here are the recommendations for the areas left to Claude's discretion:

### Quality Slider: Named Levels (not %)

**Recommendation:** Named levels — Low / Medium / High / Maximum — mapped to compression intent, not quality %.

**Rationale:** pdf-lib has no quality parameter. The "quality" control actually determines how aggressively the app attempts to hit the target size. Since re-saving always produces the same output regardless of a quality value, the slider must map to something meaningful. Named levels communicate intent better ("Low = smaller file, more loss if we could" vs "94% quality" which implies JPEG-style precision that does not exist). The slider will display the current level label and inform the user what to expect.

**Implementation:** 4 discrete steps: Low (aggressive structural optimisation, warn about size limits), Medium (default), High (prioritise quality), Maximum (no compression attempt, resize only). Since pdf-lib compression is structural-only, these levels mainly control whether compression is attempted at all and messaging.

### Page Selector UI: Page Range Input

**Recommendation:** Page range text input (e.g. "1-3, 5, 7-9") rather than thumbnail strip.

**Rationale:** A thumbnail strip for a 100-page PDF would require rendering all page thumbnails (100 × pdfjs-dist render calls) just to show the selector — expensive and slow. A range input is lightweight, fast, and common in PDF tools. For the Compare step, we already render page 1 as a preview. The range input parses to an index set and can show a page count badge ("3 pages selected").

### Estimation Trigger: Button-Triggered ("Generate Preview")

**Recommendation:** Button click, not live/auto.

**Rationale:** Producing the output bytes requires a full `pdfDoc.save()` call on every change. For a large PDF, this can take multiple seconds in the JS main thread (pdf-lib is synchronous within the save call). Triggering on every slider or input change would freeze the UI. A single "Generate Preview" button on the Configure step triggers processing, moves to Compare step with results.

### Cancel Button: No

**Recommendation:** Do not show a cancel button during processing.

**Rationale:** pdf-lib's `pdfDoc.save()` is a single synchronous-style Promise that cannot be interrupted mid-execution. It produces bytes internally and resolves when done. There is no cancellation API. The processing time for typical PDFs (under 50 pages, no giant images) is under 2-3 seconds on modern hardware — fast enough that a cancel button would be confusing rather than useful. Show a progress indicator ("Processing page N of M") and let it complete.

### Post-Save Flow: Toast + Stay on Compare

**Recommendation:** Show a success toast ("Saved to ~/Documents/file.pdf"), stay on the Compare step. Do not auto-reset to Step 1.

**Rationale:** Users may want to inspect the stats after saving, or save to a second location. Resetting would lose context. A toast at the bottom gives clear feedback without disrupting the view. Add a "Process Another File" or "Start Over" button on the Compare or Save step for users who want to reset.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdfjs-dist `pdf.worker.js` (CJS) | `pdf.worker.min.mjs` (ESM) | pdfjs-dist v4.x | Must use `.mjs` path, not `.js`, in Vite projects |
| Tauri v1 `writeBinaryFile` | Tauri v2 `writeFile` from plugin-fs | Tauri v2 | API renamed; plugin must be explicitly registered |
| Tauri v1 allowlist permissions | Tauri v2 capabilities JSON files | Tauri v2 | Permissions are per-window capability files in `src-tauri/capabilities/` |
| pdf-lib `useCompression: true` | Do not use — corrupts output | Issue filed 2023 | Avoid entirely |

**Deprecated/outdated:**
- `writeBinaryFile`: Tauri v1 API — use `writeFile` from `@tauri-apps/plugin-fs` in v2
- `useCompression: true` in pdf-lib SaveOptions: documented as causing corruption (issue #1445), unfixed
- `convertFileSrc` for thumbnail rendering: fragile in v2, requires asset protocol setup; avoid when in-memory bytes are available

---

## Open Questions

1. **pdfjs-dist worker in production Tauri build**
   - What we know: `import.meta.url` with `.mjs` worker path is the recommended pattern for Vite
   - What's unclear: Whether Tauri's production build (Vite build → Tauri bundle) correctly resolves the `.mjs` worker asset and whether Vite hashes the filename
   - Recommendation: Test the production build early (Phase 2 task 1 should include a build smoke test). Fallback: copy worker to `public/` and reference as `/pdf.worker.min.mjs`

2. **pdf-lib memory usage for large PDFs**
   - What we know: pdf-lib loads the entire PDF into JS heap; large PDFs (50+ MB) could be problematic
   - What's unclear: Whether the Tauri webview (WebKit on macOS) has JS heap limits that affect large files
   - Recommendation: Not a blocker for MVP. Flag for Phase 4 (polish) if reports come in.

3. **Scope of `fs:allow-write-file` capability**
   - What we know: The save dialog returns the user's chosen path; plugin-fs writeFile requires a scope that includes that path
   - What's unclear: Whether `$HOME/**` is broad enough to cover all common save locations (Desktop, Downloads, Documents, external drives)
   - Recommendation: Use `$HOME/**` for the scope initially. External drives (e.g. `/Volumes/` on macOS) are outside `$HOME` — note as a known limitation or add `/**` as scope (permissive but acceptable for a local tool).

---

## Sources

### Primary (HIGH confidence)
- pdf-lib.js.org/docs/api/classes/pdfpage — PDFPage methods: setSize, scaleContent, translateContent, scale, getSize verified
- pdf-lib.js.org/docs/api/classes/pdfdocument — PDFDocument.load, save, getPages, getPageCount verified
- pdf-lib.js.org/docs/api/interfaces/saveoptions — SaveOptions interface verified (useObjectStreams confirmed, useCompression not in official docs)
- v2.tauri.app/plugin/dialog — save() function signature, filters, defaultPath, return type verified
- v2.tauri.app/plugin/file-system — writeFile, readFile, permission identifiers verified
- deepwiki.com/mozilla/pdfjs-dist/4.1-canvas-rendering — getDocument, getPage, getViewport, render canvas pattern verified
- github.com/Hopding/pdf-lib issue #128 — setSize + scaleContent + translateContent scale-to-fit pattern confirmed by maintainer

### Secondary (MEDIUM confidence)
- github.com/Hopding/pdf-lib issue #1445 — useCompression: true corruption bug, confirmed open and unresolved
- github.com/Hopding/pdf-lib issue #1657 — compression as feature request confirms no native support
- github.com/Hopding/pdf-lib issue #54 — useObjectStreams structural optimisation, 0.62–2.82% measured reduction on tested files
- github.com/mozilla/pdf.js discussions/19090 — Vite + pdfjs-dist v4 worker setup, workerSrc pattern
- github.com/mozilla/pdf.js discussions/19520 — Vite worker import failure confirmed, manual assignment workaround

### Tertiary (LOW confidence)
- studyraid.com/pdf-lib — PageSizes constants values (A4, A3, Letter in points) — cross-referenced with pdf-lib.js.org/docs/api, elevated to MEDIUM

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official docs and Context7 equivalents
- Page resize (PDF-02): HIGH — `setSize`, `scaleContent`, `translateContent` verified against official API docs and confirmed working in issue thread
- Compression (PDF-01): HIGH confidence that pdf-lib cannot truly compress — confirmed by multiple open issues and maintainer comments. Strategy (re-save + warn) is LOW-MEDIUM on effectiveness prediction
- Thumbnail rendering (PDF-03): MEDIUM — pdfjs-dist canvas pattern is well documented; Vite/Tauri worker resolution has known edge cases requiring build testing
- Tauri plugin wiring (UX-02): HIGH — official Tauri v2 docs are authoritative
- Discretion decisions: MEDIUM — pragmatic recommendations based on library constraints

**Research date:** 2026-02-19
**Valid until:** 2026-08-19 (pdf-lib is stable/slow-moving; Tauri v2 plugin APIs are stable)
