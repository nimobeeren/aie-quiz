# Post-Mortem: AIE Quiz App

**Date:** 2026-02-23
**Total active time:** ~2.5 hours (14:12 – 18:12 CET, excluding ~75 min idle)
**Result:** Fully functional Kahoot-style quiz app, deployed and ready for ~50 participants

---

## Timeline

### Phase 1 — Planning & PRD (~50 min, 14:12–15:04)

Described the concept conversationally: a Kahoot-style quiz for an AI engineering session with ~50 phone-based participants. Iterated on scoring rules (log slider, partial credit for ranking, tie-breaking) through back-and-forth. Had Claude write everything into a structured `prd.json` with 26 requirements, each marked `complete: false`. Also produced an implementation plan and verification plan.

**Developer activity:** Mostly dictating requirements and reviewing generated docs. A few corrections (remove Vercel mention, adjust scoring edge cases).

### Phase 2 — Agent Infrastructure & Skills (~25 min, 15:04–15:29)

Set up the orchestration system: wrote CLAUDE.md instructions, created sub-agent "skills" (feature implementation + review), established the worktree-based workflow. Corrected file locations a couple of times when Claude put plans in the wrong directory. Added an explicit instruction for full autonomy ("don't pause to ask for input").

**Developer activity:** Directing file organization, writing the autonomy directive, fixing a skills formatting issue.

### Phase 3 — Harness Test (~9 min, 15:20–15:29)

Quick smoke test of the whole sub-agent pipeline: had Claude run a contrived feature + review cycle to verify worktrees, branching, and the review script worked end-to-end. Cleaned up manually afterward.

**Developer activity:** Single prompt to kick it off, then manual cleanup.

### Phase 4 — Full Build (~1h 15min, 15:29–15:45 build, then idle until 17:00)

One prompt: *"Go ahead and implement the entire app."* Claude orchestrated sub-agents across 6 phases, implementing all 26 requirements. The core build commits landed in ~15 minutes (15:29–15:45).

**Developer activity:** Single prompt to start. Queued a few mid-flight instructions ("use Sonnet for implementation, Opus for orchestration"). Killed a stray dev server at one point.

### Phase 5 — Playtesting & Polish (~1h 12min, 17:00–18:12)

The longest hands-on phase. Rapid-fire feedback loop: test on phone, send fix request, test again. ~20 incremental requests covering:

- UX wording ("not quite" instead of "wrong", "almost" for near-misses)
- Showing correct answers and participant's own answers on result screens
- Partial credit tuning (don't zero out multi-choice for one wrong answer)
- Suspense mechanics (hide podium data until revealed, skip last leaderboard)
- Content (pasted actual quiz questions, set timers to 20s)
- Deploy pipeline (Vercel CLI issues, deploy scripts, dev script improvements)
- Presenter view fixes (ranking/slider result displays)
- Auto-submit on timer expiry for all question types

**Developer activity:** This was almost entirely driven by live testing. Each fix was prompted by actually using the app. Feedback came in bursts, often queued while previous fixes were still being applied.

---

## What Went Well

- **One-shot build worked.** 26 requirements implemented in a single "go" prompt with sub-agents. The app was functional on first run.
- **Upfront planning paid off.** Detailed PRD with scoring formulas meant fewer ambiguities during implementation.
- **Queue as async feedback channel.** Typing corrections while the agent was still working kept things moving without blocking.
- **Agent infrastructure reuse.** The worktree + skills + review pipeline was a one-time ~25 min investment that made the build phase hands-off.

## What Could Be Better

- **Polish took longer than building.** The core build was ~15 min; the UX polish took ~75 min across ~20 prompts. Most of these were things that would've been obvious from a quick playtest — hard to specify upfront, but worth noting the ratio.
- **File organization friction.** Spent time in Phase 2 correcting where files were placed. A clearer convention upfront would have saved a few minutes.
- **Deploy wasn't smooth.** Hit Vercel CLI issues that required pasting error output and iterating. Could have been avoided with a tested deploy script in the plan.
- **No verification plan was actually used.** Wrote one, never ran it — the "test" was manual playtesting.

## By the Numbers

| Phase | Duration | Developer Prompts | Commits |
|-------|----------|-------------------|---------|
| Planning & PRD | ~50 min | ~12 | 1 |
| Agent infra & skills | ~25 min | ~9 | 2 |
| Harness test | ~9 min | ~2 | 1 |
| Full build | ~15 min active | ~2 | 6 |
| Polish & deploy | ~75 min | ~20 | 18 |
| **Total** | **~2.5 hours** | **~45** | **28** |
