"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { Flashcard } from "@/lib/types";
import { mockGenerateCards } from "@/lib/ai";

interface AIGenerationPanelProps {
  onApproveCards: (cards: Flashcard[]) => void;
}

export function AIGenerationPanel({ onApproveCards }: AIGenerationPanelProps) {
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canGenerate = useMemo(() => notes.trim().length > 10, [notes]);

  const generateCards = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      if (!response.ok || !Array.isArray(data.cards)) {
        throw new Error(data?.message || "Failed to generate cards.");
      }

      setGenerated(data.cards);
      if (data.fallback) {
        setStatusMessage("Generated cards using fallback mock content.");
      }
    } catch (error) {
      const fallbackCards = mockGenerateCards(notes);
      setGenerated(fallbackCards);
      setStatusMessage(
        error instanceof Error
          ? `Gemini unavailable: ${error.message}. Showing mock cards instead.`
          : "Gemini unavailable; showing mock cards instead."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        onClick={generateCards}
        disabled={!canGenerate || isLoading}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {isLoading ? "Generating..." : "Generate Flashcards"}
      </button>

      {statusMessage && <p className="mt-2 text-sm text-slate-600">{statusMessage}</p>}

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
