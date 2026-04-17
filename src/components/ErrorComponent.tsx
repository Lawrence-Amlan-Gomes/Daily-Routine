"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ErrorComponent({ is404 = false }) {
  const pathname = usePathname();
  const trimmedPathname = pathname.split("/").pop() || "unknown";

  const message = is404
    ? `The route '/${trimmedPathname}' isn't a valid page for this application.`
    : "We encountered an unexpected error. Please try again later or contact support.";

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#ffffff] dark:bg-[#000000] text-[#aaaaaa] dark:text-[#eeeeee]">
      <div className="w-[90%] sm:w-[80%] md:w-[60%] mx-auto px-[5%] sm:px-0 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-[#333333] dark:text-[#dddddd]">
          {is404 ? "404 - Page Not Found" : "Oops! Something Went Wrong"}
        </h1>
        <p className="text-base sm:text-lg lg:text-xl mb-8 text-[#666666] dark:text-[#aaaaaa]">
          {message}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#333333] dark:bg-[#dddddd] text-[#ffffff] dark:text-[#000000] hover:bg-[#444444] dark:hover:bg-[#cccccc]"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
