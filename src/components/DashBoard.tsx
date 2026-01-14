"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import EmailNotVerified from "./EmailNotVerified";
import { useRouter } from "next/navigation";
import EditRoutine from "@/components/EditRoutine";
import ShowRoutine from "./ShowRoutine";

// ← ADD THESE TWO LINES HERE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const daysOfWeek = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

type Day = (typeof daysOfWeek)[number];
// ← END OF ADDITION

export default function DashBoard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day>("saturday");
  const [hasMounted, setHasMounted] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [fromHour, setFromHour] = useState("");
  const [fromMinute, setFromMinute] = useState("");
  const [fromPeriod, setFromPeriod] = useState<"AM" | "PM">("AM");
  const [toHour, setToHour] = useState("");
  const [toMinute, setToMinute] = useState("");
  const [toPeriod, setToPeriod] = useState<"AM" | "PM">("AM");
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();
  const router = useRouter();
  console.log("Auth User:", auth);

  useEffect(() => {
    if (auth === null && hasMounted) {
      router.push("/login");
    }
  }, [auth, hasMounted, router]);

  useEffect(() => {
    if (auth && !auth.routine) {
      setAuth(null);
    }
  }, [auth, setAuth]);
  // --------------------------------------------------------------
  // 1. Mark component as mounted after first render
  // --------------------------------------------------------------
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  // --------------------------------------------------------------
  // 2. Spring config – used **only** on desktop toggles
  // --------------------------------------------------------------
  const spring = {
    stiffness: 320,
    damping: 32,
    mass: 1,
  };

  // --------------------------------------------------------------
  // 3. Width values
  // --------------------------------------------------------------
  const sidebar = { closed: "5%", open: "20%" };
  const main = { closed: "95%", open: "80%" };

  // --------------------------------------------------------------
  // 4. Conditional transition – **false** on mount AND on mobile
  // --------------------------------------------------------------
  const transition = hasMounted ? spring : undefined;
  const suggestTime = (startStr?: string, endStr?: string) => {
    if (startStr) {
      const match = startStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
      if (match) {
        setFromHour(match[1]);
        setFromMinute(match[2]);
        setFromPeriod(match[3] as "AM" | "PM");
      }
    }
    if (endStr) {
      const match = endStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
      if (match) {
        setToHour(match[1]);
        setToMinute(match[2]);
        setToPeriod(match[3] as "AM" | "PM");
      }
    }
    setIsPortalOpen(true);
  };

  return auth?.isEmailVerified ? (
    <div className="h-full w-full overflow-hidden fixed">
      {/* -------------------- SIDEBAR (desktop only) -------------------- */}
      <motion.div
        className={`
          h-full float-left hidden sm:block 
          ${
            theme
              ? "bg-white border-r-[1px] border-[#dddddd]"
              : "bg-black border-r-[1px] border-[#222222]"
          }`}
        initial={{ width: sidebar.closed }}
        animate={{
          width: isSidebarOpen ? sidebar.open : sidebar.closed,
        }}
        transition={transition}
      >
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="h-full w-full sm:pt-[55px] md:pt-[60px] overflow-auto"
            >
              <EditRoutine
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                taskSearchQuery={taskSearchQuery}
                setTaskSearchQuery={setTaskSearchQuery}
                isPortalOpen={isPortalOpen}
                setIsPortalOpen={setIsPortalOpen}
                newName={newName}
                setNewName={setNewName}
                fromHour={fromHour}
                setFromHour={setFromHour}
                fromMinute={fromMinute}
                setFromMinute={setFromMinute}
                fromPeriod={fromPeriod}
                setFromPeriod={setFromPeriod}
                toHour={toHour}
                setToHour={setToHour}
                toMinute={toMinute}
                setToMinute={setToMinute}
                toPeriod={toPeriod}
                setToPeriod={setToPeriod}
                suggestTime={suggestTime} // ← renamed function to avoid confusion
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ------------------- TOGGLE ARROW (desktop only) ------------------- */}
      <motion.div
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className={`
          hidden sm:flex
          absolute h-[30px] w-[30px] justify-center items-center
          cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white
          rounded-md top-[80px] left-[1.25%] z-10
        `}
        whileTap={{ scale: 0.92 }}
      >
        {isSidebarOpen ? (
          <MdKeyboardDoubleArrowLeft size={20} />
        ) : (
          <MdKeyboardDoubleArrowRight size={20} />
        )}
      </motion.div>

      {/* ----------------------- MAIN (Chat) ----------------------- */}
      <motion.div
        className="h-full relative float-left sm:float-left sm:block hidden"
        initial={{ width: "100%" }} // mobile = full width instantly
        animate={{
          width: isSidebarOpen ? main.open : main.closed,
        }}
        // On mobile we **force** width 100% and **disable** animation
        style={{ width: "100%" }} // overrides animation on <sm
        transition={transition}
      >
        <ShowRoutine
          setIsSidebarOpen={setIsSidebarOpen}
          setSelectedDay={setSelectedDay}
          setTaskSearchQuery={setTaskSearchQuery}
          onFreeTimeClick={suggestTime}
        />
      </motion.div>

      <motion.div className="h-full w-full relative float-left sm:float-left block sm:hidden"></motion.div>
    </div>
  ) : (
    <EmailNotVerified />
  );
}
