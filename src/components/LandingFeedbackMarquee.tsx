"use client";

import { getPublicFeedbacks } from "@/app/actions";
import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useMemo, useState } from "react";

type PublicFeedback = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  updatedAt: string | null;
};

const stars = (count: number) => "★".repeat(count) + "☆".repeat(5 - count);

export default function LandingFeedbackMarquee() {
  const { theme } = useTheme();
  const [items, setItems] = useState<PublicFeedback[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublicFeedbacks();
        setItems(data);
      } catch (error) {
        console.error("Failed to load public feedbacks:", error);
      }
    };
    load();
  }, []);

  const loopItems = useMemo(() => {
    if (items.length === 0) return [];
    // Duplicate once for seamless loop animation.
    return [...items, ...items];
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="w-full px-5 sm:px-8 md:px-[10%] mb-16">
      <div className="text-center mb-7">
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
            theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
          }`}
        >
          What Users Say
        </h2>
        <p
          className={`mt-2 text-sm sm:text-base ${theme ? "text-gray-600" : "text-gray-400"}`}
        >
          Real ratings and comments from Daily Routine users.
        </p>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-feedback-marquee gap-4 sm:gap-6 py-2">
          {loopItems.map((item, index) => (
            <article
              key={`${item._id}-${index}`}
              className={`w-[280px] sm:w-[330px] rounded-2xl border p-4 sm:p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 ${
                theme
                  ? "bg-white border-gray-200 text-gray-900"
                  : "bg-[#0f0f0f] border-gray-800 text-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold truncate">{item.userName}</p>
                <p className="text-yellow-500 text-sm sm:text-base">
                  {stars(item.rating)}
                </p>
              </div>
              <p
                className={`text-sm leading-relaxed line-clamp-5 ${theme ? "text-gray-700" : "text-gray-300"}`}
              >
                {item.comment}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
