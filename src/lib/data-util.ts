// src/lib/data-util.ts
import { IRoutine, IRoutineItem } from "@/store/features/auth/authSlice";

// Raw interfaces for data from database
interface RawRoutineItem {
  name?: unknown;
  time?: unknown;
  category?: unknown;
}

interface RawRoutine {
  saturday?: RawRoutineItem[];
  sunday?: RawRoutineItem[];
  monday?: RawRoutineItem[];
  tuesday?: RawRoutineItem[];
  wednesday?: RawRoutineItem[];
  thursday?: RawRoutineItem[];
  friday?: RawRoutineItem[];
}

interface RawSubtask {
  id?: unknown;
  name?: unknown;
  isDone?: unknown;
}

interface RawGoal {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  priority?: unknown;
  status?: unknown;
  category?: unknown;
  dueDate?: unknown;
  time?: unknown;
  reminderAt?: unknown;
  repeat?: unknown;
  tags?: unknown;
  subtasks?: RawSubtask[];
  createdAt?: unknown;
  finishedAt?: unknown;
  pinned?: unknown;
  color?: unknown;
}

interface RawUser {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  email?: unknown;
  photo?: unknown;
  isRegisteredWithGoogle?: unknown;
  isAdmin?: unknown;
  createdAt?: unknown;
  expiredAt?: unknown;
  paymentType?: unknown;
  paddleSubscriptionId?: unknown;
  subscriptionCanceledAt?: unknown;
  routine?: RawRoutine;
  thisMonthPremiumResponses?: unknown;
  stats?: unknown;
  goals?: RawGoal[];
}

export const cleanUserForClient = (user: RawUser) => {
  if (!user) return null;
  // Set expiredAt to 30 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 30);

  // Helper to clean routine items

  // Helper to clean routine items — NOW includes category
  const cleanRoutine = (routine: RawRoutine): IRoutine => {
    if (!routine) {
      return {
        saturday: [],
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      };
    }

    const mapItem = (item: RawRoutineItem): IRoutineItem => ({
      name: String(item.name ?? ""),
      time: String(item.time ?? ""),
      category: String(item.category ?? ""),
    });

    return {
      saturday: (routine.saturday || []).map(mapItem),
      sunday: (routine.sunday || []).map(mapItem),
      monday: (routine.monday || []).map(mapItem),
      tuesday: (routine.tuesday || []).map(mapItem),
      wednesday: (routine.wednesday || []).map(mapItem),
      thursday: (routine.thursday || []).map(mapItem),
      friday: (routine.friday || []).map(mapItem),
    };
  };

  return {
    id: user._id?.toString() || user.id,
    name: user.name || "User",
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle ?? false,
    isAdmin: user.isAdmin || false,
    createdAt:
      user.createdAt &&
      typeof user.createdAt === "string" &&
      user.createdAt !== ""
        ? new Date(user.createdAt as string).toISOString()
        : new Date().toISOString(),
    expiredAt:
      (user.expiredAt && typeof user.expiredAt === "string"
        ? new Date(user.expiredAt).toISOString()
        : null) || expiredAt.toISOString(),
    paymentType: user.paymentType || "Free One Month",
    paddleSubscriptionId: user.paddleSubscriptionId ? String(user.paddleSubscriptionId) : undefined,
    subscriptionCanceledAt:
      user.subscriptionCanceledAt &&
      (typeof user.subscriptionCanceledAt === "string" ||
        user.subscriptionCanceledAt instanceof Date)
        ? new Date(user.subscriptionCanceledAt as string | Date).toISOString()
        : null,
    routine: cleanRoutine(user.routine || {}),
    thisMonthPremiumResponses: user.thisMonthPremiumResponses || "",
    stats: Array.isArray(user.stats) ? user.stats : [],

    goals: Array.isArray(user.goals)
      ? user.goals.map((g: RawGoal) => ({
          id: String(g.id ?? ""),
          name: String(g.name ?? ""),
          description: String(g.description ?? ""),
          priority: String(g.priority ?? "medium"),
          status: String(g.status ?? "todo"),
          category: String(g.category ?? ""),
          dueDate: String(g.dueDate ?? ""),
          time: String(g.time ?? ""),
          reminderAt: String(g.reminderAt ?? ""),
          repeat: String(g.repeat ?? "none"),
          tags: Array.isArray(g.tags)
            ? g.tags.map((t: unknown) => String(t))
            : [],
          subtasks: Array.isArray(g.subtasks)
            ? g.subtasks.map((s: RawSubtask) => ({
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
      : [],
  };
};

interface RawGoogleUser {
  name?: unknown;
  email?: unknown;
  picture?: unknown;
  image?: unknown;
}

export const cleanGoogleUserForClient = (googleUser: RawGoogleUser | null) => {
  if (!googleUser) return null;

  return {
    name: googleUser.name || "Google User",
    email: googleUser.email,
    image: googleUser.picture || googleUser.image || "",
  };
};
