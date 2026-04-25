"use client";

import { CSSProperties } from "react";
import { BookOpen, Brain } from "lucide-react";
import { Deck, Subject } from "@/lib/types";
import { getDeckScoreStats, getThreeMonthHeatmap } from "@/lib/deckStats";
import { getSubjectColorTokens } from "@/lib/subjectColor";

interface DeckCardProps {
  deck: Deck;
  subjects: Subject[];
  onEdit: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
}

const heatmapLevelStyles: Record<number, string> = {
  0: "bg-slate-100",
  1: "bg-emerald-100",
  2: "bg-emerald-200",
  3: "bg-emerald-300",
  4: "bg-emerald-500"
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DeckCard({ deck, subjects, onEdit, onStartQuiz }: DeckCardProps) {
  const stats = getDeckScoreStats(deck);
  const heatmap = getThreeMonthHeatmap(deck.attempts ?? []);
  const weekColumns = `repeat(${Math.max(heatmap.weeks.length, 1)}, minmax(0, 1fr))`;
  const deckSubject = subjects.find((subject) => subject.id === deck.subjectId);
  const deckSubjectLabel = deckSubject?.name ?? "Unassigned";
  const subjectTagTokens = deckSubject ? getSubjectColorTokens(deckSubject.color) : null;
  const tagStyle: CSSProperties | undefined = subjectTagTokens
    ? {
        backgroundColor: subjectTagTokens.tagBg,
        borderColor: subjectTagTokens.tagBorder,
        color: subjectTagTokens.tagText
      }
    : undefined;

  const uniqueMonthLabels = Array.from(new Set(heatmap.monthLabels.filter(Boolean)));
  const targetMonthLabelCount = Math.min(5, uniqueMonthLabels.length);
  const distributedMonthLabels =
    targetMonthLabelCount === 0
      ? []
      : Array.from({ length: targetMonthLabelCount }, (_, index) => {
          if (targetMonthLabelCount === 1) {
            return uniqueMonthLabels[0];
          }
          const sourceIndex = Math.round((index / (targetMonthLabelCount - 1)) * (uniqueMonthLabels.length - 1));
          return uniqueMonthLabels[sourceIndex];
        });

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">{deck.title}</h3>
        <span
          className="rounded-full border bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"
          style={tagStyle}
        >
          {deckSubjectLabel}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{deck.cards.length} cards</p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
        <Stat label="Recent Score" value={stats.lastScore} />
        <Stat label="Average Score" value={stats.averageScore} />
        <Stat label="Best Score" value={stats.bestScore} />
        <Stat label="Avg Confidence" value={stats.averageConfidence} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quiz Attempts</p>
        <div className="mt-2 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-2">
          <div />
          <div className="relative h-3">
            {distributedMonthLabels.map((label, index) => {
              const lastIndex = distributedMonthLabels.length - 1;
              const leftPercent = lastIndex <= 0 ? 0 : (index / lastIndex) * 100;
              const translate = index === 0 ? "0%" : index === lastIndex ? "-100%" : "-50%";

              return (
                <p
                  key={`${deck.id}-month-${index}-${label}`}
                  className="absolute top-0 text-[9px] font-medium uppercase tracking-wide text-slate-500"
                  style={{ left: `${leftPercent}%`, transform: `translateX(${translate})` }}
                >
                  {label}
                </p>
              );
            })}
          </div>

          <div className="grid grid-rows-7 gap-1">
            {dayLabels.map((day) => (
              <span key={`${deck.id}-label-${day}`} className="text-[10px] leading-none text-slate-500">
                {day}
              </span>
            ))}
          </div>

          <div className="grid gap-1" style={{ gridTemplateColumns: weekColumns }}>
            {heatmap.weeks.map((week, weekIndex) => (
              <div key={`${deck.id}-week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${deck.id}-day-${weekIndex}-${dayIndex}`}
                    title={day.date ? `${day.label}: ${day.count} attempt${day.count === 1 ? "" : "s"}` : undefined}
                    className={`aspect-square w-full rounded-[3px] ${day.date ? heatmapLevelStyles[day.level] : "bg-transparent"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <p>{stats.attemptCount} total attempts</p>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={`${deck.id}-legend-${level}`} className={`h-2.5 w-2.5 rounded-[2px] ${heatmapLevelStyles[level]}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(deck.id)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <BookOpen size={16} />
          Edit Deck
        </button>
        <button
          onClick={() => onStartQuiz(deck.id)}
          disabled={deck.cards.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          <Brain size={16} />
          Start Quiz
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value === null ? "N/A" : `${value}%`}</p>
    </div>
  );
}
