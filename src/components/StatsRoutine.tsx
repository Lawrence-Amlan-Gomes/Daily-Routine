"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { IStatEntry } from "@/store/features/auth/authSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  CheckCircle,
  Calendar,
  Flame,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Award,
  Zap,
  PieChart as PieIcon,
} from "lucide-react";

// =============================================================================
// SECTION 1: TYPES
// =============================================================================

type ViewTab = "overview" | "monthly" | "tasks" | "insights";

interface MonthlyCompletion {
  shortLabel: string; // "Jan '25"
  fullName: string; // "January 2025"
  monthKey: string; // "2025-01"
  count: number; // avg daily completion % for this month (0–100)
  totalCompleted: number; // raw count of tasks completed (for table display)
  uniqueDays: number; // how many distinct days had completions
  uniqueTasks: number; // how many distinct tasks were completed
}

interface TaskTotal {
  name: string;
  count: number;
}

interface InsightItem {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  body: string;
}

interface ThemeTokens {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  hover: string;
}

// =============================================================================
// SECTION 2: CONSTANTS
// =============================================================================

const DAYS_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

const TABS: { id: ViewTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "monthly", label: "Monthly", icon: BarChart3 },
  { id: "tasks", label: "Tasks", icon: PieIcon },
  { id: "insights", label: "Insights", icon: Sparkles },
];

// =============================================================================
// SECTION 3: HELPERS
// =============================================================================

function getTokens(isLight: boolean): ThemeTokens {
  return isLight
    ? {
        bg: "#f5f5f7",
        card: "#fff",
        border: "#e5e7eb",
        text: "#000",
        muted: "#62748e",
        hover: "rgba(0,0,0,0.03)",
      }
    : {
        bg: "#000",
        card: "#030712",
        border: "#1e2939",
        text: "#fff",
        muted: "#62748e",
        hover: "rgba(255,255,255,0.04)",
      };
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortMonth(monthKey: string): string {
  // monthKey = "2025-01"
  const d = new Date(monthKey + "-01");
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

function fullMonthName(monthKey: string): string {
  const d = new Date(monthKey + "-01");
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function isCurrentMonthKey(monthKey: string): boolean {
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return monthKey === cur;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return toDateStr(d);
  });
}

function getLast12Weeks(): { label: string; start: string; end: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
      label: start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      start: toDateStr(start),
      end: toDateStr(end),
    };
  }).reverse();
}

/** Calculate current consecutive-day streak. */
function getCurrentStreak(stats: IStatEntry[]): number {
  const dates = [...new Set(stats.filter((s) => s.completedTasks.length > 0).map((s) => s.date))].sort().reverse();
  if (!dates.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (dates[i] === toDateStr(expected)) streak++;
    else break;
  }
  return streak;
}

/** Calculate all-time best streak. */
function getBestStreak(stats: IStatEntry[]): number {
  const dates = [...new Set(stats.filter((s) => s.completedTasks.length > 0).map((s) => s.date))].sort();
  if (!dates.length) return 0;
  let best = 1,
    cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

/** Completion % for a single day entry (0–100). */
function pct(entry: IStatEntry): number {
  if (!entry.totalTasks || !entry.completedTasks.length) return 0;
  return Math.min(100, Math.round((entry.completedTasks.length / entry.totalTasks) * 100));
}

/** Average completion % across multiple entries. */
function avgPct(entries: IStatEntry[]): number {
  const valid = entries.filter((e) => e.totalTasks > 0);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, e) => sum + pct(e), 0) / valid.length);
}

/** Overall average completion % across all tracked days. */
function getConsistencyScore(stats: IStatEntry[]): number {
  return avgPct(stats);
}

/** Extract unique years from stats, newest first. */
function extractYears(stats: IStatEntry[]): number[] {
  const s = new Set<number>();
  stats.forEach((e) => {
    const y = parseInt(e.date.slice(0, 4));
    if (y > 2000) s.add(y);
  });
  return [...s].sort((a, b) => b - a);
}

function buildAllTimeMonthly(
  stats: IStatEntry[],
): { name: string; count: number }[] {
  const map = new Map<string, IStatEntry[]>();
  stats.forEach((s) => {
    const key = s.date.slice(0, 7);
    const arr = map.get(key) || [];
    arr.push(s);
    map.set(key, arr);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entries]) => ({
      name: shortMonth(key),
      count: avgPct(entries),
    }));
}

