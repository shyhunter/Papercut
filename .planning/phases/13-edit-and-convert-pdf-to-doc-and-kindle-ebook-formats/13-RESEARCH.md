# Phase 13: Edit and Convert PDF to DOC and Kindle Ebook Formats - Research

**Researched:** 2026-03-07
**Domain:** PDF editing, document format conversion (DOCX/DOC/ODT/EPUB/MOBI/AZW3/TXT/RTF)
**Confidence:** MEDIUM

## Summary

This phase introduces two major capabilities to Papercut: (1) a side-panel PDF editor for text and image editing with built-in export/convert, and (2) a standalone document conversion tool supporting bidirectional conversion between PDF and multiple document/ebook formats.

The core architectural challenge is that no single JavaScript library handles the full scope. PDF editing requires a layered approach -- pdf-lib for structural modifications (add/remove/reposition content) combined with pdfjs-dist for rendering and text extraction with position data. For format conversion, the project needs two sidecar binaries: **LibreOffice** (headless mode for document formats: DOCX, DOC, ODT, PDF) and **Calibre's ebook-convert** (for ebook formats: EPUB, MOBI, AZW3). These sidecars follow the same pattern already established with Ghostscript.

**Primary recommendation:** Build the PDF editor using pdf-lib for content manipulation + pdfjs-dist for rendering/text-extraction. Use LibreOffice and Calibre as sidecar binaries for format conversion, following the existing Ghostscript sidecar pattern in `lib.rs`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Dashboard tools:** Two new tools: "Edit PDF" (side-panel editor with text/image editing + convert/export) and "Convert Document" (standalone format conversion)
- **Conversion formats:** Bidirectional PDF <-> DOCX, DOC, ODT, EPUB (2+3), MOBI, AZW3, TXT, RTF
- **PDF-to-DOCX fidelity:** Maximum fidelity -- preserve visual layout AND keep content editable
- **PDF-to-EPUB:** User chooses between reflowable and fixed-layout per conversion
- **Font embedding:** Embed original fonts in output by default
- **User conversion controls:** Font family/size, page margins, line spacing/paragraph distance
- **PDF text editing:** Full text editing (click to edit inline, change font/size/color/alignment, replace content, add new text blocks, delete text)
- **PDF image editing:** Insert, replace, resize (drag handles with aspect ratio lock), move/reposition, delete, rotate (90/180/270), flip (horizontal/vertical)
- **Edit PDF layout:** Side panel editor -- PDF preview on one side, editing controls panel on the other
- **Edit PDF navigation:** Collapsible thumbnail sidebar on left + previous/next page arrows with page number input
- **Convert Document flow:** Full step flow -- Pick -> Configure (format, font, margins, spacing) -> Compare -> Save

### Claude's Discretion
- Editor toolbar design and icon choices
- Text selection and inline editing interaction patterns
- How to render editable text overlays on top of PDF pages
- Conversion engine selection (library/tool choices)
- Thumbnail sidebar collapse behavior and animation
- How to handle unsupported PDF features during editing (e.g., form fields, annotations)
- Error handling for conversion failures

### Deferred Ideas (OUT OF SCOPE)
- Forms (creation, logic, validation, calculations, data import/export)
- OCR (scanned document to searchable/editable text)
- Annotations/Markup (highlight, underline, strikethrough, sticky notes, drawing tools, shapes, arrows)
- Document Comparison (version comparison, highlight differences)
- Batch Processing (batch watermark, batch conversion, batch renaming, batch compression)
- Image Advanced Editing (layering, formatting brightness/contrast/transparency, masking, advanced cropping)
- Bookmarks/Links (create/edit bookmarks, internal/external links)
- Accessibility (tagging structure, reading order, alt text, screen reader compatibility)
- Metadata Editing (title, author, keywords, XMP metadata)
- Attachments (embed files, manage attachments)
- Collaboration/Cloud (shared reviews, comment sync, document sharing, cloud storage)
- Alignment Tools (snap to grid, guides, precise X/Y positioning, distribute objects evenly)
- Image Extraction (export images from PDF as separate files)
</user_constraints>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-lib | ^1.17.1 | PDF structure manipulation (add/remove/modify content, embed fonts/images) | Already in project; handles adding text, images, pages |
| pdfjs-dist | ^5.4.624 | PDF rendering + text extraction with position/font data | Already in project; getTextContent() provides per-glyph position and font info |
| docx | (project rule P004) | DOCX creation from extracted PDF content | Already a project decision; most mature JS DOCX builder |

