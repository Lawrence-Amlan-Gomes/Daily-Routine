// src/app/api/paddle/webhooks/route.ts
// MOST RELIABLE VERSION - Respond immediately, process later
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updatePaymentType } from "@/app/actions";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

if (!PADDLE_WEBHOOK_SECRET) {
  console.error("❌ PADDLE_WEBHOOK_SECRET is missing");
}

function verifyPaddleSignature(
  signatureHeader: string | null,
  rawBody: Buffer,
): boolean {
  if (!signatureHeader) return false;

  try {
    const parts = signatureHeader.split(";");
    const tsMatch = parts.find((p) => p.startsWith("ts="));
    const h1Match = parts.find((p) => p.startsWith("h1="));

    if (!tsMatch || !h1Match) return false;

    const timestamp = tsMatch.split("=")[1];
    const signature = h1Match.split("=")[1];
    const signedPayload = timestamp + ":" + rawBody.toString("utf8");

    const hmac = crypto.createHmac("sha256", PADDLE_WEBHOOK_SECRET);
    hmac.update(signedPayload);
    const computed = hmac.digest("hex");

    return computed === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

const PRICE_ID_TO_PLAN: Record<
  string,
  { type: string; duration: "monthly" | "annual" }
> = {
  pri_01kdjmbr45nfd1xhdde31v3c30: { type: "Standard", duration: "monthly" },
  pri_01kdjma54e1vmzkgzv92qjejs9: { type: "Standard", duration: "annual" },
  pri_01kdjm8f8qqe5cmaa34769mhyc: { type: "Premium", duration: "monthly" },
  pri_01kdjm6drxvy46rs9gp0v2qsvg: { type: "Premium", duration: "annual" },
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Read and verify (fast operations)
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    const signatureHeader = req.headers.get("paddle-signature");

    // Step 2: Verify signature (fast)
    const isValid = verifyPaddleSignature(signatureHeader, bodyBuffer);

    if (!isValid) {
      console.warn("⚠️ Invalid signature");
      // Even for invalid signatures, return 200 to stop retries
      // But log it for investigation
      return NextResponse.json(
        { received: true, verified: false },
        { status: 200 },
      );
    }

    // Step 3: Parse event (fast)
    const text = new TextDecoder().decode(bodyBuffer);
    const event: PaddleWebhookEvent = JSON.parse(text);

    console.log(`📨 Webhook: ${event.event_type} (verified)`);

    // Step 4: Process the event first, then return 200
    await processWebhookEvent(event);

    return NextResponse.json(
      {
        received: true,
        verified: true,
        event_type: event.event_type,
        processing_time_ms: Date.now() - startTime,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent retries
    return NextResponse.json(
      {
        received: true,
        error: "processing",
      },
      { status: 200 },
    );
  }
}

// Type definitions for Paddle webhook events
interface PaddleTransaction {
  items?: Array<{
    price?: {
      id?: string;
    };
    price_id?: string;
    quantity: number;
  }>;
  custom_data?: {
    userEmail?: string;
  } | null;
  customer?: {
    email?: string;
    id?: string;
  } | null;
  customer_id?: string;
  details?: {
    totals?: {
      total?: string;
    };
  };
}

interface PaddleWebhookEvent {
  event_type: string;
  data: PaddleTransaction;
  event_id?: string;
  occurred_at?: string;
}

async function processWebhookEvent(event: PaddleWebhookEvent) {
  const processingStart = Date.now();

  try {

    if (event.event_type === "transaction.completed") {
      const transaction = event.data;

      const priceId =
        transaction.items?.[0]?.price_id ?? transaction.items?.[0]?.price?.id;
      console.log("🔍 Price ID extracted:", priceId);

      const plan = PRICE_ID_TO_PLAN[priceId];
      console.log("🔍 Plan found:", plan);

      if (!plan) {
        console.warn("❌ Unknown price ID:", priceId);
        console.warn("❌ Available price IDs:", Object.keys(PRICE_ID_TO_PLAN));
        return;
      }

      const email =
        transaction.custom_data?.userEmail || transaction.customer?.email;
      console.log("🔍 Email extracted:", email);

      if (!email) {
        console.warn("❌ No email in payload");
        console.warn("❌ custom_data:", transaction.custom_data);
        console.warn("❌ customer:", transaction.customer);
        return;
      }

      const expiredAt = new Date();
      expiredAt.setDate(
        expiredAt.getDate() + (plan.duration === "monthly" ? 30 : 365),
      );

      const paymentString = `${plan.type} ${plan.duration === "monthly" ? "Monthly" : "Annually"}`;
      console.log("🔍 About to call updatePaymentType:", {
        email,
        paymentString,
        expiredAt,
      });

      await updatePaymentType(email, paymentString, expiredAt);

      const processingTime = Date.now() - processingStart;
      console.log(
        `✅ Updated ${email} → ${paymentString} (${processingTime}ms)`,
      );
    } else if (event.event_type === "subscription.canceled") {
      const email =
        event.data.custom_data?.userEmail || event.data.customer?.email;

      if (email) {
        await updatePaymentType(email, "Expired", new Date());
        console.log(`✅ Canceled: ${email}`);
      }
    }
  } catch (error) {
    console.error("❌ Processing failed:", error);
    console.error(
      "❌ Error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
