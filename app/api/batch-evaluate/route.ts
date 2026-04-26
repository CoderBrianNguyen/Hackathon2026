import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";

interface AnswerToEvaluate {
  cardId: string;
  question: string;
  studentAnswer: string;
  expectedAnswer: string;
}

interface BatchEvaluationRequest {
  answers: AnswerToEvaluate[];
}

interface EvaluationResult {
  cardId: string;
  isCorrect: boolean;
  confidence: number;
  feedback: string;
}

interface BatchEvaluationResponse {
  evaluations: EvaluationResult[];
  fallback: boolean;
}

const evaluateBatchWithGemini = async (answers: AnswerToEvaluate[]): Promise<EvaluationResult[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  // Create prompt for batch evaluation
  const answersText = answers
    .map(
      (a, i) =>
        `Answer ${i + 1} (Card ID: ${a.cardId}):
Question: ${a.question}
Expected Answer: ${a.expectedAnswer}
Student's Answer: ${a.studentAnswer}`
    )
    .join("\n\n");

  const prompt = `You are an educational evaluator. Evaluate each student answer for correctness.

${answersText}

For each answer, provide evaluation in JSON format with the following structure for an array:
[
  {
    "cardId": "string (the Card ID)",
    "isCorrect": boolean (true if the answer is substantially correct),
    "confidence": number (0-100, evaluation confidence),
    "feedback": "string (brief feedback explaining correctness or what's missing)"
  }
]

Consider:
- Semantic equivalence (same meaning, different wording)
- All key concepts covered
- Addresses the question
- Minor spelling/grammar errors don't affect correctness

Respond ONLY with valid JSON array, no additional text.`;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json"
    }
  });

  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(responseText) as EvaluationResult[];

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    // Validate and normalize each result
    return parsed.map((item) => ({
      cardId: item.cardId,
      isCorrect: typeof item.isCorrect === "boolean" ? item.isCorrect : false,
      confidence: Math.max(0, Math.min(100, typeof item.confidence === "number" ? item.confidence : 50)),
      feedback: typeof item.feedback === "string" ? item.feedback : "No feedback available"
    }));
  } catch (error) {
    console.error("Failed to parse Gemini batch evaluation response", { error, responseText });
    throw new Error("Invalid batch evaluation response from Gemini");
  }
};

const fallbackEvaluation = (answers: AnswerToEvaluate[]): EvaluationResult[] => {
  // Simple fallback: normalize and compare strings
  const normalize = (str: string) => str.replace(/\s+/g, " ").toLowerCase().trim();

  return answers.map((answer) => {
    const isCorrect = normalize(answer.studentAnswer) === normalize(answer.expectedAnswer);
    return {
      cardId: answer.cardId,
      isCorrect,
      confidence: isCorrect ? 90 : 20,
      feedback: isCorrect
        ? "Your answer matches the expected answer."
        : "Your answer does not match the expected answer. Please review the material."
    };
  });
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BatchEvaluationRequest;

    const { answers } = body;

    // Validate inputs
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: answers must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each answer has required fields
    for (const answer of answers) {
      if (!answer.cardId || !answer.question || !answer.studentAnswer || !answer.expectedAnswer) {
        return NextResponse.json(
          { error: "Each answer must have cardId, question, studentAnswer, and expectedAnswer" },
          { status: 400 }
        );
      }
    }

    try {
      const evaluations = await evaluateBatchWithGemini(answers);
      return NextResponse.json({
        evaluations,
        fallback: false
      } as BatchEvaluationResponse);
    } catch (error) {
      console.error("Gemini batch evaluation failed, using fallback", error);
      const evaluations = fallbackEvaluation(answers);
      return NextResponse.json({
        evaluations,
        fallback: true
      } as BatchEvaluationResponse);
    }
  } catch (error) {
    console.error("Unexpected error in batch-evaluate endpoint", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