### New Dependencies -- JavaScript
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| epub-gen-memory | ^1.4 | EPUB generation from HTML/content in browser | PDF-to-EPUB conversion; works in browser context without Node fs |
| @tauri-apps/plugin-shell | ^2.3.5 (existing) | Invoke sidecar binaries | Already in project; used for GS, will be reused for LibreOffice + Calibre |

### New Dependencies -- Sidecar Binaries
| Binary | Purpose | Formats Handled |
|--------|---------|-----------------|
| LibreOffice (soffice) | Headless document conversion | DOCX/DOC/ODT <-> PDF, TXT/RTF -> PDF |
| Calibre (ebook-convert) | Ebook format conversion | EPUB <-> PDF, MOBI output, AZW3 output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LibreOffice sidecar | Pure JS conversion (docx lib) | JS-only would mean building a PDF parser + DOCX renderer from scratch; LibreOffice handles layout fidelity that no JS library matches |
| Calibre sidecar | Pure JS epub-gen | epub-gen handles PDF-to-EPUB but cannot produce MOBI/AZW3; Calibre handles the full ebook format matrix |
| Pandoc | LibreOffice + Calibre | Pandoc CANNOT read PDF as input -- it only outputs PDF. Ruled out. |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    edit-pdf/              # PDF editor tool (new)
      EditPdfFlow.tsx       # Top-level flow controller
      EditorLayout.tsx      # Side-panel layout (preview + controls)
      ThumbnailSidebar.tsx  # Collapsible page thumbnails
      PageCanvas.tsx        # PDF page rendering with editable overlays
      TextOverlay.tsx       # Editable text layer on top of canvas
      ImageOverlay.tsx      # Draggable/resizable image elements
      EditorToolbar.tsx     # Toolbar (text/image/export actions)
      ExportPanel.tsx       # Convert/export from within editor
    convert-doc/            # Convert Document tool (new)
      ConvertDocFlow.tsx    # Pick -> Configure -> Compare -> Save
      ConvertConfigStep.tsx # Format, font, margins, spacing controls
      ConvertCompareStep.tsx# Before/after comparison
  lib/
    pdfEditor.ts           # PDF text/image extraction and modification engine
    pdfTextExtract.ts      # Extract text with position/font from pdfjs-dist
    documentConverter.ts   # Orchestrates LibreOffice/Calibre sidecar calls
    epubGenerator.ts       # EPUB generation from PDF content
  types/
    editor.ts              # Editor-specific types (TextBlock, ImageBlock, etc.)
    converter.ts           # Conversion option types
src-tauri/
  src/
    lib.rs                 # New commands: convert_document, invoke_libreoffice, invoke_calibre
  binaries/
    soffice*               # LibreOffice headless binary (per-platform)
    ebook-convert*         # Calibre ebook-convert binary (per-platform)
```

### Pattern 1: Sidecar Binary Invocation (Existing Pattern)
**What:** Shell out to external binaries for heavy processing, following the Ghostscript pattern.
**When to use:** Document and ebook format conversion.
**Example:**
```typescript
// Source: existing pattern in lib.rs (compress_pdf command)
// Rust side: new command in lib.rs
#[tauri::command]
async fn convert_document(
    app: tauri::AppHandle,
    source_path: String,
    output_format: String,  // "docx", "doc", "odt", "epub", "mobi", "azw3", "txt", "rtf"
    options: ConvertOptions, // font, margins, spacing
) -> Result<tauri::ipc::Response, String> {
    // Choose sidecar based on output format
    // Document formats -> LibreOffice sidecar
    // Ebook formats -> Calibre sidecar
    // Write to temp file, read bytes, clean up
}
```

### Pattern 2: Editable Text Overlay on PDF Canvas
**What:** Render PDF page to canvas (pdfjs-dist), extract text positions, overlay contenteditable divs at matching positions.
**When to use:** PDF text editing.
**How it works:**
1. Render page to `<canvas>` using pdfjs-dist (existing PagePreview pattern)
2. Call `page.getTextContent()` to get text items with transform matrices (x, y, fontSize, fontName)
3. Create absolutely-positioned `<div>` elements over each text block
4. On edit: user modifies text in the overlay div
5. On save: use pdf-lib to modify the page content -- remove old text operators from content stream, draw new text with `page.drawText()` at the same position with the same font

### Pattern 3: Dedicated Tool Flow (Existing Pattern)
**What:** Each tool is a self-contained flow component registered in TOOL_REGISTRY.
**When to use:** Both new tools follow this pattern.
**Example:**
```typescript
// In types/tools.ts -- add new tool IDs
export type ToolId = /* existing */ | 'edit-pdf' | 'convert-doc';

