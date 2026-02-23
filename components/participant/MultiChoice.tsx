"use client";

import { useState, useEffect, useRef } from "react";

interface MultiChoiceProps {
  question: string;
  options: string[];
  endTime: number | null;
  onSubmit: (selected: number[]) => void;
}

const OPTION_COLORS = [
  "bg-red-600 hover:bg-red-500",
  "bg-blue-600 hover:bg-blue-500",
  "bg-green-600 hover:bg-green-500",
  "bg-yellow-600 hover:bg-yellow-500",
];

export default function MultiChoice({ question, options, endTime, onSubmit }: MultiChoiceProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (submitted) return;
    const indices = Array.from(selectedRef.current).sort((a, b) => a - b);
    if (indices.length === 0) return;
    setSubmitted(true);
    onSubmit(indices);
  }

  useEffect(() => {
    if (!endTime || submitted) return;
    const ms = endTime - Date.now();
    if (ms <= 0) {
      handleSubmit();
      return;
    }
    const timeout = setTimeout(handleSubmit, ms);
    return () => clearTimeout(timeout);
  }, [endTime, submitted]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl font-bold text-green-400">Answer submitted!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">{question}</h2>
        <p className="text-sm text-gray-400">Select all that apply</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const isSelected = selected.has(index);
          const colorClass = OPTION_COLORS[index % OPTION_COLORS.length];
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(index)}
              className={`flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-semibold transition ${colorClass} ${
                isSelected ? "ring-4 ring-white" : "ring-0"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-white ${
                  isSelected ? "bg-white" : "bg-transparent"
                }`}
              >
                {isSelected && (
                  <svg
                    className="h-4 w-4 text-gray-900"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                )}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={selected.size === 0}
        className="mt-2 rounded-lg bg-white px-8 py-3 text-lg font-semibold text-gray-900 transition hover:bg-gray-200 disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}
