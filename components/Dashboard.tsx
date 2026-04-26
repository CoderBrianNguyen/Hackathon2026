"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Check, ChevronLeft, ChevronRight, FolderPlus, Layers2, Plus } from "lucide-react";
import { Deck, StudyPlan, Subject } from "@/lib/types";
import { DEFAULT_SUBJECT_COLOR, getSubjectColorTokens, normalizeSubjectColor } from "@/lib/subjectColor";
import { DeckCard } from "./DeckCard";
import { Modal } from "./Modal";

type SidebarView = "study-plan" | "all" | "unassigned" | `subject:${string}`;

interface DashboardProps {
  decks: Deck[];
  subjects: Subject[];
  studyPlan: StudyPlan;
  onCreateDeck: (title: string, subjectId: string | null) => void;
  onCreateSubject: (name: string, color: string) => Subject;
  onUpdateSubject: (subjectId: string, patch: { name?: string; color?: string }) => void;
  onDeleteSubject: (subjectId: string) => void;
  onUpdateStudyPlan: (studyPlan: StudyPlan) => void;
  onEditDeck: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
}

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UNASSIGNED_PILL_COLOR = "#94a3b8";

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const parseDateKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const buildMonthCells = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export function Dashboard({
  decks,
  subjects,
  studyPlan,
  onCreateDeck,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
  onUpdateStudyPlan,
  onEditDeck,
  onStartQuiz
}: DashboardProps) {
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState(DEFAULT_SUBJECT_COLOR);
  const [activeView, setActiveView] = useState<SidebarView>("all");
  const today = startOfDay(new Date());
  const todayKey = toDateKey(today);

  const subjectIds = useMemo(() => new Set(subjects.map((subject) => subject.id)), [subjects]);

  const subjectGroups = useMemo(
    () =>
      subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        color: subject.color,
        decks: decks.filter((deck) => deck.subjectId === subject.id)
      })),
    [decks, subjects]
  );

  const unassignedDecks = useMemo(
    () => decks.filter((deck) => !deck.subjectId || !subjectIds.has(deck.subjectId)),
    [decks, subjectIds]
  );

  useEffect(() => {
    if (!activeView.startsWith("subject:")) return;
    const activeSubjectId = activeView.replace("subject:", "");
    if (!subjectIds.has(activeSubjectId)) {
      setActiveView("all");
    }
  }, [activeView, subjectIds]);

  const visibleDecks = useMemo(() => {
    if (activeView === "all") return decks;
    if (activeView === "unassigned") return unassignedDecks;
    if (activeView === "study-plan") return [];
    const activeSubjectId = activeView.replace("subject:", "");
    return decks.filter((deck) => deck.subjectId === activeSubjectId);
  }, [activeView, decks, unassignedDecks]);

  const activeHeading = useMemo(() => {
    if (activeView === "study-plan") return "Study Plan";
    if (activeView === "all") return "All Decks";
    if (activeView === "unassigned") return "Unassigned Decks";
    const activeSubjectId = activeView.replace("subject:", "");
    return subjects.find((subject) => subject.id === activeSubjectId)?.name ?? "Subject";
  }, [activeView, subjects]);

  const activeSubject = useMemo(() => {
    if (!activeView.startsWith("subject:")) return null;
    const activeSubjectId = activeView.replace("subject:", "");
    return subjects.find((subject) => subject.id === activeSubjectId) ?? null;
  }, [activeView, subjects]);

  const activeSubjectDecks = useMemo(() => {
    if (!activeSubject) return [];
    return decks.filter((deck) => deck.subjectId === activeSubject.id);
  }, [activeSubject, decks]);

  const studyPlanPendingCount = useMemo(() => {
    const weekdayKey = `weekday:${today.getDay()}`;
    const dateKey = `date:${todayKey}`;
    const datePlan = studyPlan.dayPlans.find((plan) => plan.key === dateKey);
    const weekdayPlan = studyPlan.dayPlans.find((plan) => plan.key === weekdayKey);
    const assignedIds = Array.from(new Set((datePlan?.deckIds ?? weekdayPlan?.deckIds ?? []).filter(Boolean)));

    return assignedIds.filter((deckId) => {
      const deck = decks.find((candidate) => candidate.id === deckId);
      if (!deck) return false;
      return !(deck.attempts ?? []).some((attempt) => toDateKey(new Date(attempt.completedAt)) === todayKey);
    }).length;
  }, [decks, studyPlan.dayPlans, today, todayKey]);

  const closeDeckModal = () => {
    setIsCreateDeckOpen(false);
    setDeckTitle("");
    setSubjectId("none");
  };

  const closeSubjectModal = () => {
    setIsCreateSubjectOpen(false);
    setSubjectName("");
    setSubjectColor(DEFAULT_SUBJECT_COLOR);
  };

  const handleCreateDeck = (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = deckTitle.trim();
    if (!trimmedTitle) return;

    const resolvedSubjectId = subjectId === "none" ? null : subjectId;
    onCreateDeck(trimmedTitle, resolvedSubjectId);
    setDeckTitle("");
    setSubjectId("none");
    setIsCreateDeckOpen(false);
    setActiveView(resolvedSubjectId ? `subject:${resolvedSubjectId}` : "unassigned");
  };

  const handleCreateSubject = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = subjectName.trim();
    if (!trimmedName) return;

    const createdSubject = onCreateSubject(trimmedName, subjectColor);
    setSubjectName("");
    setSubjectColor(DEFAULT_SUBJECT_COLOR);
    setIsCreateSubjectOpen(false);
    setActiveView(`subject:${createdSubject.id}`);
  };

  return (
    <section className="min-h-screen">
      <aside className="hidden h-screen w-72 flex-col border-r border-slate-200 bg-white p-4 md:fixed md:inset-y-0 md:left-0 md:flex">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RecallRush</h1>
          <p className="mt-1 text-sm text-slate-600">Fast active-recall study sprints with instant feedback.</p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => setIsCreateSubjectOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FolderPlus size={16} />
            New Subject
          </button>
          <button
            onClick={() => setIsCreateDeckOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            New Deck
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto px-1">
          <SidebarContent
            decks={decks}
            studyPlanPendingCount={studyPlanPendingCount}
            activeView={activeView}
            setActiveView={setActiveView}
            subjectGroups={subjectGroups}
            unassignedDecks={unassignedDecks}
          />
        </div>
      </aside>

      <div className="p-4 md:ml-72 md:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:hidden">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900">RecallRush</h1>
            <p className="mt-1 text-sm text-slate-600">Fast active-recall study sprints with instant feedback.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCreateSubjectOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FolderPlus size={16} />
              New Subject
            </button>
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Plus size={16} />
              New Deck
            </button>
          </div>
          <div className="mt-5">
            <SidebarContent
              decks={decks}
              studyPlanPendingCount={studyPlanPendingCount}
              activeView={activeView}
              setActiveView={setActiveView}
              subjectGroups={subjectGroups}
              unassignedDecks={unassignedDecks}
            />
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            {activeView === "study-plan" ? <CalendarCheck2 size={16} className="text-slate-500" /> : <Layers2 size={16} className="text-slate-500" />}
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{activeHeading}</h2>
          </div>

          {activeView === "study-plan" ? (
            <StudyPlanPanel decks={decks} subjects={subjects} studyPlan={studyPlan} onUpdateStudyPlan={onUpdateStudyPlan} />
          ) : activeSubject ? (
            <SubjectDetailPanel
              subject={activeSubject}
              decks={activeSubjectDecks}
              onUpdateSubject={onUpdateSubject}
              onDeleteSubject={(subjectId) => {
                onDeleteSubject(subjectId);
                setActiveView("all");
              }}
              onEditDeck={onEditDeck}
              onStartQuiz={onStartQuiz}
            />
          ) : visibleDecks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No decks in this section yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  subjects={subjects}
                  onEdit={onEditDeck}
                  onStartQuiz={onStartQuiz}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={isCreateDeckOpen}
        title="Create New Deck"
        onClose={closeDeckModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeDeckModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-deck-form"
              disabled={!deckTitle.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Create Deck
            </button>
          </>
        }
      >
        <form id="create-deck-form" onSubmit={handleCreateDeck} className="space-y-4">
          <div>
            <label htmlFor="deck-title" className="text-sm font-medium text-slate-700">
              Deck name
            </label>
            <input
              id="deck-title"
              value={deckTitle}
              onChange={(event) => setDeckTitle(event.target.value)}
              placeholder="e.g. Chemistry Finals"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="deck-subject" className="text-sm font-medium text-slate-700">
              Subject
            </label>
            <select
              id="deck-subject"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="none">No subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        open={isCreateSubjectOpen}
        title="Create Subject"
        onClose={closeSubjectModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeSubjectModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-subject-form"
              disabled={!subjectName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Create Subject
            </button>
          </>
        }
      >
        <form id="create-subject-form" onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label htmlFor="subject-name" className="text-sm font-medium text-slate-700">
              Subject name
            </label>
            <input
              id="subject-name"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Biology"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="subject-color" className="text-sm font-medium text-slate-700">
              Subject color
            </label>
            <input
              id="subject-color"
              type="color"
              value={subjectColor}
              onChange={(event) => setSubjectColor(normalizeSubjectColor(event.target.value))}
              className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-300 bg-transparent p-1"
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}

function SidebarContent({
  decks,
  studyPlanPendingCount,
  activeView,
  setActiveView,
  subjectGroups,
  unassignedDecks
}: {
  decks: Deck[];
  studyPlanPendingCount: number;
  activeView: SidebarView;
  setActiveView: (view: SidebarView) => void;
  subjectGroups: Array<{ id: string; name: string; color: string; decks: Deck[] }>;
  unassignedDecks: Deck[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</h2>
        <div className="mt-2 space-y-1">
          <SidebarButton
            label="Study Plan"
            count={studyPlanPendingCount}
            active={activeView === "study-plan"}
            onClick={() => setActiveView("study-plan")}
          />
          <SidebarButton label="All Decks" count={decks.length} active={activeView === "all"} onClick={() => setActiveView("all")} />
          <SidebarButton
            label="Unassigned"
            count={unassignedDecks.length}
            active={activeView === "unassigned"}
            onClick={() => setActiveView("unassigned")}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subjects</h2>
        <div className="mt-2 space-y-1">
          {subjectGroups.length === 0 ? (
            <p className="text-sm text-slate-500">No subjects yet.</p>
          ) : (
            subjectGroups.map((group) => (
              <SidebarButton
                key={group.id}
                label={group.name}
                count={group.decks.length}
                active={activeView === `subject:${group.id}`}
                color={group.color}
                onClick={() => setActiveView(`subject:${group.id}`)}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unassigned Decks</h2>
        <ul className="mt-2 space-y-1">
          {unassignedDecks.length === 0 ? (
            <li className="text-sm text-slate-500">All decks are assigned.</li>
          ) : (
            unassignedDecks.map((deck) => (
              <li key={`sidebar-${deck.id}`} className="truncate text-sm text-slate-700">
                {deck.title}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function SidebarButton({
  label,
  count,
  active,
  color,
  onClick
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const tokens = color ? getSubjectColorTokens(color) : null;
  const style: CSSProperties | undefined = tokens
    ? active
      ? {
          backgroundColor: tokens.sidebarActiveBg,
          color: tokens.sidebarActiveText,
          borderColor: tokens.sidebarActiveBorder
        }
      : isHovered
        ? {
            backgroundColor: tokens.sidebarHoverBg,
            color: tokens.sidebarHoverText
          }
        : undefined
    : undefined;
  const countStyle: CSSProperties | undefined = tokens
    ? {
        backgroundColor: tokens.badgeBg,
        color: tokens.badgeText
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
        tokens
          ? active
            ? "font-medium"
            : "border-transparent text-slate-700"
          : active
            ? "border-indigo-200 bg-indigo-50 font-medium text-indigo-700"
            : "border-transparent text-slate-700 hover:bg-slate-50"
      }`}
      style={style}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600" style={countStyle}>
        {count}
      </span>
    </button>
  );
}

function SubjectDetailPanel({
  subject,
  decks,
  onUpdateSubject,
  onDeleteSubject,
  onEditDeck,
  onStartQuiz
}: {
  subject: Subject;
  decks: Deck[];
  onUpdateSubject: (subjectId: string, patch: { name?: string; color?: string }) => void;
  onDeleteSubject: (subjectId: string) => void;
  onEditDeck: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
}) {
  const [draftName, setDraftName] = useState(subject.name);
  const [draftColor, setDraftColor] = useState(normalizeSubjectColor(subject.color));
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false);

  useEffect(() => {
    setDraftName(subject.name);
    setDraftColor(normalizeSubjectColor(subject.color));
  }, [subject.id, subject.name, subject.color]);

  const normalizedDraftColor = normalizeSubjectColor(draftColor);
  const hasChanges = draftName.trim() !== subject.name || normalizedDraftColor !== normalizeSubjectColor(subject.color);

  const saveSubject = () => {
    onUpdateSubject(subject.id, {
      name: draftName.trim(),
      color: normalizedDraftColor
    });
  };

  const deleteSubject = () => {
    setIsDeleteSubjectModalOpen(false);
    onDeleteSubject(subject.id);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Subject Settings</h3>
        <p className="mt-1 text-sm text-slate-600">Update the subject name and color used across your deck tags and sidebar.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="subject-name-editor" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subject Name
            </label>
            <input
              id="subject-name-editor"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="subject-color-editor" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subject Color
            </label>
            <input
              id="subject-color-editor"
              type="color"
              value={draftColor}
              onChange={(event) => setDraftColor(event.target.value)}
              className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-300 bg-transparent p-1"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={saveSubject}
            disabled={!draftName.trim() || !hasChanges}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            Save Subject
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteSubjectModalOpen(true)}
            className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
          >
            Delete Subject
          </button>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          No decks in this subject yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              subjects={[subject]}
              onEdit={onEditDeck}
              onStartQuiz={onStartQuiz}
            />
          ))}
        </div>
      )}

      <Modal
        open={isDeleteSubjectModalOpen}
        title="Delete Subject?"
        onClose={() => setIsDeleteSubjectModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDeleteSubjectModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteSubject}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
            >
              Delete Subject
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Delete subject <span className="font-semibold">{subject.name}</span>? Decks in this subject will become unassigned.
        </p>
      </Modal>
    </div>
  );
}

function StudyPlanPanel({
  decks,
  subjects,
  studyPlan,
  onUpdateStudyPlan
}: {
  decks: Deck[];
  subjects: Subject[];
  studyPlan: StudyPlan;
  onUpdateStudyPlan: (studyPlan: StudyPlan) => void;
}) {
  const today = startOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today));
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(today));
  const [isEditingDateDecks, setIsEditingDateDecks] = useState(false);

  const deckById = useMemo(() => new Map(decks.map((deck) => [deck.id, deck])), [decks]);
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const subjectColorById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject.color])), [subjects]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const completedDateKeysByDeckId = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const deck of decks) {
      const completedDates = new Set<string>();
      for (const attempt of deck.attempts ?? []) {
        completedDates.add(toDateKey(new Date(attempt.completedAt)));
      }
      map.set(deck.id, completedDates);
    }

    return map;
  }, [decks]);

  useEffect(() => {
    setIsEditingDateDecks(false);
  }, [selectedDateKey]);

  const getStoredDeckIds = (key: string) =>
    studyPlan.dayPlans.find((plan) => plan.key === key)?.deckIds ?? [];

  const updatePlanEntry = (key: string, deckIds: string[], keepEmpty = false) => {
    const uniqueDeckIds = Array.from(new Set(deckIds));
    const otherPlans = studyPlan.dayPlans.filter((plan) => plan.key !== key);

    onUpdateStudyPlan({
      ...studyPlan,
      mode: "infinite",
      endDate: null,
      dayPlans: keepEmpty || uniqueDeckIds.length > 0 ? [...otherPlans, { key, deckIds: uniqueDeckIds }] : otherPlans
    });
  };

  const getWeekdayDeckIds = (weekdayIndex: number) =>
    getStoredDeckIds(`weekday:${weekdayIndex}`);

  const getEffectiveDateDeckIds = (dateKey: string) => {
    const explicitDatePlan = studyPlan.dayPlans.find((plan) => plan.key === `date:${dateKey}`);
    if (explicitDatePlan) return explicitDatePlan.deckIds;
    return getWeekdayDeckIds(parseDateKey(dateKey).getDay());
  };

  const hasDateOverride = (dateKey: string) =>
    studyPlan.dayPlans.some((plan) => plan.key === `date:${dateKey}`);

  const toggleDeckForWeekday = (weekdayIndex: number, deckId: string) => {
    const key = `weekday:${weekdayIndex}`;
    const existing = getStoredDeckIds(key);
    const nextDeckIds = existing.includes(deckId) ? existing.filter((id) => id !== deckId) : [...existing, deckId];
    updatePlanEntry(key, nextDeckIds);
  };

  const toggleDeckForDate = (dateKey: string, deckId: string) => {
    const existing = getEffectiveDateDeckIds(dateKey);
    const nextDeckIds = existing.includes(deckId) ? existing.filter((id) => id !== deckId) : [...existing, deckId];
    updatePlanEntry(`date:${dateKey}`, nextDeckIds, true);
  };

  const clearDateOverride = (dateKey: string) => {
    const otherPlans = studyPlan.dayPlans.filter((plan) => plan.key !== `date:${dateKey}`);
    onUpdateStudyPlan({
      ...studyPlan,
      mode: "infinite",
      endDate: null,
      dayPlans: otherPlans
    });
  };

  const getSubjectPillColorsForDate = (dateKey: string) => {
    const deckIds = getEffectiveDateDeckIds(dateKey);
    if (deckIds.length === 0) return [];

    const colors: string[] = [];
    const seenColors = new Set<string>();

    for (const deckId of deckIds) {
      const deck = deckById.get(deckId);
      const subjectColor = deck?.subjectId ? subjectColorById.get(deck.subjectId) : null;
      const color = subjectColor ?? UNASSIGNED_PILL_COLOR;
      if (!seenColors.has(color)) {
        seenColors.add(color);
        colors.push(color);
      }
    }

    return colors;
  };

  const isDeckCompletedOnDate = (deckId: string, dateKey: string) =>
    completedDateKeysByDeckId.get(deckId)?.has(dateKey) ?? false;

  const isDateFullyCompleted = (dateKey: string) => {
    const deckIds = getEffectiveDateDeckIds(dateKey);
    if (deckIds.length === 0) return false;
    return deckIds.every((deckId) => isDeckCompletedOnDate(deckId, dateKey));
  };

  const selectedDate = parseDateKey(selectedDateKey);
  const selectedDeckIds = getEffectiveDateDeckIds(selectedDateKey);
  const selectedHasOverride = hasDateOverride(selectedDateKey);
  const selectedDecks = selectedDeckIds
    .map((deckId) => deckById.get(deckId))
    .filter((deck): deck is Deck => Boolean(deck));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Calendar Assignments</h3>
        <p className="mt-1 text-sm text-slate-600">Pick a date and set the decks for that day. Date-level choices override weekly defaults.</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <h4 className="text-sm font-semibold text-slate-800">{formatMonthTitle(visibleMonth)}</h4>
              <button
                type="button"
                onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {WEEKDAY_SHORT_LABELS.map((dayLabel) => (
                <span key={dayLabel}>{dayLabel}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthCells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-14 rounded-md bg-slate-50" />;
                }

                const dateKey = toDateKey(date);
                const isSelected = dateKey === selectedDateKey;
                const isToday = dateKey === toDateKey(today);
                const pillColors = getSubjectPillColorsForDate(dateKey);
                const isFullyCompleted = isDateFullyCompleted(dateKey);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dateKey);
                      setIsEditingDateDecks(false);
                    }}
                    className={`flex h-14 items-center justify-center rounded-md border px-1 py-1 text-xs transition-colors ${
                      isFullyCompleted
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : isSelected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-full w-full max-w-10 flex-col items-center justify-center">
                      <span className={`text-[18px] font-bold leading-none ${isToday && !isSelected && !isFullyCompleted ? "text-indigo-600" : ""}`}>
                        {date.getDate()}
                      </span>
                      {pillColors.length > 0 ? (
                        <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          {pillColors.map((color) => (
                            <span
                              key={`${dateKey}-${color}`}
                              className="inline-block h-full align-top"
                              style={{
                                width: `${100 / pillColors.length}%`,
                                backgroundColor: color
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="mt-1 block h-1.5 w-full rounded-full bg-slate-100" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex h-full min-h-[22rem] flex-col rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-800">{formatDateLabel(selectedDate)}</h4>
              {selectedHasOverride ? (
                <button
                  type="button"
                  onClick={() => clearDateOverride(selectedDateKey)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Use weekly defaults
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-500">Using weekly defaults</span>
              )}
            </div>

            {decks.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No decks available yet.</p>
            ) : isEditingDateDecks ? (
              <div className="mt-3 space-y-2">
                {decks.map((deck) => {
                  const subject = deck.subjectId ? subjectById.get(deck.subjectId) : null;
                  const tokens = subject ? getSubjectColorTokens(subject.color) : null;

                  return (
                    <label key={`${selectedDateKey}-${deck.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedDeckIds.includes(deck.id)}
                        onChange={() => toggleDeckForDate(selectedDateKey, deck.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{deck.title}</span>
                      <span
                        className="ml-auto rounded-full border px-2 py-0.5 text-xs font-medium"
                        style={
                          tokens
                            ? {
                                backgroundColor: tokens.tagBg,
                                borderColor: tokens.tagBorder,
                                color: tokens.tagText
                              }
                            : undefined
                        }
                      >
                        {subject?.name ?? "Unassigned"}
                      </span>
                    </label>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsEditingDateDecks(false)}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Done Editing
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-1 flex-col">
                {selectedDecks.length === 0 ? (
                  <p className="text-sm text-slate-500">No decks assigned for this date.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDecks.map((deck) => {
                      const subject = deck.subjectId ? subjectById.get(deck.subjectId) : null;
                      const tokens = subject ? getSubjectColorTokens(subject.color) : null;
                      const isCompletedForDate = isDeckCompletedOnDate(deck.id, selectedDateKey);

                      return (
                        <li
                          key={`selected-${selectedDateKey}-${deck.id}`}
                          className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
                        >
                          {isCompletedForDate ? (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-block h-4 w-4 rounded-full border border-slate-300 bg-slate-100" />
                          )}
                          <span className="truncate">{deck.title}</span>
                          <span
                            className="ml-auto rounded-full border px-2 py-0.5 text-xs font-medium"
                            style={
                              tokens
                                ? {
                                    backgroundColor: tokens.tagBg,
                                    borderColor: tokens.tagBorder,
                                    color: tokens.tagText
                                  }
                                : undefined
                            }
                          >
                            {subject?.name ?? "Unassigned"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingDateDecks(true)}
                  className="mt-auto w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Edit Decks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Scheduling Rules</h3>
        <p className="mt-1 text-sm text-slate-600">Infinite weekly template used whenever a date does not have its own override.</p>
      </div>

      <div className="space-y-3">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <StudyPlanDayRow
            key={weekday}
            label={weekday}
            decks={decks}
            selectedDeckIds={getWeekdayDeckIds(index)}
            onToggleDeck={(deckId) => toggleDeckForWeekday(index, deckId)}
          />
        ))}
      </div>
    </div>
  );
}

function StudyPlanDayRow({
  label,
  decks,
  selectedDeckIds,
  onToggleDeck
}: {
  label: string;
  decks: Deck[];
  selectedDeckIds: string[];
  onToggleDeck: (deckId: string) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
      {decks.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No decks available yet.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {decks.map((deck) => (
            <label key={`${label}-${deck.id}`} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedDeckIds.includes(deck.id)}
                onChange={() => onToggleDeck(deck.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{deck.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
