// src/app/api/verify-jwt/route.ts
import { verifyJwtToken } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limit = await enforceRateLimit(req, {
      route: "verify-jwt:post",
      max: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const user = await verifyJwtToken(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const cookieStore = await cookies();
    cookieStore.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(user, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}