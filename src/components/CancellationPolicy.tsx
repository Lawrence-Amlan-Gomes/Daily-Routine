"use client";
import { useTheme } from "@/app/hooks/useTheme";

export default function CancellationPolicy() {
  const { theme } = useTheme();

  return (
    <div
      className={`px-[8%] sm:px-[10%] mt-[20%] sm:mt-[10%] mb-[5%] pb-[5%] w-full ${
        theme ? "bg-[#ffffff] text-[#1f2937]" : "bg-[#000000] text-[#e5e7eb]"
      }`}
    >
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Cancellation Policy</h1>
        <p className="text-sm sm:text-base opacity-80 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-sm sm:text-base leading-7">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Cancel Anytime</h2>
            <p>
              You can cancel your subscription at any time from your billing settings
              or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Effective Date</h2>
            <p>
              Cancellation takes effect at the end of your current billing period unless
              otherwise stated by local law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Access After Cancellation</h2>
            <p>
              You retain paid access until the period ends, then your account may move
              to a free or restricted plan based on current product rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Support</h2>
            <p>
              For cancellation help, email{" "}
              <span className="font-medium">my.daily.routine.app@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
