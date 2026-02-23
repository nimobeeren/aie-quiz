# Implementation Plan: AIE Quiz App

## Context

We're building a Kahoot-style real-time quiz app for a one-time AI Engineering quiz with ~50 participants. The presenter shows questions on a big screen; participants answer on their phones. The app needs synchronized timers, real-time answer tracking, speed-based scoring, and a leaderboard. Requirements are tracked in `/prd.json`.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, TypeScript) | PRD requirement (D1) |
| Real-time | **PartyKit** (`partykit` + `partysocket`) | Purpose-built for room-based real-time. Each quiz session = a PartyKit room. Handles WebSocket connections, broadcasting, and connection tagging (presenter vs participant). Deploys to Cloudflare edge with `npx partykit deploy`. |
| Database | **PartyKit built-in storage** | Each room has a persistent key-value store (backed by Durable Objects). No separate DB service needed. Sufficient for <50 participants. Satisfies D3. |
| Styling | **Tailwind CSS v4** | Ships with Next.js, fast iteration |
| Drag & drop | **@dnd-kit/core** + **@dnd-kit/sortable** | Best touch/mobile support, actively maintained, composable |
| QR codes | **qrcode** (npm) | Generate QR code for join URL |
| Package manager | **pnpm** | Fast, disk-efficient. Use for all dependency operations. |

### Deployment (D4)

Two separate deploys:
1. **Next.js app** → any hosting (Vercel, Netlify, etc.) — serves the UI
2. **PartyKit server** → `npx partykit deploy` — handles all real-time logic

Environment variable `NEXT_PUBLIC_PARTYKIT_HOST` points the client at the PartyKit server.

---

## File Structure

```
/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, global styles
│   ├── page.tsx                      # Landing: enter 4-digit code (J2)
│   ├── play/[roomId]/page.tsx        # Participant view (client component)
│   └── present/[roomId]/page.tsx     # Presenter view (client component)
├── components/
│   ├── participant/
│   │   ├── NameEntry.tsx             # Name input form (J3)
│   │   ├── WaitingScreen.tsx         # "Waiting for next question"
│   │   ├── SingleChoice.tsx          # Radio buttons (Q2)
│   │   ├── MultiChoice.tsx           # Checkboxes (Q3)
│   │   ├── LogSlider.tsx             # Log-scale slider (Q4)
│   │   ├── RankingDnd.tsx            # Drag-and-drop ranking (Q5)
│   │   └── AnswerSubmitted.tsx       # Confirmation after submitting
│   ├── presenter/
│   │   ├── Lobby.tsx                 # QR code + join code + participant names (J1, J4)
│   │   ├── QuestionDisplay.tsx       # Question + options + timer + answer count (P1, R3)
│   │   ├── AnswerDistribution.tsx    # Bar chart of answers after round (P2)
│   │   ├── Leaderboard.tsx           # Scores between questions (P3)
│   │   └── Podium.tsx               # Final 3-2-1 reveal (P4)
│   └── shared/
│       ├── Timer.tsx                 # Countdown timer (Q6, R2)
│       └── QuestionHeader.tsx        # Question text + number
├── party/
│   └── quiz.ts                       # PartyKit server — all game logic
├── lib/
│   ├── types.ts                      # Shared types (question, game state, messages)
│   ├── scoring.ts                    # Scoring functions (S1, S2, S3)
│   └── questions.ts                  # Question loading + validation
├── data/
│   └── questions.json                # Quiz content (Q1)
├── partykit.json                     # PartyKit config
├── prd.json                          # Requirements tracker
└── package.json
```

---

## Question JSON Schema (Q1)

`data/questions.json`:

```jsonc
{
  "questions": [
    {
      "type": "single",           // Q2
      "question": "Which model architecture does GPT use?",
      "options": ["RNN", "Transformer", "CNN", "LSTM"],
      "correctAnswer": 1,         // index into options
      "timerSeconds": 30
    },
    {
      "type": "multi",            // Q3
      "question": "Which are valid LLM prompting techniques?",
      "options": ["Chain-of-thought", "Backpropagation", "Few-shot", "Gradient descent"],
      "correctAnswers": [0, 2],   // indices into options
      "timerSeconds": 30
    },
    {
      "type": "slider",           // Q4
      "question": "How many parameters does GPT-4 have (estimated)?",
      "min": 1000000,             // 1M
      "max": 100000000000000,     // 100T
      "correctAnswer": 1800000000000, // 1.8T
      "timerSeconds": 30
    },
    {
      "type": "ranking",          // Q5
      "question": "Rank these models by release date (earliest first)",
      "options": ["GPT-4", "BERT", "GPT-3", "ChatGPT"],
      "correctOrder": [1, 2, 3, 0], // indices: BERT, GPT-3, ChatGPT, GPT-4
      "timerSeconds": 45
    }
  ]
}
```