// In App.tsx -- add routing
if (activeTool === 'edit-pdf') {
  return <><ToolHeader .../><EditPdfFlow /></>;
}
if (activeTool === 'convert-doc') {
  return <><ToolHeader .../><ConvertDocFlow /></>;
}
```

### Pattern 4: Image Manipulation on PDF
**What:** Extract images from PDF pages, allow drag/resize/rotate/flip, re-embed modified images.
**When to use:** PDF image editing.
**How it works:**
1. Use pdf-lib to enumerate XObject images in page resources (existing pattern in `pdfProcessor.ts scanPdfImages`)
2. Extract image bytes and decode to display as `<img>` overlays
3. Allow drag (reposition), resize handles (with aspect lock), rotate/flip transforms
4. On save: use pdf-lib to remove old image XObject, embed new image, draw at new position/size

### Anti-Patterns to Avoid
- **Direct content stream text replacement:** PDF content streams encode text in complex ways (multiple encodings, glyph IDs, custom CMap tables). Never try to do find-and-replace on raw stream bytes. Instead, use the overlay + redraw approach.
- **Bundling full LibreOffice:** LibreOffice is 200-500MB. Do NOT bundle it. Require users to have it installed and detect it at runtime, OR use a minimal headless extraction.
- **Converting PDF to editable text via OCR:** OCR is explicitly deferred. Text editing works only on PDFs with actual text content (not scanned images).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF to DOCX conversion | Custom PDF parser + DOCX builder | LibreOffice headless sidecar | Layout fidelity requires understanding of fonts, spacing, tables, images -- years of engineering |
| EPUB/MOBI/AZW3 generation | Custom ebook format writer | Calibre ebook-convert sidecar | MOBI and AZW3 are proprietary Kindle formats with DRM-adjacent complexity |
| PDF text position extraction | Custom content stream parser | pdfjs-dist `page.getTextContent()` | Handles all PDF text encodings, CMap lookups, font substitution |
| DOCX file generation | Manual XML/ZIP assembly | `docx` npm library | DOCX is a ZIP of complex XML; the library handles all namespace/relationship boilerplate |
| EPUB file generation | Manual OPF/NCX/XHTML assembly | `epub-gen-memory` | EPUB is a ZIP of XHTML + metadata; library handles container.xml, content.opf, toc.ncx |
| Font embedding in output | Manual font subsetting | Let LibreOffice/Calibre handle it | Font subsetting requires understanding of OpenType/TrueType tables |

**Key insight:** Document format conversion is a solved problem with mature tools (LibreOffice, Calibre). Building custom converters would take months and produce inferior results.

## Common Pitfalls

### Pitfall 1: pdf-lib Cannot Edit Existing Text
**What goes wrong:** Developers assume pdf-lib can modify existing text on a page. It cannot. pdf-lib can only ADD new content; it has no API to find, select, or modify existing text operators in content streams.
**Why it happens:** pdf-lib's marketing says "modify PDF documents" but this means modifying structure (pages, metadata, form fields) not page content text.
**How to avoid:** Use pdfjs-dist to extract text positions, then use pdf-lib to: (1) cover old text with a white rectangle, (2) draw new text at the same position. This is the standard approach used by browser-based PDF editors.
**Warning signs:** Searching pdf-lib docs for "find text" or "replace text" yields no results.

### Pitfall 2: LibreOffice Sidecar Availability
**What goes wrong:** LibreOffice is too large to bundle as a sidecar (200-500MB). If required as a dependency, users who don't have it installed cannot use conversion features.
**Why it happens:** Unlike Ghostscript (a focused CLI tool), LibreOffice is a full office suite.
**How to avoid:** Detect LibreOffice at runtime. Show a clear error with install instructions if not found. Consider making document conversion features conditional on LibreOffice availability.
**Warning signs:** App bundle size exceeds 300MB.

### Pitfall 3: PDF Text Encoding Complexity
**What goes wrong:** Text extracted from PDFs doesn't match what's visible. Characters appear as glyph IDs or CMap-encoded values that don't map to Unicode.
**Why it happens:** PDFs use custom character encodings, especially for embedded subset fonts.
**How to avoid:** Use pdfjs-dist for text extraction (it handles CMap resolution). Never parse content streams manually for text.
**Warning signs:** Extracted text contains sequences like `\u0000` or glyph indices instead of readable characters.

### Pitfall 4: Calibre ebook-convert Size
**What goes wrong:** Calibre is also a large application (~150MB installed). Same bundling concern as LibreOffice.
**Why it happens:** Calibre includes a full GUI, library management, and many format plugins.
**How to avoid:** Same runtime detection strategy as LibreOffice. The `ebook-convert` CLI is what we need -- it can be used independently if Calibre is installed.
**Warning signs:** Users reporting "ebook-convert not found" errors.

### Pitfall 5: React StrictMode + PDF.js ArrayBuffer Transfer
**What goes wrong:** PDF.js transfers ArrayBuffer ownership to its web worker via postMessage. React StrictMode runs effects twice, causing second render to fail with a detached buffer.
**Why it happens:** Known issue, already solved in the codebase with `pdfBytes.slice()`.
**How to avoid:** Always use `pdfBytes.slice()` when passing to `pdfjsLib.getDocument()`. This is already documented in project memory and implemented in `PagePreview.tsx`.
**Warning signs:** "Preview unavailable" errors that only appear in dev mode.

### Pitfall 6: PDF Image Extraction Complexity
**What goes wrong:** Images in PDFs can be stored as raw streams with various filters (DCTDecode for JPEG, FlateDecode for PNG-like, JBIG2, CCITTFax). Simply reading the stream bytes doesn't give you a displayable image.
**Why it happens:** PDF is a container format; images are encoded in PDF-specific ways.
**How to avoid:** Use pdfjs-dist to render the page (it handles all image decoding). For image extraction, render the page to canvas and identify image regions, OR use pdf-lib's low-level API to access XObject streams and decode them based on their Filter entry.
**Warning signs:** Extracted image bytes don't decode properly; images appear corrupted or blank.

## Code Examples

### Text Extraction with Position Data (pdfjs-dist)
```typescript
// Source: pdfjs-dist API, verified via npm docs + existing project usage
import * as pdfjsLib from 'pdfjs-dist';

