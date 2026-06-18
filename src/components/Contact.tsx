"use client";

import { sendContactMessage } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Footer from "./Footer";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

export default function Contact() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await sendContactMessage(name, subject, body);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setName("");
        setSubject("");
        setBody("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      {/* Page header */}
      <div className="w-full border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] pt-28 sm:pt-32 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            Support
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Get in Touch
          </h1>
        </div>
      </div>

      <div className="flex-grow max-w-6xl mx-auto px-5 sm:px-8 md:px-[10%] py-12 md:py-16 w-full">
        <div className="max-w-xl">
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400 mb-8">
            Have a billing question, issue with your account, or feedback about
            the app? Send us a message — we respond within 1–2 business days.
          </p>

          {!user ? (
            /* Not logged in */
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You must be logged in to send a message.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  Create account
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
                Or email us directly:
              </p>
              <a
                href="mailto:mydailyroutinecontact@gmail.com"
                className="inline-flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                mydailyroutinecontact@gmail.com
              </a>
            </div>
          ) : success ? (
            /* Success state */
            <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-6">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                Message sent!
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                We&apos;ll get back to you at{" "}
                <span className="font-medium">{user.email}</span> within 1–2
                business days.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            /* Contact form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email — readonly */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  required
                  maxLength={200}
                  className={inputClass}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe your question or issue..."
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-semibold text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
