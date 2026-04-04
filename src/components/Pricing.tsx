// src/components/Pricing.tsx
"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useEffect } from "react";

export default function Pricing() {
  const { theme } = useTheme();
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
            description: "Admin test pricing card",
            priceMonthly: 1,
            priceAnnual: 1, // Same as monthly - always monthly
            features: [
              { name: "admin", value: "Admin only test plan" },
              { name: "test", value: "For testing purposes" },
              { name: "debug", value: "Debug payment flow" },
              { name: "billing", value: "Monthly billing only" },
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

  const getPriceLabel = (planId: string) => {
    const price = getPrice(planId);
    return `$${price}/${billingPeriod === "annual" ? "year" : "month"}`;
  };

  return (
    <div
      className={`h-full py-8 sm:pt-[8%] pt-[80px] px-4 sm:px-6 overflow-auto scrollbar relative ${
        theme
          ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
          : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
      }`}
    >
      <div className="max-w-4xl mb-[5%] sm:max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Choose Your Plan
          </h1>
          <p
            className={`text-base sm:text-xl ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Select a plan to get started.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div
            className={`flex rounded-lg p-1 sm:p-2 ${
              theme ? "bg-black" : "bg-white"
            }`}
          >
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "monthly"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                    ? "text-[#ffffff]"
                    : "text-[#000000]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "annual"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                    ? "text-[#ffffff]"
                    : "text-[#000000]"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div
          className={`grid grid-cols-1 ${plans.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 sm:gap-5`}
        >
          {plans.map((plan) => {
            const priceLabel = getPriceLabel(plan.id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-4 sm:p-6 rounded-lg ${
                  theme
                    ? plan.isMostPopular
                      ? `bg-[#fafafa] border-[1px] ${colors.keyBorder} hover:cursor-pointer`
                      : "bg-[#fafafa] border border-gray-300 hover:border-gray-400 hover:cursor-pointer"
                    : plan.isMostPopular
                      ? `bg-gray-950 border-[1px] ${colors.keyBorder} hover:cursor-pointer`
                      : `bg-gray-950 border border-gray-900 hover:border-gray-800 hover:cursor-pointer`
                }`}
                onMouseEnter={() => setSelectedPlan(plan.id)}
                onMouseLeave={() => setSelectedPlan(null)}
              >
                {/* Title + Badge */}
                <div className="flex justify-center items-center mb-2 sm:mb-3">
                  <h3
                    className={`text-xl sm:text-2xl font-bold ${
                      theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                    }`}
                  >
                    {plan.title}
                  </h3>
                  {(plan.isMostPopular || plan.badge) && (
                    <div className="ml-3 sm:ml-4">
                      <span
                        className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-semibold ${
                          plan.badge === "Admin Only"
                            ? "bg-orange-500 text-white"
                            : theme
                              ? `${colors.keyBg} text-[#ffffff]`
                              : `${colors.keyBg} text-[#ffffff]`
                        }`}
                      >
                        {plan.badge || "Most Popular"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description + Price + CTA */}
                <div className="text-center mb-4 sm:mb-5">
                  <p
                    className={`text-sm sm:text-base ${
                      theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-2 sm:mt-3">
                    <div
                      className={`text-2xl sm:text-3xl font-bold ${
                        theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                      }`}
                    >
                      {priceLabel}
                    </div>

                    {/* Free plan handling */}
                    {plan.id === "free" ? (
                      isFreeTierExpired ? (
                        <div className="flex flex-col gap-2 mt-3 sm:mt-5">
                          <div className="w-full py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium bg-red-700/80 text-white text-center">
                            Free trial expired
                          </div>
                          <Link href={auth ? "/billing" : "/login"}>
                            <button
                              onClick={() =>
                                setWantToPayment("Standard", billingPeriod)
                              }
                              className={`w-full py-1.5 sm:py-2 rounded-md text-sm font-medium transition ${
                                theme
                                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                  : "bg-gray-900 text-gray-200 hover:bg-gray-800"
                              }`}
                            >
                              Upgrade to continue →
                            </button>
                          </Link>
                        </div>
                      ) : (
                        <button
                          className={`w-full py-1.5 sm:py-2 rounded-md mt-5 text-sm sm:text-base font-medium ${
                            theme
                              ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                              : "bg-gray-900 text-[#ebebeb] hover:bg-gray-800"
                          }`}
                        >
                          <Link href={auth ? "/dashBoard" : "/login"}>
                            Use Now
                          </Link>
                        </button>
                      )
                    ) : auth ? (
                      <Link href="/billing">
                        <button
                          onClick={() => {
                            setWantToPayment(plan.title, billingPeriod);
                          }}
                          className={`w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium ${
                            plan.isMostPopular
                              ? `${colors.keyBg} text-white hover:bg-blue-800`
                              : theme
                                ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                                : "bg-gray-900 text-[#ebebeb] hover:bg-gray-800"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : "Buy Plan"}
                        </button>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <button
                          onClick={() => {
                            setWantToPayment(plan.title, billingPeriod);
                          }}
                          className={`w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium ${
                            plan.isMostPopular
                              ? `${colors.keyBg} text-white hover:bg-blue-800`
                              : theme
                                ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                                : "bg-gray-900 text-[#ebebeb] hover:bg-gray-800"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : "Buy Plan"}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-1 sm:space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <div
                        className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mr-1.5 sm:mr-2 ${
                          theme ? "bg-green-600" : "bg-green-600"
                        }`}
                      />
                      <span
                        className={`text-sm sm:text-base ${
                          theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                        }`}
                      >
                        {feature.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
