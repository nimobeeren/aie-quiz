/**
 * Score a single-choice or multi-choice answer.
 * score = floor((1 - (responseTime / timerDuration) / 2) * 1000)
 * Range: 500 (last second) to 1000 (instant). Wrong = 0.
 */
export function scoreSingleChoice(
  selected: number,
  correct: number,
  responseTimeMs: number,
  timerDurationMs: number
): number {
  if (selected !== correct) return 0;
  return speedScore(responseTimeMs, timerDurationMs);
}

/**
 * Multi-choice: must select exactly the correct set. No partial credit.
 */
export function scoreMultiChoice(
  selected: number[],
  correct: number[],
  responseTimeMs: number,
  timerDurationMs: number
): number {
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  if (selectedSet.size !== correctSet.size) return 0;
  for (const v of correctSet) {
    if (!selectedSet.has(v)) return 0;
  }
  return speedScore(responseTimeMs, timerDurationMs);
}

/**
 * Slider: log-scale proximity scoring.
 * error = |log10(guess) - log10(correct)|
 * range = log10(max) - log10(min)
 * score = round(1000 * max(0, 1 - error / range))
 */
export function scoreSlider(
  guess: number,
  correct: number,
  min: number,
  max: number
): number {
  if (guess <= 0 || correct <= 0 || min <= 0 || max <= 0) return 0;
  const error = Math.abs(Math.log10(guess) - Math.log10(correct));
  const range = Math.log10(max) - Math.log10(min);
  if (range <= 0) return 0;
  return Math.round(1000 * Math.max(0, 1 - error / range));
}

/**
 * Ranking: Kendall tau concordance with speed multiplier.
 * concordant_pairs = count of (i,j) pairs where relative order matches correct order
 * accuracy = concordant_pairs / total_pairs
 * speed_multiplier = 1 - (responseTime / timerDuration) / 2
 * score = round(accuracy * (0.75 + 0.25 * speed_multiplier) * 1000)
 */
export function scoreRanking(
  submitted: number[],
  correct: number[],
  responseTimeMs: number,
  timerDurationMs: number
): number {
  const n = correct.length;
  if (n < 2) return 1000;

  // Build position maps
  const correctPos = new Map<number, number>();
  const submittedPos = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    correctPos.set(correct[i], i);
    submittedPos.set(submitted[i], i);
  }

  let concordant = 0;
  const totalPairs = (n * (n - 1)) / 2;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ci = correctPos.get(correct[i])!;
      const cj = correctPos.get(correct[j])!;
      const si = submittedPos.get(correct[i])!;
      const sj = submittedPos.get(correct[j])!;
      if ((ci - cj) * (si - sj) > 0) {
        concordant++;
      }
    }
  }

  const accuracy = concordant / totalPairs;
  const speedMultiplier = 1 - responseTimeMs / timerDurationMs / 2;
  return Math.round(accuracy * (0.75 + 0.25 * speedMultiplier) * 1000);
}

function speedScore(responseTimeMs: number, timerDurationMs: number): number {
  const ratio = Math.min(1, Math.max(0, responseTimeMs / timerDurationMs));
  return Math.floor((1 - ratio / 2) * 1000);
}
