# Papercut — Project Rules & Decisions

Managed via `/rules-manager` skill. See global rules in `~/.claude/rules.md`.

---

## Legend

| Field | Values |
|---|---|
| **Scope** | `project` |
| **Category** | `Workflow` · `Tooling` · `Code Style` · `Architecture` · `Communication` · `Security` |
| **Status** | `active` · `deprecated` |

---

## Security Baseline (inherited — do not modify, only extend)

This project inherits the global security baseline: rules **R005–R016** in `~/.claude/rules.md`, enforced by global hooks in `~/.claude/hooks/security/`.

**Papercut-specific extensions** (Tauri desktop app — RCE blast radius is on user machines, not on a server):

- **P011 — Tauri capabilities are append-only via review.** Never broaden `src-tauri/capabilities/*.json` (especially `plugin-fs`, `plugin-shell`, `plugin-opener`, `plugin-process`, `plugin-updater`) without explicit user approval and a written reason. Each capability scope = potential arbitrary file/shell access from JS.
- **P012 — Sidecar binaries require provenance.** Any binary in `src-tauri/binaries/` must have a documented source URL + SHA-256 in `src-tauri/binaries/README.md`. Compromised sidecar = full RCE on every user machine.
- **P013 — Updater signing key never leaves CI secrets.** The Tauri updater private key (`TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) lives only in CI secret manager. Never in repo, never in `.env`, never in `tauri.conf.json`. A leaked signing key = ability to ship malicious updates to every installed user. **Procedure (key generation, storage, rotation, incident response): see `.security/updater-signing-plan.md`.** Rotation cadence is annual + on-leak (documented exception to global R007's 90-day default, justified by Tauri's offline-verification model).
- **P014 — Renderer untrust boundary.** Treat anything from the Vite/React renderer as user input when it crosses to Rust via Tauri commands. Validate paths (no `..`, no symlink escape), file types, and sizes inside the Rust handler — not in JS.
- **P015 — Dependency audit gate.** `npm audit --omit=dev` MUST run in CI on every PR. High/critical advisories block merge. Pin direct deps; use lockfile.
- **P016 — Secret scanning in CI.** `gitleaks detect --no-banner` MUST run in CI on every push. A failure blocks the build.

---

## Rules & Decisions

| ID | Category | Date | Rule | Reason | Expected Result | Example | Status |
|---|---|---|---|---|---|---|---|
| P001 | Architecture | 2026-02-19 | Use Tauri + TypeScript + React as the app shell | Lightweight bundle (~10MB vs Electron's 150MB+), suitable for a local utility app | Small distributable, native feel | `tauri build` produces a small native binary | active |
| P002 | Tooling | 2026-02-19 | Use Sharp for image resizing/compression | Best-in-class Node.js image processing library | High-quality image output across all resize modes | `sharp(input).resize(800).toFile(output)` | active |
| P003 | Tooling | 2026-02-19 | Use pdf-lib for PDF page resizing and reformatting | Mature JS library, no binary dependency needed | PDF page resize without external tools | `PDFDocument.load()` → scale pages → `save()` | active |
| P004 | Tooling | 2026-02-19 | Use docx library for DOCX manipulation | Most mature Node.js option for Word documents | DOCX resize/reformat without Office dependency | `new Document({...})` to rebuild with new dimensions | active |
| P005 | Workflow | 2026-02-19 | Use GSD for planning phases; review all plans before execution (no yolo mode) | Pragmatic approach — GSD for structure, human gates for production safety | Plans are reviewed and approved before any code is written | Run `/gsd:plan-phase`, read the plan, then approve before `/gsd:execute-phase` | active |
| P006 | Architecture | 2026-02-19 | DOCX resize is limited — scope carefully per milestone | No ecosystem handles all DOCX operations perfectly | Avoid over-promising on DOCX features | Start with page size change only; compression and crop are v2 | active |
| P007 | Workflow | 2026-02-21 | Commit real binary test fixtures to `test-fixtures/` for every new file format or processing pipeline added | Synthetic byte stubs (magic bytes only) missed 3 live bugs; real fixtures catch format-parsing and pipeline errors before manual testing | Every pipeline test has at least one test using a real, decodable file from `test-fixtures/` | `test-fixtures/sample.jpg`, `sample.png`, `sample.pdf` used in `imageProcessor.test.ts` and `pdfProcessor.test.ts` | active |
| P008 | Workflow | 2026-02-21 | New features and bug fixes must include parallel automated test entries in `.planning/TEST_PLAN.md` | Manual testing caught 3 bugs that automated tests would have prevented; manual and automated coverage must be kept in sync | Every new feature or bug fix has corresponding automated test IDs cited in the TEST_PLAN.md automated coverage table | When a bug is fixed: add a regression test, then add its test ID to the "Automated vs Manual" table in TEST_PLAN.md | active |
| P009 | Workflow | 2026-02-21 | Bug-to-test policy: every bug fix must include a regression test that would have caught it | Fixes without tests tend to regress; a test that reproduces the failure is the most valuable artifact of a bug fix | Zero regressions on previously fixed bugs | Bug 1 (slider auto-submit) → `ImageConfigureStep.test.tsx` tests mouseUp; Bug 2 (stale label) → label-only assertion | active |
| P010 | Workflow | 2026-02-24 | Adopt TDD: write failing tests BEFORE fixing bugs or adding features | Compression bug (GS bloat) shipped without a test that would have caught it; the red-green cycle forces precise specification of expected behaviour before implementation | Every bug fix has a red regression test committed (or at least run) before the green implementation; every new feature starts with a failing test | Write test → run (red) → fix code → run (green) → commit both together | active |

---

## How to Add a Rule

Run `/rules-manager` and follow the prompts.
