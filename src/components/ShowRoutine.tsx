// src/components/ShowRoutine.tsx
// Merged ShowRoutine — handles Desktop (full week grid), Tablet (single day),
// and Mobile (single day) via a "variant" prop.
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { IRoutine, IRoutineItem } from "@/store/features/auth/authSlice";
import { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaMinus,
  FaPlus,
} from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────
const daysOfWeek = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

const CATEGORY_DOT: Record<string, string> = {
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

type Day = (typeof daysOfWeek)[number];

// ─── Helper functions ─────────────────────────────────────────

const getMinutesPerSlot = (zoom: number) => {
  if (zoom <= 1.5) return 30;
  if (zoom <= 3) return 15;
  if (zoom <= 3.5) return 10;
  return 5;
};

const getDurationFromTimeRange = (timeRange: string): number => {
  const regex = /^(\d{1,2}:\d{2} (?:AM|PM)) - (\d{1,2}:\d{2} (?:AM|PM))$/i;
  const match = timeRange.trim().match(regex);
  if (!match) {
    throw new Error(
      `Invalid time range format: "${timeRange}". Expected: "HH:MM AM/PM - HH:MM AM/PM"`,
    );
  }

  const [, startStr, endStr] = match;

  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);
    let h = hours;
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startStr);
  const endMinutes = timeToMinutes(endStr);
  let duration = endMinutes - startMinutes;
  if (duration < 0) duration += 24 * 60;
  if (duration === 0 && startMinutes !== 0) duration = 1440 - startMinutes;
  return duration;
};

// ─── Props ────────────────────────────────────────────────────
//
// variant:
//   "desktop" → Full-week 8-column grid (Timeline + 7 days) with rotate controls
//   "tablet"  → Single-day column with date capsules (hidden sm:block lg:hidden)
//   "mobile"  → Single-day column with date capsules (block sm:hidden)

interface ShowRoutineProps {
  variant?: "desktop" | "tablet" | "mobile";
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsOpen?: boolean;
  setIsSettingsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDay?: Day;
  setSelectedDay?: React.Dispatch<React.SetStateAction<Day>>;
  setTaskSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onFreeTimeClick?: (start: string, end: string) => void;
  updateRoutineWithHistory?: (newRoutine: IRoutine) => void;
  syncDrag?: boolean;
}

