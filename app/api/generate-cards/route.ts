import { NextResponse } from "next/server";
import { mockGenerateCards } from "@/lib/ai";
import { Flashcard } from "@/lib/types";

interface GenerateCardsRequest {
  notes?: string;
}

interface GeminiCard {
  question?: unknown;
  answer?: unknown;
  hint?: unknown;
  difficulty?: unknown;
}

const GEMINI_MODEL = "gemini-2.5-flash";

const fallbackFromNotes = (notes: string): Flashcard[] => mockGenerateCards(notes);

const toDifficulty = (value: unknown): Flashcard["difficulty"] => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "hard") return "Hard";
  return "Medium";
};

const toFlashcard = (item: GeminiCard): Flashcard | null => {
  const question = typeof item.question === "string" ? item.question.trim() : "";
  const answer = typeof item.answer === "string" ? item.answer.trim() : "";
  const hint = typeof item.hint === "string" ? item.hint.trim() : "";

  if (!question || !answer) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    front: question,
    back: hint ? `${answer}\n\nHint: ${hint}` : answer,
    difficulty: toDifficulty(item.difficulty)
  };
};

const parseGeminiCards = (rawText: string): Flashcard[] | null => {
  const tryParse = (text: string): Flashcard[] | null => {
    try {
      const parsed = JSON.parse(text) as { cards?: GeminiCard[] };
      if (!parsed || !Array.isArray(parsed.cards)) {
        return null;
      }

      const cards = parsed.cards
        .map((item) => toFlashcard(item))
        .filter((item): item is Flashcard => Boolean(item));

      return cards.length > 0 ? cards : null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(rawText);
  if (direct) {
    return direct;
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return tryParse(jsonMatch[0]);
  }

  return null;
};

const requestGemini = async (notes: string): Promise<Flashcard[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const prompt = `You are generating flashcards from study notes. Return ONLY valid JSON with this exact shape:\n{\n  "cards": [\n    {\n      "question": "string",\n      "answer": "string",\n      "hint": "string",\n      "difficulty": "easy|medium|hard"\n    }\n  ]\n}\nDo not include markdown fences or extra text. Generate 3 to 6 cards based on the notes.\n\nNotes:\n${notes}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const rawResponse = await response.text();

  if (!response.ok) {
    console.error("Gemini API request failed.", {
      status: response.status,
      statusText: response.statusText,
      rawResponse
    });
    throw new Error("Gemini API request failed.");
  }

  let candidateText = "";
  try {
    const parsed = JSON.parse(rawResponse) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (error) {
    console.error("Failed to parse Gemini API wrapper JSON.", { error, rawResponse });
    throw new Error("Invalid Gemini API response wrapper.");
  }

  const cards = parseGeminiCards(candidateText);
  if (!cards) {
    console.error("Failed to parse Gemini card JSON.", {
      candidateText,
      rawResponse
    });
    throw new Error("Could not parse Gemini flashcard JSON.");
  }

  return cards;
};

export async function POST(req: Request) {
  let body: GenerateCardsRequest;
  try {
    body = (await req.json()) as GenerateCardsRequest;
  } catch (error) {
    console.error("Invalid JSON body for /api/generate-cards.", error);
    return NextResponse.json(
      { cards: fallbackFromNotes(""), fallback: true, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const notes = String(body.notes ?? "").trim();
  if (!notes) {
    return NextResponse.json({ cards: [], message: "Please provide notes to generate flashcards." }, { status: 400 });
  }

  try {
    const cards = await requestGemini(notes);
    return NextResponse.json({ cards, fallback: false });
  } catch (error) {
    console.error("/api/generate-cards falling back to mock cards.", error);
    return NextResponse.json({
      cards: fallbackFromNotes(notes),
      fallback: true,
      message: "Gemini generation failed. Showing fallback cards instead."
    });
  }
}
