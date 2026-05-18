// src/components/PaddleForm.tsx
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaddleForm() {
  const { user: auth, setAuth } = useAuth();
  const { wantToPaymentType, wantToPaymentDuration } = usePrice();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!auth?.email) {
      console.error("❌ No user email found");
      router.push("/");
      return;
    }

    try {
      console.log("🔄 Calculating payment details...");

      const type = wantToPaymentType?.trim();
      // Test plan always uses annual duration for subscription testing
      const duration =
        type === "Test"
          ? "annual"
          : wantToPaymentDuration === "monthly"
            ? "monthly"
            : "annual";

      if (!type || !duration) {
        console.warn("⚠️ Missing payment type or duration");
        router.push("/");
        return;
      }

      const expiredAt = new Date();
      expiredAt.setDate(
        expiredAt.getDate() + (duration === "monthly" ? 30 : 365),
      );

      const paymentString = `${type} ${
        duration === "monthly" ? "Monthly" : "Annually"
      }`;

      console.log("✅ Payment details calculated:", {
        paymentType: paymentString,
        expiredAt: expiredAt.toISOString(),
      });

      setAuth({
        ...auth,
        paymentType: paymentString,
        expiredAt: expiredAt.toISOString(),
      });

      console.log("✅ Auth state updated, showing success message...");
      setShowSuccess(true);

      setTimeout(() => {
        console.log("⏰ Timeout complete, redirecting to home...");
        router.push("/");
      }, 5000);
    } catch (error) {
      console.error("❌ Error in handleConfirm:", error);
      router.push("/");
    }
  };

  useEffect(() => {
    if (!auth?.email) return;

    let paddleInstance: Paddle | undefined;

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV;

    console.log("🏗️ [Paddle Init] token present:", !!clientToken, "| first 8 chars:", clientToken?.slice(0, 8), "| env var NEXT_PUBLIC_PADDLE_ENV:", paddleEnv);

    initializePaddle({
      environment: "production",
      token: clientToken!,
      eventCallback: (data) => {
        if (!data.name) {
          console.log("🎯 [Paddle] Unnamed event (init/state):", JSON.stringify(data));
          return;
        }

        console.log("🎯 [Paddle] Event:", data.name, JSON.stringify(data));

        if (data.name === "checkout.loaded") {
          console.log("📦 Checkout loaded");
          setIsLoading(false);
        } else if (data.name === "checkout.completed") {
          console.log("✅ Checkout completed! Calling handleConfirm...");
          handleConfirm();
        } else if (data.name === "checkout.customer.created") {
          console.log("👤 Customer created");
        } else if (data.name === "checkout.closed") {
          console.log("❌ Checkout closed");
        } else if (data.name === "checkout.error") {
          console.error("❌ [Paddle] Checkout error full data:", JSON.stringify(data, null, 2));
          // Log nested error details Paddle sometimes buries
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyData = data as any;
          if (anyData?.data?.error) {
            console.error("❌ [Paddle] error.code:", anyData.data.error.code, "| error.detail:", anyData.data.error.detail);
          }
          if (anyData?.error) {
            console.error("❌ [Paddle] top-level error:", JSON.stringify(anyData.error));
          }
          setIsLoading(false);
          alert("Payment error – please try again.");
        } else if (data.name === "checkout.payment.initiated") {
          console.log("💳 Payment initiated");
        } else if (data.name === "checkout.payment.selected") {
          console.log("💳 Payment method selected");
        }
      },
    }).then((instance) => {
      if (!instance) {
        console.error("Paddle initialization failed — instance is null. Check client token.");
        setIsLoading(false);
        return;
      }

      paddleInstance = instance;

      const type = wantToPaymentType?.trim();
      // Test plan always uses annual duration for subscription testing
      const duration =
        type === "Test"
          ? "annual"
          : wantToPaymentDuration === "monthly"
            ? "monthly"
            : "annual";

      if (!type || !duration) {
        alert("No plan selected. Returning to pricing.");
        router.push("/pricing");
        return;
      }

      const key = `${type} ${duration}`;

      const priceIdMap: Record<string, string> = {
        "Standard monthly": "pri_01kpf5zbeyrp5nygyc1hma68ed",
        "Standard annual": "pri_01kpf65jm2m5cg2y7z0sqrajjg",
        "Premium monthly": "pri_01kpf635sdhtbak3tecz31cjkr",
        "Premium annual": "pri_01kpf66wsrnfnzd9ptnvrxdaxy",
        "Test monthly": "pri_01kpf68pfc9pfne9a9y9n88wt0",
        "Test annual": "pri_01krwxa4eq4mfft1gq5efr1qs8",
      };

      const priceId = priceIdMap[key];

      console.log("🛒 [Paddle] Checkout open params — key:", key, "| priceId:", priceId, "| customerEmail:", auth?.email);

      if (!priceId) {
        console.error("❌ [Paddle] No priceId for key:", key, "| Available keys:", Object.keys(priceIdMap));
        alert("Selected plan not available. Please choose again.");
        router.push("/pricing");
        return;
      }

      const discountId =
        type === "Test" && duration === "annual"
          ? "dsc_01krwxp338pq4avppr6ybmjtfq"
          : type === "Test" && duration === "monthly"
            ? "dsc_01kpf6cwet24b7az70na8jd732"
            : undefined;

      instance.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(discountId && { discountId }),
        customer: { email: auth.email },
        customData: { userEmail: auth.email },
        settings: {
          displayMode: "inline",
          frameTarget: "paddle-checkout-container",
          frameInitialHeight: 450,
          frameStyle:
            "width: 100%; min-width: 312px; background-color: transparent; border: none;",
          theme: "light",
          locale: "en",
          allowLogout: false,
        },
      });
    });

    return () => {
      paddleInstance?.Checkout.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, wantToPaymentType, wantToPaymentDuration, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-black">
      <div
        className={`w-full max-w-4xl mx-auto  bg-[#fefefe] border-[1px] border-[#cccccc] rounded-lg overflow-hidden`}
      >
        {/* Header */}
        <div className={`p-6 border-b-[1px] border-[#bbbbbb] bg-[#fefefe]`}>
          <h1 className={`text-3xl font-bold text-center text-black`}>
            Complete Your Purchase
          </h1>
          <p className={`text-center mt-2 text-gray-600`}>
            {wantToPaymentType} -{" "}
            {wantToPaymentDuration === "monthly" ? "Monthly" : "Annual"} Plan
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center pt-20">
            <div className="flex flex-col items-center gap-4 h-[200px]">
              <div
                className={`w-12 h-12 border-4 rounded-full animate-spin border-gray-300`}
              ></div>
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        )}

        {/* Paddle Checkout Container or Success Message */}
        <div className="p-6">
          {showSuccess ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600">
                  Thank you for your purchase. Redirecting to home in 5
                  seconds...
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`paddle-checkout-container rounded-lg overflow-hidden transition-opacity duration-300 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
            />
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t-[1px] border-[#bbbbbb] bg-[#fefefe]`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/pricing")}
              className={`px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-200`}
            >
              ← Back to Pricing
            </button>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className={`text-sm text-gray-600`}>
                Secure payment powered by Paddle
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
