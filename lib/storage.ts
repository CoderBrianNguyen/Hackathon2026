import { AppData, Deck, StudyPlan, Subject } from "./types";
import { sampleAppData } from "./sampleData";
import { normalizeSubjectColor } from "./subjectColor";

const STORAGE_KEY = "recallrush_decks_v2";
const LEGACY_STORAGE_KEYS = ["recallrush_decks_v1"];

const normalizeAttempts = (attempts: unknown) => {
  if (!Array.isArray(attempts)) return [];

  return attempts
    .filter((attempt) => typeof attempt === "object" && attempt !== null)
    .map((attempt) => {
      const typedAttempt = attempt as {
        completedAt?: unknown;
        total?: unknown;
        correct?: unknown;
        score?: unknown;
        averageConfidence?: unknown;
      };

      return {
        completedAt: typeof typedAttempt.completedAt === "string" ? typedAttempt.completedAt : new Date().toISOString(),
        total: typeof typedAttempt.total === "number" ? typedAttempt.total : 0,
        correct: typeof typedAttempt.correct === "number" ? typedAttempt.correct : 0,
        score: typeof typedAttempt.score === "number" ? typedAttempt.score : 0,
        averageConfidence: typeof typedAttempt.averageConfidence === "number" ? typedAttempt.averageConfidence : null
      };
    });
};

const normalizeDeck = (deck: Partial<Deck>): Deck => {
  const attempts = normalizeAttempts(deck.attempts);

  return {
    id: deck.id ?? crypto.randomUUID(),
    title: typeof deck.title === "string" ? deck.title : "Untitled Deck",
    cards: Array.isArray(deck.cards) ? deck.cards : [],
    lastScore: typeof deck.lastScore === "number" ? deck.lastScore : null,
    attempts,
    subjectId: typeof deck.subjectId === "string" ? deck.subjectId : null
  };
};

const normalizeSubject = (subject: Partial<Subject>): Subject => ({
  id: subject.id ?? crypto.randomUUID(),
  name: typeof subject.name === "string" && subject.name.trim() ? subject.name.trim() : "Untitled Subject",
  createdAt: typeof subject.createdAt === "string" ? subject.createdAt : new Date().toISOString(),
  color: normalizeSubjectColor(subject.color)
});

const normalizeStudyPlan = (studyPlan: Partial<StudyPlan>): StudyPlan => {
  const dayPlans = Array.isArray(studyPlan.dayPlans)
    ? studyPlan.dayPlans
        .filter((dayPlan) => dayPlan && typeof dayPlan.key === "string")
        .map((dayPlan) => ({
          key: dayPlan.key,
          deckIds: Array.isArray(dayPlan.deckIds)
            ? dayPlan.deckIds.filter((deckId): deckId is string => typeof deckId === "string")
            : []
        }))
    : [];

  return {
    mode: "infinite",
    endDate: null,
    dayPlans
  };
};

const normalizeAppData = (data: Partial<AppData>): AppData => ({
  decks: Array.isArray(data.decks) ? data.decks.map((deck) => normalizeDeck(deck)) : [],
  subjects: Array.isArray(data.subjects) ? data.subjects.map((subject) => normalizeSubject(subject)) : [],
  studyPlan: normalizeStudyPlan(data.studyPlan ?? {})
});

export const loadAppData = (): AppData => {
  if (typeof window === "undefined") {
    return sampleAppData;
  }

  LEGACY_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });

  const rawData = window.localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleAppData));
    return sampleAppData;
  }

  try {
    const parsed = JSON.parse(rawData);

    if (Array.isArray(parsed)) {
      const migrated: AppData = {
        decks: parsed.map((deck) => normalizeDeck(deck as Partial<Deck>)),
        subjects: [],
        studyPlan: normalizeStudyPlan({})
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    const normalized = normalizeAppData(parsed as Partial<AppData>);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleAppData));
    return sampleAppData;
  }
};

export const saveAppData = (data: AppData) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
