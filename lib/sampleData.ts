import { Deck } from "./types";

export const sampleDecks: Deck[] = [
  {
    id: "deck-plant-bio",
    title: "Plant Biology",
    lastScore: 80,
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
];
