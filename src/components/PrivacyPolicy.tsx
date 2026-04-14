"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useState } from "react";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base opacity-80 mb-8">
            Last updated:{" "}
            {hasMounted ? new Date().toLocaleDateString() : "04/03/2026"}
          </p>

          <div className="space-y-6 text-sm sm:text-base leading-7">
            <section>
              <h2 className="text-xl font-semibold mb-2">
                1. Information We Collect
              </h2>
              <p>
                We collect account details (name, email), authentication data,
                routine and goals content you create, billing metadata from
                payment providers, and limited technical data such as IP,
                browser, and usage analytics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. How We Use Data</h2>
              <p>
                We use data to operate and secure the service, personalize your
                experience, process subscriptions, prevent abuse, provide
                support, and improve product quality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                3. Third-Party Services
              </h2>
              <p>
                We use trusted providers such as payment processors,
                authentication, hosting, analytics, and email delivery vendors.
                These providers process data on our behalf according to their
                own privacy terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. Data Sharing</h2>
              <p>
                We do not sell your personal data. We share data only with
                service providers needed to run the app, to comply with legal
                obligations, or to protect users and the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. Data Retention</h2>
              <p>
                We retain account and product data while your account is active
                and as required for legal, billing, and security purposes. We
                may delete inactive or unverified accounts after a defined
                period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. Security</h2>
              <p>
                We use reasonable administrative and technical safeguards to
                protect data. No method of storage or transmission is fully
                secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
              <p>
                Depending on your region, you may have rights to access,
                correct, export, or delete personal data. You can request these
                by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                8. Children&apos;s Privacy
              </h2>
              <p>
                The service is not intended for children under 13 (or higher age
                where required by local law). We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
              <p>
                For privacy questions or data requests, contact:{" "}
                <span className="font-medium">amlan100ai@gmail.com</span>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                10. Billing and Subscription Terms
              </h2>
              <p>
                <strong>Subscription Model:</strong> My Daily Routine offers
                Standard and Premium subscription packages. Upon purchase, you
                are automatically enrolled as a Standard or Premium member based
                on your selected package.
              </p>
              <p className="mt-2">
                <strong>No Refund Policy:</strong> We do not offer refunds or
                billing cancellations for active subscription periods. All
                purchases are final and non-refundable. By subscribing, you
                acknowledge and agree to these terms.
              </p>
              <p className="mt-2">
                <strong>Automatic Renewal:</strong> Subscriptions may renew
                automatically unless canceled before the renewal date. You are
                responsible for managing your subscription settings.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
