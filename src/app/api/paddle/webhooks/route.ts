// src/app/api/paddle/webhooks/route.ts
// MOST RELIABLE VERSION - Respond immediately, process later
import { updatePaymentType } from "@/app/actions";
import { dbConnect } from "@/lib/mongo";
import { PaddleWebhookEvent } from "@/models/PaddleWebhookEvent";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

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

    const computedBuffer = Buffer.from(computed, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");
    if (computedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
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
  pri_01kn9tb18t1hgh5n59p85xakkm: { type: "Test", duration: "monthly" },
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
      return NextResponse.json(
        { received: true, verified: false },
        { status: 401 },
      );
    }

    // Step 3: Parse event (fast)
    const text = new TextDecoder().decode(bodyBuffer);
    const event: PaddleWebhookEvent = JSON.parse(text);
    await dbConnect();

    console.log(`📨 Webhook: ${event.event_type} (verified)`);

    if (!event.event_id) {
      return NextResponse.json(
        { received: false, error: "missing_event_id" },
        { status: 400 },
      );
    }

    const existingEvent = await PaddleWebhookEvent.findOne({
      eventId: event.event_id,
    });
    if (existingEvent) {
      return NextResponse.json(
        {
          received: true,
          verified: true,
          duplicate: true,
          event_type: event.event_type,
        },
        { status: 200 },
      );
    }

    await processWebhookEvent(event);
    await PaddleWebhookEvent.create({
      eventId: event.event_id,
      eventType: event.event_type,
    });

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
    return NextResponse.json(
      {
        received: false,
        error: "processing",
      },
      { status: 500 },
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
      await handleTransactionCompleted(event.data);
    } else if (event.event_type === "subscription.activated") {
      await handleSubscriptionActivated(event.data);
    } else if (event.event_type === "subscription.canceled") {
      const email =
        event.data.custom_data?.userEmail || event.data.customer?.email;

      if (email) {
        await updatePaymentType(email, "Expired", new Date(), {
          bypassAuth: true,
        });
        console.log(`✅ Canceled: ${email}`);
      }
    }
  } catch (error) {
    const processingTime = Date.now() - processingStart;
    console.error("❌ Processing failed:", error);
    console.error(
      "❌ Error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
    console.error(`❌ Processing time: ${processingTime}ms`);
  }
}

async function handleTransactionCompleted(transaction: PaddleTransaction) {
  const priceId =
    transaction.items?.[0]?.price_id ?? transaction.items?.[0]?.price?.id;
  console.log("🔍 Price ID extracted:", priceId);

  if (!priceId) {
    console.warn("❌ Missing price ID in payload");
    return;
  }

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

  const processingStart = Date.now();
  const expiredAt = new Date();
  expiredAt.setDate(
    expiredAt.getDate() + (plan.duration === "monthly" ? 30 : 365),
  );

  const paymentString = `${plan.type} ${plan.duration === "monthly" ? "Monthly" : "Annually"}`;
  console.log("🔍 About to call updatePaymentType:", {
    email,
    paymentString,
    plan,
    expiredAt,
  });

  await updatePaymentType(email, paymentString, expiredAt, {
    bypassAuth: true,
  });

  const processingTime = Date.now() - processingStart;
  console.log(`✅ Updated ${email} → ${paymentString} (${processingTime}ms)`);
}

async function handleSubscriptionActivated(subscription: PaddleTransaction) {
  // For subscription events, we need to extract the price ID differently
  const priceId = subscription.items?.[0]?.price?.id;
  console.log("🔍 Subscription Price ID extracted:", priceId);

  if (!priceId) {
    console.warn("❌ Missing price ID in subscription payload");
    return;
  }

  const plan = PRICE_ID_TO_PLAN[priceId];
  console.log("🔍 Subscription Plan found:", plan);

  if (!plan) {
    console.warn("❌ Unknown subscription price ID:", priceId);
    console.warn("❌ Available price IDs:", Object.keys(PRICE_ID_TO_PLAN));
    return;
  }

  const email =
    subscription.custom_data?.userEmail || subscription.customer?.email;
  console.log("🔍 Subscription Email extracted:", email);

  if (!email) {
    console.warn("❌ No email in subscription payload");
    console.warn("❌ custom_data:", subscription.custom_data);
    console.warn("❌ customer:", subscription.customer);
    return;
  }

  const expiredAt = new Date();
  expiredAt.setDate(
    expiredAt.getDate() + (plan.duration === "monthly" ? 30 : 365),
  );

  const paymentString = `${plan.type} ${plan.duration === "monthly" ? "Monthly" : "Annually"}`;
  console.log("🔍 About to call updatePaymentType for subscription:", {
    email,
    paymentString,
    plan,
    expiredAt,
  });

  await updatePaymentType(email, paymentString, expiredAt, {
    bypassAuth: true,
  });

  console.log(`✅ Updated ${email} → ${paymentString} (subscription)`);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
