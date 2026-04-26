"use client";

import { useMemo, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Deck, Flashcard, QuizAnswer, QuizResult } from "@/lib/types";

interface QuizModeProps {
  deck: Deck;
  onBack: () => void;
  onFinish: (result: QuizResult) => void;
}

const shuffleDeck = <T,>(array: T[]): T[] => {
  const temp = [...array];
  const shuffled = [];
  while (temp != 0) {
    const index = Math.floor(Math.random() * (temp.length + 1));
    shuffled.push(temp.splice(index,1));
    }
  return shuffled.flat();
  }

export function QuizMode({ deck, onBack, onFinish }: QuizModeProps) {
  const [index, setIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);
  const [submittedResult, setSubmittedResult] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<"not_sure" | "somewhat_sure" | "very_sure" | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<number[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const shuffledCards = useMemo(() => shuffleDeck(deck.cards), [deck.id]);
  const currentCard = shuffledCards[index];
  const progressPercent = useMemo(() => ((index + 1) / shuffledCards.length) * 100, [index, shuffledCards.length]);

  const normalizeAnswer = (answer: string) => answer.replace(/\s+/g, "").toLowerCase();
  const confidenceToScore = (value: "not_sure" | "somewhat_sure" | "very_sure" | null) => {
    if (value === "not_sure") return 33;
    if (value === "somewhat_sure") return 67;
    if (value === "very_sure") return 100;
    return null;
  };

  const advanceQuiz = (isCorrect: boolean) => {
    const updatedCorrect = isCorrect ? correctCount + 1 : correctCount;
    const updatedMissedCards = isCorrect ? missedCards : [...missedCards, currentCard];
    const currentConfidenceScore = confidenceToScore(confidence);
    const updatedConfidenceScores =
      currentConfidenceScore === null ? confidenceScores : [...confidenceScores, currentConfidenceScore];
    const averageConfidence =
      updatedConfidenceScores.length > 0
        ? Math.round(updatedConfidenceScores.reduce((total, score) => total + score, 0) / updatedConfidenceScores.length)
        : null;
    const confidenceValue = confidence === "not_sure" ? 1 : confidence === "somewhat_sure" ? 2 : confidence === "very_sure" ? 3 : undefined;
    const answer: QuizAnswer = {
      cardId: currentCard.id,
      isCorrect,
      ...(confidenceValue ? { confidence: confidenceValue } : {})
    };
    const updatedAnswers = [...answers, answer];

    const isLastCard = index >= deck.cards.length - 1;
    if (isLastCard) {
      onFinish({
        deckId: deck.id,
        total: deck.cards.length,
        correct: updatedCorrect,
        incorrect: deck.cards.length - updatedCorrect,
        answers: updatedAnswers,
        missedCards: updatedMissedCards,
        completedAt: new Date().toISOString(),
        averageConfidence
      });
      return;
    }

    setCorrectCount(updatedCorrect);
    setMissedCards(updatedMissedCards);
    setConfidenceScores(updatedConfidenceScores);
    setAnswers(updatedAnswers);
    setIndex((prev) => prev + 1);
    setTypedAnswer("");
    setSubmittedResult(null);
    setConfidence(null);
  };

  const handleSubmitAnswer = () => {
    if (submittedResult !== null) return;
    const isCorrect = normalizeAnswer(typedAnswer) === normalizeAnswer(currentCard.back);
    setSubmittedResult(isCorrect);
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
          disabled={submittedResult !== null}
        />

        {submittedResult === null ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSubmitAnswer}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Submit Answer
            </button>

            <span className="h-8 w-px bg-slate-300" aria-hidden />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfidence("not_sure")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  confidence === "not_sure"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Not sure
              </button>
              <button
                type="button"
                onClick={() => setConfidence("somewhat_sure")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  confidence === "somewhat_sure"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Somewhat sure
              </button>
              <button
                type="button"
                onClick={() => setConfidence("very_sure")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  confidence === "very_sure"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Very sure
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div
              className={`rounded-lg p-3 text-sm ring-1 ${
                submittedResult ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-rose-50 text-rose-800 ring-rose-100"
              }`}
            >
              <p className="font-semibold">{submittedResult ? "Correct" : "Incorrect"}</p>
              <p>
                Your answer: <span className="font-medium">{typedAnswer.trim() || "No answer provided"}</span>
              </p>
              {!submittedResult && (
                <p>
                  Expected answer: <span className="font-medium">{currentCard.back}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => advanceQuiz(submittedResult)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                submittedResult ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {submittedResult ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {index >= deck.cards.length - 1 ? "Finish Quiz" : "Next Card"}
            </button>
          </div>
        )}
      </article>

      <button onClick={onBack} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
        Exit Quiz
      </button>
    </section>
  );
}
