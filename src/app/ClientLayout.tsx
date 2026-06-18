// src/app/ClientLayout.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import ReduxProvider from "@/store/ReduxProvider";
import TopNavbar from "@/components/TopNavbar";
import TopNavBarWarper from "@/components/TopNavBarWarper";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <SessionProvider>
        <div className="min-h-screen w-full bg-white dark:bg-black">
          <TopNavbar />
          <TopNavBarWarper>{children}</TopNavBarWarper>
          <Toaster richColors position="top-right" />
        </div>
      </SessionProvider>
    </ReduxProvider>
  );
}
