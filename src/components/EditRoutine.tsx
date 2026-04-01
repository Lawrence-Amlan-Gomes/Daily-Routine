// src/components/EditRoutine.tsx
// Merged EditRoutine — works for Desktop, Tablet, and Mobile layouts.
// The parent (DashBoard) passes the same props to this single component.
"use client";

import { updateRoutine, updateStats, getAIRoutineDoc } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { IRoutineItem, IStatEntry } from "@/store/features/auth/authSlice";
import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "Health",
  "Work",
  "Productivity",
  "Errands",
  "Chores",
  "Groceries",
  "Relax",
  "Sleep",
  "Meals",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_DOT: Record<Category, string> = {
  // Health-related → various calming / fresh greens
  Health: "bg-emerald-500", // nice vibrant green
  Meals: "bg-green-500", // food/health adjacent
  Sleep: "bg-teal-600", // rest + recovery

  // Work-related → professional blues
  Work: "bg-blue-600", // classic work blue
  Productivity: "bg-indigo-500", // deep focus / flow state

  // Low-priority / chores / errands → warm warning tones
  Errands: "bg-orange-500", // errands, moving around
  Chores: "bg-amber-600", // household duties, repetitive
  Groceries: "bg-red-500", // shopping / necessity but draining

  // Neutral / rest
  Relax: "bg-purple-400", // calm downtime (slightly purple-ish)
  Other: "bg-gray-500", // fallback
};

// ─── TimeInputGroup (outside component to prevent remount on re-render) ──────
function TimeInputGroup({
  label,
  hour,
  setHour,
  minute,
  setMinute,
  period,
  setPeriod,
  theme,
}: {
  label: string;
  hour: string;
  setHour: (v: string) => void;
  minute: string;
  setMinute: (v: string) => void;
  period: "AM" | "PM";
  setPeriod: (v: "AM" | "PM") => void;
  theme: boolean;
}) {
  return (
    <div>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="HH"
          maxLength={2}
          value={hour}
          onChange={(e) =>
            setHour(e.target.value.replace(/\D/g, "").slice(0, 2))
          }
          className={`w-full px-2 py-1 border-[1px] focus:border-blue-500 text-center rounded ${
            theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
          }`}
        />
        <input
          type="text"
          maxLength={2}
          placeholder="MM"
          value={minute}
          onChange={(e) =>
            setMinute(e.target.value.replace(/\D/g, "").slice(0, 2))
          }
          className={`w-full px-2 py-1 border-[1px] focus:border-blue-500 text-center rounded ${
            theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
          }`}
        />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
          className={`w-full px-2 py-1 border-[1px] focus:border-blue-500 text-center rounded ${
            theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
          }`}
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────
const daysOfWeek = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

type Day = (typeof daysOfWeek)[number];

// ─── Pure helper functions (no React state) ──────────────────

/** Pad hour/minute and combine with period → "09:05 AM" */
const formatTimePart = (
  hour: string,
  minute: string,
  period: "AM" | "PM",
): string => {
  const h = hour.padStart(2, "0");
  const m = minute.padStart(2, "0");
  return `${h}:${m} ${period}`;
};

/** Convert "09:30 AM" → total minutes since midnight */
const timeToMinutes = (formattedTime: string): number => {
  const match = formattedTime.match(/(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)/i);
  if (!match) return -1;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours === 12) hours = 0;
  hours += period === "PM" ? 12 : 0;

  return hours * 60 + minutes;
};

/** Does a PM→AM transition mean it crosses midnight? */
const isOvernight = (
  startPeriod: "AM" | "PM",
  endPeriod: "AM" | "PM",
): boolean => {
  return startPeriod === "PM" && endPeriod === "AM";
};

/** Check if two time ranges overlap (handles overnight ranges) */
const isOverlapping = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  aOvernight: boolean,
  bOvernight: boolean,
): boolean => {
  const aEndNorm = aOvernight ? aEnd + 1440 : aEnd;
  const bEndNorm = bOvernight ? bEnd + 1440 : bEnd;
  return aStart < bEndNorm && bStart < aEndNorm;
};

/** Get duration in minutes between two time strings */
const getDurationMinutes = (fromStr: string, toStr: string): number => {
  const fromMins = timeToMinutes(fromStr);
  let toMins = timeToMinutes(toStr);

  if (fromMins === -1 || toMins === -1) return -1;

  const fromPeriod = fromStr.endsWith("AM") ? "AM" : "PM";
  const toPeriod = toStr.endsWith("AM") ? "AM" : "PM";
  const overnight = isOvernight(fromPeriod, toPeriod);

  if (overnight) {
    toMins += 1440;
  }

  return toMins - fromMins;
};

const isValidHour = (h: string): boolean => {
  if (h === "") return false;
  const num = parseInt(h, 10);
  return num >= 1 && num <= 12;
};

const isValidMinute = (m: string): boolean => {
  if (m === "") return false;
  const num = parseInt(m, 10);
  return num >= 0 && num <= 59;
};

/** Parse "9:30 AM" → { hour: "9", minute: "30", period: "AM" } */
const parseTime = (timeStr: string) => {
  const match = timeStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return { hour: "", minute: "", period: "AM" as "AM" | "PM" };
  return {
    hour: match[1],
    minute: match[2],
    period: match[3] as "AM" | "PM",
  };
};

// ─── Props ───────────────────────────────────────────────────
// The "variant" prop controls which layout is used:
//   "desktop"  → original EditRoutine (header + search on two rows)
//   "tablet"   → original EditRoutineTablet (search + save in same row)
// Both share 100 % identical logic — only the top layout differs.

