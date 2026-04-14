// src/components/AIRoutineBoard.tsx
"use client";

import {
  AIRoutineData,
  AIRoutineItem,
  appendChatMessage,
  ChatMessage,
  ChatSession,
  clearChatSession,
  getAIRoutineDoc,
  incrementThisMonthPremiumCount,
  upsertAIRoutine,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { aiRoutineResponse } from "@/app/server";
import { AnimatePresence, motion as m, motion, Variants } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

// ─── Module-level audio persistence (survives route changes) ──
let _aiPersistedAudio: HTMLAudioElement | null = null;
let _aiPersistedAlert: { name: string; time: string } | null = null;

// ─── Constants ─────────────────────────────────────────────
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

const CATEGORY_DOT: Record<string, string> = {
  Health: "bg-emerald-500",
  Meals: "bg-green-500",
  Sleep: "bg-teal-600",
  Work: "bg-blue-600",
  Productivity: "bg-indigo-500",
  Errands: "bg-orange-500",
  Chores: "bg-amber-600",
  Groceries: "bg-red-500",
  Relax: "bg-purple-400",
  Other: "bg-gray-500",
};

const EMPTY_ROUTINE: AIRoutineData = {
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

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

// ── Portal helpers ──────────────────────────────────────────
const portalTimeToMinutes = (h: string, m: string, p: "AM" | "PM"): number => {
  let hour = parseInt(h) || 0;
  const min = parseInt(m) || 0;
  if (p === "PM" && hour !== 12) hour += 12;
  if (p === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
};

const parseTimeToPortal = (timeStr: string) => {
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hour: "", minute: "", period: "AM" as "AM" | "PM" };
  return {
    hour: match[1],
    minute: match[2],
    period: match[3].toUpperCase() as "AM" | "PM",
  };
};

// ─── Time Helpers ───────────────────────────────────────────
const timeToMinutes = (t: string): number => {
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + min;
};

const getDuration = (timeRange: string): number => {
  const parts = timeRange.split(" - ");
  if (parts.length !== 2) return 60;
  const endStr = parts[1].trim();
  const s = timeToMinutes(parts[0]);
  let e = endStr === "12:00 AM" ? 1440 : timeToMinutes(endStr);
  if (s === -1 || e === -1) return 60;
  if (e < s) e += 1440;
  if (e === s) return 1440 - s;
  return Math.max(1, e - s);
};

const formatDuration = (m: number) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min === 0 ? `${h}h` : `${h}h ${min}m`;
};

const minutesToTime = (mins: number): string => {
  if (mins >= 1440) return "12:00 AM";
  const clamped = ((mins % 1440) + 1440) % 1440;
  let h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const ampm = h < 12 ? "AM" : "PM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const aiTimeToMinutesFull = (t: string): number => {
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + min;
};

const validateAIPortal = (
  fromH: string,
  fromM: string,
  fromP: "AM" | "PM",
  toH: string,
  toM: string,
  toP: "AM" | "PM",
  name: string,
  tasks: AIRoutineItem[],
  excludeName?: string,
): string | null => {
  if (!name.trim()) return "Task name is required";
  const fH = parseInt(fromH);
  const tH = parseInt(toH);
  if (isNaN(fH) || fH < 1 || fH > 12) return "Start hour must be 1–12";
  const fM = parseInt(fromM);
  if (isNaN(fM) || fM < 0 || fM > 59) return "Start minute 00–59";
  if (isNaN(tH) || tH < 1 || tH > 12) return "End hour must be 1–12";
  const tM = parseInt(toM);
  if (isNaN(tM) || tM < 0 || tM > 59) return "End minute 00–59";
  const fromMins = portalTimeToMinutes(fromH, fromM, fromP);
  const toMins =
    toH === "12" && toM === "00" && toP === "AM"
      ? 1440
      : portalTimeToMinutes(toH, toM, toP);
  if (toMins <= fromMins) return "End time must be after start time";
  if (toMins - fromMins < 5) return "Task must be at least 5 minutes";
  const hasDup = tasks.some(
    (t) =>
      t.name !== excludeName &&
      t.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (hasDup) return "A task with this name already exists on this day";
  const hasOverlap = tasks.some((t) => {
    if (t.name === excludeName) return false;
    const s = aiTimeToMinutesFull(t.time.split(" - ")[0]);
    const rawE = t.time.split(" - ")[1]?.trim();
    const e = rawE === "12:00 AM" ? 1440 : aiTimeToMinutesFull(rawE ?? "");
    return fromMins < e && toMins > s;
  });
  if (hasOverlap) return "Time overlaps with an existing task";
  return null;
};

const buildTasksWithGaps = (tasks: AIRoutineItem[]) => {
  const validTasks = tasks.filter((t) => {
    if (!t.time?.includes(" - ")) return false;
    const [s, e] = t.time.split(" - ");
    return timeToMinutes(s) !== -1 && timeToMinutes(e) !== -1;
  });
  const sorted = [...validTasks].sort(
    (a, b) =>
      timeToMinutes(a.time.split(" - ")[0]) -
      timeToMinutes(b.time.split(" - ")[0]),
  );
  const result: (AIRoutineItem & { isDummy?: boolean })[] = [];
  let prev = 0;
  for (const task of sorted) {
    const start = timeToMinutes(task.time.split(" - ")[0]);
    const dur = getDuration(task.time);
    if (start > prev) {
      result.push({
        name: "dummy",
        isDummy: true,
        time: `${minutesToTime(prev)} - ${minutesToTime(start)}`,
      });
    }
    result.push(task);
    prev = Math.min(1440, start + dur);
  }
  if (prev < 1440) {
    result.push({
      name: "dummy",
      isDummy: true,
      time: `${minutesToTime(prev)} - 12:00 AM`,
    });
  }
  return result;
};

const getMinutesPerSlot = (zoom: number) => {
  if (zoom <= 1.5) return 30;
  if (zoom <= 3) return 15;
  if (zoom <= 3.5) return 10;
  return 5;
};

const renderBold = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>,
  );
};

// ─── Chat Input (isolated so typing doesn't re-render parent) ─
interface ChatInputAreaProps {
  onSend: (text: string) => void;
  isThinking: boolean;
  theme: boolean;
  suggestedText: { text: string; id: number };
}

const ChatInputArea = memo(function ChatInputArea({
  onSend,
  isThinking,
  theme,
  suggestedText,
}: ChatInputAreaProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (suggestedText.text) setText(suggestedText.text);
  }, [suggestedText.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!text.trim() || isThinking) return;
    onSend(text.trim());
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`relative flex items-end gap-1.5 p-1.5 rounded-lg border ${
        theme ? "bg-white border-gray-300" : "bg-gray-950 border-gray-700"
      }`}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={isThinking ? "Thinking..." : "Ask AI to update your routine..."}
        rows={2}
        className={`flex-1 resize-none text-xs outline-none bg-transparent py-0.5 px-1 ${
          theme
            ? "text-gray-900 placeholder:text-gray-400"
            : "text-gray-100 placeholder:text-gray-600"
        }`}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || isThinking}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition ${
          !text.trim() || isThinking
            ? "bg-gray-300/40 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
      >
        <FaArrowUp size={11} />
      </button>
    </div>
  );
});

