import { AppData } from "./types";

const toIsoDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const sampleAppData: AppData = {
  subjects: [
    {
      id: "subject-science",
      name: "Science",
      createdAt: toIsoDaysAgo(90),
      color: "#059669"
    },
    {
      id: "subject-math",
      name: "Math",
      createdAt: toIsoDaysAgo(80),
      color: "#2563eb"
    }
  ],
  decks: [
    {
      id: "deck-plant-bio",
      title: "Plant Biology",
      lastScore: 90,
      subjectId: "subject-science",
      attempts: [
        { completedAt: toIsoDaysAgo(360), total: 10, correct: 5, score: 50, averageConfidence: 39 },
        { completedAt: toIsoDaysAgo(335), total: 10, correct: 6, score: 60, averageConfidence: 44 },
        { completedAt: toIsoDaysAgo(312), total: 10, correct: 6, score: 60, averageConfidence: 46 },
        { completedAt: toIsoDaysAgo(289), total: 10, correct: 7, score: 70, averageConfidence: 51 },
        { completedAt: toIsoDaysAgo(265), total: 10, correct: 6, score: 60, averageConfidence: 49 },
        { completedAt: toIsoDaysAgo(242), total: 10, correct: 7, score: 70, averageConfidence: 56 },
        { completedAt: toIsoDaysAgo(218), total: 10, correct: 8, score: 80, averageConfidence: 62 },
        { completedAt: toIsoDaysAgo(194), total: 10, correct: 7, score: 70, averageConfidence: 60 },
        { completedAt: toIsoDaysAgo(172), total: 10, correct: 8, score: 80, averageConfidence: 65 },
        { completedAt: toIsoDaysAgo(148), total: 10, correct: 8, score: 80, averageConfidence: 68 },
        { completedAt: toIsoDaysAgo(126), total: 10, correct: 9, score: 90, averageConfidence: 73 },
        { completedAt: toIsoDaysAgo(103), total: 10, correct: 8, score: 80, averageConfidence: 70 },
        { completedAt: toIsoDaysAgo(81), total: 10, correct: 9, score: 90, averageConfidence: 77 },
        { completedAt: toIsoDaysAgo(65), total: 10, correct: 8, score: 80, averageConfidence: 74 },
        { completedAt: toIsoDaysAgo(50), total: 10, correct: 7, score: 70, averageConfidence: 58 },
        { completedAt: toIsoDaysAgo(34), total: 10, correct: 8, score: 80, averageConfidence: 66 },
        { completedAt: toIsoDaysAgo(14), total: 10, correct: 8, score: 80, averageConfidence: 67 },
        { completedAt: toIsoDaysAgo(7), total: 10, correct: 9, score: 90, averageConfidence: 79 },
        { completedAt: toIsoDaysAgo(2), total: 10, correct: 9, score: 90, averageConfidence: 83 }
      ],
      cards: [
        {
          id: "card-1",
          front: "What organelle is responsible for photosynthesis?",
          back: "Chloroplast",
          difficulty: "Easy"
        },
        {
          id: "card-2",
          front: "What tissue transports water in plants?",
          back: "Xylem",
          difficulty: "Medium"
        },
        {
          id: "card-3",
          front: "What gas do plants absorb during photosynthesis?",
          back: "Carbon dioxide",
          difficulty: "Easy"
        }
      ]
    },
    {
      id: "deck-basic-math",
      title: "Basic Math",
      lastScore: 67,
      subjectId: "subject-math",
      attempts: [
        { completedAt: toIsoDaysAgo(60), total: 6, correct: 4, score: 67, averageConfidence: 50 },
        { completedAt: toIsoDaysAgo(35), total: 6, correct: 5, score: 83, averageConfidence: 72 },
        { completedAt: toIsoDaysAgo(6), total: 6, correct: 4, score: 67, averageConfidence: 61 }
      ],
      cards: [
        {
          id: "card-4",
          front: "What is 9 × 7?",
          back: "63",
          difficulty: "Easy"
        },
        {
          id: "card-5",
          front: "What is the slope-intercept form of a line?",
          back: "y = mx + b",
          difficulty: "Medium"
        },
        {
          id: "card-6",
          front: "What is the square root of 144?",
          back: "12",
          difficulty: "Easy"
        }
      ]
    }
  ],
  studyPlan: {
    mode: "infinite",
    endDate: null,
    dayPlans: []
  }
};
