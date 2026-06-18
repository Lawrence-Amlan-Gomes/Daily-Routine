import Link from "next/link";
import Footer from "./Footer";

export default function About() {
  return (
    <div className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <div className="w-full border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] pt-28 sm:pt-32 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            About My Daily Routine
          </h1>
        </div>
      </div>

      <div className="flex-grow max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] py-12 md:py-16">
        <div className="max-w-2xl space-y-6 text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
          <p>
            My Daily Routine is a weekly routine planner, goal tracker, and
            AI-powered productivity tool — all in one app. You set up your
            routine once, track it every day, and build the kind of consistency
            that compounds over time.
          </p>
          <p>
            It&apos;s built for anyone who wants to turn intentions into habits:
            students, freelancers, remote workers, or anyone trying to add more
            structure to their week. Plan tasks by day and time, set goals with
            subtasks, and watch your completion stats grow.
          </p>
          <p>
            Every account starts with a free 30-day trial — no credit card
            required. Premium plans unlock an AI routine builder powered by
            Google Gemini, which generates a personalized weekly schedule based
            on your goals and lifestyle.
          </p>
        </div>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-block px-6 py-3 rounded-lg font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            Try it free — 30 days
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
