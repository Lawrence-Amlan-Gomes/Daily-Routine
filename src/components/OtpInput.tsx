"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

const OtpInput = ({ value, onChange, hasError = false }: OtpInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pad to 6 chars so each box always has a controlled value
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit || " ";
    onChange(newDigits.join("").trimEnd());
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const currentVal = digits[index].trim();
      if (!currentVal && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = " ";
        onChange(newDigits.join("").trimEnd());
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = " ";
        onChange(newDigits.join("").trimEnd());
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const baseBox = `w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold
    rounded-lg border-2 outline-none transition-all duration-200 bg-transparent`;

  const colorClass = hasError
    ? "border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 focus:border-red-500 dark:focus:border-red-400"
    : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]";

  return (
    <div className="flex gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`${baseBox} ${colorClass}`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
