"use client";

import { CSSProperties, MouseEvent, useId, useMemo, useState } from "react";
import { BookOpen, Brain } from "lucide-react";
import { Deck, Subject } from "@/lib/types";
import { DeckScoreInsights, ScoreHistoryPoint, getDeckScoreInsights, getDeckScoreStats, getThreeMonthHeatmap } from "@/lib/deckStats";
import { getSubjectColorTokens } from "@/lib/subjectColor";
import { Modal } from "./Modal";

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
type ScoreMetricKey = keyof DeckScoreInsights;
type ChartTimeScale = "1D" | "1W" | "1M" | "6M" | "1Y";

const scoreMetricConfigs: Array<{ key: ScoreMetricKey; label: string; modalTitle: string }> = [
  { key: "recentScore", label: "Recent Score", modalTitle: "Recent Score History" },
  { key: "averageScore", label: "Average Score", modalTitle: "Average Score History" },
  { key: "bestScore", label: "Best Score", modalTitle: "Best Score History" },
  { key: "averageConfidence", label: "Avg Confidence", modalTitle: "Average Confidence History" }
];

export function DeckCard({ deck, subjects, onEdit, onStartQuiz }: DeckCardProps) {
  const stats = getDeckScoreStats(deck);
  const insights = getDeckScoreInsights(deck);
  const heatmap = getThreeMonthHeatmap(deck.attempts ?? []);
  const [activeMetric, setActiveMetric] = useState<ScoreMetricKey | null>(null);
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

  const activeMetricConfig = useMemo(
    () => scoreMetricConfigs.find((metric) => metric.key === activeMetric) ?? null,
    [activeMetric]
  );
  const activeInsight = activeMetric ? insights[activeMetric] : null;

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
        {scoreMetricConfigs.map((metric) => {
          const scoreInsight = insights[metric.key];
          return (
            <StatButton
              key={`${deck.id}-${metric.key}`}
              label={metric.label}
              value={scoreInsight.current}
              delta={scoreInsight.delta}
              onClick={() => setActiveMetric(metric.key)}
            />
          );
        })}
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

      <Modal
        open={activeMetric !== null}
        title={activeMetricConfig?.modalTitle ?? "Score History"}
        onClose={() => setActiveMetric(null)}
        maxWidthClassName="max-w-2xl"
        footer={
          <button
            type="button"
            onClick={() => setActiveMetric(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        }
      >
        {activeInsight ? <ScoreHistoryPanel history={activeInsight.history} /> : null}
      </Modal>
    </div>
  );
}

function StatButton({
  label,
  value,
  delta,
  onClick
}: {
  label: string;
  value: number | null;
  delta: number | null;
  onClick: () => void;
}) {
  const deltaColorClass = delta !== null && delta < 0 ? "text-rose-600" : "text-emerald-600";
  const deltaLabel = delta === null ? null : `(${delta >= 0 ? "+" : ""}${delta}%)`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-slate-50 p-2 text-left ring-1 ring-slate-200 transition hover:bg-slate-100"
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-center justify-start gap-1.5">
        <p className="text-sm font-semibold text-slate-800">{value === null ? "N/A" : `${value}%`}</p>
        {value !== null && deltaLabel ? <p className={`text-[10px] font-medium ${deltaColorClass}`}>{deltaLabel}</p> : null}
      </div>
    </button>
  );
}

