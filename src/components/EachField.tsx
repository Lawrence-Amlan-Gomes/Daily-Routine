"use client";

import { useEffect, useState } from "react";

// Define the props interface
interface EachFieldProps {
  label: string;
  isReal: boolean;
  name: string;
  type: string;
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  iserror: boolean;
  error?: string;
  showToggle?: boolean;
}

const EachField = ({
  label,
  isReal,
  name,
  type,
  placeholder,
  value,
  setValue,
  iserror,
  error,
  showToggle = false,
}: EachFieldProps) => {
  const [firstTime, setFirstTime] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (value === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstTime(true);
    } else {
      setFirstTime(false);
    }
  }, [value]);

  const inputType =
    type === "password" && showToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <>
      {isReal ? (
        <div>
          <div className="text-[12px] lg:text-[16px] mx-[2%] mb-1 text-start mt-5">
            {value !== "" ? label : ""}
          </div>
          <div className="relative mx-[2%] w-[96%]">
            <input
              className={`p-3 border-[1px] text-[12px] lg:text-[16px] box-border w-full rounded-md focus:outline-none focus:outline-[1px] focus:shadow-none bg-transparent placeholder:text-gray-500 ${
                showToggle ? "pr-10" : ""
              } ${
                firstTime
                  ? "border-gray-400 dark:border-gray-700"
                  : !iserror
                    ? "border-green-700 text-green-600 focus:outline-green-600"
                    : "border-red-600 text-red-600 focus:outline-red-600"
              }`}
              type={inputType}
              value={value}
              name={name}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            {showToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300`}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
          {iserror && (
            <div className="text-red-600 mt-1 text-start text-[10px] lg:text-[14px] w-[96%] mx-[2%]">
              {firstTime ? "" : error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            className="h-[1px] w-[1px] float-left opacity-0"
            type={type}
            value={value}
            name={name}
            onChange={() => console.log("hidden field")}
            placeholder={placeholder}
          />
        </div>
      )}
    </>
  );
};

export default EachField;
