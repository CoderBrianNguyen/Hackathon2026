import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.5-flash";

interface EvaluateAnswerRequest {
  question: string;
  studentAnswer: string;
  expectedAnswer: string;
}

interface EvaluationResponse {
  isCorrect: boolean;
  confidence: number; // 0-100
  feedback: string;
  fallback: boolean;
}

const evaluateWithGemini = async (
  question: string,
  studentAnswer: string,
  expectedAnswer: string
): Promise<EvaluationResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const prompt = `You are an educational evaluator. Evaluate if the student's answer correctly answers the question.

Question: ${question}

Expected Answer (reference): ${expectedAnswer}

Student's Answer: ${studentAnswer}

Provide your evaluation in JSON format with the following structure:
{
  "isCorrect": boolean (true if the answer is substantially correct, false if it's incorrect or missing key concepts),
  "confidence": number (0-100, how confident you are in this evaluation),
  "feedback": "string (brief feedback explaining if the answer is correct and why, or what's missing)"
}

Consider:
- Semantic equivalence (the answer conveys the same meaning even if worded differently)
- All key concepts are covered
- The answer addresses the question asked
- Minor spelling or grammar errors should not affect correctness if the meaning is clear

Respond ONLY with valid JSON, no additional text.`;

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
    const parsed = JSON.parse(responseText) as EvaluationResponse;

    // Validate the response has required fields
    if (typeof parsed.isCorrect !== "boolean" || typeof parsed.confidence !== "number" || typeof parsed.feedback !== "string") {
      throw new Error("Invalid evaluation response structure");
    }

    // Ensure confidence is between 0-100
    parsed.confidence = Math.max(0, Math.min(100, parsed.confidence));

    return {
      ...parsed,
      fallback: false
    };
  } catch (error) {
    console.error("Failed to parse Gemini evaluation response", { error, responseText });
    throw new Error("Invalid evaluation response from Gemini");
  }
};

const fallbackEvaluation = (question: string, studentAnswer: string, expectedAnswer: string): EvaluationResponse => {
  // Simple fallback: normalize and compare strings
  const normalize = (str: string) => str.replace(/\s+/g, " ").toLowerCase().trim();
  const isCorrect = normalize(studentAnswer) === normalize(expectedAnswer);

  return {
    isCorrect,
    confidence: isCorrect ? 90 : 20,
    feedback: isCorrect
      ? "Your answer matches the expected answer."
      : "Your answer does not match the expected answer. Please review the material.",
    fallback: true
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvaluateAnswerRequest;

    const { question, studentAnswer, expectedAnswer } = body;

    // Validate inputs
    if (!question || !studentAnswer || !expectedAnswer) {
      return NextResponse.json(
        { error: "Missing required fields: question, studentAnswer, expectedAnswer" },
        { status: 400 }
      );
    }

    // Check if student answer is too short (use simple matching for very short answers)
    const wordCount = studentAnswer.trim().split(/\s+/).length;
    if (wordCount <= 2) {
      const normalize = (str: string) => str.replace(/\s+/g, " ").toLowerCase().trim();
      const isCorrect = normalize(studentAnswer) === normalize(expectedAnswer);
      return NextResponse.json({
        isCorrect,
        confidence: isCorrect ? 95 : 10,
        feedback: isCorrect
          ? "Correct!"
          : `Expected: "${expectedAnswer}"`,
        fallback: false
      } as EvaluationResponse);
    }

    try {
      const evaluation = await evaluateWithGemini(question, studentAnswer, expectedAnswer);
      return NextResponse.json(evaluation);
    } catch (error) {
      console.error("Gemini evaluation failed, using fallback", error);
      const fallback = fallbackEvaluation(question, studentAnswer, expectedAnswer);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error("Unexpected error in evaluate-answer endpoint", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
