"use client";
import {
  checkEmailVerificationStatus,
  resendVerificationEmail,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EmailNotVerified() {
  const { user: auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  // Poll for verification status every 5 seconds
  useEffect(() => {
    if (!auth?.email) return;
    const snapshot = auth;
    let mounted = true;

    const checkVerification = async () => {
      const result = await checkEmailVerificationStatus(snapshot.email);
      if (!mounted) return;
      if (result.success && result.isEmailVerified) {
        setAuth({ ...snapshot, isEmailVerified: true });
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.email]);

  async function reSend() {
    if (!auth?.email || !auth?.name) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await resendVerificationEmail(auth.email, auth.name);

      if (result.success) {
        setMessage("Verification email sent successfully! Check your inbox.");
      } else {
        setMessage(result.error || "Failed to send email");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div
      className={`h-screen w-full overflow-hidden flex justify-center items-center`}
    >
      <div>
        <div className="text-red-600 rounded-lg">
          Please verify your email to use Daily Routine!
        </div>
        <div className="text-[#222222] dark:text-[#dddddd] text-center mt-3">
          Haven&apos;t received verification email yet?
        </div>

        {message && (
          <div
            className={`text-center mt-3 text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="w-full mt-5 flex justify-center items-center">
          <button
            onClick={reSend}
            disabled={loading}
            className="text-white dark:text-black bg-black dark:bg-white hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white border-black dark:border-white px-3 py-2 rounded-md text-center border-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                {renderSpinner()}
                Sending...
              </span>
            ) : (
              "Resend It"
            )}
          </button>
        </div>

        <div className="text-xs text-center mt-4 text-gray-600 dark:text-gray-400">
          Checking verification status automatically...
        </div>
      </div>
    </div>
  );
}