function ScoreHistoryPanel({ history }: { history: ScoreHistoryPoint[] }) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );
  const reversedHistory = [...sortedHistory].reverse();

  if (sortedHistory.length === 0) {
    return <p className="text-sm text-slate-600">No history yet for this metric.</p>;
  }

  return (
    <div className="space-y-4">
      <ScoreLineChart history={sortedHistory} />

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">History</h4>
        <ul className="mt-2 max-h-[7.5rem] space-y-1 overflow-y-auto px-1 py-1">
          {reversedHistory.map((point, index) => (
            <li key={`${point.completedAt}-${index}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
              <span className="text-slate-600">{formatHistoryDate(point.completedAt)}</span>
              <span className="font-semibold text-slate-800">{point.value === null ? "N/A" : `${point.value}%`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreLineChart({ history }: { history: ScoreHistoryPoint[] }) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const gradientSeed = useId();
  const parsedPoints = history
    .filter((point): point is ScoreHistoryPoint & { value: number } => point.value !== null)
    .map((point) => ({
      ...point,
      timestamp: new Date(point.completedAt).getTime()
    }))
    .filter((point) => Number.isFinite(point.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (parsedPoints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No plottable data points yet.
      </div>
    );
  }

  const plottedPoints = parsedPoints;

  const chartWidth = 160;
  const chartHeight = 102;
  const marginLeft = 8;
  const marginRight = 1;
  const marginTop = 2;
  const marginBottom = 6;
  const plotWidth = chartWidth - marginLeft - marginRight;
  const plotHeight = chartHeight - marginTop - marginBottom;
  const plotBottom = marginTop + plotHeight;
  const gradientId = `score-area-${gradientSeed.replace(/:/g, "")}`;

  const minTime = plottedPoints[0].timestamp;
  const maxTime = plottedPoints[plottedPoints.length - 1].timestamp;
  const timeRange = Math.max(maxTime - minTime, 1);

  const yMin = 0;
  const yMax = 100;
  const valueRange = yMax - yMin;

  const scaleX = (timestamp: number) =>
    marginLeft + ((timestamp - minTime) / timeRange) * plotWidth;
  const scaleY = (value: number) => marginTop + ((yMax - value) / valueRange) * plotHeight;

  const chartCoordinates = plottedPoints.map((point) => {
    const x = plottedPoints.length === 1 ? marginLeft : scaleX(point.timestamp);
    const y = scaleY(Math.max(yMin, Math.min(yMax, point.value)));
    return { x, y };
  });
  const polylinePoints = chartCoordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = (() => {
    if (chartCoordinates.length === 0) return "";
    const firstPoint = chartCoordinates[0];
    const lastPoint = chartCoordinates[chartCoordinates.length - 1];
    const linePath = chartCoordinates.map((point) => `L ${point.x} ${point.y}`).join(" ");
    return `M ${firstPoint.x} ${plotBottom} ${linePath} L ${lastPoint.x} ${plotBottom} Z`;
  })();
  const yTicks = Array.from({ length: 11 }, (_, index) => index * 10);
  const effectiveLabelScale = inferScaleForRange(timeRange);
  const xTicks = buildXAxisTicks({
    minTime,
    maxTime,
    timeRange,
    scale: effectiveLabelScale,
    scaleX
  });
  const hoveredPoint =
    hoveredPointIndex !== null ? { ...plottedPoints[hoveredPointIndex], ...chartCoordinates[hoveredPointIndex] } : null;
  const rangeStartValue = plottedPoints[0].value;
  const rangeEndValue = plottedPoints[plottedPoints.length - 1].value;
  const trendUp = rangeEndValue >= rangeStartValue;
  const trendStroke = trendUp ? "#059669" : "#dc2626";
  const trendFillStrong = trendUp ? "#10b981" : "#ef4444";
  const trendFillSoft = trendUp ? "#d1fae5" : "#fee2e2";
  const tooltipScoreText = hoveredPoint ? `${hoveredPoint.value}%` : "";
  const tooltipTimeText = hoveredPoint ? formatTooltipDate(hoveredPoint.completedAt) : "";
  const tooltipScoreFontSize = 4;
  const tooltipTimeFontSize = 3.3;
  const tooltipPaddingX = 2.2;
  const tooltipPaddingY = 1.6;
  const tooltipLineGap = 1;
  const approxCharWidth = 0.62;
  const tooltipTextWidth = Math.max(
    tooltipScoreText.length * tooltipScoreFontSize * approxCharWidth,
    tooltipTimeText.length * tooltipTimeFontSize * approxCharWidth
  );
  const tooltipWidth = Math.max(34, tooltipTextWidth + tooltipPaddingX * 2);
  const tooltipHeight = tooltipPaddingY * 2 + tooltipScoreFontSize + tooltipLineGap + tooltipTimeFontSize;
  const tooltipOffsetY = 2.8;
  const tooltipPreferredY = hoveredPoint ? hoveredPoint.y - tooltipHeight - tooltipOffsetY : null;
  const tooltipResolvedY =
    hoveredPoint && tooltipPreferredY !== null && tooltipPreferredY < 0.8 ? hoveredPoint.y + tooltipOffsetY : tooltipPreferredY;
  const tooltipX = hoveredPoint
    ? Math.max(0.8, Math.min(chartWidth - tooltipWidth - 0.8, hoveredPoint.x - tooltipWidth / 2))
    : null;
  const tooltipY = hoveredPoint
    ? Math.max(0.8, Math.min(chartHeight - tooltipHeight - 0.8, tooltipResolvedY ?? 0))
    : null;
  const handleChartMouseMove = (event: MouseEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const pointerXRatio = (event.clientX - bounds.left) / bounds.width;
    const pointerX = Math.max(marginLeft, Math.min(marginLeft + plotWidth, pointerXRatio * chartWidth));

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    chartCoordinates.forEach((coordinate, index) => {
      const distance = Math.abs(coordinate.x - pointerX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setHoveredPointIndex(nearestIndex);
  };

  return (
    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2">
        <div className="flex items-center justify-center text-xs font-medium text-slate-500 [writing-mode:vertical-rl] rotate-180">Score</div>
        <div>
          <div className="w-full" style={{ aspectRatio: `${chartWidth} / ${chartHeight}` }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block h-full w-full">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendFillStrong} stopOpacity="0.36" />
                  <stop offset="100%" stopColor={trendFillSoft} stopOpacity="0.04" />
                </linearGradient>
              </defs>
              {yTicks.map((tick) => {
                const y = scaleY(tick);
                return (
                  <g key={`y-tick-${tick}`}>
                    <line x1={marginLeft} y1={y} x2={marginLeft + plotWidth} y2={y} stroke="#cbd5e1" strokeWidth="0.35" />
                    <text x={marginLeft - 2.5} y={y + 1.5} textAnchor="end" fontSize="3.1" fill="#64748b">
                      {Math.round(tick)}
                    </text>
                  </g>
                );
              })}
              {xTicks.map((tick) => {
                const x = plottedPoints.length === 1 ? marginLeft : scaleX(tick.timestamp);
                return (
                  <line key={`x-grid-${tick.timestamp}-${tick.label}`} x1={x} y1={marginTop} x2={x} y2={plotBottom} stroke="#e2e8f0" strokeWidth="0.28" />
                );
              })}

              <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={plotBottom} stroke="#94a3b8" strokeWidth="0.3" />
              <line x1={marginLeft} y1={plotBottom} x2={marginLeft + plotWidth} y2={plotBottom} stroke="#94a3b8" strokeWidth="0.3" />

              {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke={trendStroke}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {hoveredPoint ? (
                <g pointerEvents="none">
                  <line x1={hoveredPoint.x} y1={marginTop} x2={hoveredPoint.x} y2={plotBottom} stroke="#0f172a" strokeWidth="0.32" strokeDasharray="1.2 1.2" opacity="0.65" />
                  <line x1={marginLeft} y1={hoveredPoint.y} x2={marginLeft + plotWidth} y2={hoveredPoint.y} stroke="#0f172a" strokeWidth="0.3" strokeDasharray="1.2 1.2" opacity="0.45" />
                  <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="2.1" fill="#ffffff" stroke={trendStroke} strokeWidth="0.9" />
                  {tooltipX !== null && tooltipY !== null ? (
                    <g>
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx="1.8"
                        fill="#0f172a"
                        opacity="0.96"
                        stroke="#334155"
                        strokeWidth="0.45"
                      />
                      <text
                        x={tooltipX + tooltipPaddingX}
                        y={tooltipY + tooltipPaddingY + tooltipScoreFontSize - 0.2}
                        fontSize={tooltipScoreFontSize}
                        fill="#ffffff"
                      >
                        {tooltipScoreText}
                      </text>
                      <text
                        x={tooltipX + tooltipPaddingX}
                        y={tooltipY + tooltipPaddingY + tooltipScoreFontSize + tooltipLineGap + tooltipTimeFontSize - 0.2}
                        fontSize={tooltipTimeFontSize}
                        fill="#cbd5e1"
                      >
                        {tooltipTimeText}
                      </text>
                    </g>
                  ) : null}
                </g>
              ) : null}

              {xTicks.map((tick, index) => {
                const x = plottedPoints.length === 1 ? marginLeft : scaleX(tick.timestamp);
                const isFirst = index === 0;
                const isLast = index === xTicks.length - 1;
                const textAnchor = isFirst ? "start" : isLast ? "end" : "middle";
                return (
                  <g key={`x-tick-${tick.timestamp}-${tick.label}`}>
                    <line x1={x} y1={plotBottom} x2={x} y2={plotBottom + 1.4} stroke="#94a3b8" strokeWidth="0.28" />
                    <text x={x} y={plotBottom + 4.9} textAnchor={textAnchor} fontSize="2.8" fill="#64748b">
                      {tick.label}
                    </text>
                  </g>
                );
              })}

              <rect
                x={marginLeft}
                y={marginTop}
                width={plotWidth}
                height={plotHeight}
                fill="transparent"
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setHoveredPointIndex(null)}
              />
            </svg>
          </div>
          <p className="mt-1 text-center text-xs font-medium text-slate-500">Time</p>
        </div>
      </div>
    </div>
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return `${datePart} ${timePart}`;
}

function formatTooltipDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return `${datePart} ${timePart}`;
}

function inferScaleForRange(timeRangeMs: number): ChartTimeScale {
  const dayMs = 24 * 60 * 60 * 1000;
  if (timeRangeMs <= dayMs) return "1D";
  if (timeRangeMs <= 7 * dayMs) return "1W";
  if (timeRangeMs <= 30 * dayMs) return "1M";
  if (timeRangeMs <= 182 * dayMs) return "6M";
  return "1Y";
}

function formatTickLabel(timestamp: number, scale: ChartTimeScale) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  if (scale === "1D") {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  if (scale === "1W" || scale === "1M") {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString(undefined, { month: "short" });
}

function buildXAxisTicks({
  minTime,
  maxTime,
  timeRange,
  scale,
  scaleX
}: {
  minTime: number;
  maxTime: number;
  timeRange: number;
  scale: ChartTimeScale;
  scaleX: (timestamp: number) => number;
}) {
  const tickCountByScale: Record<ChartTimeScale, number> = {
    "1D": 6,
    "1W": 6,
    "1M": 7,
    "6M": 6,
    "1Y": 6
  };
  const minTickSpacingByScale: Record<ChartTimeScale, number> = {
    "1D": 22,
    "1W": 22,
    "1M": 16,
    "6M": 18,
    "1Y": 18
  };

  if (timeRange <= 0) {
    return [{ timestamp: maxTime, label: formatTickLabel(maxTime, scale) }];
  }

  const candidateCount = tickCountByScale[scale];
  const candidates = Array.from({ length: candidateCount }, (_, index) => {
    if (candidateCount === 1) return minTime;
    return minTime + (index / (candidateCount - 1)) * timeRange;
  });

  const candidateTicks = candidates.map((timestamp) => ({
    timestamp,
    label: formatTickLabel(timestamp, scale)
  }));

  const uniqueByLabel = candidateTicks.filter((tick, index, arr) => (
    arr.findIndex((candidate) => candidate.label === tick.label) === index
  ));
  const deduped =
    scale === "1D" || scale === "1W"
      ? candidateTicks
      : uniqueByLabel.length > 0
        ? uniqueByLabel
        : candidateTicks;

  const minSpacing = minTickSpacingByScale[scale];
  const spacedTicks: Array<{ timestamp: number; label: string }> = [];

  deduped.forEach((tick) => {
    if (spacedTicks.length === 0) {
      spacedTicks.push(tick);
      return;
    }

    const previousTick = spacedTicks[spacedTicks.length - 1];
    const spacing = scaleX(tick.timestamp) - scaleX(previousTick.timestamp);
    if (spacing >= minSpacing) {
      spacedTicks.push(tick);
    }
  });

  if (spacedTicks.length === 0) {
    spacedTicks.push(deduped[0]);
  }

  const finalTick = deduped[deduped.length - 1];
  const lastSpacedTick = spacedTicks[spacedTicks.length - 1];
  if (finalTick.label !== lastSpacedTick.label) {
    const spacing = scaleX(finalTick.timestamp) - scaleX(lastSpacedTick.timestamp);
    if (spacing >= minSpacing) {
      spacedTicks.push(finalTick);
    } else {
      spacedTicks[spacedTicks.length - 1] = finalTick;
    }
  }

  return spacedTicks;
}
