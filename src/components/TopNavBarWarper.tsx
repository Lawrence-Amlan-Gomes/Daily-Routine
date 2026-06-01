"use client";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ReactNode } from "react";

interface TopNavBarWarperProps {
  children: ReactNode;
}

export default function TopNavBarWarper({ children }: TopNavBarWarperProps) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div className={`w-full overflow-auth scrollbar`}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
