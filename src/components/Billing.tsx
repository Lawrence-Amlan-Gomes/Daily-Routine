// src/components/Billing.tsx
"use client";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PaddleForm from "./PaddleForm";

export default function Billing() {
  const { user: auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  return (
    <div className="min-h-screen w-full pt-[100px] flex flex-col items-center justify-center p-6 bg-[#ffffff] dark:bg-[#000000] text-[#0a0a0a] dark:text-[#ebebeb]">
      {/* PaddleForm handles opening the checkout */}
      <PaddleForm />
    </div>
  );
}
