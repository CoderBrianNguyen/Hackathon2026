"use client";

import { BookOpen, Brain } from "lucide-react";
import { Deck } from "@/lib/types";

interface DeckCardProps {
  deck: Deck;
  onEdit: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
}

export function DeckCard({ deck, onEdit, onStartQuiz }: DeckCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">{deck.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{deck.cards.length} cards</p>
      <p className="mt-2 text-sm text-slate-600">
        Last score: <span className="font-medium text-slate-800">{deck.lastScore ?? "No quiz yet"}{typeof deck.lastScore === "number" ? "%" : ""}</span>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(deck.id)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <BookOpen size={16} />
          Edit Deck
        </button>
        <button
          onClick={() => onStartQuiz(deck.id)}
          disabled={deck.cards.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          <Brain size={16} />
          Start Quiz
        </button>
      </div>
    </div>
  );
}
