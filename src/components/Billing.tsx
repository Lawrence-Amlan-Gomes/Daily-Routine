// src/components/Billing.tsx
"use client";
import { cancelSubscription } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import PaddleForm from "./PaddleForm";

export default function Billing() {
  const { user: auth } = useAuth();
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  const handleCancelSubscription = async () => {
    if (!auth?.email) return;
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will lose access to premium features.",
      )
    ) {
      return;
    }

    setIsCanceling(true);
    setCancelError(null);
    try {
      await cancelSubscription(auth.email);
      router.refresh();
      alert("Subscription canceled successfully.");
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "Failed to cancel subscription",
      );
    } finally {
      setIsCanceling(false);
    }
  };

  const hasActiveSubscription =
    auth?.paymentType &&
    auth.paymentType !== "Expired" &&
    !auth.paymentType.includes("Test");
  const expiryDate = auth?.expiredAt
    ? new Date(auth.expiredAt).toLocaleDateString()
    : "";

  return (
    <div className="min-h-screen w-full pt-[100px] flex flex-col items-center justify-center p-6 bg-[#ffffff] dark:bg-[#000000] text-[#0a0a0a] dark:text-[#ebebeb]">
      {hasActiveSubscription && (
        <div className="w-full max-w-4xl mb-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Your Subscription</h2>
          <div className="space-y-2 mb-6">
            <p>
              <span className="font-semibold">Plan:</span> {auth.paymentType}
            </p>
            <p>
              <span className="font-semibold">Renews:</span> {expiryDate}
            </p>
          </div>
          {cancelError && (
            <p className="text-red-600 dark:text-red-400 mb-4">{cancelError}</p>
          )}
          <button
            onClick={handleCancelSubscription}
            disabled={isCanceling}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isCanceling ? "Canceling..." : "Cancel Subscription"}
          </button>
        </div>
      )}

      {/* PaddleForm handles opening the checkout */}
      <PaddleForm />
    </div>
  );
}