/** Build monthly completions for a specific year, sorted chronologically. */
function buildMonthlyForYear(
  stats: IStatEntry[],
  year: number,
): MonthlyCompletion[] {
  const map = new Map<string, IStatEntry[]>();
  stats
    .filter((s) => s.date.startsWith(String(year)))
    .forEach((s) => {
      const key = s.date.slice(0, 7);
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entries]) => ({
      shortLabel: shortMonth(key),
      fullName: fullMonthName(key),
      monthKey: key,
      count: avgPct(entries),
      totalCompleted: entries.reduce(
        (sum, e) => sum + e.completedTasks.length,
        0,
      ),
      uniqueDays: entries.length,
      uniqueTasks: new Set(entries.flatMap((e) => e.completedTasks)).size,
    }));
}

/** Top N tasks by completion count. */
function buildTopTasks(
  stats: IStatEntry[],
  year: number | null,
  limit = 10,
): TaskTotal[] {
  const filtered = year
    ? stats.filter((s) => s.date.startsWith(String(year)))
    : stats;
  const map = new Map<string, number>();
  filtered.forEach((s) =>
    s.completedTasks.forEach((taskName) =>
      map.set(taskName, (map.get(taskName) || 0) + 1),
    ),
  );
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/** Generate financial-style insights for the routine tracker. */
function generateInsights(
  completedMonthly: MonthlyCompletion[],
  topTasks: TaskTotal[],
  currentStreak: number,
  bestStreak: number,
  consistency: number,
  dayBreakdown: { day: string; full: string; count: number }[],
): InsightItem[] {
  const insights: InsightItem[] = [];

  // 1. Streak insight
  if (currentStreak >= 7) {
    insights.push({
      type: "success",
      title: `🔥 ${currentStreak}-Day Streak!`,
      body: `You've completed tasks every day for ${currentStreak} consecutive days. ${
        currentStreak >= bestStreak
          ? "This is your all-time best streak — keep it going!"
          : `Your best is ${bestStreak} days. You're on track to beat it!`
      }`,
    });
  } else if (currentStreak === 0) {
    insights.push({
      type: "warning",
      title: "No Active Streak",
      body: `You haven't logged completions today yet. Your best streak was ${bestStreak} days — start a new one right now!`,
    });
  }

  // 2. Consistency score
  if (consistency >= 80) {
    insights.push({
      type: "success",
      title: `${consistency}% Avg Completion Rate`,
      body: "You're completing over 80% of your scheduled tasks on average. That level of follow-through compounds into serious long-term progress.",
    });
  } else if (consistency < 50 && consistency > 0) {
    insights.push({
      type: "warning",
      title: `Low Completion Rate: ${consistency}%`,
      body: "You're completing fewer than half of your scheduled tasks on average. Consider reducing your daily task count to build momentum first.",
    });
  }

  // 3. Month-over-month trend
  if (completedMonthly.length >= 2) {
    const last = completedMonthly[completedMonthly.length - 1];
    const prev = completedMonthly[completedMonthly.length - 2];
    const diff = last.count - prev.count;

    if (diff >= 10) {
      insights.push({
        type: "success",
        title: `+${diff}% Points vs Last Month`,
        body: `Your avg daily completion rose from ${prev.count}% in ${prev.shortLabel} to ${last.count}% in ${last.shortLabel}. Excellent consistency!`,
      });
    } else if (diff <= -10) {
      insights.push({
        type: "warning",
        title: `${diff}% Points vs Last Month`,
        body: `Your avg daily completion fell from ${prev.count}% in ${prev.shortLabel} to ${last.count}% in ${last.shortLabel}. What got in the way?`,
      });
    }
  }

  // 4. Best day of week
  const bestDay = [...dayBreakdown].sort((a, b) => b.count - a.count)[0];
  if (bestDay?.count > 0) {
    const worstDay = [...dayBreakdown]
      .filter((d) => d.count > 0)
      .sort((a, b) => a.count - b.count)[0];
    insights.push({
      type: "info",
      title: `Best Day: ${bestDay.full} (${bestDay.count}% avg)`,
      body: `You average ${bestDay.count}% completion on ${bestDay.full}s — your strongest day. ${
        worstDay && worstDay.day !== bestDay.day
          ? `${worstDay.full}s average only ${worstDay.count}% — consider a lighter schedule that day.`
          : "Keep scheduling your most important tasks on this day."
      }`,
    });
  }

  // 5. Task dominance
  if (topTasks.length > 0) {
    const top = topTasks[0];
    const totalCompletions = topTasks.reduce((s, t) => s + t.count, 0);
    const taskShare =
      totalCompletions > 0
        ? Math.round((top.count / totalCompletions) * 100)
        : 0;
    if (taskShare > 40) {
      insights.push({
        type: "tip",
        title: `"${top.name}" Dominates Your Routine`,
        body: `${taskShare}% of your completions are for "${top.name}". Consider whether your other tasks need more attention or restructuring.`,
      });
    }
  }

  // 6. 3-month rising/falling trend
  if (completedMonthly.length >= 3) {
    const [a, b, c] = completedMonthly.slice(-3).map((m) => m.count);
    if (a < b && b < c) {
      insights.push({
        type: "success",
        title: "3-Month Rising Trend 📈",
        body: `Your avg completion % has improved for 3 consecutive months: ${completedMonthly.slice(-3).map((m) => `${m.count}%`).join(" → ")}. Keep it up!`,
      });
    } else if (a > b && b > c) {
      insights.push({
        type: "warning",
        title: "3-Month Declining Trend 📉",
        body: `Your avg completion % has dropped for 3 consecutive months: ${completedMonthly.slice(-3).map((m) => `${m.count}%`).join(" → ")}. Consider simplifying your routine.`,
      });
    }
  }

  // Fallback
  if (!insights.length) {
    insights.push({
      type: "info",
      title: "Keep Building Your Data",
      body: "Complete tasks across at least 2–3 months to unlock personalized insights and trend analysis.",
    });
  }

  return insights;
}

