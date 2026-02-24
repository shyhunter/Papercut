# Phase 6: Safety & Hardening - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

The app never hangs, crashes, or silently fails — large files, corrupt inputs, long-running operations, and unexpected render failures all have a safe, recoverable exit path. This phase adds no new processing features; it hardens every edge case in the existing pipelines.

</domain>

<decisions>
## Implementation Decisions

### Large file warning
- Files over 100 MB are not supported — hard cap, not a soft warning
- Warning appears as a modal dialog (blocks the UI — user must respond before continuing)
- Modal shows: file size + estimated processing time
- Modal offers Cancel only (no "proceed anyway") — accompanied by an explicit message that files over 100 MB are not supported
- User must provide a smaller file to continue

### Cancellation UX
- Cancel button placement: Claude's discretion — pick the approach that fits existing UI patterns
- Cancellation is immediate — no confirmation dialog
- When cancelled, the app stays on the Compare step with a "Cancelled" error state
- Cancelled state shows: contextual message + Retry button (re-run with same settings) + Back to Configure button (change settings)

### Error message style
- Corrupt and zero-byte file errors appear inline on the landing card (same pattern as current invalid drop error)
- Tone: technical and precise
- Distinct messages for distinct cases:
  - Zero-byte: "This file is empty. Please try a different file."
  - Corrupt: "This file appears to be corrupt. Please try a different file."
- Mid-flow processing errors (file passes load but fails during processing): same inline treatment, app resets to landing screen

### Error boundary fallback
- Error boundaries wrap both individual steps (Configure, Compare, Save) and the whole app
- Step-level boundary fallback: contextual message + collapsed error details section + "Reset this step" button
- App-level boundary fallback: same style as step-level but full width (consistent design, not a separate layout)
- Recovery action: reset the failed step only — file stays loaded, user doesn't lose progress
- App-level recovery: full-width version of the same UI with a Restart app action

### Claude's Discretion
- Cancel button exact placement and visual treatment during processing
- Exact wording of the "Cancelled" state message on Compare step
- Error details section format in the boundary fallback (stack trace vs friendly description)
- Processing time estimate calculation for the large file modal

</decisions>

<specifics>
## Specific Ideas

- Large file hard cap matches Phase 6 success criteria: > 100 MB triggers the warning
- Inline error pattern already exists for invalid drops (auto-clears in 2.5s) — corrupt/empty file errors should follow the same pattern
- Cancellation should land on Compare (not reset to landing) so the user retains their settings and can retry without reconfiguring

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-safety-hardening-high*
*Context gathered: 2026-02-24*
