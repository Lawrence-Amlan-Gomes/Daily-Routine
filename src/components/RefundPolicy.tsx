"use client";

export default function RefundPolicy() {
  return (
    <div className="px-[8%] sm:px-[10%] mt-[20%] sm:mt-[10%] mb-[5%] pb-[5%] w-full bg-[#ffffff] dark:bg-[#000000] text-[#1f2937] dark:text-[#e5e7eb]">
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-sm sm:text-base opacity-80 mb-8">
          Last updated: April 17, 2026
        </p>

        <div className="space-y-8 text-sm sm:text-base leading-7">

          <section className="p-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
            <h2 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">
              No Refunds — All Sales Are Final
            </h2>
            <p className="text-red-700 dark:text-red-300">
              My Daily Routine does not offer refunds or credits for any
              purchase. All plans are one-time payments with no recurring
              billing, no cancellation flow, and no partial refunds. By
              completing a purchase, you acknowledge and agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. One-Time Purchase Model
            </h2>
            <p className="mb-3">
              My Daily Routine is not a subscription service. All paid plans are
              one-time purchases — you pay once and retain access to the
              features included in your plan. There are no recurring charges, no
              renewal dates, and no automatic billing of any kind.
            </p>
            <p>
              Because access is granted instantly and in full at the moment of
              purchase, and because digital access cannot be returned or
              &quot;un-used,&quot; all sales are final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. No Cancellations
            </h2>
            <p>
              There is no cancellation mechanism because there is nothing to
              cancel. Your plan does not renew. You will never be charged again
              after your initial purchase unless you explicitly choose to
              upgrade to a higher plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Why We Do Not Offer Refunds
            </h2>
            <p>
              Once a purchase is completed, server costs, AI inference, storage,
              and infrastructure are consumed immediately. Digital access cannot
              be revoked and re-issued. Offering refunds would not be
              sustainable and would compromise the quality of service for all
              users. We provide a free plan so you can evaluate the product
              fully before any purchase decision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Free Plan
            </h2>
            <p>
              My Daily Routine offers a free plan with no payment required. We
              strongly encourage you to use it to explore the product and
              confirm it meets your needs before upgrading to a paid plan.
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
