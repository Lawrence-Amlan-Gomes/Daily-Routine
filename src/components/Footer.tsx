"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import { FileText, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function Footer() {
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState warning
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Use a default theme during SSR to prevent hydration mismatch
  const currentTheme = isClient ? theme : false;

  return (
    <footer
      className={`
        w-full px-5 sm:px-8 md:px-[10%] py-8 md:py-12
        bg-gradient-to-br from-transparent via-transparent to-transparent
        relative border-t backdrop-blur-sm
        ${currentTheme ? "bg-white/90 border-gray-200/50" : "bg-black/90 border-gray-800/50"}
      `}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div
          className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl ${currentTheme ? "bg-blue-500" : "bg-purple-500"}`}
        ></div>
        <div
          className={`absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl ${currentTheme ? "bg-purple-500" : "bg-blue-500"}`}
        ></div>
      </div>

      <div className="relative w-full mx-auto">
        {/* Main content */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
          {/* Left - Brand + Description */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden`}
              >
                <Image
                  src="/Icon.png"
                  alt="My Daily Routine Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span
                className={`
                  text-xl md:text-2xl font-bold tracking-tight
                  ${currentTheme ? "text-gray-900" : "text-gray-100"}
                `}
              >
                My Daily Routine
              </span>
            </div>
            <p
              className={`text-sm ${currentTheme ? "text-gray-600" : "text-gray-400"} mb-4`}
            >
              Transform your productivity with smart daily planning and habit
              tracking.
            </p>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs ${currentTheme ? "text-gray-500" : "text-gray-400"}`}
              >
                © {isClient ? new Date().getFullYear() : 2026} My Daily Routine.
                All rights reserved.
              </span>
            </div>
          </div>

          {/* Right - Quick Links */}
          <div className="flex-1 max-w-sm">
            <h3
              className={`text-sm font-semibold mb-4 ${currentTheme ? "text-gray-900" : "text-gray-100"}`}
            >
              Legal & Policies
            </h3>
            <div className="space-y-4">
              <Link href="/privacy-policy">
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                    ${
                      theme
                        ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                        : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
                    }
                  `}
                >
                  <Shield className="w-5 h-5" />
                  <span>Privacy Policy</span>
                </div>
              </Link>

              <Link href="/terms-and-conditions">
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 mt-3 rounded-lg text-sm font-medium
                    transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                    ${colors.keyBg} ${colors.keyHoverBg} text-white border ${colors.keyBorder}
                  `}
                >
                  <FileText className="w-5 h-5" />
                  <span>Terms & Conditions</span>
                </div>
              </Link>
            </div>

            <div
              className={`mt-6 p-4 rounded-lg ${currentTheme ? "bg-blue-50 border border-blue-200" : "bg-blue-900/20 border border-blue-800/30"}`}
            >
              <p
                className={`text-xs ${currentTheme ? "text-blue-800" : "text-blue-200"}`}
              >
                <strong>Important:</strong> Please review our Terms & Conditions
                for billing and subscription policies.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              className={`text-xs ${currentTheme ? "text-gray-500" : "text-gray-400"}`}
            >
              {isClient ? new Date().getFullYear() : 2026} Daily Routine. All
              rights reserved.
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span
                className={currentTheme ? "text-gray-500" : "text-gray-400"}
              >
                Version 1.0.0
              </span>
              <span
                className={currentTheme ? "text-gray-400" : "text-gray-600"}
              >
                •
              </span>
              <span
                className={currentTheme ? "text-gray-500" : "text-gray-400"}
              >
                Last updated:{" "}
                {isClient ? new Date().toLocaleDateString() : "03/04/2026"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
