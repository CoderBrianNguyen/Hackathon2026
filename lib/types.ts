export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: Difficulty;
}

export interface QuizAttempt {
  completedAt: string;
  total: number;
  correct: number;
  score: number;
  averageConfidence: number | null;
}

export interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
  lastScore: number | null;
  attempts: QuizAttempt[];
  subjectId: string | null;
}

export interface Subject {
  id: string;
  name: string;
  createdAt: string;
  color: string;
}

export interface StudyPlanDay {
  key: string;
  deckIds: string[];
}

export interface StudyPlan {
  mode: "infinite";
  endDate: null;
  dayPlans: StudyPlanDay[];
}

export interface AppData {
  decks: Deck[];
  subjects: Subject[];
  studyPlan: StudyPlan;
}

export interface QuizAnswer {
  cardId: string;
  isCorrect: boolean;
  confidence?: 1 | 2 | 3;
  userAnswer?: string;
}

export interface AnswerEvaluation {
  cardId: string;
  isCorrect: boolean;
  confidence: number;
  feedback: string;
}

export interface ShortAnswerForEvaluation {
  cardId: string;
  question: string;
  studentAnswer: string;
  expectedAnswer: string;
}

export interface QuizResult {
  deckId: string;
  total: number;
  correct: number;
  incorrect: number;
  answers: QuizAnswer[];
  missedCards: Flashcard[];
  completedAt: string;
  averageConfidence: number | null;
  evaluations?: AnswerEvaluation[];
  shortAnswersForEvaluation?: ShortAnswerForEvaluation[];
}

export type AppView = "dashboard" | "editor" | "quiz" | "evaluate-short-answers" | "results";
