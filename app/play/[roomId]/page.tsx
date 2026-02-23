"use client";

import { useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { ParticipantState, ClientMessage } from "@/lib/types";
import NameEntry from "@/components/participant/NameEntry";
import WaitingScreen from "@/components/participant/WaitingScreen";

export default function PlayPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [state, setState] = useState<ParticipantState | null>(null);
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

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-gray-400">Connecting...</p>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <NameEntry
          onSubmit={(name) => {
            send({ type: "join", name });
            setJoined(true);
          }}
        />
      </main>
    );
  }

  if (state.phase === "lobby") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <WaitingScreen />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <p className="text-gray-400">
        {state.phase === "question" && "Question active"}
        {state.phase === "results" && "Results"}
        {state.phase === "leaderboard" && "Leaderboard"}
        {state.phase === "podium" && "Final results"}
        {state.phase === "finished" && "Thanks for playing!"}
      </p>
    </main>
  );
}
