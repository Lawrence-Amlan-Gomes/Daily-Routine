"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";

function Footer() {
  const { theme } = useTheme();

  return (
    <footer
      className={`
        w-full px-5 sm:px-8 md:px-[10%] py-6 md:py-[3%]
        bg-opacity-50 relative border-t
        ${theme ? "bg-white border-gray-200" : "bg-black border-gray-800"}
      `}
    >
      <div className="w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-0">
        {/* Left - Brand + Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span
            className={`
              text-lg sm:text-xl md:text-2xl font-bold tracking-tight
              ${theme ? "text-gray-900" : "text-gray-100"}
            `}
          >
            My Daily Routine
          </span>

          <span className="hidden sm:inline text-gray-400 dark:text-gray-600">
            •
          </span>

          <span
            className={`
              text-xs sm:text-sm md:text-base
              ${theme ? "text-gray-700" : "text-gray-300"}
            `}
          >
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>

        {/* Right - Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/privacy-policy">
            <div
              className={`
                px-4 py-2 rounded-md text-xs sm:text-sm md:text-base font-medium
                transition-all duration-300 hover:scale-105
                border border-gray-300 dark:border-gray-700
                ${
                  theme
                    ? "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900"
                    : "bg-gray-900 text-gray-200 hover:bg-gray-800 hover:text-gray-100"
                }
              `}
            >
              Privacy Policy
            </div>
          </Link>

          <Link href="/terms-and-conditions">
            <div
              className={`
                px-4 py-2 rounded-md text-xs sm:text-sm md:text-base font-medium
                transition-all duration-300 hover:scale-105
                ${colors.keyBg} ${colors.keyHoverBg} text-white
                border ${colors.keyBorder}
              `}
            >
              Terms & Conditions
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
