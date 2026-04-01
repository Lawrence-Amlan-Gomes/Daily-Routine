// src/store/features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IRoutineItem {
  name: string;
  time: string;
  category?: string;
}

export interface ISubtask {
  id: string;
  name: string;
  isDone: boolean;
}

export interface IGoal {
  id: string;
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "done" | "archived";
  category: string;
  dueDate: string;
  time: string;
  reminderAt: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  tags: string[];
  subtasks: ISubtask[];
  createdAt: string;
  finishedAt: string;
  pinned: boolean;
  color: string;
}

export interface IStatEntry {
  date: string;              // "YYYY-MM-DD"
  day: string;               // "saturday"
  totalTasks: number;        // total tasks scheduled that day
  completedTasks: string[];  // task names completed
}

export interface IRoutine {
  saturday: IRoutineItem[];
  sunday: IRoutineItem[];
  monday: IRoutineItem[];
  tuesday: IRoutineItem[];
  wednesday: IRoutineItem[];
  thursday: IRoutineItem[];
  friday: IRoutineItem[];
}

export interface CleanUser {
  id: string;
  name: string;
  email: string;
  photo: string;
  isRegisteredWithGoogle: boolean;
  isAdmin: boolean;
  createdAt: string;
  expiredAt: string;
  paymentType: string;
  routine: IRoutine;
  todayPremiumResponses: string;
  stats: IStatEntry[];
  goals: IGoal[];
}

interface AuthState {
  user: CleanUser | null;
}

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<CleanUser | null>) => {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("authUser", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("authUser");
        }
      }
    },
    logout: (state) => {
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
      }
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;