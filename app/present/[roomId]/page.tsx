"use client";

import { useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { PresenterState, ClientMessage } from "@/lib/types";
import Lobby from "@/components/presenter/Lobby";

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
      {state.phase === "lobby" && (
        <Lobby
          roomId={roomId}
          participants={state.participants}
          onStart={() =>
            send({ type: "presenter_action", action: "start" })
          }
        />
      )}

      {state.phase === "question" && (
        <div className="text-center">
          <p className="text-2xl font-bold">{state.question?.question}</p>
          <p className="mt-4 text-gray-400">
            {state.answerCount} / {state.totalParticipants} answered
          </p>
        </div>
      )}

      {state.phase === "results" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold">Results</p>
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
          <p className="text-2xl font-bold">Leaderboard</p>
          <button
            onClick={() => {
              const totalQuestions = 4; // from questions.json
              const isLast =
                state.currentQuestionIndex >= totalQuestions - 1;
              if (isLast) {
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
          <p className="text-2xl font-bold">Podium</p>
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
        <p className="text-3xl font-bold">Quiz Complete!</p>
      )}
    </main>
  );
}
