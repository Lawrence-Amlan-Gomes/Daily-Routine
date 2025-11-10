"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion"; // Import framer-motion

export default function TopNavBarWarper({ children }) {
  const { sidebarOpen } = useTheme();
  return (
    <>
      <motion.div className={`w-full overflow-auth scrollbar`}>
        {children}
      </motion.div>
    </>
  );
}
