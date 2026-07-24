# Agent guidance (OpenSpec)

This repo uses **OpenSpec** for non-trivial feature work.

## Before coding a real feature

1. Prefer `/opsx:explore` if the area is unfamiliar.
2. Run `/opsx:propose <kebab-case-name>` and wait for human review of:
   - `openspec/changes/<name>/proposal.md`
   - `openspec/changes/<name>/design.md`
   - `openspec/changes/<name>/specs/**`
   - `openspec/changes/<name>/tasks.md`
3. Implement with `/opsx:apply` (or follow `tasks.md` checkboxes).
4. Finish with `/opsx:archive` so deltas merge into `openspec/specs/`.

Tiny fixes (typos, one-line CSS, obvious bugs) do **not** need a full OpenSpec change unless the user asks.

## Project facts

- Main app: `task-planner/` (Express + SQLite backend, React/Vite frontend).
- Project OpenSpec config: `openspec/config.yaml` (stack, domains, rules).
- CLI: `openspec` (`@fission-ai/openspec`). Cursor skills live under `.cursor/skills/openspec-*`.

## Spec growth policy

Do not back-fill specs for untouched code. Specs accumulate from archived changes only.
