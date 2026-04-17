"use client";

export default function RefundPolicy() {
  return (
    <div className="px-[8%] sm:px-[10%] mt-[20%] sm:mt-[10%] mb-[5%] pb-[5%] w-full bg-[#ffffff] dark:bg-[#000000] text-[#1f2937] dark:text-[#e5e7eb]">
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-sm sm:text-base opacity-80 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-sm sm:text-base leading-7">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. Subscription Charges
            </h2>
            <p>
              Charges for paid plans are billed in advance for the selected
              billing cycle (monthly or annual).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. Refund Eligibility
            </h2>
            <p>
              Refund requests are reviewed case-by-case. If required by
              applicable consumer law, eligible refunds will be processed
              accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Non-Refundable Cases
            </h2>
            <p>
              Except where required by law, partial-period usage, unused time,
              and delayed cancellation requests after renewal are generally not
              refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. How to Request</h2>
            <p>
              Send your request with account email and payment details to{" "}
              <span className="font-medium">amlan100ai@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