interface ExtractedTextItem {
  text: string;
  x: number;       // PDF points from left
  y: number;       // PDF points from bottom
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

async function extractPageText(pdfBytes: Uint8Array, pageIndex: number): Promise<ExtractedTextItem[]> {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const page = await doc.getPage(pageIndex + 1); // 1-indexed
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  return textContent.items
    .filter((item): item is pdfjsLib.TextItem => 'str' in item)
    .map(item => {
      const [scaleX, , , scaleY, x, y] = item.transform;
      return {
        text: item.str,
        x,
        y,
        width: item.width,
        height: Math.abs(scaleY),
        fontSize: Math.abs(scaleY),
        fontName: item.fontName,
      };
    });
}
```

### Covering Old Text and Drawing New Text (pdf-lib)
```typescript
// Source: pdf-lib docs + GitHub issue #564 discussion
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function replaceTextAtPosition(
  pdfBytes: Uint8Array,
  pageIndex: number,
  oldX: number,
  oldY: number,
  oldWidth: number,
  oldHeight: number,
  newText: string,
  fontSize: number,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[pageIndex];

  // 1. Cover old text with a white rectangle
  page.drawRectangle({
    x: oldX,
    y: oldY,
    width: oldWidth,
    height: oldHeight,
    color: rgb(1, 1, 1), // white
    borderWidth: 0,
  });

  // 2. Draw new text at same position
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(newText, {
    x: oldX,
    y: oldY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  return pdfDoc.save();
}
```

### LibreOffice Sidecar Invocation (Rust Pattern)
```rust
// Source: existing compress_pdf pattern in lib.rs
#[tauri::command]
async fn convert_with_libreoffice(
    app: tauri::AppHandle,
    source_path: String,
    output_format: String, // "docx", "doc", "odt", "pdf"
) -> Result<tauri::ipc::Response, String> {
    let valid_formats = ["docx", "doc", "odt", "pdf", "txt", "rtf"];
    if !valid_formats.contains(&output_format.as_str()) {
        return Err(format!("Invalid format: {}", output_format));
    }

    let tmp_dir = std::env::temp_dir().join("papercut_convert");
    std::fs::create_dir_all(&tmp_dir)
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;

    // soffice --headless --convert-to FORMAT --outdir DIR SOURCE
    let (mut rx, _child) = app
        .shell()
        .sidecar("soffice")
        .map_err(|e| format!("LibreOffice not found: {}", e))?
        .args([
            "--headless",
            "--convert-to", &output_format,
            "--outdir", &tmp_dir.to_string_lossy(),
            &source_path,
        ])
        .spawn()
        .map_err(|e| format!("LibreOffice spawn failed: {}", e))?;

    // Wait for completion, read output file, clean up
    // ... (follow compress_pdf pattern)
}
```

### Calibre ebook-convert Sidecar Invocation
```rust
// ebook-convert input.pdf output.epub [options]
#[tauri::command]
async fn convert_with_calibre(
    app: tauri::AppHandle,
    source_path: String,
    output_path: String,
    extra_args: Vec<String>, // e.g., ["--output-profile", "kindle"]
) -> Result<tauri::ipc::Response, String> {
    let mut args = vec![source_path.clone(), output_path.clone()];
    args.extend(extra_args);

    let (mut rx, _child) = app
        .shell()
        .sidecar("ebook-convert")
        .map_err(|e| format!("Calibre ebook-convert not found: {}", e))?
        .args(&args)
        .spawn()
        .map_err(|e| format!("ebook-convert spawn failed: {}", e))?;

    // Wait for completion, read output file, clean up
}
```

### EPUB Generation from Content (epub-gen-memory)
```typescript
// Source: epub-gen-memory npm docs
import epub from 'epub-gen-memory';

interface EpubChapter {
  title: string;
  content: string; // HTML content
}

async function generateEpub(
  title: string,
  author: string,
  chapters: EpubChapter[],
): Promise<Uint8Array> {
  const buffer = await epub({
    title,
    author,
    content: chapters.map(ch => ({
      title: ch.title,
      data: ch.content,
    })),
  });
  return new Uint8Array(buffer);
}
```

### Tool Registration Pattern
```typescript
// Source: existing TOOL_REGISTRY pattern in types/tools.ts
// Add to ToolId union:
export type ToolId = /* existing */ | 'edit-pdf' | 'convert-doc';

// Add to TOOL_REGISTRY:
'edit-pdf': {
  id: 'edit-pdf',
  name: 'Edit PDF',
  description: 'Edit text and images, convert to other formats',
  category: 'pdf',
  icon: 'FileEdit', // or 'Pencil' from lucide-react
  acceptsFormats: ['pdf'],
  steps: [
    { label: 'Pick', description: 'Open a PDF file' },
    { label: 'Edit', description: 'Edit text and images' },
    { label: 'Save', description: 'Save edited PDF' },
  ],
},
'convert-doc': {
  id: 'convert-doc',
  name: 'Convert Document',
  description: 'Convert between PDF, DOCX, EPUB, MOBI, and more',
  category: 'pdf', // or add new 'document' category
  icon: 'ArrowLeftRight',
  acceptsFormats: ['pdf'], // + 'docx', 'epub', etc. -- need to extend format detection
  steps: [
    { label: 'Pick', description: 'Open a document' },
    { label: 'Configure', description: 'Choose output format and options' },
    { label: 'Compare', description: 'Review conversion result' },
    { label: 'Save', description: 'Save converted document' },
  ],
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual PDF content stream editing | Overlay + redraw pattern | Standard practice since ~2020 | No JS library supports in-place text editing; overlay approach is the industry standard for browser-based PDF editors |
| Bundling converter binaries | Runtime detection of system-installed tools | Ongoing | LibreOffice/Calibre too large to bundle; detect at runtime instead |
| MOBI as primary Kindle format | AZW3/KF8 as preferred Kindle format | ~2022 | MOBI is legacy; AZW3 (KF8) supports more formatting features |
| pdfjs-dist `renderTextLayer` | `TextLayer` class | pdfjs-dist 4.3+ | Old API deprecated; use new TextLayer for text overlay rendering |

**Deprecated/outdated:**
- MOBI 6 format: Still supported but AZW3 (KF8) is the modern Kindle format. Calibre generates both by default for maximum compatibility.
- `renderTextLayer` in pdfjs-dist: Deprecated since v4.3; use `TextLayer` class instead.

## Open Questions

1. **LibreOffice / Calibre Discovery Strategy**
   - What we know: Both are too large to bundle (~200-500MB each). They need to be detected at runtime.
   - What's unclear: Best UX for when tools are not installed. Should features be hidden, or shown with "Install Required" badge?
   - Recommendation: Show tools always but with a clear "Requires LibreOffice/Calibre" indicator. On first use, check for the binary and show install instructions if not found. Cache the check result.

2. **PDF Text Editing Fidelity**
   - What we know: The overlay+redraw approach works for simple text changes. pdf-lib can embed standard fonts and custom TTF/OTF fonts.
   - What's unclear: How well does the white-rectangle cover + redraw approach handle fonts that aren't available as TTF/OTF? What about text with complex layouts (columns, rotated text)?
   - Recommendation: Start with standard fonts (Helvetica, Times, Courier). For custom fonts, extract the font from the PDF using pdfjs-dist's font data API and attempt to re-embed. Fall back to a close standard font match if extraction fails.

3. **Sidecar Binary Path Detection**
   - What we know: GS is bundled as a Tauri sidecar in `binaries/gs`. LibreOffice and Calibre cannot be bundled this way.
   - What's unclear: Whether to use `app.shell().sidecar()` (which expects bundled binaries) or `app.shell().command()` (which expects system-installed binaries).
   - Recommendation: Use `tauri_plugin_shell::ShellExt::shell().command()` for system-installed binaries, with platform-specific default paths (e.g., `/Applications/LibreOffice.app/Contents/MacOS/soffice` on macOS). Allow user to configure custom paths in settings.

4. **Convert Document Input Format Detection**
   - What we know: Current `fileValidation.ts` only detects PDF and image formats.
   - What's unclear: How to detect DOCX, EPUB, MOBI, etc. by extension and magic bytes.
   - Recommendation: Extend `detectFormat()` to support new format types. DOCX is a ZIP with `[Content_Types].xml`; EPUB is a ZIP with `META-INF/container.xml`. For CLI conversion, extension-based detection is sufficient.

## Sources

### Primary (HIGH confidence)
- pdf-lib API docs (https://pdf-lib.js.org/) -- confirmed pdf-lib CANNOT edit existing text; can only add new content
- pdf-lib GitHub issue #564 (https://github.com/Hopding/pdf-lib/issues/564) -- confirmed no find-and-replace text capability
- pdfjs-dist npm docs -- getTextContent() API provides text with transform matrices
- Calibre ebook-convert docs (https://manual.calibre-ebook.com/generated/en/ebook-convert.html) -- confirmed CLI supports all required formats
- Existing project code: `lib.rs` GS sidecar pattern, `PagePreview.tsx` PDF rendering, `TOOL_REGISTRY` tool registration

### Secondary (MEDIUM confidence)
- LibreOffice headless conversion (https://ask.libreoffice.org/t/converting-pdf-to-docx-through-command-line/96596) -- PDF-to-DOCX conversion works but fidelity varies
- epub-gen-memory (https://github.com/cpiber/epub-gen-memory) -- browser-compatible EPUB generation
- docx npm library (https://github.com/dolanmiu/docx) -- already a project decision (P004)

### Tertiary (LOW confidence)
- LibreOffice portable binary sizes (~200-500MB) -- based on download page observations, not official specs
- Calibre ebook-convert standalone size (~150MB) -- estimated, not verified independently
- pdf-lib low-level content stream access -- some community discussion suggests `page.getContentStream()` exists but API is undocumented

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM -- pdf-lib + pdfjs-dist for editing is well-understood; sidecar approach is proven with GS but LibreOffice/Calibre integration is untested in this project
- Architecture: MEDIUM -- overlay+redraw PDF editing is industry standard; sidecar pattern is proven; but the full system is complex with many moving parts
- Pitfalls: HIGH -- pdf-lib limitations are well-documented; sidecar size concerns are real and verified; React StrictMode issue already encountered and solved

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stack is stable)
