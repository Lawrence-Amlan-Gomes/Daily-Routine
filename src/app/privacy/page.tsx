// src/app/terms-and-conditions/page.tsx
import PrivacyPolicy from "@/components/PrivacyPolicy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the privacy policy for My Daily Routine and how user data is handled.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function LandingPageHome() {
  return <PrivacyPolicy/>
}
