"use client";

import { useState, useCallback, use } from "react";
import usePartySocket from "partysocket/react";
import type { PresenterState, ClientMessage } from "@/lib/types";
import Lobby from "@/components/presenter/Lobby";
import QuestionDisplay from "@/components/presenter/QuestionDisplay";

function formatPresenterNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${+(n / 1_000_000_000_000).toPrecision(3)}T`;
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toPrecision(3)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toPrecision(3)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toPrecision(3)}K`;
  return `${Math.round(n)}`;
}

function logPosition(value: number, min: number, max: number): number {
  const pos = (Math.log(value / min) / Math.log(max / min)) * 100;
  return Math.max(0, Math.min(100, pos));
}

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

      {state.phase === "question" && state.question && (
        <QuestionDisplay
          question={state.question}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={state.totalQuestions}
          endTime={state.endTime}
          answerCount={state.answerCount}
          totalParticipants={state.totalParticipants}
        />
      )}

      {state.phase === "results" && (
        <div className="flex flex-col items-center gap-6">
          {state.question && (
            <p className="text-center text-xl text-gray-300">
              {state.question.question}
            </p>
          )}
          <h2 className="text-3xl font-bold">Results</h2>
          {state.question && state.results && (
            <>
              {/* Single / Multi choice: bar chart */}
              {"options" in state.question && state.question.options && (
                <div className="w-full max-w-2xl space-y-3">
                  {state.question.options.map((option, i) => {
                    const count = state.results!.distribution[String(i)] ?? 0;
                    const total = state.totalParticipants || 1;
                    const pct = Math.round((count / total) * 100);
                    const isCorrect = Array.isArray(state.results!.correctAnswer)
                      ? (state.results!.correctAnswer as number[]).includes(i)
                      : state.results!.correctAnswer === i;

                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-32 text-right text-sm">{option}</span>
                        <div className="flex-1">
                          <div
                            className={`h-8 rounded ${isCorrect ? "bg-green-600" : "bg-gray-600"}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm text-gray-400">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Slider: log-scale dot plot */}
              {state.question.type === "slider" && state.results.answers && (() => {
                const q = state.question!;
                if (q.type !== "slider") return null;
                return (
                  <div className="w-full max-w-2xl">
                    <div className="mb-2 text-center">
                      <span className="text-lg text-gray-400">Correct: </span>
                      <span className="text-2xl font-bold text-green-400">
                        {formatPresenterNumber(state.results!.correctAnswer as number)}
                      </span>
                    </div>
                    <div className="relative mx-auto h-16 w-full rounded-lg bg-gray-800">
                      <div
                        className="absolute top-0 h-full w-0.5 bg-green-500"
                        style={{
                          left: `${logPosition(state.results!.correctAnswer as number, q.min, q.max)}%`,
                        }}
                      />
                      {state.results!.answers!.map((a, i) => (
                        <div
                          key={i}
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 opacity-80"
                          style={{
                            left: `${logPosition(a.value as number, q.min, q.max)}%`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-sm text-gray-500">
                      <span>{formatPresenterNumber(q.min)}</span>
                      <span>{formatPresenterNumber(q.max)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Ranking: correct order + per-position breakdown */}
              {state.question.type === "ranking" && (() => {
                const q = state.question!;
                if (q.type !== "ranking") return null;
                const correctOrder = state.results!.correctAnswer as number[];
                const posDist = state.results!.positionDistribution;
                const total = state.totalParticipants || 1;

                return (
                  <div className="w-full max-w-2xl space-y-4">
                    {correctOrder.map((correctOptIdx, pos) => (
                      <div key={pos} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-lg font-bold text-gray-500">
                            {pos + 1}.
                          </span>
                          <span className="font-bold text-green-400">
                            {q.options[correctOptIdx]}
                          </span>
                        </div>
                        {posDist && (
                          <div className="ml-8 space-y-1">
                            {q.options.map((opt, optIdx) => {
                              const count = posDist[pos]?.[optIdx] ?? 0;
                              if (count === 0) return null;
                              const pct = Math.round((count / total) * 100);
                              const isCorrect = optIdx === correctOptIdx;
                              return (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="w-36 truncate text-right text-sm text-gray-400">
                                    {opt}
                                  </span>
                                  <div className="flex-1">
                                    <div
                                      className={`h-5 rounded text-xs leading-5 px-2 ${
                                        isCorrect ? "bg-green-600" : "bg-gray-600"
                                      }`}
                                      style={{ width: `${Math.max(pct, 8)}%` }}
                                    >
                                      {count}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
          <button
            onClick={() =>
              send({ type: "presenter_action", action: "show_leaderboard" })
            }
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold transition hover:bg-blue-500"
          >
            {state.currentQuestionIndex >= state.totalQuestions - 1
              ? "Show Podium"
              : "Show Leaderboard"}
          </button>
        </div>
      )}

      {state.phase === "leaderboard" && state.leaderboard && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold">Leaderboard</h2>
          <div className="w-full max-w-xl space-y-2">
            {state.leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between rounded-lg bg-gray-800 px-6 py-3"
              >
                <span className="text-2xl font-bold text-gray-500">
                  #{entry.rank}
                </span>
                <span className="flex-1 px-4 text-lg font-medium">
                  {entry.name}
                </span>
                <span className="text-xl font-bold text-yellow-400">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const isLast =
                state.currentQuestionIndex >= state.totalQuestions - 1;
              if (isLast) {
                send({ type: "presenter_action", action: "show_podium" });
              } else {
                send({ type: "presenter_action", action: "next" });
              }
            }}
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold transition hover:bg-blue-500"
          >
            {state.currentQuestionIndex >= state.totalQuestions - 1
              ? "Show Podium"
              : "Next Question"}
          </button>
        </div>
      )}

      {state.phase === "podium" && state.podium && (
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-4xl font-bold">Final Results</h2>
          <div className="flex items-end gap-4">
            {/* 2nd place */}
            <div
              className={`flex w-40 flex-col items-center rounded-t-lg bg-gray-700 pb-4 pt-6 transition-opacity ${
                state.podium.revealed >= 2 ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "200px" }}
            >
              <span className="text-4xl">🥈</span>
              <span className="mt-2 text-lg font-bold">
                {state.podium.second?.name ?? "—"}
              </span>
              <span className="text-yellow-400">
                {state.podium.second?.score ?? 0}
              </span>
            </div>
            {/* 1st place */}
            <div
              className={`flex w-44 flex-col items-center rounded-t-lg bg-yellow-600 pb-4 pt-6 transition-opacity ${
                state.podium.revealed >= 3 ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "260px" }}
            >
              <span className="text-5xl">🥇</span>
              <span className="mt-2 text-xl font-bold">
                {state.podium.first?.name ?? "—"}
              </span>
              <span className="text-yellow-100">
                {state.podium.first?.score ?? 0}
              </span>
            </div>
            {/* 3rd place */}
            <div
              className={`flex w-36 flex-col items-center rounded-t-lg bg-amber-800 pb-4 pt-6 transition-opacity ${
                state.podium.revealed >= 1 ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "160px" }}
            >
              <span className="text-3xl">🥉</span>
              <span className="mt-2 font-bold">
                {state.podium.third?.name ?? "—"}
              </span>
              <span className="text-yellow-400">
                {state.podium.third?.score ?? 0}
              </span>
            </div>
          </div>
          {state.podium.revealed < 3 ? (
            <button
              onClick={() =>
                send({ type: "presenter_action", action: "reveal_next" })
              }
              className="rounded-lg bg-yellow-600 px-8 py-3 text-lg font-bold transition hover:bg-yellow-500"
            >
              Reveal Next
            </button>
          ) : (
            <button
              onClick={() =>
                send({ type: "presenter_action", action: "finish" })
              }
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold transition hover:bg-blue-500"
            >
              Show Final Standings
            </button>
          )}
        </div>
      )}

      {state.phase === "finished" && (
        <div className="text-center">
          <p className="text-4xl font-bold">Quiz Complete!</p>
          {state.leaderboard && (
            <div className="mt-8 w-full max-w-xl space-y-2">
              {state.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between rounded-lg bg-gray-800 px-6 py-3"
                >
                  <span className="text-2xl font-bold text-gray-500">
                    #{entry.rank}
                  </span>
                  <span className="flex-1 px-4 text-lg font-medium">
                    {entry.name}
                  </span>
                  <span className="text-xl font-bold text-yellow-400">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
