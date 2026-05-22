"use client";

import { getPublicFeedbacks } from "@/app/actions";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PublicFeedback = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  updatedAt: string | null;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 dark:text-gray-600 fill-none"
          }`}
        />
      ))}
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Deterministic color from name
  const colors = [
    "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300",
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}
    >
      {initials || "?"}
    </div>
  );
}

export default function LandingFeedbackMarquee() {
  const [items, setItems] = useState<PublicFeedback[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPublicFeedbacks();
        if (mounted) setItems(data);
      } catch (error) {
        console.error("Failed to load public feedbacks:", error);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const loopItems = useMemo(() => {
    if (items.length === 0) return [];
    return [...items, ...items];
  }, [items]);

  if (items.length === 0) return null;

  const avgRating =
    items.reduce((sum, i) => sum + i.rating, 0) / items.length;

  return (
    <div className="w-full py-2">
      {/* Section header */}
      <div className="text-center mb-10 px-5 sm:px-8 md:px-[10%]">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
          Testimonials
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0a0a0a] dark:text-[#ebebeb]">
          Loved by productive people
        </h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            &mdash; {items.length} review{items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-feedback-marquee gap-4 sm:gap-5 py-2 px-4">
          {loopItems.map((item, index) => (
            <article
              key={`${item._id}-${index}`}
              className="w-[280px] sm:w-[320px] rounded-2xl border p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 flex flex-col gap-3"
            >
              {/* Stars + rating */}
              <StarRating rating={item.rating} />

              {/* Quote */}
              <p className="text-sm leading-relaxed line-clamp-4 text-gray-700 dark:text-gray-300 flex-1">
                &ldquo;{item.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                <UserAvatar name={item.userName} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.userName}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
