"use client";

import { updateGoals } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { IGoal, ISubtask } from "@/store/features/auth/authSlice";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Edit3,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "#ef4444",
    bg: "#ef444418",
    icon: Flame,
  },
  high: {
    label: "High",
    color: "#f97316",
    bg: "#f9731618",
    icon: AlertTriangle,
  },
  medium: { label: "Medium", color: "#eab308", bg: "#eab30818", icon: ArrowUp },
  low: { label: "Low", color: "#6366f1", bg: "#6366f118", icon: ArrowDown },
};

const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#6b7280", bg: "#6b728018" },
  "in-progress": { label: "In Progress", color: "#3b82f6", bg: "#3b82f618" },
  done: { label: "Done", color: "#10b981", bg: "#10b98118" },
  archived: { label: "Archived", color: "#8b5cf6", bg: "#8b5cf618" },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REPEAT_OPTIONS = ["none", "daily", "weekly", "monthly"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const STATUS_OPTIONS = ["todo", "in-progress", "done", "archived"] as const;

const GOAL_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "", // "" = no color
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const emptyGoal = (): Omit<IGoal, "id" | "createdAt"> => ({
  name: "",
  description: "",
  priority: "medium",
  status: "todo",
  category: "",
  dueDate: "",
  time: "",
  reminderAt: "",
  repeat: "none",
  tags: [],
  subtasks: [],
  finishedAt: "",
  pinned: false,
  color: "",
});

function isOverdue(goal: IGoal): boolean {
  if (!goal.dueDate || goal.status === "done" || goal.status === "archived")
    return false;
  return new Date(goal.dueDate) < new Date(new Date().toDateString());
}

function isDueToday(goal: IGoal): boolean {
  if (!goal.dueDate || goal.status === "done" || goal.status === "archived")
    return false;
  return goal.dueDate === new Date().toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

function SubtaskRow({
  sub,
  onToggle,
  onDelete,
  onRename,
  theme,
}: {
  sub: ISubtask;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  theme: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(sub.name);

  return (
    <div className="flex items-center gap-2 py-1">
      <button onClick={onToggle} className="flex-shrink-0">
        {sub.isDone ? (
          <CheckCircle2 size={15} className="text-emerald-500" />
        ) : (
          <Circle size={15} className="opacity-40" />
        )}
      </button>
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            onRename(val);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(val);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setVal(sub.name);
              setEditing(false);
            }
          }}
          className={`flex-1 text-xs bg-transparent border-b outline-none ${
            theme ? "border-gray-300" : "border-gray-700"
          }`}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs cursor-text ${
            sub.isDone ? "opacity-40" : ""
          }`}
        >
          {sub.name}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-30 hover:opacity-80 flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Goal Form ────────────────────────────────────────────────────────────────

function GoalForm({
  initial,
  onSave,
  onCancel,
  theme,
}: {
  initial: Partial<IGoal>;
  onSave: (goal: Omit<IGoal, "id" | "createdAt">) => void;
  onCancel: () => void;
  theme: boolean;
}) {
  const base = { ...emptyGoal(), ...initial };
  const [form, setForm] = useState(base);
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (!t) return;
    set("subtasks", [
      ...form.subtasks,
      { id: genId(), name: t, isDone: false },
    ]);
    setSubtaskInput("");
  };

  const inputCls = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition ${
    theme
      ? "bg-white border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-400"
      : "bg-gray-900 border-gray-700 focus:border-indigo-500 text-gray-100 placeholder-gray-600"
  } [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute`;

  const labelCls = `block text-[11px] font-bold uppercase tracking-widest mb-1 ${
    theme ? "text-gray-500" : "text-gray-500"
  }`;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelCls}>Goal Name *</label>
        <input
          autoFocus
          placeholder="What do you want to achieve?"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          placeholder="Add more context..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Priority</label>
          <select
            value={form.priority}
            onChange={(e) =>
              set("priority", e.target.value as IGoal["priority"])
            }
            className={inputCls}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as IGoal["status"])}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category + Reminder */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Category</label>
          <input
            placeholder="e.g. Health, Career..."
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Reminder Date</label>
          <div className="relative">
            <input
              type="date"
              value={form.reminderAt}
              onChange={(e) => set("reminderAt", e.target.value)}
              className={`${inputCls} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Bell
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme ? "text-gray-400" : "text-gray-300"}`}
            />
          </div>
        </div>
      </div>

      {/* Due Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Due Date</label>
          <div className="relative">
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className={`${inputCls} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Calendar
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme ? "text-gray-400" : "text-gray-300"}`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <div className="relative">
            <input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              className={`${inputCls} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Clock
              size={14}
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme ? "text-gray-400" : "text-gray-300"}`}
            />
          </div>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className={labelCls}>Color Label</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {GOAL_COLORS.map((c) => (
            <button
              key={c || "none"}
              onClick={() => set("color", c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                form.color === c
                  ? "scale-110 border-white shadow-lg"
                  : "border-transparent"
              }`}
              style={{
                background: c || (theme ? "#e5e7eb" : "#374151"),
              }}
              title={c || "No color"}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags</label>
        <div className="flex gap-2">
          <input
            placeholder="Add tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={addTag}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  theme
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-indigo-900/40 text-indigo-300"
                }`}
              >
                {tag}
                <button
                  onClick={() =>
                    set(
                      "tags",
                      form.tags.filter((t) => t !== tag),
                    )
                  }
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Subtasks */}
      <div>
        <label className={labelCls}>Subtasks</label>
        <div className="flex gap-2">
          <input
            placeholder="Add subtask..."
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubtask();
              }
            }}
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={addSubtask}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        {form.subtasks.length > 0 && (
          <div
            className={`mt-2 px-3 py-2 rounded-lg border ${
              theme
                ? "bg-gray-50 border-gray-200"
                : "bg-gray-900 border-gray-800"
            }`}
          >
            {form.subtasks.map((sub) => (
              <SubtaskRow
                key={sub.id}
                sub={sub}
                theme={theme}
                onToggle={() =>
                  set(
                    "subtasks",
                    form.subtasks.map((s) =>
                      s.id === sub.id ? { ...s, isDone: !s.isDone } : s,
                    ),
                  )
                }
                onDelete={() =>
                  set(
                    "subtasks",
                    form.subtasks.filter((s) => s.id !== sub.id),
                  )
                }
                onRename={(name) =>
                  set(
                    "subtasks",
                    form.subtasks.map((s) =>
                      s.id === sub.id ? { ...s, name } : s,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Pin */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => set("pinned", !form.pinned)}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition ${
            form.pinned
              ? "bg-amber-500 border-amber-400 text-white"
              : theme
                ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                : "border-gray-700 text-gray-400 hover:bg-gray-900"
          }`}
        >
          {form.pinned ? <Pin size={14} /> : <PinOff size={14} />}
          {form.pinned ? "Pinned" : "Pin this goal"}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
            theme
              ? "border-gray-200 text-gray-600 hover:bg-gray-50"
              : "border-gray-700 text-gray-400 hover:bg-gray-900"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(form);
          }}
          disabled={!form.name.trim()}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            !form.name.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          Save Goal
        </button>
      </div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onTogglePin,
  onStatusChange,
  onSubtaskToggle,
  theme,
  compact = false,
}: {
  goal: IGoal;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onStatusChange: (status: IGoal["status"]) => void;
  onSubtaskToggle: (subId: string) => void;
  theme: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const priorityKey =
    goal.priority in PRIORITY_CONFIG
      ? (goal.priority as keyof typeof PRIORITY_CONFIG)
      : "medium";
  const statusKey =
    goal.status in STATUS_CONFIG
      ? (goal.status as keyof typeof STATUS_CONFIG)
      : "todo";
  const pc = PRIORITY_CONFIG[priorityKey];
  const sc = STATUS_CONFIG[statusKey];
  const overdue = isOverdue(goal);
  const dueToday = isDueToday(goal);
  const subtasksDone = goal.subtasks.filter((s) => s.isDone).length;
  const PriorityIcon = pc.icon;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 hover:shadow-md ${
        theme ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
      } ${goal.status === "archived" ? "opacity-60" : ""}`}
      style={{ borderLeftColor: goal.color || pc.color, borderLeftWidth: "3px" }}
    >
      <div className={`flex flex-col gap-2 ${compact ? "p-2 sm:p-4 sm:gap-2.5" : "p-4 gap-2.5"}`}>

        {/* Row 1 — Status circle */}
        <div className="w-full">
          <button
            onClick={() =>
              onStatusChange(
                goal.status === "done"
                  ? "todo"
                  : goal.status === "todo"
                    ? "in-progress"
                    : goal.status === "in-progress"
                      ? "done"
                      : "todo",
              )
            }
            title="Cycle status"
            className="flex items-center gap-2"
          >
            {goal.status === "done" ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : goal.status === "in-progress" ? (
              <RefreshCw size={18} className="text-blue-500" />
            ) : (
              <Circle size={18} className="opacity-30" />
            )}
            <span
              className={`text-[11px] font-medium ${compact ? "hidden sm:inline" : ""} ${
                theme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {sc.label}
            </span>
          </button>
        </div>

        {/* Row 2 — Name */}
        <div className="w-full flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span
            className={`font-semibold text-sm leading-snug whitespace-nowrap truncate min-w-0 ${
              goal.status === "done" ? "opacity-50" : ""
            } ${theme ? "text-gray-900" : "text-gray-100"}`}
          >
            {goal.name}
          </span>
          {goal.pinned && <Pin size={11} className={`text-amber-500 flex-shrink-0 ${compact ? "hidden sm:inline" : ""}`} />}
          {overdue && <span className={compact ? "hidden sm:inline" : ""}><Badge color="#ef4444" bg="#ef444418">Overdue</Badge></span>}
          {dueToday && !overdue && <span className={compact ? "hidden sm:inline" : ""}><Badge color="#f97316" bg="#f9731618">Due Today</Badge></span>}
        </div>

        {/* Row 3 — Icons (pin, edit, expand / delete) */}
        <div className={`w-full flex items-center gap-1 ${compact ? "hidden sm:flex" : ""}`}>
          <button
            onClick={onTogglePin}
            title={goal.pinned ? "Unpin" : "Pin"}
            className={`p-1.5 rounded-lg transition ${
              goal.pinned
                ? "text-amber-500"
                : theme
                  ? "text-gray-400 hover:bg-gray-50"
                  : "text-gray-600 hover:bg-gray-800"
            }`}
          >
            {goal.pinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className={`p-1.5 rounded-lg transition ${
              theme
                ? "text-gray-400 hover:bg-gray-50"
                : "text-gray-600 hover:bg-gray-800"
            }`}
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => setExpanded((p) => !p)}
            title="Expand"
            className={`p-1.5 rounded-lg transition ${
              theme
                ? "text-gray-400 hover:bg-gray-50"
                : "text-gray-600 hover:bg-gray-800"
            }`}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <div className="ml-auto">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] ${theme ? "text-gray-500" : "text-gray-400"}`}>
                  Delete?
                </span>
                <button
                  onClick={onDelete}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-red-500 hover:bg-red-600 text-white transition"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border transition ${
                    theme
                      ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`p-1.5 rounded-lg transition ${
                  theme
                    ? "text-red-400 hover:bg-red-50"
                    : "text-red-500 hover:bg-red-500/10"
                }`}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Row 4 — Priority badge */}
        <div className="w-full">
          {/* Color dot only on compact mobile */}
          <span
            className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${compact ? "sm:hidden" : "hidden"}`}
            style={{ background: pc.color }}
            title={pc.label}
          />
          {/* Full pill on sm+ (or always when not compact) */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm ${compact ? "hidden sm:inline-flex" : ""}`}
            style={{ color: pc.color, background: pc.bg }}
          >
            <PriorityIcon size={10} />
            {pc.label}
          </span>
        </div>

        {/* Row 5 — Date (if exists) */}
        {(goal.dueDate || goal.time) && (
          <div
            className={`w-full flex items-center gap-1.5 text-[11px] ${compact ? "hidden sm:flex" : ""} ${
              overdue
                ? "text-red-500"
                : dueToday
                  ? "text-orange-500"
                  : theme
                    ? "text-gray-500"
                    : "text-gray-400"
            }`}
          >
            <Calendar size={11} />
            <span>{goal.dueDate}</span>
            {goal.time && <span className="opacity-70">{goal.time}</span>}
          </div>
        )}

        {/* Row 6 — Subtasks progress (if exists) */}
        {goal.subtasks.length > 0 && (
          <div className={`w-full ${compact ? "hidden sm:block" : ""}`}>
            <div className="flex items-center justify-between text-[10px] opacity-50 mb-1">
              <span>Subtasks</span>
              <span>{subtasksDone}/{goal.subtasks.length}</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${theme ? "bg-gray-100" : "bg-gray-800"}`}>
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${goal.subtasks.length > 0 ? (subtasksDone / goal.subtasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className={`px-4 pb-4 pt-0 space-y-3 border-t ${compact ? "hidden sm:block" : ""} ${theme ? "border-gray-100" : "border-gray-800"}`}
        >
          {goal.description && (
            <p className={`text-xs leading-relaxed pt-3 ${theme ? "text-gray-600" : "text-gray-400"}`}>
              {goal.description}
            </p>
          )}

          {/* Tags */}
          {goal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {goal.tags.map((tag) => (
                <span
                  key={tag}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                    theme
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-indigo-900/30 text-indigo-400"
                  }`}
                >
                  <Tag size={8} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Subtask checklist */}
          {goal.subtasks.length > 0 && (
            <div className={`px-3 py-2 rounded-lg ${theme ? "bg-gray-50" : "bg-gray-900"}`}>
              {goal.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 py-1">
                  <button onClick={() => onSubtaskToggle(sub.id)}>
                    {sub.isDone ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Circle size={14} className="opacity-30" />
                    )}
                  </button>
                  <span className={`text-xs ${sub.isDone ? "opacity-40 line-through" : ""}`}>
                    {sub.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Reminder */}
          {goal.reminderAt && (
            <div className={`flex items-center gap-1.5 text-[11px] ${theme ? "text-gray-500" : "text-gray-300"}`}>
              <Bell size={10} /> Reminder: {goal.reminderAt.replace("T", " ")}
            </div>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition border ${
                  goal.status === s
                    ? "border-transparent"
                    : theme
                      ? "border-gray-200 opacity-50 hover:opacity-100"
                      : "border-gray-700 opacity-50 hover:opacity-100"
                }`}
                style={
                  goal.status === s
                    ? { background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color }
                    : {}
                }
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Timestamps */}
          <div className="text-[10px] opacity-30">
            Created: {goal.createdAt}
            {goal.finishedAt && ` · Done: ${goal.finishedAt}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Goals() {
  const { user: auth, setAuth } = useAuth();
  const { theme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<IGoal | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<IGoal["status"] | "all">(
    "all",
  );
  const [filterPriority, setFilterPriority] = useState<
    IGoal["priority"] | "all"
  >("all");
  const [saving, setSaving] = useState(false);
  const [goalAlert, setGoalAlert] = useState<IGoal | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const goals: IGoal[] = useMemo(
    () => (Array.isArray(auth?.goals) ? auth.goals : []),
    [auth?.goals],
  );

  // ── Goal reminder checker ─────────────────────────────────
  useEffect(() => {
    if (!goals.length) return;

    const checkGoalReminders = () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      for (const goal of goals) {
        if (!goal.reminderAt) continue;
        if (goal.status === "done" || goal.status === "archived") continue;
        const reminder = String(goal.reminderAt).trim().split("T")[0];
        if (reminder !== today) continue;
        setGoalAlert(goal);
        if (!audioRef.current) {
          audioRef.current = new Audio("/ringtone.mp3");
          audioRef.current.loop = true;
        }
        audioRef.current.play().catch(() => {});
        break;
      }
    };

    checkGoalReminders();
    const interval = setInterval(checkGoalReminders, 60000);

    return () => {
      clearInterval(interval);
      // Stop and destroy audio on unmount so it doesn't stack on re-entry
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setGoalAlert(null);
    };
  }, [goals]);

  const dismissGoalAlert = () => {
    setGoalAlert(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const persist = async (updated: IGoal[]) => {
    if (!auth?.email) return;
    setAuth({ ...auth, goals: updated });
    setSaving(true);
    try {
      await updateGoals(auth.email, updated);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (form: Omit<IGoal, "id" | "createdAt">) => {
    if (editingGoal) {
      const updated = goals.map((g) =>
        g.id === editingGoal.id
          ? {
              ...editingGoal,
              ...form,
              finishedAt:
                form.status === "done" && editingGoal.status !== "done"
                  ? new Date().toISOString().split("T")[0]
                  : form.status !== "done"
                    ? ""
                    : editingGoal.finishedAt,
            }
          : g,
      );
      persist(updated);
    } else {
      const newGoal: IGoal = {
        ...form,
        id: genId(),
        createdAt: new Date().toISOString().split("T")[0],
      };
      persist([newGoal, ...goals]);
    }
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const handleDelete = (id: string) => {
    persist(goals.filter((g) => g.id !== id));
  };

  const handleStatusChange = (id: string, status: IGoal["status"]) => {
    persist(
      goals.map((g) =>
        g.id === id
          ? {
              ...g,
              status,
              finishedAt:
                status === "done" ? new Date().toISOString().split("T")[0] : "",
            }
          : g,
      ),
    );
  };

  const handleSubtaskToggle = (goalId: string, subId: string) => {
    persist(
      goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              subtasks: g.subtasks.map((s) =>
                s.id === subId ? { ...s, isDone: !s.isDone } : s,
              ),
            }
          : g,
      ),
    );
  };

  // ── Filtered + sorted goals ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...goals];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)) ||
          g.category.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all")
      list = list.filter((g) => g.status === filterStatus);
    if (filterPriority !== "all")
      list = list.filter((g) => g.priority === filterPriority);

    // Sort: pinned first, then overdue, then by priority weight, then createdAt desc
    const pw: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    const statusOrder: Record<string, number> = {
      "in-progress": 1,
      todo: 2,
      done: 3,
      archived: 4,
    };

    list.sort((a, b) => {
      // 1. Pinned always first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      // 2. Status: in-progress → todo → done → archived
      if (statusOrder[a.status] !== statusOrder[b.status])
        return statusOrder[a.status] - statusOrder[b.status];

      // 3. Due date: earlier first, no date goes last
      if (a.dueDate || b.dueDate) {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }

      // 4. Priority: critical → high → medium → low
      if (pw[b.priority] !== pw[a.priority])
        return pw[b.priority] - pw[a.priority];

      // 5. Tiebreaker: newest first
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [goals, search, filterStatus, filterPriority]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: goals.length,
      done: goals.filter((g) => g.status === "done").length,
      inProgress: goals.filter((g) => g.status === "in-progress").length,
      overdue: goals.filter(isOverdue).length,
      pinned: goals.filter((g) => g.pinned).length,
    }),
    [goals],
  );

  if (!auth) return null;

  return (
    <div
      className={`flex h-screen overflow-hidden pt-14 lg:pt-16 font-sans ${
        theme ? "bg-gray-100 text-gray-900" : "bg-black text-gray-100"
      }`}
    >
      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r overflow-hidden transition-all duration-300 ${
          theme ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
        } ${sidebarOpen ? "w-[70%] sm:w-2/5 lg:w-1/5" : "w-[20%] sm:w-[5%]"}`}
      >
        {/* ── Header (always visible) ── */}
        <div className={`flex-shrink-0 border-b ${theme ? "border-gray-100" : "border-gray-800"}`}>
          {sidebarOpen ? (
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      theme ? "bg-indigo-50" : "bg-indigo-900/30"
                    }`}
                  >
                    <Target size={16} className="text-indigo-500" />
                  </div>
                  <h1
                    className={`text-base font-bold ${
                      theme ? "text-gray-900" : "text-gray-100"
                    }`}
                  >
                    Goals
                  </h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse sidebar"
                  className={`p-1.5 rounded-lg transition ${
                    theme
                      ? "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      : "text-gray-600 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>
              <p className={`text-xs pl-10 ${theme ? "text-gray-500" : "text-gray-500"}`}>
                {stats.done}/{stats.total} completed
                {stats.overdue > 0 && (
                  <span className="text-red-500 ml-1.5">
                    · {stats.overdue} overdue
                  </span>
                )}
                {saving && (
                  <span className="ml-1 opacity-40">· saving…</span>
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-2 overflow-y-auto">
              {/* Toggle open */}
              <button
                onClick={() => setSidebarOpen(true)}
                title="Expand sidebar"
                className={`p-1.5 rounded-lg transition ${
                  theme
                    ? "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    : "text-gray-600 hover:bg-gray-800 hover:text-gray-300"
                }`}
              >
                <PanelLeftOpen size={15} />
              </button>

              <div className={`w-full border-t my-1 ${theme ? "border-gray-100" : "border-gray-800"}`} />

              {/* All — blue button */}
              <button
                onClick={() => { setFilterStatus("all"); setFilterPriority("all"); }}
                title="All"
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm transition ${
                  filterStatus === "all" && filterPriority === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                All
              </button>

              <div className={`w-full border-t my-1 ${theme ? "border-gray-100" : "border-gray-800"}`} />

              {/* Status circles */}
              {(Object.entries(STATUS_CONFIG) as [IGoal["status"], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setFilterStatus(key); setFilterPriority("all"); }}
                  title={cfg.label}
                  className="flex items-center justify-center w-5 h-5 rounded-full transition hover:scale-110"
                  style={{
                    background: filterStatus === key ? cfg.color : "transparent",
                    border: `2px solid ${cfg.color}`,
                  }}
                />
              ))}

              <div className={`w-full border-t my-1 ${theme ? "border-gray-100" : "border-gray-800"}`} />

              {/* Priority icons */}
              {(PRIORITY_OPTIONS.map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                const PIcon = cfg.icon;
                const isActive = filterPriority === p;
                return (
                  <button
                    key={p}
                    onClick={() => { setFilterPriority(p); setFilterStatus("all"); }}
                    title={cfg.label}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition hover:scale-110"
                    style={{
                      color: cfg.color,
                      background: isActive ? cfg.bg : "transparent",
                    }}
                  >
                    <PIcon size={14} />
                  </button>
                );
              }))}
            </div>
          )}
        </div>

        {/* ── Scrollable content (open only) ── */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* ── New Goal button ── */}
            <div className="px-4 pt-4 pb-3">
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setIsFormOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold transition shadow-sm hover:shadow-md"
              >
                <Plus size={15} /> New Goal
              </button>
            </div>

            {/* ── Stats ── */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Total", value: stats.total, color: "#6366f1", Icon: Target },
                { label: "In Progress", value: stats.inProgress, color: "#3b82f6", Icon: RefreshCw },
                { label: "Done", value: stats.done, color: "#10b981", Icon: CheckCircle2 },
                { label: "Overdue", value: stats.overdue, color: "#ef4444", Icon: AlertTriangle },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-xl p-3 border ${
                    theme ? "bg-gray-50 border-gray-200" : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <s.Icon size={12} style={{ color: s.color }} className="mb-1.5" />
                  <div
                    className="text-xl font-black leading-none"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div
                    className={`text-[10px] font-medium mt-1 ${
                      theme ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Search ── */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
                />
                <input
                  placeholder="Search goals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition ${
                    theme
                      ? "bg-gray-50 border-gray-200 focus:border-indigo-400 text-gray-900 placeholder-gray-400"
                      : "bg-gray-900 border-gray-700 focus:border-indigo-500 text-gray-100 placeholder-gray-600"
                  }`}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="px-3 pb-6">
              {/* All */}
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterPriority("all");
                }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition mb-1 ${
                  filterStatus === "all" && filterPriority === "all"
                    ? "bg-indigo-600 text-white"
                    : theme
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-400 hover:bg-gray-900"
                }`}
              >
                All
              </button>

              {/* Status */}
              <p
                className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-3 pb-1.5 ${
                  theme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Status
              </p>
              {STATUS_OPTIONS.map((status) => {
                const isActive = filterStatus === status;
                const cfg = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setFilterPriority("all");
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition mb-0.5 ${
                      isActive
                        ? "text-white"
                        : theme
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-400 hover:bg-gray-900"
                    }`}
                    style={isActive ? { background: cfg.color } : {}}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isActive ? "white" : cfg.color }}
                    />
                    {cfg.label}
                  </button>
                );
              })}

              {/* Priority */}
              <p
                className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-3 pb-1.5 ${
                  theme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Priority
              </p>
              {PRIORITY_OPTIONS.map((priority) => {
                const isActive = filterPriority === priority;
                const cfg = PRIORITY_CONFIG[priority];
                const PIcon = cfg.icon;
                return (
                  <button
                    key={priority}
                    onClick={() => {
                      setFilterPriority(priority);
                      setFilterStatus("all");
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition mb-0.5 ${
                      isActive
                        ? "text-white"
                        : theme
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-400 hover:bg-gray-900"
                    }`}
                    style={isActive ? { background: cfg.color } : {}}
                  >
                    <PIcon
                      size={11}
                      style={{ color: isActive ? "white" : cfg.color }}
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ── Kanban Board ─────────────────────────────────────────────────── */}
      <div className={`flex flex-col transition-all duration-300 overflow-hidden overflow-x-hidden ${sidebarOpen ? "w-[30%] sm:w-3/5 lg:w-4/5" : "w-[80%] sm:w-[95%]"}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className={`flex flex-col ${sidebarOpen ? "sm:flex-col" : "sm:flex-row sm:flex-wrap"} lg:flex-row lg:flex-nowrap gap-4 p-5 items-start`}>

          {/* To Do, In Progress, Done columns */}
          {(["todo", "in-progress", "done"] as const).map((statusKey) => {
            const colGoals = filtered.filter((g) => g.status === statusKey);
            const cfg = STATUS_CONFIG[statusKey];
            return (
              <div key={statusKey} className={`w-full ${!sidebarOpen ? "sm:w-[calc(50%-8px)]" : ""} lg:flex-1 lg:w-auto min-w-0 flex flex-col`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <span
                      className={`text-sm font-bold ${sidebarOpen ? "hidden sm:inline" : ""} ${
                        theme ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sidebarOpen ? "hidden sm:inline" : ""}`}
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {colGoals.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGoal(null);
                      setIsFormOpen(true);
                    }}
                    title="Add goal"
                    className={`p-1 rounded-lg transition opacity-50 hover:opacity-100 ${
                      theme
                        ? "hover:bg-gray-200 text-gray-500"
                        : "hover:bg-gray-800 text-gray-500"
                    }`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                  {colGoals.length === 0 ? (
                    <div
                      className={`rounded-2xl border border-dashed p-8 text-center ${
                        theme
                          ? "border-gray-300 bg-white/60"
                          : "border-gray-800 bg-gray-900/30"
                      }`}
                    >
                      <p
                        className={`text-xs ${
                          theme ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        No goals
                      </p>
                    </div>
                  ) : (
                    colGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        theme={theme}
                        compact={sidebarOpen}
                        onEdit={() => {
                          setEditingGoal(goal);
                          setIsFormOpen(false);
                        }}
                        onDelete={() => handleDelete(goal.id)}
                        onTogglePin={() =>
                          persist(
                            goals.map((g) =>
                              g.id === goal.id
                                ? { ...g, pinned: !g.pinned }
                                : g,
                            ),
                          )
                        }
                        onStatusChange={(status) =>
                          handleStatusChange(goal.id, status)
                        }
                        onSubtaskToggle={(subId) =>
                          handleSubtaskToggle(goal.id, subId)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Archived column — shown only when there are archived goals */}
          {filtered.some((g) => g.status === "archived") && (
            <div className={`w-full ${!sidebarOpen ? "sm:w-[calc(50%-8px)]" : ""} lg:flex-1 lg:w-auto min-w-0 flex flex-col opacity-70`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 flex-shrink-0" />
                <span
                  className={`text-sm font-bold ${sidebarOpen ? "hidden sm:inline" : ""} ${
                    theme ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Archived
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-purple-400 bg-purple-400/10 ${sidebarOpen ? "hidden sm:inline" : ""}`}>
                  {filtered.filter((g) => g.status === "archived").length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {filtered
                  .filter((g) => g.status === "archived")
                  .map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      theme={theme}
                      compact={sidebarOpen}
                      onEdit={() => {
                        setEditingGoal(goal);
                        setIsFormOpen(false);
                      }}
                      onDelete={() => handleDelete(goal.id)}
                      onTogglePin={() =>
                        persist(
                          goals.map((g) =>
                            g.id === goal.id
                              ? { ...g, pinned: !g.pinned }
                              : g,
                          ),
                        )
                      }
                      onStatusChange={(status) =>
                        handleStatusChange(goal.id, status)
                      }
                      onSubtaskToggle={(subId) =>
                        handleSubtaskToggle(goal.id, subId)
                      }
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Form Modal ───────────────────────────────────────────────────── */}
      {(isFormOpen || editingGoal) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsFormOpen(false);
              setEditingGoal(null);
            }}
          />
          <div
            className={`relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] ${
              theme ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
            }`}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
                theme ? "border-gray-100" : "border-gray-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    theme ? "bg-indigo-50" : "bg-indigo-900/30"
                  }`}
                >
                  <Target size={14} className="text-indigo-500" />
                </div>
                <h2
                  className={`text-sm font-bold ${
                    theme ? "text-gray-900" : "text-gray-100"
                  }`}
                >
                  {editingGoal ? "Edit Goal" : "New Goal"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingGoal(null);
                }}
                className={`p-1.5 rounded-lg transition ${
                  theme
                    ? "text-gray-400 hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-800"
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <GoalForm
                initial={editingGoal ?? {}}
                onSave={handleSave}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingGoal(null);
                }}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Goal reminder popup ───────────────────────────── */}
      {goalAlert && (
        <div className="fixed z-50 bottom-5 right-5 w-[90vw] sm:w-[340px]">
          <div
            className={`relative rounded-2xl shadow-2xl border px-5 py-4 ${
              theme
                ? "bg-white border-orange-400 text-gray-900"
                : "bg-gray-900 border-orange-500 text-gray-100"
            }`}
          >
            <button
              onClick={dismissGoalAlert}
              className="absolute top-2.5 right-3 text-lg font-bold opacity-50 hover:opacity-100 transition"
            >
              ×
            </button>
            <div className="text-2xl mb-2">🎯</div>
            <p
              className={`text-xs font-medium mb-1 ${theme ? "text-gray-500" : "text-gray-400"}`}
            >
              Goal Reminder
            </p>
            <p className="text-sm font-semibold leading-snug">
              Today is the reminder date for
            </p>
            <p
              className={`text-base font-bold mt-0.5 ${theme ? "text-orange-600" : "text-orange-400"}`}
            >
              {goalAlert.name}
            </p>
            {goalAlert.dueDate && (
              <p className={`text-xs mt-1 opacity-60`}>
                Due: {goalAlert.dueDate}
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  persist(
                    goals.map((g) =>
                      g.id === goalAlert.id ? { ...g, reminderAt: "" } : g,
                    ),
                  );
                  dismissGoalAlert();
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Clear Reminder
              </button>
              <button
                onClick={dismissGoalAlert}
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
    </div>
  );
}
