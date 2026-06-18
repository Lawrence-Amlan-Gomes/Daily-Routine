"use client";

import { getPublicFeedbacks } from "@/app/actions";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import Footer from "./Footer";

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

  const palette = [
    "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300",
  ];
  const colorClass = palette[name.charCodeAt(0) % palette.length];

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}
    >
      {initials || "?"}
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState<PublicFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPublicFeedbacks();
        if (mounted) setItems(data);
      } catch (err) {
        console.error("Failed to load testimonials:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const avgRating =
    items.length > 0
      ? items.reduce((sum, i) => sum + i.rating, 0) / items.length
      : 0;

  return (
    <div className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      {/* Page header */}
      <div className="w-full border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] pt-28 sm:pt-32 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            Reviews
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            What people are saying
          </h1>
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                &mdash; {items.length} review{items.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] py-12 md:py-16 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-44 animate-pulse bg-gray-50 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-gray-950 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200"
              >
                <StarRating rating={item.rating} />
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 flex-1">
                  &ldquo;{item.comment}&rdquo;
                </p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <UserAvatar name={item.userName} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.userName}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
