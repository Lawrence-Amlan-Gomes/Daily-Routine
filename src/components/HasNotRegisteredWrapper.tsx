"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HasNotRegisteredWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: auth } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !auth) {
      const t = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(t);
    }
  }, [hasMounted, auth, router]);

  // Don't render anything until client mounts (avoids hydration flicker)
  if (!hasMounted) return null;

  if (!auth) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-red-50 dark:bg-red-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-7 h-7 text-red-500 dark:text-red-400`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          Please login first
        </p>

        <p className={`text-sm text-gray-400 dark:text-gray-500`}>
          Redirecting to login...
        </p>

        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full animate-bounce bg-gray-300 dark:bg-gray-600`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
