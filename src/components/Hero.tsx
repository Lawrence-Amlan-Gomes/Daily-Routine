"use client";

import colors from "@/app/color/color";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const FEATURES = [
  "AI-powered routine generation",
  "Progress tracking & analytics",
  "No credit card for free trial",
];

export default function Hero() {
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
      const target = videoRef.current ?? containerRef.current;
      if (target?.requestFullscreen) {
        await target.requestFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.webkitRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).webkitRequestFullscreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.mozRequestFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).mozRequestFullScreen();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((target as any)?.msRequestFullscreen) {
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

  if (typeof document !== "undefined") {
    document.removeEventListener("fullscreenchange", () =>
      setIsFullscreen(!!document.fullscreenElement)
    );
    document.addEventListener("fullscreenchange", () =>
      setIsFullscreen(!!document.fullscreenElement)
    );
  }

  return (
    <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full px-5 sm:px-8 md:px-[10%] flex flex-col md:flex-row items-center justify-between gap-12 md:gap-10"
    >
      {/* Left — Text content */}
      <m.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.7 }}
        className="w-full md:w-1/2 flex flex-col items-start gap-6"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-powered daily planning</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-[#0a0a0a] dark:text-[#ebebeb]">
          Build the habit of{" "}
          <span className={`${colors.keyText}`}>Getting Things Done</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
          Structure your day with AI-generated routines, track your progress,
          and turn consistency into your competitive advantage.
        </p>

        {/* Feature list */}
        <ul className="flex flex-col gap-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Link
            href="/dashBoard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm sm:text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
          >
            View pricing
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          30-day free trial &mdash; no credit card required
        </p>
      </m.div>

      {/* Right — Video */}
      <m.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.7 }}
        className="w-full md:w-1/2 flex justify-center"
      >
        <div
          ref={containerRef}
          className="w-full max-w-[560px] aspect-[16/9] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative group shadow-2xl bg-gray-50 dark:bg-[#111111]"
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

          {/* Controls on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="p-2.5 rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-gray-900 dark:text-white transition-all duration-200 shadow-md"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {isMuted && (
                <button
                  onClick={handleUnmute}
                  className="p-2.5 rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-gray-900 dark:text-white transition-all duration-200 shadow-md"
                  aria-label="Unmute"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-gray-900 dark:text-white transition-all duration-200 shadow-md"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
      </m.div>
    </m.div>
    </LazyMotion>
  );
}
