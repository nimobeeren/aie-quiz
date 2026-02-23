"use client";

import { useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { PresenterState, ClientMessage } from "@/lib/types";

export default function PresentPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [state, setState] = useState<PresenterState | null>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
    room: roomId,
    query: { role: "presenter" },
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

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Connecting...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-3xl font-bold">Room {roomId}</h1>
      <p className="mb-2 text-gray-400">Phase: {state.phase}</p>
      <p className="mb-6 text-gray-400">
        Participants: {state.participants.length}
      </p>

      {state.phase === "lobby" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-gray-300">
            {state.participants.map((p, i) => (
              <span
                key={i}
                className="mr-2 inline-block rounded bg-gray-800 px-3 py-1"
              >
                {p.name}
              </span>
            ))}
          </div>
          <button
            onClick={() =>
              send({ type: "presenter_action", action: "start" })
            }
            disabled={state.participants.length === 0}
            className="rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold transition hover:bg-green-500 disabled:opacity-50"
          >
            Start Quiz
          </button>
        </div>
      )}

      {state.phase === "question" && (
        <div className="text-center">
          <p className="text-xl">{state.question?.question}</p>
          <p className="mt-4 text-gray-400">
            {state.answerCount} / {state.totalParticipants} answered
          </p>
        </div>
      )}

      {state.phase === "results" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Results</p>
          <button
            onClick={() =>
              send({ type: "presenter_action", action: "show_leaderboard" })
            }
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-500"
          >
            Show Leaderboard
          </button>
        </div>
      )}

      {state.phase === "leaderboard" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Leaderboard</p>
          <button
            onClick={() => {
              const isLastQuestion =
                state.currentQuestionIndex >= 3; // TODO: get from server
              if (isLastQuestion) {
                send({ type: "presenter_action", action: "show_podium" });
              } else {
                send({ type: "presenter_action", action: "next" });
              }
            }}
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-500"
          >
            Next
          </button>
        </div>
      )}

      {state.phase === "podium" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Podium</p>
          <button
            onClick={() =>
              send({ type: "presenter_action", action: "reveal_next" })
            }
            className="rounded-lg bg-yellow-600 px-8 py-3 font-semibold transition hover:bg-yellow-500"
          >
            Reveal Next
          </button>
        </div>
      )}

      {state.phase === "finished" && (
        <p className="text-2xl font-bold">Quiz Complete!</p>
      )}
    </main>
  );
}
