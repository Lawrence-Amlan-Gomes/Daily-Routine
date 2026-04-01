"use client";
import { useTheme } from "@/app/hooks/useTheme";
import Hero from "./Hero";
import Footer from "./Footer";
import Feedback from "./Feedback";
import HowToUse from "./HowToUse";

export default function LandingPage() {
  const {theme} = useTheme();
  return (
    <div
      className={`
        min-h-screen flex flex-col
        ${theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#eeeeee]"}
      `}
    >
      {/* Main content grows to push footer down */}
      <main className="flex-grow pt-[25%] sm:pt-[15%] px-4 sm:px-6 md:px-8 lg:px-10">
        <Hero />
      </main>
      <main className="flex-grow pt-[25%] sm:pt-[10%] px-4 sm:px-6 md:px-8 lg:px-10">
        <HowToUse/>
      </main>
      <main className="flex-grow pt-[5%] sm:pt-[1%] px-4 sm:px-6 md:px-8 lg:px-10">
        <Feedback/>
      </main>

      {/* Footer always at bottom */}
      <Footer />
    </div>
  );
}