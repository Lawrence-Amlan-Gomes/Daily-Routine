// src/lib/models/AIRoutine.ts
import mongoose from "mongoose";

const AIRoutineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { _id: false },
);

const ChatSessionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { _id: false },
);

const AIRoutineSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    aiRoutine: {
      saturday: { type: [AIRoutineItemSchema], default: [] },
      sunday: { type: [AIRoutineItemSchema], default: [] },
      monday: { type: [AIRoutineItemSchema], default: [] },
      tuesday: { type: [AIRoutineItemSchema], default: [] },
      wednesday: { type: [AIRoutineItemSchema], default: [] },
      thursday: { type: [AIRoutineItemSchema], default: [] },
      friday: { type: [AIRoutineItemSchema], default: [] },
    },
    chatHistory: { type: [ChatSessionSchema], default: [] },
  },
  { versionKey: false, timestamps: true },
);

export const AIRoutine =
  mongoose.models.airoutines ||
  mongoose.model("airoutines", AIRoutineSchema);