// src/components/Admin.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { getAllFeedbacks } from "@/app/actions";
import { format } from "date-fns";

type FeedbackItem = {
  _id: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string } | null;
};

export default function Admin() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.email || !auth.isAdmin) return;

    async function load() {
      try {
        const data = await getAllFeedbacks(auth.email);
        setFeedbacks(data);
      } catch (err) {
        console.error("Failed to load feedbacks:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth?.email, auth?.isAdmin]);

  if (loading) {
    return <div className={`text-center pt-[80px] sm:pt-[120px] ${theme ? "text-gray-900" : "text-gray-100"}`}>Loading feedback...</div>;
  }

  return (
    <div className={`min-h-screen pt-[80px] sm:pt-[120px] pb-20 px-4 sm:px-8`}>
      <div className="max-w-6xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-2 ${theme ? "text-gray-900" : "text-gray-100"}`}
        >
          Admin – User Feedback
        </h1>
        <p className={`mb-8 ${theme ? "text-gray-900" : "text-gray-100"}`}>
          {feedbacks.length} {feedbacks.length === 1 ? "entry" : "entries"}
        </p>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12 opacity-70 text-lg">
            No feedback has been submitted yet.
          </div>
        ) : (
          <div
            className={`overflow-x-auto rounded-xl border scrollbar-thin shadow-sm ${theme ? "scrollbar-thumb-gray-400 scrollbar-track-gray-200" : "scrollbar-thumb-gray-600 scrollbar-track-gray-900"} ${theme ? "border-gray-200" : "border-gray-800"}`}
          >
            <table
              className={`min-w-full divide-y ${theme ? "divide-gray-200" : "divide-gray-800"}`}
            >
              <thead className={theme ? "bg-gray-100" : "bg-gray-900"}>
                <tr className={theme ? "text-gray-900" : "text-gray-100"}>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-24">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider min-w-[400px] sm:min-w-[600px] lg:min-w-[750px]">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-64">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-40">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-48">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${theme ? "divide-gray-200 bg-white text-gray-900" : "divide-gray-800 bg-gray-950 text-gray-100"}`}
              >
                {feedbacks.map((fb) => (
                  <tr
                    key={fb._id}
                    className="hover:bg-opacity-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-lg">
                      {"★".repeat(fb.rating)}
                      {"☆".repeat(5 - fb.rating)}
                    </td>
                    <td className="px-6 py-4 min-w-[400px] sm:min-w-[600px] lg:min-w-[750px]">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {fb.comment || (
                          <i className="opacity-60 italic">
                            No comment provided
                          </i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {fb.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {fb.user?.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-80">
                      {format(new Date(fb.updatedAt), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
