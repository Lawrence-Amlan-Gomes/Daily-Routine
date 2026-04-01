"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updatePaymentType } from "@/app/actions";

export default function HasExpired({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: auth, setAuth } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const FREE_LIMIT_DAYS = 7;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  // ── Check and update expiry status ─────────────────────────
  useEffect(() => {
    if (!auth?.email || !auth?.paymentType) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let shouldUpdate = false;
    let newPaymentType = auth.paymentType;

    if (auth.paymentType.toLowerCase() === "free" && auth.createdAt) {
      const createdDate = new Date(auth.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= FREE_LIMIT_DAYS) {
        shouldUpdate = true;
        newPaymentType = "Expired";
      }
    } else if (
      auth.paymentType.toLowerCase() !== "free" &&
      auth.paymentType.toLowerCase() !== "expired" &&
      auth.expiredAt
    ) {
      const expiryDate = new Date(auth.expiredAt);
      expiryDate.setHours(0, 0, 0, 0);
      if (today > expiryDate) {
        shouldUpdate = true;
        newPaymentType = "Expired";
      }
    }

    if (shouldUpdate && newPaymentType !== auth.paymentType) {
      setAuth({ ...auth, paymentType: newPaymentType });
      updatePaymentType(auth.email, newPaymentType, auth.expiredAt).catch(
        (err) => console.error("[HasExpired] Server update failed:", err),
      );
    }
  }, [auth, setAuth]);

  // ── Redirect if expired ────────────────────────────────────
  useEffect(() => {
    if (hasMounted && auth?.paymentType === "Expired") {
      const t = setTimeout(() => router.push("/pricing"), 3000);
      return () => clearTimeout(t);
    }
  }, [hasMounted, auth, router]);

  if (!hasMounted) return null;

  if (auth?.paymentType === "Expired") {
    return (
      <div
        className={`h-screen w-full flex flex-col items-center justify-center gap-4 ${
          theme ? "bg-white text-gray-800" : "bg-black text-gray-200"
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${
            theme ? "bg-red-50" : "bg-red-900/30"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-7 h-7 ${theme ? "text-red-500" : "text-red-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <p
          className={`text-lg sm:text-xl font-semibold ${
            theme ? "text-gray-800" : "text-gray-100"
          }`}
        >
          Your subscription has expired
        </p>

        <p className={`text-sm ${theme ? "text-gray-400" : "text-gray-500"}`}>
          Redirecting to pricing...
        </p>

        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full animate-bounce ${
                theme ? "bg-red-300" : "bg-red-700"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}