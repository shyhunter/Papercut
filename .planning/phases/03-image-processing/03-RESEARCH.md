# Phase 3: Image Processing - Research

**Researched:** 2026-02-20
**Domain:** Rust image processing (Tauri backend), Canvas API for display, React UI patterns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Quality slider behavior**
- Processing fires on **mouse-up only** (not debounced on every drag tick) — balances responsiveness with Sharp performance
- Slider label shows **percentage + estimated file size**: e.g. "75% — ~420 KB"
- For **PNG output**: slider maps to PNG compression level (0–9) — smaller file, slower encode. Label updates accordingly (e.g. "Compression: 6")
- Controls adapt **instantly** when format changes — switching to PNG remaps slider to compression level; JPG/WebP show the standard quality slider

**Compare view layout**
- **Side-by-side panels** — original on left, processed on right (same pattern as PDF compare step)
- Stats shown in the compare view: **file size (before → after + % reduction)**, **dimensions (W × H px, both)**, **format (original → output)**, **quality setting used**
- While regenerating (user changed settings): **show stale result with a "Regenerating…" indicator** — no blank screen between updates
- **Zoom slider** — same as PDF compare step; both panels zoom together

**Resize interaction**
- Resize is **opt-in via a toggle** (off by default) — same pattern as PDF's "Resize pages" pill switch
- Aspect ratio lock **defaults to unlocked** — user has full control from the start
- Unit: **pixels + percentage toggle** — user can switch between raw pixels and percentage scale
- **Presets available**: HD 1920×1080, Web 1280×720, Square 1080×1080, Thumbnail 400×400 (guideline values)

**Format conversion**
- Default output format = **same as input** (open JPG → output defaults to JPG)
- Format selector is always visible in Configure — user can change before generating preview
- Output **filename updates automatically** when format changes (e.g. photo.png → photo.jpg)
- **PNG → JPG transparency handling**: fill transparent areas with white background

### Claude's Discretion
- PNG→JPG transparency: fill transparent areas with white background (Sharp default — predictable, no data loss)
- Exact slider step increments (1% or 5%)
- Debounce vs mouse-up threshold tuning
- Preset list final values (above are guidelines)
- Error state styling for invalid dimension inputs

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IMG-01 | User can adjust image compression quality via a slider (1–100%) | Rust `image` crate JpegEncoder (quality 1–100 u8), `webp` crate Encoder::encode(quality: f32 0.0–100.0), PngEncoder CompressionType for PNG (0–9 mapped) |
| IMG-02 | User can resize image dimensions (width × height) with an aspect ratio lock toggle | DynamicImage::resize() preserves aspect ratio; resize_exact() ignores it — both available in `image` 0.25 |
| IMG-03 | User can convert image output format (JPG ↔ PNG ↔ WebP) | image crate for JPEG/PNG output; webp crate for lossy WebP output |
| IMG-04 | User can see a side-by-side comparison of original vs processed result before saving | Processed bytes returned via tauri::ipc::Response as Uint8Array; displayed via `URL.createObjectURL(new Blob([bytes], {type}))` — same pattern as PDF CompareStep |
</phase_requirements>

## Summary

The CLAUDE.md lists "Sharp" as the image processing library, but Sharp is a Node.js native module that explicitly does not support browser environments. Tauri's frontend runs in a WebView (browser environment), so Sharp cannot be used there. The correct architecture is: **all image processing happens in Rust via a `#[tauri::command]`**, mirroring how pdf-lib is called from the frontend in Phase 2, but Sharp is replaced with the `image` crate (JPEG/PNG) plus the `webp` crate (lossy WebP encoding).

The Rust `image` crate (v0.25.9) is the standard choice for JPEG and PNG processing, providing `JpegEncoder::new_with_quality(writer, quality: u8)` (1–100) and `PngEncoder::new_with_quality(writer, CompressionType, FilterType)` with five compression variants. For lossy WebP — which the pure-Rust `image-webp` backend does NOT support — the `webp` crate wraps Google's libwebp and provides `Encoder::from_image(&DynamicImage).encode(quality: f32)` (0.0–100.0).

