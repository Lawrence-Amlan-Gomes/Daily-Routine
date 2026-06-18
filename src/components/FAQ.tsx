"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Is there a free trial?",
    a: "Yes — 30 days free, no credit card required.",
  },
  {
    q: "What's included in the free trial?",
    a: "Full access to the routine editor, goals, subtasks, and daily stats.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel from your account settings. No lock-in.",
  },
  {
    q: "What's the difference between Standard and Premium?",
    a: "Standard adds advanced stats and visual charts. Premium adds the AI routine builder powered by Google Gemini (100 AI responses/month).",
  },
  {
    q: "Is my data private?",
    a: "Yes — your data is stored securely and never shared or sold.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 w-full px-5 sm:px-8 md:px-[10%]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <div
              key={i}
              className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <span className="font-medium">{q}</span>
                <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 text-xl leading-none select-none">
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 pt-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
