import mongoose, { Document, Model } from "mongoose";

export interface IPaddleWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  receivedAt: Date;
}

const PaddleWebhookEventSchema = new mongoose.Schema<IPaddleWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    eventType: { type: String, required: true, trim: true },
    receivedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const PaddleWebhookEvent: Model<IPaddleWebhookEvent> =
  mongoose.models.paddle_webhook_events ||
  mongoose.model<IPaddleWebhookEvent>(
    "paddle_webhook_events",
    PaddleWebhookEventSchema,
  );
