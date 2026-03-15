# Phase 14: Security & Privacy Hardening - Research

**Researched:** 2026-03-14
**Domain:** Application security hardening, input sanitization, Tauri IPC/CSP configuration, privacy UX
**Confidence:** HIGH

## Summary

This phase hardens Papercut against injection attacks in shell command invocations, locks down the Tauri webview with a strict CSP, ensures temp files are reliably cleaned up, prevents password leakage, and delivers a user-facing privacy statement. The codebase already has some security foundations (format allow-lists in `compress_pdf`, `convert_with_libreoffice`, `convert_with_calibre`, `convert_pdfa`, `convert_with_textutil`; a privacy test in `privacy.test.ts`; a `PrivacyFooter` component), but significant gaps remain.

**Key findings from codebase audit:**

1. **`convert_with_word` is the highest-risk command** -- it interpolates `source_path` directly into AppleScript and PowerShell strings. The current escaping (`replace('"', "\\\"")`) is insufficient against injection via filenames containing backticks, dollar signs, or semicolons.
2. **`extra_args` in `convert_with_calibre`** passes user-derived arguments directly to the CLI with no validation beyond the output format allow-list -- a potential injection vector.
3. **Temp files use timestamp-based names** (`subsec_nanos()`), not UUIDs -- collision-prone and predictable.
4. **Passwords are passed as CLI arguments** to Ghostscript (`-sOwnerPassword=`, `-sUserPassword=`, `-sPDFPassword=`) which may be visible in process listings. No logging of passwords exists, but no explicit prevention either.
5. **CSP is currently `null`** in `tauri.conf.json` -- completely open.
6. **No startup sweep** for leftover temp files from crashed sessions.

**Primary recommendation:** Implement filename rejection (deny dangerous characters), harden CSP, add temp file sweep on startup, and build the privacy modal. No new dependencies required -- all work uses existing Tauri APIs and Rust std.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Privacy Promise to Users:**
- Privacy statement accessible via a **footer link on the dashboard** ("Privacy") that opens an in-app modal
- Statement includes both a **human-readable promise** at the top AND a **collapsible "Technical details" section** with verifiable facts (e.g., "No network permissions requested", "No analytics SDK", "All processing runs locally")
- **First-launch banner**: one-time dismissible banner -- "Your files never leave your device. Learn more ->"
- Mention temp file handling in privacy page: "Temporary files are created during processing and automatically deleted afterwards"

**Command Injection Safety:**
- All shell command invocations (AppleScript for Word, PowerShell for Word, LibreOffice soffice, Calibre ebook-convert, Ghostscript) must sanitize filename/path arguments against injection
- **Reject dangerous filenames** -- if a filename contains characters that could cause injection (quotes, semicolons, backticks, etc.), block the operation and show: "This filename contains characters that aren't supported. Please rename the file and try again."
- Do NOT silently sanitize -- be transparent about rejection so users understand why
- All Tauri IPC commands must validate arguments server-side (path traversal prevention, format allow-lists)

**File & Temp Data Handling:**
- **Belt-and-suspenders cleanup**: delete temp files immediately after use AND sweep on app launch to catch leftovers from crashes
- **Passwords never persist**: PDF protect/unlock passwords exist only in the React input field, passed once to Rust via IPC, used for the GS command, then dropped. Never stored, logged, or written to disk.
- No passwords in Rust log output, no passwords in error messages returned to frontend

