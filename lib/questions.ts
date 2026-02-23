import type { Question, QuestionFile } from "./types";
import questionsData from "@/data/questions.json";

export function loadQuestions(): Question[] {
  const data = questionsData as QuestionFile;
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error("Invalid questions file: missing 'questions' array");
  }
  if (data.questions.length === 0) {
    throw new Error("Questions file is empty");
  }
  return data.questions;
}

export function getQuestion(index: number): Question {
  const questions = loadQuestions();
  if (index < 0 || index >= questions.length) {
    throw new Error(
      `Question index ${index} out of range (0-${questions.length - 1})`
    );
  }
  return questions[index];
}

export function getTotalQuestions(): number {
  return loadQuestions().length;
}
