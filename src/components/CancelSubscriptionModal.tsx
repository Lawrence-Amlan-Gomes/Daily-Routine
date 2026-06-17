"use client";

import { useState } from "react";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const LOST_FEATURES = [
  "AI routine builder",
  "Advanced stats & insights",
  "Weekly & monthly reports",
  "Visual charts & progress tracking",
];

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    if (status === "loading") return;
    if (status === "success") window.location.reload();
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  const handleConfirm = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await onConfirm();
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to cancel subscription");
      setStatus("error");
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Cancel subscription?
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {isSuccess ? (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                Subscription canceled
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Your subscription has been canceled. You&apos;ll keep access until your billing period ends.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  You&apos;ll lose access to:
                </p>
                <ul className="space-y-2">
                  {LOST_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You keep access until the end of your billing period.
                </p>
              </div>

              {status === "error" && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
          {isSuccess ? (
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep my subscription
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isLoading ? "Canceling..." : "Yes, cancel"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
