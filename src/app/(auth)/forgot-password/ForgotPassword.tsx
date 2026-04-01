// src/app/(auth)/forgot-password/page.tsx
"use client";

import { resetPassword } from "@/app/actions";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EachField from "@/components/EachField";

type Step = "email" | "otp" | "reset";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const router = useRouter();

  // ── step ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");

  // ── email step ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [sendError, setSendError] = useState("");

  // ── otp step ──────────────────────────────────────────────────────────
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── reset step ────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState({
    iserror: true,
    error: "Password must be at least 8 characters",
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState({
    iserror: true,
    error: "Password must be at least 8 characters",
  });
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // ── cleanup countdown on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── email validation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!email) {
      setEmailError({ iserror: true, error: "Email is required" });
    } else if (!email.endsWith("@gmail.com")) {
      setEmailError({
        iserror: true,
        error: "Use @gmail.com as your email format",
      });
    } else {
      setEmailError({ iserror: false, error: "" });
    }
    setSendError("");
  }, [email]);

  // ── new password validation ───────────────────────────────────────────
  useEffect(() => {
    setNewPasswordError(
      newPassword.length >= 8
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Password must be at least 8 characters" },
    );
  }, [newPassword]);

  // ── confirm password validation ───────────────────────────────────────
  useEffect(() => {
    if (confirmPassword.length < 8) {
      setConfirmPasswordError({
        iserror: true,
        error: "Password must be at least 8 characters",
      });
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError({ iserror: true, error: "Passwords do not match" });
    } else {
      setConfirmPasswordError({ iserror: false, error: "" });
    }
  }, [newPassword, confirmPassword]);

  // ── countdown helper ──────────────────────────────────────────────────
  const startCountdown = () => {
    setOtpCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── send OTP ──────────────────────────────────────────────────────────
  const sendOtp = async (targetEmail: string) => {
    setIsSendingOtp(true);
    setSendError("");
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, name: "User" }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("otp");
        setOtpSuccess("Verification code sent! Check your inbox.");
        startCountdown();
      } else {
        setSendError(data.error || "Failed to send code. Try again.");
      }
    } catch {
      setSendError("Failed to send code. Try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── verify OTP ────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("reset");
      } else {
        setOtpError(data.error || "Invalid code.");
      }
    } catch {
      setOtpError("Verification failed. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── reset password ────────────────────────────────────────────────────
  const handleReset = async () => {
    if (newPasswordError.iserror || confirmPasswordError.iserror) return;

    setIsResetting(true);
    setResetError("");

    try {
      await resetPassword(email, newPassword);
      alert("Password reset successfully!");
      router.push("/login");
    } catch {
      setResetError("Failed to reset password. Try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // ── shared card wrapper ───────────────────────────────────────────────
  const canSubmitReset =
    !newPasswordError.iserror && !confirmPasswordError.iserror;

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center sm:px-0 px-[10%] ${
        theme ? `bg-white ${colors.bgLight}` : `bg-black ${colors.bgDark}`
      }`}
    >
      <div
        className={`sm:p-10 p-6 rounded-lg w-full sm:w-[480px] lg:w-[520px] xl:w-[560px] text-center ${
          theme ? colors.cardLight : colors.cardDark
        }`}
      >
        {/* ── STEP 1: Email ─────────────────────────────────────────── */}
        {step === "email" && (
          <>
            <h1 className="text-[20px] lg:text-[26px] font-bold mb-2">
              Forgot Password
            </h1>
            <p
              className={`text-sm mb-8 ${theme ? "text-gray-500" : "text-gray-400"}`}
            >
              Enter your registered email and we&apos;ll send a verification
              code.
            </p>

            <EachField
              label="Email"
              type="email"
              name="email"
              isReal={true}
              placeholder="Enter your email"
              value={email}
              setValue={setEmail}
              iserror={emailError.iserror}
              error={emailError.error}
            />

            {sendError && (
              <p className="mt-2 text-red-500 text-sm">{sendError}</p>
            )}

            <button
              onClick={() => sendOtp(email)}
              disabled={emailError.iserror || isSendingOtp}
              className={`w-full mt-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${
                  !emailError.iserror && !isSendingOtp
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    : theme
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
            >
              {isSendingOtp ? "Sending..." : "Send Verification Code"}
            </button>

            <p className={`mt-6 text-sm ${theme ? "text-gray-500" : "text-gray-400"}`}>
              Remember your password?{" "}
              <Link
                href="/login"
                className={`${colors.keyText} ${colors.keyHoverText} font-medium`}
              >
                Login
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
        {step === "otp" && (
          <div className="flex flex-col items-center">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                theme ? "bg-green-50" : "bg-green-900/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-8 h-8 ${theme ? "text-green-600" : "text-green-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2
              className={`text-lg sm:text-xl font-bold mb-1 ${
                theme ? "text-gray-800" : "text-gray-100"
              }`}
            >
              Check your inbox
            </h2>
            <p
              className={`text-xs sm:text-sm text-center mb-6 max-w-xs ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              We sent a 6-digit code to{" "}
              <span
                className={`font-semibold ${
                  theme ? "text-gray-700" : "text-gray-200"
                }`}
              >
                {email}
              </span>
            </p>

            {/* OTP input */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ""));
                setOtpError("");
              }}
              placeholder="• • • • • •"
              className={`w-48 sm:w-56 text-center tracking-[0.5em] text-2xl sm:text-3xl font-bold
                rounded-xl px-4 py-3 border-2 outline-none transition-all duration-200
                ${
                  theme
                    ? "bg-white border-gray-200 text-gray-900 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
                    : "bg-gray-800/60 border-gray-600 text-white focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]"
                }`}
            />

            <div className="h-5 mt-2 mb-1">
              {otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    theme ? "text-red-500" : "text-red-400"
                  }`}
                >
                  {otpError}
                </p>
              )}
              {otpSuccess && !otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    theme ? "text-green-600" : "text-green-400"
                  }`}
                >
                  {otpSuccess}
                </p>
              )}
            </div>

            {/* Verify button */}
            <button
              onClick={verifyOtp}
              disabled={isVerifying || otpCode.length !== 6}
              className={`w-48 sm:w-56 mt-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  isVerifying || otpCode.length !== 6
                    ? theme
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : theme
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer"
                      : "bg-green-600 hover:bg-green-500 text-white shadow-sm cursor-pointer"
                }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </button>

            {/* Resend button */}
            <button
              onClick={() => sendOtp(email)}
              disabled={isSendingOtp || otpCountdown > 0}
              className={`w-48 sm:w-56 mt-3 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base
                border transition-all duration-200 active:scale-[0.98]
                ${
                  isSendingOtp || otpCountdown > 0
                    ? theme
                      ? "border-gray-200 text-gray-400 cursor-not-allowed bg-transparent"
                      : "border-gray-700 text-gray-600 cursor-not-allowed bg-transparent"
                    : theme
                      ? "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer bg-transparent"
                      : "border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-gray-800/50 cursor-pointer bg-transparent"
                }`}
            >
              {isSendingOtp
                ? "Sending..."
                : otpCountdown > 0
                  ? `Resend in ${otpCountdown}s`
                  : "Resend Code"}
            </button>

            {/* Back */}
            <button
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setOtpError("");
                setOtpSuccess("");
              }}
              className={`mt-5 text-xs sm:text-sm underline underline-offset-2 transition-colors duration-200 cursor-pointer bg-transparent border-none
                ${theme ? "text-gray-400 hover:text-gray-600" : "text-gray-500 hover:text-gray-300"}`}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── STEP 3: Reset Password ────────────────────────────────── */}
        {step === "reset" && (
          <>
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${
                theme ? "bg-green-50" : "bg-green-900/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-8 h-8 ${theme ? "text-green-600" : "text-green-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v1H10v-1c0-1.104.896-2 2-2zm-4 2v6a2 2 0 002 2h8a2 2 0 002-2v-6H8z"
                />
              </svg>
            </div>

            <h2
              className={`text-lg sm:text-xl font-bold mb-1 ${
                theme ? "text-gray-800" : "text-gray-100"
              }`}
            >
              Set New Password
            </h2>
            <p
              className={`text-xs sm:text-sm text-center mb-6 ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Email verified. Choose a new password for{" "}
              <span className={`font-semibold mt-[50px] ${theme ? "text-gray-700" : "text-gray-200"}`}>
                {email}
              </span>
            </p>

            <EachField
              label="New Password"
              type="password"
              name="password"
              isReal={true}
              placeholder="Enter new password"
              value={newPassword}
              setValue={setNewPassword}
              iserror={newPasswordError.iserror}
              error={newPasswordError.error}
            />
            <EachField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              isReal={true}
              placeholder="Confirm new password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              iserror={confirmPasswordError.iserror}
              error={confirmPasswordError.error}
            />

            {resetError && (
              <p className="mt-2 text-red-500 text-sm">{resetError}</p>
            )}

            <button
              onClick={handleReset}
              disabled={!canSubmitReset || isResetting}
              className={`w-full mt-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-[0.98]
                ${
                  canSubmitReset && !isResetting
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm"
                    : theme
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
            >
              {isResetting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;