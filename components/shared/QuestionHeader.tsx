interface QuestionHeaderProps {
  questionNumber: number;
  totalQuestions?: number;
  question: string;
}

export default function QuestionHeader({
  questionNumber,
  totalQuestions,
  question,
}: QuestionHeaderProps) {
  return (
    <div className="mb-6 text-center">
      <p className="mb-2 text-sm font-medium text-gray-400">
        Question {questionNumber}
        {totalQuestions ? ` of ${totalQuestions}` : ""}
      </p>
      <h2 className="text-2xl font-bold md:text-3xl">{question}</h2>
    </div>
  );
}
