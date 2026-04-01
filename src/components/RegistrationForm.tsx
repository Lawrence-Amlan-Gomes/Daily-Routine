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

const RegistrationForm = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isGoogleClicked, setIsGoogleClicked] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // pendingUserData holds form values while awaiting OTP confirmation
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

  // No Google auth state sync needed

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

  // Cleanup countdown on unmount
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
    // Switch UI immediately so user sees the OTP screen while email sends
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
        // Revert if sending actually failed
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
    if (!confirm("Are you sure to Register?")) return;
    // Store form values and send OTP — do NOT create user yet
    pendingUserData.current = { name, email, password };
    await sendOtp(name, email);
  };

  const verifyOtpAndRegister = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    if (!pendingUserData.current) return;

    setIsVerifying(true);
    setOtpError("");

    try {
      // 1. Verify OTP
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
        setOtpError(data.error || "Invalid code.");
        setIsVerifying(false);
        return;
      }

      // 2. Create user (isEmailVerified will be set true by OTP success)
      const { name: n, email: e, password: p } = pendingUserData.current;
      await createUser({ name: n, email: e, password: p, photo: "" });
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
        setOtpError("Registration failed. Try again.");
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
    }
    setIsLoadingGoogle(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Google-auth registration – now fully type-safe                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (session?.user && isGoogleClicked) {
      const user = session.user; // Now guaranteed to be defined

      const run = async () => {
        // `user` is in scope and type-narrowed
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
          });
          setSuccessMessage(`${userEmail} successfully registered`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (err.message === "EMAIL_ALREADY_EXISTS") {
            setGoogleError({
              isError: true,
              error: `${userEmail} is already registered. Please log in.`,
            });
          } else {
            setGoogleError({
              isError: true,
              error: "Auto-registration failed.",
            });
          }
        } finally {
          setIsGoogleClicked(false);
        }
      };

      run();
    }
  }, [session, isGoogleClicked]);

  /* ------------------------------------------------------------------ */

  return (
    <div
      onKeyDown={(e) => e.key === "Enter" && submitForm()}
      className={`h-screen w-full ${otpSent ? "sm:pt-[10%] pt-[100px]" : "sm:pt-[5%] pt-[100px]"} sm:px-0 px-[10%] pb-[50px] overflow-y-auto lg:flex lg:justify-center lg:items-center scrollbar-thin ${
        theme ? `bg-white ${colors.bgLight} scrollbar-track-white scrollbar-thumb-black` : `bg-black ${colors.bgDark} scrollbar-track-black scrollbar-thumb-white`
      }`}
    >
      <div
        className={`sm:p-10 p-5 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="w-full overflow-hidden">
          {!otpSent && (
            <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-5 w-full float-left flex justify-center items-center">
              Registration
            </div>
          )}

          <div className="opacity-0">
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
        </div>

        {/* Mobile */}
        <div
          className={`w-full sm:hidden block overflow-hidden ${otpSent ? "hidden" : ""}`}
        >
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
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
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
          <button
            onClick={submitForm}
            className={`
    text-[12px] lg:text-[16px] 2xl:text-[25px]
    ${noError ? "cursor-pointer" : "cursor-not-allowed"} rounded-lg mt-6 sm:mt-12 py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 md:px-8
    font-medium transition-all duration-300 ease-out
    shadow-sm hover:shadow-md active:scale-[0.98]
    border border-transparent
    ${
      noError
        ? theme
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-green-700 hover:bg-green-800 text-white"
        : theme
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-gray-800 text-gray-500 cursor-not-allowed"
    }
  `}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* Desktop */}
        <div
          className={`float-left w-[50%] sm:block hidden pr-5 ${otpSent ? "!hidden" : ""}`}
        >
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
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
        </div>

        <div
          className={`float-left w-[50%] sm:block hidden pl-5 ${otpSent ? "!hidden" : ""}`}
        >
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
            value={name}
            setValue={setName}
            iserror={nameError.iserror}
            error={nameError.error}
          />
          <button
            onClick={submitForm}
            className={`
    text-[12px] lg:text-[16px] 2xl:text-[25px]
    ${noError ? "cursor-pointer" : "cursor-not-allowed"} rounded-lg ${password ? "lg:mt-[45px] mt-[35px]" : "mt-[15px] lg:mt-[15px]"} py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 md:px-8
    font-medium transition-all duration-300 ease-out
    shadow-sm hover:shadow-md active:scale-[0.98]
    border border-transparent
    ${
      noError
        ? theme
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-green-700 hover:bg-green-800 text-white"
        : theme
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-gray-800 text-gray-500 cursor-not-allowed"
    }
  `}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* OTP Section */}
        {otpSent && (
          <div className="w-full clear-both flex flex-col items-center justify-center py-2 px-4">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${theme ? "bg-green-50" : "bg-green-900/30"}`}
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

            {/* Title */}
            <h2
              className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 ${theme ? "text-gray-800" : "text-gray-100"}`}
            >
              Check your inbox
            </h2>

            {/* Subtitle */}
            <p
              className={`text-xs sm:text-sm lg:text-base text-center mb-6 max-w-xs ${theme ? "text-gray-500" : "text-gray-400"}`}
            >
              We sent a 6-digit code to{" "}
              <span
                className={`font-semibold ${theme ? "text-gray-700" : "text-gray-200"}`}
              >
                {pendingUserData.current?.email}
              </span>
            </p>

            {/* OTP Input */}
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
              className={`
                w-48 sm:w-56 text-center tracking-[0.5em] text-2xl sm:text-3xl font-bold
                rounded-xl px-4 py-3 border-2 outline-none transition-all duration-200
                ${
                  theme
                    ? "bg-white border-gray-200 text-gray-900 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
                    : "bg-gray-800/60 border-gray-600 text-white focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]"
                }
              `}
            />

            {/* Error / Success messages */}
            <div className="h-5 mt-2 mb-1">
              {otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium ${theme ? "text-red-500" : "text-red-400"}`}
                >
                  {otpError}
                </p>
              )}
              {otpSuccess && !otpError && (
                <p
                  className={`text-xs sm:text-sm font-medium ${theme ? "text-green-600" : "text-green-400"}`}
                >
                  {otpSuccess}
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOtpAndRegister}
              disabled={isVerifying || otpCode.length !== 6}
              className={`
                w-48 sm:w-56 mt-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  isVerifying || otpCode.length !== 6
                    ? theme
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : theme
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md cursor-pointer"
                      : "bg-green-600 hover:bg-green-500 text-white shadow-sm hover:shadow-md cursor-pointer"
                }
              `}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  Verifying...
                </span>
              ) : (
                "Verify & Register"
              )}
            </button>

            {/* Resend Button */}
            <button
              onClick={() =>
                sendOtp(
                  pendingUserData.current?.name ?? name,
                  pendingUserData.current?.email ?? email,
                )
              }
              disabled={isSendingOtp || otpCountdown > 0}
              className={`
                w-48 sm:w-56 mt-3 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base
                border transition-all duration-200 active:scale-[0.98]
                ${
                  isSendingOtp || otpCountdown > 0
                    ? theme
                      ? "border-gray-200 text-gray-400 cursor-not-allowed bg-transparent"
                      : "border-gray-700 text-gray-600 cursor-not-allowed bg-transparent"
                    : theme
                      ? "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer bg-transparent"
                      : "border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-gray-800/50 cursor-pointer bg-transparent"
                }
              `}
            >
              {isSendingOtp
                ? "Sending..."
                : otpCountdown > 0
                  ? `Resend in ${otpCountdown}s`
                  : "Resend Code"}
            </button>

            {/* Back to Register link */}
            <button
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
                setOtpError("");
                setOtpSuccess("");
                pendingUserData.current = null;
              }}
              className={`mt-5 text-xs sm:text-sm underline underline-offset-2 transition-colors duration-200 cursor-pointer bg-transparent border-none
                ${theme ? "text-gray-400 hover:text-gray-600" : "text-gray-500 hover:text-gray-300"}
              `}
            >
              ← Back to register
            </button>

            {/* Already have an account */}
            <p className={`mt-4 text-[12px] lg:text-[16px] 2xl:text-[26px]`}>
              Already Have An Account?{" "}
              <Link
                href="/login"
                className={`${colors.keyText} ${colors.keyHoverText}`}
              >
                Login
              </Link>
            </p>
          </div>
        )}

        <div
          className={`w-full flex flex-col items-center justify-center ${otpSent ? "hidden" : ""}`}
        >
          <button
            onClick={handleGoogleRegister}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] flex items-center gap-4 lg:h-[60px] h-[40px] cursor-pointer rounded-md mt-10 py-2 px-4 lg:px-6 ${
              theme
                ? `${colors.keyBg} ${colors.keyHoverBg}`
                : `${colors.keyBg} ${colors.keyHoverBg}`
            } text-white`}
          >
            <div className="h-full flex justify-center items-center">
              <div className="h-[30px] sm:h-[50px] w-[30px] sm:w-[50px] relative">
                <Image
                  priority
                  src="/googleIcon.png"
                  alt="Google Icon"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="h-full text-center flex justify-center items-center">
              <div>
                {isLoadingGoogle
                  ? `Registering...`
                  : session
                    ? `${session.user?.email}`
                    : `Register with Google`}
              </div>
            </div>
          </button>

          {successMessage && (
            <div className="mt-3 text-green-700 text-[12px] lg:text-[16px] 2xl:text-[24px] font-medium animate-pulse">
              {successMessage}
            </div>
          )}
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>

        {!otpSent && (
          <div className="float-left w-full overflow-hidden">
            <p className="sm:mt-10 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
              Already Have An Account?{" "}
              <Link
                href="/login"
                className={`${colors.keyText} ${colors.keyHoverText}`}
              >
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
