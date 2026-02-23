"use client";

import { useState } from "react";

interface SingleChoiceProps {
  question: string;
  options: string[];
  onSubmit: (selected: number) => void;
}

const OPTION_COLORS = [
  "bg-red-600 hover:bg-red-500",
  "bg-blue-600 hover:bg-blue-500",
  "bg-green-600 hover:bg-green-500",
  "bg-yellow-600 hover:bg-yellow-500",
];

export default function SingleChoice({ question, options, onSubmit }: SingleChoiceProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(index: number) {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(index);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-white">
        <p className="text-2xl font-bold">Answer submitted!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-white">
      {question && <p className="text-xl font-bold">{question}</p>}
      <ul className="flex flex-col gap-3">
        {options.map((option, index) => (
          <li key={index}>
            <button
              onClick={() => handleSelect(index)}
              className={`w-full min-h-12 rounded-lg px-4 py-3 text-left text-lg font-semibold transition ${OPTION_COLORS[index % OPTION_COLORS.length]}`}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
