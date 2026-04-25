export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: Difficulty;
}

export interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
  lastScore: number | null;
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
}

export type AppView = "dashboard" | "editor" | "quiz" | "results";
