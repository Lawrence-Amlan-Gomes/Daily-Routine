// src/components/Admin.tsx
"use client";

import { getAllFeedbacks, getAllUsers } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { format } from "date-fns";
import {
  ChevronDown,
  Filter,
  Menu,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type FeedbackItem = {
  _id: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: string | null;
  updatedAt: string | null;
  user?: { name: string; email: string } | null;
};

type UserItem = {
  _id: string;
  name: string;
  email: string;
  createdAt: string | null;
  expiredAt: string | null;
  paymentType: string;
  isEmailVerified: boolean;
  isRegisteredWithGoogle: boolean;
};

type AdminView = "feedback" | "users";

export default function Admin() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AdminView>("feedback");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  useEffect(() => {
    if (!auth?.email || !auth.isAdmin) {
      setLoading(false);
      return;
    }
    const adminEmail = auth.email;

    async function load() {
      try {
        const [feedbacksData, usersData] = await Promise.all([
          getAllFeedbacks(adminEmail),
          getAllUsers(),
        ]);
        setFeedbacks(feedbacksData);
        setUsers(usersData);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth?.email, auth?.isAdmin]);

  const filteredFeedbacks =
    ratingFilter === "all"
      ? feedbacks
      : feedbacks.filter((fb) => fb.rating === ratingFilter);

  const getSubscriptionStats = () => {
    const stats = users.reduce(
      (acc, user) => {
        const plan = user.paymentType.toLowerCase().includes("free")
          ? "Free"
          : user.paymentType.toLowerCase().includes("standard")
            ? "Standard"
            : user.paymentType.toLowerCase().includes("premium")
              ? "Premium"
              : "Other";
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      Free: stats.Free || 0,
      Standard: stats.Standard || 0,
      Premium: stats.Premium || 0,
    };
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme ? "bg-gray-50" : "bg-gray-900"}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const subscriptionStats = getSubscriptionStats();

  return (
    <div className={`min-h-screen flex ${theme ? "bg-gray-50" : "bg-black"}`}>
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 ${theme ? "bg-white border-gray-200" : "bg-[#111111] border-gray-800"} border-r min-h-screen pt-16 lg:pt-16`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1
              className={`font-bold text-xl ${sidebarOpen ? "block" : "hidden"} ${theme ? "text-gray-900" : "text-gray-100"}`}
            >
              Admin Panel
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${theme ? "hover:bg-gray-100 text-gray-600" : "hover:bg-gray-800 text-gray-400"}`}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("feedback")}
              className={`w-full flex items-center ${sidebarOpen ? "px-4" : "px-2 justify-center"} py-3 rounded-lg transition-colors ${
                currentView === "feedback"
                  ? theme
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-blue-900/30 text-blue-400 border border-blue-700"
                  : theme
                    ? "hover:bg-gray-100 text-gray-700"
                    : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              <MessageSquare size={20} />
              {sidebarOpen && <span className="ml-3">Feedback</span>}
            </button>

            <button
              onClick={() => setCurrentView("users")}
              className={`w-full flex items-center ${sidebarOpen ? "px-4" : "px-2 justify-center"} py-3 rounded-lg transition-colors ${
                currentView === "users"
                  ? theme
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-blue-900/30 text-blue-400 border border-blue-700"
                  : theme
                    ? "hover:bg-gray-100 text-gray-700"
                    : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              <Users size={20} />
              {sidebarOpen && <span className="ml-3">Users</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-16">
        <div className="p-8">
          {currentView === "feedback" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1
                    className={`text-3xl font-bold ${theme ? "text-gray-900" : "text-gray-100"}`}
                  >
                    User Feedback
                  </h1>
                  <p
                    className={`mt-2 ${theme ? "text-gray-600" : "text-gray-200"}`}
                  >
                    {filteredFeedbacks.length}{" "}
                    {filteredFeedbacks.length === 1 ? "entry" : "entries"}
                    {ratingFilter !== "all" &&
                      ` (filtered by ${ratingFilter} stars)`}
                  </p>
                </div>

                {/* Rating Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${theme ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50" : "border-gray-600 bg-gray-950 text-gray-100 hover:bg-gray-800"}`}
                  >
                    <Filter size={16} className="mr-2" />
                    {ratingFilter === "all"
                      ? "All Ratings"
                      : `${ratingFilter} Stars`}
                    <ChevronDown size={16} className="ml-2" />
                  </button>

                  {showRatingDropdown && (
                    <div
                      className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-10 ${theme ? "bg-white border-gray-200" : "bg-gray-950 border-gray-700"}`}
                    >
                      <button
                        onClick={() => {
                          setRatingFilter("all");
                          setShowRatingDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 transition-colors ${theme ? "hover:bg-gray-50" : "hover:bg-gray-800"} ${ratingFilter === "all" ? (theme ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400") : ""}`}
                      >
                        All Ratings
                      </button>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => {
                            setRatingFilter(rating);
                            setShowRatingDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 transition-colors ${theme ? "hover:bg-gray-50" : "hover:bg-gray-800"} ${ratingFilter === rating ? (theme ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400") : theme ? "text-gray-700" : "text-gray-300"}`}
                        >
                          <span
                            className={
                              theme ? "text-amber-500" : "text-amber-400"
                            }
                          >
                            {"★".repeat(rating)}
                            {"☆".repeat(5 - rating)}
                          </span>{" "}
                          {rating} stars
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filteredFeedbacks.length === 0 ? (
                <div
                  className={`text-center py-12 rounded-lg ${theme ? "bg-gray-50 text-gray-500" : "bg-gray-950 text-gray-400"}`}
                >
                  {ratingFilter === "all"
                    ? "No feedback has been submitted yet."
                    : `No ${ratingFilter}-star feedback found.`}
                </div>
              ) : (
                <div
                  className={`rounded-xl border overflow-hidden shadow-sm ${theme ? "border-gray-200" : "border-gray-700"}`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={theme ? "bg-gray-100" : "bg-gray-900"}>
                        <tr
                          className={theme ? "text-gray-900" : "text-gray-100"}
                        >
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Comment
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${theme ? "divide-gray-200 bg-white text-gray-900" : "divide-gray-700 bg-gray-950 text-gray-100"}`}
                      >
                        {filteredFeedbacks.map((fb) => (
                          <tr
                            key={fb._id}
                            className={`transition-colors ${theme ? "hover:bg-gray-50" : "hover:bg-gray-800"}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-lg ${theme ? "text-amber-500" : "text-amber-400"}`}
                              >
                                {"★".repeat(fb.rating)}
                                {"☆".repeat(5 - fb.rating)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-md text-sm leading-relaxed">
                                {fb.comment || (
                                  <span className="italic opacity-60">
                                    No comment provided
                                  </span>
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
                              {fb.updatedAt
                                ? format(
                                    new Date(fb.updatedAt),
                                    "MMM d, yyyy HH:mm",
                                  )
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === "users" && (
            <div>
              <div className="mb-6">
                <h1
                  className={`text-3xl font-bold ${theme ? "text-gray-900" : "text-gray-100"}`}
                >
                  Active Users
                </h1>
                <p
                  className={`mt-2 ${theme ? "text-gray-600" : "text-gray-200"}`}
                >
                  {users.length} total users
                </p>
              </div>

              {/* Subscription Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                  className={`p-6 rounded-lg border transition-colors ${theme ? "bg-white border-gray-200 hover:shadow-md" : "bg-gray-950 border-gray-700 hover:shadow-lg"}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-full ${theme ? "bg-gray-100" : "bg-gray-800"}`}
                    >
                      <Users
                        size={24}
                        className={theme ? "text-gray-600" : "text-gray-400"}
                      />
                    </div>
                    <div className="ml-4">
                      <p
                        className={`text-sm font-medium ${theme ? "text-gray-600" : "text-gray-400"}`}
                      >
                        Free Users
                      </p>
                      <p
                        className={`text-2xl font-bold ${theme ? "text-gray-900" : "text-gray-100"}`}
                      >
                        {subscriptionStats.Free}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-lg border transition-colors ${theme ? "bg-white border-gray-200 hover:shadow-md" : "bg-gray-950 border-gray-700 hover:shadow-lg"}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-full ${theme ? "bg-blue-100" : "bg-blue-900/30"}`}
                    >
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p
                        className={`text-sm font-medium ${theme ? "text-gray-600" : "text-gray-400"}`}
                      >
                        Standard Users
                      </p>
                      <p
                        className={`text-2xl font-bold ${theme ? "text-gray-900" : "text-gray-100"}`}
                      >
                        {subscriptionStats.Standard}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-lg border transition-colors ${theme ? "bg-white border-gray-200 hover:shadow-md" : "bg-gray-950 border-gray-700 hover:shadow-lg"}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-full ${theme ? "bg-purple-100" : "bg-purple-900/30"}`}
                    >
                      <Users size={24} className="text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p
                        className={`text-sm font-medium ${theme ? "text-gray-600" : "text-gray-400"}`}
                      >
                        Premium Users
                      </p>
                      <p
                        className={`text-2xl font-bold ${theme ? "text-gray-900" : "text-gray-100"}`}
                      >
                        {subscriptionStats.Premium}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {users.length === 0 ? (
                <div
                  className={`text-center py-12 rounded-lg ${theme ? "bg-gray-50 text-gray-500" : "bg-gray-950 text-gray-400"}`}
                >
                  No users found.
                </div>
              ) : (
                <div
                  className={`rounded-xl border overflow-hidden shadow-sm ${theme ? "border-gray-200" : "border-gray-700"}`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={theme ? "bg-gray-100" : "bg-gray-900"}>
                        <tr
                          className={theme ? "text-gray-900" : "text-gray-100"}
                        >
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Email Verified
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Registration
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                            Expires
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${theme ? "divide-gray-200 bg-white text-gray-900" : "divide-gray-700 bg-gray-950 text-gray-100"}`}
                      >
                        {users.map((user) => (
                          <tr
                            key={user._id}
                            className={`transition-colors ${theme ? "hover:bg-gray-50" : "hover:bg-gray-800"}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.paymentType
                                    .toLowerCase()
                                    .includes("free")
                                    ? theme
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-gray-700 text-gray-300"
                                    : user.paymentType
                                          .toLowerCase()
                                          .includes("standard")
                                      ? theme
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-blue-900/30 text-blue-400"
                                      : user.paymentType
                                            .toLowerCase()
                                            .includes("premium")
                                        ? theme
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-purple-900/30 text-purple-400"
                                        : theme
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-gray-700 text-gray-300"
                                }`}
                              >
                                {user.paymentType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.isEmailVerified
                                    ? theme
                                      ? "bg-green-100 text-green-800"
                                      : "bg-green-900/30 text-green-400"
                                    : theme
                                      ? "bg-red-100 text-red-800"
                                      : "bg-red-900/30 text-red-400"
                                }`}
                              >
                                {user.isEmailVerified
                                  ? "Verified"
                                  : "Not Verified"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm opacity-80">
                              {user.createdAt
                                ? format(
                                    new Date(user.createdAt),
                                    "MMM d, yyyy",
                                  )
                                : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm opacity-80">
                              {user.expiredAt
                                ? format(
                                    new Date(user.expiredAt),
                                    "MMM d, yyyy",
                                  )
                                : "Never"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