// =============================================================================
// SECTION 4: SMALL UI COMPONENTS
// =============================================================================

function ChartTooltip({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  t: ThemeTokens;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl shadow-2xl text-xs"
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        color: t.text,
      }}
    >
      {label && (
        <div
          className="font-bold mb-1 uppercase tracking-widest text-[10px]"
          style={{ color: t.muted }}
        >
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span style={{ color: t.muted }}>{p.name || "Tasks"}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
  t,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
  t: ThemeTokens;
}) {
  const trendCfg = {
    up: { bg: "#10b98122", color: "#10b981", Icon: TrendingUp, label: "Up" },
    down: {
      bg: "#f43f5e22",
      color: "#f43f5e",
      Icon: TrendingDown,
      label: "Down",
    },
    neutral: { bg: "#55555522", color: t.muted, Icon: null, label: "Stable" },
  };
  const tc = trend ? trendCfg[trend] : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.02]"
      style={{ background: t.card, border: `1px solid ${t.border}` }}
    >
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: color + "22" }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          {tc && (
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: tc.bg, color: tc.color }}
            >
              {tc.Icon && <tc.Icon size={11} />}
              <span className="hidden sm:inline">{tc.label}</span>
            </div>
          )}
        </div>
        <div
          className="text-xl sm:text-2xl font-black tracking-tight"
          style={{ color: t.text }}
        >
          {value}
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mt-0.5"
          style={{ color: t.muted }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: t.muted }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  type,
  title,
  body,
  t,
}: InsightItem & { t: ThemeTokens }) {
  const cfg = {
    warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#f59e0b15" },
    success: { icon: CheckCircle, color: "#10b981", bg: "#10b98115" },
    info: { icon: Activity, color: "#6366f1", bg: "#6366f115" },
    tip: { icon: Sparkles, color: "#ec4899", bg: "#ec489915" },
  };
  const { icon: Icon, color, bg } = cfg[type];
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4"
      style={{ background: t.card, border: `1px solid ${t.border}` }}
    >
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: bg }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="font-bold text-sm mb-1" style={{ color: t.text }}>
          {title}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: t.muted }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  t,
}: {
  title: string;
  subtitle: string;
  t: ThemeTokens;
}) {
  return (
    <>
      <h2
        className="text-xs font-black uppercase tracking-widest mb-0.5"
        style={{ color: t.muted }}
      >
        {title}
      </h2>
      <p className="text-xs mb-4 sm:mb-6" style={{ color: t.muted }}>
        {subtitle}
      </p>
    </>
  );
}

function EmptyState({ t }: { t: ThemeTokens }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-32 gap-3"
      style={{ color: t.muted }}
    >
      <BarChart3 size={28} className="opacity-30" />
      <p className="text-sm font-medium opacity-50">No data to display yet</p>
    </div>
  );
}

// =============================================================================
// SECTION 5: MAIN COMPONENT
// =============================================================================

