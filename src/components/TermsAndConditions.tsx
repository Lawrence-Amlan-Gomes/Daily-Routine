"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useState } from "react";

export default function TermsAndConditions() {
  const { theme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Always render the same structure, but conditionally show loading overlay
  return (
    <>
      {!hasMounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )}
      <div
        className={`px-[8%] sm:px-[10%] mt-[20%] sm:mt-[10%] mb-[5%] pb-[5%] w-full ${
          theme ? "bg-[#ffffff] text-[#1f2937]" : "bg-[#000000] text-[#e5e7eb]"
        }`}
      >
        <div className="max-w-4xl mx-auto text-left">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Terms and Conditions
          </h1>
          <p className="text-sm sm:text-base opacity-80 mb-8">
            Last updated:{" "}
            {hasMounted ? new Date().toLocaleDateString() : "04/03/2026"}
          </p>

          <div className="space-y-6 text-sm sm:text-base leading-7">
            <section>
              <h2 className="text-xl font-semibold mb-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By using My Daily Routine, you agree to these Terms. If you do
                not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. Accounts</h2>
              <p>
                You are responsible for account security and for all activity
                under your account. You must provide accurate information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                3. Subscriptions and Billing
              </h2>
              <p>
                Our application is designed with a clear subscription model.
                Upon purchase of Standard or Premium packages, you are
                automatically enrolled as a Standard or Premium member
                respectively. All subscriptions are processed through our secure
                payment providers and may renew automatically unless canceled
                prior to the renewal date.
              </p>
              <p className="mt-2">
                <strong>Important Billing Policy:</strong> Please note that we
                do not offer refunds or billing cancellations for active
                subscription periods. By purchasing a subscription, you
                acknowledge and agree to these terms. Pricing, billing cycles,
                and plan limitations are clearly displayed within the
                application before purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                4. No Refund Policy
              </h2>
              <p>
                <strong>Clear No-Refund Policy:</strong> My Daily Routine
                operates on a strict no-refund policy. Once a subscription
                purchase is completed and your account is upgraded to Standard
                or Premium membership, no refunds will be issued for any portion
                of the subscription period.
              </p>
              <p className="mt-2">
                This policy applies to all subscription tiers including Standard
                and Premium packages. We encourage users to carefully review our
                features and pricing before making a purchase decision. Free
                trial periods (when available) are provided to help users
                evaluate our service before committing to a paid subscription.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. Acceptable Use</h2>
              <p>
                You may not misuse the service, attempt unauthorized access,
                abuse APIs, interfere with operations, or use the platform for
                unlawful activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                6. Intellectual Property
              </h2>
              <p>
                The product, branding, and software are owned by My Daily
                Routine. Subject to these Terms, we grant a limited,
                non-exclusive, revocable right to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                7. Service Availability
              </h2>
              <p>
                We may modify, suspend, or discontinue parts of the service at
                any time. We aim for reliability but do not guarantee
                uninterrupted availability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                8. Limitation of Liability
              </h2>
              <p>
                To the maximum extent allowed by law, the service is provided
                “as is” without warranties. We are not liable for indirect,
                incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">9. Termination</h2>
              <p>
                We may suspend or terminate accounts for violations of these
                Terms, fraud, or abuse. You may stop using the service at any
                time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">10. Contact</h2>
              <p>
                Questions about these Terms:{" "}
                <span className="font-medium">
                  my.daily.routine.app@gmail.com
                </span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
