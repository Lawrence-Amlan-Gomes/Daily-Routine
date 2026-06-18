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

export const revalidate = false;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is there a free trial?", acceptedAnswer: { "@type": "Answer", text: "Yes — 30 days free, no credit card required." } },
    { "@type": "Question", name: "What's included in the free trial?", acceptedAnswer: { "@type": "Answer", text: "Full access to routine editor, goals, subtasks, and daily stats." } },
    { "@type": "Question", name: "Can I cancel anytime?", acceptedAnswer: { "@type": "Answer", text: "Yes — cancel from your account settings. No lock-in." } },
    { "@type": "Question", name: "What's the difference between Standard and Premium?", acceptedAnswer: { "@type": "Answer", text: "Standard adds advanced stats and visual charts. Premium adds AI routine builder powered by Google Gemini (100 AI responses/month)." } },
    { "@type": "Question", name: "Is my data private?", acceptedAnswer: { "@type": "Answer", text: "Yes — your data is stored securely and never shared or sold." } },
  ],
};

export default function LandingPageHome() {
  return (
    <>
      <LandingPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
