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
    { "@type": "Question", name: "Is there a free trial?", acceptedAnswer: { "@type": "Answer", text: "Yes — every new account gets a full 30-day free trial with no credit card required. You get access to the routine editor, goal tracker, subtasks, and daily completion stats from day one." } },
    { "@type": "Question", name: "What's included in the free trial?", acceptedAnswer: { "@type": "Answer", text: "The free trial includes full access to the weekly routine planner, unlimited routine tasks, goal tracking with subtasks, priority levels, tags, repeat schedules, and daily completion stats. No feature is locked during the trial period." } },
    { "@type": "Question", name: "Can I cancel anytime?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Cancel your subscription at any time directly from your account settings. When you cancel, you keep full access until the end of your current billing period — no immediate cutoff, no fees, no lock-in." } },
    { "@type": "Question", name: "What's the difference between Standard and Premium?", acceptedAnswer: { "@type": "Answer", text: "Standard adds advanced stats and visual habit charts. Premium adds everything in Standard plus the AI routine builder powered by Google Gemini — up to 100 AI interactions per month to generate a personalized weekly schedule." } },
    { "@type": "Question", name: "How does the AI routine builder work?", acceptedAnswer: { "@type": "Answer", text: "The AI routine builder is powered by Google Gemini. You describe your goals, lifestyle, and constraints, and it generates a structured weekly routine tailored to you. It's conversational — you can refine and iterate until the schedule fits your life." } },
    { "@type": "Question", name: "What is a daily routine planner?", acceptedAnswer: { "@type": "Answer", text: "A daily routine planner helps you structure your day by scheduling recurring tasks at specific times. My Daily Routine lets you plan tasks across all seven days, categorize them, and track whether you complete them each day." } },
    { "@type": "Question", name: "How do I build a daily routine that actually sticks?", acceptedAnswer: { "@type": "Answer", text: "Routines stick when tied to specific times, are realistically achievable, and are tracked consistently. Start with 3–5 high-impact tasks per day, assign them specific time slots, and track your completion rate. My Daily Routine's stats show your streak and percentage over time to reinforce the habit." } },
    { "@type": "Question", name: "Can I track multiple goals at once?", acceptedAnswer: { "@type": "Answer", text: "Yes. Create as many goals as you need, each with subtasks, priority level, status, repeat schedule, and tags. Goals are displayed in a board view so you can see everything at a glance." } },
    { "@type": "Question", name: "What are subtasks and how do they work?", acceptedAnswer: { "@type": "Answer", text: "Subtasks are smaller action items nested under a parent goal. For example, 'Launch my website' might have subtasks like 'Write homepage copy' and 'Configure domain'. You can check off subtasks as you complete them. Subtasks are available on all plans." } },
    { "@type": "Question", name: "Does My Daily Routine work on mobile?", acceptedAnswer: { "@type": "Answer", text: "Yes — the web app is fully responsive and works on any modern smartphone or tablet browser. No separate native app download is required." } },
    { "@type": "Question", name: "How do I track my daily completion stats?", acceptedAnswer: { "@type": "Answer", text: "Every time you mark a routine task as complete, it's logged in your stats. The stats page shows your daily completion rate, which tasks you completed on which days, and trends over time visualized with charts." } },
    { "@type": "Question", name: "Can I set repeat schedules for goals?", acceptedAnswer: { "@type": "Answer", text: "Yes. Goals support repeat schedules so you can set them to recur daily, weekly, monthly, or on a custom pattern. Recurring goals automatically reset based on your chosen schedule." } },
    { "@type": "Question", name: "What payment methods are accepted?", acceptedAnswer: { "@type": "Answer", text: "Payments are handled securely by Paddle. Paddle accepts all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and many local payment methods depending on your region." } },
    { "@type": "Question", name: "Is my data private and secure?", acceptedAnswer: { "@type": "Answer", text: "Yes. Your routine, goals, and stats are stored securely and never shared with or sold to third parties. Passwords are hashed using bcrypt. We never store plain-text passwords or card details." } },
    { "@type": "Question", name: "Can I use the app without an AI subscription?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. The AI routine builder is an optional Premium feature. The core routine planner, goal tracker, subtasks, and stats are fully usable on the free and Standard tiers without any AI component." } },
    { "@type": "Question", name: "How do I change or update my routine?", acceptedAnswer: { "@type": "Answer", text: "Open the Dashboard, navigate to the routine editor, and add, remove, or reorder tasks for any day. Changes take effect immediately. You can update your routine as your life changes — there's no limit to how many times you can revise it." } },
    { "@type": "Question", name: "Is there a limit on how many tasks I can add?", acceptedAnswer: { "@type": "Answer", text: "No hard limit. You can add as many tasks as you need across all seven days. That said, we recommend 5–10 focused tasks per day for maximum follow-through." } },
    { "@type": "Question", name: "What if I miss a day?", acceptedAnswer: { "@type": "Answer", text: "Missing a day doesn't reset your goals or delete your data. Your stats will reflect the missed day honestly, helping you spot the patterns that lead to missed days so you can address the root cause." } },
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
