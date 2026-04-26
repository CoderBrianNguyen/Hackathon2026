"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { Deck, QuizResult } from "@/lib/types";

interface ResultsViewProps {
  result: QuizResult;
  deck: Deck;
  onReviewMissed: () => void;
  onBackToDashboard: () => void;
}

export function ResultsView({ result, deck, onReviewMissed, onBackToDashboard }: ResultsViewProps) {
  const percentage = Math.round((result.correct / result.total) * 100);
  const cardById = new Map(deck.cards.map((card) => [card.id, card]));
  const lowConfidenceCards = (result.answers ?? [])
    .filter((answer) => !answer.isCorrect || (answer.isCorrect && answer.confidence === 1))
    .map((answer) => cardById.get(answer.cardId))
    .filter((card): card is Deck["cards"][number] => Boolean(card))
    .filter((card, index, cards) => cards.findIndex((candidate) => candidate.id === card.id) === index);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Trophy className="text-amber-500" />
          Quiz Results
        </h2>
        <p className="mt-2 text-slate-700">Deck: {deck.title}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Correct" value={result.correct} tone="text-emerald-600" />
          <Stat label="Incorrect" value={result.incorrect} tone="text-rose-600" />
          <Stat label="Score" value={`${percentage}%`} tone="text-indigo-600" />
        </div>
        <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          Focus on these cards first in your next study sprint.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Missed cards ({result.missedCards.length})</h3>
        {result.missedCards.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">Amazing job — no missed cards this round.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.missedCards.map((card) => (
              <li key={card.id} className="rounded-lg bg-rose-50 p-3 text-sm ring-1 ring-rose-100">
                <p className="font-semibold text-rose-900">Q: {card.front}</p>
                <p className="text-rose-700">A: {card.back}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Low confidence cards to review first ({lowConfidenceCards.length})
        </h3>
        {lowConfidenceCards.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700">No low-confidence cards this round — strong retention!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lowConfidenceCards.map((card) => (
              <li key={card.id} className="rounded-lg bg-amber-50 p-3 text-sm ring-1 ring-amber-100">
                <p className="font-semibold text-amber-900">Q: {card.front}</p>
                <p className="text-amber-700">A: {card.back}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {result.evaluations && result.evaluations.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Evaluated Short Answers ({result.evaluations.length})
          </h3>
          <div className="mt-3 space-y-3">
            {result.evaluations.map((evaluation) => {
              const card = cardById.get(evaluation.cardId);
              const answer = result.answers?.find(a => a.cardId === evaluation.cardId);
              if (!card) return null;

              return (
                <div
                  key={evaluation.cardId}
                  className={`rounded-lg p-4 ring-1 ${
                    evaluation.isCorrect
                      ? "bg-emerald-50 ring-emerald-100"
                      : "bg-rose-50 ring-rose-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 rounded-full p-1 ${
                      evaluation.isCorrect ? "bg-emerald-100" : "bg-rose-100"
                    }`}>
                      {evaluation.isCorrect ? (
                        <Trophy size={14} className="text-emerald-600" />
                      ) : (
                        <RotateCcw size={14} className="text-rose-600" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-900 mb-2">Q: {card.front}</p>
                      <div className="bg-white rounded p-2 mb-2 ring-1 ring-slate-200">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">Your answer:</span> {answer?.userAnswer || "No answer provided"}
                        </p>
                      </div>
                      <div className={`bg-white rounded p-2 mb-2 ring-1 ${
                        evaluation.isCorrect ? "ring-emerald-200" : "ring-rose-200"
                      }`}>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">Expected:</span> {card.back}
                        </p>
                      </div>
                      <div className={`text-sm ${evaluation.isCorrect ? "text-emerald-800" : "text-rose-800"}`}>
                        <p className="font-semibold mb-1">
                          {evaluation.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                        </p>
                        <p className="mb-1">{evaluation.feedback}</p>
                        <p className="text-xs opacity-75">
                          AI Confidence: {evaluation.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onReviewMissed}
          disabled={lowConfidenceCards.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          <RotateCcw size={16} />
          Review Missed Cards Again
        </button>
        <button onClick={onBackToDashboard} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Back to Dashboard
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
