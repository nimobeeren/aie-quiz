"use client";

import type { Question } from "@/lib/types";
import Timer from "@/components/shared/Timer";
import QuestionHeader from "@/components/shared/QuestionHeader";

const OPTION_COLORS = [
  "bg-red-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-yellow-600",
];

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  endTime: number | null;
  answerCount: number;
  totalParticipants: number;
}

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  endTime,
  answerCount,
  totalParticipants,
}: QuestionDisplayProps) {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <Timer endTime={endTime} />

      <QuestionHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        question={question.question}
      />

      {"options" in question && question.options && (
        <div className="grid w-full grid-cols-2 gap-4">
          {question.options.map((option, i) => (
            <div
              key={i}
              className={`${OPTION_COLORS[i % OPTION_COLORS.length]} rounded-lg px-6 py-4 text-center text-lg font-semibold`}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {question.type === "slider" && (
        <div className="text-center text-gray-400">
          <p>Participants are positioning their sliders...</p>
        </div>
      )}

      <p
        className="text-lg text-gray-400"
        data-testid="answer-count"
      >
        {answerCount} / {totalParticipants} answered
      </p>
    </div>
  );
}
