// src/app/actions/index.ts
"use server";

import { auth as getNextAuthSession, signOut } from "@/auth";
import { cleanUserForClient } from "@/lib/data-util";
import { dbConnect } from "@/lib/mongo";
import { deleteFromS3, uploadToS3 } from "@/lib/photoService";
import { sendOtpEmail, sendWelcomeEmail } from "@/lib/server/email";
import { generateToken, verifyToken } from "@/lib/server/jwt";
import { Feedback } from "@/models/Feedback";
import { OtpCode } from "@/models/OtpCode";
import { User } from "@/models/User";
import { CleanUser, IRoutine } from "@/store/features/auth/authSlice";
import bcrypt from "bcrypt";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

type LeanFeedback = {
  _id: { toString: () => string };
  email: string;
  userName?: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
  user?: {
    name?: string;
    email?: string;
  } | null;
};

type ActionActor = {
  email: string;
  isAdmin: boolean;
};

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getActionActor(): Promise<ActionActor> {
  const session = await getNextAuthSession();
  const sessionEmail = session?.user?.email?.toLowerCase().trim();

  if (sessionEmail) {
    await dbConnect();
    const dbUser = await User.findOne({ email: sessionEmail }).select(
      "email isAdmin",
    );
    return {
      email: dbUser?.email ?? sessionEmail,
      isAdmin: Boolean(dbUser?.isAdmin),
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  const tokenUser = await verifyToken(token);
  if (!tokenUser?.email) throw new Error("UNAUTHORIZED");

  return {
    email: tokenUser.email.toLowerCase().trim(),
    isAdmin: Boolean(tokenUser.isAdmin),
  };
}

async function assertActorCanAccessEmail(targetEmail: string) {
  const actor = await getActionActor();
  const normalizedTarget = String(targetEmail).toLowerCase().trim();
  if (!actor.isAdmin && actor.email !== normalizedTarget) {
    throw new Error("FORBIDDEN");
  }
  return actor;
}

// ==================== AUTH ACTIONS ====================

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export async function performLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return null;

  const { email: safeEmail, password: safePassword } = parsed.data;

  await dbConnect();

  const user = await User.findOne({ email: safeEmail }).select("+password");
  if (!user) return null;
  if (!user.isEmailVerified) throw new Error("EMAIL_NOT_VERIFIED");

  const match = await bcrypt.compare(safePassword, user.password!);
  if (!match) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 30);

  const cleanUser: CleanUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle || false,
    isEmailVerified: user.isEmailVerified ?? false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType || "Free One Month",
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
    thisMonthPremiumResponses: user.thisMonthPremiumResponses || "",
    stats: Array.isArray(user.stats) ? user.stats : [],
    goals: Array.isArray(user.goals) ? user.goals : [],
  };

  const token = await generateToken(cleanUser);
  await setAuthCookie(token);

  return { user: cleanUser, token };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  photo?: string;
  isRegisteredWithGoogle?: boolean;
  isEmailVerified?: boolean;
}) {
  await dbConnect();

  const { email } = data;

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashed = await bcrypt.hash(data.password, 12);
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 30);

  // Check if it's Google registration (no password means Google)

  const user = new User({
    ...data,
    expiredAt,
    password: hashed,
    paymentType: "Free One Month",
    isRegisteredWithGoogle: data.isRegisteredWithGoogle ?? false,
    isEmailVerified:
      data.isEmailVerified ?? Boolean(data.isRegisteredWithGoogle),
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

export async function verifyUserEmail(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await dbConnect();

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.isEmailVerified) {
    return { success: true };
  }

  user.isEmailVerified = true;
  await user.save();
  return { success: true };
}

export async function changePhoto(email: string, photo: string) {
  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { photo });
  revalidatePath("/profile");
}

export async function updatePaymentType(
  email: string,
  paymentType: string,
  expiredAt: Date,
  options?: { bypassAuth?: boolean },
) {
  if (!options?.bypassAuth) {
    const actor = await getActionActor();
    const normalizedTarget = String(email).toLowerCase().trim();
    // Allow users to update their own payment type or admins to update any
    if (!actor.isAdmin && actor.email !== normalizedTarget) {
      throw new Error("FORBIDDEN");
    }
  }
  await dbConnect();
  await User.updateOne({ email }, { paymentType, expiredAt });
  revalidatePath("/");
}

