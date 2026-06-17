// src/components/Profile.tsx
"use client";

import { cancelSubscription, deletePhoto, updateUser, uploadPhoto } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";

const Profile = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user: auth, setAuth } = useAuth();

  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [nameError, setNameError] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth?.name !== undefined) setName(auth.name || "");
  }, [auth?.name]);

  const handleUpdate = async () => {
    if (!auth || !name.trim()) return;
    setIsEditing(false);
    setNameError("");
    try {
      await updateUser(auth.email, { name });
      setAuth({ ...auth, name });
    } catch {
      setNameError("Failed to update name. Please try again.");
      setName(auth.name || "");
    }
  };

  const toggleEdit = () => {
    if (isEditing) handleUpdate();
    else {
      setNameError("");
      setIsEditing(true);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be smaller than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoError("");
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { photo } = await uploadPhoto(auth.email, formData);
      setAuth({ ...auth, photo });
    } catch {
      setPhotoError("Failed to upload photo.");
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!auth || !auth.photo) return;
    setDeletePhotoConfirm(false);
    setPhotoLoading(true);
    try {
      await deletePhoto(auth.email);
      setAuth({ ...auth, photo: "" });
    } catch {
      setPhotoError("Failed to delete photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleLogout = async () => {
    dispatch(logout());
    await signOut({ redirect: false });
    router.push("/login");
  };

  const doCancelSubscription = async () => {
    if (!auth?.email) throw new Error("Not signed in");
    await cancelSubscription(auth.email);
  };

  const getSubscriptionBadge = (type: string) => {
    if (type === "Monthly" || type === "Yearly") {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50";
    }
    if (type?.toLowerCase().includes("trial")) {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50";
    }
    return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  };

  if (!auth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black`}
      >
        <p className="text-gray-500 dark:text-gray-400">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  const initials = auth.name
    ? auth.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // ── Subscription state (drives label + cancel button) ──
  // A plan only auto-renews if there is a live Paddle subscription behind it.
  // Free One Month is a one-off trial; a paid plan with no paddleSubscriptionId
  // has been cancelled (or never created a subscription) — neither renews.
  const isFreeTrial = auth.paymentType === "Free One Month";
  const hasActiveSubscription = Boolean(auth.paddleSubscriptionId);
  const subscriptionDateLabel = hasActiveSubscription
    ? "Renews"
    : isFreeTrial
      ? "Free trial ends"
      : "Access until";
  const subscriptionDate = auth.expiredAt
    ? new Date(auth.expiredAt).toLocaleDateString()
    : "—";

  return (
    <div
      className={`min-h-screen w-full px-4 pt-[80px] md:pt-[100px] pb-12 bg-gray-50 dark:bg-black`}
    >
      <div className="w-full max-w-lg mx-auto space-y-4">

        {/* ── Profile card ── */}
        <div
          className={`rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-gray-950 dark:border-gray-800`}
        >
          {/* Avatar + name */}
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div
                  className={`w-24 h-24 rounded-2xl overflow-hidden border-[3px] border-blue-500 shadow-md flex items-center justify-center bg-gray-100 dark:bg-gray-800`}
                >
                  {photoLoading ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : auth.photo ? (
                    <Image
                      src={auth.photo}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className={`text-3xl font-bold select-none text-gray-400 dark:text-gray-500`}
                    >
                      {initials}
                    </span>
                  )}
                </div>

                {!photoLoading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change profile photo"
                    className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    className={`w-full bg-transparent border-b-2 text-xl font-bold focus:outline-none pb-0.5 transition-colors border-gray-300 focus:border-blue-500 text-gray-900 dark:border-gray-700 dark:focus:border-blue-400 dark:text-white`}
                    placeholder="Your name"
                  />
                ) : (
                  <h1
                    className={`text-xl font-bold truncate text-gray-900 dark:text-white`}
                  >
                    {name || "User"}
                  </h1>
                )}
                <p
                  className={`text-sm truncate mt-0.5 text-gray-500 dark:text-gray-400`}
                >
                  {auth.email}
                </p>
              </div>
            </div>

            {/* Name error */}
            {nameError && (
              <p className="text-xs text-red-500 mb-3">{nameError}</p>
            )}

            {/* Photo actions */}
            {(photoError || (auth.photo && !photoLoading)) && (
              <div className="flex items-center gap-3 min-h-[20px]">
                {photoError && (
                  <span className="text-xs text-red-500">{photoError}</span>
                )}
                {auth.photo && !photoLoading && !deletePhotoConfirm && (
                  <button
                    onClick={() => setDeletePhotoConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors ml-auto"
                  >
                    Remove photo
                  </button>
                )}
                {deletePhotoConfirm && (
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    <span
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Remove photo?
                    </span>
                    <button
                      onClick={handleDeletePhoto}
                      className="text-red-500 hover:text-red-400 font-semibold"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletePhotoConfirm(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* ── Account info card ── */}
        <div
          className={`rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-gray-950 dark:border-gray-800`}
        >
          <div
            className={`px-6 py-3.5 border-b border-gray-100 dark:border-gray-800`}
          >
            <h2
              className={`text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500`}
            >
              Account
            </h2>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Subscription */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm text-gray-500 dark:text-gray-400`}
              >
                Subscription
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${getSubscriptionBadge(
                  auth.paymentType,
                )}`}
              >
                {auth.paymentType || "None"}
              </span>
            </div>

            {/* Divider */}
            <div
              className={`h-px bg-gray-100 dark:bg-gray-800`}
            />

            {/* Expiry */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm text-gray-500 dark:text-gray-400`}
              >
                Expires
              </span>
              <span
                className={`text-sm font-medium text-gray-800 dark:text-gray-200`}
              >
                {auth.expiredAt ? auth.expiredAt.split("T")[0] : "—"}
              </span>
            </div>

            {/* Divider */}
            <div
              className={`h-px bg-gray-100 dark:bg-gray-800`}
            />

            {/* Login method */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm text-gray-500 dark:text-gray-400`}
              >
                Login method
              </span>
              <span
                className={`text-sm font-medium flex items-center gap-1.5 text-gray-800 dark:text-gray-200`}
              >
                {auth.isRegisteredWithGoogle ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Subscription card (if active) ── */}
        {auth.paymentType && auth.paymentType !== "Expired" && !auth.paymentType.includes("Test") && (
          <div className="w-full p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Subscription</h2>
            <div className="space-y-2 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Plan:</span> {auth.paymentType}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{subscriptionDateLabel}:</span> {subscriptionDate}
              </p>
              {!hasActiveSubscription && !isFreeTrial && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your subscription is cancelled and will not renew. You keep access until the date above.
                </p>
              )}
            </div>
            {hasActiveSubscription && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        {/* ── Actions card ── */}
        <div
          className={`rounded-2xl border overflow-hidden bg-white border-gray-200 shadow-sm dark:bg-gray-950 dark:border-gray-800`}
        >
          <div
            className={`px-6 py-3.5 border-b border-gray-100 dark:border-gray-800`}
          >
            <h2
              className={`text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500`}
            >
              Actions
            </h2>
          </div>

          <div className="px-6 py-4 space-y-3">
            {/* Edit / Save */}
            <button
              onClick={toggleEdit}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                isEditing
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              }`}
            >
              {isEditing ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Profile
                </>
              )}
            </button>

            {/* Change password */}
            {!auth.isRegisteredWithGoogle && (
              <Link href="/changePassword" className="block">
                <button
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Change Password
                </button>
              </Link>
            )}

            {/* Sign out */}
            {!logoutConfirm ? (
              <button
                onClick={() => setLogoutConfirm(true)}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border text-red-600 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:bg-red-950/40 dark:border-red-900/50`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            ) : (
              <div
                className={`rounded-xl border p-4 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50`}
              >
                <p
                  className={`text-sm text-center mb-3 font-medium text-gray-700 dark:text-gray-300`}
                >
                  Are you sure you want to sign out?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={() => setLogoutConfirm(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={doCancelSubscription}
      />
    </div>
  );
};

export default Profile;
