# AIE Quiz App

Real-time quiz app for AI Engineering trivia. A presenter shows questions on a big screen; participants answer on their phones.

## Tech Stack

- **Next.js 15** (App Router, TypeScript) — UI
- **PartyKit** — real-time WebSocket server (one room per quiz session)
- **Tailwind CSS v4** — styling
- **pnpm** — package manager

## Setup

```bash
pnpm install
```

## Development

```bash
# Start Next.js dev server
pnpm dev

# Start PartyKit dev server (in a separate terminal)
npx partykit dev
```

## Testing

```bash
# Component tests (Vitest + React Testing Library)
pnpm test

# E2E tests (Playwright — starts dev servers automatically)
pnpm test:e2e
```
