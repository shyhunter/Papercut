# CLAUDE.md — Papercut

Local desktop app for resizing and reformatting documents (PDF, images, DOCX).

## Project Rules

See `.claude/project_rules_decisions.md` for all architectural decisions and rules.

## Stack

- **App shell:** Tauri + TypeScript + React
- **Image processing:** Sharp
- **PDF processing:** pdf-lib
- **DOCX processing:** docx (JS library)

## QA Rules (enforced — do not skip)

**Always read `.claude/project_rules_decisions.md` before starting work.** Key rules P007–P010 apply to every change:

- **P007 — Committed fixtures:** Any new processing pipeline must have a real binary fixture in `test-fixtures/` (not synthetic stubs). Generate with the Rust binary: `cargo run --manifest-path tools/generate-fixtures/Cargo.toml`.
- **P008 — Parallel TEST_PLAN.md entries:** When adding a test, add its ID to the "Automated vs Manual" table in `.planning/TEST_PLAN.md`.
- **P009 — Bug-to-test:** Every bug fix must ship with a regression test that would have caught the original failure.
- **P010 — TDD:** Write the failing test FIRST, confirm it is red, then implement the fix. Commit both together.

Fixture files: `test-fixtures/sample.jpg`, `sample.png`, `sample.pdf` — committed real binary files used by automated tests.

## GSD Workflow (Pragmatic Mode)

This project uses GSD for planning. The rule is:
1. Run `/gsd:discuss-phase` to capture preferences
2. Run `/gsd:plan-phase` to generate task plans
3. **Review the plan before executing** — never run `/gsd:execute-phase` without reading the plan first
4. Run `/gsd:execute-phase` only after approval

Do NOT run in `yolo` mode on this project.

## Global Rules

See `~/.claude/rules.md` for global rules that apply to all sessions.

<!-- ============ SECURITY BASELINE (inserted by scaffold-project.sh) ============ -->
## Security Baseline

This project inherits the global security baseline (see `~/.claude/rules.md` rules **R005–R016** and `~/.claude/CLAUDE.md` → "Security Baseline"). Always-on Claude Code hooks (`~/.claude/hooks/security/`) enforce:

- **Hard-blocked:** hardcoded secrets in writes (OpenAI/Anthropic/Stripe/AWS/GH/Slack/Google keys, JWTs, private keys, DB URLs with creds); dangerous bash (`git add .env`, `cat .env`, `curl|sh`, `chmod 777 /…`).
- **Warned:** heuristic credential patterns; force-push to `main`; `--no-verify`; missing `.gitignore` env coverage.

Project-specific security rules live in `.claude/project_rules_decisions.md` under the `Security` category.

Every code/architecture proposal in this project must end with a `**Security notes**` block (R015): where secrets live, how auth/permissions are enforced, remaining risks.
<!-- ========================================================================== -->