The Tauri IPC boundary is key: the Rust command returns processed bytes via `tauri::ipc::Response` (bypasses JSON serialization), received as `Uint8Array` in the frontend. For display in CompareStep, a `Blob` URL is created from the bytes — identical to how PDF pages work, except images don't need PDF.js rendering (native `<img>` tags work directly).

**Primary recommendation:** Add `image = "0.25"` and `webp = "0.3"` to Cargo.toml; implement a single `process_image` Tauri command that reads the source file, applies resize/compress/convert, and returns bytes via `tauri::ipc::Response`. Mirror the `usePdfProcessor` hook pattern as `useImageProcessor`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `image` (Rust crate) | 0.25.9 | JPEG decode/encode with quality, PNG decode/encode with compression levels, resize with FilterType::Lanczos3 | Standard Rust image processing library; pure Rust for JPEG/PNG; already in ecosystem |
| `webp` (Rust crate) | 0.3.x | Lossy WebP encoding with quality float (0.0–100.0) via libwebp bindings | image-webp (built into image crate) only supports lossless WebP; webp crate wraps Google's libwebp for lossy quality control |
| `tauri::ipc::Response` | Tauri 2 built-in | Return raw `Vec<u8>` from Tauri command as `Uint8Array` on frontend without JSON serialization | Only viable approach for binary payloads; avoids JSON array overhead for multi-MB images |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tauri-plugin-fs` (already installed) | 2.x | Read source image bytes from disk | Used in Rust command to read file path |
| Native Browser `URL.createObjectURL` | Web API | Display processed image bytes as `<img>` src | Convert Uint8Array → Blob URL for CompareStep display |
| Existing `writeFile` from `@tauri-apps/plugin-fs` | 2.x | Save processed bytes to disk | Reuse SaveStep exactly as-is from Phase 2 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `image` crate | `fast_image_resize` | Better SIMD resize perf but only handles resize, not encode/decode — needs two crates anyway |
| `webp` crate | `image-webp` (built into image crate) | image-webp only supports lossless WebP as of 2025; lossy quality control requires webp crate |
| Rust command for processing | Canvas API (browser) | Canvas `toBlob(quality)` works for JPG/WebP but has no quality param for PNG compression level, which is a locked decision |

**Installation (Cargo.toml additions):**
```toml
[dependencies]
image = "0.25"
webp = "0.3"
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── imageProcessor.ts    # async fn: calls invoke('process_image'), reads source file
├── hooks/
│   └── useImageProcessor.ts # mirrors usePdfProcessor.ts — isProcessing, result, error, run(), reset()
├── components/
│   ├── ImageConfigureStep.tsx  # quality slider, resize toggle, format selector
│   └── ImageCompareStep.tsx    # side-by-side panels with stale-result indicator
└── types/
    └── file.ts              # extend with ImageProcessingOptions, ImageProcessingResult

src-tauri/src/
└── lib.rs                   # add process_image command + register in invoke_handler
```

### Pattern 1: Rust Command with Binary Return

**What:** Tauri command reads source image, processes it, returns raw bytes via `tauri::ipc::Response`
**When to use:** Any time the frontend needs processed image bytes

```rust
// Source: https://v2.tauri.app/develop/calling-rust/
use tauri::ipc::Response;
use image::{DynamicImage, ImageReader, codecs::jpeg::JpegEncoder, codecs::png::{PngEncoder, CompressionType, FilterType}};
use std::io::Cursor;

