"use client";

import colors from "@/app/color/color";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Bot, CalendarCheck, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    icon: Bot,
    step: "01",
    title: "Describe your goals",
    description:
      "Tell our AI what you want to achieve — fitness, productivity, learning — and it builds a structured routine for you.",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Follow your daily plan",
    description:
      "Each day is broken into clear, timed tasks. Check off items as you go and stay on track effortlessly.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Track your progress",
    description:
      "See streaks, completion rates, and goal progress over time. Consistency compounds — watch yourself improve.",
  },
];

export default function HowToUse() {
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
    <div className="w-full px-5 sm:px-8 md:px-[10%]">
      {/* Section header */}
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 md:mb-16"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-[#0a0a0a] dark:text-[#ebebeb]">
          From goal to habit in{" "}
          <span className={colors.keyText}>three steps</span>
        </h2>
        <p className="mt-4 text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          My Daily Routine guides you from setting intentions to building
          lasting habits — no willpower required.
        </p>
      </m.div>

      {/* Steps row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 md:mb-16">
        {STEPS.map(({ icon: Icon, step, title, description }, i) => (
          <m.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-3xl font-black text-gray-300 dark:text-gray-600 select-none">
                {step}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </m.div>
        ))}
      </div>

      {/* Video */}
      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="w-full flex justify-center"
      >
        <div
          ref={containerRef}
          className={`w-full max-w-[860px] aspect-[16/9] rounded-2xl border overflow-hidden relative group shadow-2xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111111]`}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full ${isFullscreen ? "object-contain bg-black" : "object-cover"}`}
          >
            <source src="/howToUse.mp4" type="video/mp4" />
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
    </div>
    </LazyMotion>
  );
}
