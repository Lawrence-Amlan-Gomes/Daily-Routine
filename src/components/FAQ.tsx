"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Is there a free trial?",
    a: "Yes — every new account gets a full 30-day free trial with no credit card required. You get access to the routine editor, goal tracker, subtasks, and daily completion stats from day one. After 30 days, you choose the plan that fits you best or downgrade to the free tier.",
  },
  {
    q: "What's included in the free trial?",
    a: "The free trial includes full access to the weekly routine planner, unlimited routine tasks organized by day and time, goal tracking with subtasks, priority levels, tags, and repeat schedules, plus daily completion stats that show your consistency over time. No feature is locked during the trial period.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel your subscription at any time directly from your account settings with one click. When you cancel, you keep full access until the end of your current billing period — no immediate cutoff, no fees, no lock-in of any kind.",
  },
  {
    q: "What's the difference between Standard and Premium?",
    a: "The free tier gives you the core routine planner and basic goal tracking. Standard adds advanced stats, visual charts powered by Recharts, and deeper completion analytics so you can spot trends in your habits. Premium adds everything in Standard plus the AI routine builder powered by Google Gemini — which can generate a fully personalized weekly schedule based on your goals, lifestyle, and preferences. Premium accounts get up to 100 AI responses per month.",
  },
  {
    q: "How does the AI routine builder work?",
    a: "The AI routine builder is powered by Google Gemini and uses your existing routine, goals, and any instructions you give it to generate a personalized weekly schedule. You chat with the AI, describe your goals and daily constraints, and it produces a structured routine you can review and apply. It's conversational — you can refine, adjust, and iterate until the schedule fits your life. Premium plan users get up to 100 AI interactions per month.",
  },
  {
    q: "What is a daily routine planner?",
    a: "A daily routine planner is a tool that helps you structure your day by scheduling recurring tasks at specific times. Instead of relying on memory or willpower, you build a repeatable template for your week — with tasks assigned to specific days and time slots. My Daily Routine lets you plan tasks across all seven days, categorize them, and track whether you complete them each day. Over time, your routine becomes a habit, not a chore.",
  },
  {
    q: "How do I build a daily routine that actually sticks?",
    a: "The research on habit formation shows that routines stick when they're tied to specific times, are realistically achievable, and are tracked consistently. Start small: pick 3–5 high-impact tasks for each day, assign them specific time slots, and track your completion rate daily. My Daily Routine's completion stats show you your streak and percentage over time — that feedback loop is what makes habits stick. The AI routine builder can also generate a balanced starting schedule if you're not sure where to begin.",
  },
  {
    q: "Can I track multiple goals at once?",
    a: "Yes. You can create as many goals as you need, each with its own subtasks, priority level (Low, Medium, High, Critical), status (Not Started, In Progress, Done), repeat schedule, and tags. Goals are displayed in a board view so you can see everything at a glance. Subtasks let you break down large goals into actionable steps you can tick off one by one.",
  },
  {
    q: "What are subtasks and how do they work?",
    a: "Subtasks are smaller action items nested under a parent goal. For example, a goal like 'Launch my website' might have subtasks: 'Write homepage copy', 'Set up hosting', 'Configure domain'. You can check off subtasks as you complete them, and the parent goal tracks overall progress. Subtasks are available on all plans.",
  },
  {
    q: "Does My Daily Routine work on mobile?",
    a: "Yes — the web app is fully responsive and works on any modern smartphone or tablet browser. The layout adapts cleanly to smaller screens so you can check off tasks, update goals, and review your stats on the go. There is no separate native app download required; just open your browser, log in, and your full routine is there.",
  },
  {
    q: "How do I track my daily completion stats?",
    a: "Every time you mark a routine task as complete for the day, it's logged in your stats. The stats page shows you your daily completion rate, which tasks you completed on which days, and trends over time visualized with charts. This gives you an objective view of how consistent you're actually being — which is the most powerful motivator for building better habits.",
  },
  {
    q: "Can I set repeat schedules for goals?",
    a: "Yes. Goals support repeat schedules so you can set them to recur daily, weekly, monthly, or on a custom pattern. This is useful for recurring commitments like 'Review weekly goals every Sunday' or 'Monthly budget review'. Recurring goals automatically reset based on your chosen schedule.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Payments are handled securely by Paddle, our billing provider. Paddle accepts all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and many local payment methods depending on your region. All transactions are encrypted and we never store your card details.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Your routine, goals, and stats are stored securely in an encrypted database and are never shared with or sold to third parties. Profile photos are stored in a private, access-controlled S3-compatible store. Your password is hashed using bcrypt before storage — we never store plain-text passwords. We do not sell user data, period.",
  },
  {
    q: "Can I use the app without an AI subscription?",
    a: "Absolutely. The AI routine builder is an optional Premium feature. The core routine planner, goal tracker, subtasks, and stats are fully usable on the free and Standard tiers without any AI component. Most users build highly effective routines without the AI builder — it's there when you want a head start or a fresh perspective on your schedule.",
  },
  {
    q: "How do I change or update my routine?",
    a: "Open the Dashboard, navigate to the routine editor, and add, remove, or reorder tasks for any day. Changes take effect immediately and are reflected in your daily tracking. You can update your routine as your life changes — there's no limit to how many times you can revise it.",
  },
  {
    q: "Is there a limit on how many tasks I can add to my routine?",
    a: "No hard limit. You can add as many tasks as you need across all seven days. That said, we recommend keeping each day to 5–10 focused tasks for maximum follow-through — an overloaded schedule is one of the most common reasons routines fail.",
  },
  {
    q: "What if I miss a day?",
    a: "Missing a day doesn't reset your goals or delete your data. Your stats will reflect the missed day honestly, which is useful — it shows you where your consistency breaks down. The research on habit formation actually shows that missing one day rarely matters; the key is not missing two in a row. The stats page helps you spot the patterns that lead to missed days so you can address the root cause.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 w-full px-5 sm:px-8 md:px-[10%]">
      <div className="max-w-3xl mx-auto">

        {/* SEO content sections above accordion */}
        <div className="mb-16 space-y-12">
          <div className="text-center mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
              Everything You Need to Know
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Your Questions About Daily Routine Planning, Answered
            </h2>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Why Your Daily Routine Is the Foundation of Productivity
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              A consistent daily routine is the single most reliable productivity system ever studied. When your key tasks
              are scheduled at fixed times each day, your brain stops negotiating about whether to do them &mdash; it just
              does them. Researchers at MIT and Duke University estimate that up to 40% of our daily actions are habits,
              not conscious decisions. That means the more of your important work you can turn into automatic routine,
              the more cognitive bandwidth you free up for creative and high-stakes decisions. My Daily Routine is built
              specifically to help you design, track, and strengthen that foundation one day at a time.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              What Makes a Good Weekly Routine?
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              The best weekly routines share a few qualities: they are specific (tasks are assigned to exact days and
              times, not vague intentions), realistic (they account for your actual energy levels throughout the week),
              and tracked (you measure completion, not just intention). A good routine also has rhythm &mdash; anchor
              tasks that repeat every day create a stable backbone, while flexible slots allow for the unpredictable.
              My Daily Routine lets you build this structure day by day, assign categories to each task, and track your
              real completion rate so you can iterate toward a routine that actually works for your life.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              How Goal Tracking and Habit Tracking Work Together
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Daily habits are the engine; goals are the destination. My Daily Routine keeps both in the same place.
              Your routine handles the recurring daily actions that compound over time &mdash; workouts, deep work
              blocks, journaling &mdash; while the goal tracker manages the larger milestones you are working toward.
              Each goal can have subtasks, a priority level, a status, and a repeat schedule. When your habits (routine)
              directly feed your goals, you get a productivity system where every completed task moves the needle on
              something that matters.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              The Role of Completion Stats in Building Lasting Habits
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Tracking completion is not about guilt &mdash; it is about feedback. When you see your daily completion
              rate rise from 60% to 85% over six weeks, that data is motivating in a way no motivational quote ever
              could be. My Daily Routine records which tasks you completed on which days and surfaces that data as
              charts and trend lines. You can see at a glance whether Monday is your weakest day, whether evening
              tasks are harder to maintain than morning ones, and where your routine breaks down under stress. That
              insight is what lets you design a better routine, not just a more aspirational one.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              How the AI Routine Builder Gives You a Personalized Head Start
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Starting a new routine from scratch is one of the hardest parts. The AI Routine Builder &mdash; available
              on Premium plans and powered by Google Gemini &mdash; removes that blank-page problem. You describe your
              constraints: work hours, energy patterns, commitments. The AI produces a structured weekly routine
              tailored specifically to you. It is conversational, so you can refine and iterate: &ldquo;make Tuesday
              lighter,&rdquo; &ldquo;add a workout block every morning,&rdquo; &ldquo;I finish work at 6pm.&rdquo;
              The AI understands your existing routine and goals context, so its suggestions are grounded in what you
              are actually trying to accomplish &mdash; not generic productivity templates.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Who Benefits Most from a Daily Routine Planner?
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              My Daily Routine is built for anyone who operates without a fixed external schedule &mdash; freelancers,
              remote workers, students, entrepreneurs, and self-employed professionals who need to create their own
              structure rather than follow one imposed by an employer. It is also popular with people in structured
              jobs who want to build strong morning or evening routines outside work hours. If you have ever thought
              &ldquo;I know what I should be doing every day &mdash; I just cannot make myself do it
              consistently,&rdquo; a routine planner is exactly the tool that closes that gap.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
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
