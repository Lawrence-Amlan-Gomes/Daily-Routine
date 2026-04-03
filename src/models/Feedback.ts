// src/models/Feedback.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IFeedback extends Document {
  email: string;
  userName?: string;
  user?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  repliedByAdmin?: string;
  repliedAt?: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    repliedByAdmin: String,
    repliedAt: Date,
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ email: 1, createdAt: -1 });

export const Feedback =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);