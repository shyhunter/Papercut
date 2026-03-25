# Phase 12: Advanced PDF Tools - Research

**Researched:** 2026-03-04
**Domain:** PDF manipulation (signatures, redaction, archival conversion, repair)
**Confidence:** MEDIUM (codebase patterns are HIGH; external library capabilities rely partly on training knowledge)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sign PDF interaction:**
- Creation methods: All three -- freehand canvas drawing, typed text with signature font, and image upload
- Placement: Drag-and-drop on page preview with resize handles (drag corners)
- Multi-page: User can choose: current page, all pages, or a custom page range
- Persistence: Signatures saved to local storage for reuse in future documents
- Flow: Custom step pattern (pick -> create/select signature -> place on page -> save) -- more interactive than standard tools

**Redact tool behavior:**
- Selection methods: Both -- draw rectangles on page preview AND text search with highlight/confirm
- Removal: True permanent redaction -- underlying content (text, images) actually removed from PDF, not just visually covered
- Preview: Live preview -- redaction rectangles shown on the page in real-time as user adds them
- Multi-page: User can navigate between pages and add redactions across all pages before applying
- Flow: Custom step pattern (pick -> navigate pages / draw+search redactions -> save) -- interactive, not standard configure

**PDF/A conversion:**
- Conformance levels: Multiple options -- PDF/A-1b, PDF/A-2b, PDF/A-3b (user selects)
- Processing: GS sidecar with `-dPDFA` flag
- Flow: Pick -> Configure (level selector) -> Save

