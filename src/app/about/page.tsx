import About from "@/components/About";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About My Daily Routine — Weekly Planner, Goal Tracker & AI Scheduler",
  description:
    "Learn how My Daily Routine helps freelancers, students, and remote workers build consistent daily habits with a weekly routine planner, goal tracker, daily stats, and an AI routine builder powered by Google Gemini. Free 30-day trial, no credit card required.",
  alternates: {
    canonical: "/about",
  },
};

export const revalidate = false;

export default function AboutPage() {
  return <About />;
}
