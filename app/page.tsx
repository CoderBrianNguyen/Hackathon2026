"use client";

import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { FlashcardEditor } from "@/components/FlashcardEditor";
import { QuizMode } from "@/components/QuizMode";
import { ResultsView } from "@/components/ResultsView";
import { AppView, Deck, QuizResult, StudyPlan, Subject } from "@/lib/types";
import { loadAppData, saveAppData } from "@/lib/storage";
import { DEFAULT_SUBJECT_COLOR, normalizeSubjectColor } from "@/lib/subjectColor";

export default function HomePage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan>({ mode: "infinite", endDate: null, dayPlans: [] });
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const localData = loadAppData();
    setDecks(localData.decks);
    setSubjects(localData.subjects);
    setStudyPlan(localData.studyPlan);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveAppData({ decks, subjects, studyPlan });
  }, [decks, subjects, studyPlan, isHydrated]);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [decks, activeDeckId]
  );

  const createDeck = (title: string, subjectId: string | null) => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      title,
      cards: [],
      lastScore: null,
      attempts: [],
      subjectId
    };
    setDecks((prev) => [newDeck, ...prev]);
  };

  const createSubject = (name: string) => {
    const subject: Subject = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      color: normalizeSubjectColor(DEFAULT_SUBJECT_COLOR)
    };
    setSubjects((prev) => [subject, ...prev]);
    return subject;
  };

  const updateSubject = (subjectId: string, patch: { name?: string; color?: string }) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              name:
                typeof patch.name === "string"
                  ? patch.name.trim()
                    ? patch.name.trim()
                    : subject.name
                  : subject.name,
              color: typeof patch.color === "string" ? normalizeSubjectColor(patch.color) : subject.color
            }
          : subject
      )
    );
  };

  const updateDeck = (updatedDeck: Deck) => {
    setDecks((prev) => prev.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)));
  };

  const updateStudyPlan = (nextStudyPlan: StudyPlan) => {
    setStudyPlan(nextStudyPlan);
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
    const score = Math.round((result.correct / result.total) * 100);
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === result.deckId
          ? {
              ...deck,
              lastScore: score,
              attempts: [
                ...(deck.attempts ?? []),
                {
                  completedAt: result.completedAt,
                  total: result.total,
                  correct: result.correct,
                  score,
                  averageConfidence: result.averageConfidence
                }
              ]
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
      lastScore: null,
      attempts: []
    };

    setDecks((prev) => [reviewDeck, ...prev]);
    setActiveDeckId(reviewDeck.id);
    setActiveView("quiz");
  };

  if (!isHydrated) {
    return <main className="mx-auto max-w-5xl p-6">Loading RecallRush...</main>;
  }

  const mainClassName =
    activeView === "dashboard"
      ? "min-h-screen w-full"
      : "mx-auto min-h-screen w-full max-w-5xl p-4 md:p-6";

  return (
    <main className={mainClassName}>
      {activeView === "dashboard" && (
        <Dashboard
          decks={decks}
          subjects={subjects}
          studyPlan={studyPlan}
          onCreateDeck={createDeck}
          onCreateSubject={createSubject}
          onUpdateSubject={updateSubject}
          onUpdateStudyPlan={updateStudyPlan}
          onEditDeck={openEditor}
          onStartQuiz={startQuiz}
        />
      )}

      {activeView === "editor" && activeDeck && (
        <FlashcardEditor
          deck={activeDeck}
          subjects={subjects}
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
