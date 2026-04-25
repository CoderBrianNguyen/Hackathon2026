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
      lastScore: 80,
      subjectId: "subject-science",
      attempts: [
        { completedAt: toIsoDaysAgo(50), total: 10, correct: 7, score: 70, averageConfidence: 58 },
        { completedAt: toIsoDaysAgo(14), total: 10, correct: 8, score: 80, averageConfidence: 67 },
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
