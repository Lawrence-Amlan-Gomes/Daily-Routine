// src/models/User.ts
import mongoose, { Document } from "mongoose";

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
  date: string;
  day: string;
  totalTasks: number;
  completedTasks: string[];
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

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  photo?: string;
  photoKey?: string;
  isRegisteredWithGoogle: boolean;
  createdAt: Date;
  expiredAt?: Date;
  isAdmin: boolean;
  paymentType: string;
  routine: IRoutine;
  thisMonthPremiumResponses: string;
  isEmailVerified: boolean;
  goals: IGoal[];
  stats: IStatEntry[];
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    photo: { type: String, default: "" },
    photoKey: { type: String, default: "" },
    isRegisteredWithGoogle: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date },
    isAdmin: { type: Boolean, default: false },
    paymentType: { type: String, default: "Free One Month" },
    routine: {
      type: {
        saturday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        sunday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        monday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        tuesday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        wednesday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        thursday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        friday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
              category: { type: String, default: "", trim: true },
            },
          ],
          default: [],
          _id: false,
        },
      },
      default: {},
      _id: false,
    },
    thisMonthPremiumResponses: {
      type: String,
      default: "",
      trim: true,
    },
    isEmailVerified: { type: Boolean, default: true },
    goals: {
      type: [
        {
          id: { type: String, required: true, trim: true },
          name: { type: String, required: true, trim: true },
          description: { type: String, default: "", trim: true },
          priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
          status: {
            type: String,
            enum: ["todo", "in-progress", "done", "archived"],
            default: "todo",
          },
          category: { type: String, default: "", trim: true },
          dueDate: { type: String, default: "" },
          time: { type: String, default: "" },
          reminderAt: { type: String, default: "" },
          repeat: {
            type: String,
            enum: ["none", "daily", "weekly", "monthly"],
            default: "none",
          },
          tags: [{ type: String, trim: true }],
          subtasks: {
            type: [
              {
                id: { type: String, required: true },
                name: { type: String, required: true, trim: true },
                isDone: { type: Boolean, default: false },
              },
            ],
            default: [],
            _id: false,
          },
          createdAt: { type: String, default: "" },
          finishedAt: { type: String, default: "" },
          pinned: { type: Boolean, default: false },
          color: { type: String, default: "" },
        },
      ],
      default: [],
      _id: false,
    },
    stats: {
      type: [
        {
          date: { type: String, required: true, trim: true },
          day: { type: String, required: true, trim: true },
          totalTasks: { type: Number, required: true, default: 0 },
          completedTasks: [{ type: String, trim: true }],
        },
      ],
      default: [],
      _id: false,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

export const User =
  mongoose.models.users || mongoose.model<IUser>("users", UserSchema);
