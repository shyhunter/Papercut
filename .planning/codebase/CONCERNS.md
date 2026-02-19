# Codebase Concerns

**Analysis Date:** 2026-02-19

## Status Note

This project is in **pre-launch planning stage**. Source code has not yet been created. This document identifies anticipated risks, architectural concerns, and technical debt traps to avoid during implementation, based on the planned stack (Tauri + TypeScript + React + Sharp + pdf-lib + docx).

---

## Pre-Launch Architectural Risks

### DOCX Processing Capability Limitations

**Issue:** The `docx` library for JavaScript is the least mature of the three document processing libraries in the stack. DOCX format manipulation lacks the ecosystem maturity of image and PDF processing.

**Files:** Will affect `src-tauri/src/processors/docx.rs` (when created)

**Impact:**
- Page resizing may not work as expected for complex layouts
- Complex formatting (tables, images embedded in DOCX) may be lost or corrupted
- Compression and cropping operations not feasible for v1
- User expectations may exceed library capabilities, causing support burden

**Fix approach:**
- Scope DOCX features strictly per project rule P006: Start with page size change only, compression and crop are v2
- Add comprehensive pre-flight validation that documents are "simple enough" to process
- Implement graceful degradation with clear user messaging
- Consider generating a validation report showing what will/won't be preserved
- Add extensive test fixtures with real DOCX files (simple, complex, edge cases)

**Reference:** `.claude/project_rules_decisions.md` - Rule P006 acknowledges this limitation

---

## Planned vs Actual File Size Management

**Issue:** Architecture documentation specifies 500MB file size limit as a validation check, but Tauri + in-memory processing may fail at much smaller sizes depending on system RAM.

**Files:** Will affect `src-tauri/src/commands/process.rs` and `src-tauri/src/io/staging.rs` (when created)

**Impact:**
- Large PDF files with many pages can exhaust memory
- Sharp image processing of massive images may cause OOM kills
- No progress indication for long-running operations
- User may lose work if process crashes mid-operation

**Fix approach:**
- Implement streaming/chunked processing where possible for large documents
- Test with actual large files (500MB images, 1000-page PDFs) to determine real limits
- Add file size warnings with expected processing time estimates
- Implement proper error recovery with temp file cleanup on crash
- Consider adding a size-based processing queue with user feedback

---

## Temporary File Management and Cleanup

**Issue:** Architecture specifies temp files are "cleaned after operation completes or on app exit" but no formal cleanup mechanism is described. Cross-platform temp directory handling is complex.

**Files:** `src-tauri/src/io/cleanup.rs` (when created)

**Impact:**
- Stale temp files accumulate if app crashes
- Disk space leak on long-running systems
- Different temp directory locations on macOS (/var/tmp vs /tmp), Windows (AppData\Local\Temp), Linux (/tmp)
- Security issue if temp files contain sensitive user documents

**Fix approach:**
- Implement deterministic temp directory strategy with app-specific subdirectory
- Create explicit cleanup handler on app shutdown (Tauri lifecycle hooks)
- Add periodic cleanup for orphaned files older than N hours
- Consider encrypting or securely wiping temp files on deletion
- Log temp file operations for debugging

---

## Error Handling Across Native/Web Bridge

**Issue:** Tauri IPC command handlers must convert Rust errors to serializable JSON responses. Complex processing failures may not marshal cleanly across the bridge.

**Files:** `src-tauri/src/commands/process.rs` (when created), custom error type implementation

**Impact:**
- Panics in Rust code may hard-crash the app or leave it in bad state
- Error context gets lost in JSON serialization
- Frontend receives vague error messages ("Something went wrong")
- Difficult to debug failures that occur in the Rust layer

**Fix approach:**
- Define explicit `ProcessError` enum with comprehensive variants (FileNotFound, UnsupportedFormat, OutOfMemory, InvalidDimensions, etc.)
- Ensure all error variants are Serialize/Deserialize with explicit messages
- Test error path serialization explicitly
- Add requestId/tracing to all errors for debugging (similar to API patterns)
- Use `Result<T, ProcessError>` consistently; never use panics
- Test that all edge cases map to appropriate errors, not panics

---

