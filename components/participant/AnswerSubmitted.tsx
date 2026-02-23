interface AnswerSubmittedProps {
  result?: {
    correct: boolean;
    pointsEarned: number;
    newTotal: number;
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-6xl">{result.correct ? "🎉" : "😔"}</div>
      <p className="text-2xl font-bold">
        {result.correct ? "Correct!" : "Wrong!"}
      </p>
      <p className="text-4xl font-bold text-yellow-400">
        +{result.pointsEarned}
      </p>
      <p className="text-gray-400">
        Total: {result.newTotal} points
      </p>
    </div>
  );
}
