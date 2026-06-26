// src/app/actions/index.ts
"use server";

import { auth as getNextAuthSession, signOut } from "@/auth";
import { cleanUserForClient } from "@/lib/data-util";
import { dbConnect } from "@/lib/mongo";
import { deleteFromS3, uploadToS3 } from "@/lib/photoService";
import { sendContactMessageEmail, sendOtpEmail, sendWelcomeEmail } from "@/lib/server/email";
import { generateToken, verifyToken } from "@/lib/server/jwt";
import { enforceRateLimitByIp } from "@/lib/server/rate-limit";
import { Feedback } from "@/models/Feedback";
import { OtpCode } from "@/models/OtpCode";
import { User } from "@/models/User";
import { getRedis } from "@/lib/redis";
import { CleanUser, IRoutine } from "@/store/features/auth/authSlice";
import bcrypt from "bcrypt";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
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
  _id: string;
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
      "email isAdmin _id",
    );
    return {
      email: dbUser?.email ?? sessionEmail,
      isAdmin: Boolean(dbUser?.isAdmin),
      _id: dbUser?._id?.toString() ?? "",
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  const tokenUser = await verifyToken(token);
  if (!tokenUser?.email) throw new Error("UNAUTHORIZED");

  await dbConnect();
  const dbUser = await User.findOne({ email: tokenUser.email.toLowerCase().trim() }).select("email isAdmin _id");

  return {
    email: dbUser?.email ?? tokenUser.email.toLowerCase().trim(),
    isAdmin: Boolean(dbUser?.isAdmin),
    _id: dbUser?._id?.toString() ?? "",
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

async function assertPremiumAccess(email: string): Promise<ActionActor> {
  const actor = await assertActorCanAccessEmail(email);
  if (actor.isAdmin) return actor;
  const user = await User.findOne({ email: actor.email }).select("paymentType");
  if (!user?.paymentType?.toLowerCase().includes("premium")) {
    throw new Error("Premium subscription required");
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
    paddleSubscriptionId: user.paddleSubscriptionId ? String(user.paddleSubscriptionId) : undefined,
    subscriptionCanceledAt: user.subscriptionCanceledAt
      ? new Date(user.subscriptionCanceledAt).toISOString()
      : null,
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
  const emailCheck = z.string().email().safeParse(data.email);
  if (!emailCheck.success) return { error: "Invalid email address" };

  if (!data.isRegisteredWithGoogle) {
    const pwCheck = z.string().min(8).max(72).safeParse(data.password);
    if (!pwCheck.success) return { error: "Password must be 8–72 characters" };
  }

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
  const welcomeEmailResult = await sendWelcomeEmail(user.email, user.name);
  if (!welcomeEmailResult.success) {
    console.error("[createUser] Welcome email failed:", welcomeEmailResult.error);
  }

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

// NOTE: these MUST match the strings the Paddle webhook writes
// (`${plan.type} ${Monthly|Annually}` in src/app/api/paddle/webhooks/route.ts,
// where plan.type comes from PRICE_ID_TO_PLAN). The UI also depends on the
// duration suffix (`.includes("Monthly")` / `.includes("Annually")` in
// Pricing.tsx). Do not drop the suffix. The admin tier is intentionally
// asymmetric: "Admin Monthly" + "Premium Admin Annually".
const paymentTypeSchema = z.enum([
  "Free One Month",
  "Free",
  "Expired",
  "Standard Monthly",
  "Standard Annually",
  "Premium Monthly",
  "Premium Annually",
  "Admin Monthly",
  "Premium Admin Annually",
]);

export async function updatePaymentType(
  email: string,
  paymentType: string,
  expiredAt: Date,
  options?: { bypassAuth?: boolean; subscriptionId?: string; clearSubscriptionId?: boolean },
) {
  const parsedType = paymentTypeSchema.safeParse(paymentType);
  if (!parsedType.success) return { error: "Invalid payment type" };

  if (!options?.bypassAuth) {
    const actor = await getActionActor();
    const normalizedTarget = String(email).toLowerCase().trim();
    // Allow users to update their own payment type or admins to update any
    if (!actor.isAdmin && actor.email !== normalizedTarget) {
      throw new Error("FORBIDDEN");
    }
  }
  await dbConnect();
  const updateData: { paymentType: string; expiredAt: Date | null; paddleSubscriptionId?: string; subscriptionCanceledAt?: Date | null } = { paymentType: parsedType.data, expiredAt };
  if (options?.subscriptionId) {
    updateData.paddleSubscriptionId = options.subscriptionId;
    // A freshly activated subscription is no longer pending-cancel.
    updateData.subscriptionCanceledAt = null;
  }
  if (options?.clearSubscriptionId) {
    updateData.paddleSubscriptionId = "";
    // Cancellation is now finalized (paymentType → "Expired"); clear the flag.
    updateData.subscriptionCanceledAt = null;
  }
  await User.updateOne({ email }, updateData);
  revalidatePath("/");
}

// Returns a result object (never throws for expected failures) — Next.js masks
// thrown server-action errors in production, so the modal would only see a
// generic "Server Components render" message. Returning { error } lets the UI
// surface the real reason.
export async function cancelSubscription(
  email: string,
): Promise<{ success: true } | { error: string }> {
  const actor = await getActionActor();
  const normalizedTarget = String(email).toLowerCase().trim();
  if (actor.email !== normalizedTarget && !actor.isAdmin) {
    return { error: "You are not allowed to cancel this subscription." };
  }

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return { error: "User not found." };
  if (!user.paymentType || user.paymentType === "Expired") {
    return { error: "No active subscription to cancel." };
  }

  const paddleApiKey = process.env.PADDLE_API_KEY;
  if (!paddleApiKey) {
    console.error("[cancelSubscription] PADDLE_API_KEY not configured");
    return { error: "Billing is not configured. Please contact support." };
  }
  const authHeader = { Authorization: `Bearer ${paddleApiKey}` };

  // 1) Resolve the Paddle subscription id. Prefer the stored one; otherwise look
  //    it up by customer email. The lookup covers subscriptions created before
  //    the activation webhook stored the id (e.g. during the schema-bug window).
  let subscriptionId = user.paddleSubscriptionId || "";
  if (!subscriptionId) {
    try {
      // Paddle's list endpoints expose customer email only via the customers
      // resource (`search`), not on subscriptions — so resolve customer first.
      const custRes = await fetch(
        `https://api.paddle.com/customers?search=${encodeURIComponent(normalizedTarget)}`,
        { headers: authHeader, cache: "no-store" },
      );
      if (!custRes.ok) {
        console.error("[cancelSubscription] customers lookup failed:", custRes.status, await custRes.text());
        return { error: "Could not reach the billing provider. Please try again." };
      }
      const custData = (await custRes.json()) as { data?: Array<{ id: string; email?: string }> };
      const customerId = (custData.data || []).find(
        (c) => c.email?.toLowerCase() === normalizedTarget,
      )?.id;
      if (!customerId) {
        return { error: "No billing customer found for your account." };
      }

      const subsRes = await fetch(
        `https://api.paddle.com/subscriptions?customer_id=${customerId}&status=active`,
        { headers: authHeader, cache: "no-store" },
      );
      if (!subsRes.ok) {
        console.error("[cancelSubscription] subscriptions lookup failed:", subsRes.status, await subsRes.text());
        return { error: "Could not reach the billing provider. Please try again." };
      }
      const subsData = (await subsRes.json()) as { data?: Array<{ id: string }> };
      subscriptionId = subsData.data?.[0]?.id || "";
    } catch (err) {
      console.error("[cancelSubscription] lookup error:", err);
      return { error: "Could not reach the billing provider. Please try again." };
    }
  }

  if (!subscriptionId) {
    return { error: "No active subscription found to cancel." };
  }

  // 2) Cancel at end of billing period. Paddle requires an explicit body when
  //    Content-Type is JSON, so always send effective_from.
  try {
    const cancelRes = await fetch(
      `https://api.paddle.com/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ effective_from: "next_billing_period" }),
        cache: "no-store",
      },
    );
    if (!cancelRes.ok) {
      console.error("[cancelSubscription] Paddle cancel failed:", cancelRes.status, await cancelRes.text());
      return { error: "The billing provider rejected the cancellation. Please try again or contact support." };
    }
  } catch (err) {
    console.error("[cancelSubscription] cancel request error:", err);
    return { error: "Could not reach the billing provider. Please try again." };
  }

  // 3) Mark pending-cancel now (the subscription.canceled webhook finalizes to
  //    "Expired" at period end). Backfill paddleSubscriptionId for records that
  //    were missing it so a future cancel skips the lookup.
  await User.updateOne(
    { email },
    { subscriptionCanceledAt: new Date(), paddleSubscriptionId: subscriptionId },
  );
  revalidatePath("/profile");
  revalidatePath("/billing");

  return { success: true };
}

export async function incrementThisMonthPremiumCount(
  email: string,
  thisMonthPremiumResponses: string,
) {
  try {
    await assertPremiumAccess(email);
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
  if (newPassword.length > 72) throw new Error("PASSWORD_TOO_LONG");
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
  revalidatePath("/profile");
}

const nameSchema = z.string().trim().min(1, "Name cannot be empty").max(100, "Name is too long");

export async function updateUser(
  email: string,
  updates: {
    name?: string;
    firstTimeLogin?: boolean;
  },
) {
  if (updates.name !== undefined) {
    const parsed = nameSchema.safeParse(updates.name);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
    updates = { ...updates, name: parsed.data };
  }

  await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { $set: updates });
  revalidatePath("/profile");
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
    paddleSubscriptionId: user.paddleSubscriptionId ? String(user.paddleSubscriptionId) : undefined,
    subscriptionCanceledAt: user.subscriptionCanceledAt
      ? new Date(user.subscriptionCanceledAt).toISOString()
      : null,
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
  time: z.string().regex(/^\d{2}:\d{2} (AM|PM) - \d{2}:\d{2} (AM|PM)$/),
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

  const actor = await assertActorCanAccessEmail(email);
  await dbConnect();
  await User.updateOne({ email }, { routine: parsed.data });
  try {
    await getRedis().del(`routine:${actor._id}`);
  } catch (err) {
    console.error("[redis] updateRoutine invalidation failed:", err);
  }
  revalidatePath("/dashBoard");
}

const statsSchema = z
  .array(
    z.object({
      date: z.string().min(1).max(32),
      day: z.string().min(1).max(16),
      totalTasks: z.number().int().min(0).max(1000),
      completedTasks: z.array(z.string().min(1).max(200)).max(1000),
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
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  priority: z.string().min(1).max(32),
  status: z.string().min(1).max(32),
  category: z.string().max(64),
  dueDate: z.string().max(64),
  time: z.string().max(32),
  reminderAt: z.string().max(64),
  repeat: z.string().max(32),
  tags: z.array(z.string().max(64)).max(50),
  subtasks: z.array(subtaskSchema).max(100),
  createdAt: z.string().min(1).max(64),
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
  revalidatePath("/dashBoard");
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
      "name email createdAt expiredAt paymentType isEmailVerified isRegisteredWithGoogle isAdmin",
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
    isAdmin: Boolean(doc.isAdmin),
  }));
}

/**
 * Admin only: Grant or revoke admin status on another user.
 * An admin cannot demote themselves.
 */
export async function setUserAdmin(targetEmail: string, makeAdmin: boolean) {
  const actor = await getActionActor();
  if (!actor.isAdmin) throw new Error("Forbidden");

  const normalizedTarget = targetEmail.toLowerCase().trim();
  if (normalizedTarget === actor.email) {
    throw new Error("You cannot change your own admin status");
  }

  await dbConnect();
  const result = await User.updateOne(
    { email: normalizedTarget },
    { $set: { isAdmin: makeAdmin } },
  );

  if (result.matchedCount === 0) throw new Error("User not found");
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
  id?: string;
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

const AI_ROUTINE_TTL = 1800; // 30 minutes

export async function getAIRoutine(email: string): Promise<AIRoutineData> {
  const actor = await assertPremiumAccess(email);
  const userId = actor._id;
  const cacheKey = `routine:${userId}:ai`;

  try {
    const cached = await getRedis().get(cacheKey);
    if (cached) return JSON.parse(cached) as AIRoutineData;
  } catch (err) {
    console.error("[redis] getAIRoutine read failed:", err);
  }

  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  const doc = (await AIRoutine.findOne({ email }).select("aiRoutine").lean()) as Pick<AIRoutineDoc, "aiRoutine"> | null;
  const aiRoutine: AIRoutineData = doc?.aiRoutine ?? {
    saturday: [],
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };

  try {
    await getRedis().set(cacheKey, JSON.stringify(aiRoutine), "EX", AI_ROUTINE_TTL);
  } catch (err) {
    console.error("[redis] getAIRoutine write failed:", err);
  }

  return aiRoutine;
}

export async function getChatHistory(email: string): Promise<ChatSession[]> {
  await assertPremiumAccess(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  const doc = (await AIRoutine.findOne({ email }).select("chatHistory").lean()) as Pick<AIRoutineDoc, "chatHistory"> | null;
  return doc?.chatHistory ?? [];
}

export async function upsertAIRoutine(
  email: string,
  aiRoutine: AIRoutineData,
): Promise<void> {
  const actor = await assertPremiumAccess(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  await AIRoutine.findOneAndUpdate(
    { email },
    { $set: { aiRoutine } },
    { upsert: true, new: true },
  );
  try {
    await getRedis().del(`routine:${actor._id}:ai`);
  } catch (err) {
    console.error("[redis] upsertAIRoutine invalidation failed:", err);
  }
  revalidatePath("/ai-routine");
}

export async function appendChatMessage(
  email: string,
  date: string,
  message: ChatMessage,
): Promise<void> {
  await assertPremiumAccess(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  // Single atomic pipeline update: append to existing session or create new one.
  // Two separate findOneAndUpdate calls had a TOCTOU race where concurrent requests
  // could both miss the session-exists check and push duplicate chatHistory entries.
  await AIRoutine.findOneAndUpdate(
    { email },
    [
      {
        $set: {
          chatHistory: {
            $cond: {
              if: { $in: [date, { $ifNull: ["$chatHistory.date", []] }] },
              then: {
                $map: {
                  input: "$chatHistory",
                  as: "session",
                  in: {
                    $cond: {
                      if: { $eq: ["$$session.date", date] },
                      then: {
                        date: "$$session.date",
                        messages: { $concatArrays: ["$$session.messages", [message]] },
                      },
                      else: "$$session",
                    },
                  },
                },
              },
              else: {
                $concatArrays: [
                  { $ifNull: ["$chatHistory", []] },
                  [{ date, messages: [message] }],
                ],
              },
            },
          },
        },
      },
    ],
    { upsert: true, new: true },
  );
  revalidatePath("/ai-routine");
}

export async function clearChatSession(
  email: string,
  date: string,
): Promise<void> {
  await assertPremiumAccess(email);
  await dbConnect();
  const { AIRoutine } = await import("@/models/AIRoutine");
  await AIRoutine.findOneAndUpdate(
    { email },
    { $pull: { chatHistory: { date } } },
  );
  revalidatePath("/ai-routine");
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

  const normalizedEmail = String(email).toLowerCase().trim();
  const reqHeaders = await headers();
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : reqHeaders.get("x-real-ip")) || "unknown";
  const limit = await enforceRateLimitByIp(ip, {
    route: "send-otp:resend",
    max: 5,
    windowMs: 10 * 60 * 1000,
    keyParts: [normalizedEmail],
  });
  if (!limit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  await dbConnect();
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

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Max 5 MB.");
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const { url, key } = await uploadToS3(user._id.toString(), buffer);

  const oldKey = user.photoKey;
  await User.updateOne({ email }, { photo: url, photoKey: key });

  // Delete old photo after DB update succeeds — orphaned file preferred over stale DB ref
  if (oldKey) {
    try {
      await deleteFromS3(oldKey);
    } catch (err) {
      console.error("Failed to delete old S3 photo (orphaned):", oldKey, err);
    }
  }
  revalidatePath("/profile");

  return { photo: url };
}

// ==================== CONTACT ACTIONS ====================

export async function sendContactMessage(
  name: string,
  subject: string,
  body: string,
): Promise<{ error?: string }> {
  let actor: { email: string; isAdmin: boolean };
  try {
    actor = await getActionActor();
  } catch {
    return { error: "UNAUTHORIZED" };
  }

  const reqHeaders = await headers();
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0].trim() : reqHeaders.get("x-real-ip")) ||
    "unknown";

  const limit = await enforceRateLimitByIp(ip, {
    route: "contact-message",
    max: 3,
    windowMs: 60 * 60 * 1000,
    keyParts: [actor.email],
  });
  if (!limit.allowed) {
    const mins = Math.ceil(limit.retryAfterSec / 60);
    return { error: `Too many messages. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.` };
  }

  const schema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    subject: z.string().trim().min(1, "Subject is required").max(200),
    body: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  });
  const parsed = schema.safeParse({ name, subject, body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await sendContactMessageEmail(
      actor.email,
      parsed.data.name,
      parsed.data.subject,
      parsed.data.body,
    );
    return {};
  } catch (err) {
    console.error("sendContactMessage error:", err);
    return { error: "Failed to send. Please email us directly at mydailyroutinecontact@gmail.com." };
  }
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
