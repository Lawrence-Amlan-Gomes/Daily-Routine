// src/components/LoginForm.tsx
"use client";

import {
  findUserByEmail,
  generateJwtForGoogle,
  performLogin,
} from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { CleanUser, IGoal } from "@/store/features/auth/authSlice";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Password is required",
  });
  const [mainError, setMainError] = useState({ isError: false, error: "" });
  const [googleError, setGoogleError] = useState({ isError: false, error: "" });

  useEffect(() => {
    setEmailError(
      email
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Email is required" },
    );
    setPasswordError(
      password
        ? { iserror: false, error: "" }
        : { iserror: true, error: "Password is required" },
    );
    setMainError({ isError: false, error: "" });
    setGoogleError({ isError: false, error: "" });
  }, [email, password]);

  useEffect(() => {
    if (googleError.isError) {
      const t = setTimeout(
        () => setGoogleError({ isError: false, error: "" }),
        3000,
      );
      return () => clearTimeout(t);
    }
  }, [googleError.isError]);

  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  const submitForm = async () => {
    if (emailError.iserror || passwordError.iserror) return;

    setIsLoading(true);
    try {
      const result = await performLogin({ email, password });

      if (result) {
        const { user, token } = result;

        if (
          typeof window !== "undefined" &&
          !localStorage.getItem("authUser")
        ) {
          localStorage.setItem("authToken", token);
        }

        setAuth(user);
        router.push("/");
      } else {
        setMainError({
          isError: true,
          error: "Email or password is incorrect",
        });
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again.";
      setMainError({
        isError: true,
        error:
          message === "EMAIL_NOT_VERIFIED"
            ? "Please verify your email before logging in."
            : "Something went wrong. Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      if (!session?.user) {
        await signIn("google");
        return;
      }

      const userEmail = session.user.email!;
      const user = await findUserByEmail(userEmail);

      if (user) {
        const allowedPriority: IGoal["priority"][] = [
          "low",
          "medium",
          "high",
          "critical",
        ];
        const allowedStatus: IGoal["status"][] = [
          "todo",
          "in-progress",
          "done",
          "archived",
        ];
        const allowedRepeat: IGoal["repeat"][] = [
          "none",
          "daily",
          "weekly",
          "monthly",
        ];

        const cleanUser: CleanUser = {
          ...user,
          paymentType: user.paymentType ?? "Expired",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          goals: (user.goals || []).map((g: any) => ({
            ...g,
            priority: allowedPriority.includes(g.priority as IGoal["priority"])
              ? (g.priority as IGoal["priority"])
              : "medium",
            status: allowedStatus.includes(g.status as IGoal["status"])
              ? (g.status as IGoal["status"])
              : "todo",
            repeat: allowedRepeat.includes(g.repeat as IGoal["repeat"])
              ? (g.repeat as IGoal["repeat"])
              : "none",
          })),
        };

        const token = await generateJwtForGoogle(cleanUser);

        if (
          typeof window !== "undefined" &&
          !localStorage.getItem("authUser")
        ) {
          localStorage.setItem("authToken", token);
        }

        setAuth(cleanUser);
        router.push("/");
      } else {
        setGoogleError({
          isError: true,
          error: `No account found for ${userEmail}. Please register first.`,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Google login error:", err);
      setGoogleError({
        isError: true,
        error: err.message || "Google sign-in failed. Please try again.",
      });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const isFormValid = !emailError.iserror && !passwordError.iserror;

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
      onKeyDown={(event) => {
        if (event.key === "Enter") submitForm();
      }}
      className={`min-h-screen w-full flex items-center justify-center sm:px-0 px-6 pt-[80px] md:pt-[100px] ${
        theme ? `bg-white ${colors.bgLight}` : `bg-black ${colors.bgDark}`
      }`}
    >
      <div
        className={`w-full sm:w-[440px] lg:w-[460px] xl:w-[480px] rounded-xl p-8 sm:p-10 ${
          theme ? colors.cardLight : colors.cardDark
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p
            className={`mt-2 text-sm ${
              theme ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Sign in to your account to continue
          </p>
        </div>

        {/* Hidden honeypot fields to prevent autofill on real fields */}
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

        {/* Fields */}
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
          showToggle={true}
        />

        {/* Main error */}
        {mainError.isError && (
          <div
            className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 ${
              theme
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-red-900/20 text-red-400 border border-red-800/40"
            }`}
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
            {mainError.error}
          </div>
        )}

        {/* Forgot password */}
        <div className="flex justify-end mt-2">
          <Link
            href="/forgot-password"
            className={`text-xs lg:text-sm ${colors.keyText} ${colors.keyHoverText}`}
          >
            Forgot password?
          </Link>
        </div>

        {/* Login button */}
        <button
          onClick={submitForm}
          disabled={!isFormValid || isLoading}
          className={`
            w-full mt-5 py-2.5 rounded-lg font-semibold text-sm lg:text-base
            transition-all duration-200 active:scale-[0.98]
            ${
              isFormValid && !isLoading
                ? theme
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow-md"
                  : "bg-green-700 hover:bg-green-600 text-white cursor-pointer shadow-sm hover:shadow-md"
                : theme
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              {renderSpinner()}
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div
            className={`absolute inset-0 flex items-center`}
            aria-hidden="true"
          >
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

        {/* Google button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
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
                Signing in...
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

        {/* Register link */}
        <p
          className={`mt-8 text-center text-sm ${
            theme ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className={`font-semibold ${colors.keyText} ${colors.keyHoverText}`}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