export async function cancelSubscription(email: string) {
  const actor = await getActionActor();
  const normalizedTarget = String(email).toLowerCase().trim();
  if (actor.email !== normalizedTarget && !actor.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.paymentType || user.paymentType === "Expired") {
    throw new Error("No active subscription");
  }

  const paddleApiKey = process.env.PADDLE_API_KEY;
  if (!paddleApiKey) {
    throw new Error("Paddle API key not configured");
  }

  try {
    const response = await fetch("https://api.paddle.com/subscriptions", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paddleApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions from Paddle");
    }

    const data = (await response.json()) as { data?: Array<{ id: string; customer_id?: string; email?: string }> };
    const subscriptions = data.data || [];
    const userSub = subscriptions.find(
      (sub) =>
        sub.email === email ||
        (sub.customer_id && user.email === email),
    );

    if (!userSub) {
      throw new Error("Subscription not found in Paddle");
    }

    const cancelResponse = await fetch(
      `https://api.paddle.com/subscriptions/${userSub.id}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "canceled" }),
      },
    );

    if (!cancelResponse.ok) {
      throw new Error("Failed to cancel subscription in Paddle");
    }

    await User.updateOne(
      { email },
      { paymentType: "Expired", expiredAt: new Date() },
    );
    revalidatePath("/billing");

    return { success: true, message: "Subscription canceled successfully" };
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    throw error;
  }
}

export async function incrementThisMonthPremiumCount(
  email: string,
  thisMonthPremiumResponses: string,
) {
  try {
    await assertActorCanAccessEmail(email);
    await dbConnect();

    const result = await User.updateOne(
      { email },
      { thisMonthPremiumResponses },
    );

    if (result.matchedCount === 0) {
      throw new Error(`User not found with email: ${email}`);
    }

    if (result.modifiedCount === 0) {
      console.log(
        `No changes made to thisMonthPremiumResponses for ${email}. Current value may already be: ${thisMonthPremiumResponses}`,
      );
    } else {
      console.log(
        `Successfully updated thisMonthPremiumResponses for ${email} to: ${thisMonthPremiumResponses}`,
      );
    }

    revalidatePath("/");
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error(
      `Failed to update thisMonthPremiumResponses for ${email}:`,
      error,
    );
    throw error;
  }
}

export async function resetPassword(email: string, newPassword: string) {
  await dbConnect();
  const normalizedEmail = String(email).toLowerCase().trim();
  const otpRecord = await OtpCode.findOne({ email: normalizedEmail });
  if (
    !otpRecord?.verifiedUntil ||
    otpRecord.verifiedUntil.getTime() < Date.now()
  ) {
    throw new Error("RESET_NOT_VERIFIED");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error("USER_NOT_FOUND");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email: normalizedEmail }, { password: hashed });
  await OtpCode.deleteOne({ email: normalizedEmail });
}

export async function updateUser(
  email: string,
  updates: {
    name?: string;
    firstTimeLogin?: boolean;
  },
) {
  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { $set: updates });
  revalidatePath("/");
}

export async function findUserByEmail(email: string) {
  await assertActorCanAccessEmail(email);
  await dbConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (await User.findOne({ email }).lean()) as any;
  if (!user) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 30);
  const allowedPriority = ["low", "medium", "high", "critical"] as const;
  const allowedStatus = ["todo", "in-progress", "done", "archived"] as const;
  const allowedRepeat = ["none", "daily", "weekly", "monthly"] as const;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    isRegisteredWithGoogle: user.isRegisteredWithGoogle || false,
    isEmailVerified: user.isEmailVerified ?? false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType,
    thisMonthPremiumResponses: user.thisMonthPremiumResponses || "",
    stats: Array.isArray(user.stats) ? user.stats : [],
    goals: Array.isArray(user.goals)
      ? user.goals.map(
          (g: {
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
          }) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            priority: allowedPriority.includes(
              g.priority as (typeof allowedPriority)[number],
            )
              ? (g.priority as (typeof allowedPriority)[number])
              : "medium",
            status: allowedStatus.includes(
              g.status as (typeof allowedStatus)[number],
            )
              ? (g.status as (typeof allowedStatus)[number])
              : "todo",
            category: g.category,
            dueDate: g.dueDate,
            time: g.time ?? "",
            reminderAt: g.reminderAt,
            repeat: allowedRepeat.includes(
              g.repeat as (typeof allowedRepeat)[number],
            )
              ? (g.repeat as (typeof allowedRepeat)[number])
              : "none",
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
          }),
        )
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
  await assertActorCanAccessEmail(email);
  await dbConnect();

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("USER_NOT_FOUND");

  const match = await bcrypt.compare(oldPassword, user.password!);
  if (!match) throw new Error("INCORRECT_OLD_PASSWORD");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });

  revalidatePath("/profile");
}

const taskSchema = z.object({
  name: z.string().trim().min(1).max(200),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  category: z.string().max(50).optional(),
});

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const routineSchema = z.object(
  Object.fromEntries(
    weekdays.map((day) => [day, z.array(taskSchema).max(100)]),
  ),
);

export async function updateRoutine(email: string, routine: IRoutine) {
  const parsed = routineSchema.safeParse(routine);
  if (!parsed.success) return { error: "Invalid routine data" };

  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { routine: parsed.data });
  revalidatePath("/dashBoard");
}

const statsSchema = z
  .array(
    z.object({
      date: z.string().max(32),
      day: z.string().max(16),
      totalTasks: z.number().int().min(0).max(1000),
      completedTasks: z.array(z.string().max(200)).max(1000),
    }),
  )
  .max(2000);

export async function updateStats(
  email: string,
  stats: {
    date: string;
    day: string;
    totalTasks: number;
    completedTasks: string[];
  }[],
) {
  const parsed = statsSchema.safeParse(stats);
  if (!parsed.success) return { error: "Invalid stats data" };

  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { stats: parsed.data });
  revalidatePath("/dashBoard");
}

const subtaskSchema = z.object({
  id: z.string().max(64),
  name: z.string().trim().min(1).max(200),
  isDone: z.boolean(),
});

const goalSchema = z.object({
  id: z.string().max(64),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  priority: z.string().max(32),
  status: z.string().max(32),
  category: z.string().max(64),
  dueDate: z.string().max(64),
  time: z.string().max(32),
  reminderAt: z.string().max(64),
  repeat: z.string().max(32),
  tags: z.array(z.string().max(64)).max(50),
  subtasks: z.array(subtaskSchema).max(100),
  createdAt: z.string().max(64),
  finishedAt: z.string().max(64),
  pinned: z.boolean(),
  color: z.string().max(32),
});

const goalsSchema = z.array(goalSchema).max(500);

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
  const parsed = goalsSchema.safeParse(goals);
  if (!parsed.success) return { error: "Invalid goals data" };

  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { goals: parsed.data });
  revalidatePath("/goals");
}

// ==================== GOOGLE + JWT ====================

export async function generateJwtForGoogle(user: CleanUser): Promise<string> {
  "use server";
  const token = await generateToken(user);
  await setAuthCookie(token);
  return token;
}

export async function verifyJwtToken(token: string): Promise<CleanUser | null> {
  "use server";
  return await verifyToken(token);
}

// ==================== LOGOUT ====================

export async function logoutUser() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("authToken");
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
  await assertActorCanAccessEmail(email);
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
    if (!feedback.userName) {
      const currentUser = await User.findOne({ email }).select("name");
      feedback.userName = currentUser?.name || feedback.userName || "";
    }
    await feedback.save();
    revalidatePath("/feedback");
    return { success: true, message: "Feedback updated successfully" };
  }

  // Create new
  const userDoc = await User.findOne({ email }).select("_id name");
  feedback = new Feedback({
    email,
    userName: userDoc?.name || "",
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
  await assertActorCanAccessEmail(email);
  noStore();
  await dbConnect();

  if (!email || typeof email !== "string") return null;

  const feedback = (await Feedback.findOne({ email })
    .lean()
    .select("rating comment createdAt updatedAt")) as LeanFeedback | null;

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
  void adminEmail;
  const actor = await getActionActor();
  if (!actor.isAdmin) return [];
  await dbConnect();

  const feedbacks = await Feedback.find()
    .sort({ updatedAt: -1 })
    .populate("user", "name email")
    .lean<LeanFeedback[]>(); // ← .lean() is very helpful here

  // Explicitly convert to plain objects + stringify dates
  return feedbacks.map((doc) => ({
    _id: doc._id.toString(), // convert ObjectId → string
    email: doc.email,
    userName: doc.userName || "",
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

/**
 * Admin only: Get all users with their subscription info
 */
export async function getAllUsers(adminEmail: void) {
  void adminEmail;
  const actor = await getActionActor();
  if (!actor.isAdmin) return [];
  await dbConnect();

  const users = await User.find()
    .select(
      "name email createdAt expiredAt paymentType isEmailVerified isRegisteredWithGoogle",
    )
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return users.map((doc: any) => ({
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt?.toISOString() ?? null,
    expiredAt: doc.expiredAt?.toISOString() ?? null,
    paymentType: doc.paymentType || "Free",
    isEmailVerified: doc.isEmailVerified,
    isRegisteredWithGoogle: doc.isRegisteredWithGoogle,
  }));
}

export async function getPublicFeedbacks() {
  noStore();
  await dbConnect();

  const feedbacks = await Feedback.find({
    rating: { $gte: 1, $lte: 5 },
  })
    .sort({ updatedAt: -1 })
    .limit(40)
    .lean<LeanFeedback[]>();

  return feedbacks
    .filter((doc) => (doc.comment || "").trim().length > 0)
    .map((doc) => ({
      _id: doc._id.toString(),
      userName:
        (doc.userName || "").trim() ||
        doc.email.split("@")[0] ||
        "Daily Routine User",
      rating: doc.rating,
      comment: (doc.comment || "").trim(),
      updatedAt: doc.updatedAt?.toISOString() ?? null,
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

export async function getAIRoutineDoc(
  email: string,
): Promise<{ aiRoutine: AIRoutineData; chatHistory: ChatSession[] }> {
  await assertActorCanAccessEmail(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  const doc = (await AIRoutine.findOne({
    email,
  }).lean()) as AIRoutineDoc | null;
  return {
    aiRoutine: doc?.aiRoutine ?? {
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    },
    chatHistory: doc?.chatHistory ?? [],
  };
}

export async function upsertAIRoutine(
  email: string,
  aiRoutine: AIRoutineData,
): Promise<void> {
  await assertActorCanAccessEmail(email);
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
  await assertActorCanAccessEmail(email);
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
  await assertActorCanAccessEmail(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  await AIRoutine.findOneAndUpdate(
    { email },
    { $pull: { chatHistory: { date } } },
  );
}

// ==================== EMAIL VERIFICATION HELPERS ====================

export async function checkEmailVerificationStatus(email: string): Promise<{
  success: boolean;
  isEmailVerified: boolean;
}> {
  await assertActorCanAccessEmail(email);
  await dbConnect();
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "isEmailVerified",
  );
  return {
    success: true,
    isEmailVerified: Boolean(user?.isEmailVerified),
  };
}

export async function resendVerificationEmail(
  email: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  await assertActorCanAccessEmail(email);
  await dbConnect();
  const normalizedEmail = String(email).toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 12);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpCode.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { codeHash, expiresAt, attempts: 0, verifiedUntil: null } },
    { upsert: true, new: true },
  );

  const sendResult = await sendOtpEmail(normalizedEmail, name || "User", code);
  return sendResult.success
    ? { success: true }
    : { success: false, error: "Failed to send verification code" };
}

export async function uploadPhoto(email: string, formData: FormData) {
  await assertActorCanAccessEmail(email);
  await dbConnect();

  const file = formData.get("photo") as File;
  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Delete old photo from S3
  if (user.photoKey) await deleteFromS3(user.photoKey);

  const { url, key } = await uploadToS3(user._id.toString(), buffer);

  await User.updateOne({ email }, { photo: url, photoKey: key });
  revalidatePath("/profile");

  return { photo: url };
}

export async function deletePhoto(email: string) {
  await assertActorCanAccessEmail(email);
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.photoKey) await deleteFromS3(user.photoKey);

  await User.updateOne({ email }, { photo: "", photoKey: "" });
  revalidatePath("/profile");
}
