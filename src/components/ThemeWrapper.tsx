// app/components/ThemeWrapper.jsx
"use client";
import { useTheme } from "@/app/hooks/useTheme";

export default function ThemeWrapper({ children }) {
  const { theme } = useTheme();

  return (
    <div
      className={`h-screen w-full overflow-y-auto scrollbar ${
        theme
          ? "scrollbar-thumb-[#222222] scrollbar-track-[#f8f8f8] bg-white"
          : "scrollbar-thumb-[#eeeeee] scrollbar-track-[#0f0f0f] bg-black"
      }`}
    >
      {children}
    </div>
  );
}