// src/components/Profile.tsx
"use client";

import { deletePhoto, updateUser, uploadPhoto } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

const Profile = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme(); // true = light, false = dark
  const { user: auth, setAuth } = useAuth();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth) {
      setName(auth.name || "");
    }
  }, [auth]);

  const handleUpdate = async () => {
    if (!auth || !name.trim()) return;
    setIsEditing(false);

    try {
      await updateUser(auth.email, { name });
      setAuth({ ...auth, name });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Failed to update name. Please try again.");
      setName(auth.name || "");
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleUpdate();
    } else {
      setIsEditing(true);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be smaller than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { photo } = await uploadPhoto(auth.email, formData);
      setAuth({ ...auth, photo });
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setPhotoLoading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!auth || !auth.photo) return;
    if (!confirm("Remove profile photo?")) return;

    setPhotoLoading(true);
    try {
      await deletePhoto(auth.email);
      setAuth({ ...auth, photo: "" });
    } catch {
      alert("Failed to delete photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    dispatch(logout());
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (!auth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${
          theme ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
            Please log in
          </h1>
          <p
            className={
              theme
                ? "text-gray-600 text-sm sm:text-base"
                : "text-gray-400 text-sm sm:text-base"
            }
          >
            You need to be signed in to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full px-5 ${theme ? "bg-white" : "bg-black"}`}>
      <div
        className={`
          w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto mt-[80px] sm:mt-[100px]
          ${
            theme
              ? "bg-gray-50/95 border-gray-200"
              : "bg-gray-950/80 border-gray-900"
          }
          backdrop-blur-md border rounded-2xl overflow-hidden
        `}
      >
        {/* Header with photo */}
        <div
          className={`px-5 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b ${
            theme ? "border-gray-200" : "border-gray-900"
          } text-center`}
        >
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                {photoLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : auth.photo ? (
                  <Image
                    src={auth.photo}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`text-2xl font-bold ${theme ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {auth.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>

              {/* Overlay on hover */}
              {!photoLoading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="text-white text-xs font-medium">
                    {auth.photo ? "Change" : "Upload"}
                  </span>
                </button>
              )}
            </div>

            {/* Delete button */}
            {auth.photo && !photoLoading && (
              <button
                onClick={handleDeletePhoto}
                className="mt-2 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                Remove photo
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name */}
          {isEditing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`
                w-full max-w-xs mx-auto
                bg-transparent border-b-2 
                ${
                  theme
                    ? "border-gray-400 focus:border-blue-600 text-black"
                    : "border-gray-600 focus:border-blue-500 text-white"
                }
                focus:outline-none text-xl sm:text-2xl font-bold text-center pb-1 transition-colors
              `}
              placeholder="Your name"
            />
          ) : (
            <h1
              className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                theme ? "text-gray-900" : "text-white"
              }`}
            >
              {name || "User"}
            </h1>
          )}

          <p
            className={`mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base break-all ${
              theme ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {auth.email}
          </p>
        </div>

        {/* Info */}
        <div className="px-5 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 text-xs sm:text-sm md:text-base">
            <div className="space-y-0.5 sm:space-y-1">
              <p className={theme ? "text-gray-600" : "text-gray-400"}>
                Subscription
              </p>
              <p
                className={`font-medium ${theme ? "text-gray-900" : "text-white"}`}
              >
                {auth.paymentType || "—"}
              </p>
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <p className={theme ? "text-gray-600" : "text-gray-400"}>
                Expires
              </p>
              <p
                className={`font-medium ${theme ? "text-gray-900" : "text-white"}`}
              >
                {auth.expiredAt ? auth.expiredAt.split("T")[0] : "—"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <button
              onClick={toggleEdit}
              className={`
                w-full py-2.5 sm:py-3.5 px-5 sm:px-6 rounded-lg font-medium text-sm sm:text-base
                transition-all duration-200
                ${
                  isEditing
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-900/30"
                    : theme
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/30"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/30"
                }
              `}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>

            {!auth.isRegisteredWithGoogle && (
              <Link href="/changePassword" className="block">
                <button
                  className={`
                    w-full py-2.5 sm:py-3.5 px-5 sm:px-6 rounded-lg font-medium text-sm sm:text-base
                    transition-all duration-200
                    ${
                      theme
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 hover:border-gray-400"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600"
                    }
                  `}
                >
                  Change Password
                </button>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className={`
                w-full py-2.5 sm:py-3.5 px-5 sm:px-6 rounded-lg font-medium text-sm sm:text-base
                transition-all duration-200
                ${
                  theme
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-900/30"
                    : "bg-red-900/80 hover:bg-red-800/90 text-red-100 border border-red-800/50 hover:border-red-700/70"
                }
              `}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
