// src/lib/server/jwt.ts
import {
  CleanUser,
  IGoal,
  IRoutine,
  IRoutineItem,
  IStatEntry,
  ISubtask,
} from "@/store/features/auth/authSlice";
import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Helper to create a plain default routine
const defaultRoutine: IRoutine = {
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

// Helper to deeply clean routine items (removes any Mongoose-specific properties)

// Helper to deeply clean routine items (removes Mongoose junk, keeps category)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanRoutine = (routine: any): IRoutine => {
  if (!routine) return defaultRoutine;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeItem = (item: any): IRoutineItem => ({
    name: String(item?.name || ""),
    time: String(item?.time || ""),
    category: String(item?.category || ""), // ← this line was missing
  });

  return {
    saturday: Array.isArray(routine.saturday)
      ? routine.saturday.map(safeItem)
      : [],
    sunday: Array.isArray(routine.sunday) ? routine.sunday.map(safeItem) : [],
    monday: Array.isArray(routine.monday) ? routine.monday.map(safeItem) : [],
    tuesday: Array.isArray(routine.tuesday)
      ? routine.tuesday.map(safeItem)
      : [],
    wednesday: Array.isArray(routine.wednesday)
      ? routine.wednesday.map(safeItem)
      : [],
    thursday: Array.isArray(routine.thursday)
      ? routine.thursday.map(safeItem)
      : [],
    friday: Array.isArray(routine.friday) ? routine.friday.map(safeItem) : [],
  };
};

export async function generateToken(user: CleanUser): Promise<string> {
  const plainRoutine = cleanRoutine(user.routine);

  // Deep-sanitize stats — strip any Mongoose document internals
  const plainStats = Array.isArray(user.stats)
    ? user.stats.map((s: IStatEntry) => ({
        date: String(s.date ?? ""),
        day: String(s.day ?? ""),
        totalTasks: Number(s.totalTasks ?? 0),
        completedTasks: Array.isArray(s.completedTasks)
          ? s.completedTasks.map((t: unknown) => String(t))
          : [],
      }))
    : [];

  // Deep-sanitize goals — strip any Mongoose document internals

  const plainGoals = Array.isArray(user.goals)
    ? user.goals.map((g: IGoal) => ({
        id: String(g.id ?? ""),
        name: String(g.name ?? ""),
        description: String(g.description ?? ""),
        priority: String(g.priority ?? ""),
        status: String(g.status ?? ""),
        category: String(g.category ?? ""),
        dueDate: String(g.dueDate ?? ""),
        time: String(g.time ?? ""),
        reminderAt: String(g.reminderAt ?? ""),
        repeat: String(g.repeat ?? ""),
        tags: Array.isArray(g.tags)
          ? g.tags.map((t: unknown) => String(t))
          : [],
        subtasks: Array.isArray(g.subtasks)
          ? g.subtasks.map((s: ISubtask) => ({
              id: String(s.id ?? ""),
              name: String(s.name ?? ""),
              isDone: Boolean(s.isDone ?? false),
            }))
          : [],
        createdAt: String(g.createdAt ?? ""),
        finishedAt: String(g.finishedAt ?? ""),
        pinned: Boolean(g.pinned ?? false),
        color: String(g.color ?? ""),
      }))
    : [];

  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    isRegisteredWithGoogle: user.isRegisteredWithGoogle ?? false,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    expiredAt: user.expiredAt,
    paymentType: user.paymentType ?? "Free One Week",
    routine: plainRoutine,
    thisMonthPremiumResponses: user.thisMonthPremiumResponses ?? "",
    stats: plainStats,
    goals: plainGoals,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<CleanUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CleanUser;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
