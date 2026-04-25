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
}

export interface QuizResult {
  deckId: string;
  total: number;
  correct: number;
  incorrect: number;
  missedCards: Flashcard[];
  completedAt: string;
  averageConfidence: number | null;
}

export type AppView = "dashboard" | "editor" | "quiz" | "results";