#[tauri::command]
fn process_image(
    source_path: String,
    quality: u8,           // 1–100 for JPG/WebP; 0–9 for PNG (mapped in Rust)
    output_format: String, // "jpeg", "png", "webp"
    resize_width: Option<u32>,
    resize_height: Option<u32>,
    resize_exact: bool,    // false = preserve aspect ratio, true = exact dimensions
) -> Result<Response, String> {
    // 1. Read source file
    let source_bytes = std::fs::read(&source_path)
        .map_err(|e| format!("Could not read file: {}", e))?;

    // 2. Decode image
    let img = image::load_from_memory(&source_bytes)
        .map_err(|e| format!("Could not decode image: {}", e))?;

    // 3. Resize if requested
    let img = if let (Some(w), Some(h)) = (resize_width, resize_height) {
        if resize_exact {
            img.resize_exact(w, h, image::imageops::FilterType::Lanczos3)
        } else {
            img.resize(w, h, image::imageops::FilterType::Lanczos3)
        }
    } else {
        img
    };

    // 4. Encode to target format
    let mut output = Vec::new();
    match output_format.as_str() {
        "jpeg" => {
            let mut encoder = JpegEncoder::new_with_quality(&mut output, quality);
            encoder.encode_image(&img).map_err(|e| e.to_string())?;
        }
        "png" => {
            // PNG: quality 1–100 → compression level 0–9 (invert: 100% = least compression = 0)
            let level = ((100 - quality as u32) * 9 / 100) as u8;
            let compression = match level {
                0 => CompressionType::Fast,
                9 => CompressionType::Best,
                _ => CompressionType::Default,
            };
            let encoder = PngEncoder::new_with_quality(&mut Cursor::new(&mut output), compression, image::codecs::png::FilterType::Adaptive);
            img.write_with_encoder(encoder).map_err(|e| e.to_string())?;
        }
        "webp" => {
            // webp crate: quality 0.0–100.0 (same scale as slider)
            let encoder = webp::Encoder::from_image(&img)
                .map_err(|e| format!("WebP encoder error: {}", e))?;
            let webp_data = encoder.encode(quality as f32);
            output = webp_data.to_vec();
        }
        _ => return Err(format!("Unsupported format: {}", output_format)),
    }

    Ok(tauri::ipc::Response::new(output))
}
```

### Pattern 2: useImageProcessor Hook (mirrors usePdfProcessor)

**What:** React hook wrapping the Rust command with loading/error state
**When to use:** ConfigureStep calls `run()` on mouse-up; CompareStep reads `result`

```typescript
// src/hooks/useImageProcessor.ts
import { invoke } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { useState, useCallback } from 'react';
import type { ImageProcessingOptions, ImageProcessingResult } from '@/types/file';

