// src/app/terms-and-conditions/page.tsx
import TermsAndConditions from "@/components/TermsAndConditions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the terms and conditions for using My Daily Routine.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default function LandingPageHome() {
  return <TermsAndConditions/>
}
