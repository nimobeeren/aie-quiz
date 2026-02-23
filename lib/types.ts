// ── Question Types ──

export interface SingleChoiceQuestion {
  type: "single";
  question: string;
  options: string[];
  correctAnswer: number;
  timerSeconds: number;
}

export interface MultiChoiceQuestion {
  type: "multi";
  question: string;
  options: string[];
  correctAnswers: number[];
  timerSeconds: number;
}

export interface SliderQuestion {
  type: "slider";
  question: string;
  min: number;
  max: number;
  correctAnswer: number;
  timerSeconds: number;
}

export interface RankingQuestion {
  type: "ranking";
  question: string;
  options: string[];
  correctOrder: number[];
  timerSeconds: number;
}

export type Question =
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | SliderQuestion
  | RankingQuestion;

export interface QuestionFile {
  questions: Question[];
}

// ── Game State ──

export type GamePhase =
  | "lobby"
  | "question"
  | "results"
  | "leaderboard"
  | "podium"
  | "finished";

export interface Answer {
  questionIndex: number;
  value: number | number[];
  timestamp: number;
  score: number;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  answers: Answer[];
}

export interface GameState {
  phase: GamePhase;
  currentQuestionIndex: number;
  endTime: number | null;
  participants: Record<string, Participant>;
  answerCount: number;
  revealedPodiumPlace: number;
}

// ── Client → Server Messages ──

export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "submit_answer"; answer: number | number[]; timestamp: number }
  | {
      type: "presenter_action";
      action:
        | "start"
        | "next"
        | "show_results"
        | "show_leaderboard"
        | "show_podium"
        | "reveal_next"
        | "finish";
    };

// ── Server → Client Messages ──

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

export interface PresenterState {
  phase: GamePhase;
  currentQuestionIndex: number;
  totalQuestions: number;
  endTime: number | null;
  answerCount: number;
  totalParticipants: number;
  participants: { name: string; score: number }[];
  question?: Question;
  results?: {
    distribution: Record<string, number>;
    correctAnswer: number | number[];
    answers?: { participantId: string; value: number | number[] }[];
  };
  leaderboard?: LeaderboardEntry[];
  podium?: {
    third: LeaderboardEntry | null;
    second: LeaderboardEntry | null;
    first: LeaderboardEntry | null;
    revealed: number;
  };
}

export interface ParticipantState {
  phase: GamePhase;
  currentQuestionIndex: number;
  endTime: number | null;
  question?: {
    type: Question["type"];
    question: string;
    options?: string[];
    min?: number;
    max?: number;
  };
  myResult?: {
    outcome: "correct" | "partial" | "wrong";
    pointsEarned: number;
    newTotal: number;
    correctAnswer?: string;
  };
  myRank?: number;
  leaderboard?: LeaderboardEntry[];
}
