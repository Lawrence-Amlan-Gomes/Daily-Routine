"use client";

import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function HowToUse() {
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full px-5 sm:px-8 md:px-[10%] mb-12 md:mb-[10%] flex flex-col items-center gap-10"
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center"
      >
        <h2
          className={`
            text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight
            ${theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"}
          `}
        >
          How To{" "}
          <span className={`${colors.keyText}`}>Use</span>
        </h2>
        <p
          className={`
            mt-3 text-sm sm:text-base md:text-lg
            ${theme ? "text-gray-600" : "text-gray-400"}
          `}
        >
          Watch how easy it is to get started and build your perfect daily routine.
        </p>
      </motion.div>

      {/* Video */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        className="w-full flex justify-center"
      >
        <div
          ref={containerRef}
          className={`
            w-full max-w-[800px] aspect-[16/9] rounded-xl border
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
            <source src="/howToUse.mp4" type="video/mp4" />
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
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