export default function StatsRoutine() {
  const { user: auth } = useAuth();

  // Detect dark mode from the HTML element class (set by ThemeProvider)
  const [isDark, setIsDark] = useState(false);
  const updateIsDark = useCallback(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  useEffect(() => {
    updateIsDark();
    const observer = new MutationObserver(updateIsDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [updateIsDark]);

  const t = getTokens(!isDark); // !isDark === isLight

  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [dailyRange, setDailyRange] = useState(30);

  const stats: IStatEntry[] = useMemo(
    () => (Array.isArray(auth?.stats) ? auth.stats : []),
    [auth?.stats],
  );

  // ── Available years ──────────────────────────────────────────────────────
  const availableYears = useMemo(() => extractYears(stats), [stats]);

  // Auto-select most recent year
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const year = selectedYear ?? availableYears[0] ?? new Date().getFullYear();

  // ── Summary stats ────────────────────────────────────────────────────────
  const today = toDateStr(new Date());
  const completedToday = useMemo(
    () => stats.find((s) => s.date === today)?.completedTasks.length ?? 0,
    [stats, today],
  );
  const totalAll = useMemo(
    () => stats.reduce((sum, s) => sum + s.completedTasks.length, 0),
    [stats],
  );
  const uniqueDays = stats.length;
  const streak = useMemo(() => getCurrentStreak(stats), [stats]);
  const bestStreak = useMemo(() => getBestStreak(stats), [stats]);
  const consistency = useMemo(() => getConsistencyScore(stats), [stats]);

  const bestDayAllTime = useMemo(() => {
    if (!stats.length) return null;
    const best = stats.reduce((top, s) => pct(s) > pct(top) ? s : top, stats[0]);
    const p = pct(best);
    if (!p) return null;
    const dateObj = new Date(best.date + "T00:00:00");
    const label = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    return { pct: p, label };
  }, [stats]);

  // ── Chart data ───────────────────────────────────────────────────────────
  const last30 = useMemo(() => Array.from({ length: dailyRange }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (dailyRange - 1 - i));
    return toDateStr(d);
  }), [dailyRange]);
  const last12Weeks = getLast12Weeks();

  const dailyData = useMemo(
    () =>
      last30.map((date) => {
        const entry = stats.find((s) => s.date === date);
        return { date: date.slice(5), count: entry ? pct(entry) : 0 };
      }),
    [stats, last30],
  );

  const weeklyData = useMemo(
    () =>
      last12Weeks.map((w) => ({
        label: w.label,
        count: avgPct(
          stats.filter((s) => s.date >= w.start && s.date <= w.end),
        ),
      })),
    [stats, last12Weeks],
  );

  const dayBreakdown = useMemo(
    () =>
      DAYS_ORDER.map((day) => ({
        day: day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3),
        full: day.charAt(0).toUpperCase() + day.slice(1),
        count: avgPct(stats.filter((s) => s.day === day)),
      })),
    [stats],
  );

  const allTimeMonthly = useMemo(() => buildAllTimeMonthly(stats), [stats]);

  // Monthly data for selected year
  const monthlyData = useMemo(
    () => buildMonthlyForYear(stats, year),
    [stats, year],
  );

  // Completed months only (exclude current — still accumulating)
  const completedMonthly = useMemo(
    () => monthlyData.filter((m) => !isCurrentMonthKey(m.monthKey)),
    [monthlyData],
  );

  const avgPerMonth =
    completedMonthly.length > 0
      ? Math.round(
          completedMonthly.reduce((s, m) => s + m.count, 0) /
            completedMonthly.length,
        )
      : 0;

  const completedWithData = completedMonthly.filter((m) => m.count > 0);

  const highestMonth = completedWithData.length > 0
    ? completedWithData.reduce((best, m) => (m.count > best.count ? m : best))
    : null;
  const lowestMonth =
    completedWithData.length > 0
      ? completedWithData.reduce((best, m) => (m.count < best.count ? m : best))
      : null;

  // Month-over-month trend
  const momTrend: "up" | "down" | "neutral" = useMemo(() => {
    if (completedMonthly.length < 2) return "neutral";
    const [prev, last] = completedMonthly.slice(-2);
    if (last.count > prev.count) return "up";
    if (last.count < prev.count) return "down";
    return "neutral";
  }, [completedMonthly]);

  // Radar: last 6 months vs average
  const radarData = useMemo(
    () =>
      monthlyData.slice(-6).map((m) => ({
        month: m.shortLabel,
        completions: m.count,
        average: avgPerMonth,
      })),
    [monthlyData, avgPerMonth],
  );

  // Tasks
  const topTasks = useMemo(() => buildTopTasks(stats, year), [stats, year]);

  // Yearly total
  const totalThisYear =
    monthlyData.length > 0
      ? Math.round(
          monthlyData.reduce((s, m) => s + m.count, 0) / monthlyData.length,
        )
      : 0; // avg of monthly avg %s = overall avg % for the year

  // Insights
  const insights = useMemo(
    () =>
      generateInsights(
        completedMonthly,
        topTasks,
        streak,
        bestStreak,
        consistency,
        dayBreakdown,
      ),
    [completedMonthly, topTasks, streak, bestStreak, consistency, dayBreakdown],
  );

  const activeCalendarMonths = useMemo(() => {
    const monthSet = new Set<string>();
    stats.forEach((s) => monthSet.add(s.date.slice(0, 7)));
    if (!monthSet.size) return [];
    const sorted = [...monthSet].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const result: string[] = [];
    const cur = new Date(first + "-01");
    const end = new Date(last + "-01");
    while (cur <= end) {
      result.push(
        `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
      );
      cur.setMonth(cur.getMonth() + 1);
    }
    return result.reverse();
  }, [stats]);

  // Calendar heatmap
  const calendarData = useMemo(() => {
    const monthKey = activeCalendarMonths[calendarOffset];
    if (!monthKey) return { cells: [], label: "No data" };
    const [y, mo] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    const firstDow = new Date(y, mo - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDow; i++)
      cells.push({ date: "", count: 0, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEntry = stats.find((s) => s.date === ds);
      cells.push({
        date: ds,
        count: dayEntry ? pct(dayEntry) : 0,
        inMonth: true,
      });
    }
    return {
      cells,
      label: new Date(y, mo - 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [stats, calendarOffset, activeCalendarMonths]);

  if (!auth) return null;

  return (
    <div
      className="min-h-screen pt-[63px] font-sans"
      style={{ background: t.bg, color: t.text }}
    >
      {/* ── STICKY HEADER ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-[63px] z-40 border-b"
        style={{ background: t.bg, borderColor: t.border }}
      >
        {/* Title + year picker */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1
            className="text-base sm:text-xl font-black tracking-tight truncate"
            style={{ color: t.text }}
          >
            Routine Analytics
          </h1>

          {/* Year picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setYearDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                color: t.text,
              }}
            >
              <Calendar size={13} style={{ color: "#6366f1" }} />
              {year}
              <ChevronDown
                size={13}
                style={{ color: t.muted }}
                className={`transition-transform ${yearDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {yearDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setSelectedYear(y);
                      setYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-bold hover:opacity-80"
                    style={{ color: y === year ? "#6366f1" : t.text }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 flex overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all relative flex-shrink-0"
                style={{ color: active ? "#6366f1" : t.muted }}
              >
                <Icon size={14} />
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "#6366f1" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Completed Today"
                value={completedToday}
                icon={CheckCircle}
                color="#10b981"
                t={t}
                sub={(() => {
                  const todayEntry = stats.find((s) => s.date === today);
                  const p = todayEntry ? pct(todayEntry) : 0;
                  return `tasks done${p > 0 ? ` · ${p}%` : ""}`;
                })()}
              />
              <StatCard
                label="Current Streak"
                value={`${streak}d`}
                icon={Flame}
                color="#f43f5e"
                t={t}
                sub={`Best: ${bestStreak}d`}
              />
              <StatCard
                label="Best Day"
                value={bestDayAllTime ? `${bestDayAllTime.pct}%` : "—"}
                icon={Target}
                color="#6366f1"
                t={t}
                sub={bestDayAllTime ? bestDayAllTime.label : "no data yet"}
              />
              <StatCard
                label="Avg Completion %"
                value={`${consistency}%`}
                icon={Award}
                color="#f59e0b"
                t={t}
                sub={`across ${uniqueDays} tracked days`}
              />
            </div>

            {/* All-time area chart */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <SectionHeader
                title="All-Time Completion Trend"
                subtitle="Avg daily completion % per month, all time"
                t={t}
              />
              {allTimeMonthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={allTimeMonthly}>
                    <defs>
                      <linearGradient
                        id="allTimeGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={34}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<ChartTooltip t={t} />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Avg %"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#allTimeGrad)"
                      dot={{ fill: "#6366f1", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState t={t} />
              )}
            </div>

            {/* Daily Completion % */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              {/* Header row: title + range pills */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: t.muted }}>
                    Daily Completion %
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                    What % of your scheduled tasks you completed each day
                  </p>
                </div>
                {/* Range switcher */}
                <div className="flex overflow-x-auto scrollbar-none gap-1 flex-shrink-0 max-w-[55%] md:max-w-none pb-0.5">
                  {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDailyRange(r)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors"
                      style={{
                        background: dailyRange === r ? "#10b981" : t.border,
                        color: dailyRange === r ? "#fff" : t.muted,
                      }}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </div>

              {totalAll > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: t.muted, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.floor(dailyRange / 12)}
                    />
                    <YAxis
                      tick={{ fill: t.muted, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={34}
                      domain={[0, 100]}
                      ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<ChartTooltip t={t} />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Daily %"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#dailyGrad)"
                      dot={dailyRange <= 60 ? { fill: "#10b981", r: 2 } : false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState t={t} />
              )}
            </div>

            {/* Weekly + Day-of-week */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <SectionHeader
                  title="Weekly Avg Completion %"
                  subtitle="Avg daily completion % per week — last 12 weeks"
                  t={t}
                />
                {totalAll > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyData} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: t.muted, fontSize: 8 }}
                        axisLine={false}
                        tickLine={false}
                        interval={2}
                      />
                      <YAxis
                        tick={{ fill: t.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={34}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={<ChartTooltip t={t} />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="count"
                        name="Avg %"
                        radius={[5, 5, 0, 0]}
                      >
                        {weeklyData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState t={t} />
                )}
              </div>

              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <SectionHeader
                  title="By Day of Week"
                  subtitle="Avg completion % per weekday, all time"
                  t={t}
                />
                {totalAll > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dayBreakdown} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: t.muted, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: t.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={34}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={<ChartTooltip t={t} />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="count"
                        name="Avg %"
                        radius={[6, 6, 0, 0]}
                      >
                        {dayBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState t={t} />
                )}
              </div>
            </div>

            {/* Calendar heatmap */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: t.muted }}
                  >
                    Completion Calendar
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                    {calendarData.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarOffset((p) => Math.min(activeCalendarMonths.length - 1, p + 1))}
                    disabled={calendarOffset >= activeCalendarMonths.length - 1}
                    className="p-1.5 rounded-lg border disabled:opacity-30"
                    style={{ border: `1px solid ${t.border}`, color: t.muted }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCalendarOffset((p) => Math.max(0, p - 1))}
                    disabled={calendarOffset === 0}
                    className="p-1.5 rounded-lg border disabled:opacity-30"
                    style={{ border: `1px solid ${t.border}`, color: t.muted }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-bold pb-1"
                    style={{ color: t.muted }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarData.cells.map((cell, i) => (
                  <div
                    key={cell.date ?? `cell-${i}`}
                    title={
                      cell.date ? `${cell.date}: ${cell.count}% completed` : ""
                    }
                    className="aspect-square rounded-md flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: !cell.inMonth
                        ? "transparent"
                        : cell.count === 0
                          ? t.border
                          : cell.count <= 10
                            ? "#6366f11a"
                            : cell.count <= 20
                              ? "#6366f133"
                              : cell.count <= 30
                                ? "#6366f14d"
                                : cell.count <= 40
                                  ? "#6366f166"
                                  : cell.count <= 50
                                    ? "#6366f180"
                                    : cell.count <= 60
                                      ? "#6366f199"
                                      : cell.count <= 70
                                        ? "#6366f1b3"
                                        : cell.count <= 85
                                          ? "#6366f1cc"
                                          : "#6366f1",
                      color: cell.count > 70 ? "000000" : "ffffff",
                      opacity: cell.inMonth ? 1 : 0,
                    }}
                  >
                    {cell.inMonth
                      ? new Date(cell.date + "T00:00:00").getDate()
                      : ""}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px]" style={{ color: t.muted }}>
                  Less
                </span>
                {[
                  t.border,
                  "#6366f11a",
                  "#6366f133",
                  "#6366f14d",
                  "#6366f166",
                  "#6366f180",
                  "#6366f199",
                  "#6366f1b3",
                  "#6366f1cc",
                  "#6366f1",
                ].map((c, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{ background: c }}
                  />
                ))}
                <span className="text-[10px]" style={{ color: t.muted }}>
                  More
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ MONTHLY TAB ════════════════ */}
        {activeTab === "monthly" && (
          <div className="space-y-4 sm:space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label={`Avg Daily % — ${year}`}
                value={totalThisYear > 0 ? `${totalThisYear}%` : "—"}
                icon={Target}
                color="#6366f1"
                t={t}
                sub={`${monthlyData.length} months tracked`}
              />
              <StatCard
                label="Monthly Avg %"
                value={avgPerMonth > 0 ? `${avgPerMonth}%` : "—"}
                icon={BarChart3}
                color="#10b981"
                t={t}
                trend={momTrend}
                sub="completed months"
              />
              <StatCard
                label="Best Month"
                value={highestMonth ? highestMonth.shortLabel : "—"}
                icon={Flame}
                color="#f43f5e"
                t={t}
                sub={
                  highestMonth
                    ? `${highestMonth.count}% avg`
                    : undefined
                }
              />
              <StatCard
                label="Lowest Month"
                value={lowestMonth ? lowestMonth.shortLabel : "—"}
                icon={Zap}
                color="#f59e0b"
                t={t}
                sub={lowestMonth ? `${lowestMonth.count}% avg` : undefined}
              />
            </div>

            {/* Monthly bar chart */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <SectionHeader
                title={`Monthly Completion % — ${year}`}
                subtitle="Avg daily completion % for each month"
                t={t}
              />
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={34}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<ChartTooltip t={t} />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="count"
                      name="Avg %"
                      radius={[7, 7, 0, 0]}
                    >
                      {monthlyData.map((m, i) => (
                        <Cell
                          key={i}
                          fill={
                            highestMonth && m.count === highestMonth.count && m.count > 0
                              ? "#f43f5e"
                              : "#6366f1"
                          }
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState t={t} />
              )}
            </div>

            {/* Trend line chart */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <SectionHeader
                title="Month-over-Month Trend"
                subtitle="Avg completion % each month vs. your overall average"
                t={t}
              />
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={34}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<ChartTooltip t={t} />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Avg %"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    {avgPerMonth > 0 && (
                      <Line
                        type="monotone"
                        dataKey={() => avgPerMonth}
                        name="Overall Avg %"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    )}
                    <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState t={t} />
              )}
            </div>

            {/* Monthly summary table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <div
                className="p-4 sm:p-6 border-b"
                style={{ borderColor: t.border }}
              >
                <h2
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: t.muted }}
                >
                  Month Summary
                </h2>
              </div>
              {monthlyData.length > 0 ? (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden">
                    {monthlyData.map((m, i) => {
                      const diff = m.count - avgPerMonth;
                      const share =
                        totalThisYear > 0
                          ? Math.round((m.count / totalThisYear) * 100)
                          : 0;
                      return (
                        <div
                          key={m.monthKey}
                          className="p-4 space-y-2 border-b last:border-b-0"
                          style={{ borderColor: t.border }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div
                                className="font-bold text-sm"
                                style={{ color: t.text }}
                              >
                                {m.fullName}
                              </div>
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: t.muted }}
                              >
                                {m.uniqueDays} active days · {m.totalCompleted} tasks done
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className="font-black text-sm"
                                style={{ color: t.text }}
                              >
                                {m.count}%
                              </div>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background:
                                    diff >= 0 ? "#10b98122" : "#f43f5e22",
                                  color: diff >= 0 ? "#10b981" : "#f43f5e",
                                }}
                              >
                                {diff >= 0 ? "+" : ""}
                                {diff}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ background: t.border }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${share}%`,
                                  background: "#6366f1",
                                }}
                              />
                            </div>
                            <span
                              className="text-xs w-7 text-right"
                              style={{ color: t.muted }}
                            >
                              {share}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                          {[
                            "Month",
                            "Days",
                            "Tasks Done",
                            "Avg %",
                            "vs Avg",
                            "Share",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left px-6 py-3 font-black text-xs uppercase tracking-widest"
                              style={{ color: t.muted }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((m, i) => {
                          const diff = m.count - avgPerMonth;
                          const share =
                            totalThisYear > 0
                              ? Math.round((m.count / totalThisYear) * 100)
                              : 0;
                          return (
                            <tr
                              key={m.monthKey}
                              className="border-b transition-colors"
                              style={{ borderColor: t.border, color: t.text }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = t.hover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <td className="px-6 py-4 font-bold">
                                {m.fullName}
                              </td>
                              <td
                                className="px-6 py-4"
                                style={{ color: t.muted }}
                              >
                                {m.uniqueDays}
                              </td>
                              <td
                                className="px-6 py-4"
                                style={{ color: t.muted }}
                              >
                                {m.totalCompleted}
                              </td>
                              <td className="px-6 py-4 font-bold">{m.count}%</td>
                              <td className="px-6 py-4">
                                <span
                                  className="text-xs font-bold px-2 py-1 rounded-full"
                                  style={{
                                    background:
                                      diff >= 0 ? "#10b98122" : "#f43f5e22",
                                    color: diff >= 0 ? "#10b981" : "#f43f5e",
                                  }}
                                >
                                  {diff >= 0 ? "+" : ""}
                                  {diff}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                                    style={{ background: t.border }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${share}%`,
                                        background: "#6366f1",
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-xs w-8 text-right"
                                    style={{ color: t.muted }}
                                  >
                                    {share}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-6">
                  <EmptyState t={t} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ TASKS TAB ════════════════ */}
        {activeTab === "tasks" && (
          <div className="space-y-4 sm:space-y-8">
            {/* Pie + ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Donut chart */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <SectionHeader
                  title="Task Distribution"
                  subtitle={`Top tasks by completion count in ${year}`}
                  t={t}
                />
                {topTasks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={topTasks}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                      >
                        {topTasks.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}×`, "Completed"]} />
                      <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState t={t} />
                )}
              </div>

              {/* Task ranking bars */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <SectionHeader
                  title="Task Ranking"
                  subtitle="Your most completed tasks"
                  t={t}
                />
                <div className="space-y-2 sm:space-y-3">
                  {topTasks.map((task, i) => {
                    const w =
                      topTasks[0].count > 0
                        ? Math.round((task.count / topTasks[0].count) * 100)
                        : 0;
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={task.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className="text-xs font-bold truncate max-w-[65%]"
                            style={{ color: t.text }}
                          >
                            {task.name}
                          </span>
                          <span
                            className="text-xs font-black"
                            style={{ color }}
                          >
                            {task.count}×
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: t.border }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${w}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {topTasks.length === 0 && <EmptyState t={t} />}
                </div>
              </div>
            </div>

            {/* Radar chart — last 6 months */}
            {radarData.length >= 3 && (
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <SectionHeader
                  title="Completion % Radar (Last 6 Months)"
                  subtitle="Avg completion % each month vs. your overall average %"
                  t={t}
                />
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                  >
                    <PolarGrid stroke={t.border} />
                    <PolarAngleAxis
                      dataKey="month"
                      tick={{ fill: t.muted, fontSize: 10 }}
                    />
                    <Radar
                      name="Completions"
                      dataKey="completions"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Avg"
                      dataKey="average"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.1}
                      strokeDasharray="4 4"
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Day-of-week breakdown (moved here too for task analysis context) */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <SectionHeader
                title="Completion % by Weekday"
                subtitle="Avg completion % per weekday, all time"
                t={t}
              />
              {totalAll > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dayBreakdown} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: t.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: t.muted, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={34}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<ChartTooltip t={t} />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="count"
                      name="Avg %"
                      radius={[6, 6, 0, 0]}
                    >
                      {dayBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState t={t} />
              )}
            </div>
          </div>
        )}

        {/* ════════════════ INSIGHTS TAB ════════════════ */}
        {activeTab === "insights" && (
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4"
                style={{ background: "#6366f115", color: "#6366f1" }}
              >
                <Sparkles size={12} /> Pattern Analysis
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: t.text }}
              >
                Your Routine Insights
              </h2>
              <p className="text-xs sm:text-sm mt-2" style={{ color: t.muted }}>
                Personalized observations based on your habit data
              </p>
            </div>

            {/* Insight cards */}
            {insights.map((ins) => (
              <InsightCard key={ins.title} {...ins} t={t} />
            ))}

            {/* Summary pills */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
              {[
                {
                  value: totalAll,
                  label: "Total Tasks Completed",
                  color: "#6366f1",
                },
                {
                  value: `${streak}d`,
                  label: "Current Streak",
                  color: "#f43f5e",
                },
                {
                  value: `${bestStreak}d`,
                  label: "All-Time Best Streak",
                  color: "#f59e0b",
                },
                {
                  value: `${consistency}%`,
                  label: "Overall Avg Completion %",
                  color: "#10b981",
                },
                {
                  value: uniqueDays,
                  label: "Days Tracked",
                  color: "#3b82f6",
                },
                {
                  value: topTasks.length,
                  label: `Unique Tasks (${year})`,
                  color: "#8b5cf6",
                },
                {
                  value: availableYears.length,
                  label: "Years of Data",
                  color: "#ec4899",
                },
                {
                  value: `${avgPerMonth}%`,
                  label: "Avg Monthly Completion %",
                  color: "#14b8a6",
                },
              ].map((pill, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 sm:p-5 text-center"
                  style={{
                    background: t.card,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-black"
                    style={{ color: pill.color }}
                  >
                    {pill.value}
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest mt-1 leading-tight"
                    style={{ color: t.muted }}
                  >
                    {pill.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
