// src/app/api/send-otp/route.ts
import { sendOtpEmail } from "@/lib/server/email";
import { NextRequest, NextResponse } from "next/server";

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 60 * 1000; // 1 minute

    otpStore.set(email, { code, expiresAt });

    await sendOtpEmail(email, name, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const entry = otpStore.get(email);

    if (!entry) {
      return NextResponse.json({ success: false, error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json({ success: false, error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    if (entry.code !== code) {
      return NextResponse.json({ success: false, error: "Incorrect code. Please try again." }, { status: 400 });
    }

    otpStore.delete(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}