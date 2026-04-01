// src/components/ThemeInitializer.tsx
"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setTheme } from "@/store/features/theme/themeSlice";

export default function ThemeInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Runs once on client mount — early enough on every reload
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    dispatch(setTheme(!prefersDark)); // true = light, false = dark
  }, [dispatch]);

  return null;
}