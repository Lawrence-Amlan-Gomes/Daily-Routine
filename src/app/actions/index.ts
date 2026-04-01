// src/app/actions/index.ts
"use server";

import { signOut } from "@/app/auth";
import { cleanUserForClient } from "@/lib/data-util";
import { CleanUser, IRoutine } from "@/store/features/auth/authSlice";
import { dbConnect } from "@/lib/mongo";
import { sendWelcomeEmail } from "@/lib/server/email";
import { generateToken, verifyToken } from "@/lib/server/jwt";
import { User } from "@/models/User";
import { Feedback } from "@/models/Feedback";
import bcrypt from "bcrypt";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

type LeanUser = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any;
  name: string;
  email: string;
  password?: string;
  photo?: string;
  isRegisteredWithGoogle?: boolean;
  isAdmin?: boolean;
  createdAt?: Date;
  expiredAt?: Date;
  paymentType?: string;
  routine?: {
    saturday: { name: string; time: string; category?: string }[];
    sunday: { name: string; time: string; category?: string }[];
    monday: { name: string; time: string; category?: string }[];
    tuesday: { name: string; time: string; category?: string }[];
    wednesday: { name: string; time: string; category?: string }[];
    thursday: { name: string; time: string; category?: string }[];
    friday: { name: string; time: string; category?: string }[];
  };
  todayPremiumResponses?: string;
  __v?: number;
};

// ==================== AUTH ACTIONS ====================

export async function performLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await dbConnect();

  const user = await User.findOne({ email }).select("+password");
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password!);
  if (!match) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const cleanUser: CleanUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType || "Free One Week",
    routine: user.routine
      ? {
          saturday: user.routine.saturday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          sunday: user.routine.sunday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          monday: user.routine.monday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          tuesday: user.routine.tuesday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          wednesday: user.routine.wednesday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          thursday: user.routine.thursday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          friday: user.routine.friday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
        }
      : {
          saturday: [],
          sunday: [],
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
    todayPremiumResponses: user.todayPremiumResponses || "",
    stats: Array.isArray(user.stats) ? user.stats : [],
    goals: Array.isArray(user.goals) ? user.goals : [],
  };

  const token = await generateToken(cleanUser);

  return { user: cleanUser, token };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  photo?: string;
  isRegisteredWithGoogle?: boolean;
}) {
  await dbConnect();

  const { email } = data;

  const existingUser = await User.findOne({ email }).lean<LeanUser>();
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashed = await bcrypt.hash(data.password, 12);
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Check if it's Google registration (no password means Google)

  const user = new User({
    ...data,
    expiredAt,
    password: hashed,
    isRegisteredWithGoogle: data.isRegisteredWithGoogle ?? false,
    // routine will use schema default, but explicitly setting is safer
    routine: {
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    },
  });

  await user.save();

  // Send welcome email for both manual and Google registrations
  await sendWelcomeEmail(email, data.name);

  return cleanUserForClient(user.toObject());
}


export async function changePhoto(email: string, photo: string) {
  await dbConnect();
  await User.updateOne({ email }, { photo });
  revalidatePath("/profile");
}

export async function updatePaymentType(
  email: string,
  paymentType: string,
  expiredAt: Date,
) {
  await dbConnect();
  await User.updateOne({ email }, { paymentType, expiredAt });
  revalidatePath("/");
}

export async function incrementTodayPremiumCount(
  email: string,
  todayPremiumResponses: string,
) {
  await dbConnect();
  await User.updateOne({ email }, { todayPremiumResponses });
  revalidatePath("/");
}


export async function resetPassword(email: string, newPassword: string) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });
}

export async function updateUser(
  email: string,
  updates: {
    name?: string;
  },
) {
  await dbConnect();
  await User.updateOne({ email }, { $set: updates });
  revalidatePath("/");
}

