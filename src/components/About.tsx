import Link from "next/link";
import Footer from "./Footer";

export default function About() {
  return (
    <div className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">

      {/* Hero */}
      <div className="w-full border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 md:px-[10%] pt-28 sm:pt-32 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            About My Daily Routine
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
            My Daily Routine is a weekly routine planner, goal tracker, and AI-powered productivity tool &mdash; built
            for people who want to turn intentions into consistent daily action.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow max-w-4xl mx-auto px-5 sm:px-8 md:px-[10%] py-14 md:py-20">
        <div className="space-y-16 text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">

          {/* Our Mission */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Our Mission
            </h2>
            <p>
              Most people know what they should be doing every day. The gap is execution &mdash; turning good intentions
              into consistent action, week after week. My Daily Routine exists to close that gap. We built a tool that
              makes it effortless to design a weekly routine, track daily completion, and measure your consistency over
              time. Not through gamification gimmicks or endless notifications, but through honest data and a clean,
              distraction-free interface that gets out of your way.
            </p>
          </div>

          {/* What is My Daily Routine */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Is My Daily Routine?
            </h2>
            <p className="mb-4">
              My Daily Routine is a web-based productivity application that combines three core tools into one:
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Weekly Routine Planner</strong> &mdash; schedule
                  recurring tasks across all seven days, assigned to specific times and categories. Your routine becomes
                  your default, not a decision you have to make each morning.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Goal Tracker with Subtasks</strong> &mdash; set
                  meaningful goals with subtasks, priority levels (Low to Critical), repeat schedules, tags, and
                  statuses. See all your goals in a board view and break big ambitions into actionable steps.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Daily Stats and Habit Analytics</strong> &mdash;
                  every completed task is logged. The stats page shows your daily completion rate, which tasks you
                  followed through on, and trends over time so you can see your consistency compound.
                </span>
              </li>
            </ul>
            <p className="mt-4">
              On Premium plans, a fourth tool unlocks: the{" "}
              <strong className="text-gray-900 dark:text-gray-100">AI Routine Builder</strong>, powered by Google
              Gemini, which generates a personalized weekly schedule based on your goals, lifestyle, and instructions.
            </p>
          </div>

          {/* Who It Is For */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Who Is It For?
            </h2>
            <p className="mb-4">
              My Daily Routine is built for anyone who creates their own schedule rather than following one set by an
              employer or institution. That includes:
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Freelancers and solopreneurs</strong> who need
                  self-imposed structure to stay productive without a boss or office environment.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Remote workers</strong> who want to separate
                  their work and personal time with clear daily routines and habits.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Students</strong> who need to balance classes,
                  study blocks, health habits, and personal goals across a busy week.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Entrepreneurs</strong> building a side project
                  or startup who need to protect high-value time blocks and track progress on multiple parallel goals.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Anyone building better habits</strong> &mdash;
                  morning routines, exercise habits, learning goals, creative practices &mdash; who wants more than a
                  paper list or a generic to-do app.
                </span>
              </li>
            </ul>
          </div>

          {/* Why Routines Work */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Daily Routines Work (and Why Most People Fail at Them)
            </h2>
            <p className="mb-4">
              Research from MIT, Duke University, and behavioral psychologists like BJ Fogg consistently shows that
              habit formation works best when behaviors are tied to specific times and contexts &mdash; not general
              intentions. When you decide each morning what to do, you deplete decision-making energy before you have
              started. When you have already decided &mdash; &ldquo;I exercise at 7am on weekdays&rdquo; &mdash; the
              behavior becomes automatic.
            </p>
            <p className="mb-4">
              The reason most people fail at building routines is not motivation. It is design. They build routines
              that are too ambitious, not specific enough, or have no feedback mechanism. My Daily Routine addresses
              all three: you design a realistic schedule, tasks are tied to specific days and times, and your
              completion stats give you honest feedback on what is working.
            </p>
            <p>
              Tracking your completion rate &mdash; even imperfectly &mdash; makes you dramatically more consistent
              than not tracking at all. The simple act of seeing &ldquo;I completed 7 of 9 tasks today&rdquo; creates
              a feedback loop that reinforces the behavior. Over weeks, those percentages compound into real habit change.
            </p>
          </div>

          {/* AI Routine Builder */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              The AI Routine Builder
            </h2>
            <p className="mb-4">
              Starting a new routine from scratch is one of the hardest steps. The Premium AI Routine Builder removes
              the blank-page problem. Powered by Google Gemini, it knows your existing routine and your goals, and it
              will have a conversation with you to generate a personalized weekly schedule.
            </p>
            <p className="mb-4">
              You describe your constraints &mdash; work hours, energy patterns, commitments &mdash; and the AI
              produces a structured, time-blocked routine for the week. You can iterate conversationally: ask it to
              move your workout to mornings, lighten Fridays, or add a reading block before bed. It adjusts and
              regenerates based on your feedback.
            </p>
            <p>
              The AI Routine Builder is included in Premium plans, with up to 100 AI interactions per month. It is
              designed as a starting-point and planning assistant &mdash; you still own and control your routine, the
              AI just helps you design a better one faster.
            </p>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Pricing &mdash; Simple and Flexible
            </h2>
            <p className="mb-4">
              My Daily Routine offers a free 30-day trial with no credit card required. After the trial, you can
              continue on the free tier or upgrade:
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Free</strong> &mdash; Core routine planner
                  and basic goal tracking. No time limit.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Standard</strong> &mdash; Advanced stats,
                  visual habit charts, and deeper analytics. Available monthly or annually.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Premium</strong> &mdash; Everything in
                  Standard plus the AI Routine Builder (100 AI responses/month). Available monthly or annually.
                </span>
              </li>
            </ul>
            <p className="mt-4">
              All paid plans can be cancelled at any time. When you cancel, you keep access until the end of your
              billing period.
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Privacy and Data Security
            </h2>
            <p className="mb-4">
              Your routine, goals, and stats are stored securely and are never sold to or shared with third parties.
              Passwords are hashed using bcrypt before storage &mdash; we never store plain-text credentials. Profile
              photos are stored in a private, access-controlled file store and served over HTTPS. Payments are
              processed entirely by Paddle, a certified payment processor &mdash; we never see or store your card
              details.
            </p>
            <p>
              We use Google Analytics to understand aggregate usage patterns (which pages are visited, how people
              navigate the app). We do not sell, rent, or share individual user data. Your routine is yours.
            </p>
          </div>

          {/* Built for Reliability */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Built for Reliability
            </h2>
            <p className="mb-4">
              My Daily Routine is a web application built on Next.js and React, with a MongoDB database, self-hosted
              on a dedicated VPS for predictable performance. The app works reliably on any modern browser, on any
              device, without an app store download.
            </p>
            <p>
              We prioritize reliability and data integrity above feature velocity. Your routine data is never deleted
              without your action, your completion history is permanent, and the app is designed to work even on slow
              connections. We keep the interface lean and fast so every interaction feels immediate.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Ready to Build a Routine That Actually Sticks?
            </h2>
            <p className="mb-8">
              Start your free 30-day trial today &mdash; no credit card required. Build your first routine in minutes,
              track your first week, and see what consistent execution actually feels like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-block px-6 py-3 rounded-lg font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-center"
              >
                Try it free &mdash; 30 days
              </Link>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-center"
              >
                View pricing
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
