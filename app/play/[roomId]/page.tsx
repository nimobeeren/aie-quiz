"use client";

import { useEffect, useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { ParticipantState, ClientMessage } from "@/lib/types";

export default function PlayPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [state, setState] = useState<ParticipantState | null>(null);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
    room: roomId,
    query: { role: "participant" },
    onMessage(event) {
      setState(JSON.parse(event.data));
    },
  });

  const send = useCallback(
    (msg: ClientMessage) => {
      socket.send(JSON.stringify(msg));
    },
    [socket]
  );

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    send({ type: "join", name: name.trim() });
    setJoined(true);
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Connecting...</p>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="mb-6 text-2xl font-bold">Join Quiz</h1>
        <form onSubmit={handleJoin} className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-64 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-xl focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <p className="text-gray-400">
        {state.phase === "lobby" && "Waiting for the quiz to start..."}
        {state.phase === "question" && "Question active"}
        {state.phase === "results" && "Results"}
        {state.phase === "leaderboard" && "Leaderboard"}
        {state.phase === "podium" && "Final results"}
        {state.phase === "finished" && "Thanks for playing!"}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Phase: {state.phase} | Question: {state.currentQuestionIndex + 1}
      </p>
    </main>
  );
}
