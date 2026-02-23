# Verification Plan: AIE Quiz App

## Testing Stack

| Tool | Purpose |
|---|---|
| **Playwright** | End-to-end tests: full user flows across presenter + participant views |
| **React Testing Library** (via Vitest) | Component tests: individual UI components in isolation |
| **Vitest** | Test runner for component tests (faster than Jest with Next.js) |

## General Principles

- **No implementation details**: Never test internal state, hook calls, or component internals. Test what the user sees and does.
- **Accessible names first**: Query by role + accessible name (`getByRole("button", { name: "Submit" })`). This also validates accessibility.
- **Test IDs as fallback**: Only use `data-testid` when no accessible name exists (e.g., the timer display, score counters).
- **Functional assertions**: Assert on visible text, element presence, and user-observable behavior — not class names, styles, or DOM structure.
- **All tests run locally**: Playwright tests run against `next dev` + `npx partykit dev` on localhost. No production dependency.

## Component Tests (React Testing Library + Vitest)

Test each component in isolation by rendering it with props and asserting on output.

### Participant Components

**NameEntry**
- Renders an input field and submit button
- Submit button is disabled when input is empty
- Calls onSubmit with the entered name when submitted

**SingleChoice**
- Renders all options as buttons
- Clicking an option selects it (visually indicated)
- Clicking "Submit" calls onSubmit with the selected option index
- Cannot submit without selecting an option

**MultiChoice**
- Renders all options as checkboxes
- Multiple options can be toggled
- Calls onSubmit with array of selected indices
- Cannot submit without selecting at least one option

**LogSlider**
- Renders a slider input
- Displays the current value formatted readably (e.g., "1.8M" not "1800000")
- Calls onSubmit with the numeric value

