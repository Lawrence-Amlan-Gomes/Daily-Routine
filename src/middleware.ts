// src/middleware.ts
import { auth } from "@/auth";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashBoard",
  "/goals",
  "/stats",
  "/profile",
  "/billing",
  "/ai-routine",
  "/admin",
  "/changePassword",
  "/color",
];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (!isProtected) return NextResponse.next();

  // Google OAuth users: NextAuth session present
  if (req.auth) return NextResponse.next();

  // Email/password users: verify custom JWT cookie
  const authToken = req.cookies.get("authToken")?.value;
  if (authToken) {
    try {
      await jwtVerify(
        authToken,
        new TextEncoder().encode(process.env.JWT_SECRET!),
      );
      return NextResponse.next();
    } catch {
      // expired or tampered token — fall through to redirect
    }
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    "/dashBoard/:path*",
    "/goals/:path*",
    "/stats/:path*",
    "/profile/:path*",
    "/billing/:path*",
    "/ai-routine/:path*",
    "/admin/:path*",
    "/changePassword/:path*",
    "/color/:path*",
  ],
};
