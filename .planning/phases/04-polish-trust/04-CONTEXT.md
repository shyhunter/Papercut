# Phase 4: Polish & Trust - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the two features that close out v1.0: (1) recent directory shortcuts so users can quickly re-open files from familiar folders, and (2) privacy verification that both tests and visually signals that no file data leaves the machine. Edge-case hardening (unsupported files, corrupt files, cancelled saves) is also in scope. New capabilities (batch processing, themes, animations) are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Recent Directories UI
- Surfaced as a **floating quick-access button** on the landing card — opens a dropdown of recent dirs
- Store and show the **5 most recent** directories
- Stale paths (deleted/moved/unmounted) are **silently hidden** on load — user never sees invalid entries
- Clicking a shortcut **opens the native file picker pre-navigated to that directory** — user still picks the file

### Privacy Verification
- **Both** a developer-facing test AND a user-facing trust signal
- Trust signal: **footer / status bar** — persistent at the bottom of the app window
- Style: **lock icon + "Processed locally" text** — literal, no ambiguity
- Automated test covers **both** static config check (tauri.conf.json has no network-granting capabilities) AND a runtime intercept (run a processing command, assert zero outbound network requests)

### Error UX for Bad Inputs
- **Unsupported file type dropped:** Inline error on the drop zone (error state with message, clears after a moment) — stay on landing
- **Pre-drop hover feedback:** Drop zone turns **red/warning highlight** when hovering an unsupported file type — before the user drops
- **Corrupt/unreadable file (processing failure):** Toast notification + **return to landing** — "Could not read file — it may be corrupted"
- **Save As dialog cancelled:** Brief **"Save cancelled" toast**, stay on SaveStep — user can try again

### Claude's Discretion
- Exact dropdown animation and positioning for the recent dirs button
- How the drop zone detects file type during drag hover (may be limited by Tauri's drag event API)
- Timing/duration of the inline drop zone error state before it clears
- Footer layout integration with existing app chrome

</decisions>

<specifics>
## Specific Ideas

- The recent dirs floating button should feel like a quick-access affordance, not a settings panel — light touch
- The footer privacy indicator should be subtle and permanent, not call attention to itself after the first time you see it

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-polish-trust*
*Context gathered: 2026-02-23*
