// src/app/api/send-otp/route.ts
import { sendOtpEmail } from "@/lib/server/email";
import { dbConnect } from "@/lib/mongo";
import { OtpCode } from "@/models/OtpCode";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const otpSendLimit = await enforceRateLimit(req, {
      route: "send-otp:post",
      max: 5,
      windowMs: 10 * 60 * 1000,
      keyParts: [String(email).toLowerCase().trim()],
    });
    if (!otpSendLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many OTP requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(otpSendLimit.retryAfterSec) },
        },
      );
    }

    await dbConnect();

    const normalizedEmail = String(email).toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const codeHash = await bcrypt.hash(code, 10);

    await OtpCode.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { codeHash, expiresAt, attempts: 0, verifiedUntil: null } },
      { upsert: true, new: true },
    );

    const emailResult = await sendOtpEmail(normalizedEmail, name, code);
    if (!emailResult.success) {
      await OtpCode.deleteOne({ email: normalizedEmail });
      return NextResponse.json({ success: false, error: "Failed to send email. Please try again." }, { status: 500 });
    }

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

    const otpVerifyLimit = await enforceRateLimit(req, {
      route: "send-otp:put",
      max: 10,
      windowMs: 10 * 60 * 1000,
      keyParts: [String(email).toLowerCase().trim()],
    });
    if (!otpVerifyLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many verification attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(otpVerifyLimit.retryAfterSec) },
        },
      );
    }

    await dbConnect();
    const normalizedEmail = String(email).toLowerCase().trim();
    const otp = await OtpCode.findOne({ email: normalizedEmail });

    if (!otp) {
      return NextResponse.json({ success: false, error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (otp.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please request a new OTP." },
        { status: 429 },
      );
    }

    if (Date.now() > new Date(otp.expiresAt).getTime()) {
      await OtpCode.deleteOne({ email: normalizedEmail });
      return NextResponse.json({ success: false, error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(String(code), otp.codeHash);

    if (!isValid) {
      await OtpCode.updateOne({ email: normalizedEmail }, { $inc: { attempts: 1 } });
      return NextResponse.json({ success: false, error: "Incorrect code. Please try again." }, { status: 400 });
    }

    await OtpCode.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          codeHash: "",
          verifiedUntil: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}