"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Sparkles, X } from "lucide-react";
import { Flashcard } from "@/lib/types";
import { mockGenerateCards } from "@/lib/ai";

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface AIGenerationPanelProps {
  onApproveCards: (cards: Flashcard[]) => void;
}

export function AIGenerationPanel({ onApproveCards }: AIGenerationPanelProps) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [generated, setGenerated] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canGenerate = useMemo(() => notes.trim().length > 10 || files.length > 0, [notes, files]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length + files.length > 3) {
      setStatusMessage("You can attach up to 3 files only.");
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
    setStatusMessage(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readFileContent = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      // For PDF files, try to extract text using PDF.js
      try {
        let pdfjsLib: any;

        // Try loading from CDN
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              pdfjsLib = window.pdfjsLib;
              resolve(pdfjsLib);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        } else {
          pdfjsLib = window.pdfjsLib;
        }

        if (!pdfjsLib) {
          throw new Error('PDF.js not available');
        }

        // Use CDN worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ') + '\n';
        }

        return text.trim() || `[PDF Content - ${file.name}]\nNo text could be extracted from this PDF.`;
      } catch (error) {
        console.warn('PDF parsing failed:', error);
        return `[PDF Content - ${file.name}]\nUnable to extract text from PDF. Please ensure pdfjs-dist is installed or convert to text format.\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      // For text files
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  };

  const generateCards = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const fileContents = await Promise.all(files.map(readFileContent));
      const allContent = [notes, ...fileContents].filter(Boolean).join("\n\n");

      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: allContent })
      });

      const data = await response.json();
      if (!response.ok || !Array.isArray(data.cards)) {
        throw new Error(data?.message || "Failed to generate cards.");
      }

      setGenerated(data.cards);
      if (data.fallback) {
        setStatusMessage(
          typeof data.message === "string" && data.message.trim().length > 0
            ? data.message
            : "Generated cards using fallback mock content."
        );
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
      <p className="mt-1 text-xs text-indigo-700">Paste notes or attach files, then review generated cards before adding them.</p>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="mt-3 h-28 w-full rounded-lg border border-indigo-200 bg-white p-3 text-sm text-slate-700 outline-none ring-indigo-300 focus:ring"
        placeholder="Paste class notes or bullet points..."
      />
      <div className="mt-3">
        <label className="block text-xs text-indigo-700 mb-1">Attach Files (up to 3) - Supports .txt, .md, and .pdf</label>
        <input
          type="file"
          multiple
          accept=".txt,.md,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          disabled={files.length >= 3}
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-700">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
              setFiles([]);
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