## Missing Progress Indication and Cancellation

**Issue:** No progress mechanism described for long document processing. Users cannot cancel mid-operation.

**Files:** Will require new infrastructure in `src-tauri/src/commands/` and Tauri event channel

**Impact:**
- Users think app is frozen during large file processing
- No way to abort hanging operations
- Poor UX for any document >10MB

**Fix approach:**
- Implement async command execution with progress callbacks via Tauri events
- Add cancellation tokens to long-running operations
- Stream progress updates to frontend (percent complete, estimated time)
- Allow user to cancel from UI; clean up resources properly on cancel

---

## Input Validation and Security Boundaries

**Issue:** Path validation strategy is mentioned ("whitelist of allowed directories") but not detailed. Desktop apps are attack surface for path traversal.

**Files:** `src-tauri/src/commands/process.rs` and `src-tauri/src/io/` (when created)

**Impact:**
- Path traversal could read arbitrary files from user's system
- Symlink attacks could expose sensitive files
- Malicious file paths could be stored or logged

**Fix approach:**
- Implement strict path canonicalization: resolve symlinks, verify path is under user's selected directory
- Use `std::path::Path::canonicalize()` and validate against allowed base paths
- Reject any paths containing `..` or suspicious patterns
- Test with symlinks, relative paths, and Unicode path tricks
- Consider sandboxing file operations to specific allowed directories

---

## Format Detection Robustness

**Issue:** Architecture specifies "extension-based with optional magic byte validation" but no standard format detection library is mentioned.

**Files:** `src-tauri/src/commands/process.rs` (when created)

**Impact:**
- User could name a PDF file "document.jpg" and app processes it incorrectly
- Corrupted headers could cause processing to fail silently
- No protection against intentional format misidentification

**Fix approach:**
- Implement both extension-based and magic-byte validation (use `infer` or `file-type` crate)
- Require BOTH to match or fail with clear message
- Add format verification at processor entry point
- Log format mismatches for debugging
- Test with intentionally corrupted and misnamed files

---

## Dependency Version and Update Risks

**Issue:** Three critical document processing libraries (Sharp, pdf-lib, docx) are external dependencies. Version mismatches and security updates could break the app.

**Files:** `Cargo.toml` and `package.json` (when created)

**Impact:**
- Sharp security vulnerabilities (C++ native bindings) could expose system
- pdf-lib updates may change API or break page handling
- docx library may go unmaintained, blocking updates
- Cross-platform build complexity (Sharp requires native build on each platform)

**Fix approach:**
- Pin exact versions in package.json/Cargo.toml until thoroughly tested
- Implement automated dependency scanning (GitHub Dependabot or similar)
- Test each dependency upgrade thoroughly, especially Sharp (native bindings)
- Monitor security advisories for all three libraries
- Have fallback plan if docx library becomes unmaintained
- Document minimum versions required for each platform

---

## Testing Coverage Gaps (Pre-Implementation)

**Issue:** Testing patterns documented as "expected" but not yet implemented. Complex document processing needs high coverage to be reliable.

**Files:** All source code files when created (tests will be co-located)

**Impact:**
- Edge cases in image/PDF/DOCX processing go undetected until production
- Cross-platform bugs (macOS vs Windows vs Linux) discovered late
- Format-specific failures (corrupted PDFs, images with unusual color spaces) cause crashes
- Regression when dependencies are updated

**Fix approach:**
- Create test fixture directory: `src/__tests__/fixtures/` with sample files for each format
- Write integration tests for each processor BEFORE implementing
- Test known-problematic cases:
  - Images with unusual color spaces (CMYK, animated GIFs)
  - PDFs with corrupted objects, form fields, embedded media
  - DOCXs with complex tables, styles, embedded objects
- Implement cross-platform test matrix (macOS/Windows/Linux builds)
- Target 85%+ code coverage on processors, 70%+ on components
- Add regression tests for each bug report

---

## TypeScript Type Safety at IPC Boundary

**Issue:** Tauri command parameters and returns must be JSON-serializable. Complex types may not round-trip correctly.

**Files:** `src/types/document.ts`, command handlers in `src-tauri/src/commands/` (when created)

