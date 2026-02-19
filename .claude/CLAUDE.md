# CLAUDE.md — Papercut

Local desktop app for resizing and reformatting documents (PDF, images, DOCX).

## Project Rules

See `.claude/project_rules_decisions.md` for all architectural decisions and rules.

## Stack

- **App shell:** Tauri + TypeScript + React
- **Image processing:** Sharp
- **PDF processing:** pdf-lib
- **DOCX processing:** docx (JS library)

## GSD Workflow (Pragmatic Mode)

This project uses GSD for planning. The rule is:
1. Run `/gsd:discuss-phase` to capture preferences
2. Run `/gsd:plan-phase` to generate task plans
3. **Review the plan before executing** — never run `/gsd:execute-phase` without reading the plan first
4. Run `/gsd:execute-phase` only after approval

Do NOT run in `yolo` mode on this project.

## Global Rules

See `~/.claude/rules.md` for global rules that apply to all sessions.
