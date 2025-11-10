// src/app/ClientLayout.tsx
"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/store/ReduxProvider";
import { store } from "@/store/store";
import TopNavbar from "@/components/TopNavbar";
import TopNavBarWarper from "@/components/TopNavBarWarper";
import ThemeWrapper from "@/components/ThemeWrapper";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <SessionProvider>
        <ThemeWrapper>
          <TopNavbar />
          <TopNavBarWarper>{children}</TopNavBarWarper>
        </ThemeWrapper>
      </SessionProvider>
    </ReduxProvider>
  );
}