// ─── Component ────────────────────────────────────────────────
export default function ShowRoutine({
  variant = "desktop",
  setHasUnsavedChanges,
  isSettingsOpen,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedDay,
  setSelectedDay,
  setTaskSearchQuery,
  onFreeTimeClick,
  updateRoutineWithHistory,
  syncDrag,
}: ShowRoutineProps) {
  const { user: auth, setAuth } = useAuth();

  // ── State ──────────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(3.5);
  const [nowHeight, setNowHeight] = useState(20);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  );
  const [hoveredTask, setHoveredTask] = useState<{ name: string; time: string; minutes: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<{
    taskName: string;
    dayKey: string;
    originalTime: string;
    taskStartMinutes: number;
    taskDuration: number;
    previewStartMinutes: number | null;
    previewDayKey?: string;
  } | null>(null);

  // Desktop-only: rotatable day order
  const [daysOfWeekOrder, setDaysOfWeekOrder] = useState([
    { full: "Saturday", short: "Sat" },
    { full: "Sunday", short: "Sun" },
    { full: "Monday", short: "Mon" },
    { full: "Tuesday", short: "Tue" },
    { full: "Wednesday", short: "Wed" },
    { full: "Thursday", short: "Thu" },
    { full: "Friday", short: "Fri" },
  ]);

  // Tablet / Mobile: date capsule state
  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(
    null,
  );
  const [weekRealDates, setWeekRealDates] = useState<
    Array<{
      dayName: string;
      shortDay: string;
      dateStr: string;
      isToday: boolean;
      dateObj: Date;
    }>
  >([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Derived values ─────────────────────────────────────────
  const pxPerMinute = zoomLevel;
  const hourHeight = 60 * pxPerMinute;
  const minutesPerSlot = getMinutesPerSlot(zoomLevel);
  const slotsPerHour = 60 / minutesPerSlot;
  const today = new Date().toLocaleString("en-US", { weekday: "long" });

  // ── Time utilities ─────────────────────────────────────────
  const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let h = hours ?? 0;
    if (period?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period?.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + (minutes || 0);
  };

  const minutesToTimeStr = (mins: number): string => {
    let h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = h < 12 ? "AM" : "PM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  // ── Helper to convert date index → day key ─────────────────
  const getDayKeyFromIndex = (index: number): string => {
    const dayNames = [
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];
    return dayNames[index];
  };


  // ── Scroll to now ──────────────────────────────────────────
  const scrollToNow = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const scrollTop = nowHeight - clientHeight / 2;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const safeScroll = Math.min(maxScroll, Math.max(0, scrollTop));
    container.scrollTo({ top: safeScroll, behavior: "smooth" });
  };

  // ── Desktop rotate helpers ─────────────────────────────────
  const rotateWeekLeft = () => {
    setDaysOfWeekOrder((prev) => {
      const newDays = [...prev];
      const last = newDays.pop()!;
      newDays.unshift(last);
      return newDays;
    });
  };

  const rotateWeekRight = () => {
    setDaysOfWeekOrder((prev) => {
      const newDays = [...prev];
      const first = newDays.shift()!;
      newDays.push(first);
      return newDays;
    });
  };

  // ── Effects ────────────────────────────────────────────────
  // Sync selectedDateIndex when selectedDay prop changes (tablet/mobile)
  useEffect(() => {
    if (variant !== "desktop" && selectedDay) {
      const dayIndex = daysOfWeek.indexOf(selectedDay);
      setSelectedDateIndex(dayIndex !== -1 ? dayIndex : null);
    }
  }, [selectedDay, variant]);

  // Build real dates (tablet/mobile)
  useEffect(() => {
    if (variant === "desktop") return;
    const todayDate = new Date();
    const currentDayIndex = todayDate.getDay();
    const dayOrder = [6, 0, 1, 2, 3, 4, 5];
    const dates: typeof weekRealDates = [];

    dayOrder.forEach((dayNum) => {
      const diff = dayNum - currentDayIndex;
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() + diff);
      const isToday = diff === 0;
      dates.push({
        dayName: date.toLocaleString("en-US", { weekday: "long" }),
        shortDay: date.toLocaleString("en-US", { weekday: "short" }),
        dateStr: date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        isToday,
        dateObj: date,
      });
    });

    setWeekRealDates(dates);
    const todayIdx = dates.findIndex((d) => d.isToday);
    if (todayIdx !== -1) setSelectedDateIndex(todayIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update now-line height
  useEffect(() => {
    const updateHeight = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      setNowHeight(minutesSinceMidnight * zoomLevel + 20);
    };
    updateHeight();
    const intervalId = setInterval(updateHeight, 60000);
    return () => clearInterval(intervalId);
  }, [zoomLevel]);

  // ── Generate time slots ────────────────────────────────────
  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += minutesPerSlot) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const m = min.toString().padStart(2, "0");
      timeSlots.push(`${h}:${m} ${ampm}`);
    }
  }

  // ── Auth guards ────────────────────────────────────────────
  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-black dark:from-black dark:via-black dark:to-black">
        <div className="text-center max-w-md w-full mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-gray-900 dark:text-gray-100">
            Please sign in
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-6 text-gray-600 dark:text-gray-400">
            Log in to access and manage your personal routine and schedule.
          </p>
          <p className="text-sm italic text-gray-500">
            {"Your productive day is just one click away"}
          </p>
        </div>
      </div>
    );
  }

  if (!auth.routine) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-black dark:from-black dark:via-black dark:to-black">
        <div className="text-center max-w-md w-full mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 animate-spin border-t-blue-500 dark:border-t-blue-600 border-blue-200/30 dark:border-blue-900/30" />
              <div className="absolute inset-3 rounded-full border-4 animate-[spin_3s_linear_infinite] border-t-purple-500 dark:border-t-purple-600 border-purple-200/20 dark:border-purple-900/20" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-5 text-gray-900 dark:text-gray-100">
            {auth?.firstTimeLogin
              ? "Preparing your routine"
              : "Loading your schedule"}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-6 max-w-prose mx-auto text-gray-600 dark:text-gray-400">
            {auth?.firstTimeLogin
              ? "We're setting up your perfect weekly planner \u2014 this will only take a moment..."
              : "Fetching your latest routine data... Please wait."}
          </p>
          <p className="text-sm sm:text-base font-medium text-gray-500">
            {auth?.firstTimeLogin
              ? "First time? Let's make your schedule amazing together!"
              : "Hang tight \u2014 almost ready..."}
          </p>
        </div>
      </div>
    );
  }

  const routine = auth.routine;
  const goals = Array.isArray(auth.goals) ? auth.goals : [];

  // Build a set of today's "todo" goal times for highlight lookup
  const _todayISO = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  const todoGoalMinuteRanges: { start: number; end: number }[] = goals
    .filter((g) => g.status === "todo" && g.time && (!g.dueDate || g.dueDate === _todayISO))
    .map((g) => {
      const timeStr = String(g.time).trim();
      const parts = timeStr.split(":");
      if (parts.length < 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      const startMins = h * 60 + m;
      return { start: startMins, end: startMins + 60 };
    })
    .filter((r): r is { start: number; end: number } => r !== null);

  const isTaskInTodoGoalTime = (taskTimeRange: string, isTaskToday: boolean): boolean => {
    if (!isTaskToday) return false;
    if (todoGoalMinuteRanges.length === 0) return false;
    if (!taskTimeRange.includes(" - ")) return false;
    const [startStr, endStr] = taskTimeRange.split(" - ").map((s) => s.trim());
    const taskStartMins = timeToMinutes(startStr);
    const taskEndMins = timeToMinutes(endStr);
    return todoGoalMinuteRanges.some(
      (r) => r.start >= taskStartMins && r.start < taskEndMins,
    );
  };

  // ─── Shared sub-renderers ──────────────────────────────────

  /** Render the timeline column (time labels + minor lines) */
  const renderTimelineColumn = () => (
    <div className="text-base pt-5 font-medium col-span-1 text-gray-800 dark:text-gray-200">
      {timeSlots.map((time) => (
        <div
          key={time}
          className="w-full text-xs border-t border-gray-400 dark:border-gray-500"
          style={{ height: `${hourHeight / slotsPerHour}px` }}
        >
          <div className="flex relative justify-center items-center">
            <div className="absolute px-2 left-0 rounded-md text-xs font-medium shadow-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {time}
            </div>
            {/* Minor division lines */}
            {(() => {
              const count =
                zoomLevel <= 1.5
                  ? 6
                  : zoomLevel <= 3
                    ? 3
                    : zoomLevel === 3.5
                      ? 10
                      : zoomLevel >= 4
                        ? 5
                        : 0;
              return Array.from({ length: count }).map((_, index) => (
                <div
                  key={index}
                  className="w-[10%] absolute right-0 border-t border-gray-400/70 dark:border-gray-500/70"
                  style={{
                    top: `${(hourHeight / slotsPerHour / count) * index - 1}px`,
                  }}
                />
              ));
            })()}
          </div>
        </div>
      ))}
      {/* Final 12:00 AM label */}
      <div
        className="w-full text-xs border-t border-gray-400 dark:border-gray-500"
        style={{ height: `1px` }}
      >
        <div className="flex relative justify-center items-center">
          <div className="absolute px-2 left-0 rounded-md text-xs font-medium shadow-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            12:00 AM
          </div>
        </div>
      </div>
    </div>
  );

  /** Build sorted tasks with gap (dummy) entries for a given day key */
  const buildTasksWithGaps = (dayKey: string) => {
    const tasks: IRoutineItem[] = routine[dayKey as keyof typeof routine] || [];

    const localTimeToMinutes = (timeStr: string): number => {
      const [time, period] = timeStr.trim().split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let h = hours;
      if (period.toUpperCase() === "PM" && h !== 12) h += 12;
      if (period.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + minutes;
    };

    const minutesToTime = (minutes: number): string => {
      if (minutes >= 1440) return "12:00 AM";
      let h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const ampm = h < 12 ? "AM" : "PM";
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const sortedTasks = [...tasks].sort(
      (a, b) =>
        localTimeToMinutes(a.time.split(" - ")[0]) -
        localTimeToMinutes(b.time.split(" - ")[0]),
    );

    const sortedTasksWithGap: IRoutineItem[] = [];
    let previousEndMinutes = 0;

    sortedTasks.forEach((task) => {
      const startMinutes = localTimeToMinutes(task.time.split(" - ")[0]);
      const durationMinutes = getDurationFromTimeRange(task.time);
      const endMinutes = startMinutes + durationMinutes;

      if (startMinutes > previousEndMinutes) {
        sortedTasksWithGap.push({
          name: "dummy",
          time: `${minutesToTime(previousEndMinutes)} - ${minutesToTime(startMinutes)}`,
        } as IRoutineItem);
      }
      sortedTasksWithGap.push(task);
      previousEndMinutes = endMinutes;
    });

    // Trailing free time: from last task's end to midnight (1440 min)
    if (previousEndMinutes < 1440) {
      const trailingMinutes = 1440 - previousEndMinutes;
      sortedTasksWithGap.push({
        name: "dummy",
        // Store duration directly so getDurationFromTimeRange returns correct value.
        // We encode it as a same-start fake range and override height via _durationMinutes.
        time: `${minutesToTime(previousEndMinutes)} - ${minutesToTime(previousEndMinutes + trailingMinutes)}`,
        _durationMinutes: trailingMinutes,
      } as IRoutineItem);
    }

    return sortedTasksWithGap;
  };

  /** Render a single task block at the right height */
  const CATEGORY_TEXT: Record<string, string> = {
    Health: "text-emerald-500",
    Meals: "text-green-500",
    Sleep: "text-teal-600",
    Work: "text-blue-600",
    Productivity: "text-indigo-500",
    Errands: "text-orange-500",
    Chores: "text-amber-600",
    Groceries: "text-red-500",
    Relax: "text-purple-400",
    Other: "text-gray-500",
  };

  const renderTaskBlock = (
    task: IRoutineItem,
    i: number,
    isToday: boolean,
    dayName: string,
  ) => {
    const minutes = getDurationFromTimeRange(task.time);
    const height = minutes * pxPerMinute;
    const _now = new Date();
    const todayDate = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;
    const isCompletedToday =
      isToday &&
      task.name !== "dummy" &&
      Array.isArray(auth?.stats) &&
      auth.stats.some(
        (s) => s.date === todayDate && s.completedTasks.includes(task.name),
      );
    const hasTodoGoal = task.name !== "dummy" && isTaskInTodoGoalTime(task.time, isToday);
    const matchedGoal = hasTodoGoal
      ? goals.find((g) => {
          if (g.status !== "todo" || !g.time) return false;
          const parts = String(g.time).trim().split(":");
          if (parts.length < 2) return false;
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (isNaN(h) || isNaN(m)) return false;
          const goalMins = h * 60 + m;
          if (!task.time.includes(" - ")) return false;
          const [startStr, endStr] = task.time.split(" - ").map((s) => s.trim());
          const taskStart = timeToMinutes(startStr);
          const taskEnd = timeToMinutes(endStr);
          return goalMins >= taskStart && goalMins < taskEnd;
        })
      : null;

    const isSmall = height < 15 * pxPerMinute && task.name !== "dummy";
    return (
      <div
        key={i}
        draggable={task.name !== "dummy"}
        onMouseEnter={isSmall ? (e) => {
          setCursorPos({ x: e.clientX, y: e.clientY });
          setHoveredTask({ name: task.name, time: task.time, minutes });
        } : undefined}
        onMouseMove={isSmall ? (e) => {
          setCursorPos({ x: e.clientX, y: e.clientY });
        } : undefined}
        onMouseLeave={isSmall ? () => setHoveredTask(null) : undefined}
        onDragStart={(e) => {
          if (task.name === "dummy") return;
          setDragState({
            taskName: task.name,
            dayKey: dayName.toLowerCase(),
            originalTime: task.time,
            taskStartMinutes: timeToMinutes(task.time.split(" - ")[0]),
            taskDuration: minutes,
            previewStartMinutes: null,
          });
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDragState(null)}
        onClick={() => {
          setSelectedDay?.(dayName.toLowerCase() as Day);
          if (task.name !== "dummy") {
            setIsSidebarOpen?.(true);
            setTaskSearchQuery(task.name);
          } else {
            setIsSidebarOpen?.(true);
            const [start, end] = task.time.split(" - ");
            onFreeTimeClick?.(start.trim(), end.trim());
          }
        }}
        className={`text-sm overflow-hidden border-t pr-2 transition-colors ${
          dragState?.taskName === task.name
            ? "opacity-40 ring-2 ring-inset ring-blue-400"
            : ""
        } ${
          task.name !== "dummy" && isToday
            ? hasTodoGoal
              ? "bg-orange-400/30 dark:bg-orange-900/50 text-black dark:text-white cursor-grab border-l-2 border-orange-500/70"
              : "bg-blue-600/30 dark:bg-blue-950/70 text-black dark:text-white cursor-grab border-l-2 border-blue-600/50 dark:border-blue-500/50"
            : task.name === "dummy"
              ? "bg-transparent text-gray-600 dark:text-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer dark:border-t-gray-800"
              : "bg-gray-100/60 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/70 cursor-grab dark:border-t-gray-800"
        }`}
        style={{ height: `${height}px` }}
      >
        {matchedGoal && height >= 30 && (
          <div className="flex items-center gap-1 px-2 pt-1 pb-0.5 text-[9px] font-semibold truncate text-orange-700 dark:text-orange-300">
            <span className="truncate">🎯 {matchedGoal.name}</span>
            <span className="opacity-60 flex-shrink-0">· Todo</span>
            <span className="opacity-60 flex-shrink-0">· {matchedGoal.time}</span>
          </div>
        )}
        {height < 12 ? (
          <></>
        ) : height < 16 ? (
          <div className="font-medium text-[7px] truncate ml-2.5 mt-[-2px] flex items-center gap-1">
            {(() => {
              const categoryKey =
                task.category && task.category in CATEGORY_DOT
                  ? (task.category as keyof typeof CATEGORY_DOT)
                  : null;
              return task.name !== "dummy" && categoryKey ? (
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  <span
                    className={`w-[6px] h-[6px] rounded-full ${CATEGORY_DOT[categoryKey]}`}
                  />
                  {isCompletedToday && (
                    <span
                      className={`${CATEGORY_TEXT[task.category!] ?? "text-gray-400"} font-bold text-[7px] leading-none`}
                    >
                      ✓
                    </span>
                  )}
                </span>
              ) : null;
            })()}
            <div className="truncate">
              {task.name}
              <span className="text-[7px] opacity-80 ml-1">({task.time})</span>
            </div>
          </div>
        ) : height < 30 ? (
          <div className="font-medium text-[9px] truncate ml-2.5 flex items-center gap-1.5">
            {task.name !== "dummy" &&
            task.category &&
            CATEGORY_DOT[task.category] ? (
              <span className="flex items-center gap-0.5 flex-shrink-0">
                <span
                  className={`w-[7px] h-[7px] rounded-full ${CATEGORY_DOT[task.category]}`}
                />
                {isCompletedToday && (
                  <span className={`${CATEGORY_TEXT[task.category!] ?? "text-gray-400"} font-bold text-[8px] leading-none`}>✓</span>
                )}
              </span>
            ) : null}
            <div className="truncate">
              {task.name !== "dummy" ? task.name : ""}
              {task.name !== "dummy" && (
                <span className="text-[8px] opacity-80 ml-1">
                  ({task.time})
                </span>
              )}
            </div>
            {task.name === "dummy" && (
              <div className="text-[8px] opacity-70">{`${formatDuration(minutes)} Free`}</div>
            )}
          </div>
        ) : height < 50 ? (
          <div className="font-medium text-[10px] truncate ml-2.5 mt-1 flex items-center gap-1.5">
            {task.name !== "dummy" &&
            task.category &&
            CATEGORY_DOT[task.category] ? (
              <span className="flex items-center gap-0.5 flex-shrink-0">
                <span
                  className={`w-[8px] h-[8px] rounded-full ${CATEGORY_DOT[task.category]}`}
                />
                {isCompletedToday && (
                  <span className={`${CATEGORY_TEXT[task.category!] ?? "text-gray-400"} font-bold text-[9px] leading-none`}>✓</span>
                )}
              </span>
            ) : null}
            <div className="truncate">
              {task.name !== "dummy" ? task.name : ""}
              {task.name !== "dummy" && (
                <span className="text-[9px] opacity-80 ml-1">
                  ({task.time})
                </span>
              )}
            </div>
            {task.name === "dummy" && (
              <div className="text-[9px] opacity-70">{`${formatDuration(minutes)} Free`}</div>
            )}
          </div>
        ) : height < 90 ? (
          <>
            <div className="flex items-center gap-1.5 ml-2.5 mt-1">
              {task.name !== "dummy" &&
                task.category &&
                CATEGORY_DOT[task.category] && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <span
                      className={`w-[9px] h-[9px] rounded-full ${CATEGORY_DOT[task.category]}`}
                    />
                    {isCompletedToday && (
                      <span className={`${CATEGORY_TEXT[task.category!] ?? "text-gray-400"} font-bold text-[10px] leading-none`}>✓</span>
                    )}
                  </span>
                )}
              <div className="text-[13px] font-medium truncate">
                {task.name !== "dummy" ? task.name : ""}
              </div>
            </div>
            <div className="text-[11px] opacity-80 truncate ml-2.5">
              {task.name !== "dummy" ? task.time : ""}
            </div>
            {task.name !== "dummy" && height >= 70 && (
              <div className="text-[10px] opacity-70 ml-2.5">
                {formatDuration(minutes)}
              </div>
            )}
            {task.name === "dummy" && height >= 50 && (
              <div className="text-[10px] opacity-70 ml-2.5">
                {`${formatDuration(minutes)} Free`}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 ml-2.5 mt-2">
              {task.name !== "dummy" &&
                task.category &&
                CATEGORY_DOT[task.category] && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <span
                      className={`w-[10px] h-[10px] rounded-full ${CATEGORY_DOT[task.category]}`}
                    />
                    {isCompletedToday && (
                      <span className={`${CATEGORY_TEXT[task.category!] ?? "text-gray-400"} font-bold text-[11px] leading-none`}>✓</span>
                    )}
                  </span>
                )}
              <div className="font-medium truncate">
                {task.name !== "dummy" ? task.name : ""}
              </div>
            </div>
            <div className="text-xs opacity-80 ml-2.5">
              {task.name !== "dummy" ? task.time : ""}
            </div>
            {task.name !== "dummy" && height >= 50 && (
              <div className="text-[12px] opacity-70 ml-2.5">
                {formatDuration(minutes)}
              </div>
            )}
            {task.name === "dummy" && height >= 50 && (
              <div className="text-[12px] opacity-70 ml-2.5">
                {`${formatDuration(minutes)} Free`}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
;

  // ── Drag drop overlap validator ────────────────────────────
  const validateDrop = (
    updatedRoutine: typeof auth.routine,
    taskName: string,
    dayKey: string,
    newStartMinutes: number,
    taskDuration: number,
  ): { valid: boolean; conflictTask?: string; conflictDay?: string } => {
    const dayTasks = (updatedRoutine[dayKey as keyof typeof updatedRoutine] || []) as IRoutineItem[];
    const newEnd = newStartMinutes + taskDuration;

    for (const task of dayTasks) {
      if (task.name === taskName) continue;
      if (!task.time?.includes(" - ")) continue;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [startStr, endStr] = task.time.split(" - ").map((s) => s.trim());
      const existingStart = timeToMinutes(startStr);
      const existingEnd = existingStart + getDurationFromTimeRange(task.time);
      const overlaps = newStartMinutes < existingEnd && newEnd > existingStart;
      if (overlaps) {
        return { valid: false, conflictTask: task.name, conflictDay: dayKey };
      }
    }
    return { valid: true };
  };

  // ═══════════════════════════════════════════════════════════
  // DESKTOP VARIANT — full week 8-column grid
  // ═══════════════════════════════════════════════════════════
  if (variant === "desktop") {
    return (
      <>
        <div
          ref={scrollContainerRef}
          className={`h-full hidden lg:block relative scrollbar-thin overflow-auto px-[10px] pb-[50px] bg-[#ffffff] dark:bg-[#000000] scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-[#eeeeee] dark:scrollbar-track-gray-950 ${isSettingsOpen ? "blur-sm pointer-events-none" : ""}`}
        >
          {/* Sticky header */}
          <div className="sticky top-0 left-0 right-0 z-30 bg-inherit">
            <div
              id="nav"
              className="h-[50px] w-full border-b-[1px] flex items-center justify-between px-6 border-gray-300 dark:border-gray-800"
            >
              {/* Zoom controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                  disabled={zoomLevel <= 1}
                  className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${
                    zoomLevel <= 1
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                  }`}
                >
                  <FaMinus size={10} />
                </button>
                <span className="font-semibold min-w-[90px] text-center text-sm sm:text-base text-gray-900 dark:text-white">
                  Zoom: {zoomLevel.toFixed(1)}x
                </span>
                <button
                  onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                  disabled={zoomLevel >= 8}
                  className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${
                    zoomLevel >= 8
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                  }`}
                >
                  <FaPlus size={10} />
                </button>
              </div>

              {/* Jump to now */}
              <button
                onClick={scrollToNow}
                className="group flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-colors duration-200 border-[1px] text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border-green-800/20 dark:border-green-300/20"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>
                  {"Jump to now \u2014 "}
                  {currentTime.replace(/(?<!\d)(AM|PM)/gi, (m) =>
                    m.toUpperCase(),
                  )}
                </span>
              </button>

              {/* Rotate week */}
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={rotateWeekRight}
                  title="Rotate week left"
                  className="p-1.5 rounded-md transition-colors flex items-center justify-center text-green-700 dark:text-green-400 border-[1px] hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border-green-800/20 dark:border-green-300/20"
                >
                  <FaArrowLeft size={15} />
                </button>
                <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                  Rotate Week
                </span>
                <button
                  onClick={rotateWeekLeft}
                  title="Rotate week right"
                  className="p-1.5 rounded-md transition-colors flex items-center justify-center text-green-700 dark:text-green-400 border-[1px] hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border-green-800/20 dark:border-green-300/20"
                >
                  <FaArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div
              className="h-[49px] w-full border-b border-gray-300 dark:border-gray-800"
            >
              <div className="grid grid-cols-1 sm:grid-cols-8 mx-auto h-full">
                <div className="overflow-hidden">
                  <div
                    className="h-full flex items-center justify-center font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-400 bg-opacity-50 bg-gray-100/40 dark:bg-gray-900/40"
                  >
                    Timeline
                  </div>
                </div>
                {daysOfWeekOrder.map((day, idx) => (
                  <div
                    key={day.full}
                    onClick={() => {
                      setTaskSearchQuery("");
                      setIsSidebarOpen?.(true);
                      setSelectedDay?.(day.full.toLowerCase() as Day);
                    }}
                    className={`overflow-hidden border-l cursor-pointer transition-colors ${
                      idx === 6 ? "border-r" : ""
                    } border-gray-300 dark:border-gray-800`}
                  >
                    <div
                      className={`h-full flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-150 ${
                        day.full === today
                          ? "bg-blue-600/90 dark:bg-blue-700/90 text-white shadow-sm"
                          : "text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {day.full}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid content */}
          <div className="grid grid-cols-1 sm:grid-cols-8 mx-auto relative">
            {renderTimelineColumn()}

            {/* Day columns */}
            {daysOfWeekOrder.map((day, idx) => {
              const dayKey = day.full.toLowerCase();
              const sortedTasksWithGap = buildTasksWithGaps(dayKey);
              return (
                <div
                  key={day.full}
                  className={`overflow-hidden border-l border-b pt-5 ${
                    idx === 6 ? "border-r" : ""
                  } ${dragState ? "bg-blue-50/30 dark:bg-blue-950/10" : ""} border-gray-300 dark:border-gray-800`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragState) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                    const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                    const clamped = Math.max(
                      0,
                      Math.min(1440 - dragState.taskDuration, snapped),
                    );
                    setDragState((prev) =>
                      prev
                        ? {
                            ...prev,
                            previewStartMinutes: clamped,
                            previewDayKey: day.full.toLowerCase(),
                          }
                        : prev,
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!dragState || !auth?.routine) return;
                    const targetDayKey = day.full.toLowerCase();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                    const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                    const newStart = Math.max(
                      0,
                      Math.min(1440 - dragState.taskDuration, snapped),
                    );
                    const updated = { ...auth.routine };
                    const isCrossDay = targetDayKey !== dragState.dayKey;

                    if (isCrossDay && !syncDrag) {
                      // ── Cross-day single move ──────────────────────────
                      // 1. Check same-name conflict on target day
                      const targetTasks = (updated[targetDayKey as keyof typeof updated] || []) as IRoutineItem[];
                      const nameConflict = targetTasks.some(
                        (t) => t.name === dragState.taskName,
                      );
                      if (nameConflict) {
                        alert(
                          `Cannot move "${dragState.taskName}" to ${day.full} — a task with the same name already exists there.`,
                        );
                        setDragState(null);
                        return;
                      }

                      // 2. Check overlap on target day
                      const overlapCheck = validateDrop(
                        updated,
                        dragState.taskName,
                        targetDayKey,
                        newStart,
                        dragState.taskDuration,
                      );
                      if (!overlapCheck.valid) {
                        alert(
                          `Cannot move "${dragState.taskName}" to ${day.full} — it overlaps with "${overlapCheck.conflictTask}".`,
                        );
                        setDragState(null);
                        return;
                      }

                      // 3. Remove from source day
                      const sourceTasks = (updated[dragState.dayKey as keyof typeof updated] || []) as IRoutineItem[];
                      updated[dragState.dayKey as keyof typeof updated] = sourceTasks.filter(
                        (t) => t.name !== dragState.taskName,
                      ) as typeof sourceTasks;

                      // 4. Add to target day
                      const taskToMove = sourceTasks.find(
                        (t) => t.name === dragState.taskName,
                      );
                      if (taskToMove) {
                        const movedTask: IRoutineItem = {
                          ...taskToMove,
                          time: `${minutesToTimeStr(newStart)} - ${minutesToTimeStr(newStart + dragState.taskDuration)}`,
                        };
                        const newTargetTasks = [...targetTasks, movedTask].sort(
                          (a, b) =>
                            timeToMinutes(a.time.split(" - ")[0]) -
                            timeToMinutes(b.time.split(" - ")[0]),
                        );
                        updated[targetDayKey as keyof typeof updated] = newTargetTasks as typeof targetTasks;
                      }
                    } else {
                      // ── Same-day move (or syncDrag) ───────────────────
                      const offset = newStart - dragState.taskStartMinutes;
                      const daysToUpdate = daysOfWeek.filter((d) =>
                        d === dragState.dayKey ||
                        (syncDrag && (updated[d] || []).some((t) => t.name === dragState.taskName))
                      );

                      const conflicts: string[] = [];
                      daysToUpdate.forEach((d) => {
                        const tStart = timeToMinutes(
                          ((updated[d] || []) as IRoutineItem[]).find(
                            (t) => t.name === dragState.taskName
                          )?.time.split(" - ")[0] ?? "12:00 AM"
                        );
                        const ns = Math.max(0, Math.min(1440 - dragState.taskDuration, tStart + offset));
                        const check = validateDrop(updated, dragState.taskName, d, ns, dragState.taskDuration);
                        if (!check.valid) {
                          conflicts.push(`"${check.conflictTask}" on ${d.charAt(0).toUpperCase() + d.slice(1)}`);
                        }
                      });

                      if (conflicts.length > 0) {
                        alert(`Cannot move task — it overlaps with:\n${conflicts.join("\n")}`);
                        setDragState(null);
                        return;
                      }

                      daysToUpdate.forEach((d) => {
                        updated[d] = (updated[d] || [])
                          .map((t) => {
                            if (t.name !== dragState.taskName) return t;
                            const tStart = timeToMinutes(t.time.split(" - ")[0]);
                            const ns = Math.max(0, Math.min(1440 - dragState.taskDuration, tStart + offset));
                            return {
                              ...t,
                              time: `${minutesToTimeStr(ns)} - ${minutesToTimeStr(ns + dragState.taskDuration)}`,
                            };
                          })
                          .sort(
                            (a, b) =>
                              timeToMinutes(a.time.split(" - ")[0]) -
                              timeToMinutes(b.time.split(" - ")[0]),
                          );
                      });
                    }

                    if (updateRoutineWithHistory) {
                      updateRoutineWithHistory(updated as IRoutine);
                    } else {
                      setAuth({ ...auth, routine: updated });
                      setHasUnsavedChanges(true);
                    }
                    setDragState(null);
                  }}
                >
                  <div className="relative">
                    {goals
                      .filter((g) => {
                        if (g.status !== "todo" || !g.time) return false;
                        if (day.full !== today) return false;
                        if (g.dueDate && g.dueDate !== _todayISO) return false;
                        return true;
                      })
                      .map((g) => {
                        const parts = String(g.time).trim().split(":");
                        if (parts.length < 2) return null;
                        const h = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        if (isNaN(h) || isNaN(m)) return null;
                        const goalMins = h * 60 + m;
                        const topPx = goalMins * pxPerMinute;
                        // Check if any task covers this goal time — if so, skip standalone marker
                        const dayTasks = routine[dayKey as keyof typeof routine] || [];
                        const isCovered = dayTasks.some((t) => {
                          if (!t.time.includes(" - ")) return false;
                          const [s, e] = t.time.split(" - ").map((x) => x.trim());
                          const ts = timeToMinutes(s);
                          const te = timeToMinutes(e);
                          return goalMins >= ts && goalMins < te;
                        });
                        if (isCovered) return null;
                        return (
                          <div
                            key={g.id}
                            className="absolute left-0 right-0 z-10 group border-t-2 border-dashed cursor-pointer border-orange-400 dark:border-orange-500"
                            style={{ top: `${topPx}px` }}
                          >
                            <div className="hidden group-hover:inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-br-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                              <span>🎯 {g.name}</span>
                              <span className="opacity-60">· Todo</span>
                              <span className="opacity-60">· {g.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    {sortedTasksWithGap.map((task, i) =>
                      renderTaskBlock(task, i, day.full === today, day.full),
                    )}
                    {dragState &&
                      (dragState.previewDayKey ?? dragState.dayKey) === day.full.toLowerCase() &&
                      dragState.previewStartMinutes !== null && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed rounded bg-blue-400/20 dark:bg-blue-500/20 border-blue-500 dark:border-blue-400"
                          style={{
                            top: `${dragState.previewStartMinutes * pxPerMinute}px`,
                            height: `${dragState.taskDuration * pxPerMinute}px`,
                          }}
                        >
                          <div
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-1 ml-1 inline-block bg-blue-500 dark:bg-blue-400 text-white dark:text-gray-900"
                          >
                            {minutesToTimeStr(dragState.previewStartMinutes)} →{" "}
                            {minutesToTimeStr(
                              dragState.previewStartMinutes +
                                dragState.taskDuration,
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}

            {/* Now line */}
            <div
              className="absolute w-[90%] ml-[10%] h-[2px] border-t-2 z-20 border-green-600 dark:border-green-500"
              style={{ top: `${nowHeight - 1}px` }}
            />
            <div
              className="absolute text-xs font-bold px-2.5 py-1 rounded-md left-[6.8%] z-20 shadow-sm border bg-green-600 dark:bg-green-700 text-white border-green-700 dark:border-green-600"
              style={{ top: `${nowHeight - 13}px` }}
            >
              Now
            </div>
          </div>
        </div>
      {hoveredTask && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl border text-xs max-w-[200px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
          style={{ left: cursorPos.x + 14, top: cursorPos.y + 10 }}
        >
          <div className="font-semibold mb-0.5 truncate">{hoveredTask.name}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">{hoveredTask.time}</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">{formatDuration(hoveredTask.minutes)}</div>
        </div>
      )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TABLET / MOBILE VARIANT — single-day column with capsules
  // ═══════════════════════════════════════════════════════════

  const isMobile = variant === "mobile";
  const containerClass = isMobile
    ? `h-full block pb-[80px] sm:hidden relative scrollbar overflow-auto ${!isSidebarOpen ? "px-[10px]" : "px-0"}`
    : `h-full hidden sm:block lg:hidden relative scrollbar overflow-auto px-[10px] pb-[30px]`;

  return (
    <>
      <div
        ref={scrollContainerRef}
        className={`${containerClass} bg-[#ffffff] dark:bg-[#000000] scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-[#eeeeee] dark:scrollbar-track-gray-900`}
      >
        {/* Sticky header area */}
        <div className="sticky top-0 left-0 z-30 bg-inherit">
          {/* Zoom + Jump to now */}
          {isMobile ? (
            !isSidebarOpen ? (
              <div
                id="nav"
                className="h-[55px] pb-[3px] w-full border-b-[1px] flex items-center justify-between border-gray-300 dark:border-gray-800"
              >
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button
                    onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                    disabled={zoomLevel <= 1}
                    className={`p-1 rounded transition-colors flex items-center justify-center ${
                      zoomLevel >= 8
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                    }`}
                  >
                    <FaMinus size={10} className="sm:size-11" />
                  </button>
                  <span className="font-semibold min-w-[70px] sm:min-w-[90px] text-center text-xs sm:text-sm text-gray-900 dark:text-white">
                    Zoom: {zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                    disabled={zoomLevel >= 8}
                    className={`p-1 rounded transition-colors flex items-center justify-center ${
                      zoomLevel >= 8
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                    }`}
                  >
                    <FaPlus size={10} className="sm:size-11" />
                  </button>
                </div>
                <button
                  onClick={scrollToNow}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium text-xs ml-2 transition-colors duration-200 border-[1px] text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border-green-800/20 dark:border-green-300/20"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>
                    {"Jump to now \u2014 "}
                    {currentTime.replace(/(?<!\d)(AM|PM)/gi, (m) =>
                      m.toUpperCase(),
                    )}
                  </span>
                </button>
              </div>
            ) : (
              <></>
            )
          ) : (
            /* Tablet zoom bar */
            <div
              id="nav"
              className="h-[50px] w-full border-b-[1px] flex items-center justify-between border-gray-300 dark:border-gray-800"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                  disabled={zoomLevel <= 1}
                  className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${
                    zoomLevel >= 8
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                  }`}
                >
                  <FaMinus size={10} />
                </button>
                <span className="font-semibold min-w-[90px] text-center text-sm sm:text-base text-gray-900 dark:text-white">
                  Zoom: {zoomLevel.toFixed(1)}x
                </span>
                <button
                  onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                  disabled={zoomLevel >= 8}
                  className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${
                    zoomLevel >= 8
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border border-green-800/20 dark:border-green-300/20"
                  }`}
                >
                  <FaPlus size={10} />
                </button>
              </div>
              <button
                onClick={scrollToNow}
                className="group flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs ml-2 transition-colors duration-200 border-[1px] text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50/70 dark:hover:bg-green-950/40 bg-green-50/70 dark:bg-green-950/40 border-green-800/20 dark:border-green-300/20"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>
                  {"Jump to now \u2014 "}
                  {currentTime.replace(/(?<!\d)(AM|PM)/gi, (m) =>
                    m.toUpperCase(),
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Date capsules */}
          <div
            className={`w-full py-2 ${isMobile ? (!isSidebarOpen ? "border-b" : "ml-[10px]") : "border-b"} flex items-center justify-between gap-1.5 sm:gap-2.5 border-gray-300 dark:border-gray-800`}
          >
            {weekRealDates.map((d, idx) => {
              const isSelected = selectedDateIndex === idx;
              const isTodayDate = d.isToday;

              // Mobile: when sidebar is open, only show the selected capsule
              if (isMobile && isSidebarOpen && !isSelected) return null;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDay?.(d.dayName.toLowerCase() as Day);
                    setSelectedDateIndex(idx);
                  }}
                  className={`flex-1 max-w-[72px] sm:max-w-[88px] h-[30px] rounded-md sm:rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-medium transition-all border shadow-sm ${
                    isSelected
                      ? "bg-blue-600 dark:bg-blue-700 border-blue-500 text-white"
                      : isTodayDate
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 active:bg-gray-200 dark:active:bg-gray-700/80"
                  }`}
                >
                  <div className="font-semibold tracking-tight">
                    {d.shortDay}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid: timeline + selected day */}
        <div
          className={`grid ${isMobile && isSidebarOpen ? "grid-cols-1" : "grid-cols-2"} mx-auto relative w-full`}
        >
          {/* Timeline column — hidden when mobile sidebar is open */}
          {!(isMobile && isSidebarOpen) && renderTimelineColumn()}

          {/* Selected day column */}
          {selectedDateIndex !== null &&
            (() => {
              const dayInfo = weekRealDates[selectedDateIndex];
              if (!dayInfo) return null;
              const dayKey = getDayKeyFromIndex(selectedDateIndex);
              const sortedTasksWithGap = buildTasksWithGaps(dayKey);

              return (
                <div
                  className={`${isMobile && isSidebarOpen ? "pt-1" : "border-l pt-5"} border-b col-span-1 border-gray-300 dark:border-gray-800`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragState || dragState.dayKey !== dayKey) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropY = e.clientY - rect.top;
                    const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                    const clamped = Math.max(
                      0,
                      Math.min(1440 - dragState.taskDuration, snapped),
                    );
                    setDragState((prev) =>
                      prev ? { ...prev, previewStartMinutes: clamped } : prev,
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!dragState || !auth?.routine || !dayInfo) return;
                    if (dragState.dayKey !== dayKey) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropY = e.clientY - rect.top;
                    const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                    const clamped = Math.max(
                      0,
                      Math.min(1440 - dragState.taskDuration, snapped),
                    );
                    const offset = clamped - dragState.taskStartMinutes;
                    const updated = { ...auth.routine };

                    // Collect which days need updating
                    const daysToUpdate = daysOfWeek.filter((d) =>
                      d === dragState.dayKey ||
                      (syncDrag && (updated[d] || []).some((t) => t.name === dragState.taskName))
                    );

                    // Validate all affected days first
                    const conflicts: string[] = [];
                    daysToUpdate.forEach((d) => {
                      const tStart = timeToMinutes(
                        ((updated[d] || []) as IRoutineItem[]).find(
                          (t) => t.name === dragState.taskName
                        )?.time.split(" - ")[0] ?? "12:00 AM"
                      );
                      const newStart = Math.max(0, Math.min(1440 - dragState.taskDuration, tStart + offset));
                      const check = validateDrop(updated, dragState.taskName, d, newStart, dragState.taskDuration);
                      if (!check.valid) {
                        conflicts.push(`"${check.conflictTask}" on ${d.charAt(0).toUpperCase() + d.slice(1)}`);
                      }
                    });

                    if (conflicts.length > 0) {
                      alert(`Cannot move task — it overlaps with:\n${conflicts.join("\n")}`);
                      setDragState(null);
                      return;
                    }

                    daysToUpdate.forEach((d) => {
                      updated[d] = (updated[d] || [])
                        .map((t) => {
                          if (t.name !== dragState.taskName) return t;
                          const tStart = timeToMinutes(t.time.split(" - ")[0]);
                          const newStart = Math.max(
                            0,
                            Math.min(1440 - dragState.taskDuration, tStart + offset),
                          );
                          return {
                            ...t,
                            time: `${minutesToTimeStr(newStart)} - ${minutesToTimeStr(newStart + dragState.taskDuration)}`,
                          };
                        })
                        .sort(
                          (a, b) =>
                            timeToMinutes(a.time.split(" - ")[0]) -
                            timeToMinutes(b.time.split(" - ")[0]),
                        );
                    });

                    if (updateRoutineWithHistory) {
                      updateRoutineWithHistory(updated as IRoutine);
                    } else {
                      setAuth({ ...auth, routine: updated });
                      setHasUnsavedChanges(true);
                    }
                    setDragState(null);
                  }}
                >
                  <div className="relative">
                    {goals
                      .filter((g) => {
                        if (g.status !== "todo" || !g.time) return false;
                        if (!dayInfo.isToday) return false;
                        if (g.dueDate && g.dueDate !== _todayISO) return false;
                        return true;
                      })
                      .map((g) => {
                        const parts = String(g.time).trim().split(":");
                        if (parts.length < 2) return null;
                        const h = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        if (isNaN(h) || isNaN(m)) return null;
                        const goalMins = h * 60 + m;
                        const topPx = goalMins * pxPerMinute;
                        const dayTasks = routine[dayKey as keyof typeof routine] || [];
                        const isCovered = dayTasks.some((t) => {
                          if (!t.time.includes(" - ")) return false;
                          const [s, e] = t.time.split(" - ").map((x) => x.trim());
                          const ts = timeToMinutes(s);
                          const te = timeToMinutes(e);
                          return goalMins >= ts && goalMins < te;
                        });
                        if (isCovered) return null;
                        return (
                          <div
                            key={g.id}
                            className="absolute left-0 right-0 z-10 group border-t-2 border-dashed cursor-pointer border-orange-400 dark:border-orange-500"
                            style={{ top: `${topPx}px` }}
                          >
                            <div className="hidden group-hover:inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-br-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                              <span>🎯 {g.name}</span>
                              <span className="opacity-60">· Todo</span>
                              <span className="opacity-60">· {g.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    {sortedTasksWithGap.map((task, i) =>
                      renderTaskBlock(
                        task,
                        i,
                        dayInfo.isToday,
                        dayInfo.dayName,
                      ),
                    )}
                    {dragState &&
                      dragState.dayKey === dayKey &&
                      dragState.previewStartMinutes !== null && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed rounded bg-blue-400/20 dark:bg-blue-500/20 border-blue-500 dark:border-blue-400"
                          style={{
                            top: `${dragState.previewStartMinutes * pxPerMinute}px`,
                            height: `${dragState.taskDuration * pxPerMinute}px`,
                          }}
                        >
                          <div
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-1 ml-1 inline-block bg-blue-500 dark:bg-blue-400 text-white dark:text-gray-900"
                          >
                            {minutesToTimeStr(dragState.previewStartMinutes)} →{" "}
                            {minutesToTimeStr(
                              dragState.previewStartMinutes +
                                dragState.taskDuration,
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })()}

          {/* Now indicators — hidden when mobile sidebar is open */}
          {!(isMobile && isSidebarOpen) && (
            <>
              <div
                className={`absolute left-[${isMobile ? "35" : "35"}%] right-0 h-[2px] border-t-2 z-20 border-green-600 dark:border-green-500`}
                style={{ top: `${nowHeight - 1}px` }}
              />
              <div
                className={`absolute text-xs font-bold px-2.5 py-1 rounded-md left-[${isMobile ? "27" : "32"}%] z-20 shadow-sm border bg-green-600 dark:bg-green-700 text-white border-green-700 dark:border-green-600`}
                style={{ top: `${nowHeight - 13}px` }}
              >
                Now
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}