**RankingDnd**
- Renders all items in a list
- (DnD interaction is tested in E2E, not here — RTL doesn't simulate touch drag well)
- Calls onSubmit with the ordered array of indices

**AnswerSubmitted**
- Shows confirmation message ("Answer submitted!")
- Displays points earned when results are revealed

### Presenter Components

**Lobby**
- Renders QR code image
- Renders the 4-digit room code
- Renders each participant name as they're passed in props

**QuestionDisplay**
- Renders question text and all options
- Renders answer count (e.g., "12 / 30 answered")
- Renders timer component

**AnswerDistribution**
- Renders a bar for each option
- Correct answer bar is visually distinct (test via accessible label, e.g., "Option B (correct): 15 answers")
- Bar widths are proportional to counts

**Leaderboard**
- Renders participants sorted by score descending
- Shows rank, name, and cumulative score for each entry

**Podium**
- Initially shows no names revealed
- After each reveal step, shows the next place (3rd, then 2nd, then 1st)

### Shared Components

**Timer**
- Displays remaining time from an endTime timestamp
- Shows "0:00" when time is up (mock `Date.now()` to simulate)

### Scoring Functions (pure unit tests)

**scoreSingleChoice**
- Returns 1000 for instant correct answer
- Returns 500 for correct answer at the deadline
- Returns 0 for incorrect answer

**scoreMultiChoice**
- Full credit (speed-adjusted) for selecting exactly the correct set
- Partial credit for partially correct selections
- Deducts for incorrect selections (but floors at 0)

**scoreSlider**
- Returns 1000 for perfect guess
- Returns 0 for guess at opposite end of log range
- Returns same score for two equidistant guesses (symmetry)
- Handles edge: guess equals min or max boundary

**scoreRanking**
- Returns 1000 for perfect order, instant submit
- Returns 875 for perfect order, last-second submit
- Returns 0 for fully reversed order
- Handles N=2 items (binary: 1000 or 0 + speed)

## End-to-End Tests (Playwright)

Each E2E test spins up the full app (Next.js + PartyKit) and uses multiple browser contexts to simulate presenter + participants.

### Test Setup

```
- beforeAll: start `next dev` and `npx partykit dev` (or use a test script that starts both)
- Each test: create a fresh room with a unique 4-digit code
- Use two browser contexts: one for presenter, one (or more) for participant
- afterAll: shut down dev servers
```

### Scenario 1: Join Flow

1. Presenter opens `/present/1234`
2. Verify QR code and room code "1234" are visible
3. Participant opens `/play/1234`
4. Participant enters name "Alice" and submits
5. Verify "Alice" appears on the presenter view

### Scenario 2: Join via Landing Page

1. Participant opens `/`
2. Participant types "1234" in the code input
3. Participant is navigated to `/play/1234`

### Scenario 3: Single Choice Question — Full Round

1. Presenter starts quiz
2. Both views show the question text and options
3. Both views show a countdown timer
4. Participant clicks an answer option and submits
5. Presenter view shows answer count incremented (e.g., "1 / 1 answered")
6. Timer expires (use clock manipulation to speed this up)
7. Presenter view shows answer distribution with correct answer highlighted
8. Participant view shows whether they were correct and points earned

### Scenario 4: Multi Choice Question — Partial Credit

1. Question with 3 correct options out of 5
2. Participant selects 2 correct and 1 incorrect
3. After round ends, participant sees partial points (not 0, not full)

### Scenario 5: Slider Question

1. Participant adjusts slider and submits
2. After round ends, score reflects proximity to correct answer on log scale
3. Presenter view shows distribution of guesses

### Scenario 6: Ranking Question (Mobile Touch)

1. Configure Playwright to emulate a mobile device
2. Participant reorders items by dragging
3. Submit the ranking
4. After round ends, score reflects pairwise accuracy

### Scenario 7: Leaderboard Progression

1. Run 2 questions with 2 participants answering at different speeds
2. After each question, presenter shows leaderboard
3. Verify scores accumulate correctly
4. Verify ordering is by cumulative score descending

### Scenario 8: Final Podium

1. Complete all questions in a short quiz (2 questions)
2. Presenter clicks "Show Podium"
3. Verify 3rd place is revealed first, then 2nd, then 1st
4. Each reveal shows the correct participant name and score

### Scenario 9: Timer Enforcement

1. Start a question with a short timer (e.g., 5 seconds)
2. Do NOT submit an answer
3. Timer expires
4. Verify participant cannot submit after expiry
5. Verify participant receives 0 points

### Scenario 10: Synchronized State

1. Presenter and 2 participants are connected
2. Presenter advances to question
3. Both participants see the question at the same time (within test tolerance)
4. Both see the same timer value (within 1 second tolerance)

## File Structure for Tests

```
/
├── __tests__/
│   ├── components/
│   │   ├── participant/
│   │   │   ├── NameEntry.test.tsx
│   │   │   ├── SingleChoice.test.tsx
│   │   │   ├── MultiChoice.test.tsx
│   │   │   ├── LogSlider.test.tsx
│   │   │   └── RankingDnd.test.tsx
│   │   ├── presenter/
│   │   │   ├── Lobby.test.tsx
│   │   │   ├── QuestionDisplay.test.tsx
│   │   │   ├── AnswerDistribution.test.tsx
│   │   │   ├── Leaderboard.test.tsx
│   │   │   └── Podium.test.tsx
│   │   └── shared/
│   │       └── Timer.test.tsx
│   └── lib/
│       └── scoring.test.ts
├── e2e/
│   ├── join-flow.spec.ts
│   ├── single-choice.spec.ts
│   ├── multi-choice.spec.ts
│   ├── slider.spec.ts
│   ├── ranking.spec.ts
│   ├── leaderboard.spec.ts
│   ├── podium.spec.ts
│   ├── timer-enforcement.spec.ts
│   └── sync.spec.ts
├── playwright.config.ts
└── vitest.config.ts
```

## Running Tests Locally

```bash
# Component tests
npx vitest

# E2E tests (starts dev servers automatically via Playwright webServer config)
npx playwright test

# E2E with UI mode for debugging
npx playwright test --ui
```

### Playwright Config Highlights

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: [
    {
      command: "npm run dev",          // starts next dev
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: "npx partykit dev",     // starts partykit dev
      port: 1999,
      reuseExistingServer: true,
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
});
```
