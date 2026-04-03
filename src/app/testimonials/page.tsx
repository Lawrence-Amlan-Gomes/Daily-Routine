// src/app/testimonials/page.tsx
import Testimonials from "@/components/Testimonials";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "See how people use My Daily Routine to organize tasks, stay consistent, and achieve goals.",
  alternates: {
    canonical: "/testimonials",
  },
};

export default function LandingPageHome() {
  return <Testimonials/>
}
