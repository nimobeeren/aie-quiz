import type * as Party from "partykit/server";
import type {
  ClientMessage,
  GameState,
  Participant,
  PresenterState,
  ParticipantState,
  Question,
  LeaderboardEntry,
} from "@/lib/types";
import {
  scoreSingleChoice,
  scoreMultiChoice,
  scoreSlider,
  scoreRanking,
} from "@/lib/scoring";

// PartyKit reads questions.json at build time
import questionsData from "@/data/questions.json";

const questions: Question[] = questionsData.questions as Question[];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${+(n / 1_000_000_000_000).toPrecision(3)}T`;
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toPrecision(3)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toPrecision(3)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toPrecision(3)}K`;
  return `${Math.round(n)}`;
}

function initialState(): GameState {
  return {
    phase: "lobby",
    currentQuestionIndex: 0,
    endTime: null,
    participants: {},
    answerCount: 0,
    revealedPodiumPlace: 3,
  };
}

export default class QuizServer implements Party.Server {
  state: GameState;
  timerTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = initialState();
  }

  async onStart() {
    const stored = await this.room.storage.get<GameState>("state");
    if (stored) {
      this.state = stored;
    }
  }

  async saveState() {
    await this.room.storage.put("state", this.state);
  }

  getConnectionTags(
    conn: Party.Connection,
    ctx: Party.ConnectionContext
  ): string[] {
    const url = new URL(ctx.request.url);
    const role = url.searchParams.get("role");
    if (role === "presenter" || role === "participant") {
      return [role];
    }
    return ["participant"];
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Determine role from query params since conn.tags may not be available
    const url = new URL(ctx.request.url);
    const role = url.searchParams.get("role");
    if (role === "presenter") {
      conn.send(JSON.stringify(this.buildPresenterState()));
    } else {
      conn.send(JSON.stringify(this.buildParticipantState(conn.id)));
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(msg.name, sender);
        break;
      case "submit_answer":
        this.handleSubmitAnswer(msg.answer, msg.timestamp, sender);
        break;
      case "presenter_action":
        this.handlePresenterAction(msg.action);
        break;
    }
  }

  handleJoin(name: string, conn: Party.Connection) {
    if (this.state.phase !== "lobby") return;
    if (this.state.participants[conn.id]) return;

    this.state.participants[conn.id] = {
      id: conn.id,
      name,
      score: 0,
      answers: [],
    };
    this.saveState();
    this.broadcastAll();
  }

  handleSubmitAnswer(
    answer: number | number[],
    timestamp: number,
    conn: Party.Connection
  ) {
    if (this.state.phase !== "question") return;
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    // Check if already answered this question
    if (
      participant.answers.some(
        (a) => a.questionIndex === this.state.currentQuestionIndex
      )
    ) {
      return;
    }

    // Check if timer expired (server-authoritative)
    if (this.state.endTime && Date.now() > this.state.endTime) return;

    participant.answers.push({
      questionIndex: this.state.currentQuestionIndex,
      value: answer,
      timestamp,
      score: 0, // Computed when results are shown
    });

    this.state.answerCount++;
    this.saveState();
    this.broadcastAll();

    // Auto-advance to results when all participants have answered
    const totalParticipants = Object.keys(this.state.participants).length;
    if (this.state.answerCount >= totalParticipants && totalParticipants > 0) {
      this.endQuestion();
    }
  }

  handlePresenterAction(
    action:
      | "start"
      | "next"
      | "show_results"
      | "show_leaderboard"
      | "show_podium"
      | "reveal_next"
      | "finish"
  ) {
    switch (action) {
      case "start":
        if (this.state.phase !== "lobby") return;
        this.startQuestion(0);
        break;

      case "next":
        if (this.state.phase !== "leaderboard") return;
        this.startQuestion(this.state.currentQuestionIndex + 1);
        break;

      case "show_results":
        // Manual trigger if needed (normally auto-triggered by timer)
        if (this.state.phase !== "question") return;
        this.endQuestion();
        break;

      case "show_leaderboard":
        if (this.state.phase !== "results") return;
        this.state.phase = "leaderboard";
        this.saveState();
        this.broadcastAll();
        break;

      case "show_podium":
        if (this.state.phase !== "leaderboard") return;
        this.state.phase = "podium";
        this.state.revealedPodiumPlace = 3;
        this.saveState();
        this.broadcastAll();
        break;

      case "reveal_next":
        if (this.state.phase !== "podium") return;
        if (this.state.revealedPodiumPlace > 0) {
          this.state.revealedPodiumPlace--;
          this.saveState();
          this.broadcastAll();
        }
        break;

      case "finish":
        if (this.state.phase !== "podium") return;
        this.state.phase = "finished";
        this.saveState();
        this.broadcastAll();
        break;
    }
  }

  startQuestion(index: number) {
    if (index >= questions.length) {
      this.state.phase = "finished";
      this.saveState();
      this.broadcastAll();
      return;
    }

    const question = questions[index];
    this.state.phase = "question";
    this.state.currentQuestionIndex = index;
    this.state.endTime = Date.now() + question.timerSeconds * 1000;
    this.state.answerCount = 0;
    this.saveState();
    this.broadcastAll();

    // Set server-side timer to auto-end the question
    if (this.timerTimeout) clearTimeout(this.timerTimeout);
    this.timerTimeout = setTimeout(() => {
      this.endQuestion();
    }, question.timerSeconds * 1000);
  }

  endQuestion() {
    if (this.timerTimeout) {
      clearTimeout(this.timerTimeout);
      this.timerTimeout = null;
    }

    const question = questions[this.state.currentQuestionIndex];
    const timerMs = question.timerSeconds * 1000;

    // Compute scores for each participant's answer
    for (const participant of Object.values(this.state.participants)) {
      const answer = participant.answers.find(
        (a) => a.questionIndex === this.state.currentQuestionIndex
      );
      if (!answer) continue;

      const responseTimeMs = this.state.endTime
        ? answer.timestamp - (this.state.endTime - timerMs)
        : timerMs;

      let score = 0;
      switch (question.type) {
        case "single":
          score = scoreSingleChoice(
            answer.value as number,
            question.correctAnswer,
            responseTimeMs,
            timerMs
          );
          break;
        case "multi":
          score = scoreMultiChoice(
            answer.value as number[],
            question.correctAnswers,
            responseTimeMs,
            timerMs
          );
          break;
        case "slider":
          score = scoreSlider(
            answer.value as number,
            question.correctAnswer,
            question.min,
            question.max
          );
          break;
        case "ranking":
          score = scoreRanking(
            answer.value as number[],
            question.correctOrder,
            responseTimeMs,
            timerMs
          );
          break;
      }

      answer.score = score;
      participant.score += score;
    }

    this.state.phase = "results";
    this.state.endTime = null;
    this.saveState();
    this.broadcastAll();
  }

  buildLeaderboard(): LeaderboardEntry[] {
    return Object.values(this.state.participants)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ name: p.name, score: p.score, rank: i + 1 }));
  }

  buildPresenterState(): PresenterState {
    const s = this.state;
    const question = questions[s.currentQuestionIndex];
    const base: PresenterState = {
      phase: s.phase,
      currentQuestionIndex: s.currentQuestionIndex,
      totalQuestions: questions.length,
      endTime: s.endTime,
      answerCount: s.answerCount,
      totalParticipants: Object.keys(s.participants).length,
      participants: Object.values(s.participants).map((p) => ({
        name: p.name,
        score: p.score,
      })),
    };

    if (s.phase === "question" || s.phase === "results") {
      base.question = question;
    }

    if (s.phase === "results") {
      base.results = this.buildResultsDistribution(question);
    }

    if (s.phase === "leaderboard" || s.phase === "finished") {
      base.leaderboard = this.buildLeaderboard();
    }

    if (s.phase === "podium" || s.phase === "finished") {
      const lb = this.buildLeaderboard();
      base.podium = {
        third: lb[2] ?? null,
        second: lb[1] ?? null,
        first: lb[0] ?? null,
        revealed: 3 - s.revealedPodiumPlace,
      };
      base.leaderboard = lb;
    }

    return base;
  }

  buildParticipantState(connectionId: string): ParticipantState {
    const s = this.state;
    const question = questions[s.currentQuestionIndex];
    const participant = s.participants[connectionId];

    const base: ParticipantState = {
      phase: s.phase,
      currentQuestionIndex: s.currentQuestionIndex,
      endTime: s.endTime,
    };

    if (s.phase === "question") {
      base.question = {
        type: question.type,
        question: question.question,
        options: "options" in question ? question.options : undefined,
        min: question.type === "slider" ? question.min : undefined,
        max: question.type === "slider" ? question.max : undefined,
      };
    }

    if (s.phase === "results" && participant) {
      const answer = participant.answers.find(
        (a) => a.questionIndex === s.currentQuestionIndex
      );

      let correctAnswer: string | undefined;
      if (question.type === "single") {
        correctAnswer = question.options[question.correctAnswer];
      } else if (question.type === "multi") {
        correctAnswer = question.correctAnswers
          .map((i) => question.options[i])
          .join(", ");
      } else if (question.type === "slider") {
        correctAnswer = formatNumber(question.correctAnswer);
      } else if (question.type === "ranking") {
        correctAnswer = question.correctOrder
          .map((i) => question.options[i])
          .join(" → ");
      }

      const score = answer?.score ?? 0;
      let outcome: "correct" | "partial" | "wrong" = "wrong";
      if (score > 0) {
        // Check if the answer was fully correct
        let fullyCorrect = false;
        if (answer) {
          if (question.type === "single") {
            fullyCorrect = answer.value === question.correctAnswer;
          } else if (question.type === "multi") {
            const sel = new Set(answer.value as number[]);
            const cor = new Set(question.correctAnswers);
            fullyCorrect = sel.size === cor.size && [...cor].every((v) => sel.has(v));
          } else if (question.type === "slider") {
            fullyCorrect = score === 1000;
          } else if (question.type === "ranking") {
            const sub = answer.value as number[];
            fullyCorrect = question.correctOrder.every((v, i) => v === sub[i]);
          }
        }
        outcome = fullyCorrect ? "correct" : "partial";
      }

      base.myResult = {
        outcome,
        pointsEarned: score,
        newTotal: participant.score,
        correctAnswer,
      };
    }

    if (
      s.phase === "leaderboard" ||
      s.phase === "podium" ||
      s.phase === "finished"
    ) {
      const lb = this.buildLeaderboard();
      base.leaderboard = lb.slice(0, 5);
      if (participant) {
        const myEntry = lb.find((e) => e.name === participant.name);
        base.myRank = myEntry?.rank;
      }
    }

    return base;
  }

  buildResultsDistribution(question: Question) {
    const answers = Object.values(this.state.participants)
      .map((p) =>
        p.answers.find(
          (a) => a.questionIndex === this.state.currentQuestionIndex
        )
      )
      .filter(Boolean);

    const distribution: Record<string, number> = {};

    if (question.type === "single") {
      question.options.forEach((_, i) => {
        distribution[String(i)] = 0;
      });
      for (const a of answers) {
        const key = String(a!.value);
        distribution[key] = (distribution[key] ?? 0) + 1;
      }
      return {
        distribution,
        correctAnswer: question.correctAnswer,
      };
    }

    if (question.type === "multi") {
      question.options.forEach((_, i) => {
        distribution[String(i)] = 0;
      });
      for (const a of answers) {
        const vals = a!.value as number[];
        for (const v of vals) {
          distribution[String(v)] = (distribution[String(v)] ?? 0) + 1;
        }
      }
      return {
        distribution,
        correctAnswer: question.correctAnswers,
      };
    }

    if (question.type === "slider") {
      return {
        distribution: {},
        correctAnswer: question.correctAnswer,
        answers: answers.map((a) => ({
          participantId: "",
          value: a!.value,
        })),
      };
    }

    // ranking
    return {
      distribution: {},
      correctAnswer: question.correctOrder,
    };
  }

  broadcastAll() {
    const presenterState = JSON.stringify(this.buildPresenterState());
    for (const conn of this.room.getConnections("presenter")) {
      conn.send(presenterState);
    }

    for (const conn of this.room.getConnections("participant")) {
      conn.send(JSON.stringify(this.buildParticipantState(conn.id)));
    }
  }
}

QuizServer satisfies Party.Worker;
