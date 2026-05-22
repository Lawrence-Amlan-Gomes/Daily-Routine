/* eslint-disable @next/next/no-img-element */
// TopNavbar component
"use client";

import { findUserByEmail } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ProfileIcon from "./ProfileIcon";
import ThemeToggle from "./ThemeToggle";

// ──────────────────────────────────────────────────────────────
//  ONLY ADDED: Props interface + type annotation
// ──────────────────────────────────────────────────────────────
interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ href, label, active, onClick }: NavItemProps) => (
  <Link href={href}>
    <div
      className={`flex items-center h-full px-2 cursor-pointer transition-colors duration-200`}
      onClick={onClick}
    >
      <span
        className={`sm:text-[15px] font-sans tracking-wider ${
          active
            ? colors.keyText
            : "text-[#555555] hover:text-[#000000] dark:text-[#cccccc] dark:hover:text-[#ffffff]"
        } `}
      >
        {label}
      </span>
    </div>
  </Link>
);

const TopNavbar = () => {
  const { user: auth, setAuth } = useAuth();
  const dispatch = useDispatch();
  const [active, setActive] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const trimedPathname = pathname.split("/").pop();

  // Define base navItems
  const baseNavItems = [
    { href: "/home", label: "Home", activeKey: "home" },
    { href: "/dashBoard", label: "DashBoard", activeKey: "dashBoard" },
    { href: "/ai-routine", label: "AI Routine", activeKey: "ai-routine" },
    { href: "/stats", label: "Stats", activeKey: "stats" },
    { href: "/goals", label: "Goals", activeKey: "goals" },
    { href: "/pricing", label: "Pricing", activeKey: "pricing" },
  ];

  // Conditionally add Admin route if user is admin
  const navItems = auth?.isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin", activeKey: "admin" }]
    : baseNavItems;

  // ──────────────────────────────────────────────────────────────
  // Fetch fresh user data from DB **only once** on first render
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const syncAuthWithDB = async () => {
      if (!auth) return; // no user logged in → skip
      if (!auth.routine) {
        dispatch(logout());
        await signOut({ redirect: false });
        return;
      }

      try {
        const freshUser = await findUserByEmail(auth.email);
        if (!mounted) return;

        if (freshUser) {
          setAuth({
            ...freshUser,
            paymentType: freshUser.paymentType ?? "Expired",
          });
        }
        if (!freshUser || !freshUser.routine) {
          dispatch(logout());
          await signOut({ redirect: false });
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
          // Auth cookie expired — clear stale local state silently
          dispatch(logout());
          await signOut({ redirect: false });
        } else {
          console.error("Failed to sync auth with DB:", err);
        }
      }
    };

    syncAuthWithDB();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  useEffect(() => {
    if (trimedPathname) {
      setActive(trimedPathname);
    } else {
      setActive("home");
    }
  }, [trimedPathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`fixed top-0 z-50 w-[100%] h-12 sm:h-14 md:h-16 hidden lg:flex items-center justify-between border-b-[1px] pl-[10%] pr-[11%] bg-opacity-65 backdrop-blur-xl bg-[#ffffff] border-gray-200 dark:bg-[#000000] dark:border-gray-800`}
      >
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/Icon.png"
              alt="My Daily Routine Logo"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 object-contain"
            />
            <div
              className={`text-lg sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide text-[#222222] dark:text-[#dadada]`}
            >
              My Daily Routine
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {navItems.map((item) => (
            <NavItem
              key={item.activeKey}
              href={item.href}
              label={item.label}
              active={active === item.activeKey}
              onClick={() => setActive(item.activeKey)}
            />
          ))}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ProfileIcon
              active={active === "profile" ? "profile" : undefined}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav
        className={`fixed top-0 z-50 w-full h-14 flex lg:hidden border-b-[1px] items-center justify-between px-[10%] bg-opacity-50 backdrop-blur-md bg-[#ffffff] border-gray-200 dark:bg-[#000000] dark:border-gray-800`}
      >
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center gap-2">
            <img
              src="/Icon.png"
              alt="My Daily Routine Logo"
              className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
            />
            <div
              className={`text-[12px] sm:text-[18px] font-bold tracking-wide text-[#222222] dark:text-[#dadada]`}
            >
              My Daily Routine
            </div>
          </div>
        </Link>

        {/* Hamburger Menu Button */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileIcon active={active === "profile" ? "profile" : undefined} />
          <button
            onClick={toggleMenu}
            className={`focus:outline-none text-[#222222] dark:text-[#dadada]`}
          >
            <svg
              className="w-[30px] h-[30px] sm:w-[35px] sm:h-[35px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={`fixed z-40 w-full top-14 bg-opacity-65 backdrop-blur-xl border-b-[1px] bg-[#ffffff] border-[#dddddd] dark:bg-[#000000] dark:border-[#222222]`}
        >
          <div className="flex flex-col items-center py-4 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.activeKey}
                href={item.href}
                label={item.label}
                active={active === item.activeKey}
                onClick={() => {
                  setActive(item.activeKey);
                  setIsMenuOpen(false);
                }}
                />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavbar;
