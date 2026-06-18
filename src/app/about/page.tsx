import About from "@/components/About";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "My Daily Routine is a weekly routine planner, goal tracker, and AI-powered productivity tool — free 30-day trial, no credit card required.",
  alternates: {
    canonical: "/about",
  },
};

export const revalidate = false;

export default function AboutPage() {
  return <About />;
}
