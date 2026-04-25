"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Deck, Difficulty, Flashcard, Subject } from "@/lib/types";
import { AIGenerationPanel } from "./AIGenerationPanel";

interface FlashcardEditorProps {
  deck: Deck;
  subjects: Subject[];
  onBack: () => void;
  onSave: (deck: Deck) => void;
}

const difficultyOptions: Difficulty[] = ["Easy", "Medium", "Hard"];

export function FlashcardEditor({ deck, subjects, onBack, onSave }: FlashcardEditorProps) {
  const updateCard = (cardId: string, patch: Partial<Flashcard>) => {
    const updatedCards = deck.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card));
    onSave({ ...deck, cards: updatedCards });
  };

  const addCard = () => {
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      front: "",
      back: "",
      difficulty: "Medium"
    };
    onSave({ ...deck, cards: [...deck.cards, newCard] });
  };

  const deleteCard = (cardId: string) => {
    onSave({ ...deck, cards: deck.cards.filter((card) => card.id !== cardId) });
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Editing: {deck.title}</h2>
          <p className="text-sm text-slate-600">Add cards quickly and keep the deck focused for short sprints.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Back
          </button>
          <button onClick={addCard} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            <Plus size={16} />
            Add Card
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label htmlFor="deck-subject-editor" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Subject Assignment
        </label>
        <select
          id="deck-subject-editor"
          value={deck.subjectId ?? "none"}
          onChange={(event) => onSave({ ...deck, subjectId: event.target.value === "none" ? null : event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        >
          <option value="none">Unassigned</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <AIGenerationPanel onApproveCards={(cards) => onSave({ ...deck, cards: [...deck.cards, ...cards] })} />

      <div className="space-y-3">
        {deck.cards.map((card, index) => (
          <div key={card.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Card {index + 1}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <textarea
                value={card.front}
                onChange={(event) => updateCard(card.id, { front: event.target.value })}
                placeholder="Question / prompt"
                className="h-24 rounded-lg border border-slate-300 p-3 text-sm text-slate-700"
              />
              <textarea
                value={card.back}
                onChange={(event) => updateCard(card.id, { back: event.target.value })}
                placeholder="Answer"
                className="h-24 rounded-lg border border-slate-300 p-3 text-sm text-slate-700"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <select
                value={card.difficulty}
                onChange={(event) => updateCard(card.id, { difficulty: event.target.value as Difficulty })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                onClick={() => deleteCard(card.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deck.cards.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No cards yet. Add a card manually or generate cards from notes.
        </div>
      )}

      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
        <RotateCcw size={16} />
        Done Editing
      </button>
    </section>
  );
}
