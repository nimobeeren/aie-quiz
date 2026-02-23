# Scratchpad

Shared notes for all agents. **Only the main (orchestrator) agent writes here.**

Sub-agents: read this before starting work. If you discover something important, report it back to the main agent — don't edit this file directly.

---

## Implementation Notes

- **PartyKit API**: `conn.tags` is not available on `Connection` type — use `ctx.request.url` to read query params instead.
- **PartyKit `getConnectionTags`**: Must return `string[]`, not `string[] | undefined`.
- **Next.js 16 params**: Route params are now `Promise<{ ... }>` — use `use(params)` to unwrap.
- **Deployment**: PartyKit deploys separately via `npx partykit deploy`. Next.js app needs `NEXT_PUBLIC_PARTYKIT_HOST` env var pointing to the PartyKit URL.
- **All 26 requirements implemented** in a single pass across 6 phases.
