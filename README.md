# AIE Quiz App

Real-time Kahoot-style quiz app for AI Engineering trivia. A presenter shows questions on a big screen; ~50 participants answer on their phones.

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — UI
- **PartyKit** — real-time WebSocket server (one room per quiz session)
- **Tailwind CSS v4** — styling
- **@dnd-kit** — drag-and-drop for ranking questions
- **pnpm** — package manager

## Setup

```bash
pnpm install
cp .env.example .env.local
```

## Development

Run both servers (in separate terminals):

```bash
# Next.js dev server (port 3000)
pnpm dev

# PartyKit dev server (port 1999)
npx partykit dev
```

Then open:
- **Presenter view**: http://localhost:3000/present/1234 (any 4-digit code)
- **Participant view**: http://localhost:3000/play/1234 (same code)
- **Join page**: http://localhost:3000 (enter the code)

## How It Works

1. Presenter opens `/present/XXXX` — shows QR code and room code
2. Participants scan QR or enter code at the root URL
3. Participants enter their name
4. Presenter clicks "Start Quiz"
5. Questions cycle through: question → results → leaderboard
6. After the last question, a podium reveals 3rd, 2nd, 1st place

## Question Types

Edit `data/questions.json` to customize:

- **single** — Multiple choice, one correct answer
- **multi** — Multiple choice, multiple correct answers
- **slider** — Log-scale number estimation
- **ranking** — Drag-and-drop ordering

## Deployment

Two separate deploys:

```bash
# 1. Deploy PartyKit server
npx partykit deploy

# 2. Deploy Next.js app (Vercel, Netlify, etc.)
# Set NEXT_PUBLIC_PARTYKIT_HOST to your PartyKit URL
```

## Testing

```bash
# Component tests (Vitest + React Testing Library)
pnpm test

# E2E tests (Playwright — starts dev servers automatically)
pnpm test:e2e
```
