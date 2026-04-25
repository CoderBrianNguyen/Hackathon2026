import { Deck } from "./types";
import { sampleDecks } from "./sampleData";

const STORAGE_KEY = "recallrush_decks_v1";

export const loadDecks = (): Deck[] => {
  if (typeof window === "undefined") {
    return sampleDecks;
  }

  const rawDecks = window.localStorage.getItem(STORAGE_KEY);
  if (!rawDecks) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDecks));
    return sampleDecks;
  }

  try {
    return JSON.parse(rawDecks) as Deck[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDecks));
    return sampleDecks;
  }
};

export const saveDecks = (decks: Deck[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
};
