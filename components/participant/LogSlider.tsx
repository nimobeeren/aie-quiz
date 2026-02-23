"use client";

import { useState, useEffect, useRef } from "react";

interface LogSliderProps {
  question: string;
  min: number;
  max: number;
  endTime: number | null;
  onSubmit: (value: number) => void;
}

function formatValue(n: number): string {
  if (n >= 1_000_000_000_000) return `${+(n / 1_000_000_000_000).toPrecision(3)}T`;
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toPrecision(3)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toPrecision(3)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toPrecision(3)}K`;
  return `${Math.round(n)}`;
}

function sliderToValue(position: number, min: number, max: number): number {
  return min * Math.pow(max / min, position / 1000);
}

function valueToSlider(value: number, min: number, max: number): number {
  return 1000 * Math.log(value / min) / Math.log(max / min);
}

export default function LogSlider({ question, min, max, endTime, onSubmit }: LogSliderProps) {
  const initialPosition = valueToSlider(Math.sqrt(min * max), min, max);
  const [position, setPosition] = useState(Math.round(initialPosition));
  const [submitted, setSubmitted] = useState(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  const currentValue = sliderToValue(position, min, max);

  function handleSubmit() {
    if (submitted) return;
    onSubmit(sliderToValue(positionRef.current, min, max));
    setSubmitted(true);
  }

  // Auto-submit when timer expires
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
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white">{question}</h2>

      <div className="text-center text-4xl font-bold text-white tabular-nums">
        {formatValue(currentValue)}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={1000}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none rounded-full bg-gray-700 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-500 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-700 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-gray-700"
          style={{ height: "2.5rem" }}
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-xl bg-blue-600 py-4 text-xl font-bold text-white transition hover:bg-blue-500 active:scale-95"
      >
        Submit
      </button>
    </div>
  );
}
