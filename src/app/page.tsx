// src/app/home/page.tsx
import LandingPage from "@/components/Landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Planner and Routine Tracker",
  description:
    "Build better habits with a daily routine planner, goal tracking, and productivity insights in one app.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPageHome() {
  return <LandingPage />;
}