**App Lockdown (CSP & Permissions):**
- **Zero outbound network**: no network permissions in Tauri config -- the app literally cannot make HTTP calls. Strongest privacy guarantee.
- **FS scope stays broad** ($HOME/**) -- a file picker app needs this; users open files from anywhere in their home folder
- **CSP**: block inline scripts, block external connections. Inline styles allowed (Tailwind/React need them).
- **Dependency audit**: run both `npm audit` and `cargo audit`, fix ALL vulnerabilities regardless of severity -- zero tolerance

### Claude's Discretion

- Data collection policy approach (zero collection vs minimal opt-in) -- pick what's standard for privacy-first desktop apps
- CSP inline style handling -- evaluate compatibility with Tailwind/React stack
- Specific sanitization implementation (allow-list vs deny-list for filename characters)
- Temp file naming strategy (random UUIDs vs timestamped)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

## Standard Stack

### Core (No New Dependencies)

| Library/Tool | Version | Purpose | Already Present |
|---|---|---|---|
| Tauri v2 CSP config | 2.x | Webview content security policy | Yes (currently `null`) |
| Tauri capability scopes | 2.x | IPC permission boundaries | Yes (in `capabilities/default.json`) |
| `std::fs` (Rust) | stable | Temp file cleanup on startup | Yes |
| `uuid` crate | 1.x | Cryptographically random temp file names | **NEW** |
| `cargo-audit` | latest | Rust dependency vulnerability scanner | **NEW (dev tool)** |

### Supporting

| Tool | Purpose | When to Use |
|---|---|---|
| `npm audit` | Node dependency vulnerability scanner | CI/pre-release check |
| `cargo audit` | Rust dependency vulnerability scanner | CI/pre-release check |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `uuid` crate for temp names | `rand` crate | `uuid` is more standard for this exact use case; `rand` is heavier |
| Filename deny-list | Filename allow-list | Allow-list is safer (only permit known-safe chars). **Recommend allow-list.** |

**Installation:**
```bash
# Rust side
cd src-tauri && cargo add uuid --features v4

# Dev tools (not bundled)
cargo install cargo-audit
```

No npm packages needed -- all frontend work uses existing React/Tailwind/Radix components.

## Architecture Patterns

### Recommended Project Structure

```
src-tauri/src/
├── lib.rs              # Add: validate_path(), validate_filename(), sweep_temp_files()
│                       #       Password scrubbing in error paths
│
src/
├── components/
│   ├── PrivacyFooter.tsx        # Enhance: add clickable "Privacy" link
│   ├── PrivacyModal.tsx         # NEW: full privacy statement modal
│   └── FirstLaunchBanner.tsx    # NEW: one-time dismissible banner
├── lib/
│   ├── __tests__/
│   │   ├── privacy.test.ts      # Enhance: more assertions
│   │   ├── security.test.ts     # NEW: injection/sanitization tests
│   │   └── tempCleanup.test.ts  # NEW: temp file lifecycle tests
│   └── fileValidation.ts        # Enhance: add filename safety check
```

### Pattern 1: Centralized Path/Filename Validation (Rust Side)

**What:** A single `validate_source_path()` function called at the top of every `#[tauri::command]` that accepts a file path. Rejects path traversal (`..`), null bytes, and dangerous filename characters.

**When to use:** Every IPC command that receives a path from the frontend.

**Example:**
```rust
/// Characters that are dangerous in shell interpolation contexts.
/// Using an ALLOW-LIST approach: only permit alphanumeric, spaces, dots,
/// hyphens, underscores, and path separators.
fn validate_source_path(path: &str) -> Result<(), String> {
    // Block null bytes
    if path.contains('\0') {
        return Err("Invalid file path".to_string());
    }
    // Block path traversal
    if path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    // Extract filename and check for dangerous characters
    let filename = std::path::Path::new(path)
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or("Invalid filename")?;

    let safe = filename.chars().all(|c| {
        c.is_alphanumeric() || " .-_()[]{}".contains(c)
    });
    if !safe {
        return Err(
            "This filename contains characters that aren't supported. \
             Please rename the file and try again.".to_string()
        );
    }
    Ok(())
}
```

**Confidence:** HIGH -- this is standard practice for shell-invoking applications.

### Pattern 2: Temp File Sweep on Startup

**What:** On app launch, scan `std::env::temp_dir()` for files matching `papercut_*` and delete any older than a threshold (e.g., 1 hour).

**When to use:** In the Tauri `setup()` hook, before the window opens.

**Example:**
```rust
fn sweep_temp_files() {
    let temp = std::env::temp_dir();
    let prefix = "papercut_";
    if let Ok(entries) = std::fs::read_dir(&temp) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            if name.to_string_lossy().starts_with(prefix) {
                // Delete if older than 1 hour
                if let Ok(meta) = entry.metadata() {
                    if let Ok(modified) = meta.modified() {
                        if modified.elapsed().unwrap_or_default() > std::time::Duration::from_secs(3600) {
                            let _ = std::fs::remove_file(entry.path());
                            let _ = std::fs::remove_dir_all(entry.path()); // for directories
                        }
                    }
                }
            }
        }
    }
}
```

**Confidence:** HIGH -- straightforward filesystem operation.

### Pattern 3: CSP for Tauri v2 with Tailwind/React

**What:** Set a strict CSP in `tauri.conf.json` that blocks inline scripts and external connections while allowing inline styles (required by Tailwind's runtime and React's style attributes).

**Example (tauri.conf.json):**
```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src ipc: http://ipc.localhost"
    }
  }
}
```

**Key points:**
- `'unsafe-inline'` for `style-src` only -- Tailwind v4 injects styles at runtime, and React uses inline `style` attributes. Blocking inline styles would break the entire UI.
- `script-src 'self'` blocks inline scripts (no `'unsafe-inline'`, no `'unsafe-eval'`).
- `connect-src ipc: http://ipc.localhost` allows Tauri IPC but blocks all external HTTP/WebSocket.
- `img-src 'self' blob: data:` needed for PDF thumbnail rendering (canvas `toDataURL`) and image previews.
- `font-src 'self' data:` covers any embedded fonts.
- No `http:` or `https:` in any directive.

**Confidence:** HIGH -- Tauri v2 CSP docs confirm this format. Tailwind v4's `@tailwindcss/vite` plugin injects styles via `<style>` tags, requiring `'unsafe-inline'` in `style-src`.

### Anti-Patterns to Avoid

- **Silent sanitization of filenames:** User decision says to REJECT, not silently modify. A filename like `report;rm -rf.pdf` should fail with a clear message, not be silently renamed.
- **Logging passwords in error messages:** Never include password values in error strings returned to the frontend or written to stderr. The current `protect_pdf` and `unlock_pdf` don't log passwords, but the error paths must be audited to ensure GS stderr output doesn't echo them.
- **Relying solely on Tauri shell allowlist:** The shell plugin allowlist controls which binaries can be invoked, but it does NOT sanitize arguments. A malicious filename passed as an argument can still inject commands through the allowed binary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| UUID generation | Custom random string | `uuid` crate v4 | Cryptographic randomness, collision-free |
| CSP header parsing | Manual string building | Tauri's `csp` config field | Tauri handles header injection into webview |
| Dependency auditing | Manual CVE checking | `npm audit` + `cargo audit` | Automated, maintained databases |
| First-launch detection | Custom file flag | `tauri-plugin-store` (already used) | Already in the project for theme/recent dirs |

**Key insight:** Security hardening is mostly about correct configuration and validation logic, not new libraries. The only new dependency needed is `uuid` for temp file naming.

## Common Pitfalls

### Pitfall 1: AppleScript/PowerShell String Injection via Filenames

**What goes wrong:** A filename like `"; do shell script "rm -rf ~"` or `` `$(whoami)` `` gets interpolated into an AppleScript/PowerShell string, executing arbitrary code.

**Why it happens:** `convert_with_word` currently uses simple `replace('"', "\\\"")` which doesn't handle backticks, dollar signs, semicolons, or other injection vectors.

**How to avoid:** Validate the filename with an allow-list BEFORE it reaches the AppleScript/PowerShell interpolation. Reject filenames with any character outside `[a-zA-Z0-9 ._\-()[\]{}]`.

**Warning signs:** Any `format!()` that interpolates user input into a script string.

**Current vulnerable locations:**
- `lib.rs:1104-1117` -- AppleScript string interpolation in `convert_with_word`
- `lib.rs:1143-1158` -- PowerShell string interpolation in `convert_with_word`

### Pitfall 2: Calibre `extra_args` Injection

**What goes wrong:** The `convert_with_calibre` command accepts `extra_args: Vec<String>` from the frontend and passes them directly to the CLI: `args.extend(extra_args)`. A malicious frontend call could inject arbitrary flags.

**Why it happens:** The TypeScript side constructs these args via `buildCalibreArgs()` which looks safe, but the Rust command has no server-side validation of the argument values.

**How to avoid:** Validate `extra_args` on the Rust side -- either against a flag allow-list or by ensuring values don't start with `-` unless they match known Calibre flags.

**Warning signs:** Any IPC command that passes through user-controlled arrays to `args()`.

### Pitfall 3: CSP Breaking Tailwind/React

**What goes wrong:** Setting `script-src 'self'` without `'unsafe-eval'` can break some bundler configurations. Setting `style-src 'self'` without `'unsafe-inline'` breaks Tailwind.

**Why it happens:** Vite in dev mode uses `eval()` for HMR. Tailwind v4 injects `<style>` elements at runtime.

**How to avoid:**
- Dev mode: Tauri automatically relaxes CSP in dev builds (adds `'unsafe-eval'` for the dev server). No special handling needed.
- Production: `style-src 'self' 'unsafe-inline'` is necessary and acceptable (inline styles are not a meaningful XSS vector in a desktop app without external content loading).
- Test the production build to verify nothing breaks.

**Warning signs:** Blank white screen after enabling CSP = scripts blocked. Unstyled page = styles blocked.

### Pitfall 4: Temp File Timestamp Collisions

**What goes wrong:** Current temp file names use `subsec_nanos()` which can collide if two operations happen within the same nanosecond (unlikely but possible with fast sequential operations).

**Why it happens:** `subsec_nanos()` returns only the sub-second component, not a globally unique value.

**How to avoid:** Use `uuid::Uuid::new_v4()` for temp file names. Example: `papercut_compressed_a1b2c3d4.pdf`.

**Warning signs:** "Failed to read output" errors in production that can't be reproduced.

### Pitfall 5: Password Echoed in GS Stderr

**What goes wrong:** Ghostscript may echo error messages that include the password value (e.g., "Invalid password: hunter2").

**Why it happens:** GS stderr is captured and returned in error messages to the frontend.

**How to avoid:** Scrub any password-like content from stderr before returning it. Specifically, in `protect_pdf` and `unlock_pdf`, replace the raw stderr with a generic message: "Ghostscript failed. Wrong password or corrupted PDF." without passing through raw stderr that might contain the password.

**Warning signs:** Error toasts that display passwords.

## Code Examples

### Filename Validation Function (Rust)

```rust
/// Allow-list of safe filename characters.
/// Rejects anything that could be dangerous in shell interpolation.
/// Returns Ok(()) if safe, Err with user-friendly message if not.
fn validate_filename_safe(path: &str) -> Result<(), String> {
    let filename = std::path::Path::new(path)
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or("Could not read filename")?;

    // Allow: alphanumeric, space, dot, hyphen, underscore, parens, brackets
    let safe = filename.chars().all(|c| {
        c.is_alphanumeric()
            || " .-_()[]{}+=#@!,".contains(c)
    });

    if !safe {
        return Err(
            "This filename contains characters that aren't supported. \
             Please rename the file and try again.".to_string()
        );
    }

    // Also block path traversal
    if path.contains("..") || path.contains('\0') {
        return Err("Invalid file path".to_string());
    }

    Ok(())
}
```

### CSP Configuration (tauri.conf.json)

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src ipc: http://ipc.localhost"
    }
  }
}
```

### Temp File Sweep on Startup (Rust)

```rust
// In run() setup hook:
tauri::Builder::default()
    .setup(|_app| {
        sweep_papercut_temp_files();
        Ok(())
    })
```

### Privacy Modal Content Structure (React)

```tsx
// Collapsible technical details pattern
<details>
  <summary>Technical details</summary>
  <ul>
    <li>No network permissions in Tauri capabilities config</li>
    <li>No analytics SDK or tracking code</li>
    <li>All file processing runs locally via Rust/Ghostscript</li>
    <li>Temp files auto-deleted after each operation</li>
    <li>Passwords are never stored or logged</li>
  </ul>
</details>
```

### First-Launch Banner Persistence (tauri-plugin-store)

```typescript
// Use existing tauri-plugin-store for one-time banner
import { load } from '@tauri-apps/plugin-store';

const store = await load('settings.json');
const dismissed = await store.get<boolean>('privacy-banner-dismissed');
if (!dismissed) {
  // Show banner
}
// On dismiss:
await store.set('privacy-banner-dismissed', true);
await store.save();
```

## Discretion Recommendations

### Data Collection Policy: Zero Collection

**Recommendation:** Zero data collection. No opt-in, no analytics, no telemetry. This is the standard for privacy-first desktop apps (e.g., Signal Desktop, KeePassXC, Obsidian local mode).

**Rationale:** The app has zero network permissions -- it literally cannot phone home. Claiming "zero collection" is a verifiable technical fact, not just a promise. This is the strongest privacy position and aligns perfectly with the existing architecture.

### Filename Sanitization: Allow-List Approach

**Recommendation:** Use an allow-list of safe characters rather than a deny-list of dangerous ones.

**Rationale:** Deny-lists are fragile -- you must anticipate every possible injection character across AppleScript, PowerShell, and Unix shell contexts. An allow-list (`[a-zA-Z0-9 ._\-()[\]{}+=#@!,]`) is safer because unknown characters are rejected by default.

**Characters to allow:** Alphanumeric, space, dot, hyphen, underscore, parentheses, square brackets, curly braces, plus, equals, hash, at, exclamation, comma. This covers 99%+ of real-world filenames.

### Temp File Naming: UUIDs

**Recommendation:** Use `uuid::Uuid::new_v4()` for temp file names.

**Rationale:** Current `subsec_nanos()` approach has theoretical collision risk and is predictable (an attacker could pre-create symlinks at predicted paths -- a symlink attack). UUIDs are cryptographically random and collision-proof.

**Example:** `papercut_compressed_a7f3b2c1-4d5e-6f78-9a0b-1c2d3e4f5a6b.pdf`

### CSP Inline Styles: Allow with `'unsafe-inline'`

**Recommendation:** Allow inline styles via `style-src 'self' 'unsafe-inline'`.

**Rationale:** Tailwind v4 with the `@tailwindcss/vite` plugin injects `<style>` elements. React components use inline `style` attributes for dynamic positioning (e.g., PDF overlays, signature placement). Blocking inline styles would break the entire UI. In a desktop app with no external content loading, inline styles pose no XSS risk.

## Inventory of All Shell Command Invocations

This is the complete list of places where the app invokes external processes, with their current security status:

| Command | Function | Injection Risk | Current Protection | Needed |
|---|---|---|---|---|
| `gs` (sidecar) | `compress_pdf` | LOW -- args are controlled | Preset allow-list | Add path validation |
| `gs` (sidecar) | `protect_pdf` | MEDIUM -- passwords in args | None | Path validation, password scrub from errors |
| `gs` (sidecar) | `unlock_pdf` | MEDIUM -- password in args | None | Path validation, password scrub from errors |
| `gs` (sidecar) | `convert_pdfa` | LOW | Level allow-list | Add path validation |
| `gs` (sidecar) | `repair_pdf` | LOW | None | Add path validation |
| `soffice` | `convert_with_libreoffice` | LOW -- args passed separately | Format allow-list | Add path validation |
| `ebook-convert` | `convert_with_calibre` | MEDIUM -- extra_args passed through | Format allow-list | Validate extra_args, add path validation |
| `osascript` | `convert_with_word` (macOS) | **HIGH -- string interpolation** | Quote escaping only | **Filename validation is critical** |
| `powershell` | `convert_with_word` (Windows) | **HIGH -- string interpolation** | Quote escaping only | **Filename validation is critical** |
| `textutil` | `convert_with_textutil` | LOW -- args passed separately | Format allow-list | Add path validation |
| `open -R` | `reveal_in_finder` | LOW | None | Add path validation |
| `explorer /select,` | `reveal_in_finder` (Windows) | LOW | None | Add path validation |
| `textutil -info` | `detect_converters` | NONE -- hardcoded args | N/A | None needed |
| `powershell` | `detect_converters` (Windows) | NONE -- hardcoded script | N/A | None needed |
| `soffice --version` | `detect_converters` | NONE -- hardcoded args | N/A | None needed |
| `ebook-convert --version` | `detect_converters` | NONE -- hardcoded args | N/A | None needed |
| `pandoc --version` | `detect_converters` | NONE -- hardcoded args | N/A | None needed |

## Temp File Inventory

All temp file patterns in `lib.rs`:

| Pattern | Function | Cleanup | Issue |
|---|---|---|---|
| `papercut_compressed_{nanos}.pdf` | `compress_pdf` | Yes (after read or on error) | Collision risk, no crash cleanup |
| `papercut_protected_{nanos}.pdf` | `protect_pdf` | Yes | Same |
| `papercut_unlocked_{nanos}.pdf` | `unlock_pdf` | Yes | Same |
| `papercut_pdfa_{nanos}.pdf` | `convert_pdfa` | Yes | Same |
| `papercut_PDFA_def_{nanos}.ps` | `convert_pdfa` | Yes | Same |
| `papercut_repaired_{nanos}.pdf` | `repair_pdf` | Yes | Same |
| `papercut_convert_{millis}/` | `convert_with_libreoffice` | Yes (`remove_dir_all`) | Same |
| `papercut_lo_profile/` | `convert_with_libreoffice` | **NO -- never cleaned** | Persistent profile dir |
| `papercut_calibre_{stem}.{ext}` | `convert_with_calibre` | Yes | Uses source stem (predictable) |
| `papercut_textutil_{stem}_{millis}.{ext}` | `convert_with_textutil` | Yes | Same |
| `papercut_word_{stem}_{millis}.{ext}` | `convert_with_word` | Yes | Same |

## Existing Security Measures (Already Done)

1. **Format allow-lists:** `compress_pdf` validates preset, `convert_with_libreoffice` validates output format, `convert_with_calibre` validates output format, `convert_pdfa` validates level, `convert_with_textutil` validates output format.
2. **Privacy test:** `src/lib/__tests__/privacy.test.ts` asserts no `http:` permissions in capabilities config and that `processImage` never calls `fetch`.
3. **File size limit:** `fileValidation.ts` enforces 100MB max.
4. **Null byte check:** `isSupportedFile()` already blocks null bytes in paths.
5. **Tauri shell allowlist:** Only specific binaries are permitted in `capabilities/default.json`.

## Open Questions

1. **Unicode filenames:** Should the allow-list support Unicode characters (accented letters, CJK, emoji)? Many real users have filenames with accented characters (e.g., `resume.pdf`). The allow-list should probably include `c.is_alphanumeric()` which covers Unicode alphanumerics, but this needs testing with AppleScript/PowerShell to ensure those characters are safe in interpolation contexts.
   - **Recommendation:** Start with `c.is_alphanumeric()` (Unicode-aware) plus the safe punctuation set. Test with accented filenames in the AppleScript/PowerShell paths.

2. **LibreOffice profile directory cleanup:** `papercut_lo_profile/` is created but never deleted. Should the startup sweep include this directory? It's harmless (just LO config cache) but technically violates the "no data lingers" principle.
   - **Recommendation:** Include it in the startup sweep (delete if older than 1 hour).

3. **`cargo audit` installation:** `cargo-audit` is a developer tool, not a runtime dependency. It should be documented as a CI/pre-release step, not bundled.
   - **Recommendation:** Add to CI pipeline documentation and run manually before each release.

## Sources

### Primary (HIGH confidence)
- **Codebase audit:** Direct reading of `src-tauri/src/lib.rs` (all 1236 lines), `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`, `src/lib/documentConverter.ts`, `src/lib/fileValidation.ts`, `src/lib/__tests__/privacy.test.ts`, `src/components/PrivacyFooter.tsx`
- **Tauri v2 CSP:** Tauri v2 configuration schema (in `src-tauri/gen/schemas/desktop-schema.json`) confirms `app.security.csp` accepts a standard CSP string
- **Tailwind v4:** Uses `@tailwindcss/vite` plugin which injects styles via `<style>` elements (requires `'unsafe-inline'` in `style-src`)

### Secondary (MEDIUM confidence)
- **AppleScript injection:** Well-documented attack vector -- AppleScript `do shell script` and POSIX file interpolation are known injection points when user input is interpolated into script strings
- **Tauri shell plugin:** Tauri's shell plugin passes arguments as separate array elements to the OS process (no shell interpretation), EXCEPT when the command itself is a script interpreter (osascript, powershell) that interprets its argument as code

### Tertiary (LOW confidence)
- **Ghostscript password echoing:** Unverified whether GS echoes passwords in error output. The safest approach is to scrub stderr regardless.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed beyond `uuid`
- Architecture: HIGH -- all patterns are straightforward validation/configuration
- Pitfalls: HIGH -- injection vectors identified through direct code audit
- CSP compatibility: MEDIUM -- needs production build testing to verify Tailwind/React work with the proposed CSP

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain, 30-day validity)
