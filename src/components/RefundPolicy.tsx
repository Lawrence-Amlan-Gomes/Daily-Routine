"use client";

export default function RefundPolicy() {
  return (
    <div className="px-[8%] sm:px-[10%] mt-[20%] sm:mt-[10%] mb-[5%] pb-[5%] w-full bg-[#ffffff] dark:bg-[#000000] text-[#1f2937] dark:text-[#e5e7eb]">
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-sm sm:text-base opacity-80 mb-8">
          Last updated: May 19, 2026
        </p>

        <div className="space-y-8 text-sm sm:text-base leading-7">

          <section className="p-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
            <h2 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">
              No Refunds — All Sales Are Final
            </h2>
            <p className="text-red-700 dark:text-red-300">
              My Daily Routine does not offer refunds or credits for any
              subscription purchase. All paid plans are recurring subscriptions with billing periods
              (monthly or annually). By completing a purchase, you acknowledge and agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. Subscription Model
            </h2>
            <p className="mb-3">
              My Daily Routine offers Standard and Premium plans as recurring subscriptions. When you purchase a plan,
              you are billed immediately for the selected billing period: 30 days for monthly plans, 365 days for annual plans.
              Your subscription will automatically expire at the end of the billing period — there are no auto-renewals.
            </p>
            <p>
              Because access is granted instantly and in full at the moment of
              purchase, and because digital access cannot be returned or
              &quot;un-used,&quot; all sales are final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. Plan Upgrades &amp; Cancellations
            </h2>
            <p className="mb-3">
              <strong>Upgrading to a different plan:</strong> If you upgrade to a different plan while your current subscription is active,
              your old subscription will be canceled <strong>immediately</strong>. You will lose any unused time on your previous plan, and
              <strong> no refund or credit will be issued</strong> for the remaining days. The new plan begins instantly upon purchase.
            </p>
            <p className="mb-3">
              Example: If you have "Standard Monthly" with 10 days remaining (costing ~$1.67 at $5/month), and you upgrade to "Premium Annual" on that day,
              your 10 days of remaining Standard access are forfeited with no refund. You immediately gain access to Premium.
            </p>
            <p>
              <strong>Canceling your subscription:</strong> You may cancel your subscription at any time from your profile.
              Cancellation takes effect immediately, and you retain access until the end of your current billing period.
              No refunds are issued for the cancellation itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Why We Do Not Offer Refunds or Pro-Rating
            </h2>
            <p>
              Once a subscription is activated, server costs, AI inference, storage,
              and infrastructure are consumed immediately. Digital access cannot
              be revoked and re-issued. Offering refunds or pro-rated credits for upgrades would not be
              sustainable and would compromise the quality of service for all
              users. We provide a free 30-day trial so you can evaluate the product
              fully before committing to a paid subscription.
            </p>
            <p className="mt-3">
              When you upgrade subscriptions, you are choosing to forgo the remaining time on your old plan
              in exchange for immediate access to new features. This is a deliberate trade-off you control via our
              upgrade confirmation modal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Free Trial
            </h2>
            <p>
              My Daily Routine offers a 30-day free trial with full access to core features. No payment is required during this period.
              We strongly encourage you to explore all features and confirm the product meets your needs before upgrading to a paid subscription.
              After 30 days, your free trial expires and you must purchase a paid plan to continue using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. Legal Exceptions
            </h2>
            <p>
              The only exceptions to this policy are where required by
              applicable law in your jurisdiction. If you believe you are
              entitled to a refund under law, contact us with supporting
              documentation and we will review your request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
            <p>
              For billing questions, reach out at{" "}
              <a
                href="mailto:mydailyroutinecontact@gmail.com"
                className="font-medium underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                mydailyroutinecontact@gmail.com
              </a>
              . We are happy to help clarify your plan — we just cannot issue
              refunds outside the legal exceptions above.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
