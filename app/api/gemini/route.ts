import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mockGenerateCards } from "@/lib/ai";
import { Flashcard } from "@/lib/types";

const GEMINI_MODEL = "gemini-1.0";

interface GeminiApiRequest {
  notes?: string;
}

interface GeminiApiResponse {
  cards: Flashcard[];
  fallback?: boolean;
  message?: string;
}

const normalizeCard = (item: any): Flashcard | null => {
  if (!item || !item.front || !item.back) {
    return null;
  }

  const difficulty = ["Easy", "Medium", "Hard"].includes(item.difficulty)
    ? item.difficulty
    : "Medium";

  return {
    id: typeof item.id === "string" && item.id.trim().length > 0 ? item.id : crypto.randomUUID(),
    front: String(item.front),
    back: String(item.back),
    difficulty: difficulty as Flashcard["difficulty"]
  };
};

const parseGeneratedCards = (responseText: string): Flashcard[] | null => {
  const parse = (text: string): Flashcard[] | null => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return null;
      const cards: Flashcard[] = [];
      for (const item of parsed) {
        const card = normalizeCard(item);
        if (!card) return null;
        cards.push(card);
      }
      return cards.length > 0 ? cards : null;
    } catch {
      return null;
    }
  };

  let cards = parse(responseText);
  if (cards) {
    return cards;
  }

  const match = responseText.match(/\[[\s\S]*\]/);
  if (match) {
    cards = parse(match[0]);
    if (cards) {
      return cards;
    }
  }

  return null;
};

const generateGeminiCards = async (notes: string): Promise<Flashcard[]> => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key.");
  }

  const googleAI = new GoogleGenerativeAI(apiKey);
  const model = googleAI.getGenerativeModel(
    {
      model: GEMINI_MODEL,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    },
    {
      timeout: 30000
    }
  );

  const prompt = `Convert the following study notes into up to 5 flashcards. Return JSON only, in an array of objects with id, front, back, and difficulty.

Notes:
${notes}`;

  const result = await model.generateContent(prompt);
  const candidateText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error("Gemini did not return text content.");
  }

  const parsedCards = parseGeneratedCards(candidateText);
  if (!parsedCards) {
    throw new Error("Gemini response could not be parsed as flashcards.");
  }

  return parsedCards;
};

export async function POST(req: Request) {
  const body = (await req.json()) as GeminiApiRequest;
  const notes = String(body.notes ?? "").trim();

  if (!notes) {
    return NextResponse.json(
      { cards: [], message: "Please provide notes to generate flashcards." },
      { status: 400 }
    );
  }

  try {
    const cards = await generateGeminiCards(notes);
    return NextResponse.json({ cards, fallback: false } as GeminiApiResponse);
  } catch (error) {
    const fallbackCards = mockGenerateCards(notes);
    return NextResponse.json({
      cards: fallbackCards,
      fallback: true,
      message: error instanceof Error ? error.message : "Gemini fallback to mock cards."
    } as GeminiApiResponse);
  }
}
