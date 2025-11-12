// src/app/actions/index.ts
"use server";

import { User } from "@/models/User";
import { dbConnect } from "@/lib/mongo";
import { cleanUserForClient } from "@/lib/data-util";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateToken } from "@/lib/server/jwt";
import { signOut } from "@/app/auth";
import { CleanUser } from "@/store/features/auth/authSlice";
import { verifyToken } from "@/lib/server/jwt";
import { CleanUser } from "@/store/features/auth/authSlice";

// ==================== AUTH ACTIONS ====================

export async function performLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await dbConnect();
  const user = await User.findOne({ email }).lean();
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  const cleanUser: CleanUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };

  const token = await generateToken(cleanUser);

  return { user: cleanUser, token };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  photo?: string;
}) {
  await dbConnect();

  const { email } = data;

  // Check if email already exists
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashed = await bcrypt.hash(data.password, 12);
  const user = new User({
    ...data,
    password: hashed,
  });
  await user.save();
  return cleanUserForClient(user.toObject());
}

export async function changePhoto(email: string, photo: string) {
  await dbConnect();
  await User.updateOne({ email }, { photo });
  revalidatePath("/profile");
}

export async function updateUser(
  email: string,
  updates: {
    name?: string;
    firstTimeLogin?: boolean;
  }
) {
  await dbConnect();
  await User.updateOne({ email }, { $set: updates });
  revalidatePath("/");
}

export async function findUserByEmail(email: string) {
  await dbConnect();
  const user = await User.findOne({ email }).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export async function verifyAndChangePassword(
  email: string,
  oldPassword: string,
  newPassword: string
) {
  await dbConnect();

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("USER_NOT_FOUND");

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error("INCORRECT_OLD_PASSWORD");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });

  revalidatePath("/profile");
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
