"use client";

import { Plus, Trophy } from "lucide-react";
import { Deck } from "@/lib/types";
import { DeckCard } from "./DeckCard";

interface DashboardProps {
  decks: Deck[];
  onCreateDeck: (title: string) => void;
  onEditDeck: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
}

export function Dashboard({ decks, onCreateDeck, onEditDeck, onStartQuiz }: DashboardProps) {
  const handleCreateDeck = () => {
    const title = window.prompt("Name your new deck:");
    if (!title?.trim()) {
      return;
    }

    onCreateDeck(title.trim());
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RecallRush</h1>
          <p className="mt-1 text-sm text-slate-600">Fast active-recall study sprints with instant feedback.</p>
        </div>
        <button
          onClick={handleCreateDeck}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          New Deck
        </button>
      </header>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="inline-flex items-center gap-2 font-medium">
          <Trophy size={16} />
          Demo flow:
        </div>
        <p className="mt-1">Open a deck → edit/add cards (or generate from notes) → take quiz → review missed cards.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} onEdit={onEditDeck} onStartQuiz={onStartQuiz} />
        ))}
      </div>
    </section>
  );
}