**Repair PDF:**
- Processing: GS sidecar re-process (read + rewrite)
- Partial repair: If GS produces output with warnings, offer the partial result with a warning about potential issues (don't just fail)
- Flow: Pick -> Configure (info panel) -> Save

**Shared patterns:**
- SaveStep: Reuse existing SaveStep component across all 4 tools
- Dashboard: Add to existing grid layout (no separate "Advanced" section)
- Category: All 4 are PDF tools in the tool registry

### Claude's Discretion
- Feedback level for PDF/A conversion (simple vs detailed report of what changed)
- Whether to show file size comparison after PDF/A and Repair processing
- Exact step naming and progress indicator for custom flows
- Signature font choices for typed signature mode
- Canvas drawing tool specifics (pen width, color, smoothing)

### Deferred Ideas (OUT OF SCOPE)
- Digital certificate signing (PFX/P12) for Sign PDF -- future phase, significantly more complex
- PDF validation/compliance checking -- could be its own tool
- Batch redaction across multiple PDFs -- future phase
</user_constraints>

## Summary

Phase 12 adds four advanced PDF tools to Papercut's dashboard: Sign PDF, Redact PDF, PDF/A Conversion, and Repair PDF. These tools span two implementation categories:

**Client-side (pdf-lib + canvas):** Sign PDF and Redact PDF are primarily TypeScript/browser-based tools. Sign PDF uses HTML5 Canvas for freehand drawing, pdf-lib's `embedPng`/`embedJpg` + `drawImage` API for stamping signature images onto pages, and `tauri-plugin-store` for persisting saved signatures to local storage. Redact PDF uses pdfjs-dist for rendering page previews and overlay-based rectangle selection, then pdf-lib for the actual content removal (drawing opaque rectangles and removing text operators). Both require custom interactive step flows with page navigation and visual placement UI.

**GS sidecar:** PDF/A Conversion and Repair PDF follow the established protect_pdf/unlock_pdf pattern in `lib.rs`. PDF/A uses `-dPDFA` and `-dPDFACompatibilityPolicy` flags. Repair uses a simple read-rewrite through GS's pdfwrite device. Both are straightforward Rust commands with minimal UI.

**Primary recommendation:** Build Sign PDF and Redact PDF first (they're the most complex and have custom UIs). PDF/A and Repair are quick GS sidecar additions that follow existing patterns exactly.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-lib | ^1.17.1 | Embed images, draw rectangles, modify pages | Already used for watermark, page numbers, crop, organize |
| pdfjs-dist | ^5.4.624 | Render PDF pages to canvas for preview/interaction | Already used for thumbnails throughout app |
| tauri-plugin-store | ^2.4.2 | Persist saved signatures to local storage | Already used for recent directories |
| Ghostscript (sidecar) | Bundled | PDF/A conversion and PDF repair | Already used for compress, protect, unlock |

### Supporting (new, but no npm install needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| HTML5 Canvas API | Browser built-in | Freehand signature drawing | Sign PDF -- drawing pad component |
| pdfjs-dist text layer | ^5.4.624 | Extract text positions for search-based redaction | Redact PDF -- `page.getTextContent()` for text search |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas freehand drawing | Fabric.js or Konva.js | Adds dependency; raw Canvas API is sufficient for simple line drawing |
| pdf-lib for redaction | qpdf or mutool | Would need additional sidecar; pdf-lib handles the drawing, but true text removal requires careful operator manipulation |

**Installation:**
```bash
# No new dependencies needed -- everything is already in the project
# Signature fonts can use pdf-lib's StandardFonts (Courier, Helvetica) or embed custom web fonts
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    sign-pdf/
      SignPdfFlow.tsx           # Main flow: pick -> create/select sig -> place -> save
      SignatureCreateStep.tsx   # Create or select from saved signatures
      SignaturePlaceStep.tsx    # Page preview with drag-and-drop placement
      SignatureCanvas.tsx       # Freehand drawing canvas component
      SignatureTyped.tsx        # Typed text with font preview
      SignatureUpload.tsx       # Image upload for signature
    redact-pdf/
      RedactPdfFlow.tsx         # Main flow: pick -> navigate/redact -> save
      RedactStep.tsx            # Page navigation + rectangle drawing + text search
      RedactOverlay.tsx         # SVG/Canvas overlay for drawing rectangles
  lib/
    pdfSign.ts                 # Embed signature image onto PDF pages via pdf-lib
    pdfRedact.ts               # Apply redactions (draw black rects + remove content)
  types/
    tools.ts                   # Add 4 new ToolIds
src-tauri/
  src/
    lib.rs                     # Add convert_pdfa and repair_pdf commands
```

### Pattern 1: Signature Embedding via pdf-lib
**What:** Draw a signature (canvas/text/image), convert to PNG bytes, embed into PDF pages at specified coordinates.
**When to use:** Sign PDF tool -- after user places signature on page preview.
**Example:**
```typescript
// Based on pdf-lib documented API for embedPng/drawImage
import { PDFDocument } from 'pdf-lib';

export interface SignatureOptions {
  imageBytes: Uint8Array;         // PNG bytes from canvas/upload
  x: number;                      // Position relative to page (0,0 = bottom-left in PDF coords)
  y: number;
  width: number;                  // Display width on page
  height: number;                 // Display height on page
  pageIndices: number[];          // Which pages to apply to
}

export async function addSignature(
  pdfBytes: Uint8Array,
  options: SignatureOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const sigImage = await doc.embedPng(options.imageBytes);
  const pages = doc.getPages();

  for (const pageIndex of options.pageIndices) {
    if (pageIndex < pages.length) {
      pages[pageIndex].drawImage(sigImage, {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      });
    }
  }

  return new Uint8Array(await doc.save({ useObjectStreams: true }));
}
```

### Pattern 2: GS Sidecar Command (PDF/A and Repair)
**What:** Follow the exact same pattern as `protect_pdf` and `unlock_pdf` in `lib.rs`.
**When to use:** PDF/A conversion and Repair.
**Example:**
```rust
// PDF/A conversion -- follows protect_pdf pattern in lib.rs
#[tauri::command]
async fn convert_pdfa(
    app: tauri::AppHandle,
    source_path: String,
    pdfa_level: String,  // "1" | "2" | "3"
) -> Result<tauri::ipc::Response, String> {
    // Validate level
    let valid_levels = ["1", "2", "3"];
    if !valid_levels.contains(&pdfa_level.as_str()) {
        return Err(format!("Invalid PDF/A level: {}", pdfa_level));
    }

    let tmp_path = std::env::temp_dir().join(format!(
        "papercut_pdfa_{}.pdf",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()
    ));

    // GS needs a PDFA_def.ps file for metadata -- generate it
    let pdfa_def_path = std::env::temp_dir().join("papercut_PDFA_def.ps");
    let pdfa_def_content = format!(
        "[ /Title (Converted)\n  /DOCINFO pdfmark\n<< /Type /Catalog /MarkInfo << /Marked true >> >> /PUT pdfmark"
    );
    std::fs::write(&pdfa_def_path, &pdfa_def_content)
        .map_err(|e| format!("Failed to write PDFA_def.ps: {}", e))?;

    let (mut rx, _child) = app
        .shell()
        .sidecar("gs")
        .map_err(|e| format!("Failed to locate Ghostscript sidecar: {}", e))?
        .args([
            "-sDEVICE=pdfwrite",
            "-dNOPAUSE",
            "-dBATCH",
            "-dQUIET",
            &format!("-dPDFA={}", pdfa_level),
            "-dPDFACompatibilityPolicy=1",  // 1 = try to fix, not abort
            "-sColorConversionStrategy=RGB",
            &format!("-sOutputFile={}", tmp_path.to_string_lossy()),
            &pdfa_def_path.to_string_lossy().to_string(),
            &source_path,
        ])
        .spawn()
        .map_err(|e| format!("Ghostscript spawn failed: {}", e))?;

    // ... same event loop as protect_pdf ...
}
```

### Pattern 3: Interactive Page Preview with Overlay
**What:** Render PDF page via pdfjs-dist, overlay an absolutely-positioned div or SVG for user interactions (drawing rectangles, placing signatures).
**When to use:** Both Sign PDF and Redact PDF tools.
**Example:**
```typescript
// Page preview with interactive overlay
function PagePreview({ pdfBytes, pageIndex, scale, children }: {
  pdfBytes: Uint8Array;
  pageIndex: number;
  scale: number;
  children: React.ReactNode; // Overlay content (signature drag handle, redaction rects)
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Render page to canvas via pdfjs-dist
    // Set dimensions state for overlay positioning
  }, [pdfBytes, pageIndex, scale]);

  return (
    <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
      <canvas ref={canvasRef} />
      {/* Interactive overlay positioned absolutely on top of canvas */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
```

### Pattern 4: Signature Persistence via tauri-plugin-store
**What:** Save signature PNG bytes + metadata to local storage for reuse.
**When to use:** Sign PDF -- after user creates a signature, persist it for future documents.
**Example:**
```typescript
// Follow the useRecentDirs hook pattern already in the codebase
import { Store } from '@tauri-apps/plugin-store';

interface SavedSignature {
  id: string;
  name: string;
  type: 'drawn' | 'typed' | 'uploaded';
  dataUrl: string;   // PNG data URL
  createdAt: number;
}

const STORE_KEY = 'saved-signatures';
const MAX_SIGNATURES = 10;

export function useSavedSignatures() {
  // Load from store on mount, save on change
  // Same pattern as useRecentDirs
}
```

### Anti-Patterns to Avoid
- **Visual-only redaction:** Never just draw black rectangles over content. The text/image data remains in the PDF and can be extracted. True redaction must remove the underlying content operators from the PDF content streams.
- **Large signature images:** Convert canvas to PNG at reasonable resolution (e.g., 2x device pixel ratio max). Don't embed a 4000x4000 PNG for a small signature stamp.
- **PDF coordinate confusion:** PDF uses bottom-left origin; browser canvas uses top-left. The placement UI must translate coordinates correctly when mapping from screen position to pdf-lib's drawImage coordinates.
- **Synchronous GS calls:** Always use async Rust commands with the sidecar event loop pattern (matching compress_pdf/protect_pdf). Never block the main thread.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF page rendering | Custom PDF renderer | pdfjs-dist `renderAllPdfPages` | Already in project, handles fonts/images/vectors correctly |
| Image embedding in PDF | Raw PDF stream manipulation | pdf-lib `embedPng` / `embedJpg` + `drawImage` | Handles compression, cross-referencing, stream encoding |
| PDF/A conversion | Custom metadata/color space injection | Ghostscript `-dPDFA` flag | PDF/A compliance requires ICC profiles, metadata, font embedding -- extremely complex |
| PDF repair | Custom PDF parser/fixer | Ghostscript pdfwrite re-process | GS has decades of handling malformed PDFs; custom parser would miss edge cases |
| Signature font rendering | Custom font file loading | Canvas `ctx.font` with web fonts or pdf-lib `StandardFonts` | Browser handles font rendering; pdf-lib handles embedding |
| Smooth line drawing | Custom bezier interpolation | Canvas quadraticCurveTo with point averaging | Well-known technique for smooth freehand drawing |

**Key insight:** Sign and Redact are UI-heavy tools that happen to modify PDFs. The PDF manipulation part is straightforward with pdf-lib -- the complexity is in the interactive UI (canvas drawing, drag-and-drop placement, page navigation with overlays). Don't over-engineer the PDF part; invest in the UX.

## Common Pitfalls

### Pitfall 1: Redaction That Doesn't Actually Redact
**What goes wrong:** Drawing black rectangles over text in a PDF without removing the underlying text operators. The "redacted" text can be copy-pasted or extracted by any PDF reader.
**Why it happens:** pdf-lib's `drawRectangle` only adds a visual layer -- it doesn't remove existing content.
**How to avoid:** After drawing opaque rectangles, also modify the page's content stream to remove text operators in the redacted regions. Use pdfjs-dist's `getTextContent()` to identify text positions, then either (a) use pdf-lib to flatten and re-render pages through Ghostscript, or (b) manipulate content streams directly. The safest approach for true redaction is to render the page to an image (with redaction rectangles applied) and re-embed that image as the page content -- this guarantees no extractable text remains.
**Warning signs:** If you can still select/copy text from "redacted" areas in the output PDF, redaction has failed.

### Pitfall 2: PDF Coordinate System Mismatch
**What goes wrong:** Signatures appear in the wrong position or inverted because PDF uses bottom-left origin while canvas/browser uses top-left origin.
**Why it happens:** pdf-lib's coordinate system has (0,0) at bottom-left of the page. Screen coordinates have (0,0) at top-left. Forgetting to invert the Y axis causes placement bugs.
**How to avoid:** When converting from screen position to PDF position: `pdfY = pageHeight - screenY - signatureHeight`. Always account for the scale factor between rendered preview and actual PDF dimensions.
**Warning signs:** Signature appears at the bottom when placed at the top, or vice versa.

### Pitfall 3: PDF/A PDFA_def.ps Requirements
**What goes wrong:** GS's `-dPDFA` flag requires a PostScript definitions file (`PDFA_def.ps`) that sets document metadata. Without it, GS may fail or produce non-compliant output.
**Why it happens:** PDF/A requires specific metadata (title, creation date, ICC color profile reference) that GS doesn't generate automatically.
**How to avoid:** Generate a minimal `PDFA_def.ps` file in the temp directory before invoking GS. Include the required `/Title`, `/DOCINFO pdfmark`, and catalog entries. GS ships with a template `PDFA_def.ps` in its lib directory -- reference or generate a minimal version.
**Warning signs:** GS exits with errors about missing pdfmark definitions or PDF/A compliance failures.

### Pitfall 4: React StrictMode Double-Effect on Canvas
**What goes wrong:** Canvas-based signature drawing or page rendering breaks because effects run twice, reinitializing or clearing the canvas.
**Why it happens:** React StrictMode (active in dev) mounts, unmounts, and remounts components. Canvas state (drawn paths, rendered pages) is lost on the second mount.
**How to avoid:** Use `pdfBytes.slice()` for pdfjs-dist (already established pattern). For signature canvas, store drawn paths in React state (not just on canvas) and re-render from state on mount. Use the `cancelled` flag pattern from existing effects.
**Warning signs:** Canvas appears blank or flickers on mount in dev mode.

### Pitfall 5: GS Repair Partial Success Handling
**What goes wrong:** GS exits with non-zero code but actually produced valid (partially repaired) output. The current protect_pdf/unlock_pdf pattern treats any non-zero exit as failure and deletes the temp file.
**Why it happens:** GS reports warnings as non-zero exit codes even when it successfully wrote output.
**How to avoid:** For repair specifically, check if the temp file exists AND has non-zero size before treating a non-zero exit as failure. If output exists, return it with a warning flag instead of an error. This requires modifying the standard GS event loop pattern.
**Warning signs:** Repair "fails" on PDFs that GS actually fixed but with warnings.

### Pitfall 6: Large Signature Canvas Memory
**What goes wrong:** Exporting a full-page canvas at high DPI as PNG creates very large byte arrays that slow down embedding.
**Why it happens:** Signature canvas exports at device pixel ratio, which on Retina displays is 2x or 3x.
**How to avoid:** Crop the signature canvas to just the bounding box of drawn content before exporting. For typed signatures, render at a reasonable fixed size (e.g., 600x200 pixels max). For uploaded images, resize if larger than needed.
**Warning signs:** Embedding a signature causes noticeable lag or bloated PDF output size.

## Code Examples

### Freehand Signature Canvas Drawing
```typescript
// Smooth freehand drawing using quadratic Bezier curves
// Standard technique: average consecutive points for control points
interface Point { x: number; y: number; }

function SignatureCanvas({ width, height, onComplete }: {
  width: number;
  height: number;
  onComplete: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Point[][]>([]);
  const currentPath = useRef<Point[]>([]);

  const getPoint = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    currentPath.current = [getPoint(e)];
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    currentPath.current.push(getPoint(e));
    redraw();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPaths(prev => [...prev, currentPath.current]);
    currentPath.current = [];
  };

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allPaths = [...paths, currentPath.current];
    for (const path of allPaths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length - 1; i++) {
        const midX = (path[i].x + path[i + 1].x) / 2;
        const midY = (path[i].y + path[i + 1].y) / 2;
        ctx.quadraticCurveTo(path[i].x, path[i].y, midX, midY);
      }
      ctx.stroke();
    }
  };

  const exportSignature = () => {
    onComplete(canvasRef.current!.toDataURL('image/png'));
  };

  return (/* canvas element with mouse handlers */);
}
```

### Typed Signature with Font
```typescript
// Render text as signature using Canvas for preview, then export as PNG for pdf-lib
const SIGNATURE_FONTS = [
  { name: 'Cursive', css: "'Dancing Script', cursive" },
  { name: 'Handwritten', css: "'Caveat', cursive" },
  { name: 'Elegant', css: "'Great Vibes', cursive" },
  { name: 'Simple', css: "'Courier New', monospace" },
];

// Note: These are Google Fonts. For offline use, either:
// 1. Bundle font files and use @font-face in CSS
// 2. Fall back to system fonts that look signature-like
// Recommendation: Bundle 2-3 cursive/handwriting fonts as WOFF2 files
// in the src/assets/ directory. Total size ~50-150KB.
```

### Redaction via Render-to-Image Approach (Safest)
```typescript
// The safest redaction approach: render page to image with redactions applied,
// then replace the page content with the rendered image.
// This GUARANTEES no extractable text remains.

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

interface Redaction {
  pageIndex: number;
  x: number;      // PDF coords (bottom-left origin)
  y: number;
  width: number;
  height: number;
}

async function applyRedactions(
  pdfBytes: Uint8Array,
  redactions: Redaction[],
): Promise<Uint8Array> {
  // Group redactions by page
  const byPage = new Map<number, Redaction[]>();
  for (const r of redactions) {
    const list = byPage.get(r.pageIndex) ?? [];
    list.push(r);
    byPage.set(r.pageIndex, list);
  }

  // Render redacted pages to images via pdfjs-dist
  const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  for (const [pageIndex, rects] of byPage) {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    // Render the page
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Draw black rectangles over redacted areas (in canvas coords)
    ctx.fillStyle = '#000000';
    for (const rect of rects) {
      // Convert PDF coords to canvas coords
      const canvasX = rect.x * (viewport.width / page.getViewport({ scale: 1 }).width);
      const canvasY = viewport.height - (rect.y + rect.height) * (viewport.height / page.getViewport({ scale: 1 }).height);
      const canvasW = rect.width * (viewport.width / page.getViewport({ scale: 1 }).width);
      const canvasH = rect.height * (viewport.height / page.getViewport({ scale: 1 }).height);
      ctx.fillRect(canvasX, canvasY, canvasW, canvasH);
    }

    // Export to PNG and embed as the page content
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    );
    const imageBytes = new Uint8Array(await blob.arrayBuffer());
    const image = await doc.embedPng(imageBytes);

    // Replace page content with image
    const pdfPage = doc.getPages()[pageIndex];
    const { width, height } = pdfPage.getSize();
    // Clear existing content by resetting the page
    // Note: pdf-lib doesn't have a "clear page" API -- we need to
    // create a new page, add the image, and swap it in
    // Alternative: use GS to flatten after adding opaque rects
  }

  pdfDoc.destroy();
  return new Uint8Array(await doc.save());
}

// IMPORTANT: The render-to-image approach has a tradeoff:
// - PRO: Guarantees no text data remains (the page IS an image)
// - CON: Text on non-redacted areas becomes non-selectable
// For professional use, this is the correct tradeoff for a redaction tool.
```

### GS Repair with Partial Success
```rust
// Repair PDF -- modified event loop to handle partial success
#[tauri::command]
async fn repair_pdf(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<tauri::ipc::Response, String> {
    let tmp_path = std::env::temp_dir().join(format!(
        "papercut_repaired_{}.pdf",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()
    ));
    let tmp_path_str = tmp_path.to_string_lossy().to_string();

    let (mut rx, _child) = app
        .shell()
        .sidecar("gs")
        .map_err(|e| format!("Failed to locate Ghostscript sidecar: {}", e))?
        .args([
            "-sDEVICE=pdfwrite",
            "-dNOPAUSE",
            "-dBATCH",
            "-dQUIET",
            &format!("-sOutputFile={}", tmp_path_str),
            &source_path,
        ])
        .spawn()
        .map_err(|e| format!("Ghostscript spawn failed: {}", e))?;

    let mut stderr_lines: Vec<String> = Vec::new();
    let mut exit_code: Option<i32> = None;
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Terminated(payload) => {
                exit_code = payload.code;
                break;
            }
            CommandEvent::Stderr(line) => {
                stderr_lines.push(String::from_utf8_lossy(&line).to_string());
            }
            CommandEvent::Error(e) => {
                let _ = std::fs::remove_file(&tmp_path);
                return Err(format!("Ghostscript error: {}", e));
            }
            _ => {}
        }
    }

    // KEY DIFFERENCE from protect_pdf: check for partial success
    // If output file exists and has content, return it even on non-zero exit
    if tmp_path.exists() {
        let bytes = std::fs::read(&tmp_path)
            .map_err(|e| format!("Failed to read output: {}", e))?;
        let _ = std::fs::remove_file(&tmp_path);

        if !bytes.is_empty() {
            // Non-zero exit with output = partial repair
            // Prefix with WARNING: so TypeScript can detect and display warning
            if exit_code != Some(0) {
                let warnings = stderr_lines.join("\n");
                // Return bytes but signal partial repair via a special header
                // The TS side checks for this prefix in the error case
                return Ok(tauri::ipc::Response::new(bytes));
                // Note: To signal warnings, use a custom response or
                // return a JSON wrapper. See Open Questions below.
            }
            return Ok(tauri::ipc::Response::new(bytes));
        }
    }

    // No output at all = real failure
    let _ = std::fs::remove_file(&tmp_path);
    let stderr = stderr_lines.join("\n");
    Err(format!("Repair failed: {}", stderr))
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Visual-only redaction (black rectangles) | Render-to-image redaction | Industry standard post-2020 | Legal/compliance requirement -- visual-only is a security vulnerability |
| Certificate-based digital signatures | Visual stamp signatures (v1) | N/A (different features) | Digital signing deferred; visual stamps are simpler and cover most use cases |
| gs -dPDFA=1 only | gs -dPDFA={1,2,3} with compatibility policy | GS 9.20+ | PDF/A-2b and PDF/A-3b support more features (transparency, attachments) |

**Deprecated/outdated:**
- pdf-lib's `PDFFont.embedFont` with custom TTF has known issues with some font formats. Prefer `StandardFonts` for simplicity, or thoroughly test custom fonts.

## Discretionary Recommendations

### Feedback level for PDF/A conversion
**Recommendation:** Show a simple success message with the selected conformance level, plus file size comparison (original vs converted). Detailed reports of "what changed" would require parsing GS's verbose output, which is unreliable and adds complexity for little user value. The key information is: "Did it succeed?" and "How big is the output?"

### File size comparison for PDF/A and Repair
**Recommendation:** Yes, show file size comparison. Both tools produce a new PDF, so displaying "Original: X MB -> Output: Y MB" is trivial (the bytes are already in memory) and gives users confidence the tool did something.

### Step naming for custom flows
**Recommendation:**
- Sign PDF: "Select PDF" -> "Signature" -> "Place" -> "Save" (4 steps)
- Redact PDF: "Select PDF" -> "Redact" -> "Save" (3 steps)
- PDF/A: "Select PDF" -> "Configure" -> "Save" (3 steps)
- Repair PDF: "Select PDF" -> "Repair" -> "Save" (3 steps, where "Repair" shows info + progress)

### Signature font choices
**Recommendation:** Bundle 3 web fonts (WOFF2 format, ~50KB each) for offline use:
1. A flowing script font (e.g., Dancing Script or similar open-source cursive)
2. A casual handwriting font (e.g., Caveat or similar)
3. A formal script font (e.g., Great Vibes or similar)
Plus the system monospace font as a fallback. Total bundle size increase: ~150KB.

### Canvas drawing specifics
**Recommendation:**
- Pen width: 2-3px default, no user control needed for v1
- Color: Black only for v1 (signatures are black)
- Smoothing: Quadratic Bezier curve interpolation (as shown in code example)
- Clear button to start over
- Crop to bounding box on export to minimize embedded image size

## Open Questions

1. **Repair PDF: How to signal partial success to TypeScript?**
   - What we know: The Rust command returns `Result<Response, String>`. Success returns bytes, error returns a string. There's no built-in way to return bytes WITH a warning message.
   - What's unclear: Best approach to pass both "here are the repaired bytes" and "GS reported warnings" to the frontend.
   - Recommendation: Return the bytes as success (Response), but also include stderr output in a separate way. Options: (a) use a custom JSON response wrapping both bytes + warnings, (b) add a separate `repair_pdf_status` command that returns warnings, (c) simplest -- log warnings to console and show a generic "Repaired with warnings" message in the UI if exit code was non-zero. Option (c) is simplest; use the stderr in the Rust error message only if the file is truly missing.
   - **Simplest approach:** Return bytes as success. If exit code is non-zero but output exists, return bytes. If exit code is non-zero and no output, return error. The TypeScript side can compare input/output sizes and show "Repair complete" vs "Repair complete (some issues may remain)" based on whether the file is healthy.

2. **Redaction: pdf-lib content stream manipulation vs render-to-image?**
   - What we know: pdf-lib can draw rectangles but cannot remove text operators from content streams. pdfjs-dist can identify text positions. Render-to-image guarantees redaction but makes all text non-selectable.
   - What's unclear: Whether a hybrid approach (remove text operators + draw rectangles) is feasible with pdf-lib alone.
   - Recommendation: Use the render-to-image approach for pages that have redactions. Non-redacted pages pass through unchanged. This is the safest approach and aligns with the user's requirement for "true permanent redaction." Document the tradeoff (non-selectable text on redacted pages) in the UI.

3. **Signature fonts: Bundle or system fonts?**
   - What we know: The app runs offline. Google Fonts won't load. System fonts vary by OS.
   - What's unclear: Licensing constraints for bundled fonts.
   - Recommendation: Use open-source fonts (OFL license) like those from Google Fonts. Download the WOFF2 files, add to `src/assets/fonts/`, and declare via `@font-face` in CSS. This is standard practice for offline apps.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** `./src-tauri/src/lib.rs` -- GS sidecar pattern (compress_pdf, protect_pdf, unlock_pdf)
- **Codebase analysis:** `./src/types/tools.ts` -- Tool registry pattern
- **Codebase analysis:** `./src/lib/pdfWatermark.ts` -- pdf-lib page drawing pattern
- **Codebase analysis:** `./src/components/organize-pdf/OrganizePdfFlow.tsx` -- Custom step flow pattern with page thumbnails
- **Codebase analysis:** `./src/lib/pdfThumbnail.ts` -- pdfjs-dist rendering pattern
- **Codebase analysis:** `./src/components/protect-pdf/ProtectPdfFlow.tsx` -- GS-based tool flow pattern

### Secondary (MEDIUM confidence)
- pdf-lib API for `embedPng`, `embedJpg`, `drawImage` -- based on training knowledge of pdf-lib v1.17; API is stable and well-documented
- Ghostscript `-dPDFA` flag and `PDFA_def.ps` requirement -- based on training knowledge of GS documentation; exact flags may need validation
- HTML5 Canvas API for freehand drawing -- well-established browser API, HIGH confidence

### Tertiary (LOW confidence)
- Ghostscript's exact behavior with `-dPDFA=2` and `-dPDFA=3` for PDF/A-2b and PDF/A-3b -- needs validation against current GS version bundled with the app
- pdfjs-dist text layer `getTextContent()` API for text position extraction -- API exists but exact format of returned items needs verification during implementation
- Font licensing details for bundled signature fonts -- needs verification before selecting specific fonts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in the project, patterns well-established
- Architecture: HIGH -- follows existing codebase patterns exactly (custom flows, GS sidecar, pdf-lib processing)
- Sign PDF implementation: MEDIUM -- pdf-lib embedPng/drawImage is well-documented, but canvas interaction UX and coordinate translation need careful implementation
- Redact PDF implementation: MEDIUM -- render-to-image approach is sound but the exact pdf-lib page replacement technique needs validation during implementation
- PDF/A conversion: MEDIUM -- GS `-dPDFA` flag is documented but `PDFA_def.ps` requirements vary by GS version
- Repair PDF: HIGH -- simplest of all four tools, follows protect_pdf pattern almost exactly
- Pitfalls: HIGH -- based on well-known PDF coordinate system issues and React StrictMode patterns already encountered in this codebase

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable domain, no fast-moving dependencies)
