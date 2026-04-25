import { Deck, QuizAttempt } from "./types";

interface HeatmapDay {
  date: string | null;
  label: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface DeckHeatmap {
  weeks: HeatmapDay[][];
  monthLabels: string[];
  maxCount: number;
}

export interface DeckScoreStats {
  lastScore: number | null;
  averageScore: number | null;
  bestScore: number | null;
  averageConfidence: number | null;
  attemptCount: number;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getLevel = (count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0 || maxCount === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
};

export const getDeckScoreStats = (deck: Deck): DeckScoreStats => {
  const attempts = deck.attempts ?? [];

  if (attempts.length === 0) {
    return {
      lastScore: deck.lastScore,
      averageScore: deck.lastScore,
      bestScore: deck.lastScore,
      averageConfidence: null,
      attemptCount: 0
    };
  }

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  const scores = sortedAttempts.map((attempt) => attempt.score);
  const confidenceScores = sortedAttempts
    .map((attempt) => attempt.averageConfidence)
    .filter((value): value is number => typeof value === "number");
  const averageScore = Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  const bestScore = Math.max(...scores);
  const averageConfidence =
    confidenceScores.length > 0
      ? Math.round(confidenceScores.reduce((total, score) => total + score, 0) / confidenceScores.length)
      : null;

  return {
    lastScore: sortedAttempts[0]?.score ?? null,
    averageScore,
    bestScore,
    averageConfidence,
    attemptCount: sortedAttempts.length
  };
};

export const getThreeMonthHeatmap = (attempts: QuizAttempt[], now = new Date()): DeckHeatmap => {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = startOfDay(now);
  start.setMonth(start.getMonth() - 6);

  const dailyCounts = new Map<string, number>();
  for (const attempt of attempts) {
    const attemptDate = new Date(attempt.completedAt);
    if (Number.isNaN(attemptDate.getTime())) {
      continue;
    }

    if (attemptDate < start || attemptDate > end) {
      continue;
    }

    const key = toDateKey(attemptDate);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const leadingPlaceholders = days[0] ? days[0].getDay() : 0;
  const cells: Array<Date | null> = Array.from({ length: leadingPlaceholders }, () => null);
  cells.push(...days);

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const maxCount = Math.max(...dailyCounts.values(), 0);
  const weeks: HeatmapDay[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    const week = cells.slice(index, index + 7).map((date) => {
      if (!date) {
        return {
          date: null,
          label: "",
          count: 0,
          level: 0 as const
        };
      }

      const key = toDateKey(date);
      const count = dailyCounts.get(key) ?? 0;

      return {
        date: key,
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        count,
        level: getLevel(count, maxCount)
      };
    });

    weeks.push(week);
  }

  const monthLabels: string[] = [];
  let previousMonthKey = "";
  for (const week of weeks) {
    const firstDay = week.find((day) => day.date !== null);
    if (!firstDay?.date) {
      monthLabels.push("");
      continue;
    }

    const date = new Date(`${firstDay.date}T12:00:00`);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthKey === previousMonthKey) {
      monthLabels.push("");
      continue;
    }

    monthLabels.push(monthAbbreviations[date.getMonth()]);
    previousMonthKey = monthKey;
  }

  return { weeks, monthLabels, maxCount };
};