---

## Game State Machine

The PartyKit server manages a state machine with these phases:

```
LOBBY → QUESTION → RESULTS → LEADERBOARD → QUESTION → ... → LEADERBOARD → PODIUM → FINISHED
                                                ^                   |
                                                |___________________|
                                                  (repeat per question)
```

| Phase | Presenter sees | Participant sees | Triggered by |
|---|---|---|---|
| `lobby` | QR code, join code, participant names | Name entry form | Session creation |
| `question` | Question, options, timer, answer count | Question, options, timer, submit UI | Presenter clicks "Start" / "Next" |
| `results` | Answer distribution, correct answer highlighted | Their own result (correct/wrong, points earned) | Timer expires |
| `leaderboard` | Top scores with cumulative points | Their rank and score | Presenter clicks "Leaderboard" |
| `podium` | Animated 3→2→1 reveal | Their final rank | Presenter clicks "Show podium" (after last question) |
| `finished` | Final standings | "Thanks for playing" | Podium animation completes |

---

## Real-time Protocol

### Server State (held in memory + PartyKit storage)

```typescript
interface GameState {
  phase: "lobby" | "question" | "results" | "leaderboard" | "podium" | "finished";
  currentQuestionIndex: number;
  endTime: number | null;          // Unix timestamp (ms) when timer expires
  participants: Map<string, Participant>;
  answerCount: number;             // live count for current question
  revealedPodiumPlace: number;     // 3, 2, 1, 0 for podium animation
}

interface Participant {
  id: string;
  name: string;
  score: number;                   // cumulative
  answers: Answer[];               // one per completed question
}
```

### Messages: Client → Server

| Message | Payload | Who sends |
|---|---|---|
| `join` | `{ name: string }` | Participant |
| `submit_answer` | `{ answer: number \| number[] \| number, timestamp: number }` | Participant |
| `presenter_action` | `{ action: "start" \| "next" \| "show_results" \| "show_leaderboard" \| "show_podium" \| "reveal_next" }` | Presenter |

### Messages: Server → Client

The server broadcasts the full relevant state on every change. Two different payloads depending on the connection tag:

**To presenter:**
```typescript
{
  phase, currentQuestionIndex, endTime, answerCount,
  participants: [{ name, score }],              // always
  question: { ... },                             // during question/results
  results: { distribution, correctAnswer },      // during results
  leaderboard: [{ name, score, rank }],          // during leaderboard
  podium: { third, second, first, revealed },    // during podium
}
```

**To participants:**
```typescript
{
  phase, currentQuestionIndex, endTime,
  question: { type, question, options },         // during question (no correct answer!)
  myResult: { correct, pointsEarned, newTotal }, // during results
  myRank: number,                                // during leaderboard
  leaderboard: [{ name, score, rank }],          // during leaderboard (top 5 only)
}
```

### Connection Tagging

Presenter connects with `?role=presenter`; participants with `?role=participant`. The PartyKit server uses `getConnectionTags()` to tag connections, then uses `this.room.getConnections("presenter")` and `this.room.getConnections("participant")` to send different payloads.

---

## Scoring Formulas

### Multiple Choice — Single & Multi (S1)

```
score = floor((1 - (responseTime / timerDuration) / 2) * 1000)
```

- Range: 500 (answered at last second) to 1000 (instant answer)
- Wrong answer or no answer: 0
- For multi-answer: must select exactly the correct set (no partial credit)

### Slider — Log-Scale Proximity (S2)

```
error = |log10(guess) - log10(correct)|
range = log10(max) - log10(min)
score = round(1000 * max(0, 1 - error / range))
```

- Perfect guess: 1000
- Off by the full log range: 0
- No speed component (slider positioning is inherently slow)
- Ties get equal points naturally

Note: This is absolute scoring — if nobody guesses correctly, nobody gets 1000. This is intentional for a knowledge-based quiz.

### Ranking — Pairwise Partial Credit (S3)

Uses Kendall tau concordance (counts correctly-ordered pairs rather than exact positions):

