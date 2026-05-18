// src/components/Pricing.tsx
"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import Link from "next/link";
import { useEffect } from "react";

export default function Pricing() {
  const { user: auth } = useAuth();

  const {
    billingPeriod,
    selectedPlan,
    isFreeTierExpired,
    setBillingPeriod,
    setSelectedPlan,
    setWantToPayment,
    setFreeTierExpired,
  } = usePrice();

  // ---- keep free-tier UI in sync with auth.paymentType ----
  useEffect(() => {
    if (auth && auth.paymentType === "Expired") {
      setFreeTierExpired(true);
    } else {
      setFreeTierExpired(false);
    }
  }, [auth, setFreeTierExpired]);

  const plans = [
    {
      id: "free",
      title: "Free",
      description: "Perfect for building your routine",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        { name: "time", value: "Free for 30 days only" },
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
        {
          name: "categories",
          value: "Task categories (Health, Work, Meals, etc.)",
        },
        { name: "goals", value: "Goal setting & tracking" },
        { name: "subtasks", value: "Break goals into subtasks" },
        {
          name: "priority",
          value: "Priority levels (Critical, High, Medium, Low)",
        },
        { name: "reminders", value: "Goal reminders & due dates" },
        { name: "repeat", value: "Repeating goals (daily, weekly, monthly)" },
        { name: "tags", value: "Organize goals with tags" },
        { name: "stats", value: "Basic completion statistics" },
        { name: "progress", value: "Track daily progress" },
      ],
      cta: "Start Free",
      isMostPopular: false,
    },
    {
      id: "standard",
      title: "Standard",
      description: "Ideal for serious routine planning",
      priceMonthly: 5,
      priceAnnual: 55,
      features: [
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
        {
          name: "categories",
          value: "Task categories (Health, Work, Meals, etc.)",
        },
        { name: "goals", value: "Goal setting & tracking" },
        { name: "subtasks", value: "Break goals into subtasks" },
        {
          name: "priority",
          value: "Priority levels (Critical, High, Medium, Low)",
        },
        { name: "reminders", value: "Goal reminders & due dates" },
        { name: "repeat", value: "Repeating goals (daily, weekly, monthly)" },
        { name: "tags", value: "Organize goals with tags" },
        { name: "stats", value: "Advanced completion statistics" },
        { name: "progress", value: "Track daily progress" },
        { name: "analytics", value: "Weekly & monthly progress reports" },
        { name: "charts", value: "Visual progress charts & graphs" },
        { name: "insights", value: "Productivity insights & trends" },
      ],
      cta: "Go Standard",
      isMostPopular: true,
      badge: "Most Popular",
    },
    {
      id: "premium",
      title: "Premium",
      description: "Routine builder + Personal AI assistant",
      priceMonthly: 10,
      priceAnnual: 110,
      features: [
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
        {
          name: "categories",
          value: "Task categories (Health, Work, Meals, etc.)",
        },
        { name: "goals", value: "Goal setting & tracking" },
        { name: "subtasks", value: "Break goals into subtasks" },
        {
          name: "priority",
          value: "Priority levels (Critical, High, Medium, Low)",
        },
        { name: "reminders", value: "Goal reminders & due dates" },
        { name: "repeat", value: "Repeating goals (daily, weekly, monthly)" },
        { name: "tags", value: "Organize goals with tags" },
        { name: "stats", value: "Advanced completion statistics" },
        { name: "progress", value: "Track daily progress" },
        { name: "analytics", value: "Weekly & monthly progress reports" },
        { name: "charts", value: "Visual progress charts & graphs" },
        { name: "insights", value: "Productivity insights & trends" },
        { name: "ai", value: "AI routine suggestions & optimization" },
        { name: "ai-chat", value: "Chat with AI for routine advice" },
        { name: "ai-responses", value: "100 AI responses per month" },
        { name: "ai-alerts", value: "AI-powered productivity alerts" },
      ],
      cta: "Go Premium",
      isMostPopular: false,
    },
    ...(auth?.isAdmin
      ? [
          {
            id: "test",
            title: "Test",
            displayTitle: "Test Annually",
            description: "Admin test for subscription flow",
            priceMonthly: 1,
            priceAnnual: 1,
            features: [
              { name: "admin", value: "Admin only test plan" },
              { name: "annual", value: "Test Annually (subscription)" },
              { name: "debug", value: "Debug payment & subscription flow" },
              { name: "billing", value: "Test billing & cancellation" },
              { name: "discount", value: "100% lifetime discount applied" },
            ],
            cta: "Test Purchase",
            isMostPopular: false,
            badge: "Admin Only",
          },
        ]
      : []),
  ];

  const getPrice = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return billingPeriod === "annual" ? plan!.priceAnnual : plan!.priceMonthly;
  };

  const getMonthlyEquivalent = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || plan.priceAnnual === 0) return null;
    return (plan.priceAnnual / 12).toFixed(2).replace(/\.00$/, "");
  };

  return (
    <div
      className={`h-full py-8 sm:pt-[6%] pt-[80px] px-4 sm:px-6 overflow-auto scrollbar relative bg-[#f8f9fb] scrollbar-thumb-black scrollbar-track-[#eeeeee] dark:bg-[#0a0a0f] dark:scrollbar-thumb-white dark:scrollbar-track-[#222222]`}
    >
      <div className="max-w-5xl mb-[5%] mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8 sm:mb-10">
          <span
            className={`inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900`}
          >
            Pricing
          </span>
          <h1
            className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[#0a0a0a] dark:text-[#f0f0f0]`}
          >
            Simple, transparent pricing
          </h1>
          <p
            className={`text-base sm:text-lg max-w-xl mx-auto text-gray-500 dark:text-gray-400`}
          >
            Start free, upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>

        {/* ── Billing toggle ── */}
        <div className="flex justify-center items-center gap-3 mb-8 sm:mb-10">
          <div
            className={`flex rounded-xl p-1 bg-gray-200/70 dark:bg-gray-900`}
          >
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Annually
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  billingPeriod === "annual"
                    ? "bg-green-500/20 text-green-600"
                    : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                }`}
              >
                Save 8%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plans grid ── */}
        <div
          className={`grid grid-cols-1 ${
            plans.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"
          } gap-4 sm:gap-5 items-start`}
        >
          {plans.map((plan) => {
            const price = getPrice(plan.id);
            const monthlyEquiv = getMonthlyEquivalent(plan.id);
            const isSelected = selectedPlan === plan.id;

            // Check if user has active subscription for this plan
            const userPlanType = auth?.paymentType?.split(" ").slice(0, -1).join(" ") || "";
            const userDuration = auth?.paymentType?.includes("Monthly") ? "monthly" :
                                auth?.paymentType?.includes("Annually") ? "annual" : "";
            const isUserSubscribedToPlan =
              auth?.paymentType &&
              auth.paymentType !== "Expired" &&
              userPlanType.toLowerCase() === plan.title.toLowerCase() &&
              userDuration === billingPeriod;
            const hasActiveSubscription = isUserSubscribedToPlan && auth?.expiredAt && new Date(auth.expiredAt) > new Date();

            const cardBase = `relative flex flex-col rounded-2xl transition-all duration-200 overflow-hidden`;
            const cardStyle = plan.isMostPopular
              ? `${cardBase} bg-white dark:bg-gray-950 border-2 border-blue-500 shadow-xl shadow-blue-100 dark:shadow-blue-950 ${isSelected ? "scale-[1.01]" : ""}`
              : plan.badge === "Admin Only"
                ? `${cardBase} bg-white border border-orange-300 dark:bg-gray-950 dark:border-orange-900`
                : `${cardBase} bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md dark:bg-gray-950 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:shadow-lg ${isSelected ? "shadow-md dark:shadow-lg" : ""}`;

            return (
              <div
                key={plan.id}
                className={`${cardStyle} cursor-pointer`}
                onMouseEnter={() => setSelectedPlan(plan.id)}
                onMouseLeave={() => setSelectedPlan(null)}
              >
                {/* Top accent bar for popular / admin */}
                {plan.isMostPopular && (
                  <div className="h-1 w-full bg-blue-500" />
                )}
                {plan.badge === "Admin Only" && (
                  <div className="h-1 w-full bg-orange-500" />
                )}

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {/* Title + Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100`}
                    >
                      {(plan as any).displayTitle || plan.title}
                    </h3>
                    {(plan.isMostPopular || plan.badge) && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          plan.badge === "Admin Only"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {plan.badge || "Most Popular"}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p
                    className={`text-sm mb-5 text-gray-500 dark:text-gray-400`}
                  >
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    {plan.id === "free" ? (
                      <div className="flex items-end gap-1">
                        <span
                          className={`text-4xl font-extrabold text-gray-900 dark:text-gray-100`}
                        >
                          $0
                        </span>
                        <span
                          className={`text-sm mb-1.5 text-gray-400 dark:text-gray-500`}
                        >
                          / 30 days
                        </span>
                      </div>
                    ) : billingPeriod === "annual" ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span
                            className={`text-4xl font-extrabold text-gray-900 dark:text-gray-100`}
                          >
                            ${price}
                          </span>
                          <span
                            className={`text-sm mb-1.5 text-gray-400 dark:text-gray-500`}
                          >
                            / year
                          </span>
                        </div>
                        {monthlyEquiv && (
                          <p
                            className={`text-xs mt-0.5 text-gray-400 dark:text-gray-500`}
                          >
                            ~${monthlyEquiv}/mo, billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span
                          className={`text-4xl font-extrabold text-gray-900 dark:text-gray-100`}
                        >
                          ${price}
                        </span>
                        <span
                          className={`text-sm mb-1.5 text-gray-400 dark:text-gray-500`}
                        >
                          / month
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA button */}
                  {plan.id === "free" ? (
                    isFreeTierExpired ? (
                      <div className="flex flex-col gap-2 mb-5">
                        <div className="w-full py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 text-center">
                          Free trial expired
                        </div>
                        <Link href={auth ? "/billing" : "/login"} className="w-full">
                          <button
                            onClick={() =>
                              setWantToPayment("Standard", billingPeriod)
                            }
                            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
                          >
                            Upgrade to continue →
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="mb-5">
                        <Link href={auth ? "/dashBoard" : "/login"} className="w-full">
                          <button
                            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
                          >
                            Use Now
                          </button>
                        </Link>
                      </div>
                    )
                  ) : hasActiveSubscription ? (
                    <div className="mb-5">
                      <Link href="/billing" className="w-full">
                        <button
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            plan.isMostPopular
                              ? "bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-200"
                              : plan.badge === "Admin Only"
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
                          }`}
                        >
                          ✓ Manage Subscription
                        </button>
                      </Link>
                    </div>
                  ) : auth ? (
                    <div className="mb-5">
                      <Link href="/billing" className="w-full">
                        <button
                          onClick={() =>
                            setWantToPayment(plan.title, billingPeriod)
                          }
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            plan.isMostPopular
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"
                              : plan.badge === "Admin Only"
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : plan.cta}
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="mb-5">
                      <Link href="/login" className="w-full">
                        <button
                          onClick={() =>
                            setWantToPayment(plan.title, billingPeriod)
                          }
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            plan.isMostPopular
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"
                              : plan.badge === "Admin Only"
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : plan.cta}
                        </button>
                      </Link>
                    </div>
                  )}

                  {/* Divider */}
                  <div
                    className={`h-px w-full mb-4 bg-gray-100 dark:bg-gray-800`}
                  />

                  {/* Features list */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <svg
                          className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="8" cy="8" r="8" className="fill-green-50 dark:fill-green-950" />
                          <path
                            d="M4.5 8.5L7 11L11.5 5.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          className={`text-sm leading-snug text-gray-600 dark:text-gray-400`}
                        >
                          {feature.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer note ── */}
        <p
          className={`text-center text-xs mt-8 text-gray-400 dark:text-gray-600`}
        >
          All plans include SSL security. Cancel or change your plan at any time.
        </p>
      </div>
    </div>
  );
}
