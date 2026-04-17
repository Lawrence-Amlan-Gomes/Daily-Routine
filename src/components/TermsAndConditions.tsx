"use client";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "accounts", title: "Accounts" },
  { id: "subscriptions", title: "Plans & Billing" },
  { id: "no-refund", title: "No Refund Policy" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "availability", title: "Service Availability" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "termination", title: "Termination" },
  { id: "contact", title: "Contact" },
];

const EFFECTIVE_DATE = "April 3, 2026";

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      // Highlight active section in TOC
      let current = "";
      for (const { id } of SECTIONS) {
        const el = sectionRefs.current[id];
        if (el && el.getBoundingClientRect().top <= 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen">
      {/* Page header */}
      <div className="w-full border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] pt-28 sm:pt-32 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Terms and Conditions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] py-12 flex gap-12">
        {/* Sticky TOC — desktop only */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              On this page
            </p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map(({ id, title }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                    activeSection === id
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <article className="flex-1 min-w-0 space-y-10">
          {/* Intro */}
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed border-l-4 border-blue-200 dark:border-blue-800 pl-4">
            Please read these Terms carefully before using My Daily Routine. By
            accessing or using our service, you agree to be bound by these
            Terms.
          </p>

          {/* Section 1 */}
          <section
            ref={setRef("acceptance")}
            id="acceptance"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By using My Daily Routine, you confirm that you have read,
              understood, and agree to these Terms. If you do not agree, please
              discontinue use of the service immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section
            ref={setRef("accounts")}
            id="accounts"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">2. Accounts</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              You are solely responsible for maintaining the security of your
              account credentials and for all activity conducted under your
              account. You must provide accurate, current, and complete
              information during registration and keep it up to date.
            </p>
          </section>

          {/* Section 3 */}
          <section
            ref={setRef("subscriptions")}
            id="subscriptions"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">
              3. Plans &amp; Billing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              My Daily Routine offers Standard and Premium plans as one-time
              purchases. Upon completing a purchase, your account is immediately
              upgraded to the selected plan. All payments are processed securely
              through our third-party payment providers.
            </p>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              There are no recurring charges, no automatic renewals, and no
              cancellation required. You pay once and retain access to the
              features of your plan. Pricing and plan features are clearly
              displayed before purchase.
            </p>
          </section>

          {/* Section 4 — highlighted */}
          <section
            ref={setRef("no-refund")}
            id="no-refund"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">4. No Refund Policy</h2>
            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Important:</strong> All subscription purchases are final
                and non-refundable. Once your account is upgraded, no refunds
                will be issued for any unused portion of the billing period.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              This policy applies to all paid plans — Standard and Premium. We
              offer a free plan so you can fully evaluate the service before
              committing to a paid plan. We strongly encourage you to use the
              free plan and review all features before purchasing.
            </p>
          </section>

          {/* Section 5 */}
          <section
            ref={setRef("acceptable-use")}
            id="acceptable-use"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">5. Acceptable Use</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              You agree not to misuse the service. Prohibited actions include
              attempting to gain unauthorized access, abusing or overloading
              APIs, interfering with platform operations, impersonating other
              users, or using the service for any unlawful purpose.
            </p>
          </section>

          {/* Section 6 */}
          <section
            ref={setRef("intellectual-property")}
            id="intellectual-property"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">6. Intellectual Property</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              The product, branding, design, and software are the exclusive
              property of My Daily Routine. Subject to these Terms, we grant you
              a limited, non-exclusive, non-transferable, revocable license to
              access and use the service for personal, non-commercial purposes.
            </p>
          </section>

          {/* Section 7 */}
          <section
            ref={setRef("availability")}
            id="availability"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">7. Service Availability</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We aim to maintain high availability, but we may modify, suspend,
              or discontinue any part of the service at any time without prior
              notice. We do not guarantee uninterrupted, error-free access to
              the service.
            </p>
          </section>

          {/* Section 8 */}
          <section
            ref={setRef("liability")}
            id="liability"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To the maximum extent permitted by applicable law, the service is
              provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              without warranties of any kind. My Daily Routine shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of or inability to use the
              service.
            </p>
          </section>

          {/* Section 9 */}
          <section
            ref={setRef("termination")}
            id="termination"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">9. Termination</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to suspend or terminate your account at our
              discretion if you violate these Terms, engage in fraudulent
              activity, or abuse the platform. You may stop using the service at
              any time.
            </p>
          </section>

          {/* Section 10 */}
          <section
            ref={setRef("contact")}
            id="contact"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">10. Contact</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions or concerns about these Terms, please reach
              out to us:
            </p>
            <a
              href="mailto:mydailyroutinecontact@gmail.com"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              mydailyroutinecontact@gmail.com
            </a>
          </section>

          {/* Bottom note */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-900">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              These Terms were last updated on {EFFECTIVE_DATE}. Continued use
              of the service after updates constitutes acceptance of the revised
              Terms.
            </p>
          </div>
        </article>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 z-50"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
