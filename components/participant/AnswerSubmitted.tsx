interface AnswerSubmittedProps {
  result?: {
    outcome: "correct" | "partial" | "wrong";
    pointsEarned: number;
    newTotal: number;
    correctAnswer?: string;
    yourAnswer?: string;
  };
}

export default function AnswerSubmitted({ result }: AnswerSubmittedProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl">✓</div>
        <p className="text-xl font-semibold">Answer submitted!</p>
        <p className="text-gray-400">Waiting for results...</p>
      </div>
    );
  }

  const emoji =
    result.outcome === "correct"
      ? "🎉"
      : result.outcome === "partial"
        ? "🧐"
        : "😔";

  const label =
    result.outcome === "correct" ? "Correct!" :
    result.outcome === "partial" ? "Almost!" : "Not quite!";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-6xl">{emoji}</div>
      <p className="text-2xl font-bold">{label}</p>
      <p className="text-4xl font-bold text-yellow-400">
        +{result.pointsEarned}
      </p>
      {result.yourAnswer && (
        <p className="text-center text-gray-300">
          Your answer: <span className="font-semibold text-white">{result.yourAnswer}</span>
        </p>
      )}
      {result.correctAnswer && (
        <p className="text-center text-gray-300">
          Correct answer: <span className="font-semibold text-green-400">{result.correctAnswer}</span>
        </p>
      )}
      <p className="text-gray-400">
        Total: {result.newTotal} points
      </p>
    </div>
  );
}