// ─── Main Component ────────────────────────────────────────
export default function AIRoutineBoard() {
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();

  // ── Sidebar state (mirrors DashBoard) ─────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // ── Routine + timeline state ───────────────────────────────
  const [aiRoutine, setAiRoutine] = useState<AIRoutineData>(EMPTY_ROUTINE);
  const [undoStack, setUndoStack] = useState<AIRoutineData[]>([]);
  const [redoStack, setRedoStack] = useState<AIRoutineData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Day>("saturday");
  const [zoomLevel, setZoomLevel] = useState(3.5);
  const [nowHeight, setNowHeight] = useState(() => {
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) * 3.5 + 20;
  });
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  );
  const [daysOfWeekOrder, setDaysOfWeekOrder] = useState([
    { full: "Saturday", short: "Sat" },
    { full: "Sunday", short: "Sun" },
    { full: "Monday", short: "Mon" },
    { full: "Tuesday", short: "Tue" },
    { full: "Wednesday", short: "Wed" },
    { full: "Thursday", short: "Thu" },
    { full: "Friday", short: "Fri" },
  ]);
  // Tablet/mobile date capsules
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

  // ── Chat state ─────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeDate, setActiveDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );
  const [suggestedText, setSuggestedText] = useState({ text: "", id: 0 });
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<{
    name: string;
    time: string;
    dur: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // ── Task alert state ───────────────────────────────────────
  const [taskAlert, setTaskAlert] = useState<{
    name: string;
    time: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedRef = useRef<string | null>(null);

  // ── Manual edit/add portal state ──────────────────────────
  const [portalMode, setPortalMode] = useState<"add" | "edit" | null>(null);
  const [portalDay, setPortalDay] = useState<Day>("saturday");
  const [portalTaskName, setPortalTaskName] = useState("");
  const [portalCategory, setPortalCategory] = useState("");
  const [portalFromHour, setPortalFromHour] = useState("");
  const [portalFromMinute, setPortalFromMinute] = useState("");
  const [portalFromPeriod, setPortalFromPeriod] = useState<"AM" | "PM">("AM");
  const [portalToHour, setPortalToHour] = useState("");
  const [portalToMinute, setPortalToMinute] = useState("");
  const [portalToPeriod, setPortalToPeriod] = useState<"AM" | "PM">("AM");
  const [portalOriginalName, setPortalOriginalName] = useState("");
  const [portalMessage, setPortalMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dragState, setDragState] = useState<{
    taskName: string;
    dayKey: Day;
    taskStartMinutes: number;
    taskDuration: number;
    previewStartMinutes: number | null;
    previewDayKey?: Day;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerDesktopRef = useRef<HTMLDivElement>(null);
  const scrollContainerTabletRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatScrollDesktopRef = useRef<HTMLDivElement>(null);
  const chatScrollTabletRef = useRef<HTMLDivElement>(null);
  const chatScrollMobileRef = useRef<HTMLDivElement>(null);

  const scrollAllChatsToBottom = () => {
    [chatScrollDesktopRef, chatScrollTabletRef, chatScrollMobileRef].forEach(
      (ref) => {
        if (ref.current) {
          ref.current.scrollTop = ref.current.scrollHeight;
        }
      },
    );
  };

  // ── Undo / Redo helpers ────────────────────────────────────
  const updateAIRoutine = (newRoutine: AIRoutineData) => {
    setUndoStack((prev) => [...prev.slice(-30), aiRoutine]);
    setRedoStack([]);
    setAiRoutine(newRoutine);
    if (auth?.email)
      upsertAIRoutine(auth.email, newRoutine).catch(console.error);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const undo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [aiRoutine, ...prev]);
    setUndoStack((prev) => prev.slice(0, -1));
    setAiRoutine(previous);
    if (auth?.email) upsertAIRoutine(auth.email, previous).catch(console.error);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, aiRoutine]);
    setRedoStack((prev) => prev.slice(1));
    setAiRoutine(next);
    if (auth?.email) upsertAIRoutine(auth.email, next).catch(console.error);
  };

  // ── Dismiss alert ──────────────────────────────────────────
  const dismissAlert = () => {
    _aiPersistedAlert = null;
    setTaskAlert(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const activeMessages: ChatMessage[] =
    chatHistory.find((s) => s.date === activeDate)?.messages ?? [];

  // ── Premium check ──────────────────────────────────────────
  const MAX_RESPONSES = 100; // Updated to 100 per month
  const currentMonthStr = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
  });

  const isPremium = (): boolean =>
    (auth?.paymentType?.toLowerCase() ?? "").includes("premium");

  const getCurrentCount = (): number => {
    if (!auth?.thisMonthPremiumResponses) return 0;
    const parts = auth.thisMonthPremiumResponses.split(" ");
    if (parts.length !== 2 || parts[0] !== currentMonthStr) return 0;
    return Number(parts[1]) || 0;
  };

  const isLimitReached = getCurrentCount() >= MAX_RESPONSES;

  // ── Derived timeline values ────────────────────────────────
  const pxPerMinute = zoomLevel;
  const hourHeight = 60 * pxPerMinute;
  const minutesPerSlot = getMinutesPerSlot(zoomLevel);
  const slotsPerHour = 60 / minutesPerSlot;
  const today = new Date().toLocaleString("en-US", { weekday: "long" });

  // ── Animation (mirrors DashBoard) ─────────────────────────
  const spring = { stiffness: 320, damping: 32, mass: 1 };
  const transition = hasMounted ? spring : undefined;

  // ── Width values (same as DashBoard) ──────────────────────
  const sidebar = { closed: "5%", open: "30%" };
  const main = { closed: "95%", open: "70%" };
  const sidebarTablet = { closed: "9%", open: "40%" };
  const mainTablet = { closed: "91%", open: "60%" };
  const sidebarMobile = { closed: "13%", open: "70%" };
  const mainMobile = { closed: "87%", open: "30%" };

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Audio setup ────────────────────────────────────────────
  useEffect(() => {
    if (!_aiPersistedAudio) {
      _aiPersistedAudio = new Audio("/ringtone.mp3");
      _aiPersistedAudio.loop = true;
    }
    audioRef.current = _aiPersistedAudio;

    // Unlock audio on first user interaction (browser autoplay policy)
    const unlock = () => {
      if (!audioRef.current) return;
      audioRef.current.load();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock);

    if (_aiPersistedAlert) {
      setTaskAlert(_aiPersistedAlert);
      audioRef.current.play().catch(() => {});
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  // ── Task alert checker ─────────────────────────────────────
  const aiRoutineRef = useRef<AIRoutineData>(EMPTY_ROUTINE);
  useEffect(() => {
    aiRoutineRef.current = aiRoutine;
  }, [aiRoutine]);

  useEffect(() => {
    if (!auth?.email) return;

    const checkTasks = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const alertKey = `${currentHour}:${currentMinute}`;
      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ] as const;
      const todayKey = days[now.getDay()] as Day;
      const todayTasks = aiRoutineRef.current[todayKey] || [];
      for (const task of todayTasks) {
        if (!task.time?.includes(" - ")) continue;
        const startStr = task.time.split(" - ")[0].trim();
        const match = startStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) continue;
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        if (hour === currentHour && minute === currentMinute) {
          const taskAlertKey = `${alertKey}-${task.name}`;
          if (alertedRef.current === taskAlertKey) break;
          alertedRef.current = taskAlertKey;
          const alert = { name: task.name, time: startStr };
          _aiPersistedAlert = alert;
          setTaskAlert(alert);
          audioRef.current?.play().catch(() => {});
          break;
        }
      }
    };

    // Align interval to the start of the next minute
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      checkTasks();
      intervalId = setInterval(checkTasks, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [auth?.email]);

  useEffect(() => {
    if (!auth?.email || !isPremium()) return;
    const parts = auth.thisMonthPremiumResponses?.split(" ") ?? [];
    if (parts.length === 2 && parts[0] === currentMonthStr) return;
    const newValue = `${currentMonthStr} 0`;
    setAuth({ ...auth, thisMonthPremiumResponses: newValue });
    incrementThisMonthPremiumCount(auth.email, newValue)
      .then((result) => console.log("Monthly initialization result:", result))
      .catch((error) =>
        console.error("Failed to initialize monthly count:", error),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.email]);

  useEffect(() => {
    if (!auth?.email) return;
    setLoadingRoutine(true);
    getAIRoutineDoc(auth.email)
      .then(({ aiRoutine, chatHistory }) => {
        setAiRoutine(aiRoutine);
        setChatHistory(chatHistory);
        setLoadingRoutine(false);
      })
      .catch((err) => {
        console.error("Failed to load AI routine:", err);
        setLoadingRoutine(false);
      });
  }, [auth?.email]);

  useEffect(() => {
    const todayLower = new Date()
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase() as Day;
    setSelectedDay(todayLower);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setNowHeight((now.getHours() * 60 + now.getMinutes()) * pxPerMinute + 20);
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [pxPerMinute]);

  useEffect(() => {
    setTimeout(scrollAllChatsToBottom, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessages.length, activeMessages[activeMessages.length - 1]?.text]);

  useEffect(() => {
    if (isSidebarOpen) {
      setTimeout(scrollAllChatsToBottom, 100);
      setTimeout(scrollAllChatsToBottom, 300);
      setTimeout(scrollAllChatsToBottom, 600);
    }
  }, [isSidebarOpen]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (isTyping) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setUndoStack((prevUndo) => {
          if (prevUndo.length === 0) return prevUndo;
          const previous = prevUndo[prevUndo.length - 1];
          setAiRoutine((current) => {
            setRedoStack((prevRedo) => [current, ...prevRedo]);
            if (auth?.email)
              upsertAIRoutine(auth.email, previous).catch(console.error);
            return previous;
          });
          return prevUndo.slice(0, -1);
        });
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        setRedoStack((prevRedo) => {
          if (prevRedo.length === 0) return prevRedo;
          const next = prevRedo[0];
          setAiRoutine((current) => {
            setUndoStack((prevUndo) => [...prevUndo, current]);
            if (auth?.email)
              upsertAIRoutine(auth.email, next).catch(console.error);
            return next;
          });
          return prevRedo.slice(1);
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [auth?.email]);

  // Sync selectedDateIndex when selectedDay changes (tablet/mobile)
  useEffect(() => {
    if (selectedDay) {
      const dayIndex = daysOfWeek.indexOf(selectedDay);
      setSelectedDateIndex(dayIndex !== -1 ? dayIndex : null);
    }
  }, [selectedDay]);

  // Build real dates for tablet/mobile capsules
  useEffect(() => {
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
  }, []);

  // ── Time slots ─────────────────────────────────────────────
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += minutesPerSlot) {
        const hh = h % 12 || 12;
        const ampm = h < 12 ? "AM" : "PM";
        slots.push(`${hh}:${m.toString().padStart(2, "0")} ${ampm}`);
      }
    }
    return slots;
  }, [minutesPerSlot]);

  // ── Scroll to now ──────────────────────────────────────────
  const scrollToNow = () => {
    // Pick the correct ref based on which container is actually visible/scrollable
    const refs = [
      scrollContainerDesktopRef.current,
      scrollContainerTabletRef.current,
      scrollContainerRef.current,
    ];
    // Use the one that has actual scrollHeight (is rendered and has content)
    const c =
      refs.find((r) => r && r.scrollHeight > r.clientHeight) ??
      refs.find((r) => r != null) ??
      null;
    if (!c) return;
    const top = nowHeight - c.clientHeight / 2;
    const maxScroll = Math.max(0, c.scrollHeight - c.clientHeight);
    c.scrollTo({
      top: Math.min(maxScroll, Math.max(0, top)),
      behavior: "smooth",
    });
  };

  // ── Rotate week ────────────────────────────────────────────
  const rotateWeekLeft = () => {
    setDaysOfWeekOrder((prev) => {
      const n = [...prev];
      const last = n.pop()!;
      n.unshift(last);
      return n;
    });
  };
  const rotateWeekRight = () => {
    setDaysOfWeekOrder((prev) => {
      const n = [...prev];
      const first = n.shift()!;
      n.push(first);
      return n;
    });
  };

  // ── Portal open/close handlers ─────────────────────────────
  const openAddPortal = (day: Day, startStr?: string, endStr?: string) => {
    setPortalMode("add");
    setPortalDay(day);
    setPortalTaskName("");
    setPortalCategory("");
    setPortalMessage(null);
    if (startStr) {
      const p = parseTimeToPortal(startStr);
      setPortalFromHour(p.hour);
      setPortalFromMinute(p.minute);
      setPortalFromPeriod(p.period);
    } else {
      setPortalFromHour("9");
      setPortalFromMinute("00");
      setPortalFromPeriod("AM");
    }
    if (endStr) {
      const p = parseTimeToPortal(endStr);
      setPortalToHour(p.hour);
      setPortalToMinute(p.minute);
      setPortalToPeriod(p.period);
    } else {
      setPortalToHour("10");
      setPortalToMinute("00");
      setPortalToPeriod("AM");
    }
  };

  const openEditPortal = (day: Day, task: AIRoutineItem) => {
    const [fromStr, toStr] = task.time.split(" - ");
    const fp = parseTimeToPortal(fromStr);
    const tp = parseTimeToPortal(toStr);
    setPortalMode("edit");
    setPortalDay(day);
    setPortalOriginalName(task.name);
    setPortalTaskName(task.name);
    setPortalCategory(task.category ?? "");
    setPortalFromHour(fp.hour);
    setPortalFromMinute(fp.minute);
    setPortalFromPeriod(fp.period);
    setPortalToHour(tp.hour);
    setPortalToMinute(tp.minute);
    setPortalToPeriod(tp.period);
    setPortalMessage(null);
  };

  const closePortal = () => {
    setPortalMode(null);
    setPortalMessage(null);
  };

  const handlePortalAdd = () => {
    const dayTasks = aiRoutine[portalDay] || [];
    const err = validateAIPortal(
      portalFromHour,
      portalFromMinute,
      portalFromPeriod,
      portalToHour,
      portalToMinute,
      portalToPeriod,
      portalTaskName,
      dayTasks,
    );
    if (err) {
      setPortalMessage({ type: "error", text: err });
      return;
    }
    const fromStr = `${portalFromHour.padStart(2, "0")}:${portalFromMinute.padStart(2, "0")} ${portalFromPeriod}`;
    const toStr = `${portalToHour.padStart(2, "0")}:${portalToMinute.padStart(2, "0")} ${portalToPeriod}`;
    const newTask: AIRoutineItem = {
      name: portalTaskName.trim(),
      time: `${fromStr} - ${toStr}`,
      category: portalCategory,
    };
    const updated = { ...aiRoutine, [portalDay]: [...dayTasks, newTask] };
    updateAIRoutine(updated);
    setPortalMessage({ type: "success", text: "Task added!" });
    setTimeout(() => closePortal(), 800);
  };

  const handlePortalEdit = () => {
    const dayTasks = aiRoutine[portalDay] || [];
    const err = validateAIPortal(
      portalFromHour,
      portalFromMinute,
      portalFromPeriod,
      portalToHour,
      portalToMinute,
      portalToPeriod,
      portalTaskName,
      dayTasks,
      portalOriginalName,
    );
    if (err) {
      setPortalMessage({ type: "error", text: err });
      return;
    }
    const fromStr = `${portalFromHour.padStart(2, "0")}:${portalFromMinute.padStart(2, "0")} ${portalFromPeriod}`;
    const toStr = `${portalToHour.padStart(2, "0")}:${portalToMinute.padStart(2, "0")} ${portalToPeriod}`;
    const updated = {
      ...aiRoutine,
      [portalDay]: dayTasks.map((t) =>
        t.name === portalOriginalName
          ? {
              ...t,
              name: portalTaskName.trim(),
              time: `${fromStr} - ${toStr}`,
              category: portalCategory,
            }
          : t,
      ),
    };
    updateAIRoutine(updated);
    setPortalMessage({ type: "success", text: "Task updated!" });
    setTimeout(() => closePortal(), 800);
  };

  const handlePortalDelete = () => {
    const sure = confirm(`Delete "${portalOriginalName}" from ${portalDay}?`);
    if (!sure) return;
    const updated = {
      ...aiRoutine,
      [portalDay]: (aiRoutine[portalDay] || []).filter(
        (t) => t.name !== portalOriginalName,
      ),
    };
    updateAIRoutine(updated);
    closePortal();
  };

  // ── Drag helpers ────────────────────────────────────────────
  const validateAIDrop = (
    routine: AIRoutineData,
    taskName: string,
    dayKey: Day,
    newStart: number,
    duration: number,
  ): { valid: boolean; conflict?: string } => {
    const newEnd = newStart + duration;
    for (const t of routine[dayKey] || []) {
      if (t.name === taskName) continue;
      const s = aiTimeToMinutesFull(t.time.split(" - ")[0]);
      const rawE = t.time.split(" - ")[1]?.trim();
      const e = rawE === "12:00 AM" ? 1440 : aiTimeToMinutesFull(rawE ?? "");
      if (newStart < e && newEnd > s) return { valid: false, conflict: t.name };
    }
    return { valid: true };
  };

  // ── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim() || isThinking || !auth?.email) return;
    if (!isPremium() || isLimitReached) return;

    const timestamp = new Date().toISOString();
    setIsThinking(true);

    const userMsgObj: ChatMessage = { role: "user", text: userMsg, timestamp };
    const loadingMsg: ChatMessage = { role: "ai", text: "loading", timestamp };

    setChatHistory((prev) => {
      const existing = prev.find((s) => s.date === activeDate);
      if (existing) {
        return prev.map((s) =>
          s.date === activeDate
            ? { ...s, messages: [...s.messages, userMsgObj, loadingMsg] }
            : s,
        );
      }
      return [
        ...prev,
        { date: activeDate, messages: [userMsgObj, loadingMsg] },
      ];
    });

    const convForAI: [string, string][] = [];
    const msgs = activeMessages;
    for (let i = 0; i + 1 < msgs.length; i += 2) {
      if (
        msgs[i]?.role === "user" &&
        msgs[i + 1]?.role === "ai" &&
        msgs[i + 1].text !== "loading"
      ) {
        convForAI.push([msgs[i].text, msgs[i + 1].text]);
      }
    }

    try {
      const result = await aiRoutineResponse(
        userMsg,
        convForAI,
        JSON.stringify(auth.routine ?? {}),
        JSON.stringify(aiRoutine),
      );
      const aiMsg: ChatMessage = {
        role: "ai",
        text: result.text,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) =>
        prev.map((s) => {
          if (s.date !== activeDate) return s;
          const updated = [...s.messages];
          updated[updated.length - 1] = aiMsg;
          return { ...s, messages: updated };
        }),
      );
      await appendChatMessage(auth.email, activeDate, userMsgObj);
      await appendChatMessage(auth.email, activeDate, aiMsg);
      const newCount = getCurrentCount() + 1;
      const newValue = `${currentMonthStr} ${newCount}`;
      setAuth({ ...auth, thisMonthPremiumResponses: newValue });

      try {
        const updateResult = await incrementThisMonthPremiumCount(
          auth.email,
          newValue,
        );
        console.log("Premium count update result:", updateResult);
      } catch (updateError) {
        console.error(
          "Failed to update premium count in database:",
          updateError,
        );
        // Revert the UI state if database update failed
        setAuth({
          ...auth,
          thisMonthPremiumResponses: `${currentMonthStr} ${newCount - 1}`,
        });
      }

      if (result.updatedRoutine) {
        updateAIRoutine(result.updatedRoutine);
      }
    } catch {
      const errMsg: ChatMessage = {
        role: "ai",
        text: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) =>
        prev.map((s) => {
          if (s.date !== activeDate) return s;
          const updated = [...s.messages];
          updated[updated.length - 1] = errMsg;
          return { ...s, messages: updated };
        }),
      );
    } finally {
      setIsThinking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, activeDate, activeMessages, aiRoutine, isThinking, isLimitReached]);

  // ── Format helpers ─────────────────────────────────────────
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString(
      "en-CA",
    );
    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sortedHistoryDates = [...chatHistory]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => s.date);

  // ── Timeline column ────────────────────────────────────────
  const renderTimelineColumn = () => (
    <div
      className={`text-base pt-5 font-medium col-span-1 ${theme ? "text-gray-800" : "text-gray-200"}`}
    >
      {timeSlots.map((time) => (
        <div
          key={time}
          className={`w-full text-xs border-t ${theme ? "border-gray-400" : "border-gray-500"}`}
          style={{ height: `${hourHeight / slotsPerHour}px` }}
        >
          <div className="flex relative justify-center items-center">
            <div
              className={`absolute px-2 left-0 rounded-md text-xs font-medium shadow-sm ${theme ? "bg-white text-gray-700 border border-gray-200" : "bg-gray-900 text-gray-300 border border-gray-700"}`}
            >
              {time}
            </div>
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
                  className={`w-[10%] absolute right-0 border-t ${theme ? "border-gray-400/70" : "border-gray-500/70"}`}
                  style={{
                    top: `${(hourHeight / slotsPerHour / count) * index - 1}px`,
                  }}
                />
              ));
            })()}
          </div>
        </div>
      ))}
      <div
        className={`w-full text-xs border-t ${theme ? "border-gray-400" : "border-gray-500"}`}
        style={{ height: "1px" }}
      >
        <div className="flex relative justify-center items-center">
          <div
            className={`absolute px-2 left-0 rounded-md text-xs font-medium shadow-sm ${theme ? "bg-white text-gray-700 border border-gray-200" : "bg-gray-900 text-gray-300 border border-gray-700"}`}
          >
            12:00 AM
          </div>
        </div>
      </div>
    </div>
  );

  // ── Task block ─────────────────────────────────────────────
  const renderTaskBlock = (
    task: AIRoutineItem & { isDummy?: boolean },
    i: number,
    isToday: boolean,
    dayName?: string,
  ) => {
    const dur = getDuration(task.time);
    const height = dur * pxPerMinute;
    const isSmall = height < 15 * pxPerMinute && !task.isDummy;
    const dayKey = (dayName?.toLowerCase() ?? "saturday") as Day;
    const isDragging =
      dragState?.taskName === task.name && dragState?.dayKey === dayKey;

    if (task.isDummy) {
      // Free-time block: shows dashed "Add Task" border, click opens add portal
      return (
        <div
          key={i}
          className={`text-sm overflow-hidden border-t transition-colors relative group cursor-pointer ${
            theme
              ? "bg-transparent text-gray-400 hover:bg-purple-50/40 border-t-gray-200"
              : "bg-transparent text-gray-500 hover:bg-purple-950/20 border-t-gray-800"
          }`}
          style={{ height: `${height}px` }}
          onClick={() => {
            const [startStr, endStr] = task.time.split(" - ");
            openAddPortal(dayKey, startStr?.trim(), endStr?.trim());
          }}
        >
          {height >= 20 && (
            <div
              className={`absolute inset-[3px] rounded border-2 border-dashed flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${
                theme ? "border-purple-300" : "border-purple-700"
              }`}
            >
              {height >= 36 && (
                <span
                  className={`text-[9px] font-semibold flex items-center gap-1 ${theme ? "text-purple-400" : "text-purple-500"}`}
                >
                  <span>+</span>
                  <span>{formatDuration(dur)} Free</span>
                </span>
              )}
            </div>
          )}
          {height >= 12 && height < 20 && (
            <div className={`text-[8px] opacity-50 ml-2 mt-0.5`}>
              {formatDuration(dur)} Free
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={i}
        draggable
        className={`text-sm overflow-hidden border-t pr-2 transition-colors relative cursor-grab active:cursor-grabbing ${
          isDragging ? "opacity-40 ring-2 ring-inset ring-purple-400" : ""
        } ${
          isToday
            ? theme
              ? "bg-purple-100/70 text-black border-l-2 border-purple-500/60"
              : "bg-purple-950/50 text-white border-l-2 border-purple-400/60"
            : theme
              ? "bg-gray-100/60 text-gray-800 hover:bg-gray-200/60"
              : "bg-gray-800/50 text-gray-200 hover:bg-gray-700/70 border-t-gray-800"
        }`}
        style={{ height: `${height}px` }}
        onMouseEnter={
          isSmall
            ? (e) => {
                setCursorPos({ x: e.clientX, y: e.clientY });
                setHoveredTask({ name: task.name, time: task.time, dur });
              }
            : undefined
        }
        onMouseMove={
          isSmall
            ? (e) => setCursorPos({ x: e.clientX, y: e.clientY })
            : undefined
        }
        onMouseLeave={isSmall ? () => setHoveredTask(null) : undefined}
        onDragStart={(e) => {
          setDragState({
            taskName: task.name,
            dayKey,
            taskStartMinutes: timeToMinutes(task.time.split(" - ")[0]),
            taskDuration: dur,
            previewStartMinutes: null,
          });
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDragState(null)}
        onClick={() => openEditPortal(dayKey, task)}
      >
        {height < 12 ? null : height < 30 ? (
          <div className="font-medium text-[9px] truncate ml-2.5 flex items-center gap-1.5">
            {task.category && CATEGORY_DOT[task.category] && (
              <span
                className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${CATEGORY_DOT[task.category]}`}
              />
            )}
            <span className="break-words min-w-0 flex-1">{task.name}</span>
          </div>
        ) : height < 60 ? (
          <>
            <div className="flex items-center gap-1.5 ml-2.5 mt-1">
              {task.category && CATEGORY_DOT[task.category] && (
                <span
                  className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${CATEGORY_DOT[task.category]}`}
                />
              )}
              <div className="text-[11px] font-medium break-words min-w-0">
                {task.name}
              </div>
            </div>
            <div className="text-[10px] opacity-70 ml-2.5 truncate">
              {task.time}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 ml-2.5 mt-2">
              {task.category && CATEGORY_DOT[task.category] && (
                <span
                  className={`w-[9px] h-[9px] rounded-full flex-shrink-0 ${CATEGORY_DOT[task.category]}`}
                />
              )}
              <div className="font-medium break-words min-w-0">{task.name}</div>
            </div>
            <div className="text-xs opacity-70 ml-2.5">{task.time}</div>
            <div className="text-[11px] opacity-60 ml-2.5">
              {formatDuration(dur)}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Chat message renderer ──────────────────────────────────
  const renderMessage = (text: string, isLoading: boolean) => {
    const typingVariants: Variants = {
      animate: {
        opacity: [0.3, 1, 0.3],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
      },
    };
    if (isLoading) {
      return (
        <m.div
          className="flex items-center space-x-1.5"
          variants={typingVariants}
          animate="animate"
        >
          {[0, 1, 2].map((i) => (
            <m.span
              key={i}
              className="inline-block w-2 h-2 bg-current rounded-full"
            />
          ))}
        </m.div>
      );
    }
    return text
      .split("[/n]")
      .filter((p) => p.trim())
      .map((para, i) => {
        const lines = para.split("\n").filter((l) => l.trim());
        const hasBullets = lines.some(
          (l) =>
            l.trimStart().startsWith("* ") || l.trimStart().startsWith("- "),
        );
        if (hasBullets) {
          return (
            <ul
              key={i}
              className="list-disc list-inside pl-3 my-2 space-y-1 text-xs sm:text-sm"
            >
              {lines.map((line, li) => (
                <li key={li}>
                  {renderBold(line.replace(/^[\*\-]\s*/, "").trim())}
                </li>
              ))}
            </ul>
          );
        }
        const isBold =
          /^\*\*.*\*\*$/.test(para.trim()) || /^#{1,3}/.test(para.trim());
        const clean = para.replace(/^#{1,6}\s*/, "").trim();
        return (
          <p
            key={i}
            className={`text-xs my-1.5 ${isBold ? "font-bold text-purple-500" : ""}`}
          >
            {renderBold(clean)}
          </p>
        );
      });
  };

  // ── Chat panel content ─────────────────────────────────────
  const renderChatContent = (scrollRef?: React.RefObject<HTMLDivElement>) => {
    if (!isPremium()) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
          <div className="text-4xl mb-4">✨</div>
          <h4
            className={`text-sm font-bold mb-2 ${theme ? "text-gray-800" : "text-gray-200"}`}
          >
            Premium Feature
          </h4>
          <p
            className={`text-xs leading-relaxed mb-4 ${theme ? "text-gray-500" : "text-gray-500"}`}
          >
            Copy your routine here and refine it with a specialized AI daily
            routine expert. Get personalized suggestions, chat interactively,
            and seamlessly replace your routine with your optimized AI routine.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition"
          >
            View Premium Plans →
          </a>
        </div>
      );
    }

    if (showHistory) {
      return (
        <div className="flex-1 overflow-y-auto">
          <div
            className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide border-b ${theme ? "text-gray-400 border-gray-200" : "text-gray-600 border-gray-800"}`}
          >
            Past Conversations
          </div>
          {sortedHistoryDates.length === 0 ? (
            <div
              className={`px-3 py-8 text-center text-[10px] ${theme ? "text-gray-400" : "text-gray-600"}`}
            >
              No conversations yet
            </div>
          ) : (
            sortedHistoryDates.map((date) => {
              const session = chatHistory.find((s) => s.date === date);
              const msgCount = session?.messages.length ?? 0;
              const lastMsg = session?.messages[session.messages.length - 1];
              const isActive = date === activeDate;
              return (
                <div
                  key={date}
                  className={`flex items-stretch border-b ${isActive ? (theme ? "bg-purple-50 border-purple-100" : "bg-purple-950/30 border-purple-900/30") : theme ? "border-gray-100" : "border-gray-800/50"}`}
                >
                  <button
                    onClick={() => {
                      setActiveDate(date);
                      setShowHistory(false);
                    }}
                    className={`flex-1 text-left px-3 py-2.5 transition ${isActive ? "" : theme ? "hover:bg-gray-50" : "hover:bg-gray-900"}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[11px] font-semibold ${isActive ? (theme ? "text-purple-700" : "text-purple-400") : theme ? "text-gray-700" : "text-gray-300"}`}
                      >
                        {formatDateLabel(date)}
                      </span>
                      <span
                        className={`text-[9px] ${theme ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {msgCount} msg{msgCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {lastMsg && (
                      <p
                        className={`text-[10px] truncate ${theme ? "text-gray-500" : "text-gray-600"}`}
                      >
                        {lastMsg.role === "user" ? "You: " : "AI: "}
                        {lastMsg.text
                          .replace(/\*\*/g, "")
                          .replace(/\[\/n\]/g, " ")
                          .slice(0, 50)}
                        {lastMsg.text.length > 50 ? "…" : ""}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      if (!auth?.email) return;
                      const confirmed = confirm(
                        `Delete conversation from ${formatDateLabel(date)}?`,
                      );
                      if (!confirmed) return;
                      setChatHistory((prev) =>
                        prev.filter((s) => s.date !== date),
                      );
                      if (isActive) {
                        const remaining = sortedHistoryDates.filter(
                          (d) => d !== date,
                        );
                        setActiveDate(
                          remaining.length > 0
                            ? remaining[0]
                            : new Date().toLocaleDateString("en-CA"),
                        );
                      }
                      await clearChatSession(auth.email, date);
                    }}
                    className={`flex-shrink-0 px-2.5 flex items-center justify-center transition ${theme ? "text-gray-300 hover:text-red-500 hover:bg-red-50" : "text-gray-700 hover:text-red-400 hover:bg-red-950/20"}`}
                    title="Delete this conversation"
                  >
                    <span className="text-[13px] font-bold leading-none">
                      ×
                    </span>
                  </button>
                </div>
              );
            })
          )}
          <button
            onClick={() => {
              setActiveDate(new Date().toLocaleDateString("en-CA"));
              setShowHistory(false);
            }}
            className={`w-full text-left px-3 py-2.5 text-[11px] font-medium transition border-t ${theme ? "text-purple-600 hover:bg-purple-50 border-gray-100" : "text-purple-400 hover:bg-purple-950/20 border-gray-800"}`}
          >
            + New conversation (today)
          </button>
        </div>
      );
    }

    return (
      <>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-2 py-3 space-y-1"
        >
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-3">
              <div className="text-3xl mb-3">✦</div>
              <h3
                className={`text-xs font-bold mb-1.5 ${theme ? "text-gray-800" : "text-gray-200"}`}
              >
                AI Routine Builder
              </h3>
              <p
                className={`text-[10px] leading-relaxed mb-3 ${theme ? "text-gray-500" : "text-gray-500"}`}
              >
                Talk to AI to build and update your routine.
              </p>
              <div className="space-y-1.5 w-full">
                {[
                  "Build a productive morning",
                  "Copy my real routine",
                  "Optimize for better sleep",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSuggestedText((prev) => ({ text: s, id: prev.id + 1 }))}
                    className={`w-full text-left text-[10px] px-2 py-1.5 rounded border transition ${theme ? "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300" : "border-gray-800 text-gray-400 hover:bg-gray-900 hover:border-purple-700"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`flex-1 h-px ${theme ? "bg-gray-200" : "bg-gray-800"}`}
                />
                <span
                  className={`text-[9px] px-2 font-medium ${theme ? "text-gray-400" : "text-gray-600"}`}
                >
                  {formatDateLabel(activeDate)}
                </span>
                <div
                  className={`flex-1 h-px ${theme ? "bg-gray-200" : "bg-gray-800"}`}
                />
              </div>
              {activeMessages.map((msg, i) => {
                const isLoadingMsg =
                  msg.text === "loading" &&
                  i === activeMessages.length - 1 &&
                  isThinking;
                return (
                  <div key={i} className="mb-2">
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <div
                          className={`max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-tr-sm text-xs leading-relaxed ${theme ? "bg-purple-600 text-white" : "bg-purple-700 text-white"}`}
                        >
                          {msg.text}
                        </div>
                        <span
                          className={`text-[9px] mr-1 ${theme ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-0.5">
                        <div
                          className={`max-w-[92%] px-2.5 py-1.5 rounded-xl rounded-tl-sm text-xs leading-relaxed border ${theme ? "bg-gray-50 border-gray-200 text-gray-800" : "bg-gray-900 border-gray-800 text-gray-200"}`}
                        >
                          {renderMessage(msg.text, isLoadingMsg)}
                        </div>
                        {!isLoadingMsg && (
                          <span
                            className={`text-[9px] ml-1 ${theme ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {formatTime(msg.timestamp)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="px-2 py-3 mt-2">
          {isLimitReached ? (
            <div
              className={`text-center py-2 px-2 text-[10px] rounded border ${theme ? "bg-red-50 border-red-200 text-red-600" : "bg-red-950/30 border-red-800 text-red-400"}`}
            >
              Monthly limit reached ({MAX_RESPONSES} responses).
              <br />
              Try again next month.
            </div>
          ) : (
            <div>
              <ChatInputArea
                onSend={sendMessage}
                isThinking={isThinking}
                theme={theme}
                suggestedText={suggestedText}
              />
              <div
                className={`text-right text-[9px] mt-1 ${theme ? "text-gray-400" : "text-gray-600"}`}
              >
                {getCurrentCount()} / {MAX_RESPONSES} this month
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // ── Not logged in / Loading ────────────────────────────────
  if (!hasMounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-gray-800/40 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-4 border-t-blue-500 border-gray-800/30 animate-[spin_2.8s_linear_infinite]"></div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide mb-3">
            AI Routine
          </h2>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme ? "bg-white" : "bg-black"}`}
      >
        <p className={`text-lg ${theme ? "text-gray-700" : "text-gray-300"}`}>
          Please log in to use AI Routine.
        </p>
      </div>
    );
  }

  // ── Sidebar toggle button (same pattern as DashBoard) ──────
  const SidebarToggle = ({
    top,
    left,
    size = 30,
  }: {
    top: string;
    left: string;
    size?: number;
  }) => (
    <motion.div
      onClick={() => setIsSidebarOpen((prev) => !prev)}
      className={`flex absolute h-[${size}px] w-[${size}px] justify-center items-center cursor-pointer border-[1px] rounded-md z-10 transition-colors ${
        theme
          ? "border-purple-400 text-purple-600 hover:bg-purple-600 hover:text-white"
          : "border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
      }`}
      style={{ top: parseInt(top) - 10, left }}
      whileTap={{ scale: 0.92 }}
    >
      {isSidebarOpen ? (
        <MdKeyboardDoubleArrowLeft size={20} />
      ) : (
        <MdKeyboardDoubleArrowRight size={20} />
      )}
    </motion.div>
  );

  // ── Chat sidebar content (replaces EditRoutine) ────────────
  const renderChatSidebar = (scrollRef?: React.RefObject<HTMLDivElement>) => (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 h-[50px] flex-shrink-0 border-b ${theme ? "border-gray-200" : "border-gray-800"}`}
      >
        <div className="flex items-center gap-2 w-full justify-end">
          {!isPremium() && (
            <span
              className={`text-sm font-bold ${theme ? "text-purple-700" : "text-purple-400"}`}
            >
              ✦ Your AI Routine
            </span>
          )}
        </div>
        {isPremium() && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={async () => {
                if (!auth?.email) return;
                const confirmed = confirm(
                  "This will replace your entire AI Routine with your real routine. Continue?",
                );
                if (!confirmed) return;
                const newRoutine: AIRoutineData = {
                  saturday: (auth.routine?.saturday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  sunday: (auth.routine?.sunday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  monday: (auth.routine?.monday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  tuesday: (auth.routine?.tuesday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  wednesday: (auth.routine?.wednesday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  thursday: (auth.routine?.thursday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                  friday: (auth.routine?.friday ?? []).map((t) => ({
                    name: t.name,
                    time: t.time,
                    category: t.category ?? "",
                  })),
                };
                updateAIRoutine(newRoutine);
              }}
              className={`text-[10px] px-2 py-0.5 rounded border transition bg-blue-600 border-blue-500 text-white hover:bg-blue-700`}
            >
              Copy routine
            </button>
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className={`text-[10px] px-2 py-0.5 rounded border transition ${theme ? "bg-purple-100 border-purple-400 text-purple-700 hover:bg-purple-200" : "bg-purple-900/40 border-purple-600 text-purple-300 hover:bg-purple-900/60"}`}
              >
                Today
              </button>
            ) : (
              <button
                onClick={() => setShowHistory(true)}
                className={`text-[10px] px-2 py-0.5 rounded border transition ${theme ? "border-gray-300 text-gray-500 hover:bg-gray-100" : "border-gray-700 text-gray-500 hover:bg-gray-800"}`}
              >
                History
              </button>
            )}
          </div>
        )}
      </div>
      {renderChatContent(scrollRef)}
    </div>
  );

  // ── Main render — mirrors DashBoard exactly ────────────────
  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${theme ? "#f8f8f8" : "#0f0f0f"}; }
        ::-webkit-scrollbar-thumb { background: ${theme ? "#222222" : "#eeeeee"}; border-radius: 4px; }
      `}</style>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DESKTOP (lg+)                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block w-full overflow-hidden fixed"
        style={{ top: "64px", height: "calc(100% - 64px)" }}
      >
        {/* Chat sidebar */}
        <motion.div
          className={`h-full float-left ${theme ? "bg-white border-r-[1px] border-gray-200" : "bg-black border-r-[1px] border-gray-800"}`}
          initial={{ width: sidebar.closed }}
          animate={{ width: isSidebarOpen ? sidebar.open : sidebar.closed }}
          transition={transition}
        >
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="h-full w-full overflow-hidden"
              >
                {renderChatSidebar(chatScrollDesktopRef)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Toggle button */}
        <SidebarToggle top="20px" left="1.25%" />

        {/* Main content */}
        <motion.div
          className="h-full relative float-left"
          initial={{ width: "100%" }}
          animate={{ width: isSidebarOpen ? main.open : main.closed }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <div
            ref={scrollContainerDesktopRef}
            className={`h-full relative overflow-auto px-[10px] pb-[50px] ${theme ? "bg-[#ffffff]" : "bg-[#000000]"}`}
          >
            {/* Sticky header */}
            <div className="sticky top-0 left-0 right-0 z-30 bg-inherit">
              <div
                className={`h-[50px] w-full border-b-[1px] flex items-center justify-between px-6 ${theme ? "border-gray-300" : "border-gray-800"}`}
              >
                {/* Zoom */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                    disabled={zoomLevel <= 1}
                    className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel <= 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel <= 1 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                  >
                    <FaMinus size={10} />
                  </button>
                  <span
                    className={`font-semibold min-w-[90px] text-center text-sm sm:text-base ${theme ? "text-gray-900" : "text-white"}`}
                  >
                    Zoom: {zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                    disabled={zoomLevel >= 8}
                    className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel >= 8 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel >= 8 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                  >
                    <FaPlus size={10} />
                  </button>
                </div>

                {/* Jump to now */}
                <button
                  onClick={scrollToNow}
                  className={`group flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-sm transition-colors duration-200 border-[1px] ${theme ? "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border-purple-800/20" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border-purple-300/20"}`}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  <span>Jump to now — {currentTime}</span>
                </button>

                {/* Rotate week */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={rotateWeekRight}
                    className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${theme ? "text-purple-700 border-[1px] hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border-purple-800/20" : "text-purple-400 border-[1px] hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border-purple-300/20"}`}
                  >
                    <FaArrowLeft size={15} />
                  </button>
                  <span
                    className={`font-medium text-sm sm:text-base ${theme ? "text-gray-900" : "text-white"}`}
                  >
                    Rotate Week
                  </span>
                  <button
                    onClick={rotateWeekLeft}
                    className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${theme ? "text-purple-700 border-[1px] hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border-purple-800/20" : "text-purple-400 border-[1px] hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border-purple-300/20"}`}
                  >
                    <FaArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div
                className={`h-[49px] w-full border-b ${theme ? "border-gray-300" : "border-gray-800"}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-8 mx-auto h-full">
                  <div className="overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-center font-semibold text-sm sm:text-base ${theme ? "text-gray-700 bg-gray-100/40" : "text-gray-400 bg-gray-900/40"}`}
                    >
                      Timeline
                    </div>
                  </div>
                  {daysOfWeekOrder.map((day, idx) => (
                    <div
                      key={day.full}
                      className={`overflow-hidden border-l cursor-pointer transition-colors ${idx === 6 ? "border-r" : ""} ${theme ? "border-gray-300" : "border-gray-800"}`}
                    >
                      <div
                        className={`h-full flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-150 ${day.full === today ? (theme ? "bg-purple-600/90 text-white shadow-sm" : "bg-purple-700/90 text-white shadow-sm") : theme ? "text-gray-800" : "text-gray-300"}`}
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
              {daysOfWeekOrder.map((day, idx) => {
                const dayKey = day.full.toLowerCase() as Day;
                const tasks = buildTasksWithGaps(aiRoutine[dayKey] || []);
                return (
                  <div
                    key={day.full}
                    className={`overflow-hidden border-l border-b pt-5 ${idx === 6 ? "border-r" : ""} ${dragState ? (theme ? "bg-purple-50/10" : "bg-purple-950/5") : ""} ${theme ? "border-gray-300" : "border-gray-800"}`}
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
                              previewDayKey: dayKey,
                            }
                          : prev,
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!dragState) return;
                      const targetDayKey = dayKey;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                      const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                      const newStart = Math.max(
                        0,
                        Math.min(1440 - dragState.taskDuration, snapped),
                      );
                      const updated = { ...aiRoutine };
                      if (targetDayKey !== dragState.dayKey) {
                        const targetTasks = updated[targetDayKey] || [];
                        if (
                          targetTasks.some((t) => t.name === dragState.taskName)
                        ) {
                          alert(
                            `"${dragState.taskName}" already exists on ${day.full}`,
                          );
                          setDragState(null);
                          return;
                        }
                        const check = validateAIDrop(
                          updated,
                          dragState.taskName,
                          targetDayKey,
                          newStart,
                          dragState.taskDuration,
                        );
                        if (!check.valid) {
                          alert(
                            `Overlaps with "${check.conflict}" on ${day.full}`,
                          );
                          setDragState(null);
                          return;
                        }
                        const sourceTasks = updated[dragState.dayKey] || [];
                        const taskToMove = sourceTasks.find(
                          (t) => t.name === dragState.taskName,
                        );
                        updated[dragState.dayKey] = sourceTasks.filter(
                          (t) => t.name !== dragState.taskName,
                        );
                        if (taskToMove) {
                          updated[targetDayKey] = [
                            ...targetTasks,
                            {
                              ...taskToMove,
                              time: `${minutesToTime(newStart)} - ${minutesToTime(newStart + dragState.taskDuration)}`,
                            },
                          ].sort(
                            (a, b) =>
                              timeToMinutes(a.time.split(" - ")[0]) -
                              timeToMinutes(b.time.split(" - ")[0]),
                          );
                        }
                      } else {
                        const check = validateAIDrop(
                          updated,
                          dragState.taskName,
                          dayKey,
                          newStart,
                          dragState.taskDuration,
                        );
                        if (!check.valid) {
                          alert(`Overlaps with "${check.conflict}"`);
                          setDragState(null);
                          return;
                        }
                        updated[dayKey] = (updated[dayKey] || [])
                          .map((t) =>
                            t.name === dragState.taskName
                              ? {
                                  ...t,
                                  time: `${minutesToTime(newStart)} - ${minutesToTime(newStart + dragState.taskDuration)}`,
                                }
                              : t,
                          )
                          .sort(
                            (a, b) =>
                              timeToMinutes(a.time.split(" - ")[0]) -
                              timeToMinutes(b.time.split(" - ")[0]),
                          );
                      }
                      updateAIRoutine(updated);
                      setDragState(null);
                    }}
                  >
                    <div className="relative">
                      {tasks.map((task, i) =>
                        renderTaskBlock(task, i, day.full === today, day.full),
                      )}
                      {dragState &&
                        (dragState.previewDayKey ?? dragState.dayKey) ===
                          dayKey &&
                        dragState.previewStartMinutes !== null && (
                          <div
                            className={`absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed rounded ${
                              theme
                                ? "bg-purple-400/20 border-purple-500"
                                : "bg-purple-500/20 border-purple-400"
                            }`}
                            style={{
                              top: `${dragState.previewStartMinutes * pxPerMinute}px`,
                              height: `${dragState.taskDuration * pxPerMinute}px`,
                            }}
                          >
                            <div
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-1 ml-1 inline-block ${
                                theme
                                  ? "bg-purple-500 text-white"
                                  : "bg-purple-400 text-gray-900"
                              }`}
                            >
                              {minutesToTime(dragState.previewStartMinutes)} →{" "}
                              {minutesToTime(
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
                className={`absolute w-[90%] ml-[10%] h-[2px] border-t-2 z-20 ${theme ? "border-purple-600" : "border-purple-500"}`}
                style={{ top: `${nowHeight - 1}px` }}
              />
              <div
                className={`absolute text-xs font-bold px-2.5 py-1 rounded-md left-[6.8%] z-20 shadow-sm border ${theme ? "bg-purple-600 text-white border-purple-700" : "bg-purple-700 text-white border-purple-600"}`}
                style={{ top: `${nowHeight - 13}px` }}
              >
                Now
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TABLET (sm to lg)                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="hidden sm:block lg:hidden w-full overflow-hidden fixed"
        style={{ top: "56px", height: "calc(100% - 56px)" }}
      >
        <motion.div
          className={`h-full float-left ${theme ? "bg-white border-r-[1px] border-gray-200" : "bg-black border-r-[1px] border-gray-800"}`}
          initial={{ width: sidebarTablet.closed }}
          animate={{
            width: isSidebarOpen ? sidebarTablet.open : sidebarTablet.closed,
          }}
          transition={transition}
        >
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="h-full w-full overflow-hidden"
              >
                {renderChatSidebar(chatScrollTabletRef)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <SidebarToggle top="10px" left="2%" />

        <motion.div
          className="h-full relative float-left"
          initial={{ width: "100%" }}
          animate={{
            width: isSidebarOpen ? mainTablet.open : mainTablet.closed,
          }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <div
            ref={scrollContainerTabletRef}
            className={`h-full relative overflow-auto px-[10px] pb-[30px] ${theme ? "bg-[#ffffff]" : "bg-[#000000]"}`}
          >
            {/* Sticky header */}
            <div className="sticky top-0 left-0 z-30 bg-inherit">
              <div
                className={`h-[50px] w-full border-b-[1px] flex items-center justify-between ${theme ? "border-gray-300" : "border-gray-800"}`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                    disabled={zoomLevel <= 1}
                    className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel >= 8 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel >= 8 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                  >
                    <FaMinus size={10} />
                  </button>
                  <span
                    className={`font-semibold min-w-[90px] text-center text-sm sm:text-base ${theme ? "text-gray-900" : "text-white"}`}
                  >
                    Zoom: {zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                    disabled={zoomLevel >= 8}
                    className={`p-1.5 sm:p-2 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel >= 8 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel >= 8 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                  >
                    <FaPlus size={10} />
                  </button>
                </div>
                <button
                  onClick={scrollToNow}
                  className={`group flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg font-medium text-xs ml-2 transition-colors duration-200 border-[1px] ${theme ? "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border-purple-800/20" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border-purple-300/20"}`}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  <span>Jump to now — {currentTime}</span>
                </button>
              </div>

              {/* Date capsules */}
              <div
                className={`w-full py-2 border-b flex items-center justify-between gap-1.5 sm:gap-2.5 ${theme ? "border-gray-300" : "border-gray-800"}`}
              >
                {weekRealDates.map((d, idx) => {
                  const isSelected = selectedDateIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDay(d.dayName.toLowerCase() as Day);
                        setSelectedDateIndex(idx);
                      }}
                      className={`flex-1 max-w-[72px] sm:max-w-[88px] h-[30px] rounded-md sm:rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-medium transition-all border shadow-sm ${isSelected ? (theme ? "bg-purple-600 border-purple-500 text-white" : "bg-purple-700 border-purple-500 text-white") : d.isToday ? (theme ? "bg-purple-50 border-purple-300 text-purple-800" : "bg-purple-950/60 border-purple-600 text-purple-300") : theme ? "border-gray-300 text-gray-700 hover:bg-gray-100" : "border-gray-700 text-gray-300 hover:bg-gray-800/60"}`}
                    >
                      <div className="font-semibold tracking-tight">
                        {d.shortDay}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single day grid */}
            <div className="grid grid-cols-2 mx-auto relative w-full">
              {renderTimelineColumn()}
              {selectedDateIndex !== null &&
                (() => {
                  const dayInfo = weekRealDates[selectedDateIndex];
                  if (!dayInfo) return null;
                  const dayNames = [
                    "saturday",
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                  ];
                  const dayKey = dayNames[selectedDateIndex] as Day;
                  const tasks = buildTasksWithGaps(aiRoutine[dayKey] || []);
                  return (
                    <div
                      className={`border-l pt-5 border-b col-span-1 ${theme ? "border-gray-300" : "border-gray-800"}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!dragState || dragState.dayKey !== dayKey) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                        const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                        const clamped = Math.max(
                          0,
                          Math.min(1440 - dragState.taskDuration, snapped),
                        );
                        setDragState((prev) =>
                          prev
                            ? { ...prev, previewStartMinutes: clamped }
                            : prev,
                        );
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!dragState || dragState.dayKey !== dayKey) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                        const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                        const newStart = Math.max(
                          0,
                          Math.min(1440 - dragState.taskDuration, snapped),
                        );
                        const check = validateAIDrop(
                          aiRoutine,
                          dragState.taskName,
                          dayKey,
                          newStart,
                          dragState.taskDuration,
                        );
                        if (!check.valid) {
                          alert(`Overlaps with "${check.conflict}"`);
                          setDragState(null);
                          return;
                        }
                        const updated = {
                          ...aiRoutine,
                          [dayKey]: (aiRoutine[dayKey] || [])
                            .map((t) =>
                              t.name === dragState.taskName
                                ? {
                                    ...t,
                                    time: `${minutesToTime(newStart)} - ${minutesToTime(newStart + dragState.taskDuration)}`,
                                  }
                                : t,
                            )
                            .sort(
                              (a, b) =>
                                timeToMinutes(a.time.split(" - ")[0]) -
                                timeToMinutes(b.time.split(" - ")[0]),
                            ),
                        };
                        updateAIRoutine(updated);
                        setDragState(null);
                      }}
                    >
                      <div className="relative">
                        {tasks.map((task, i) =>
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
                              className={`absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed rounded ${
                                theme
                                  ? "bg-purple-400/20 border-purple-500"
                                  : "bg-purple-500/20 border-purple-400"
                              }`}
                              style={{
                                top: `${dragState.previewStartMinutes * pxPerMinute}px`,
                                height: `${dragState.taskDuration * pxPerMinute}px`,
                              }}
                            >
                              <div
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-1 ml-1 inline-block ${
                                  theme
                                    ? "bg-purple-500 text-white"
                                    : "bg-purple-400 text-gray-900"
                                }`}
                              >
                                {minutesToTime(dragState.previewStartMinutes)} →{" "}
                                {minutesToTime(
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
              <div
                className={`absolute left-[35%] right-0 h-[2px] border-t-2 z-20 ${theme ? "border-purple-600" : "border-purple-500"}`}
                style={{ top: `${nowHeight - 1}px` }}
              />
              <div
                className={`absolute text-xs font-bold px-2.5 py-1 rounded-md left-[32%] z-20 shadow-sm border ${theme ? "bg-purple-600 text-white border-purple-700" : "bg-purple-700 text-white border-purple-600"}`}
                style={{ top: `${nowHeight - 13}px` }}
              >
                Now
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MOBILE (below sm)                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="block sm:hidden w-full overflow-hidden fixed"
        style={{ top: "56px", height: "calc(100% - 56px)" }}
      >
        <motion.div
          className={`h-full float-left ${theme ? "bg-white border-r-[1px] border-gray-200" : "bg-black border-r-[1px] border-gray-800"}`}
          initial={{ width: sidebarMobile.closed }}
          animate={{
            width: isSidebarOpen ? sidebarMobile.open : sidebarMobile.closed,
          }}
          transition={transition}
        >
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="h-full w-full overflow-hidden"
              >
                {renderChatSidebar(chatScrollMobileRef)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`flex absolute h-[25px] w-[25px] justify-center items-center cursor-pointer border-[1px] rounded-md top-[10px] left-[2%] z-10 transition-colors ${
            theme
              ? "border-purple-400 text-purple-600 hover:bg-purple-600 hover:text-white"
              : "border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
          }`}
          whileTap={{ scale: 0.92 }}
        >
          {isSidebarOpen ? (
            <MdKeyboardDoubleArrowLeft size={20} />
          ) : (
            <MdKeyboardDoubleArrowRight size={20} />
          )}
        </motion.div>

        <motion.div
          className="h-full relative float-left"
          initial={{ width: "100%" }}
          animate={{
            width: isSidebarOpen ? mainMobile.open : mainMobile.closed,
          }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <div
            ref={scrollContainerRef}
            className={`h-full block mt-0 relative overflow-auto ${!isSidebarOpen ? "px-[10px]" : "px-0"} pb-[80px] ${theme ? "bg-[#ffffff]" : "bg-[#000000]"}`}
          >
            {/* Sticky header */}
            {!isSidebarOpen && (
              <div className="sticky top-0 left-0 z-30 bg-inherit">
                <div
                  className={`h-[55px] pb-[3px] w-full border-b-[1px] flex items-center justify-between ${theme ? "border-gray-300" : "border-gray-800"}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <button
                      onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
                      disabled={zoomLevel <= 1}
                      className={`p-1 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel >= 8 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel >= 8 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                    >
                      <FaMinus size={10} />
                    </button>
                    <span
                      className={`font-semibold min-w-[70px] text-center text-xs ${theme ? "text-gray-900" : "text-white"}`}
                    >
                      Zoom: {zoomLevel.toFixed(1)}x
                    </span>
                    <button
                      onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
                      disabled={zoomLevel >= 8}
                      className={`p-1 rounded transition-colors flex items-center justify-center ${theme ? (zoomLevel >= 8 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border border-purple-800/20") : zoomLevel >= 8 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border border-purple-300/20"}`}
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                  <button
                    onClick={scrollToNow}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium text-xs ml-2 transition-colors duration-200 border-[1px] ${theme ? "text-purple-700 hover:text-purple-800 hover:bg-purple-50/70 bg-purple-50/70 border-purple-800/20" : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 bg-purple-950/40 border-purple-300/20"}`}
                  >
                    <svg
                      className="w-4 h-4"
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
                    <span>Jump to now — {currentTime}</span>
                  </button>
                </div>

                {/* Date capsules */}
                <div
                  className={`w-full py-2 border-b flex items-center justify-between gap-1.5 ${theme ? "border-gray-300" : "border-gray-800"}`}
                >
                  {weekRealDates.map((d, idx) => {
                    const isSelected = selectedDateIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDay(d.dayName.toLowerCase() as Day);
                          setSelectedDateIndex(idx);
                        }}
                        className={`flex-1 max-w-[72px] h-[30px] rounded-md flex items-center justify-center text-[11px] font-medium transition-all border shadow-sm ${isSelected ? (theme ? "bg-purple-600 border-purple-500 text-white" : "bg-purple-700 border-purple-500 text-white") : d.isToday ? (theme ? "bg-purple-50 border-purple-300 text-purple-800" : "bg-purple-950/60 border-purple-600 text-purple-300") : theme ? "border-gray-300 text-gray-700 hover:bg-gray-100" : "border-gray-700 text-gray-300 hover:bg-gray-800/60"}`}
                      >
                        <div className="font-semibold tracking-tight">
                          {d.shortDay}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single day grid */}
            <div
              className={`grid ${isSidebarOpen ? "grid-cols-1" : "grid-cols-2"} mx-auto relative w-full`}
            >
              {!isSidebarOpen && renderTimelineColumn()}
              {selectedDateIndex !== null &&
                (() => {
                  const dayInfo = weekRealDates[selectedDateIndex];
                  if (!dayInfo) return null;
                  const dayNames = [
                    "saturday",
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                  ];
                  const dayKey = dayNames[selectedDateIndex] as Day;
                  const tasks = buildTasksWithGaps(aiRoutine[dayKey] || []);
                  return (
                    <div
                      className={`${isSidebarOpen ? "pt-1" : "border-l pt-5"} border-b col-span-1 ${theme ? "border-gray-300" : "border-gray-800"}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!dragState || dragState.dayKey !== dayKey) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                        const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                        const clamped = Math.max(
                          0,
                          Math.min(1440 - dragState.taskDuration, snapped),
                        );
                        setDragState((prev) =>
                          prev
                            ? { ...prev, previewStartMinutes: clamped }
                            : prev,
                        );
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!dragState || dragState.dayKey !== dayKey) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dropY = e.clientY - rect.top - 20 * pxPerMinute;
                        const snapped = Math.round(dropY / pxPerMinute / 5) * 5;
                        const newStart = Math.max(
                          0,
                          Math.min(1440 - dragState.taskDuration, snapped),
                        );
                        const check = validateAIDrop(
                          aiRoutine,
                          dragState.taskName,
                          dayKey,
                          newStart,
                          dragState.taskDuration,
                        );
                        if (!check.valid) {
                          alert(`Overlaps with "${check.conflict}"`);
                          setDragState(null);
                          return;
                        }
                        const updated = {
                          ...aiRoutine,
                          [dayKey]: (aiRoutine[dayKey] || [])
                            .map((t) =>
                              t.name === dragState.taskName
                                ? {
                                    ...t,
                                    time: `${minutesToTime(newStart)} - ${minutesToTime(newStart + dragState.taskDuration)}`,
                                  }
                                : t,
                            )
                            .sort(
                              (a, b) =>
                                timeToMinutes(a.time.split(" - ")[0]) -
                                timeToMinutes(b.time.split(" - ")[0]),
                            ),
                        };
                        updateAIRoutine(updated);
                        setDragState(null);
                      }}
                    >
                      <div className="relative">
                        {tasks.map((task, i) =>
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
                              className={`absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed rounded ${
                                theme
                                  ? "bg-purple-400/20 border-purple-500"
                                  : "bg-purple-500/20 border-purple-400"
                              }`}
                              style={{
                                top: `${dragState.previewStartMinutes * pxPerMinute}px`,
                                height: `${dragState.taskDuration * pxPerMinute}px`,
                              }}
                            >
                              <div
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm mt-1 ml-1 inline-block ${
                                  theme
                                    ? "bg-purple-500 text-white"
                                    : "bg-purple-400 text-gray-900"
                                }`}
                              >
                                {minutesToTime(dragState.previewStartMinutes)} →{" "}
                                {minutesToTime(
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
              {!isSidebarOpen && (
                <>
                  <div
                    className={`absolute left-[35%] right-0 h-[2px] border-t-2 z-20 ${theme ? "border-purple-600" : "border-purple-500"}`}
                    style={{ top: `${nowHeight - 1}px` }}
                  />
                  <div
                    className={`absolute text-xs font-bold px-2.5 py-1 rounded-md left-[27%] z-20 shadow-sm border ${theme ? "bg-purple-600 text-white border-purple-700" : "bg-purple-700 text-white border-purple-600"}`}
                    style={{ top: `${nowHeight - 13}px` }}
                  >
                    Now
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* ── Hover tooltip for small tasks ── */}
      {hoveredTask && (
        <div
          className={`fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-xl border text-xs max-w-[200px] ${
            theme
              ? "bg-white border-gray-200 text-gray-800"
              : "bg-gray-900 border-gray-700 text-gray-100"
          }`}
          style={{ left: cursorPos.x + 14, top: cursorPos.y + 10 }}
        >
          <div className="font-semibold mb-0.5 truncate">
            {hoveredTask.name}
          </div>
          <div
            className={`text-[10px] ${theme ? "text-gray-500" : "text-gray-400"}`}
          >
            {hoveredTask.time}
          </div>
          <div
            className={`text-[10px] ${theme ? "text-gray-400" : "text-gray-500"}`}
          >
            {formatDuration(hoveredTask.dur)}
          </div>
        </div>
      )}

      {/* ── Task Alert Popup ── */}
      {taskAlert && (
        <div className="fixed z-50 bottom-5 left-5 w-[90vw] sm:w-[340px]">
          <div
            className={`relative rounded-2xl shadow-2xl border px-5 py-4 ${
              theme
                ? "bg-white border-purple-500 text-gray-900"
                : "bg-gray-900 border-purple-500 text-gray-100"
            }`}
          >
            <button
              onClick={dismissAlert}
              className="absolute top-2.5 right-3 text-lg font-bold opacity-50 hover:opacity-100 transition"
            >
              ×
            </button>
            <div className="text-2xl mb-2">🔔</div>
            <p
              className={`text-xs font-medium mb-1 ${theme ? "text-gray-500" : "text-gray-400"}`}
            >
              AI Routine Reminder
            </p>
            <p className="text-sm font-semibold leading-snug">
              Now it&apos;s {taskAlert.time}, time for task
            </p>
            <p
              className={`text-base font-bold mt-0.5 ${theme ? "text-purple-600" : "text-purple-400"}`}
            >
              {taskAlert.name}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={dismissAlert}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Portal (bottom-right fixed) ── */}
      {portalMode && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[300px] rounded-xl shadow-2xl border text-sm ${
            theme
              ? "bg-white border-gray-200 text-gray-800"
              : "bg-gray-950 border-gray-700 text-gray-100"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-3 py-2.5 border-b rounded-t-xl ${
              theme
                ? "bg-gray-50 border-gray-200"
                : "bg-gray-900 border-gray-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${portalMode === "add" ? "bg-purple-500" : "bg-blue-500"}`}
              />
              <span className="text-xs font-semibold capitalize">
                {portalMode === "add" ? "Add Task" : "Edit Task"} · {portalDay}
              </span>
            </div>
            <button
              onClick={closePortal}
              className="text-gray-400 hover:text-red-500 font-bold text-base leading-none transition"
            >
              ×
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Task name */}
            <input
              type="text"
              placeholder="Task name"
              value={portalTaskName}
              onChange={(e) => setPortalTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (portalMode === "add") {
                    handlePortalAdd();
                  } else {
                    handlePortalEdit();
                  }
                }
              }}
              className={`w-full px-2.5 py-1.5 rounded border text-xs outline-none focus:border-purple-500 ${
                theme
                  ? "bg-white border-gray-300"
                  : "bg-gray-900 border-gray-700"
              }`}
            />

            {/* Category pills */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setPortalCategory(portalCategory === cat ? "" : cat)
                  }
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition border ${
                    portalCategory === cat
                      ? "bg-purple-600 border-purple-500 text-white"
                      : theme
                        ? "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {CATEGORY_DOT[cat] && (
                    <span
                      className={`w-[6px] h-[6px] rounded-full ${CATEGORY_DOT[cat]}`}
                    />
                  )}
                  {cat}
                </button>
              ))}
            </div>

            {/* Time inputs */}
            {(["From", "To"] as const).map((label) => {
              const isFrom = label === "From";
              const hour = isFrom ? portalFromHour : portalToHour;
              const minute = isFrom ? portalFromMinute : portalToMinute;
              const period = isFrom ? portalFromPeriod : portalToPeriod;
              const setHour = isFrom ? setPortalFromHour : setPortalToHour;
              const setMinute = isFrom
                ? setPortalFromMinute
                : setPortalToMinute;
              const setPeriod = isFrom
                ? setPortalFromPeriod
                : setPortalToPeriod;
              return (
                <div key={label}>
                  <div className="text-[10px] opacity-60 mb-1">{label}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      placeholder="HH"
                      maxLength={2}
                      value={hour}
                      onChange={(e) =>
                        setHour(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                      className={`px-2 py-1 rounded border text-xs text-center outline-none focus:border-purple-500 ${theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"}`}
                    />
                    <input
                      type="text"
                      placeholder="MM"
                      maxLength={2}
                      value={minute}
                      onChange={(e) =>
                        setMinute(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                      className={`px-2 py-1 rounded border text-xs text-center outline-none focus:border-purple-500 ${theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"}`}
                    />
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
                      className={`px-1 py-1 rounded border text-xs text-center outline-none focus:border-purple-500 ${theme ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"}`}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
              );
            })}

            {/* Status message */}
            {portalMessage && (
              <div
                className={`text-[10px] text-center py-1 rounded ${
                  portalMessage.type === "success"
                    ? theme
                      ? "bg-green-100 text-green-700"
                      : "bg-green-900/40 text-green-300"
                    : theme
                      ? "bg-red-100 text-red-700"
                      : "bg-red-900/40 text-red-300"
                }`}
              >
                {portalMessage.text}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-1.5">
              {portalMode === "add" ? (
                <button
                  onClick={handlePortalAdd}
                  className="flex-1 py-1.5 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition"
                >
                  Add Task
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePortalEdit}
                    className="flex-1 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={handlePortalDelete}
                    className="py-1.5 px-3 rounded text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={closePortal}
                className={`py-1.5 px-3 rounded text-xs font-semibold border transition ${
                  theme
                    ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                    : "border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
