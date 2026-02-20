---
phase: 03-image-processing
plan: 01
subsystem: image-processing
tags: [rust, tauri, image-crate, webp, jpeg, png, react, typescript]

# Dependency graph
requires:
  - phase: 02-pdf-processing
    provides: usePdfProcessor pattern used as direct template for useImageProcessor
provides:
  - process_image Rust Tauri command (compress, resize, convert JPEG/PNG/WebP with white fill)
  - ImageProcessingOptions, ImageProcessingResult, ImageOutputFormat types in file.ts
  - imageProcessor.ts invoke wrapper over process_image Rust command
  - useImageProcessor hook with isProcessing/result/error/run/reset
affects:
  - 03-02-image-configure-step (consumes useImageProcessor.run())
  - 03-03-image-compare-save-step (consumes ImageProcessingResult.bytes/sourceBytes)

# Tech tracking
tech-stack:
  added:
    - image = "0.25" (Rust crate — JPEG/PNG encoding, decoding, resize, alpha compositing)
    - webp = "0.3" (Rust crate — lossy WebP encoding; image crate's WebP encoder is lossless only)
  patterns:
    - Rust command returns binary via tauri::ipc::Response (same Uint8Array pattern as PDF binary transfer)
    - Browser-native createImageBitmap for dimension extraction (avoids extra Rust round-trip)
    - PNG->JPEG transparency composited via manual pixel loop (not imageops::overlay which has borrow issues)
    - quality 1-100 mapped to PNG compression 0-9 in Rust ((100 - quality) * 9 / 100)

key-files:
  created:
    - src/lib/imageProcessor.ts
    - src/hooks/useImageProcessor.ts
  modified:
    - src-tauri/Cargo.toml (added image and webp crates)
    - src-tauri/src/lib.rs (process_image command + generate_handler registration)
    - src/types/file.ts (ImageOutputFormat, ImageProcessingOptions, ImageProcessingResult)

key-decisions:
  - "Use webp crate (not image crate) for lossy WebP — image crate's WebP encoder is lossless only"
  - "Manual pixel compositing loop for PNG->JPEG white fill — imageops::overlay has known borrow issues"
  - "PNG compression: quality 1-100 inverted to compression 0-9 via (100-q)*9/100 formula"
  - "getImageDimensions uses browser createImageBitmap — no extra Rust command needed"

patterns-established:
  - "useImageProcessor mirrors usePdfProcessor exactly — no progress (image crate has no per-step progress)"
  - "Rust process_image reads file directly via std::fs::read (bypasses capability sandbox with full OS perms)"

requirements-completed: [IMG-01, IMG-02, IMG-03]

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 3 Plan 01: Image Processing Engine Summary

**Rust process_image Tauri command with image + webp crates for JPEG/PNG/WebP encode, resize, and PNG-to-JPEG alpha compositing; TypeScript invoke wrapper and useImageProcessor hook ready for ImageConfigureStep**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-20T22:34:16Z
- **Completed:** 2026-02-20T22:36:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Implemented process_image Rust Tauri command handling JPEG (with PNG transparency white fill), PNG, and lossy WebP output
- Added image = "0.25" and webp = "0.3" crates — cargo build succeeds with zero errors
- Created ImageProcessingOptions, ImageProcessingResult, ImageOutputFormat types in file.ts
- Created imageProcessor.ts as thin invoke wrapper with browser-native dimension extraction via createImageBitmap
- Created useImageProcessor hook mirroring usePdfProcessor pattern (isProcessing/result/error/run/reset)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rust image processing command** - `ee7a9cd` (feat)
2. **Task 2: Image types, imageProcessor.ts, and useImageProcessor hook** - `673b91f` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src-tauri/Cargo.toml` - Added image = "0.25" and webp = "0.3" crates
- `src-tauri/src/lib.rs` - process_image command with JPEG/PNG/WebP encoding, resize, white fill alpha compositing; registered in generate_handler!
- `src/types/file.ts` - Added ImageOutputFormat, ImageProcessingOptions, ImageProcessingResult types
- `src/lib/imageProcessor.ts` - Thin invoke wrapper: reads sourceBytes, extracts dimensions via createImageBitmap, calls invoke('process_image'), returns ImageProcessingResult
- `src/hooks/useImageProcessor.ts` - React hook wrapping processImage with isProcessing/result/error state; run() and reset() callbacks

## Decisions Made
- Used webp crate (not image crate built-in WebP) for lossy WebP output — image crate's WebP encoder is lossless only
- Manual pixel compositing loop for PNG-to-JPEG white fill — avoids imageops::overlay which has known borrow checker issues in this context
- PNG quality 1-100 inverted to compression level 0-9 via formula: `(100 - quality) * 9 / 100` (higher quality = lower compression)
- CompressionType::Fast for level 0, CompressionType::Best for level 9, CompressionType::Default otherwise
- Browser createImageBitmap used for dimension extraction — browser-native, no extra Rust round-trip needed
- useImageProcessor has no progress reporting — image crate processes atomically with no per-step callbacks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- process_image Rust command fully compiled and registered — ready for invoke() calls from ImageConfigureStep
- useImageProcessor hook ready: ImageConfigureStep calls `run(sourcePath, options)` to trigger processing
- ImageProcessingResult.bytes and .sourceBytes ready for ImageCompareStep Before/After panels
- Plan 03-02 (ImageConfigureStep UI) can proceed immediately

## Self-Check: PASSED

All files verified present. All task commits verified in git log.

- FOUND: src-tauri/src/lib.rs
- FOUND: src/types/file.ts
- FOUND: src/lib/imageProcessor.ts
- FOUND: src/hooks/useImageProcessor.ts
- FOUND: 03-01-SUMMARY.md
- COMMIT ee7a9cd: feat(03-01) Rust process_image command
- COMMIT 673b91f: feat(03-01) image types + hooks

---
*Phase: 03-image-processing*
*Completed: 2026-02-20*
