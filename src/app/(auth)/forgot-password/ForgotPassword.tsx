// src/app/(auth)/forgot-password/page.tsx
"use client";

import { resetPassword } from "@/app/actions";
import colors from "@/app/color/color";
import EachField from "@/components/EachField";
import OtpInput from "@/components/OtpInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Step = "email" | "otp" | "reset" | "success";

const ForgotPassword = () => {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");

  // email step
  const [email, setEmail] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [sendError, setSendError] = useState("");

  // otp step
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // reset step
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // Derived validation — computed every render, no state needed
  const emailError = !email
    ? { iserror: true, error: "Email is required" }
    : !email.endsWith("@gmail.com")
      ? { iserror: true, error: "Use @gmail.com as your email format" }
      : { iserror: false, error: "" };

  const newPasswordError = newPassword.length >= 8
    ? { iserror: false, error: "" }
    : { iserror: true, error: "Password must be at least 8 characters" };

  const confirmPasswordError =
    confirmPassword.length < 8
      ? { iserror: true, error: "Password must be at least 8 characters" }
      : newPassword !== confirmPassword
        ? { iserror: true, error: "Passwords do not match" }
        : { iserror: false, error: "" };

  // Clear server-side send error when email changes
  useEffect(() => {
    setSendError("");
  }, [email]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

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
        setSendError(data.error || "Failed to send code. Please try again.");
      }
    } catch {
      setSendError("Failed to send code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter the full 6-digit code.");
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
        setOtpError(data.error || "Invalid code. Please try again.");
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async () => {
    if (newPasswordError.iserror || confirmPasswordError.iserror) return;

    setIsResetting(true);
    setResetError("");

    try {
      await resetPassword(email, newPassword);
      setStep("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RESET_NOT_VERIFIED") {
        setResetError("Verification session expired. Please start over.");
      } else if (msg === "USER_NOT_FOUND") {
        setResetError("No account found with this email.");
      } else {
        setResetError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const canSubmitReset =
    !newPasswordError.iserror && !confirmPasswordError.iserror;

  const renderSpinner = (size = "w-4 h-4") => (
    <svg className={`animate-spin ${size}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center sm:px-0 px-6 pt-[80px] md:pt-[100px] bg-white ${colors.bgLight} dark:bg-black ${colors.bgDark}`}
    >
      <div
        className={`w-full sm:w-[440px] lg:w-[480px] rounded-xl p-8 sm:p-10 ${colors.cardLight} ${colors.cardDark}`}
      >
        {/* ── STEP 1: Email ─────────────────────────────────────────── */}
        {step === "email" && (
          <>
            <div className="text-center mb-8">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50 dark:bg-green-900/30`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-7 h-7 text-green-600 dark:text-green-400`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Forgot password?
              </h1>
              <p
                className={`mt-2 text-sm text-gray-500 dark:text-gray-400`}
              >
                Enter your email and we&apos;ll send you a verification code.
              </p>
            </div>

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
              <div
                className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40`}
              >
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                {sendError}
              </div>
            )}

            <button
              onClick={() => sendOtp(email)}
              disabled={emailError.iserror || isSendingOtp}
              className={`w-full mt-6 py-2.5 rounded-lg font-semibold text-sm lg:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  !emailError.iserror && !isSendingOtp
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                }`}
            >
              {isSendingOtp ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
                  Sending code...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </button>

            <p
              className={`mt-6 text-center text-sm text-gray-500 dark:text-gray-400`}
            >
              Remember your password?{" "}
              <Link
                href="/login"
                className={`font-semibold ${colors.keyText} ${colors.keyHoverText}`}
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
        {step === "otp" && (
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-green-50 dark:bg-green-900/30`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-8 h-8 text-green-600 dark:text-green-400`}
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
              className={`text-xl sm:text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100`}
            >
              Check your inbox
            </h2>
            <p
              className={`text-sm text-center mb-7 max-w-xs leading-relaxed text-gray-500 dark:text-gray-400`}
            >
              We sent a 6-digit verification code to{" "}
              <span
                className={`font-semibold text-gray-700 dark:text-gray-200`}
              >
                {email}
              </span>
            </p>

            {/* 6-box OTP input */}
            <OtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                setOtpError("");
              }}
              hasError={!!otpError}
            />

            {/* Status messages */}
            <div className="min-h-[28px] mt-3 mb-1 w-full flex justify-center">
              {otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 text-red-600 dark:text-red-400`}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  {otpError}
                </p>
              )}
              {otpSuccess && !otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 text-green-600 dark:text-green-400`}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {otpSuccess}
                </p>
              )}
            </div>

            {/* Verify button */}
            <button
              onClick={verifyOtp}
              disabled={isVerifying || otpCode.length !== 6}
              className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-sm sm:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  !isVerifying && otpCode.length === 6
                    ? "bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white shadow-sm cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
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
              className={`w-full mt-2.5 py-2.5 rounded-lg font-medium text-sm sm:text-base
                border transition-all duration-200 active:scale-[0.98]
                ${
                  isSendingOtp || otpCountdown > 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-transparent dark:border-gray-700 dark:text-gray-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 cursor-pointer bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:bg-gray-800/50"
                }`}
            >
              {isSendingOtp
                ? "Sending..."
                : otpCountdown > 0
                  ? `Resend code in ${otpCountdown}s`
                  : "Resend Code"}
            </button>

            <button
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setOtpError("");
                setOtpSuccess("");
              }}
              className={`mt-5 text-xs sm:text-sm underline underline-offset-2 transition-colors duration-200 cursor-pointer bg-transparent border-none text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300`}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── STEP 3: Reset Password ────────────────────────────────── */}
        {step === "reset" && (
          <>
            <div className="text-center mb-8">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50 dark:bg-green-900/30`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-7 h-7 text-green-600 dark:text-green-400`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Set new password
              </h2>
              <p
                className={`mt-2 text-sm text-gray-500 dark:text-gray-400`}
              >
                Choose a strong password for{" "}
                <span
                  className={`font-semibold text-gray-700 dark:text-gray-200`}
                >
                  {email}
                </span>
              </p>
            </div>

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
              showToggle={true}
            />
            <EachField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              isReal={true}
              placeholder="Confirm new password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              iserror={confirmPasswordError.iserror}
              error={confirmPasswordError.error}
              showToggle={true}
            />

            {resetError && (
              <div
                className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40`}
              >
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                {resetError}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={!canSubmitReset || isResetting}
              className={`w-full mt-6 py-2.5 rounded-lg font-semibold text-sm lg:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  canSubmitReset && !isResetting
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                }`}
            >
              {isResetting ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </>
        )}

        {/* ── STEP 4: Success ───────────────────────────────────────── */}
        {step === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-green-50 dark:bg-green-900/30`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-10 h-10 text-green-600 dark:text-green-400`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2
              className={`text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100`}
            >
              Password reset!
            </h2>
            <p
              className={`text-sm mb-8 text-gray-500 dark:text-gray-400`}
            >
              Your password has been updated successfully. You can now sign in
              with your new password.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
