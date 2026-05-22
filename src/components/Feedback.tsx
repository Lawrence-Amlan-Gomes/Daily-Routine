// src/components/Feedback.tsx
"use client";

import { getMyFeedback, submitFeedback } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { logout } from "@/store/features/auth/authSlice";
import { Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export default function Feedback() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);

  const ONE_HOUR_MS = 60 * 60 * 1000;

  const calcRemainingMinutes = (updatedAt: string) => {
    const elapsed = Date.now() - new Date(updatedAt).getTime();
    if (elapsed >= ONE_HOUR_MS) return 0;
    return Math.ceil((ONE_HOUR_MS - elapsed) / 1000 / 60);
  };

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    const userEmail = user.email;
    let mounted = true;

    async function load() {
      try {
        const data = await getMyFeedback(userEmail);
        if (!mounted) return;
        if (data) {
          setRating(data.rating);
          setComment(data.comment);
          setIsEditMode(true);
          if (data.updatedAt) {
            setCooldownMinutes(calcRemainingMinutes(data.updatedAt));
          }
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          dispatch(logout());
        } else {
          console.error("Failed to load feedback:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    if (cooldownMinutes <= 0) return;
    const interval = setInterval(() => {
      setCooldownMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [cooldownMinutes]);

  const handleSubmit = async () => {
    if (!user?.email) {
      toast.error("You must be logged in to submit feedback");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFeedback({ email: user.email, rating, comment });
      if (res.success) {
        toast.success(res.message);
        setIsEditMode(true);
        setCooldownMinutes(60);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message?.startsWith("COOLDOWN:")) {
        const minutes = parseInt(err.message.split(":")[1], 10);
        setCooldownMinutes(minutes);
        toast.error(
          `Please wait ${minutes} minute${minutes !== 1 ? "s" : ""} before updating again.`
        );
      } else {
        toast.error(err.message || "Failed to save feedback");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Guest CTA — shown to logged-out visitors on the landing page
  if (!user) {
    return (
      <div className="w-full px-5 sm:px-8 md:px-[10%]">
        <div className="max-w-3xl mx-auto text-center py-16 md:py-20 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">
            Get started today
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
            Ready to build better habits?
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Join users who use My Daily Routine to stay consistent, track
            progress, and actually achieve their goals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashBoard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
            >
              Start for free — 30 days
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full px-5 sm:px-8 md:px-[10%]">
        <div className="max-w-xl mx-auto py-16 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-5 sm:px-8 md:px-[10%]">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            Your review
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {isEditMode ? "Update your review" : "Share your experience"}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isEditMode
              ? "Your feedback helps other users discover My Daily Routine."
              : "Your honest opinion helps us improve the product."}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-sm">
          {/* Star rating */}
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-105 touch-manipulation"
              >
                <Star
                  size={36}
                  className={`transition-all duration-150 ${
                    star <= (hovered || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 dark:text-gray-700 fill-none"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What do you like? What could be better? (optional)"
            rows={4}
            maxLength={2000}
            className="w-full p-4 rounded-xl border resize-none mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || cooldownMinutes > 0}
            className={`w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              rating === 0 || cooldownMinutes > 0
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            }`}
          >
            {submitting
              ? "Saving..."
              : cooldownMinutes > 0
                ? `Wait ${cooldownMinutes} min${cooldownMinutes !== 1 ? "s" : ""} to edit`
                : isEditMode
                  ? "Update review"
                  : "Submit review"}
          </button>

          {isEditMode && cooldownMinutes > 0 && (
            <p className="text-xs text-center mt-4 text-gray-400 dark:text-gray-500">
              You can edit again in {cooldownMinutes} minute
              {cooldownMinutes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
