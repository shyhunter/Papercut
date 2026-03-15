# Phase 14: Security & Privacy Hardening - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Papercut safe against all known security vulnerabilities and provide strong, verifiable privacy guarantees to users. This covers: input sanitization (shell command injection), Tauri IPC hardening, temp file lifecycle, CSP lockdown, dependency audits, password handling, and a user-facing privacy statement. No new features — purely hardening what exists.

</domain>

<decisions>
## Implementation Decisions

### Privacy Promise to Users
- Privacy statement accessible via a **footer link on the dashboard** ("Privacy") that opens an in-app modal
- Statement includes both a **human-readable promise** at the top AND a **collapsible "Technical details" section** with verifiable facts (e.g., "No network permissions requested", "No analytics SDK", "All processing runs locally")
- **First-launch banner**: one-time dismissible banner — "Your files never leave your device. Learn more →"
- Mention temp file handling in privacy page: "Temporary files are created during processing and automatically deleted afterwards"

### Command Injection Safety
- All shell command invocations (AppleScript for Word, PowerShell for Word, LibreOffice soffice, Calibre ebook-convert, Ghostscript) must sanitize filename/path arguments against injection
- **Reject dangerous filenames** — if a filename contains characters that could cause injection (quotes, semicolons, backticks, etc.), block the operation and show: "This filename contains characters that aren't supported. Please rename the file and try again."
- Do NOT silently sanitize — be transparent about rejection so users understand why
- All Tauri IPC commands must validate arguments server-side (path traversal prevention, format allow-lists)

### File & Temp Data Handling
- **Belt-and-suspenders cleanup**: delete temp files immediately after use AND sweep on app launch to catch leftovers from crashes
- **Passwords never persist**: PDF protect/unlock passwords exist only in the React input field, passed once to Rust via IPC, used for the GS command, then dropped. Never stored, logged, or written to disk.
- No passwords in Rust log output, no passwords in error messages returned to frontend

### App Lockdown (CSP & Permissions)
- **Zero outbound network**: no network permissions in Tauri config — the app literally cannot make HTTP calls. Strongest privacy guarantee.
- **FS scope stays broad** ($HOME/**) — a file picker app needs this; users open files from anywhere in their home folder
- **CSP**: block inline scripts, block external connections. Inline styles allowed (Tailwind/React need them).
- **Dependency audit**: run both `npm audit` and `cargo audit`, fix ALL vulnerabilities regardless of severity — zero tolerance

### Claude's Discretion
- Data collection policy approach (zero collection vs minimal opt-in) — pick what's standard for privacy-first desktop apps
- CSP inline style handling — evaluate compatibility with Tailwind/React stack
- Specific sanitization implementation (allow-list vs deny-list for filename characters)
- Temp file naming strategy (random UUIDs vs timestamped)

</decisions>

<specifics>
## Specific Ideas

- The privacy page should feel trustworthy and professional — not a legal wall of text, but a clear promise backed by technical facts
- The first-launch banner should be warm and reassuring, not corporate — it's a selling point
- Error messages for rejected filenames should be helpful ("rename the file") not scary ("security violation detected")
- The technical proof section in the privacy modal should reference actual Tauri config/capabilities that can be verified

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-security-privacy-hardening*
*Context gathered: 2026-03-14*
