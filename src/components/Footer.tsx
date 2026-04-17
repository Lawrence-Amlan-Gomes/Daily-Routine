"use client";
import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "/dashBoard" },
  { label: "Pricing", href: "/pricing" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund Policy", href: "/refund" },
];

function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="w-full px-5 sm:px-8 md:px-[10%] py-12 md:py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src="/Icon.png"
                  alt="My Daily Routine"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                My Daily Routine
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              The AI-powered daily planner that helps you build structured
              routines, track progress, and stay consistent — every single day.
            </p>
            <a
              href="mailto:mydailyroutinecontact@gmail.com"
              className="inline-flex items-center gap-2 mt-5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              mydailyroutinecontact@gmail.com
            </a>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} My Daily Routine. All rights
            reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Built to help you stay consistent.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
