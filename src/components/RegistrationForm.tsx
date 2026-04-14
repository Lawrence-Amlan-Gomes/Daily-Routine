// src/components/RegistrationForm.tsx
"use client";

import { createUser } from "@/app/actions";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EachField from "./EachField";
import OtpInput from "./OtpInput";

const RegistrationForm = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isGoogleClicked, setIsGoogleClicked] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingUserData = useRef<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const [nameError, setNameError] = useState({
    iserror: true,
    error: "Name is required",
  });
  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });
  const [googleError, setGoogleError] = useState({ isError: false, error: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [noError, setNoError] = useState(false);

  // Validation
  useEffect(() => {
    setNameError(
      name
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Name is required" },
    );
  }, [name]);

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
  }, [email]);

  useEffect(() => {
    setPasswordError(
      password.length >= 8
        ? { iserror: false, error: "" }
        : {
            iserror: true,
            error: "Your password must be at least 8 characters",
          },
    );
  }, [password]);

  useEffect(() => {
    setNoError(
      !nameError.iserror && !emailError.iserror && !passwordError.iserror,
    );
  }, [nameError.iserror, emailError.iserror, passwordError.iserror]);

  useEffect(() => {
    if (googleError.isError) {
      const t = setTimeout(
        () => setGoogleError({ isError: false, error: "" }),
        5000,
      );
      return () => clearTimeout(t);
    }
  }, [googleError.isError]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(t);
    }
  }, [successMessage, router]);

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

  const sendOtp = async (nameVal: string, emailVal: string) => {
    setIsSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");
    setOtpSent(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, name: nameVal }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSuccess("Verification code sent! Check your inbox.");
        startCountdown();
      } else {
        setOtpSent(false);
        setOtpError(data.error || "Failed to send code.");
      }
    } catch {
      setOtpSent(false);
      setOtpError("Failed to send code. Try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitForm = async () => {
    if (!noError) return;
    pendingUserData.current = { name, email, password };
    await sendOtp(name, email);
  };

  const verifyOtpAndRegister = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }
    if (!pendingUserData.current) return;

    setIsVerifying(true);
    setOtpError("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingUserData.current.email,
          code: otpCode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setOtpError(data.error || "Invalid code. Please try again.");
        setIsVerifying(false);
        return;
      }

      const { name: n, email: e, password: p } = pendingUserData.current;
      await createUser({
        name: n,
        email: e,
        password: p,
        photo: "",
        isEmailVerified: true,
      });

      setRegistrationSuccess(true);
      setSuccessMessage(`${e} successfully registered`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_EXISTS") {
        setEmailError({
          iserror: true,
          error: "This email is already registered",
        });
        setOtpSent(false);
        setOtpCode("");
      } else {
        setOtpError("Registration failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoadingGoogle(true);
    setIsGoogleClicked(true);
    if (!session?.user) {
      await signIn("google");
      return;
    }
  };

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

  useEffect(() => {
    if (session?.user && isGoogleClicked) {
      setIsLoadingGoogle(true);
      const user = session.user;

      const run = async () => {
        if (!user.email) {
          setGoogleError({
            isError: true,
            error: "Google account has no email. Please try again.",
          });
          setIsGoogleClicked(false);
          return;
        }

        const userEmail = user.email;

        try {
          await createUser({
            name: user.name ?? userEmail.split("@")[0],
            email: userEmail,
            password: "",
            photo: "",
            isRegisteredWithGoogle: true,
            isEmailVerified: true,
          });
          setSuccessMessage(`${userEmail} successfully registered`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (err.message === "EMAIL_ALREADY_EXISTS") {
            setGoogleError({
              isError: true,
              error: `${userEmail} is already registered. Please sign in instead.`,
            });
          } else {
            setGoogleError({
              isError: true,
              error: "Registration failed. Please try again.",
            });
          }
        } finally {
          setIsLoadingGoogle(false);
          setIsGoogleClicked(false);
        }
      };

      run();
    }
  }, [session, isGoogleClicked]);

  return (
    <div
      onKeyDown={(e) => e.key === "Enter" && !otpSent && submitForm()}
      className={`min-h-screen w-full flex items-center justify-center sm:px-0 px-6 pt-[80px] md:pt-[100px] pb-10 ${
        theme
          ? `bg-white ${colors.bgLight}`
          : `bg-black ${colors.bgDark}`
      }`}
    >
      <div
        className={`w-full sm:w-[480px] lg:w-[520px] rounded-xl p-8 sm:p-10 ${
          theme ? colors.cardLight : colors.cardDark
        }`}
      >
        {/* ── OTP Step ───────────────────────────────────────────────── */}
        {otpSent && !registrationSuccess && (
          <div className="flex flex-col items-center py-2">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
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
              className={`text-xl sm:text-2xl font-bold mb-2 ${
                theme ? "text-gray-800" : "text-gray-100"
              }`}
            >
              Check your inbox
            </h2>
            <p
              className={`text-sm text-center mb-7 max-w-xs leading-relaxed ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              We sent a 6-digit verification code to{" "}
              <span
                className={`font-semibold ${
                  theme ? "text-gray-700" : "text-gray-200"
                }`}
              >
                {pendingUserData.current?.email}
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
                  className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 ${
                    theme ? "text-red-600" : "text-red-400"
                  }`}
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
                  className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 ${
                    theme ? "text-green-600" : "text-green-400"
                  }`}
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
              onClick={verifyOtpAndRegister}
              disabled={isVerifying || otpCode.length !== 6}
              className={`
                w-full mt-3 py-2.5 rounded-lg font-semibold text-sm sm:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  !isVerifying && otpCode.length === 6
                    ? theme
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer"
                      : "bg-green-600 hover:bg-green-500 text-white shadow-sm cursor-pointer"
                    : theme
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
                  Verifying...
                </span>
              ) : (
                "Verify & Create Account"
              )}
            </button>

            {/* Resend button */}
            <button
              onClick={() =>
                sendOtp(
                  pendingUserData.current?.name ?? name,
                  pendingUserData.current?.email ?? email,
                )
              }
              disabled={isSendingOtp || otpCountdown > 0}
              className={`
                w-full mt-2.5 py-2.5 rounded-lg font-medium text-sm sm:text-base
                border transition-all duration-200 active:scale-[0.98]
                ${
                  isSendingOtp || otpCountdown > 0
                    ? theme
                      ? "border-gray-200 text-gray-400 cursor-not-allowed bg-transparent"
                      : "border-gray-700 text-gray-600 cursor-not-allowed bg-transparent"
                    : theme
                      ? "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 cursor-pointer bg-transparent"
                      : "border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-gray-800/50 cursor-pointer bg-transparent"
                }
              `}
            >
              {isSendingOtp
                ? "Sending..."
                : otpCountdown > 0
                  ? `Resend code in ${otpCountdown}s`
                  : "Resend Code"}
            </button>

            {/* Back link */}
            <button
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
                setOtpError("");
                setOtpSuccess("");
                pendingUserData.current = null;
              }}
              className={`mt-5 text-xs sm:text-sm underline underline-offset-2 transition-colors duration-200 cursor-pointer bg-transparent border-none
                ${
                  theme
                    ? "text-gray-400 hover:text-gray-600"
                    : "text-gray-500 hover:text-gray-300"
                }
              `}
            >
              ← Back to registration
            </button>

            <p
              className={`mt-5 text-sm ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className={`font-semibold ${colors.keyText} ${colors.keyHoverText}`}
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── Registration Success ────────────────────────────────────── */}
        {registrationSuccess && (
          <div className="flex flex-col items-center py-4 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                theme ? "bg-green-50" : "bg-green-900/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-10 h-10 ${
                  theme ? "text-green-600" : "text-green-400"
                }`}
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
              className={`text-xl sm:text-2xl font-bold mb-2 ${
                theme ? "text-gray-800" : "text-gray-100"
              }`}
            >
              Account created!
            </h2>
            <p
              className={`text-sm mb-1 ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {pendingUserData.current?.email} is now registered.
            </p>
            <p
              className={`text-xs ${
                theme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Redirecting you to sign in...
            </p>
          </div>
        )}

        {/* ── Registration Form ───────────────────────────────────────── */}
        {!otpSent && !registrationSuccess && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Create an account
              </h1>
              <p
                className={`mt-2 text-sm ${
                  theme ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Fill in your details to get started
              </p>
            </div>

            {/* Hidden honeypot fields */}
            <div className="opacity-0 h-0 overflow-hidden">
              <EachField
                label="fake"
                type="email"
                name="email"
                isReal={false}
                placeholder="Enter your email"
                value={email}
                setValue={setEmail}
                iserror={emailError.iserror}
                error={emailError.error}
              />
              <EachField
                label="fake"
                type="password"
                name="password"
                isReal={false}
                placeholder="Enter your password"
                value={password}
                setValue={setPassword}
                iserror={passwordError.iserror}
                error={passwordError.error}
              />
            </div>

            {/* Form fields */}
            <EachField
              label="Full Name"
              type="text"
              name="name"
              isReal={true}
              placeholder="Enter your full name"
              value={name}
              setValue={setName}
              iserror={nameError.iserror}
              error={nameError.error}
            />
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
            <EachField
              label="Password"
              type="password"
              name="password"
              isReal={true}
              placeholder="Create a password (min. 8 characters)"
              value={password}
              setValue={setPassword}
              iserror={passwordError.iserror}
              error={passwordError.error}
              showToggle={true}
            />

            {/* Register button */}
            <button
              onClick={submitForm}
              disabled={!noError || isSendingOtp}
              className={`
                w-full mt-6 py-2.5 rounded-lg font-semibold text-sm lg:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  noError && !isSendingOtp
                    ? theme
                      ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow-md"
                      : "bg-green-700 hover:bg-green-600 text-white cursor-pointer shadow-sm hover:shadow-md"
                    : theme
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {isSendingOtp ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
                  Sending code...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div
                  className={`w-full border-t ${
                    theme ? "border-gray-200" : "border-gray-700"
                  }`}
                />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span
                  className={`px-3 font-medium tracking-wider ${
                    theme
                      ? "bg-white text-gray-400"
                      : "bg-gray-900 text-gray-500"
                  }`}
                >
                  or continue with
                </span>
              </div>
            </div>

            {/* Google register */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleGoogleRegister}
                disabled={isLoadingGoogle || isGoogleClicked}
                className={`
                  w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg
                  border font-medium text-sm lg:text-base
                  transition-all duration-200 active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${
                    theme
                      ? "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
                      : "border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-200"
                  }
                `}
              >
                <div className="w-5 h-5 relative shrink-0">
                  <Image
                    priority
                    src="/googleIcon.png"
                    alt="Google"
                    fill
                    sizes="20px"
                    className="object-contain"
                  />
                </div>
                {isLoadingGoogle ? (
                  <span className="flex items-center gap-2">
                    {renderSpinner()}
                    Registering...
                  </span>
                ) : session?.user?.email ? (
                  session.user.email
                ) : (
                  "Continue with Google"
                )}
              </button>

              {googleError.isError && (
                <div
                  className={`w-full flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                    theme
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-red-900/20 text-red-400 border border-red-800/40"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
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
                  {googleError.error}
                </div>
              )}
            </div>

            <p
              className={`mt-8 text-center text-sm ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className={`font-semibold ${colors.keyText} ${colors.keyHoverText}`}
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
