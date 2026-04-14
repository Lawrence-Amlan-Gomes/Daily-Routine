// src/components/ChangePassword.tsx
"use client";

import { verifyAndChangePassword } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "@/components/EachField";

const ChangePassword = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [oldError, setOldError] = useState({
    iserror: true,
    error: "Current password is required",
  });
  const [newError, setNewError] = useState({
    iserror: true,
    error: "At least 8 characters required",
  });
  const [confirmError, setConfirmError] = useState({
    iserror: true,
    error: "At least 8 characters required",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!auth) router.push("/login");
  }, [auth, router]);

  useEffect(() => {
    setOldError({
      iserror: !oldPassword,
      error: oldPassword ? "" : "Current password is required",
    });
  }, [oldPassword]);

  useEffect(() => {
    const ok = newPassword.length >= 8;
    setNewError({
      iserror: !ok,
      error: ok ? "" : "At least 8 characters required",
    });
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword.length < 8) {
      setConfirmError({
        iserror: true,
        error: "At least 8 characters required",
      });
    } else if (newPassword !== confirmPassword) {
      setConfirmError({ iserror: true, error: "Passwords do not match" });
    } else {
      setConfirmError({ iserror: false, error: "" });
    }
  }, [newPassword, confirmPassword]);

  const isFormValid =
    !oldError.iserror && !newError.iserror && !confirmError.iserror;

  const submitForm = async () => {
    if (!isFormValid || !auth) return;
    setIsLoading(true);
    setServerMsg("");
    try {
      await verifyAndChangePassword(auth.email, oldPassword, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message === "INCORRECT_OLD_PASSWORD"
      ) {
        setOldError({ iserror: true, error: "Current password is incorrect" });
      } else {
        setServerMsg("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderSpinner = () => (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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

  if (!auth) return null;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") submitForm();
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
        {success ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center text-center py-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                theme ? "bg-green-100" : "bg-green-900/30"
              }`}
            >
              <svg
                className="w-8 h-8 text-green-500"
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
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Password Updated!
            </h1>
            <p
              className={`text-sm mb-8 ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Your password has been changed successfully.
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 active:scale-[0.98]"
            >
              Back to Profile
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="text-center mb-8">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                  theme ? "bg-blue-50" : "bg-blue-900/30"
                }`}
              >
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Change Password
              </h1>
              <p
                className={`mt-2 text-sm ${
                  theme ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Update your account password below
              </p>
            </div>

            {/* Honeypot to prevent autofill on real fields */}
            <div className="opacity-0 h-0 overflow-hidden">
              <EachField
                label="fake"
                type="password"
                name="password"
                isReal={false}
                placeholder=""
                value=""
                setValue={() => {}}
                iserror={false}
              />
            </div>

            {/* ── Fields ── */}
            <EachField
              label="Current Password"
              type="password"
              name="currentPassword"
              isReal={true}
              placeholder="Enter your current password"
              value={oldPassword}
              setValue={(v) => {
                setOldPassword(v);
                setServerMsg("");
              }}
              iserror={oldError.iserror}
              error={oldError.error}
              showToggle={true}
            />
            <EachField
              label="New Password"
              type="password"
              name="newPassword"
              isReal={true}
              placeholder="At least 8 characters"
              value={newPassword}
              setValue={setNewPassword}
              iserror={newError.iserror}
              error={newError.error}
              showToggle={true}
            />
            <EachField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              isReal={true}
              placeholder="Repeat your new password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              iserror={confirmError.iserror}
              error={confirmError.error}
              showToggle={true}
            />

            {/* Server error */}
            {serverMsg && (
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
                {serverMsg}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={submitForm}
              disabled={!isFormValid || isLoading}
              className={`
                w-full mt-6 py-2.5 rounded-lg font-semibold text-sm lg:text-base
                transition-all duration-200 active:scale-[0.98]
                ${
                  isFormValid && !isLoading
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm hover:shadow-md"
                    : theme
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  {renderSpinner()}
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>

            {/* Back link */}
            <p
              className={`mt-6 text-center text-sm ${
                theme ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <Link
                href="/profile"
                className={`font-semibold ${colors.keyText} ${colors.keyHoverText}`}
              >
                ← Back to Profile
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
