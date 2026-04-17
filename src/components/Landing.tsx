"use client";
import Feedback from "./Feedback";
import Footer from "./Footer";
import Hero from "./Hero";
import HowToUse from "./HowToUse";
import LandingFeedbackMarquee from "./LandingFeedbackMarquee";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] dark:bg-[#000000] text-[#0a0a0a] dark:text-[#eeeeee]">
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 sm:pt-32 md:pt-36 pb-16 md:pb-24">
          <Hero />
        </section>

        {/* Divider */}
        <div className="w-full px-5 sm:px-8 md:px-[10%]">
          <hr className="border-gray-100 dark:border-gray-900" />
        </div>

        {/* How To Use */}
        <section className="py-16 md:py-24">
          <HowToUse />
        </section>

        {/* Social proof marquee */}
        <section className="py-8 md:py-12 bg-gray-50 dark:bg-gray-950 border-y border-gray-100 dark:border-gray-900">
          <LandingFeedbackMarquee />
        </section>

        {/* Testimonials / Feedback (manages own padding) */}
        <section className="py-16 md:py-24">
          <Feedback />
        </section>

      </main>

      <Footer />
    </div>
  );
}