**Impact:**
- Type information lost in JSON serialization (Date becomes string)
- Frontend and backend type definitions get out of sync
- Runtime type errors hard to debug

**Fix approach:**
- Use `serde` with explicit serialization for Rust side
- Match Rust struct serialization exactly in TypeScript types
- Create shared type definitions or code generation to keep in sync
- Add explicit serialization tests for command parameters/returns
- Use branded types in TypeScript to catch mismatches at compile time

---

## Cross-Platform Build and Distribution Complexity

**Issue:** Tauri produces native binaries for macOS (code signing/notarization), Windows (certificate signing), and Linux (AppImage). No CI/CD pipeline mentioned yet.

**Files:** `tauri.conf.json`, future CI/CD configuration (when created)

**Impact:**
- Manual builds on each platform required
- Code signing certificates required for macOS/Windows distribution
- Linux AppImage generation may fail on different distros
- Versioning and updates must be consistent across platforms

**Fix approach:**
- Plan CI/CD pipeline with GitHub Actions for multi-platform builds
- Prepare code signing certificates for macOS (Apple Developer account required)
- Plan Windows code signing strategy (EV certificate recommended but expensive)
- Test AppImage generation on reference Linux systems
- Implement automated versioning and release notes generation
- Consider Tauri's auto-updater feature (requires backend infrastructure)

---

## Memory and Performance Under Load

**Issue:** No performance targets or profiling plan documented. Document processing can be CPU and memory intensive.

**Files:** All processor implementations (when created)

**Impact:**
- Large file processing causes app to become unresponsive
- Memory usage grows without bound for very large operations
- CPU usage high for complex operations (scaling, compression)
- Thermal issues on laptops during extended processing

**Fix approach:**
- Profile each processor with realistic file sizes (1MB, 100MB, 500MB+)
- Establish performance targets: image resize <5s, PDF resize <10s, DOCX reformat <5s
- Implement memory pooling or streaming for large files
- Add memory usage monitoring and warnings
- Consider chunked/progressive processing for very large files
- Test on low-end hardware (older Macs, Windows 7+) to understand limits

---

## Platform-Specific Issues and Workarounds

**Issue:** macOS/Windows/Linux each have unique filesystem, permission, and library compatibility quirks. Tauri abstracts some but not all.

**Files:** File I/O code in `src-tauri/src/io/`, processor implementations

**Impact:**
- Feature works on macOS but not Windows (case-sensitive filesystems)
- Sharp native binary fails to load on Linux due to glibc version
- Temp directory paths differ, causing issues in tests
- File permissions prevent reading/writing in expected locations

**Fix approach:**
- Create platform-specific test suites with CI/CD for each OS
- Document known platform limitations in CLAUDE.md
- Use Tauri's platform detection (`#[cfg(target_os)]`) for OS-specific code
- Test file path handling on all three platforms explicitly
- Use fs module consistently; avoid platform-specific path assumptions

---

## Frontend State Synchronization Issues

**Issue:** No explicit state synchronization strategy between UI and backend described. File processing may fail silently or leave UI in inconsistent state.

**Files:** `src/hooks/useFileProcessing.ts`, `src/hooks/useDocumentState.ts` (when created)

**Impact:**
- Backend succeeds but frontend doesn't reflect result
- User clicks "Save" multiple times, creating duplicate files
- Network/IPC timeout leaves UI waiting indefinitely
- Concurrent file operations create race conditions

**Fix approach:**
- Implement explicit command ID tracking for each operation
- Use Redux or similar for guaranteed state consistency
- Add timeout handling and retry logic with user prompts
- Prevent concurrent operations (disable UI during processing)
- Log all state transitions for debugging

---

## Documentation and User Expectations

**Issue:** Desktop app UX requires clear documentation of what each feature does and doesn't do. DOCX limitations in particular need clear messaging.

**Files:** Will require in-app help, tooltips, and error messages

**Impact:**
- Users attempt DOCX operations that fail (e.g., compression in v1)
- Frustration with "why doesn't it do X?"
- Support burden for feature requests that are out of scope

