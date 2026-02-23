# Feature Implementation Skill

Implements a single requirement from `prd.json` in an isolated git worktree.

You will be given a requirement ID (e.g., "D1") and its description.

## Steps

### 1. Read Context

```
Read: scratchpad.md
Read: implementation_plan.md
Read: prd.json (find your requirement by ID)
```

Understand the architecture, where your code fits, and what other agents have noted.

### 2. Set Up Worktree

Run from the project root:

```bash
scripts/setup-worktree.sh <requirement-id>
```

This creates branch `feature/<id>`, worktree at `.worktrees/<id>`, copies env files, and runs `pnpm install`.

**From this point, do ALL work inside `.worktrees/<id>/`.**

### 3. Implement

- Follow the file structure and patterns from `implementation_plan.md`.
- Write tests that match what `verification_plan.md` specifies for the components you touch.
- Run tests frequently: `cd .worktrees/<id> && pnpm test --run`

### 4. Mark Requirement Complete

Edit `prd.json` in your worktree. Set `"complete": true` for your requirement.

### 5. Update README

If you introduced new commands, setup steps, or dependencies, add them to `README.md`.

### 6. Commit and Push

```bash
cd .worktrees/<id>
git add -A
git commit -m "feat(<id>): <short description>"
git push -u origin feature/<id>
```

### 7. Report Back

In your final response to the main agent, include:

- What you implemented (brief).
- Anything that deviated from the plan.
- Anything other agents should know about (the main agent will decide whether to add it to the scratchpad).
