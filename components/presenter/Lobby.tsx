"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface LobbyProps {
  roomId: string;
  participants: { name: string; score: number }[];
  onStart: () => void;
}

export default function Lobby({ roomId, participants, onStart }: LobbyProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const joinUrl = `${window.location.origin}/play/${roomId}`;
    QRCode.toDataURL(joinUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrDataUrl);
  }, [roomId]);

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold">AIE Quiz</h1>

      <div className="flex flex-col items-center gap-4">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code to join the quiz"
            className="h-64 w-64"
          />
        )}
        <p className="text-6xl font-mono font-bold tracking-widest">
          {roomId}
        </p>
        <p className="text-gray-400">
          Scan the QR code or enter the code at{" "}
          <span className="text-white">
            {typeof window !== "undefined" ? window.location.origin : ""}
          </span>
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <p className="mb-3 text-center text-lg text-gray-400">
          {participants.length} player{participants.length !== 1 ? "s" : ""}{" "}
          joined
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {participants.map((p, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-800 px-4 py-2 text-sm font-medium"
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={participants.length === 0}
        className="rounded-lg bg-green-600 px-10 py-4 text-xl font-bold transition hover:bg-green-500 disabled:opacity-50"
      >
        Start Quiz
      </button>
    </div>
  );
}
