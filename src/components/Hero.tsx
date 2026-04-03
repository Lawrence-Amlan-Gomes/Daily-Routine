"use client";

import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

export default function Hero() {
  const { theme } = useTheme();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUnmute = () => {
    if (videoRef.current && isMuted) {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0;
      setIsMuted(false);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen — prefer the video element itself for best experience
      const target = videoRef.current ?? containerRef.current;
      if (target?.requestFullscreen) {
        await target.requestFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.webkitRequestFullscreen) {
        // Safari
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).webkitRequestFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.mozRequestFullScreen) {
        // Firefox
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).mozRequestFullScreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.msRequestFullscreen) {
        // IE/Edge
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).webkitExitFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitExitFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).mozCancelFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozCancelFullScreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).msExitFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Sync state if user exits fullscreen via Escape key
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Attach listener once on mount
  if (typeof document !== "undefined") {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full px-5 sm:px-8 md:px-[10%] mb-12 md:mb-[10%] flex flex-col md:flex-row items-start justify-between"
    >
      {/* Left - Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="w-full md:w-1/2 md:pr-8 lg:pr-[5%] flex flex-col justify-center items-start space-y-5 md:space-y-6"
      >
        <h1
          className={`
            text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight
            ${theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"}
          `}
        >
          Let&apos;s Get {" "}
          <span className={`${colors.keyText}`}>Disciplined</span>
        </h1>

        <p
          className={`
            text-sm sm:text-base md:text-lg lg:text-xl
            ${theme ? "text-gray-700" : "text-gray-300"}
          `}
        >
          Build structured Daily Routines that help you focus better, waste less
          time, and actually get things done.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashBoard"
            className={`
              px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base md:text-lg font-semibold
              transition-all duration-300 flex items-center justify-center
              ${colors.keyBg} ${colors.keyHoverBg} text-white shadow-sm
            `}
          >
            Get Started
          </Link>

          <Link
            href="/pricing"
            className={`
              px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base md:text-lg font-semibold
              transition-all duration-300 border flex items-center justify-center shadow-sm
              ${
                theme
                  ? "border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                  : "border-gray-300 text-gray-300 hover:bg-gray-300 hover:text-gray-900"
              }
            `}
          >
            Pricing
          </Link>
        </div>
      </motion.div>

      {/* Right - Video Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="w-full md:w-1/2 mt-10 md:mt-0 flex justify-center"
      >
        <div
          ref={containerRef}
          className={`
            w-full max-w-[500px] sm:max-w-[600px] aspect-[16/9] rounded-xl border
            ${colors.keyBorder}
            ${theme ? "bg-gray-50" : "bg-[#111111]"}
            overflow-hidden relative group shadow-xl
          `}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full ${isFullscreen ? "object-contain bg-black" : "object-cover"}`}
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Controls - appear on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className={`
                  p-3 rounded-full backdrop-blur-sm
                  ${
                    theme
                      ? "bg-white/80 hover:bg-white text-gray-900"
                      : "bg-black/80 hover:bg-black text-white"
                  }
                  transition-all duration-200 shadow-md
                `}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Unmute (only when muted) */}
              {isMuted && (
                <button
                  onClick={handleUnmute}
                  className={`
                    p-3 rounded-full backdrop-blur-sm
                    ${
                      theme
                        ? "bg-white/80 hover:bg-white text-gray-900"
                        : "bg-black/80 hover:bg-black text-white"
                    }
                    transition-all duration-200 shadow-md
                  `}
                  aria-label="Unmute"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                </button>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className={`
                  p-3 rounded-full backdrop-blur-sm
                  ${
                    theme
                      ? "bg-white/80 hover:bg-white text-gray-900"
                      : "bg-black/80 hover:bg-black text-white"
                  }
                  transition-all duration-200 shadow-md
                `}
                aria-label={
                  isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                }
              >
                {isFullscreen ? (
                  // Compress / exit fullscreen icon
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  // Expand / enter fullscreen icon
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
