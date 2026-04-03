// src/app/pricing/page.tsx
import Pricing from "@/components/Pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare plans and choose the Daily Routine subscription that fits your productivity goals.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function LandingPageHome() {
  return <Pricing />;
}
