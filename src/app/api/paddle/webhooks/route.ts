// src/app/api/paddle/webhooks/route.ts
import { updatePaymentType } from "@/app/actions";
import { dbConnect } from "@/lib/mongo";
import { PaddleWebhookEvent } from "@/models/PaddleWebhookEvent";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

if (!PADDLE_WEBHOOK_SECRET) {
  console.error("PADDLE_WEBHOOK_SECRET is missing from environment");
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
    console.error("Paddle signature verification error:", error);
    return false;
  }
}

const PRICE_ID_TO_PLAN: Record<
  string,
  { type: string; duration: "monthly" | "annual" }
> = {
  pri_01kpf5zbeyrp5nygyc1hma68ed: { type: "Standard", duration: "monthly" },
  pri_01kpf65jm2m5cg2y7z0sqrajjg: { type: "Standard", duration: "annual" },
  pri_01kpf635sdhtbak3tecz31cjkr: { type: "Premium", duration: "monthly" },
  pri_01kpf66wsrnfnzd9ptnvrxdaxy: { type: "Premium", duration: "annual" },
  pri_01krx4s2cbrsawpppxybw9rggg: { type: "Admin", duration: "monthly" },
  pri_01krx4nkm89ftvjk6jba3drgd2: { type: "Admin", duration: "annual" },
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    const signatureHeader = req.headers.get("paddle-signature");

    const isValid = verifyPaddleSignature(signatureHeader, bodyBuffer);
    if (!isValid) {
      return NextResponse.json(
        { received: true, verified: false },
        { status: 401 },
      );
    }

    const text = new TextDecoder().decode(bodyBuffer);
    const event: PaddleWebhookEvent = JSON.parse(text);
    await dbConnect();

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
        { received: true, verified: true, duplicate: true },
        { status: 200 },
      );
    }

    await processWebhookEvent(event);
    await PaddleWebhookEvent.create({
      eventId: event.event_id,
      eventType: event.event_type,
    });

    return NextResponse.json(
      { received: true, verified: true, event_type: event.event_type },
      { status: 200 },
    );
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json({ received: false, error: "processing" }, { status: 500 });
  }
}

interface PaddleTransaction {
  id?: string;
  subscription_id?: string;
  items?: Array<{
    price?: { id?: string };
    price_id?: string;
    quantity: number;
  }>;
  custom_data?: { userEmail?: string } | null;
  customer?: { email?: string; id?: string } | null;
  customer_id?: string;
  details?: { totals?: { total?: string } };
}

interface PaddleWebhookEvent {
  event_type: string;
  data: PaddleTransaction;
  event_id?: string;
  occurred_at?: string;
}

async function processWebhookEvent(event: PaddleWebhookEvent) {
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
      }
    }
  } catch (error) {
    console.error(`Paddle event processing failed [${event.event_type}]:`, error);
  }
}

async function handleTransactionCompleted(transaction: PaddleTransaction) {
  const priceId =
    transaction.items?.[0]?.price_id ?? transaction.items?.[0]?.price?.id;
  if (!priceId) {
    console.warn("Paddle: missing price ID in transaction.completed payload");
    return;
  }

  const plan = PRICE_ID_TO_PLAN[priceId];
  if (!plan) {
    console.warn(`Paddle: unknown price ID ${priceId}`);
    return;
  }

  const email =
    transaction.custom_data?.userEmail || transaction.customer?.email;
  if (!email) {
    console.warn("Paddle: no email in transaction.completed payload");
    return;
  }

  const expiredAt = new Date();
  expiredAt.setDate(
    expiredAt.getDate() + (plan.duration === "monthly" ? 30 : 365),
  );

  const paymentString = `${plan.type} ${plan.duration === "monthly" ? "Monthly" : "Annually"}`;
  await updatePaymentType(email, paymentString, expiredAt, { bypassAuth: true });
}

async function handleSubscriptionActivated(subscription: PaddleTransaction) {
  console.log("[handleSubscriptionActivated] Processing subscription activation");
  console.log("[handleSubscriptionActivated] Full subscription data:", JSON.stringify(subscription, null, 2));

  const priceId = subscription.items?.[0]?.price?.id;
  console.log("[handleSubscriptionActivated] Price ID found:", priceId);

  if (!priceId) {
    console.warn("Paddle: missing price ID in subscription.activated payload");
    return;
  }

  const plan = PRICE_ID_TO_PLAN[priceId];
  console.log("[handleSubscriptionActivated] Plan found:", plan);

  if (!plan) {
    console.warn(`Paddle: unknown subscription price ID ${priceId}`);
    return;
  }

  const email =
    subscription.custom_data?.userEmail || subscription.customer?.email;
  console.log("[handleSubscriptionActivated] Email found:", email);

  if (!email) {
    console.warn("Paddle: no email in subscription.activated payload");
    return;
  }

  const subscriptionId = subscription.subscription_id || subscription.id;
  console.log("[handleSubscriptionActivated] Subscription ID found:", subscriptionId);
  console.log("[handleSubscriptionActivated] subscription.subscription_id:", subscription.subscription_id);
  console.log("[handleSubscriptionActivated] subscription.id:", subscription.id);

  if (!subscriptionId) {
    console.warn("Paddle: no subscription ID in subscription.activated payload");
    return;
  }

  const expiredAt = new Date();
  expiredAt.setDate(
    expiredAt.getDate() + (plan.duration === "monthly" ? 30 : 365),
  );

  const paymentString = `${plan.type} ${plan.duration === "monthly" ? "Monthly" : "Annually"}`;
  console.log("[handleSubscriptionActivated] Calling updatePaymentType with:", {
    email,
    paymentString,
    expiredAt,
    subscriptionId,
  });

  await updatePaymentType(email, paymentString, expiredAt, { bypassAuth: true, subscriptionId });
  console.log("[handleSubscriptionActivated] updatePaymentType completed");
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