interface EditRoutineProps {
  variant?: "desktop" | "tablet";
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDay: Day;
  setSelectedDay: React.Dispatch<React.SetStateAction<Day>>;
  taskSearchQuery: string;
  setTaskSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isPortalOpen: boolean;
  setIsPortalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  fromHour: string;
  setFromHour: React.Dispatch<React.SetStateAction<string>>;
  fromMinute: string;
  setFromMinute: React.Dispatch<React.SetStateAction<string>>;
  fromPeriod: "AM" | "PM";
  setFromPeriod: React.Dispatch<React.SetStateAction<"AM" | "PM">>;
  toHour: string;
  setToHour: React.Dispatch<React.SetStateAction<string>>;
  toMinute: string;
  setToMinute: React.Dispatch<React.SetStateAction<string>>;
  toPeriod: "AM" | "PM";
  setToPeriod: React.Dispatch<React.SetStateAction<"AM" | "PM">>;
  suggestTime: (start?: string, end?: string) => void;
  updateRoutineWithHistory: (
    newRoutine: Record<string, IRoutineItem[]>,
  ) => void;
  saveTrigger: number;
  settingsMode: boolean;
  setSettingsMode: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── Component ───────────────────────────────────────────────
export default function EditRoutine({
  variant = "desktop",
  hasUnsavedChanges,
  setHasUnsavedChanges,
  selectedDay,
  setSelectedDay,
  taskSearchQuery,
  setTaskSearchQuery,
  isPortalOpen,
  setIsPortalOpen,
  newName,
  setNewName,
  fromHour,
  setFromHour,
  fromMinute,
  setFromMinute,
  fromPeriod,
  setFromPeriod,
  toHour,
  setToHour,
  toMinute,
  setToMinute,
  toPeriod,
  setToPeriod,
  updateRoutineWithHistory,
  saveTrigger,
  settingsMode,
  setSettingsMode,
}: EditRoutineProps) {
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();

  // ── Clock tick for re-evaluating active task every minute ──────────
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Is selected day actually today? ────────────────────────────────
  const todayDayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayIndex = new Date().getDay();
  const todayName = todayDayNames[todayIndex] as Day;

  const isToday = selectedDay === todayName;

  const todayDateFormatted = new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-"); // → 07-04-2026

  // ── Local state ────────────────────────────────────────────
  const [tasks, setTasks] = useState<IRoutineItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedDaysForMultiAdd, setSelectedDaysForMultiAdd] = useState<
    Set<Day>
  >(new Set());
  const [selectedDaysForMultiEdit, setSelectedDaysForMultiEdit] = useState<
    Set<Day>
  >(new Set());
  const [swapSearchQuery, setSwapSearchQuery] = useState("");
  const [selectedDaysForSwap, setSelectedDaysForSwap] = useState<Set<Day>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [copyingFromAI, setCopyingFromAI] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newCategory, setNewCategory] = useState<string>("");

  // ── Derived values ─────────────────────────────────────────
  const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
  const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
  const fromMins = timeToMinutes(fromTimeStr);
  const toMins = timeToMinutes(toTimeStr);
  const newOvernight = isOvernight(fromPeriod, toPeriod);
  const duration = getDurationMinutes(fromTimeStr, toTimeStr);

  // ── Sync tasks from auth whenever day or auth changes ──────
  useEffect(() => {
    if (auth?.routine?.[selectedDay]) {
      const dayTasks = [...auth.routine[selectedDay]];
      dayTasks.sort((a, b) => {
        const startA = timeToMinutes(a.time.split(" - ")[0]);
        const startB = timeToMinutes(b.time.split(" - ")[0]);
        return startA - startB;
      });
      setTasks(dayTasks);
    } else {
      setTasks([]);
    }

    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setIsPortalOpen(false);
    setEditingIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, auth]);

  useEffect(() => {
    if (!auth) return; // don't run if not logged in

    const todayDayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const todayName = todayDayNames[todayIndex] as Day;

    // Only change if it's different → prevents unnecessary re-renders
    if (selectedDay !== todayName) {
      setSelectedDay(todayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset helper ───────────────────────────────────────────
  const resetEditForm = () => {
    setNewName("");
    setNewCategory("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);
    setSelectedDaysForMultiEdit(new Set());
    setSwapSearchQuery("");
    setSelectedDaysForSwap(new Set());
  };

  // ─── Copy from AI Routine ──────────────────────────────────
  const handleCopyFromAIRoutine = async () => {
    if (!auth?.email) return;
    const confirmed = confirm(
      "This will replace your entire routine with your AI Routine. You can undo this with Ctrl+Z. Continue?"
    );
    if (!confirmed) return;
    setCopyingFromAI(true);
    try {
      const { aiRoutine } = await getAIRoutineDoc(auth.email);
      updateRoutineWithHistory({ ...aiRoutine });
      setMessage({ type: "success", text: "Copied from AI Routine!" });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch AI Routine." });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setCopyingFromAI(false);
    }
  };

  // ─── Validation: single day ────────────────────────────────
  const singleDayValidationError = useMemo((): string | null => {
    if (!newName.trim()) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1\u201312";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00\u201359";
    if (!isValidHour(toHour)) return "End hour must be 1\u201312";
    if (!isValidMinute(toMinute)) return "End minutes must be 00\u201359";

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    if (newOvernight) {
      const isExactlyMidnightEnd =
        toHour === "12" && toMinute === "00" && toPeriod === "AM";
      if (!isExactlyMidnightEnd) {
        return "Task cannot extend past 12:01 AM into the next day";
      }
    } else {
      if (fromMins >= toMins) {
        return "End time must be after start time";
      }
    }

    if (duration > 1439) return "Task cannot exceed 23 hours 59 minutes";
    if (duration < 5) return "Task must be at least 5 minutes long";

    const hasDuplicateName = tasks.some((task, idx) => {
      if (editingIndex !== null && idx === editingIndex) return false;
      return task.name.toLowerCase() === newName.trim().toLowerCase();
    });
    if (hasDuplicateName)
      return "A task with this name already exists on this day";

    const hasOverlap = tasks.some((task, idx) => {
      if (editingIndex !== null && idx === editingIndex) return false;
      const [existingFrom, existingTo] = task.time.split(" - ");
      const eFrom = timeToMinutes(existingFrom);
      const eTo = timeToMinutes(existingTo);
      if (eFrom === -1 || eTo === -1) return false;
      const existingFromPeriod = existingFrom.endsWith("AM") ? "AM" : "PM";
      const existingToPeriod = existingTo.endsWith("AM") ? "AM" : "PM";
      const existingOvernight = isOvernight(
        existingFromPeriod as "AM" | "PM",
        existingToPeriod as "AM" | "PM",
      );
      return isOverlapping(
        fromMins,
        toMins,
        eFrom,
        eTo,
        newOvernight,
        existingOvernight,
      );
    });
    if (hasOverlap) return "Time overlaps with an existing task on this day";

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newName,
    fromHour,
    fromMinute,
    fromPeriod,
    toHour,
    toMinute,
    toPeriod,
    tasks,
    duration,
    editingIndex,
  ]);

  // ─── Validation: multi-day ADD ─────────────────────────────
  const multiDayAddValidationError = useMemo((): string | null => {
    if (!newName.trim()) return null;
    if (selectedDaysForMultiAdd.size === 0) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1\u201312";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00\u201359";
    if (!isValidHour(toHour)) return "End hour must be 1\u201312";
    if (!isValidMinute(toMinute)) return "End minutes must be 00\u201359";

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    if (newOvernight) {
      const isExactlyMidnightEnd =
        toHour === "12" && toMinute === "00" && toPeriod === "AM";
      if (!isExactlyMidnightEnd) {
        return "Task cannot extend past 12:01 AM into the next day";
      }
    } else {
      if (fromMins >= toMins) return "End time must be after start time";
    }

    if (duration > 1439) return "Task cannot exceed 23 hours 59 minutes";
    if (duration < 5) return "Task must be at least 5 minutes long";

    if (!auth?.routine) return null;

    const newNameLower = newName.trim().toLowerCase();

    const daysWithDuplicateName = Array.from(selectedDaysForMultiAdd).filter(
      (day) => {
        const dayTasks = auth.routine[day] || [];
        return dayTasks.some(
          (task) => task.name.toLowerCase() === newNameLower,
        );
      },
    );
    if (daysWithDuplicateName.length > 0) {
      const formatted = daysWithDuplicateName
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ");
      return `Task name already exists on: ${formatted}`;
    }

    const conflictingDays = Array.from(selectedDaysForMultiAdd).filter(
      (day) => {
        const dayTasks = auth.routine[day] || [];
        return dayTasks.some((task) => {
          const [eFromStr, eToStr] = task.time.split(" - ");
          const eFrom = timeToMinutes(eFromStr);
          const eTo = timeToMinutes(eToStr);
          if (eFrom === -1 || eTo === -1) return false;
          const eFromPeriod = eFromStr.endsWith("AM") ? "AM" : "PM";
          const eToPeriod = eToStr.endsWith("AM") ? "AM" : "PM";
          const eOvernight = isOvernight(
            eFromPeriod as "AM" | "PM",
            eToPeriod as "AM" | "PM",
          );
          return isOverlapping(
            fromMins,
            toMins,
            eFrom,
            eTo,
            newOvernight,
            eOvernight,
          );
        });
      },
    );
    if (conflictingDays.length > 0) {
      const formatted = conflictingDays
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ");
      return `Time overlaps on: ${formatted}`;
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newName,
    fromHour,
    fromMinute,
    fromPeriod,
    toHour,
    toMinute,
    toPeriod,
    auth?.routine,
    duration,
    fromMins,
    toMins,
    newOvernight,
    selectedDaysForMultiAdd,
  ]);

  // ─── Validation: multi-day EDIT ────────────────────────────
  const multiDayEditValidationError = useMemo((): string | null => {
    if (!newName.trim()) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1\u201312";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00\u201359";
    if (!isValidHour(toHour)) return "End hour must be 1\u201312";
    if (!isValidMinute(toMinute)) return "End minutes must be 00\u201359";

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    if (newOvernight) {
      const isExactlyMidnightEnd =
        toHour === "12" && toMinute === "00" && toPeriod === "AM";
      if (!isExactlyMidnightEnd) {
        return "Task cannot extend past 12:01 AM into the next day";
      }
    } else {
      if (fromMins >= toMins) return "End time must be after start time";
    }

    if (duration > 1439) return "Task cannot exceed 23 hours 59 minutes";
    if (duration < 5) return "Task must be at least 5 minutes long";

    if (!auth?.routine || editingIndex === null) return null;

    const originalTaskName = tasks[editingIndex]?.name;
    if (!originalTaskName) return null;

    const selectedDays = selectedDaysForMultiEdit;
    if (selectedDays.size === 0) return null;

    const daysWithTask = Array.from(selectedDays).filter((day) =>
      (auth.routine[day] || []).some((t) => t.name === originalTaskName),
    );
    const daysWithoutTask = Array.from(selectedDays).filter(
      (day) => !daysWithTask.includes(day),
    );
    if (daysWithoutTask.length > 0) {
      const formatted = daysWithoutTask
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ");
      return `This task doesn't exist on: ${formatted}`;
    }

    const newNameLower = newName.trim().toLowerCase();
    const originalNameLower = originalTaskName.toLowerCase();

    const daysWithNameConflict = daysWithTask.filter((day) => {
      return (auth.routine[day] || []).some((t) => {
        if (t.name.toLowerCase() === originalNameLower) return false;
        return t.name.toLowerCase() === newNameLower;
      });
    });
    if (daysWithNameConflict.length > 0) {
      const formatted = daysWithNameConflict
        .map((d) => d.slice(0, 3))
        .join(", ");
      return `Task name already exists on: ${formatted}`;
    }

    const conflictingDays = daysWithTask.filter((day) => {
      const dayTasks = auth.routine[day] || [];
      return dayTasks.some((task) => {
        if (task.name === originalTaskName) return false;
        const [eFromStr, eToStr] = task.time.split(" - ");
        const eFrom = timeToMinutes(eFromStr);
        const eTo = timeToMinutes(eToStr);
        if (eFrom === -1 || eTo === -1) return false;
        const eFromPeriod = eFromStr.endsWith("AM") ? "AM" : "PM";
        const eToPeriod = eToStr.endsWith("AM") ? "AM" : "PM";
        const eOvernight = isOvernight(
          eFromPeriod as "AM" | "PM",
          eToPeriod as "AM" | "PM",
        );
        return isOverlapping(
          fromMins,
          toMins,
          eFrom,
          eTo,
          newOvernight,
          eOvernight,
        );
      });
    });
    if (conflictingDays.length > 0) {
      const formatted = conflictingDays
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ");
      return `Time overlaps on: ${formatted}`;
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newName,
    fromHour,
    fromMinute,
    fromPeriod,
    toHour,
    toMinute,
    toPeriod,
    auth?.routine,
    duration,
    editingIndex,
    tasks,
    selectedDaysForMultiEdit,
    fromMins,
    toMins,
    newOvernight,
  ]);

  // ─── Swap helpers ──────────────────────────────────────────
  const swapTask = useMemo(() => {
    if (!swapSearchQuery.trim() || !auth?.routine) return null;
    const query = swapSearchQuery.trim().toLowerCase();
    for (const day of daysOfWeek) {
      const found = (auth.routine[day] || []).find(
        (t) => t.name.toLowerCase() === query,
      );
      if (found) return found;
    }
    return null;
  }, [swapSearchQuery, auth?.routine]);

  const swapSuggestion = useMemo(() => {
    if (!swapSearchQuery.trim() || !auth?.routine) return null;
    const query = swapSearchQuery.trim().toLowerCase();
    const seen = new Set<string>();
    const results: IRoutineItem[] = [];
    for (const day of daysOfWeek) {
      for (const t of auth.routine[day] || []) {
        if (!seen.has(t.name) && t.name.toLowerCase().startsWith(query)) {
          seen.add(t.name);
          results.push(t);
        }
      }
    }
    return results;
  }, [swapSearchQuery, auth?.routine]);

  const swapValidationError = useMemo((): string | null => {
    if (!swapSearchQuery.trim()) return null;
    if (selectedDaysForSwap.size === 0) return null;
    if (!swapTask) return "No task found with that name";
    if (editingIndex === null) return null;

    const originalTaskName = tasks[editingIndex]?.name;
    if (!originalTaskName) return null;

    const daysWithoutOriginal = Array.from(selectedDaysForSwap).filter(
      (day) =>
        !(auth?.routine[day] || []).some((t) => t.name === originalTaskName),
    );
    if (daysWithoutOriginal.length > 0) {
      return `"${originalTaskName}" doesn't exist on: ${daysWithoutOriginal
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ")}`;
    }

    const daysWithoutSwapTarget = Array.from(selectedDaysForSwap).filter(
      (day) =>
        !(auth?.routine[day] || []).some((t) => t.name === swapTask.name),
    );
    if (daysWithoutSwapTarget.length > 0) {
      return `"${swapTask.name}" doesn't exist on: ${daysWithoutSwapTarget
        .map((d) => d.slice(0, 3))
        .sort()
        .join(", ")}`;
    }

    return null;
  }, [
    swapSearchQuery,
    selectedDaysForSwap,
    swapTask,
    editingIndex,
    tasks,
    auth?.routine,
  ]);

  // ─── Filtered tasks (search) ───────────────────────────────
  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery.trim()) return tasks;
    const query = taskSearchQuery.trim().toLowerCase();
    return tasks.filter((task) => task.name.toLowerCase().includes(query));
  }, [tasks, taskSearchQuery]);

  // ─── Actions ───────────────────────────────────────────────

  const isAddDisabled = !newName.trim() || !!singleDayValidationError;

  /** Add task to the currently selected single day */
  const addTask = () => {
    if (isAddDisabled) return;

    const fullTime = `${formatTimePart(fromHour, fromMinute, fromPeriod)} - ${formatTimePart(toHour, toMinute, toPeriod)}`;
    const newTask: IRoutineItem = {
      name: newName.trim(),
      time: fullTime,
      category: newCategory || "",
    };

    const updatedTasks = [...tasks, newTask].sort(
      (a, b) =>
        timeToMinutes(a.time.split(" - ")[0]) -
        timeToMinutes(b.time.split(" - ")[0]),
    );

    setTasks(updatedTasks);

    if (auth) {
      updateRoutineWithHistory({
        ...auth.routine,
        [selectedDay]: updatedTasks,
      });
    }
    setNewName("");
    setNewCategory("");
    setFromHour("9");
    setFromMinute("00");
    setFromPeriod("AM");
    setToHour("10");
    setToMinute("00");
    setToPeriod("AM");
    setIsPortalOpen(false);
  };

  /** Add task to multiple selected days at once */
  const addTaskToMultipleDays = () => {
    if (
      selectedDaysForMultiAdd.size === 0 ||
      multiDayAddValidationError ||
      !newName.trim()
    )
      return;

    const fullTime = `${formatTimePart(fromHour, fromMinute, fromPeriod)} - ${formatTimePart(toHour, toMinute, toPeriod)}`;
    const newTask: IRoutineItem = {
      name: newName.trim(),
      time: fullTime,
      category: newCategory || "",
    };

    if (auth) {
      const updatedRoutine = { ...auth.routine };
      Array.from(selectedDaysForMultiAdd).forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        const newTasks = [...currentTasks, newTask].sort(
          (a, b) =>
            timeToMinutes(a.time.split(" - ")[0]) -
            timeToMinutes(b.time.split(" - ")[0]),
        );
        updatedRoutine[day] = newTasks;
      });

      updateRoutineWithHistory(updatedRoutine);
      setTasks(updatedRoutine[selectedDay] || []);
    }
    setNewName("");
    setNewCategory("");
    setFromHour("9");
    setFromMinute("00");
    setFromPeriod("AM");
    setToHour("10");
    setToMinute("00");
    setToPeriod("AM");
    setSelectedDaysForMultiAdd(new Set());
    setIsPortalOpen(false);
    setMessage({
      type: "success",
      text: `Added to ${selectedDaysForMultiAdd.size} day(s)!`,
    });
    setTimeout(() => setMessage(null), 2000);
  };

  /** Open the edit form for a task */
  const openEditPortal = (index: number) => {
    const task = tasks[index];
    const [fromTime, toTime] = task.time.split(" - ");
    const fromParsed = parseTime(fromTime);
    const toParsed = parseTime(toTime);

    setNewName(task.name);
    setNewCategory(task.category || "");
    setFromHour(fromParsed.hour);
    setFromMinute(fromParsed.minute);
    setFromPeriod(fromParsed.period);
    setToHour(toParsed.hour);
    setToMinute(toParsed.minute);
    setToPeriod(toParsed.period);
    setEditingIndex(index);

    if (auth?.routine) {
      const daysWithThisTask = daysOfWeek.filter((day) =>
        (auth.routine[day] || []).some((t) => t.name === task.name),
      );
      setSelectedDaysForMultiEdit(new Set(daysWithThisTask));
    }
  };

  /** Edit the task on the current day only */
  const editTask = () => {
    if (isAddDisabled || editingIndex === null) return;

    const fullTime = `${formatTimePart(fromHour, fromMinute, fromPeriod)} - ${formatTimePart(toHour, toMinute, toPeriod)}`;
    const updatedTask: IRoutineItem = {
      name: newName.trim(),
      time: fullTime,
      category: newCategory || "",
    };

    const updatedTasks = tasks
      .map((task, idx) => (idx === editingIndex ? updatedTask : task))
      .sort(
        (a, b) =>
          timeToMinutes(a.time.split(" - ")[0]) -
          timeToMinutes(b.time.split(" - ")[0]),
      );

    setTasks(updatedTasks);
    if (auth) {
      updateRoutineWithHistory({
        ...auth.routine,
        [selectedDay]: updatedTasks,
      });
    }
    setNewName("");
    setNewCategory("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);
  };

  /** Edit the task across multiple selected days */
  const editTaskOnSelectedDays = () => {
    if (
      editingIndex === null ||
      selectedDaysForMultiEdit.size === 0 ||
      !!multiDayEditValidationError ||
      !newName.trim()
    )
      return;

    const fullTime = `${formatTimePart(fromHour, fromMinute, fromPeriod)} - ${formatTimePart(toHour, toMinute, toPeriod)}`;
    const updatedTask: IRoutineItem = {
      name: newName.trim(),
      time: fullTime,
      category: newCategory || "",
    };
    const originalTaskName = tasks[editingIndex].name;

    if (auth) {
      const updatedRoutine = { ...auth.routine };
      Array.from(selectedDaysForMultiEdit).forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        if (currentTasks.some((t) => t.name === originalTaskName)) {
          const newTasks = currentTasks
            .map((t) => (t.name === originalTaskName ? updatedTask : t))
            .sort(
              (a, b) =>
                timeToMinutes(a.time.split(" - ")[0]) -
                timeToMinutes(b.time.split(" - ")[0]),
            );
          updatedRoutine[day] = newTasks;
        }
      });
      updateRoutineWithHistory(updatedRoutine);
      setTasks(updatedRoutine[selectedDay] || []);
    }
    resetEditForm();
    setMessage({
      type: "success",
      text: `Updated on ${selectedDaysForMultiEdit.size} day(s)!`,
    });
    setTimeout(() => setMessage(null), 2000);
  };

  /** Swap task times across selected days */
  const swapTaskOnSelectedDays = () => {
    if (
      editingIndex === null ||
      selectedDaysForSwap.size === 0 ||
      !!swapValidationError ||
      !swapTask
    )
      return;

    const originalTaskName = tasks[editingIndex].name;
    if (auth) {
      const updatedRoutine = { ...auth.routine };
      Array.from(selectedDaysForSwap).forEach((day) => {
        const dayTasks = [...(updatedRoutine[day] || [])];
        const idxA = dayTasks.findIndex((t) => t.name === originalTaskName);
        const idxB = dayTasks.findIndex((t) => t.name === swapTask.name);
        if (idxA === -1 || idxB === -1) return;
        const tempTime = dayTasks[idxA].time;
        dayTasks[idxA] = { ...dayTasks[idxA], time: dayTasks[idxB].time };
        dayTasks[idxB] = { ...dayTasks[idxB], time: tempTime };
        dayTasks.sort(
          (a, b) =>
            timeToMinutes(a.time.split(" - ")[0]) -
            timeToMinutes(b.time.split(" - ")[0]),
        );
        updatedRoutine[day] = dayTasks;
      });
      updateRoutineWithHistory(updatedRoutine);
      setTasks(updatedRoutine[selectedDay] || []);
    }
    setSwapSearchQuery("");
    setSelectedDaysForSwap(new Set());
    setMessage({
      type: "success",
      text: `Swapped on ${selectedDaysForSwap.size} day(s)!`,
    });
    setTimeout(() => setMessage(null), 2000);
  };

  /** Delete the task from every day of the week */
  const deleteTaskFromEveryDay = () => {
    if (editingIndex === null) return;
    const sure = confirm(
      `Are you sure you want to delete this task: ${tasks[editingIndex].name} from every day?`,
    );
    if (!sure) return;
    const taskNameToDelete = tasks[editingIndex].name;
    if (auth) {
      const updatedRoutine = { ...auth.routine };
      daysOfWeek.forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        updatedRoutine[day] = currentTasks.filter(
          (task) => task.name !== taskNameToDelete,
        );
      });
      updateRoutineWithHistory(updatedRoutine);
      setTasks(updatedRoutine[selectedDay] || []);
    }
    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);
    setMessage({ type: "success", text: "Deleted from every day!" });
    setTimeout(() => setMessage(null), 2000);
  };

  /** Toggle task completion for today */
  const completeTask = async (taskName: string) => {
    if (!auth?.email) return;

    const todayDayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = todayDayNames[new Date().getDay()];
    const _n = new Date();
    const todayDate = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`;

    const existingStats: IStatEntry[] = Array.isArray(auth.stats)
      ? [...auth.stats]
      : [];

    const todayEntry = existingStats.find((s) => s.date === todayDate);
    const alreadyCompleted =
      todayEntry?.completedTasks.includes(taskName) ?? false;

    // Only ask for confirmation when UNCHECKING (removing completion)
    let proceed = true;
    if (alreadyCompleted) {
      proceed = confirm(
        `Are you sure you want to unmark "${taskName}" as completed today?`,
      );
    }

    if (!proceed) return;

    // Total tasks logic — exclude dummy tasks
    const routineTaskCount = (
      auth.routine?.[todayKey as keyof typeof auth.routine] || []
    ).filter((t) => t.name !== "dummy").length;
    const alreadyCompletedCount = todayEntry?.completedTasks.length ?? 0;
    const totalTasks = Math.max(routineTaskCount, alreadyCompletedCount);

    let newStats: IStatEntry[];
    if (todayEntry) {
      const updatedCompletedTasks = alreadyCompleted
        ? todayEntry.completedTasks.filter((t) => t !== taskName)
        : [...todayEntry.completedTasks, taskName];

      const freshTotal = Math.max(
        routineTaskCount,
        updatedCompletedTasks.length,
      );

      newStats = existingStats.map((s) => {
        if (s.date !== todayDate) return s;
        return {
          ...s,
          totalTasks: freshTotal,
          completedTasks: updatedCompletedTasks,
        };
      });
    } else {
      newStats = [
        ...existingStats,
        {
          date: todayDate,
          day: todayKey,
          totalTasks,
          completedTasks: [taskName],
        },
      ];
    }

    // Update Redux immediately
    setAuth({ ...auth, stats: newStats });

    // Persist to DB
    try {
      await updateStats(auth.email, newStats);
    } catch {
      // Revert on failure
      setAuth({ ...auth, stats: existingStats });
    }
  };

  /** Remove a single task from the current day only */
  const removeTask = (index: number, name: string) => {
    const sure = confirm(
      `Are you sure you want to delete this task: ${name} from ${selectedDay
        .charAt(0)
        .toUpperCase()}${selectedDay.slice(1)}?`,
    );
    if (!sure) return;
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
    if (auth) {
      updateRoutineWithHistory({
        ...auth.routine,
        [selectedDay]: updatedTasks,
      });
    }
  };

  /** Save the current routine to the database */
  const saveToDatabase = async () => {
    if (!auth?.email || !hasUnsavedChanges) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateRoutine(auth.email, auth.routine);
      setMessage({ type: "success", text: "Saved!" });
      setHasUnsavedChanges(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessage({ type: "error", text: "Save failed" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  // ─── Save on Ctrl+S trigger ───────────────────────────────
  useEffect(() => {
    if (saveTrigger > 0) saveToDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger]);

  // ─── Settings panel state ─────────────────────────────────
  const [selectedShiftDays, setSelectedShiftDays] = useState<Set<Day>>(new Set());
  const [shiftDirection, setShiftDirection] = useState<"up" | "down">("up");
  const [shiftMinutes, setShiftMinutes] = useState<number>(30);
  const [shiftHours, setShiftHours] = useState<number>(0);

  // ─── Early return: not logged in ──────────────────────────
  if (!auth) {
    return <div className="p-4 text-center text-sm">Log in to edit</div>;
  }

  // ─── Current active task (for blinking highlight) ──────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const currentActiveTask = useMemo(() => {
    const now = new Date();
    // eslint-disable-next-line prefer-const
    let nowMins = now.getHours() * 60 + now.getMinutes();
    for (const task of tasks) {
      if (!task.time?.includes(" - ")) continue;
      const [startStr, endStr] = task.time.split(" - ").map((s) => s.trim());
      const start = timeToMinutes(startStr);
      let end = timeToMinutes(endStr);
      if (end === 0) end = 1440; // midnight end
      if (end < start) end += 1440; // overnight
      const nowNorm = end < start ? (nowMins < start ? nowMins + 1440 : nowMins) : nowMins;
      if (nowNorm >= start && nowNorm < end) return task.name;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, nowTick]);

  // ─── Preview text ──────────────────────────────────────────
  const previewFrom = formatTimePart(
    fromHour || "HH",
    fromMinute || "MM",
    fromPeriod,
  );
  const previewTo = formatTimePart(toHour || "HH", toMinute || "MM", toPeriod);

  // ─── Shared sub-components (inline) ────────────────────────
  // These tiny helper renderers keep the JSX DRY.

  /** Multi-day pill selector (reused for Add, Edit, Swap) */
  const DayPills = ({
    selected,
    setSelected,
    showAll,
    allLabel,
    allDays,
  }: {
    selected: Set<Day>;
    setSelected: (s: Set<Day>) => void;
    showAll?: boolean;
    allLabel?: string;
    allDays?: Day[];
  }) => (
    <div className="flex flex-wrap gap-1">
      {showAll && allDays && (
        <button
          onClick={() => {
            const allSelected = allDays.every((d) => selected.has(d));
            setSelected(allSelected ? new Set() : new Set(allDays));
          }}
          className={`px-3 py-1 text-xs rounded-md font-medium transition ${
            allDays.every((d) => selected.has(d))
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : theme
                ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {allLabel || "All"}
        </button>
      )}
      {daysOfWeek.map((day) => (
        <button
          key={day}
          onClick={() => {
            const newSet = new Set(selected);
            if (newSet.has(day)) newSet.delete(day);
            else newSet.add(day);
            setSelected(newSet);
          }}
          className={`px-2 py-1 text-xs rounded-md capitalize transition ${
            selected.has(day)
              ? "bg-blue-600 text-white"
              : theme
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {day.slice(0, 3)}
        </button>
      ))}
    </div>
  );

  // ─── JSX ───────────────────────────────────────────────────
  // "desktop" variant: header bar + search bar on separate rows
  // "tablet"  variant: search bar + save button on a single row, day pills offset

  // ─── Settings panel (shift tasks) ─────────────────────────
  const minutesToTimeStr = (mins: number): string => {
    let h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
    const m = ((mins % 1440) + 1440) % 1440 % 60;
    const ampm = h < 12 ? "AM" : "PM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const applyShift = () => {
    if (selectedShiftDays.size === 0 || !auth?.routine) return;
    const totalShiftMinutes = shiftHours * 60 + shiftMinutes;
    if (totalShiftMinutes <= 0) {
      alert("Please enter a shift amount greater than 0.");
      return;
    }

    const updatedRoutine = { ...auth.routine };

    Array.from(selectedShiftDays).forEach((day) => {
      const dayTasks = updatedRoutine[day] || [];
      const newTasks: IRoutineItem[] = [];

      dayTasks.forEach((task) => {
        if (!task.time?.includes(" - ")) { newTasks.push(task); return; }
        const [startStr, endStr] = task.time.split(" - ").map((s) => s.trim());
        const startMins = timeToMinutes(startStr);
        let endMins = timeToMinutes(endStr);
        if (isNaN(startMins) || isNaN(endMins)) { newTasks.push(task); return; }

        const overnight = endMins < startMins;
        if (overnight) endMins += 1440;
        const originalDuration = endMins - startMins;

        const shift = shiftDirection === "up" ? -totalShiftMinutes : totalShiftMinutes;
        const newStart = ((startMins + shift) % 1440 + 1440) % 1440;
        const newEnd = ((endMins + shift) % 1440 + 1440) % 1440;

        const crossesMidnight = newEnd < newStart || (newEnd === newStart && originalDuration > 0);
        if (crossesMidnight) {
          newTasks.push({ ...task, time: `${minutesToTimeStr(newStart)} - ${minutesToTimeStr(1440)}` });
          newTasks.push({ ...task, name: `${task.name} copy`, time: `${minutesToTimeStr(0)} - ${minutesToTimeStr(newEnd === 0 ? 1440 : newEnd)}` });
        } else {
          newTasks.push({ ...task, time: `${minutesToTimeStr(newStart)} - ${minutesToTimeStr(newEnd)}` });
        }
      });

      newTasks.sort((a, b) => timeToMinutes(a.time.split(" - ")[0]) - timeToMinutes(b.time.split(" - ")[0]));
      updatedRoutine[day] = newTasks;
    });

    updateRoutineWithHistory(updatedRoutine);
    setShiftHours(0);
    setShiftMinutes(30);
    setSelectedShiftDays(new Set());
    setSettingsMode(false);
  };

  if (settingsMode) {
    return (
      <div
        className={`w-full h-full flex flex-col ${theme ? "bg-gray-50" : "bg-gray-950 text-gray-100"}`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex-shrink-0 flex items-center justify-end ${theme ? "border-gray-200" : "border-gray-800"}`}>
          <h2 className="text-lg font-bold">Shift Tasks</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Select days */}
          <div className={`p-3 rounded border ${theme ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"}`}>
            <p className={`text-xs font-medium mb-2 ${theme ? "text-gray-500" : "text-gray-400"}`}>Select days</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedShiftDays(selectedShiftDays.size === 7 ? new Set() : new Set(daysOfWeek))}
                className={`px-2 py-1 text-xs font-medium rounded-md transition border ${
                  selectedShiftDays.size === 7
                    ? "bg-blue-600 text-white border-blue-600"
                    : theme ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300" : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                }`}
              >
                All
              </button>
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    const s = new Set(selectedShiftDays);
                    if (s.has(day)) s.delete(day); else s.add(day);
                    setSelectedShiftDays(s);
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-md capitalize transition border ${
                    selectedShiftDays.has(day)
                      ? "bg-blue-600 text-white border-blue-600"
                      : theme ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300" : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className={`p-3 rounded border ${theme ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"}`}>
            <p className={`text-xs font-medium mb-2 ${theme ? "text-gray-500" : "text-gray-400"}`}>Direction</p>
            <div className="grid grid-cols-2 gap-2">
              {(["up", "down"] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setShiftDirection(dir)}
                  className={`py-2 rounded text-xs font-medium transition border ${
                    shiftDirection === dir
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : theme ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  {dir === "up" ? "⬆ Earlier" : "⬇ Later"}
                </button>
              ))}
            </div>
          </div>

          {/* Shift amount */}
          <div className={`p-3 rounded border ${theme ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"}`}>
            <p className={`text-xs font-medium mb-2 ${theme ? "text-gray-500" : "text-gray-400"}`}>Shift by</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs opacity-70 mb-1">Hours</div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH"
                  maxLength={2}
                  value={shiftHours === 0 ? "" : String(shiftHours)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                    if (raw === "") { setShiftHours(0); return; }
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) setShiftHours(Math.min(23, v));
                  }}
                  className={`w-full px-2 py-1 border-[1px] focus:border-blue-500 text-center rounded outline-none ${
                    theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Minutes</div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  maxLength={2}
                  value={shiftMinutes === 0 ? "" : String(shiftMinutes)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                    if (raw === "") { setShiftMinutes(0); return; }
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) setShiftMinutes(Math.min(59, v));
                  }}
                  className={`w-full px-2 py-1 border-[1px] focus:border-blue-500 text-center rounded outline-none ${
                    theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
                  }`}
                />
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Total</div>
                <div className={`w-full px-2 py-1 border-[1px] text-center rounded text-xs font-medium ${
                  theme ? "bg-gray-50 border-gray-300 text-gray-600" : "bg-gray-800 border-gray-700 text-gray-400"
                }`}>
                  {shiftHours * 60 + shiftMinutes}m
                </div>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={applyShift}
            disabled={selectedShiftDays.size === 0 || shiftHours * 60 + shiftMinutes < 1}
            className={`w-full py-2 rounded font-medium text-sm transition flex items-center justify-center gap-1.5 ${
              selectedShiftDays.size === 0 || shiftHours * 60 + shiftMinutes < 1
                ? theme ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            ✓ Apply Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col ${
        theme
          ? "bg-gray-50 border-gray-200"
          : "bg-gray-950 text-gray-100 border-gray-800"
      }`}
    >
      <style>{`
        @keyframes task-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .task-blink {
          animation: task-blink 1.4s ease-in-out infinite;
        }
      `}</style>
      {/* ─── Header (desktop only) ─────────────────── */}
      {variant === "desktop" && (
        <div className="p-4 border-b border-inherit flex-shrink-0">
          <h2 className="text-lg font-bold text-center pt-1">Edit Routine</h2>
        </div>
      )}

      {/* ─── Day Pills ─────────────────────────────── */}
      <div
        className={`flex flex-wrap gap-1 ${
          variant === "tablet" ? "pl-[18%] sm:pl-[25%] p-3" : "p-3"
        } flex-shrink-0`}
      >
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-2 py-1 text-xs rounded-md capitalize transition ${
              selectedDay === day
                ? "bg-blue-600 text-white shadow-sm"
                : theme
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {variant === "tablet" && (
        <div className="px-3 mb-2 flex items-center text-sm">
          <div className="flex items-center gap-2.5">
            <span className="font-medium capitalize">{selectedDay}</span>
            {isToday && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {todayDateFormatted}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Search + Save row ─────────────────────── */}
      {variant === "tablet" ? (
        /* Tablet/Mobile: 3 rows — search, day capsules, buttons */
        <div className="mx-3 mb-3 flex-shrink-0 flex flex-col gap-2">
          {/* Row 1: Search */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder={`Search tasks on ${selectedDay.charAt(0).toUpperCase()}${selectedDay.slice(1)}...`}
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className={`w-full px-3 py-2 pr-10 text-sm rounded border transition ${
                theme
                  ? "bg-white border-gray-300 focus:border-blue-500 placeholder-gray-500"
                  : "bg-gray-900 border-gray-700 focus:border-blue-500 placeholder-gray-500 text-gray-100"
              } outline-none`}
            />
            {taskSearchQuery && (
              <button
                onClick={() => setTaskSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 text-lg"
              >
                ×
              </button>
            )}
          </div>
          {/* Row 2: Day + date label */}
          <div className="flex items-center gap-2.5 px-0.5">
            <span className="text-sm font-medium capitalize">{selectedDay}</span>
            {isToday && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{todayDateFormatted}</span>
            )}
          </div>
          {/* Row 3: Buttons */}
          <div className="flex items-center gap-1.5">
            {(auth?.paymentType?.toLowerCase() ?? "").includes("premium") && (
              <button
                onClick={handleCopyFromAIRoutine}
                disabled={copyingFromAI}
                className={`whitespace-nowrap text-[12px] font-medium py-2 px-2.5 rounded transition ${
                  copyingFromAI
                    ? theme
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : theme
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
                      : "bg-purple-950/50 text-purple-300 hover:bg-purple-900/60 border border-purple-700"
                }`}
              >
                {copyingFromAI ? "Copying..." : "✦ Copy From AI"}
              </button>
            )}
            <button
              onClick={saveToDatabase}
              disabled={loading || !hasUnsavedChanges}
              className={`whitespace-nowrap text-[12px] font-medium py-2 px-3.5 rounded transition ${
                loading || !hasUnsavedChanges
                  ? theme
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {loading
                ? "Saving..."
                : hasUnsavedChanges
                  ? "Save \u2022"
                  : "Saved"}
            </button>
          </div>
        </div>
      ) : (
        /* Desktop: search on its own row, then day title + save */
        <>
          <div className="mx-3 mb-3 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search tasks on ${selectedDay.charAt(0).toUpperCase()}${selectedDay.slice(1)}...`}
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className={`w-full px-3 py-2 pr-10 text-sm rounded border transition ${
                  theme
                    ? "bg-white border-gray-300 focus:border-blue-500 placeholder-gray-500"
                    : "bg-gray-900 border-gray-700 focus:border-blue-500 placeholder-gray-500 text-gray-100"
                } outline-none`}
              />
              {taskSearchQuery && (
                <button
                  onClick={() => setTaskSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 text-lg"
                >
                  ×
                </button>
              )}
            </div>
            {taskSearchQuery.trim() && filteredTasks.length === 0 && (
              <p className="text-xs text-red-500 text-center mt-2">
                No tasks found
              </p>
            )}
            {taskSearchQuery.trim() && filteredTasks.length > 0 && (
              <p className="text-xs text-center mt-2 opacity-70">
                {filteredTasks.length} of {tasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""} shown
              </p>
            )}
          </div>

          <div className="mx-3 flex flex-col gap-1.5 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-medium capitalize">{selectedDay}</h3>
              {isToday && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {todayDateFormatted}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {(auth?.paymentType?.toLowerCase() ?? "").includes("premium") && (
                <button
                  onClick={handleCopyFromAIRoutine}
                  disabled={copyingFromAI}
                  className={`text-[12px] font-medium py-1 px-2 rounded transition ${
                    copyingFromAI
                      ? theme
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : theme
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
                        : "bg-purple-950/50 text-purple-300 hover:bg-purple-900/60 border border-purple-700"
                  }`}
                >
                  {copyingFromAI ? "Copying..." : "✦ Copy From AI"}
                </button>
              )}
              <button
                onClick={saveToDatabase}
                disabled={loading || !hasUnsavedChanges}
                className={`text-[12px] font-medium py-1 px-2 rounded transition ${
                  loading || !hasUnsavedChanges
                    ? theme
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading
                  ? "Saving..."
                  : hasUnsavedChanges
                    ? "Save \u2022"
                    : "Saved"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Tablet-only: search result hints + status ──── */}
      {variant === "tablet" && taskSearchQuery.trim() && (
        <p className={`text-xs text-center mb-3 mt-1 mx-3 ${filteredTasks.length === 0 ? "text-red-500" : "opacity-70"}`}>
          {filteredTasks.length === 0
            ? "No tasks found"
            : `${filteredTasks.length} of ${tasks.length} task${filteredTasks.length !== 1 ? "s" : ""} shown`}
        </p>
      )}

      {/* ─── Status message ────────────────────────── */}
      {message && (
        <div
          className={`text-xs text-center py-2 mx-3 mb-3 rounded ${
            message.type === "success"
              ? theme
                ? "bg-green-100 text-green-800"
                : "bg-green-900/70 text-green-200"
              : theme
                ? "bg-red-100 text-red-800"
                : "bg-red-900/70 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ─── Scrollable task list ──────────────────── */}
      <div className="flex-1 overflow-hidden pl-3 pb-5">
        <div
          className={`space-y-2 overflow-y-auto scrollbar-thin h-full pr-3 ${
            theme
              ? "bg-[#ffffff] scrollbar-thumb-gray-400 scrollbar-track-[#f8f8f8]"
              : "bg-gray-950 scrollbar-thumb-gray-600 scrollbar-track-gray-900"
          }`}
        >
          {/* ── Add Task Form ────────────────────────── */}
          {editingIndex === null && (
            <>
              {isPortalOpen ? (
                <div
                  className={`p-3 rounded text-sm border ${
                    theme
                      ? "bg-white border-gray-200"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-medium opacity-70">
                      Add new task
                    </h4>
                    <button
                      onClick={() => setIsPortalOpen(false)}
                      className="text-white bg-red-600 hover:bg-red-700 text-xs border-[1px] px-1 font-bold flex justify-center items-center rounded-sm border-red-600"
                    >
                      Close
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Task name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isAddDisabled) addTask();
                      if (e.key === "Escape") setIsPortalOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm rounded border mb-3 ${
                      theme
                        ? "bg-white border-gray-300 focus:border-blue-500"
                        : "bg-gray-900 border-gray-700 focus:border-blue-500"
                    } outline-none`}
                  />

                  <div className="mb-3">
                    <div className="text-xs opacity-70 mb-1.5">Category</div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setNewCategory(newCategory === cat ? "" : cat)
                          }
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition border ${
                            newCategory === cat
                              ? "bg-blue-600 border-blue-500 text-white"
                              : theme
                                ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`w-[7px] h-[7px] rounded-full ${CATEGORY_DOT[cat]}`}
                          />
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <TimeInputGroup
                      label="From"
                      hour={fromHour}
                      setHour={setFromHour}
                      minute={fromMinute}
                      setMinute={setFromMinute}
                      period={fromPeriod}
                      setPeriod={setFromPeriod}
                      theme={theme}
                    />
                    <TimeInputGroup
                      label="To"
                      hour={toHour}
                      setHour={setToHour}
                      minute={toMinute}
                      setMinute={setToMinute}
                      period={toPeriod}
                      setPeriod={setToPeriod}
                      theme={theme}
                    />
                  </div>

                  <div className="text-xs text-center opacity-70 mt-3">
                    Preview:{" "}
                    <span className="font-medium">
                      {previewFrom} - {previewTo}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {/* Add to this day only */}
                    <button
                      onClick={addTask}
                      disabled={isAddDisabled}
                      className={`w-full text-sm font-medium py-2 rounded transition ${
                        isAddDisabled
                          ? theme
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      Add Task
                    </button>

                    {singleDayValidationError && (
                      <p className="text-xs text-red-500 text-center mt-3 font-medium">
                        {singleDayValidationError}
                      </p>
                    )}

                    {/* Multi-day add */}
                    <div className="mt-4">
                      <div className="text-xs opacity-70 mb-2">
                        Select days to add to:
                      </div>
                      <DayPills
                        selected={selectedDaysForMultiAdd}
                        setSelected={setSelectedDaysForMultiAdd}
                        showAll
                        allLabel="All"
                        allDays={[...daysOfWeek]}
                      />
                    </div>

                    <button
                      onClick={addTaskToMultipleDays}
                      disabled={
                        selectedDaysForMultiAdd.size === 0 ||
                        !!multiDayAddValidationError ||
                        !newName.trim()
                      }
                      className={`w-full text-sm font-medium py-2 rounded transition mt-3 ${
                        selectedDaysForMultiAdd.size === 0 ||
                        !!multiDayAddValidationError ||
                        !newName.trim()
                          ? theme
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      Add Task in Multiple Days
                    </button>

                    {multiDayAddValidationError && (
                      <p className="text-xs text-red-500 text-center mt-3 font-medium">
                        {multiDayAddValidationError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsPortalOpen(true)}
                  className={`w-full text-sm font-medium py-[12px] rounded border-dashed border-2 transition ${
                    theme
                      ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                      : "border-gray-700 text-gray-400 hover:bg-gray-900"
                  }`}
                >
                  + Add New Task
                </button>
              )}
            </>
          )}

          {/* ── Task List ────────────────────────────── */}
          {filteredTasks.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              {taskSearchQuery.trim() ? "No matching tasks" : "No tasks"}
            </p>
          ) : (
            filteredTasks.map((task) => {
              const originalIndex = tasks.indexOf(task);
              return (
                <div key={originalIndex}>
                  {editingIndex === originalIndex ? (
                    /* ── Edit Portal ───────────────────── */
                    <div
                      className={`p-3 rounded text-sm border ${
                        theme
                          ? "bg-white border-gray-200"
                          : "bg-gray-900 border-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium opacity-70">
                          Edit task
                        </h4>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-white bg-red-600 hover:bg-red-700 text-xs border-[1px] px-1 font-bold flex justify-center items-center rounded-sm border-red-600"
                        >
                          Close
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Task name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAddDisabled) editTask();
                          if (e.key === "Escape") setEditingIndex(null);
                        }}
                        className={`w-full px-3 py-2 text-sm rounded border mb-3 ${
                          theme
                            ? "bg-white border-gray-300 focus:border-blue-500"
                            : "bg-gray-900 border-gray-700 focus:border-blue-500"
                        } outline-none`}
                      />

                      <div className="mb-3">
                        <div className="text-xs opacity-70 mb-1.5">
                          Category
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                setNewCategory(newCategory === cat ? "" : cat)
                              }
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition border ${
                                newCategory === cat
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : theme
                                    ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`w-[7px] h-[7px] rounded-full ${CATEGORY_DOT[cat]}`}
                              />
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <TimeInputGroup
                          label="From"
                          hour={fromHour}
                          setHour={setFromHour}
                          minute={fromMinute}
                          setMinute={setFromMinute}
                          period={fromPeriod}
                          setPeriod={setFromPeriod}
                          theme={theme}
                        />
                        <TimeInputGroup
                          label="To"
                          hour={toHour}
                          setHour={setToHour}
                          minute={toMinute}
                          setMinute={setToMinute}
                          period={toPeriod}
                          setPeriod={setToPeriod}
                          theme={theme}
                        />
                      </div>

                      <div className="text-xs text-center opacity-70 mt-3">
                        Preview:{" "}
                        <span className="font-medium">
                          {previewFrom} - {previewTo}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {/* Edit this day only */}
                        <button
                          onClick={editTask}
                          disabled={isAddDisabled}
                          className={`w-full text-[13px] font-medium py-2 rounded transition ${
                            isAddDisabled
                              ? theme
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          Edit (This Day Only)
                        </button>

                        {singleDayValidationError && (
                          <p className="text-xs text-red-500 text-center mt-3 font-medium">
                            {singleDayValidationError}
                          </p>
                        )}

                        {/* Multi-day edit pills */}
                        <div className="mt-4">
                          <div className="text-xs opacity-70 mb-2">
                            Select days to update this task:
                          </div>
                          <DayPills
                            selected={selectedDaysForMultiEdit}
                            setSelected={setSelectedDaysForMultiEdit}
                            showAll
                            allLabel="All Relevant"
                            allDays={
                              auth?.routine && editingIndex !== null
                                ? daysOfWeek.filter((day) =>
                                    (auth.routine[day] || []).some(
                                      (t) =>
                                        t.name === tasks[editingIndex]?.name,
                                    ),
                                  )
                                : []
                            }
                          />
                        </div>

                        <button
                          onClick={editTaskOnSelectedDays}
                          disabled={
                            selectedDaysForMultiEdit.size === 0 ||
                            !!multiDayEditValidationError ||
                            !newName.trim()
                          }
                          className={`w-full text-[13px] font-medium py-2 rounded transition mt-3 ${
                            selectedDaysForMultiEdit.size === 0 ||
                            !!multiDayEditValidationError ||
                            !newName.trim()
                              ? theme
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          Update Task in Selected Days
                        </button>

                        {multiDayEditValidationError &&
                          selectedDaysForMultiEdit.size > 0 && (
                            <p className="text-xs text-red-500 text-center mt-3 font-medium">
                              {multiDayEditValidationError}
                            </p>
                          )}

                        {/* Swap Task Section */}
                        <div className="mt-4">
                          <div className="text-xs opacity-70 mb-2">
                            Swap with task:
                          </div>
                          <div className="relative mb-2">
                            <input
                              type="text"
                              placeholder="Search task name to swap..."
                              value={swapSearchQuery}
                              onChange={(e) => {
                                setSwapSearchQuery(e.target.value);
                                setSelectedDaysForSwap(new Set());
                              }}
                              className={`w-full px-3 py-2 text-sm rounded border ${
                                theme
                                  ? "bg-white border-gray-300 focus:border-blue-500"
                                  : "bg-gray-900 border-gray-700 focus:border-blue-500"
                              } outline-none`}
                            />

                            {swapSearchQuery.trim() &&
                              !swapTask &&
                              swapSuggestion &&
                              swapSuggestion.length > 0 && (
                                <div
                                  className={`absolute z-10 w-full mt-1 rounded border shadow-md overflow-hidden ${
                                    theme
                                      ? "bg-white border-gray-200"
                                      : "bg-gray-800 border-gray-700"
                                  }`}
                                >
                                  {swapSuggestion.map((suggestion) => (
                                    <button
                                      key={suggestion.name}
                                      onClick={() => {
                                        setSwapSearchQuery(suggestion.name);
                                        setSelectedDaysForSwap(new Set());
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs transition ${
                                        theme
                                          ? "hover:bg-blue-50 text-gray-800"
                                          : "hover:bg-gray-700 text-gray-200"
                                      }`}
                                    >
                                      <span className="font-medium">
                                        {suggestion.name}
                                      </span>
                                      <span className="opacity-50 ml-2">
                                        {suggestion.time}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>

                          {swapSearchQuery.trim() && swapTask && (
                            <p className="text-xs text-green-500 text-center mb-2 font-medium">
                              Found: {swapTask.name} ({swapTask.time})
                            </p>
                          )}
                          {swapSearchQuery.trim() &&
                            !swapTask &&
                            (!swapSuggestion ||
                              swapSuggestion.length === 0) && (
                              <p className="text-xs text-red-500 text-center mb-2 font-medium">
                                No task found with that name
                              </p>
                            )}

                          {swapTask && (
                            <>
                              <div className="text-xs opacity-70 mb-2">
                                Select days to swap task:
                              </div>
                              <div className="mb-2">
                                <DayPills
                                  selected={selectedDaysForSwap}
                                  setSelected={setSelectedDaysForSwap}
                                  showAll
                                  allLabel="All Relevant"
                                  allDays={
                                    editingIndex !== null && auth?.routine
                                      ? daysOfWeek.filter(
                                          (day) =>
                                            (auth.routine[day] || []).some(
                                              (t) =>
                                                t.name ===
                                                tasks[editingIndex]?.name,
                                            ) &&
                                            (auth.routine[day] || []).some(
                                              (t) => t.name === swapTask.name,
                                            ),
                                        )
                                      : []
                                  }
                                />
                              </div>

                              <button
                                onClick={swapTaskOnSelectedDays}
                                disabled={
                                  selectedDaysForSwap.size === 0 ||
                                  !!swapValidationError
                                }
                                className={`w-full text-[13px] font-medium py-2 rounded transition ${
                                  selectedDaysForSwap.size === 0 ||
                                  !!swapValidationError
                                    ? theme
                                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                                }`}
                              >
                                Swap Task in Selected Days
                              </button>

                              {swapValidationError &&
                                selectedDaysForSwap.size > 0 && (
                                  <p className="text-xs text-red-500 text-center mt-2 font-medium">
                                    {swapValidationError}
                                  </p>
                                )}
                            </>
                          )}
                        </div>

                        {/* Delete from every day */}
                        <button
                          onClick={deleteTaskFromEveryDay}
                          className="w-full text-[13px] font-medium py-2 rounded transition bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete from Every Day
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Task Card ────────────────────── */
                    <div
                      onClick={() => openEditPortal(originalIndex)}
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${
                        theme ? "bg-white" : "bg-gray-900"
                      } border ${
                        theme ? "border-gray-200" : "border-gray-800"
                      } ${
                        currentActiveTask === task.name &&
                        selectedDay ===
                          (["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()] as Day)
                          ? "task-blink border-green-500"
                          : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {task.category &&
                            CATEGORY_DOT[
                              task.category as keyof typeof CATEGORY_DOT
                            ] && (
                              <span
                                className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${CATEGORY_DOT[task.category as keyof typeof CATEGORY_DOT]}`}
                              />
                            )}
                          <div className="font-medium truncate">
                            {task.name}
                          </div>
                        </div>
                        <div className="text-xs opacity-70">{task.time}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {/* Green check — only shown when selectedDay is today */}
                        {selectedDay ===
                          ([
                            "sunday",
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                          ][new Date().getDay()] as Day) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completeTask(task.name);
                            }}
                            title="Mark as completed today"
                            className={`text-xs border-[1px] h-[15px] w-[15px] font-bold flex justify-center items-center rounded-sm transition-colors ${
                              Array.isArray(auth?.stats) &&
                              auth.stats.some(
                                (s) =>
                                  s.date ===
                                    (() => {
                                      const n = new Date();
                                      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
                                    })() &&
                                  s.completedTasks.includes(task.name),
                              )
                                ? "bg-green-500 border-green-500 text-white"
                                : "text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                            }`}
                          >
                            ✓
                          </button>
                        )}
                        {/* Red cross — delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(originalIndex, task.name);
                          }}
                          className="text-red-500 hover:text-white hover:bg-red-600 text-xs border-[1px] h-[15px] w-[15px] font-bold flex justify-center items-center rounded-sm border-red-500 hover:border-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
