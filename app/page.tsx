"use client";

import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { FlashcardEditor } from "@/components/FlashcardEditor";
import { QuizMode } from "@/components/QuizMode";
import { ResultsView } from "@/components/ResultsView";
import { AppView, Deck, QuizResult } from "@/lib/types";
import { loadDecks, saveDecks } from "@/lib/storage";

export default function HomePage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const localDecks = loadDecks();
    setDecks(localDecks);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveDecks(decks);
  }, [decks, isHydrated]);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [decks, activeDeckId]
  );

  const createDeck = (title: string) => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      title,
      cards: [],
      lastScore: null
    };
    setDecks((prev) => [newDeck, ...prev]);
  };

  const updateDeck = (updatedDeck: Deck) => {
    setDecks((prev) => prev.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)));
  };

  const startQuiz = (deckId: string) => {
    setActiveDeckId(deckId);
    setActiveView("quiz");
  };

  const openEditor = (deckId: string) => {
    setActiveDeckId(deckId);
    setActiveView("editor");
  };

  const finishQuiz = (result: QuizResult) => {
    setLatestResult(result);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === result.deckId
          ? {
              ...deck,
              lastScore: Math.round((result.correct / result.total) * 100)
            }
          : deck
      )
    );
    setActiveView("results");
  };

  const reviewMissedCards = () => {
    if (!latestResult || !activeDeck) return;

    const reviewDeck: Deck = {
      ...activeDeck,
      id: `${activeDeck.id}-review-${Date.now()}`,
      title: `${activeDeck.title} (Missed Review)`,
      cards: latestResult.missedCards,
      lastScore: null
    };

    setDecks((prev) => [reviewDeck, ...prev]);
    setActiveDeckId(reviewDeck.id);
    setActiveView("quiz");
  };

  if (!isHydrated) {
    return <main className="mx-auto max-w-5xl p-6">Loading RecallRush...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-4 md:p-6">
      {activeView === "dashboard" && (
        <Dashboard
          decks={decks}
          onCreateDeck={createDeck}
          onEditDeck={openEditor}
          onStartQuiz={startQuiz}
        />
      )}

      {activeView === "editor" && activeDeck && (
        <FlashcardEditor
          deck={activeDeck}
          onSave={updateDeck}
          onBack={() => setActiveView("dashboard")}
        />
      )}

      {activeView === "quiz" && activeDeck && (
        <QuizMode
          deck={activeDeck}
          onFinish={finishQuiz}
          onBack={() => setActiveView("dashboard")}
        />
      )}

      {activeView === "results" && latestResult && activeDeck && (
        <ResultsView
          result={latestResult}
          deck={activeDeck}
          onReviewMissed={reviewMissedCards}
          onBackToDashboard={() => setActiveView("dashboard")}
        />
      )}
    </main>
  );
}
