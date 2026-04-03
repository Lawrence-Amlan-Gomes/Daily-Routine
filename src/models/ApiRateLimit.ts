import mongoose, { Document, Model } from "mongoose";

export interface IApiRateLimit extends Document {
  key: string;
  route: string;
  count: number;
  windowStart: Date;
  expiresAt: Date;
}

const ApiRateLimitSchema = new mongoose.Schema<IApiRateLimit>(
  {
    key: { type: String, required: true, trim: true, index: true },
    route: { type: String, required: true, trim: true, index: true },
    count: { type: Number, required: true, default: 0 },
    windowStart: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false },
);

ApiRateLimitSchema.index({ key: 1, route: 1 }, { unique: true });

export const ApiRateLimit: Model<IApiRateLimit> =
  mongoose.models.api_rate_limits ||
  mongoose.model<IApiRateLimit>("api_rate_limits", ApiRateLimitSchema);
