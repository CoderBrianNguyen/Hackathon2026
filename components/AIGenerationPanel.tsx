"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { Flashcard } from "@/lib/types";

interface AIGenerationPanelProps {
  onApproveCards: (cards: Flashcard[]) => void;
}

const mockGenerateCards = (notes: string): Flashcard[] => {
  // TODO: Replace mock generation with a Gemini/OpenAI API call for real note-to-card generation.
  const snippets = notes
    .split(/[.\n]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (snippets.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        front: "What is one key idea from your notes?",
        back: "Add notes with clear facts so cards can be generated.",
        difficulty: "Medium"
      }
    ];
  }

  return snippets.map((line, index) => ({
    id: crypto.randomUUID(),
    front: `Explain this concept: ${line.slice(0, 60)}${line.length > 60 ? "..." : ""}`,
    back: line,
    difficulty: index % 3 === 0 ? "Easy" : index % 3 === 1 ? "Medium" : "Hard"
  }));
};

export function AIGenerationPanel({ onApproveCards }: AIGenerationPanelProps) {
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState<Flashcard[]>([]);

  const canGenerate = useMemo(() => notes.trim().length > 10, [notes]);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-900">
        <Sparkles size={16} />
        Generate Cards From Notes
      </h3>
      <p className="mt-1 text-xs text-indigo-700">Paste notes, then review generated cards before adding them.</p>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="mt-3 h-28 w-full rounded-lg border border-indigo-200 bg-white p-3 text-sm text-slate-700 outline-none ring-indigo-300 focus:ring"
        placeholder="Paste class notes or bullet points..."
      />
      <button
        onClick={() => setGenerated(mockGenerateCards(notes))}
        disabled={!canGenerate}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        Generate Flashcards
      </button>

      {generated.length > 0 && (
        <div className="mt-4 space-y-2">
          {generated.map((card) => (
            <div key={card.id} className="rounded-lg bg-white p-3 text-sm ring-1 ring-indigo-100">
              <p className="font-semibold text-slate-800">Q: {card.front}</p>
              <p className="mt-1 text-slate-600">A: {card.back}</p>
            </div>
          ))}
          <button
            onClick={() => {
              onApproveCards(generated);
              setGenerated([]);
              setNotes("");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <CheckCircle size={16} />
            Add Generated Cards
          </button>
        </div>
      )}
    </div>
  );
}