```
concordant_pairs = count of (i,j) pairs where relative order matches correct order
total_pairs = N * (N - 1) / 2
accuracy = concordant_pairs / total_pairs
speed_multiplier = 1 - (responseTime / timerDuration) / 2    // 0.5 to 1.0
score = round(accuracy * (0.75 + 0.25 * speed_multiplier) * 1000)
```

- Perfect order, instant: 1000
- Perfect order, last second: 875
- Speed matters less than accuracy (75/25 split)

All scoring is computed server-side after the timer expires, using `lib/scoring.ts`.

---

## Synchronized Timer (R2)

1. When the presenter advances to a question, the server computes `endTime = Date.now() + timerSeconds * 1000`
2. `endTime` is broadcast to all clients as a Unix timestamp
3. Each client runs a local countdown: `remaining = endTime - Date.now()`
4. The server ignores answers received after `endTime` (server-authoritative)
5. When the server's clock hits `endTime`, it transitions to `results` phase and broadcasts

This approach tolerates clock drift because:
- The *display* timer may be off by a few hundred ms per client (acceptable)
- The *deadline* is enforced server-side, so no one gets extra time

---

## Key Implementation Details

### Room Creation & Join Flow (J1, J2)

1. Presenter navigates to `/present/XXXX` (4-digit code, either chosen or random)
2. This creates a PartyKit room with ID = the 4-digit code
3. The presenter view shows a QR code pointing to `https://<domain>/play/XXXX`
4. Participants either scan the QR code or go to `/` and type the code
5. Both routes connect to the same PartyKit room

### Presenter Controls

The presenter view has simple buttons that send `presenter_action` messages:
- **Lobby**: "Start Quiz" → transitions to first question
- **Question**: no controls needed (timer auto-advances to results)
- **Results**: "Show Leaderboard" → transitions to leaderboard
- **Leaderboard**: "Next Question" / "Show Podium" (if last question)
- **Podium**: "Reveal Next" (clicks 3 times: 3rd → 2nd → 1st)

### Mobile Drag-and-Drop (Q5)

Using `@dnd-kit/core` + `@dnd-kit/sortable` with:
- `TouchSensor` and `KeyboardSensor` for mobile
- Large touch targets (min 48px height)
- Visual drag handle indicators
- `restrictToVerticalAxis` modifier for clean dragging

### Answer Distribution Visualization (P2)

- **Single/Multi choice**: Horizontal bar chart, one bar per option, correct answer highlighted in green
- **Slider**: Dot plot or histogram on the log scale, correct value marked
- **Ranking**: Show correct order, percentage of participants who got each position right

---

## Implementation Phases

### Phase 1: Foundation (D1, D2, D3, Q1)
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up PartyKit server with basic room creation
3. Define shared types (`lib/types.ts`)
4. Create question JSON schema and sample data (`data/questions.json`)
5. Implement question loading (`lib/questions.ts`)
6. Wire up `partysocket` client connection in both routes

### Phase 2: Join Flow (J1, J2, J3, J4)
1. Build landing page with code entry form (`app/page.tsx`)
2. Build presenter lobby with QR code + participant list (`Lobby.tsx`)
3. Build participant name entry (`NameEntry.tsx`)
4. Implement join protocol in PartyKit server

### Phase 3: Game Loop & Question Types (Q2–Q6, R1, R2, R3, P1, M1)
1. Implement state machine in PartyKit server (`party/quiz.ts`)
2. Build synchronized timer component (`Timer.tsx`)
3. Build all four question type components (SingleChoice, MultiChoice, LogSlider, RankingDnd)
4. Implement answer submission and live count
5. Implement presenter question display with answer count

### Phase 4: Scoring & Results (S1, S2, S3, P2)
1. Implement scoring functions (`lib/scoring.ts`)
2. Wire scoring into the PartyKit server (compute after timer expires)
3. Build answer distribution component (`AnswerDistribution.tsx`)
4. Show per-participant results (correct/wrong + points)

### Phase 5: Leaderboard & Podium (P3, P4)
1. Build leaderboard component with cumulative scores
2. Build podium component with staggered reveal animation
3. Wire presenter controls for the full flow

### Phase 6: Polish & Deploy (M2, D4)
1. Mobile-first responsive pass on all participant components
2. Visual polish (colors, animations, transitions)
3. Deploy PartyKit server (`npx partykit deploy`)
4. Deploy Next.js app
5. End-to-end test with multiple devices
