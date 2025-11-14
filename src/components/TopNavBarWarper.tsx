"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion"; // Import framer-motion
import { ReactNode } from "react"; // ← ONLY ADDED THIS

// ──────────────────────────────────────────────────────────────
//  ONLY ADDED: Props interface + type annotation
// ──────────────────────────────────────────────────────────────
interface TopNavBarWarperProps {
  children: ReactNode;
}

export default function TopNavBarWarper({ children }: TopNavBarWarperProps) {
  return (
    <>
      <motion.div className={`w-full overflow-auth scrollbar`}>
        {children}
      </motion.div>
    </>
  );
}