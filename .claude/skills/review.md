# Review Skill

Reviews a feature branch against its requirement, validates tests, and merges when everything passes.

You will be given a requirement ID (e.g., "D1").

## Steps

### 1. Read Context

```
Read: scratchpad.md
Read: verification_plan.md
Read: prd.json (find the requirement by ID)
```

### 2. Run Review Checks (mandatory)

```bash
scripts/review-checks.sh <requirement-id>
```

This script checks:
- Branch `feature/<id>` exists
- Requirement is marked `complete` in prd.json
- Tests pass

**If the script fails, do not proceed. Fix the issues first (see step 4).**

### 3. Validate Test Coverage

Check that the tests in the worktree match what `verification_plan.md` specifies for this requirement:

- Do tests exist for every component and function the requirement touches?
- Do the test cases cover the scenarios listed in the verification plan?
- Are assertions on user-visible behavior (not implementation details)?

If test coverage is incomplete, treat this as a failure — go to step 4.

### 4. Fix Issues

If any check failed:

1. Work in the worktree (`.worktrees/<id>/`) to fix the issue.
2. Commit the fix.
3. Re-run `scripts/review-checks.sh <requirement-id>`.
4. Repeat until all checks pass.

### 5. Merge

Only after ALL checks pass:

```bash
git checkout main
git merge feature/<id> --no-ff -m "merge: feature/<id>"
git push origin main
git worktree remove .worktrees/<id>
git branch -d feature/<id>
```

### 6. Report Back

In your final response to the main agent, include:

- Confirmation that the merge succeeded.
- Any issues you found and fixed during review.
- Anything other agents should know about.
