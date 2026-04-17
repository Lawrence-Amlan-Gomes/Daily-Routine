// src/store/ReduxProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { setAuth } from "./features/auth/authSlice";
import { store } from "./store";

export default function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadAuth = async () => {
      const storedUser = localStorage.getItem("authUser");
      const storedToken = localStorage.getItem("authToken");

      // ─── 1. Primary: authUser ─────────────────────────────────────────
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          store.dispatch(setAuth(user));
        } catch {
          localStorage.removeItem("authUser");
        }
      }

      // ─── 2. Fallback: Verify JWT (only if authUser missing) ───────────
      if (!storedUser && storedToken) {
        try {
          const res = await fetch("/api/verify-jwt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedToken }),
          });

          if (res.ok) {
            const user = await res.json();
            store.dispatch(setAuth(user));
            localStorage.setItem("authUser", JSON.stringify(user));
          } else {
            localStorage.removeItem("authToken");
          }
        } catch (err) {
          console.error("JWT verification failed:", err);
          localStorage.removeItem("authToken");
        }
      }
    };

    loadAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