**Fix approach:**
- Add clear feature status indicators in UI (e.g., "DOCX page resize supported; compression coming in v2")
- Create user-facing documentation with capabilities and limitations per format
- Add helpful error messages that suggest next steps
- Implement feature request/bug report link in error dialogs
- Create FAQ addressing common "why doesn't it..." questions

---

## Version Coordination and Release Cycles

**Issue:** DOCX processing is explicitly scoped to v2 (per rule P006). Version numbering and release strategy not documented.

**Files:** `tauri.conf.json`, future release documentation

**Impact:**
- User confusion about what version they have and what features are available
- Difficult to maintain multiple versions simultaneously
- Unclear upgrade path for users

**Fix approach:**
- Define semantic versioning scheme (e.g., v1.0 = image+PDF, v2.0 = +DOCX compression/crop)
- Document features available in each major version clearly
- Plan upgrade flow and data migration (if any) between versions
- Use Tauri's auto-updater with clear release notes

---

## Unvalidated Architectural Assumptions

**Issue:** Architecture assumes certain behaviors (e.g., processors are "stateless", temp files can be safely deleted) that haven't been tested against real libraries.

**Files:** All source code (when created)

**Impact:**
- Assumptions break once implementation begins (e.g., Sharp requires persistent state)
- Requires major refactoring
- Delays feature delivery

**Fix approach:**
- Create spike/proof-of-concept code for each processor early
- Validate that Sharp, pdf-lib, and docx behave as assumed
- Document any deviations from plan in CONCERNS.md
- Build most complex processor (DOCX) first to catch architectural issues early

---

## No Monitoring or Telemetry Plan

**Issue:** No error tracking, crash reporting, or usage analytics documented. Desktop app failures go undetected.

**Files:** Will affect all components when error handling is implemented

**Impact:**
- Silent failures in user environments go unreported
- No visibility into which features are actually used
- Cannot prioritize future development based on real usage data
- Cannot track distribution of crashes across platforms/versions

**Fix approach:**
- Plan opt-in error reporting (send crash dumps and error context)
- Implement structured error logging with severity levels
- Consider lightweight analytics (features used, processing times)
- Use Tauri's logging infrastructure
- Plan backend infrastructure for receiving and aggregating reports

---

## Security Considerations for Document Processing

**Issue:** App processes user documents, some of which may be confidential. No security posture documented.

**Files:** File I/O operations throughout codebase

**Impact:**
- Documents remain in temp files after processing if cleanup fails
- Crash dumps may contain unprocessed document content
- Malicious documents could exploit Sharp/pdf-lib vulnerabilities
- No audit trail of processed documents

**Fix approach:**
- Use secure temp directory location specific to app
- Implement secure file deletion (overwrite before deleting)
- Add security scanning of input documents (magic bytes, fuzzing)
- Document security posture for users (e.g., "all processing is local, no upload")
- Consider sandboxing document processing in separate process
- Implement optional audit logging for compliance scenarios

---

## Tauri Framework Maturity and Long-Term Support

**Issue:** Tauri 1.x is stable but Tauri 2.x introduced breaking changes. Long-term support unclear.

**Files:** `Cargo.toml`, `tauri.conf.json` (when created)

**Impact:**
- Switching from Tauri 1 to 2 requires code rewrite
- Framework bugs may require workarounds
- Community is smaller than Electron (fewer Stack Overflow answers)
- Dependency on Tauri team for cross-platform issues

**Fix approach:**
- Choose Tauri 2.x for new projects (1.x approaching EOL)
- Understand breaking changes before upgrading
- Monitor Tauri GitHub for security advisories
- Have contingency plan if framework becomes unmaintained (unlikely but possible)

---

## Summary of Critical Pre-Implementation Actions

1. **Create proof-of-concept** for each document processor (image, PDF, DOCX) to validate assumptions
2. **Test file size limits** with realistic large files (500MB+) to establish real constraints
3. **Plan error recovery** including crash handling, temp file cleanup, and state synchronization
4. **Establish testing strategy** with platform-specific CI/CD and fixture libraries
5. **Document DOCX limitations** explicitly to align user expectations with v1 scope
6. **Plan cross-platform distribution** including code signing and CI/CD infrastructure

---

*Concerns audit: 2026-02-19*
*Update as implementation progresses and new risks are discovered*
