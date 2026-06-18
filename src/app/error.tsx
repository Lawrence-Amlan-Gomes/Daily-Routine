"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#ffffff] dark:bg-[#000000]">
      <div className="w-[90%] sm:w-[80%] md:w-[60%] mx-auto px-[5%] sm:px-0 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-[#333333] dark:text-[#dddddd]">
          Oops! Something Went Wrong
        </h1>
        <p className="text-base sm:text-lg lg:text-xl mb-8 text-[#666666] dark:text-[#aaaaaa]">
          We encountered an unexpected error. Please try again or go back home.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#333333] dark:bg-[#dddddd] text-[#ffffff] dark:text-[#000000] hover:bg-[#444444] dark:hover:bg-[#cccccc]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg font-semibold border border-[#333333] dark:border-[#dddddd] text-[#333333] dark:text-[#dddddd] hover:bg-[#f5f5f5] dark:hover:bg-[#111111]"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
