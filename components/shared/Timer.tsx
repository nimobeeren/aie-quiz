"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  endTime: number | null;
}

export default function Timer({ endTime }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endTime) {
      setRemaining(0);
      return;
    }

    function tick() {
      const ms = Math.max(0, endTime! - Date.now());
      setRemaining(ms);
    }

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isLow = totalSeconds <= 5 && totalSeconds > 0;

  return (
    <div
      data-testid="timer"
      className={`text-5xl font-mono font-bold tabular-nums ${
        isLow ? "text-red-500 animate-pulse" : "text-white"
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
