"use client";

import { useMemo, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Deck, Flashcard, QuizAnswer, QuizResult } from "@/lib/types";

interface QuizModeProps {
  deck: Deck;
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

export function QuizMode({ deck, onBack, onFinish }: QuizModeProps) {
  const [index, setIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | undefined>(undefined);

  const currentCard = deck.cards[index];
  const progressPercent = useMemo(() => ((index + 1) / deck.cards.length) * 100, [index, deck.cards.length]);

  const handleSelfGrade = (isCorrect: boolean) => {
    const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const nextMissedCards = isCorrect ? missedCards : [...missedCards, currentCard];
    const nextAnswers: QuizAnswer[] = [...answers, { cardId: currentCard.id, isCorrect, confidence }];

    setCorrectCount(nextCorrectCount);
    setMissedCards(nextMissedCards);
    setAnswers(nextAnswers);

    const isLastCard = index >= deck.cards.length - 1;
    if (isLastCard) {
      onFinish({
        deckId: deck.id,
        total: deck.cards.length,
        correct: nextCorrectCount,
        incorrect: deck.cards.length - nextCorrectCount,
        answers: nextAnswers,
        missedCards: nextMissedCards,
        completedAt: new Date().toISOString()
      });
      return;
    }

    setIndex((prev) => prev + 1);
    setTypedAnswer("");
    setShowAnswer(false);
    setConfidence(undefined);
  };

  if (deck.cards.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-slate-700">This deck has no cards yet. Add cards before starting a quiz.</p>
        <button onClick={onBack} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Back
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Quiz: {deck.title}</h2>
        <p className="text-sm text-slate-600">Card {index + 1} of {deck.cards.length}</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase text-slate-500">Question</p>
        <p className="mt-2 text-lg font-medium text-slate-800">{currentCard.front}</p>

        <textarea
          value={typedAnswer}
          onChange={(event) => setTypedAnswer(event.target.value)}
          placeholder="Type your answer here..."
          className="mt-4 h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Show Answer
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
              <p className="font-semibold">Answer</p>
              <p>{currentCard.back}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Confidence:</span>
              <button
                onClick={() => setConfidence(1)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  confidence === 1
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                }`}
              >
                Not sure
              </button>
              <button
                onClick={() => setConfidence(2)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  confidence === 2
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
                }`}
              >
                Somewhat sure
              </button>
              <button
                onClick={() => setConfidence(3)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  confidence === 3
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                }`}
              >
                Very sure
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelfGrade(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                <CheckCircle size={16} />
                Correct
              </button>
              <button
                onClick={() => handleSelfGrade(false)}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
              >
                <XCircle size={16} />
                Incorrect
              </button>
            </div>
          </div>
        )}
      </article>

      <button onClick={onBack} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
        Exit Quiz
      </button>
    </section>
  );
}