export async function findUserByEmail(email: string) {
  await dbConnect();

  const user = await User.findOne({ email }).lean<LeanUser>();
  if (!user) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType,
    todayPremiumResponses: user.todayPremiumResponses || "",
    stats: Array.isArray((user as {stats?: unknown[]}).stats) ? (user as {stats: {date:string;day:string;totalTasks:number;completedTasks:string[]}[]}).stats : [],
    goals: Array.isArray((user as {goals?: unknown[]}).goals)
  ? (user as {goals: {id:string;name:string;description:string;priority:string;status:string;category:string;dueDate:string;time:string;reminderAt:string;repeat:string;tags:string[];subtasks:{id:string;name:string;isDone:boolean}[];createdAt:string;finishedAt:string;pinned:boolean;color:string}[]}).goals.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      priority: g.priority,
      status: g.status,
      category: g.category,
      dueDate: g.dueDate,
      time: g.time ?? "",
      reminderAt: g.reminderAt,
      repeat: g.repeat,
      tags: [...(g.tags || [])],
      subtasks: (g.subtasks || []).map((s) => ({
        id: s.id,
        name: s.name,
        isDone: s.isDone,
      })),
      createdAt: g.createdAt,
      finishedAt: g.finishedAt,
      pinned: g.pinned,
      color: g.color,
    }))
  : [],
    routine: user.routine
      ? {
          saturday: user.routine.saturday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          sunday: user.routine.sunday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          monday: user.routine.monday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          tuesday: user.routine.tuesday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          wednesday: user.routine.wednesday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          thursday: user.routine.thursday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
          friday: user.routine.friday.map(
            (item: { name: string; time: string; category?: string }) => ({
              name: item.name,
              time: item.time,
              category: item.category || "",
            }),
          ),
        }
      : {
          saturday: [],
          sunday: [],
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
  };
}

export async function verifyAndChangePassword(
  email: string,
  oldPassword: string,
  newPassword: string,
) {
  await dbConnect();

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("USER_NOT_FOUND");

  const match = await bcrypt.compare(oldPassword, user.password!);
  if (!match) throw new Error("INCORRECT_OLD_PASSWORD");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });

  revalidatePath("/profile");
}

export async function updateRoutine(email: string, routine: IRoutine) {
  await dbConnect();
  await User.updateOne({ email }, { routine });
  revalidatePath("/dashBoard");
}

export async function updateStats(
  email: string,
  stats: { date: string; day: string; totalTasks: number; completedTasks: string[] }[],
) {
  await dbConnect();
  await User.updateOne({ email }, { stats });
  revalidatePath("/dashBoard");
}

export async function updateGoals(
  email: string,
  goals: {
    id: string;
    name: string;
    description: string;
    priority: string;
    status: string;
    category: string;
    dueDate: string;
    time: string;
    reminderAt: string;
    repeat: string;
    tags: string[];
    subtasks: { id: string; name: string; isDone: boolean }[];
    createdAt: string;
    finishedAt: string;
    pinned: boolean;
    color: string;
  }[],
) {
  await dbConnect();
  await User.updateOne({ email }, { goals });
  revalidatePath("/goals");
}

// ==================== GOOGLE + JWT ====================

export async function generateJwtForGoogle(user: CleanUser): Promise<string> {
  "use server";
  return await generateToken(user);
}

export async function verifyJwtToken(token: string): Promise<CleanUser | null> {
  "use server";
  return await verifyToken(token);
}

// ==================== LOGOUT ====================

export async function logoutUser() {
  "use server";
  await signOut({ redirect: false });
  redirect("/login");
}

// ==================== FEEDBACK ACTIONS ====================

// ─── Feedback Actions ───────────────────────────────────────────────────────

/**
 * Submit or update feedback for the authenticated user.
 * Email is passed from client (useAuth().user.email)
 */
export async function submitFeedback({
  email,
  rating,
  comment = "",
}: {
  email: string;
  rating: number;
  comment?: string;
}) {
  await dbConnect();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new Error("Invalid or missing email");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  const trimmedComment = comment.trim();

  let feedback = await Feedback.findOne({ email });

  if (feedback) {
    const oneHourMs = 60 * 60 * 1000;
    const lastUpdated = new Date(feedback.updatedAt).getTime();
    const now = Date.now();
    const elapsed = now - lastUpdated;

    if (elapsed < oneHourMs) {
      const remainingMs = oneHourMs - elapsed;
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
      throw new Error(`COOLDOWN:${remainingMinutes}`);
    }

    feedback.rating = rating;
    feedback.comment = trimmedComment;
    await feedback.save();
    revalidatePath("/feedback");
    return { success: true, message: "Feedback updated successfully" };
  }

  // Create new
  const userDoc = await User.findOne({ email }).select("_id");
  feedback = new Feedback({
    email,
    user: userDoc?._id,
    rating,
    comment: trimmedComment,
  });

  await feedback.save();
  revalidatePath("/feedback");

  return { success: true, message: "Thank you for your feedback!" };
}

