// src/components/Feedback.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { Star } from "lucide-react";
import { submitFeedback, getMyFeedback } from "@/app/actions";
import { toast } from "sonner"; // or react-hot-toast, etc.

export default function Feedback() {
  const { theme } = useTheme();
  const { user } = useAuth();

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
    if (!user?.email) return;

    async function load() {
      try {
        const data = await getMyFeedback(user.email);
        if (data) {
          setRating(data.rating);
          setComment(data.comment);
          setIsEditMode(true);

          if (data.updatedAt) {
            setCooldownMinutes(calcRemainingMinutes(data.updatedAt));
          }
        }
      } catch (err) {
        console.error("Failed to load feedback:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // tick the cooldown down every minute
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
      const res = await submitFeedback({
        email: user.email,
        rating,
        comment,
      });
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
        toast.error(`Please wait ${minutes} minute${minutes !== 1 ? "s" : ""} before updating again.`);
      } else {
        toast.error(err.message || "Failed to save feedback");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return;
  }

  if (loading) {
    return <div className="text-center py-20">Loading your feedback...</div>;
  }

  return (
    <div className={`min-h-screen pt-20 pb-16 px-5 sm:px-10`}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">
          {isEditMode ? "Edit Your Feedback" : "Share Your Feedback"}
        </h1>

        <p
          className={`text-center mb-10 ${theme ? "text-gray-600" : "text-gray-400"}`}
        >
          {isEditMode
            ? "You can update your rating or comment anytime."
            : "Your honest opinion helps us improve the product"}
        </p>

        {/* Stars – smaller on mobile, larger on sm+ */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
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
                size={32} // mobile
                className={`
          sm:size-12        // tablet/desktop
          transition-all duration-200
          fill-current stroke-current
          ${
            star <= (hovered || rating)
              ? "text-yellow-400 fill-yellow-400"
              : theme
                ? "text-gray-300"
                : "text-gray-600"
          }
        `}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What do you like? What could be better? (optional)"
          rows={5}
          maxLength={2000}
          className={`w-full p-4 rounded-xl border resize-none mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            theme
              ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              : "bg-gray-950 border-gray-800 text-gray-100 placeholder-gray-500"
          }`}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || cooldownMinutes > 0}
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            rating === 0 || cooldownMinutes > 0
              ? "bg-gray-600 text-gray-300"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          {submitting
          ? "Saving..."
          : cooldownMinutes > 0
            ? `Wait ${cooldownMinutes} min${cooldownMinutes !== 1 ? "s" : ""}`
            : isEditMode
              ? "Update Feedback"
              : "Submit Feedback"}
        </button>

        {isEditMode && (
          <p
            className={`text-xs text-center mt-5 opacity-70 ${theme ? "text-gray-500" : "text-gray-400"}`}
          >
            {cooldownMinutes > 0
              ? `You can edit again in ${cooldownMinutes} minute${cooldownMinutes !== 1 ? "s" : ""}`
              : "You can edit this anytime"}
          </p>
        )}
      </div>
    </div>
  );
}
