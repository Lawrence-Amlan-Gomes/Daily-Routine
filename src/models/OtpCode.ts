import mongoose, { Document, Model } from "mongoose";

export interface IOtpCode extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedUntil?: Date;
  createdAt: Date;
}

const OtpCodeSchema = new mongoose.Schema<IOtpCode>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: { type: Number, default: 0 },
    verifiedUntil: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const OtpCode: Model<IOtpCode> =
  mongoose.models.otp_codes || mongoose.model<IOtpCode>("otp_codes", OtpCodeSchema);
