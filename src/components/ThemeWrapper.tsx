"use client";

import { useTheme } from "@/app/hooks/useTheme";
import type { ReactNode } from "react";

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme();

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${theme ? "#e2e8f0" : "#030712"}; }
        ::-webkit-scrollbar-thumb { background: ${theme ? "#222222" : "#eeeeee"}; border-radius: 2px; }
      `}</style>
      <div
        className={`min-h-screen w-full ${
          theme ? "bg-white" : "bg-black"
        }`}
      >
        {children}
      </div>
    </>
  );
}