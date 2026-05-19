"use client";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Data" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "data-retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "your-rights", title: "Your Rights" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "billing-terms", title: "Billing & Plans" },
  { id: "contact", title: "Contact" },
];

const EFFECTIVE_DATE = "May 19, 2026";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

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
            Privacy Policy
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
            Your privacy matters to us. This policy explains what data we
            collect, how we use it, and the choices you have. We will never sell
            your personal information.
          </p>

          {/* Section 1 */}
          <section
            ref={setRef("information-collected")}
            id="information-collected"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">
              1. Information We Collect
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We collect information you provide directly — such as your name,
              email address, and profile details — as well as data generated
              through your use of the service, including routines and goals you
              create, usage activity, and limited technical data such as IP
              address, browser type, and device information. Billing metadata
              (e.g. subscription tier, transaction IDs) is provided to us by our
              payment processors.
            </p>
          </section>

          {/* Section 2 */}
          <section
            ref={setRef("how-we-use")}
            id="how-we-use"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">2. How We Use Data</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use your data to operate, maintain, and improve the service;
              personalize your experience; process and manage your subscription;
              provide customer support; prevent fraud and abuse; and send you
              service-related communications. We do not use your routine or
              goals data for advertising purposes.
            </p>
          </section>

          {/* Section 3 */}
          <section
            ref={setRef("third-party")}
            id="third-party"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">3. Third-Party Services</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We integrate with trusted third-party providers for payment
              processing, authentication, hosting infrastructure, analytics, and
              transactional email delivery. These providers access only the data
              necessary to perform their specific function and are contractually
              required to handle it in accordance with applicable privacy
              standards.
            </p>
          </section>

          {/* Section 4 */}
          <section
            ref={setRef("data-sharing")}
            id="data-sharing"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">4. Data Sharing</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We do not sell, rent, or trade your personal data. We share
              information only with service providers necessary to run the
              platform, when required to comply with legal obligations, or when
              necessary to protect the rights and safety of our users and the
              platform.
            </p>
          </section>

          {/* Section 5 */}
          <section
            ref={setRef("data-retention")}
            id="data-retention"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">5. Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We retain your account and usage data for as long as your account
              is active and as required for legal, billing, audit, and security
              purposes. Inactive or unverified accounts may be deleted after a
              defined period. You may request deletion of your account and
              associated data at any time by contacting us.
            </p>
          </section>

          {/* Section 6 */}
          <section
            ref={setRef("security")}
            id="security"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">6. Security</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We implement reasonable administrative, technical, and physical
              safeguards to protect your personal data against unauthorized
              access, loss, or disclosure. However, no method of electronic
              storage or transmission over the internet is completely secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 7 */}
          <section
            ref={setRef("your-rights")}
            id="your-rights"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">7. Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Depending on your jurisdiction (including GDPR and CCPA
              territories), you may have the right to access, correct, port, or
              delete your personal data. You may also have the right to object
              to or restrict certain processing. To exercise any of these
              rights, please contact us at the email below.
            </p>
          </section>

          {/* Section 8 */}
          <section
            ref={setRef("childrens-privacy")}
            id="childrens-privacy"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our service is not directed at children under the age of 13 (or a
              higher age where required by local law). We do not knowingly
              collect personal data from children. If we become aware that we
              have inadvertently collected such data, we will promptly delete
              it.
            </p>
          </section>

          {/* Section 9 — highlighted */}
          <section
            ref={setRef("billing-terms")}
            id="billing-terms"
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold mb-3">
              9. Billing &amp; Plans
            </h2>
            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>No Refund Policy:</strong> All subscription purchases are final
                and non-refundable. Upgrading to a different plan cancels your current subscription immediately,
                and any unused time is forfeited. By completing a purchase, you acknowledge and agree to this policy.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              My Daily Routine offers Standard and Premium plans as recurring subscriptions (monthly or annual billing).
              When you purchase a subscription, you authorize recurring charges for the selected billing period.
              Your subscription automatically expires at the end of the period — there are no automatic renewals.
            </p>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong>Data we store for billing:</strong> We store your subscription tier (plan name), billing period, subscription expiration date,
              and a unique subscription ID issued by our payment processor (Paddle). We use this data to manage your access rights,
              process cancellations, and handle subscription upgrades. Payment method information (credit card, etc.) is handled
              exclusively by Paddle and is not stored on our servers. We comply with PCI standards for payment security.
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
              For privacy questions, data requests, or to exercise your rights,
              please contact us:
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
              This Privacy Policy was last updated on {EFFECTIVE_DATE}.
              Continued use of the service after changes are posted constitutes
              your acceptance of the revised policy.
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