export function useImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImageProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (sourcePath: string, options: ImageProcessingOptions) => {
    setIsProcessing(true);
    setResult(null);
    setError(null);

    try {
      // Read source bytes for "Before" panel (no re-read needed in CompareStep)
      const sourceBytes = await readFile(sourcePath);

      // Process via Rust — returns Uint8Array via tauri::ipc::Response
      const processedBytes: Uint8Array = await invoke('process_image', {
        sourcePath,
        quality: options.quality,
        outputFormat: options.outputFormat,
        resizeWidth: options.resizeEnabled ? options.targetWidth : null,
        resizeHeight: options.resizeEnabled ? options.targetHeight : null,
        resizeExact: options.resizeExact,
      });

      setResult({
        bytes: processedBytes,
        sourceBytes,
        inputSizeBytes: sourceBytes.byteLength,
        outputSizeBytes: processedBytes.byteLength,
        outputFormat: options.outputFormat,
        quality: options.quality,
        // Dimensions parsed from result or passed back from Rust
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
  }, []);

  return { isProcessing, result, error, run, reset };
}
```

### Pattern 3: Image Display in CompareStep

**What:** Convert Uint8Array bytes to a Blob URL for native `<img>` display
**When to use:** ImageCompareStep rendering — images do NOT need PDF.js, just a Blob URL

```typescript
// Source: MDN Web API (URL.createObjectURL)
function bytesToImageUrl(bytes: Uint8Array, mimeType: string): string {
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

// In useEffect with cleanup:
useEffect(() => {
  const url = bytesToImageUrl(result.bytes, `image/${result.outputFormat}`);
  setProcessedUrl(url);
  return () => URL.revokeObjectURL(url); // Critical: prevent memory leaks
}, [result.bytes, result.outputFormat]);
```

### Pattern 4: Stale-Result Regenerating Indicator

**What:** When user changes settings and re-runs, show old image with overlay instead of blank
**When to use:** ProcessedPanel while `isProcessing === true` but `previousResult` exists

```typescript
// Keep reference to last good result during re-processing
const [displayResult, setDisplayResult] = useState<ImageProcessingResult | null>(null);

useEffect(() => {
  if (result) {
    setDisplayResult(result); // Update display when new result arrives
  }
}, [result]);

// In render:
{isProcessing && displayResult && (
  <div className="relative">
    <img src={previousUrl} className="opacity-50" />
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-sm bg-background/80 px-3 py-1 rounded-md">Regenerating…</span>
    </div>
  </div>
)}
```

### Pattern 5: PNG → JPG White Background Fill

**What:** When converting PNG with transparency to JPEG, fill alpha channel with white
**When to use:** Rust command detects RGBA source when outputting JPEG

```rust
// Source: image crate standard pattern for RGBA → RGB conversion
let img = if output_format == "jpeg" {
    // JPEG has no alpha — flatten transparent pixels to white background
    let mut bg = image::RgbImage::new(img.width(), img.height());
    // Fill with white
    for pixel in bg.pixels_mut() { *pixel = image::Rgb([255u8, 255, 255]); }
    // Copy source RGBA over white bg
    image::imageops::overlay(&mut bg, &img.to_rgba8(), 0, 0);
    DynamicImage::ImageRgb8(bg)
} else {
    img
};
```

### Anti-Patterns to Avoid

- **Using Sharp in the frontend:** Sharp is Node.js native; Tauri's WebView is a browser — Sharp will fail to load entirely. The CLAUDE.md reference to Sharp was aspirational; the correct home is the Rust backend using `image` + `webp` crates.
- **Returning Vec<u8> as JSON number array:** Default serde serialization of `Vec<u8>` creates a JSON number array, causing ~3× overhead for large images. Always use `tauri::ipc::Response`.
- **Not revoking Blob URLs:** `URL.createObjectURL` leaks memory unless paired with `URL.revokeObjectURL` in useEffect cleanup.
- **Using image::WebPEncoder for lossy output:** The built-in WebP encoder in the `image` crate only supports lossless encoding; use the `webp` crate for quality-controlled lossy WebP.
- **Forgetting to register the command:** The new `process_image` command must be added to `tauri::generate_handler![..., process_image]` in `src-tauri/src/lib.rs`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image decode (JPEG/PNG/WebP) | Custom byte parser | `image::load_from_memory()` | Format detection, color space handling, EXIF stripping all handled |
| JPEG quality encoding | Manual DCT coefficient manipulation | `JpegEncoder::new_with_quality(writer, quality: u8)` | quality 1–100 maps directly to libjpeg |
| PNG compression levels | Custom zlib wrapper | `PngEncoder::new_with_quality(writer, CompressionType, FilterType)` | CompressionType::Level(u8) 1–9 available |
| Lossy WebP encoding | libwebp C FFI | `webp::Encoder::from_image(&img).encode(quality: f32)` | webp crate is a safe Rust wrapper |
| Aspect ratio math | Custom width/height calculation | `DynamicImage::resize(w, h, FilterType)` | Handles aspect ratio preservation internally |
| Image display from bytes | Custom canvas renderer | `URL.createObjectURL(new Blob([bytes], {type}))` + `<img>` | Browser handles decode natively |
| Binary IPC | JSON number array serialization | `tauri::ipc::Response::new(vec_u8)` | Built into Tauri 2; avoids 3× JSON overhead |

**Key insight:** Image processing has severe format-specific edge cases (color profiles, EXIF rotation, transparency, progressive encoding). Each "simple" operation hides 10+ edge cases that established libraries handle correctly.

## Common Pitfalls

### Pitfall 1: image crate WebP = lossless only
**What goes wrong:** You add `image` crate and call `img.save("out.webp")` or use `WebPEncoder` — output is always lossless, quality slider has no effect on file size.
**Why it happens:** `image-webp` (the pure-Rust backend built into `image`) only implements lossless WebP encoding as of 2025. The `image` crate's `ImageOutputFormat::WebP` uses this backend.
**How to avoid:** Add the `webp` crate as a separate dependency. Branch on output format: use `image` for JPEG/PNG, use `webp::Encoder` for WebP.
**Warning signs:** WebP output file sizes are all the same regardless of quality setting.

### Pitfall 2: Vec<u8> serialized as JSON number array
**What goes wrong:** `#[tauri::command] fn process_image() -> Vec<u8>` — the frontend receives a JSON array of numbers, causing 3× payload size for a 3 MB image (9 MB of JSON text). Also requires `Uint8Array.from(arr)` conversion.
**Why it happens:** Tauri's default serde serialization converts `Vec<u8>` to a JSON number array.
**How to avoid:** Return `tauri::ipc::Response::new(bytes)` — the frontend receives a `Uint8Array` directly.
**Warning signs:** Processing large images is slow; network inspector shows very large JSON responses.

### Pitfall 3: Blob URL memory leak
**What goes wrong:** Each `URL.createObjectURL()` call holds a reference until the document unloads or you explicitly call `revokeObjectURL`. The CompareStep creates new URLs on every settings change; after 10 re-processes the app holds 10 leaked Blob URLs.
**How to avoid:** Always pair creation with cleanup in `useEffect` return:
```typescript
useEffect(() => {
  const url = URL.createObjectURL(blob);
  setUrl(url);
  return () => URL.revokeObjectURL(url);
}, [blob]);
```
**Warning signs:** Memory usage grows steadily as user adjusts settings.

### Pitfall 4: PNG transparency → white fill not applied in time
**What goes wrong:** RGBA PNG is passed to `JpegEncoder` directly, which strips alpha, causing the originally transparent areas to render as black (not white).
**Why it happens:** JPEG has no alpha channel. The `image` crate's JPEG encoder converts RGBA → RGB by dropping alpha (black, not white).
**How to avoid:** In the Rust command, detect when `output_format == "jpeg"` and explicitly composite the image over a white RGB background before encoding. This is the locked decision (white fill).
**Warning signs:** Transparent PNGs saved as JPG have black artifacts where transparency was.

### Pitfall 5: Estimated file size before processing
**What goes wrong:** The CONTEXT decision says the slider label shows "75% — ~420 KB". This is not a pre-computation — it's the ACTUAL output size from the last processed result. The estimate only updates after mouse-up triggers a new Rust processing call.
**Why it happens:** There is no reliable mathematical formula to estimate compressed image size without actually encoding. Image content-dependence makes pre-computation useless.
**How to avoid:** The label shows the actual size from `result.outputSizeBytes` (from last run), with a note that it updates on release. On first mount before any processing, show only the quality percentage. The "~" prefix signals approximation (it's the previous run, not the current setting).
**Warning signs:** Users see stale size estimates — this is intentional and correct behavior.

### Pitfall 6: Forgotten command registration
**What goes wrong:** `invoke('process_image', ...)` throws "Command process_image not found" at runtime.
**Why it happens:** Tauri requires explicit registration of all commands via `tauri::generate_handler![]`.
**How to avoid:** Add `process_image` to the `generate_handler!` macro in `src-tauri/src/lib.rs`.
**Warning signs:** Runtime error in browser console referencing command not found.

### Pitfall 7: PngEncoder Cursor double-borrow
**What goes wrong:** PngEncoder takes a `Write` implementor. Using `&mut output` directly with PngEncoder while also moving `output` causes borrow errors.
**How to avoid:** Use `std::io::Cursor<&mut Vec<u8>>` or write to a `Vec<u8>` via `Cursor::new(&mut output)`.

## Code Examples

Verified patterns from official sources:

### JPEG Encoding with Quality
```rust
// Source: https://docs.rs/image/latest/image/codecs/jpeg/struct.JpegEncoder.html
use image::codecs::jpeg::JpegEncoder;
use std::io::Cursor;

let mut output: Vec<u8> = Vec::new();
let mut encoder = JpegEncoder::new_with_quality(&mut output, 75u8); // quality: 1–100
encoder.encode_image(&dynamic_image).map_err(|e| e.to_string())?;
// output now contains JPEG bytes
```

### PNG Encoding with Compression Level
```rust
// Source: https://docs.rs/image/latest/image/codecs/png/enum.CompressionType.html
use image::codecs::png::{PngEncoder, CompressionType, FilterType};
use std::io::Cursor;

let mut output: Vec<u8> = Vec::new();
let encoder = PngEncoder::new_with_quality(
    Cursor::new(&mut output),
    CompressionType::Best,   // variants: Default, Fast, Best, Uncompressed, Level(1–9)
    FilterType::Adaptive,
);
dynamic_image.write_with_encoder(encoder).map_err(|e| e.to_string())?;
```

### Lossy WebP Encoding with Quality
```rust
// Source: https://docs.rs/webp/latest/webp/struct.Encoder.html
use webp::Encoder;

let encoder = Encoder::from_image(&dynamic_image)
    .map_err(|e| format!("WebP encoder: {}", e))?;
let webp_data = encoder.encode(75.0f32); // quality: 0.0–100.0
let output: Vec<u8> = webp_data.to_vec();
```

### Image Resize (Aspect Ratio Preserved)
```rust
// Source: https://docs.rs/image/latest/image/enum.DynamicImage.html
use image::imageops::FilterType;

// resize() — fits within bounds, preserves aspect ratio
let resized = img.resize(1920, 1080, FilterType::Lanczos3);

// resize_exact() — stretches to exact dimensions, ignores aspect ratio
let resized_exact = img.resize_exact(1920, 1080, FilterType::Lanczos3);
```

### Return Binary from Tauri Command
```rust
// Source: https://v2.tauri.app/develop/calling-rust/
use tauri::ipc::Response;

#[tauri::command]
fn process_image(/* params */) -> Result<Response, String> {
    let bytes: Vec<u8> = /* ... encode ... */;
    Ok(tauri::ipc::Response::new(bytes))
}

// Register in lib.rs:
.invoke_handler(tauri::generate_handler![greet, process_image])
```

### Receive Binary in Frontend
```typescript
// Source: https://v2.tauri.app/develop/calling-rust/
import { invoke } from '@tauri-apps/api/core';

const processedBytes: Uint8Array = await invoke('process_image', { /* options */ });
// processedBytes is already Uint8Array — no conversion needed
```

### Blob URL for Image Display
```typescript
// Source: MDN Web API
function makeBlobUrl(bytes: Uint8Array, format: 'jpeg' | 'png' | 'webp'): string {
  const mimeType = `image/${format}`;
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Usage with cleanup:
useEffect(() => {
  if (!result) return;
  const url = makeBlobUrl(result.bytes, result.outputFormat);
  setImageUrl(url);
  return () => URL.revokeObjectURL(url); // prevent memory leak
}, [result]);
```

### PNG → JPG White Background (RGBA → RGB)
```rust
// Source: image crate imageops::overlay pattern
use image::{DynamicImage, RgbaImage, imageops};

fn flatten_to_white(img: DynamicImage) -> DynamicImage {
    let rgba = img.to_rgba8();
    let (w, h) = (rgba.width(), rgba.height());
    let mut white_bg = image::RgbImage::from_pixel(w, h, image::Rgb([255u8, 255, 255]));
    // Composite RGBA over white background
    for (x, y, pixel) in rgba.enumerate_pixels() {
        let alpha = pixel[3] as f32 / 255.0;
        let r = (pixel[0] as f32 * alpha + 255.0 * (1.0 - alpha)) as u8;
        let g = (pixel[1] as f32 * alpha + 255.0 * (1.0 - alpha)) as u8;
        let b = (pixel[2] as f32 * alpha + 255.0 * (1.0 - alpha)) as u8;
        white_bg.put_pixel(x, y, image::Rgb([r, g, b]));
    }
    DynamicImage::ImageRgb8(white_bg)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sharp (Node.js) in Tauri frontend | Rust `image` crate via Tauri command | Sharp never worked in browser; always was a misconception | All image processing must be in Rust |
| image crate WebP lossless only | webp crate (libwebp) for lossy WebP | Still the case as of 2025 | Two crates required (not just `image`) |
| Vec<u8> → JSON number array via serde | `tauri::ipc::Response` for binary | Tauri 2.0 | Eliminates 3× JSON overhead for image bytes |
| PDF rendering requires PDF.js | Images display directly via `<img>` with Blob URL | N/A | CompareStep for images is simpler — no page rendering loop needed |

**Deprecated/outdated:**
- `imageOutputFormat::Jpeg(quality)` via `img.write_to()`: Still works but `JpegEncoder::new_with_quality` is more explicit
- `Sharp` in Tauri frontend context: Never valid — browser environment cannot load Node.js native modules

## Open Questions

1. **Dimensions returned from Rust to frontend**
   - What we know: DynamicImage has `.width()` and `.height()` after processing
   - What's unclear: Should dimensions be returned as part of the processed result? The current plan returns only bytes via `tauri::ipc::Response`. A separate JSON command or embedding dimensions in the hook state is needed.
   - Recommendation: Make `process_image` return a JSON struct with `{ bytes_base64, width, height, output_format, output_size_bytes }` OR keep `tauri::ipc::Response` for bytes and add a separate lightweight `get_image_dimensions(path)` command. Alternatively, read dimensions from the Uint8Array via `createImageBitmap` in the browser. The planner should choose — base64+JSON has 33% overhead but simplifies the return structure; `ipc::Response` is faster but only carries bytes.

2. **Source image dimensions for the "Before" panel**
   - What we know: Source bytes are available from `readFile` in the hook
   - What's unclear: For the ConfigureStep, we need source W×H to validate resize inputs and display. This needs a separate `readFile` + `createImageBitmap` in the browser before processing, OR a metadata-only Rust command.
   - Recommendation: Read source file once in the hook before calling `process_image`; use browser's `createImageBitmap(new Blob([sourceBytes]))` to get natural dimensions. No additional Rust command needed.

3. **Tauri capabilities — no changes needed for image processing**
   - What we know: `fs:allow-read-file` at `$HOME/**` and `dialog:allow-save` + `fs:allow-write-file` are already in `capabilities/default.json`
   - What's unclear: Rust `std::fs::read()` inside a Tauri command bypasses the frontend capability system — it runs with full OS permissions, not sandboxed fs plugin permissions.
   - Recommendation: Use `std::fs::read(path)` in the Rust command (no additional capability config needed for reading). Save continues to use `writeFile` from frontend (existing `fs:allow-write-file` covers this).

## Sources

### Primary (HIGH confidence)
- `https://docs.rs/image/latest/image/` — image crate v0.25.9, DynamicImage API, JpegEncoder, PngEncoder, CompressionType variants
- `https://docs.rs/image/latest/image/codecs/png/enum.CompressionType.html` — CompressionType variants: Default, Fast, Best, Uncompressed, Level(u8 1–9)
- `https://docs.rs/image/latest/image/codecs/jpeg/struct.JpegEncoder.html` — `new_with_quality(w, quality: u8)` where quality is 1–100
- `https://docs.rs/image/latest/image/enum.DynamicImage.html` — resize(), resize_exact(), width(), height()
- `https://docs.rs/webp/latest/webp/struct.Encoder.html` — `from_image(&DynamicImage)`, `encode(quality: f32)` (0.0–100.0), `encode_lossless()`
- `https://v2.tauri.app/develop/calling-rust/` — `tauri::ipc::Response::new(vec_u8)` pattern; frontend receives `Uint8Array`
- MDN Web API — `URL.createObjectURL`, `URL.revokeObjectURL`, `Blob` constructor

### Secondary (MEDIUM confidence)
- `https://tduyng.com/blog/rust-webp-transform/` — Practical example of `webp::Encoder::from_image(&img).encode(100.0)` reducing image size by 45%
- `https://linzichun.com/posts/tauri-image-desktop-app-rust-sveltekit/` — Real-world Tauri + image crate + base64 pattern; confirms `image::open` + JpegEncoder flow
- `https://sharp.pixelplumbing.com/install/` — Confirmed: "Use in web browsers is unsupported" — definitive statement ruling out Sharp

### Tertiary (LOW confidence)
- WebSearch results on PNG quality parameter in browser Canvas API — confirmed Canvas `toBlob` quality param does NOT work for PNG (only JPEG/WebP); validated the Rust-side approach for PNG compression control

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from official docs.rs sources; Tauri 2 binary IPC confirmed from official Tauri docs
- Architecture: HIGH — mirrors confirmed Phase 2 patterns (usePdfProcessor → useImageProcessor); Rust command pattern verified
- Pitfalls: HIGH — image crate WebP lossless limitation confirmed from multiple sources; Blob URL memory leak is well-documented Web API behavior; JSON Vec<u8> overhead is documented Tauri issue
- Open Questions: MEDIUM — dimensions return strategy is a design choice, not a technical unknown

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable libraries; image crate and webp crate are mature)