/**
 * Get the current user's existing feedback (if any)
 */
export async function getMyFeedback(email: string) {
  noStore();
  await dbConnect();

  if (!email || typeof email !== "string") return null;

  const feedback = await Feedback.findOne({ email })
    .lean()
    .select("rating comment createdAt updatedAt");

  if (!feedback) return null;

  return {
    rating: feedback.rating,
    comment: feedback.comment || "",
    createdAt: feedback.createdAt?.toISOString() ?? null,
    updatedAt: feedback.updatedAt?.toISOString() ?? null,
  };
}

/**
 * Admin only: Get all feedback entries
 */
export async function getAllFeedbacks(adminEmail: string) {
  await dbConnect();

  if (!adminEmail) return [];

  const admin = await User.findOne({ email: adminEmail }).select("isAdmin");
  if (!admin?.isAdmin) return [];

  const feedbacks = await Feedback.find()
    .sort({ updatedAt: -1 })
    .populate("user", "name email")
    .lean(); // ← .lean() is very helpful here

  // Explicitly convert to plain objects + stringify dates
  return feedbacks.map((doc) => ({
    _id: doc._id.toString(),                    // convert ObjectId → string
    email: doc.email,
    rating: doc.rating,
    comment: doc.comment || "",
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
    user: doc.user
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (doc.user as any)?.name || "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email: (doc.user as any)?.email || "",
        }
      : null,
  }));
}

// ==================== AI ROUTINE ACTIONS ====================

export type AIRoutineItem = {
  name: string;
  time: string;
  category?: string;
};

export type AIRoutineData = {
  saturday: AIRoutineItem[];
  sunday: AIRoutineItem[];
  monday: AIRoutineItem[];
  tuesday: AIRoutineItem[];
  wednesday: AIRoutineItem[];
  thursday: AIRoutineItem[];
  friday: AIRoutineItem[];
};

export type ChatMessage = {
  role: "user" | "ai";
  text: string;
  timestamp: string;
};

export type ChatSession = {
  date: string; // "YYYY-MM-DD"
  messages: ChatMessage[];
};

type AIRoutineDoc = {
  aiRoutine?: AIRoutineData;
  chatHistory?: ChatSession[];
};

export async function getAIRoutineDoc(email: string): Promise<{ aiRoutine: AIRoutineData; chatHistory: ChatSession[] }> {
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  const doc = await AIRoutine.findOne({ email }).lean() as AIRoutineDoc | null;
  return {
    aiRoutine: doc?.aiRoutine ?? {
      saturday: [], sunday: [], monday: [], tuesday: [],
      wednesday: [], thursday: [], friday: [],
    },
    chatHistory: doc?.chatHistory ?? [],
  };
}

export async function upsertAIRoutine(
  email: string,
  aiRoutine: AIRoutineData,
): Promise<void> {
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  await AIRoutine.findOneAndUpdate(
    { email },
    { $set: { aiRoutine } },
    { upsert: true, new: true },
  );
  revalidatePath("/ai-routine");
}

export async function appendChatMessage(
  email: string,
  date: string,
  message: ChatMessage,
): Promise<void> {
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  // Try to push into existing session for that date
  const result = await AIRoutine.findOneAndUpdate(
    { email, "chatHistory.date": date },
    { $push: { "chatHistory.$.messages": message } },
    { new: true },
  );
  // If no session exists for that date yet, create one
  if (!result) {
    await AIRoutine.findOneAndUpdate(
      { email },
      { $push: { chatHistory: { date, messages: [message] } } },
      { upsert: true, new: true },
    );
  }
}

export async function clearChatSession(
  email: string,
  date: string,
): Promise<void> {
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  await AIRoutine.findOneAndUpdate(
    { email },
    { $pull: { chatHistory: { date } } },
  );
}