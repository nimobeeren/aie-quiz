"use client";

import { useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { ParticipantState, ClientMessage } from "@/lib/types";
import NameEntry from "@/components/participant/NameEntry";
import WaitingScreen from "@/components/participant/WaitingScreen";
import SingleChoice from "@/components/participant/SingleChoice";
import MultiChoice from "@/components/participant/MultiChoice";
import LogSlider from "@/components/participant/LogSlider";
import RankingDnd from "@/components/participant/RankingDnd";
import AnswerSubmitted from "@/components/participant/AnswerSubmitted";
import Timer from "@/components/shared/Timer";
import QuestionHeader from "@/components/shared/QuestionHeader";

export default function PlayPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const [state, setState] = useState<ParticipantState | null>(null);
  const [joined, setJoined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastQuestionIndex, setLastQuestionIndex] = useState(-1);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
    room: roomId,
    query: { role: "participant" },
    onMessage(event) {
      const newState: ParticipantState = JSON.parse(event.data);
      setState(newState);
      // Reset submitted flag when a new question starts
      if (newState.currentQuestionIndex !== lastQuestionIndex) {
        setSubmitted(false);
        setLastQuestionIndex(newState.currentQuestionIndex);
      }
    },
  });

  const send = useCallback(
    (msg: ClientMessage) => {
      socket.send(JSON.stringify(msg));
    },
    [socket]
  );

  function handleSubmitAnswer(answer: number | number[]) {
    send({
      type: "submit_answer",
      answer,
      timestamp: Date.now(),
    });
    setSubmitted(true);
  }

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

  if (state.phase === "question" && state.question) {
    if (submitted) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
          <AnswerSubmitted />
        </main>
      );
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex justify-center">
            <Timer endTime={state.endTime} />
          </div>
          <QuestionHeader
            questionNumber={state.currentQuestionIndex + 1}
            question={state.question.question}
          />
          {state.question.type === "single" && state.question.options && (
            <SingleChoice
              question=""
              options={state.question.options}
              onSubmit={(idx) => handleSubmitAnswer(idx)}
            />
          )}
          {state.question.type === "multi" && state.question.options && (
            <MultiChoice
              question=""
              options={state.question.options}
              onSubmit={(indices) => handleSubmitAnswer(indices)}
            />
          )}
          {state.question.type === "slider" &&
            state.question.min !== undefined &&
            state.question.max !== undefined && (
              <LogSlider
                question=""
                min={state.question.min}
                max={state.question.max}
                onSubmit={(val) => handleSubmitAnswer(val)}
              />
            )}
          {state.question.type === "ranking" && state.question.options && (
            <RankingDnd
              question=""
              options={state.question.options}
              onSubmit={(order) => handleSubmitAnswer(order)}
            />
          )}
        </div>
      </main>
    );
  }

  if (state.phase === "results") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <AnswerSubmitted result={state.myResult} />
      </main>
    );
  }

  if (state.phase === "leaderboard" || state.phase === "podium") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          {state.myRank && (
            <p className="text-lg text-gray-400">
              Your rank: <span className="text-2xl font-bold text-white">#{state.myRank}</span>
            </p>
          )}
          {state.leaderboard && (
            <div className="w-full max-w-sm">
              {state.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between border-b border-gray-800 py-2"
                >
                  <span className="text-gray-400">#{entry.rank}</span>
                  <span className="font-medium">{entry.name}</span>
                  <span className="font-bold text-yellow-400">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  if (state.phase === "finished") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <p className="text-3xl font-bold">Thanks for playing!</p>
          {state.myRank && (
            <p className="mt-4 text-xl text-gray-400">
              You finished #{state.myRank}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-gray-400">Waiting...</p>
    </main>
  );
}
