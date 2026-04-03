// src/components/DashBoard.tsx
// Merged DashBoard — uses the single EditRoutine (with variant prop)
// and the single ShowRoutine (with variant prop) for all three breakpoints.
"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import EditRoutine from "@/components/EditRoutine";
import ShowRoutine from "@/components/ShowRoutine";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { updateStats } from "@/app/actions";
import { useRouter } from "next/navigation";
import { FaRobot } from "react-icons/fa6";
import { IoMdSettings } from "react-icons/io";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { IRoutine } from "@/store/features/auth/authSlice";

// ─── Module-level audio persistence (survives route changes) ──
let _persistedAudio: HTMLAudioElement | null = null;
let _persistedAlert: { name: string; time: string } | null = null;

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

type Day = (typeof daysOfWeek)[number];

// ─── Component ────────────────────────────────────────────────
export default function DashBoard() {
  // ── Sidebar / UI state ─────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day>("saturday");
  const [hasMounted, setHasMounted] = useState(false);
  const [undoStack, setUndoStack] = useState<IRoutine[]>([]);
  const [redoStack, setRedoStack] = useState<IRoutine[]>([]);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [syncDrag, setSyncDrag] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);

  // ── Shared EditRoutine form state (lifted up) ──────────────
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [fromHour, setFromHour] = useState("");
  const [fromMinute, setFromMinute] = useState("");
  const [fromPeriod, setFromPeriod] = useState<"AM" | "PM">("AM");
  const [toHour, setToHour] = useState("");
  const [toMinute, setToMinute] = useState("");
  const [toPeriod, setToPeriod] = useState<"AM" | "PM">("AM");

  // ── Task alert state ───────────────────────────────────────
  const [taskAlert, setTaskAlert] = useState<{
    name: string;
    time: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedRef = useRef<string | null>(null);

  useEffect(() => {
    // Reuse persisted audio instance across mounts
    if (!_persistedAudio) {
      _persistedAudio = new Audio("/ringtone.mp3");
      _persistedAudio.loop = true;
    }
    audioRef.current = _persistedAudio;

    // Restore pending alert if user navigated away without dismissing
    if (_persistedAlert) {
      setTaskAlert(_persistedAlert);
      audioRef.current.play().catch(() => {});
    }

    return () => {
      // Pause on unmount but keep the instance and alert for when user returns
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // ── Hooks ──────────────────────────────────────────────────
  const router = useRouter();
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();

  // ── Mark as mounted ────────────────────────────────────────
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Clean invalid tasks from routine ───────────────────────
  const timeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)/i);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (hours === 12) hours = 0;
    hours += period === "PM" ? 12 : 0;
    return hours * 60 + minutes;
  };

  useEffect(() => {
    if (!auth?.routine) return;

    let anyChange = false;
    const cleanedRoutine = { ...auth.routine };

    const days = [
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ] as const;

    days.forEach((day) => {
      const tasks = cleanedRoutine[day];
      if (!Array.isArray(tasks) || tasks.length === 0) return;

      const validTasks = tasks.filter((task) => {
        if (typeof task.time !== "string" || !task.time.includes(" - ")) {
          return false;
        }
        const [startStr, endStr] = task.time.split(" - ").map((s) => s.trim());
        const startMin = timeToMinutes(startStr);
        const endMin = timeToMinutes(endStr);
        return startMin !== -1 && endMin !== -1 && startMin !== endMin;
      });

      if (validTasks.length < tasks.length) {
        anyChange = true;
        cleanedRoutine[day] = validTasks;
      }
    });

    if (!anyChange) return;

    setAuth({ ...auth, routine: cleanedRoutine });
    setHasUnsavedChanges(true);
  }, [auth?.routine, auth, setAuth, setHasUnsavedChanges]);

  const updateRoutineWithHistory = (newRoutine: IRoutine) => {
    if (auth?.routine) {
      setUndoStack((prev) => [
        ...prev.slice(-20),
        auth.routine,
      ]);
      setRedoStack([]);
    }
    if (auth) setAuth({ ...auth, routine: newRoutine });
    setHasUnsavedChanges(true);
  };

  const undo = () => {
    if (undoStack.length === 0 || !auth) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [
      auth.routine,
      ...prev,
    ]);
    setUndoStack((prev) => prev.slice(0, -1));
    setAuth({ ...auth, routine: previous as typeof auth.routine });
    setHasUnsavedChanges(true);
  };

  const redo = () => {
    if (redoStack.length === 0 || !auth) return;
    const next = redoStack[0];
    setUndoStack((prev) => [
      ...prev,
      auth.routine,
    ]);
    setRedoStack((prev) => prev.slice(1));
    setAuth({ ...auth, routine: next as typeof auth.routine });
    setHasUnsavedChanges(true);
  };

  // ── Animation config ───────────────────────────────────────
  const spring = { stiffness: 320, damping: 32, mass: 1 };
  const transition = hasMounted ? spring : undefined;

  // ── Suggest time (called from ShowRoutine's free-time click) ─
  const suggestTime = (startStr?: string, endStr?: string) => {
    if (startStr) {
      const match = startStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
      if (match) {
        setFromHour(match[1]);
        setFromMinute(match[2]);
        setFromPeriod(match[3] as "AM" | "PM");
      }
    }
    if (endStr) {
      const match = endStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
      if (match) {
        setToHour(match[1]);
        setToMinute(match[2]);
        setToPeriod(match[3] as "AM" | "PM");
      }
    }
    // Force portal open with slight delays to ensure it sticks
    const forceOpen = () => {
      setIsPortalOpen(true);
      setTimeout(() => setIsPortalOpen(true), 500);
      setTimeout(() => setIsPortalOpen(true), 1000);
    };
    forceOpen();
  };

  // ── Task alert checker ─────────────────────────────────────
  useEffect(() => {
    if (!auth?.routine) return;

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
      const todayKey = days[now.getDay()];
      const todayTasks = auth.routine[todayKey] || [];

      for (const task of todayTasks) {
        if (!task.time?.includes(" - ")) continue;
        const startStr = task.time.split(" - ")[0].trim();
        const match = startStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/i);
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
          _persistedAlert = alert;
          setTaskAlert(alert);
          audioRef.current?.play().catch(() => {});
          break;
        }
      }
    };

    checkTasks();
    const id = setInterval(checkTasks, 60000);
    return () => {
      clearInterval(id);
    };
  }, [auth?.routine]);

  const dismissAlert = () => {
    _persistedAlert = null;
    setTaskAlert(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setSaveTrigger((t) => t + 1);
      }
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
        setIsSettingsOpen(false);
      }
      if (!isTyping && e.key === "ArrowRight") {
        setSelectedDay((prev) => {
          const idx = daysOfWeek.indexOf(prev);
          return daysOfWeek[(idx + 1) % 7];
        });
      }
      if (!isTyping && e.key === "ArrowLeft") {
        setSelectedDay((prev) => {
          const idx = daysOfWeek.indexOf(prev);
          return daysOfWeek[(idx + 6) % 7];
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack, auth]);

  // ── Width values for each breakpoint ───────────────────────
  const sidebar = { closed: "5%", open: "20%" };
  const main = { closed: "95%", open: "80%" };
  const sidebarTablet = { closed: "9%", open: "35%" };
  const mainTablet = { closed: "91%", open: "65%" };
  const sidebarMobile = { closed: "13%", open: "70%" };
  const mainMobile = { closed: "87%", open: "30%" };

  // ── Shared EditRoutine props ───────────────────────────────
  // These are identical for all breakpoints, just the "variant" changes.
  const editRoutineProps = {
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
    suggestTime,
    updateRoutineWithHistory,
    saveTrigger,
    settingsMode,
    setSettingsMode,
  };

  // ── Loading screen before mount ────────────────────────────
  if (!hasMounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-gray-800/40 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-4 border-t-purple-500 border-gray-800/30 animate-[spin_2.8s_linear_infinite]"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-3">
            Initializing Dashboard
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            Preparing your routine... just a moment
          </p>
          <div className="mt-6 text-sm text-gray-600 animate-pulse">
            {"• • •"}
          </div>
        </div>
      </div>
    );
  }

  // ── Helper: Sidebar toggle button ──────────────────────────
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
      onClick={() => {
        if (isSidebarOpen) setSettingsMode(false);
        setIsSidebarOpen((prev) => !prev);
      }}
      className={`flex absolute h-[${size}px] w-[${size}px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10`}
      style={{ top, left }}
      whileTap={{ scale: 0.92 }}
    >
      {isSidebarOpen ? (
        <MdKeyboardDoubleArrowLeft size={20} />
      ) : (
        <MdKeyboardDoubleArrowRight size={20} />
      )}
    </motion.div>
  );

  // ── Helper: Settings button ────────────────────────────────
  const SettingsButton = ({
    top,
    left,
    size = 30,
  }: {
    top: string;
    left: string;
    size?: number;
  }) => {
    if (isSidebarOpen) return null;
    return (
      <motion.div
        onClick={() => {
          setSettingsMode(true);
          setIsSidebarOpen(true);
        }}
        className={`flex absolute h-[${size}px] w-[${size}px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10`}
        style={{ top, left }}
        whileTap={{ scale: 0.92 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <IoMdSettings size={20} />
        </motion.div>
      </motion.div>
    );
  };

  // ── Helper: ChatBot button ─────────────────────────────────
  const ChatBotButton = ({
    top,
    left,
    iconSize = 20,
    size = 30,
  }: {
    top: string;
    left: string;
    iconSize?: number;
    size?: number;
  }) => {
    if (isSidebarOpen) return null;
    return (
      <motion.div
        onClick={() => router.push("/ai-routine")}
        className={`flex absolute h-[${size}px] w-[${size}px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10`}
        style={{ top, left }}
        whileTap={{ scale: 0.92 }}
      >
        <motion.div
          animate={{ y: [-2, 2] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <FaRobot size={iconSize} />
        </motion.div>
      </motion.div>
    );
  };

  // ── Main render ────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════════════════════════════════════════ */}
      {/* DESKTOP (lg+)                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block w-full overflow-hidden fixed" style={{ top: "64px", height: "calc(100% - 64px)" }}>
        {/* Sidebar */}
        <motion.div
          className={`h-full float-left ${
            theme
              ? "bg-white border-r-[1px] border-gray-200"
              : "bg-black border-r-[1px] border-gray-800"
          }`}
          initial={{ width: sidebar.closed }}
          animate={{
            width: isSidebarOpen ? sidebar.open : sidebar.closed,
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
                className="h-full w-full overflow-auto"
              >
                <EditRoutine variant="desktop" {...editRoutineProps} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        {/* Controls */}
        <SidebarToggle top="20px" left="1.25%" />
        <SettingsButton top="70px" left="1.25%" />
        <ChatBotButton top="120px" left="1.25%" />
        {!isSidebarOpen && (
          <>
            <motion.div
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className={`flex absolute h-[30px] w-[30px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10 ${undoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
              style={{ top: "165px", left: "1.25%" }}
              whileTap={{ scale: 0.92 }}
            >
              ↩
            </motion.div>
            <motion.div
              onClick={redo}
              title="Redo (Ctrl+Y)"
              className={`flex absolute h-[30px] w-[30px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10 ${redoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
              style={{ top: "205px", left: "1.25%" }}
              whileTap={{ scale: 0.92 }}
            >
              ↪
            </motion.div>
            {!isSidebarOpen && (
              <motion.div
                onClick={() => setSyncDrag((prev) => !prev)}
                title="Sync drag across all days"
                className={`flex absolute h-[30px] w-[30px] justify-center items-center cursor-pointer border-[1px] rounded-md z-10 transition-colors ${
                  syncDrag
                    ? "bg-blue-600 border-blue-500 text-white"
                    : `${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white`
                }`}
                style={{ top: "245px", left: "1.25%" }}
                whileTap={{ scale: 0.92 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="4" height="18" rx="1" />
                  <rect x="10" y="3" width="4" height="18" rx="1" />
                  <rect x="18" y="3" width="4" height="18" rx="1" />
                  <path d="M4 12h16" />
                </svg>
              </motion.div>
            )}
          </>
        )}

        {/* Main content */}
        <motion.div
          className="h-full relative float-left sm:float-left"
          initial={{ width: "100%" }}
          animate={{
            width: isSidebarOpen ? main.open : main.closed,
          }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <ShowRoutine
            variant="desktop"
            setHasUnsavedChanges={setHasUnsavedChanges}
            setIsSettingsOpen={setIsSettingsOpen}
            isSettingsOpen={isSettingsOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedDay={setSelectedDay}
            setTaskSearchQuery={setTaskSearchQuery}
            onFreeTimeClick={suggestTime}
            updateRoutineWithHistory={updateRoutineWithHistory}
            syncDrag={syncDrag}
          />
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TABLET (sm to lg)                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden sm:block lg:hidden w-full overflow-hidden fixed" style={{ top: "56px", height: "calc(100% - 56px)" }}>
        {/* Sidebar */}
        <motion.div
          className={`h-full float-left ${
            theme
              ? "bg-white border-r-[1px] border-gray-200"
              : "bg-black border-r-[1px] border-gray-800"
          }`}
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
                className="h-full w-full overflow-auto"
              >
                <EditRoutine variant="tablet" {...editRoutineProps} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <SidebarToggle top="20px" left="2%" />
        <SettingsButton top="70px" left="2%" />
        <ChatBotButton top="120px" left="2%" />
        {!isSidebarOpen && (
          <>
            <motion.div
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className={`flex absolute h-[30px] w-[30px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10 ${undoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
              style={{ top: "165px", left: "2%" }}
              whileTap={{ scale: 0.92 }}
            >
              ↩
            </motion.div>
            <motion.div
              onClick={redo}
              title="Redo (Ctrl+Y)"
              className={`flex absolute h-[30px] w-[30px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md z-10 ${redoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
              style={{ top: "205px", left: "2%" }}
              whileTap={{ scale: 0.92 }}
            >
              ↪
            </motion.div>
            {!isSidebarOpen && (
              <motion.div
                onClick={() => setSyncDrag((prev) => !prev)}
                title="Sync drag across all days"
                className={`flex absolute h-[30px] w-[30px] justify-center items-center cursor-pointer border-[1px] rounded-md z-10 transition-colors ${
                  syncDrag
                    ? "bg-blue-600 border-blue-500 text-white"
                    : `${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white`
                }`}
                style={{ top: "245px", left: "2%" }}
                whileTap={{ scale: 0.92 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="4" height="18" rx="1" />
                  <rect x="10" y="3" width="4" height="18" rx="1" />
                  <rect x="18" y="3" width="4" height="18" rx="1" />
                  <path d="M4 12h16" />
                </svg>
              </motion.div>
            )}
          </>
        )}

        {/* Main content */}
        <motion.div
          className="h-full relative float-left sm:float-left"
          initial={{ width: "100%" }}
          animate={{
            width: isSidebarOpen ? mainTablet.open : mainTablet.closed,
          }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <ShowRoutine
            variant="tablet"
            setHasUnsavedChanges={setHasUnsavedChanges}
            setIsSettingsOpen={setIsSettingsOpen}
            isSettingsOpen={isSettingsOpen}
            selectedDay={selectedDay}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedDay={setSelectedDay}
            setTaskSearchQuery={setTaskSearchQuery}
            onFreeTimeClick={suggestTime}
            updateRoutineWithHistory={updateRoutineWithHistory}
            syncDrag={syncDrag}
          />
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MOBILE (below sm)                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="block sm:hidden w-full overflow-hidden fixed" style={{ top: "56px", height: "calc(100% - 56px)" }}>
        {/* Sidebar */}
        <motion.div
          className={`h-full float-left ${
            theme
              ? "bg-white border-r-[1px] border-gray-200"
              : "bg-black border-r-[1px] border-gray-800"
          }`}
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
                className="h-full w-full overflow-auto"
              >
                <EditRoutine variant="tablet" {...editRoutineProps} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <motion.div
          onClick={() => {
            if (isSidebarOpen) setSettingsMode(false);
            setIsSidebarOpen((prev) => !prev);
          }}
          className={`flex absolute h-[25px] w-[25px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md top-[10px] left-[2%] z-10`}
          whileTap={{ scale: 0.92 }}
        >
          {isSidebarOpen ? (
            <MdKeyboardDoubleArrowLeft size={20} />
          ) : (
            <MdKeyboardDoubleArrowRight size={20} />
          )}
        </motion.div>

        {!isSidebarOpen && (
          <motion.div
            onClick={() => {
              setSettingsMode(true);
              setIsSidebarOpen(true);
            }}
            className={`flex absolute h-[25px] w-[25px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md top-[50px] left-[2%] z-10`}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <IoMdSettings size={20} />
            </motion.div>
          </motion.div>
        )}

        {!isSidebarOpen && (
          <motion.div
            onClick={() => router.push("/ai-routine")}
            className={`flex absolute h-[25px] w-[25px] justify-center items-center cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md top-[90px] left-[2%] z-10`}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              animate={{ y: [-2, 2] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <FaRobot size={18} />
            </motion.div>
          </motion.div>
        )}

        {!isSidebarOpen && (
          <motion.div
            onClick={undo}
            title="Undo"
            className={`flex absolute h-[25px] w-[25px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md top-[130px] left-[2%] z-10 ${undoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
            whileTap={{ scale: 0.92 }}
          >
            ↩
          </motion.div>
        )}

        {!isSidebarOpen && (
          <motion.div
            onClick={redo}
            title="Redo"
            className={`flex absolute h-[25px] w-[25px] justify-center items-center border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white rounded-md top-[165px] left-[2%] z-10 ${redoStack.length === 0 ? "opacity-30 pointer-events-none" : "cursor-pointer"}`}
            whileTap={{ scale: 0.92 }}
          >
            ↪
          </motion.div>
        )}
        {!isSidebarOpen && (
          <motion.div
            onClick={() => setSyncDrag((prev) => !prev)}
            title="Sync drag across all days"
            className={`flex absolute h-[25px] w-[25px] justify-center items-center cursor-pointer border-[1px] rounded-md top-[200px] left-[2%] z-10 transition-colors ${
              syncDrag
                ? "bg-blue-600 border-blue-500 text-white"
                : `${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white`
            }`}
            whileTap={{ scale: 0.92 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="4" height="18" rx="1" />
              <rect x="10" y="3" width="4" height="18" rx="1" />
              <rect x="18" y="3" width="4" height="18" rx="1" />
              <path d="M4 12h16" />
            </svg>
          </motion.div>
        )}

        {/* Main content */}
        <motion.div
          className="h-full relative float-left sm:float-left"
          initial={{ width: "100%" }}
          animate={{
            width: isSidebarOpen ? mainMobile.open : mainMobile.closed,
          }}
          style={{ width: "100%" }}
          transition={transition}
        >
          <ShowRoutine
            variant="mobile"
            setHasUnsavedChanges={setHasUnsavedChanges}
            setIsSettingsOpen={setIsSettingsOpen}
            isSettingsOpen={isSettingsOpen}
            selectedDay={selectedDay}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            setSelectedDay={setSelectedDay}
            setTaskSearchQuery={setTaskSearchQuery}
            onFreeTimeClick={suggestTime}
            updateRoutineWithHistory={updateRoutineWithHistory}
            syncDrag={syncDrag}
          />
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TASK ALERT POPUP                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      {taskAlert && (
        <div className="fixed z-50 bottom-5 right-5 sm:bottom-5 sm:right-5 lg:bottom-5 lg:right-5 w-[90vw] sm:w-[340px]">
          <div
            className={`relative rounded-2xl shadow-2xl border px-5 py-4 ${
              theme
                ? "bg-white border-blue-500 text-gray-900"
                : "bg-gray-900 border-blue-500 text-gray-100"
            }`}
          >
            <button
              onClick={dismissAlert}
              className="absolute top-2.5 right-3 text-lg font-bold opacity-50 hover:opacity-100 transition"
            >
              x
            </button>
            <div className="text-2xl mb-2">{"🔔"}</div>
            <p
              className={`text-xs font-medium mb-1 ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Task Reminder
            </p>
            <p className="text-sm font-semibold leading-snug">
              Now it&apos;s {taskAlert.time}, time for task
            </p>
            <p
              className={`text-base font-bold mt-0.5 ${
                theme ? "text-blue-600" : "text-blue-400"
              }`}
            >
              {taskAlert.name}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;
                  const todayKey = days[new Date().getDay()];
                  const _n = new Date();
                  const todayDate = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`;
                  const existingStats = Array.isArray(auth?.stats) ? [...auth.stats] : [];
                  const todayEntry = existingStats.find((s) => s.date === todayDate);
                  const alreadyCompleted = todayEntry?.completedTasks.includes(taskAlert.name) ?? false;
                  if (alreadyCompleted) { dismissAlert(); return; }
                  const routineTaskCount = (auth?.routine?.[todayKey] || []).filter((t) => t.name !== "dummy").length;
                  const alreadyCompletedCount = todayEntry?.completedTasks.length ?? 0;
                  const totalTasks = Math.max(routineTaskCount, alreadyCompletedCount);
                  let newStats;
                  if (todayEntry) {
                    newStats = existingStats.map((s) =>
                      s.date !== todayDate ? s : { ...s, totalTasks: Math.max(routineTaskCount, s.completedTasks.length + 1), completedTasks: [...s.completedTasks, taskAlert.name] }
                    );
                  } else {
                    newStats = [...existingStats, { date: todayDate, day: todayKey, totalTasks, completedTasks: [taskAlert.name] }];
                  }
                  if (auth) {
                    setAuth({ ...auth, stats: newStats });
                    try { await updateStats(auth.email, newStats); } catch { setAuth({ ...auth, stats: existingStats }); }
                  }
                  dismissAlert();
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition"
              >
                ✓ Mark Complete
              </button>
              <button
                onClick={dismissAlert}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  theme
                    ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
