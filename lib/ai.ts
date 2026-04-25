import { Flashcard } from "@/lib/types";

export const mockGenerateCards = (notes: string): Flashcard[] => {
  const snippets = notes
    .split(/[\.\n]/)
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
