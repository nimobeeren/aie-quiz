# AIE Quiz App

Real-time Kahoot-style quiz app. ~50 participants answer on phones while a presenter displays questions on a big screen.

## Autonomy

Work fully autonomously. Do NOT pause to ask the user for input or confirmation. You have full permissions to run any tools. Make decisions and keep moving.

## Before Starting ANY Work

Read these files first — every time, no exceptions:

1. **`scratchpad.md`** — notes from other agents. Check for gotchas and corrections.
2. **`implementation_plan.md`** — architecture, tech stack, file structure, scoring formulas, phases.
3. **`verification_plan.md`** — test strategy, component tests, E2E scenarios.

## Package Manager

**pnpm** — always. Never edit package.json or pnpm-lock.yaml directly. Use `pnpm add`, `pnpm remove`, etc.

## Roles

### Main Agent (Orchestrator)

You coordinate implementation. You are the only agent that writes to `scratchpad.md`.

1. Read `prd.json` for the full requirements list with completion status.
2. Follow implementation phases from `implementation_plan.md` — requirements within a phase can run in parallel, but don't start the next phase until the current one is done.
3. **Phase 1 is special**: it bootstraps the project (Next.js init, PartyKit setup, shared types). Do Phase 1 directly on `main` — no worktrees, no sub-agents. Worktrees depend on `package.json` existing, which Phase 1 creates. Commit Phase 1 to main before proceeding.
4. **To implement a requirement** (Phase 2+): read `.claude/skills/feature.md` and include its full contents in the sub-agent's Task prompt along with the requirement ID and description.
5. **To review a completed feature**: read `.claude/skills/review.md` and include its full contents in the sub-agent's Task prompt along with the requirement ID.
6. When a sub-agent reports back, evaluate whether its findings should go in `scratchpad.md`. Add only things other agents need to know (plan deviations, broken commands, API quirks). Keep it short.

### Feature Sub-Agent

You implement a single requirement in an isolated git worktree.

1. **Read `.claude/skills/feature.md` and follow it step by step.**
2. Work only in your worktree directory (`.worktrees/<id>/`), never the main tree.
3. Do NOT write to `scratchpad.md`. Instead, report findings back to the main agent in your final response.
4. You MAY update `README.md` with new commands or setup notes.

### Review Sub-Agent

You review a feature branch and merge it if it passes all checks.

1. **Read `.claude/skills/review.md` and follow it step by step.**
2. You MUST run `scripts/review-checks.sh <id>` before doing anything else. This is not optional.
3. Do NOT merge if any check fails. Fix issues first, then re-run checks.
4. Do NOT write to `scratchpad.md`. Report findings back to the main agent.

## Branch Naming

All feature branches: `feature/<requirement-id>` (e.g., `feature/D1`, `feature/Q2`)

## Code Conventions

- YAGNI. Actively remove code that no longer adds value after your changes.
- Fail fast. Raise errors, don't silently fall back.
- Don't add comments that only describe the current change.
- Keep existing comments that are still accurate.
- Maintain `README.md` — add setup steps, commands, or notes that other developers need.
