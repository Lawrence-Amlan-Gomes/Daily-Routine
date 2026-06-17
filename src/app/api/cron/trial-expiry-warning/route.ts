// src/app/api/cron/trial-expiry-warning/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/models/User";
import { sendTrialExpiringEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringUsers = await User.find({
      paymentType: "Free One Month",
      expiredAt: { $gte: now, $lte: in3Days },
    }).select("email name expiredAt");

    let sent = 0;
    let failed = 0;

    for (const user of expiringUsers) {
      const msLeft = (user.expiredAt as Date).getTime() - now.getTime();
      const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const result = await sendTrialExpiringEmail(user.email, user.name, daysLeft);
      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`[trial-expiry-warning] Failed to email ${user.email}:`, result.error);
      }
    }

    console.log(
      `[${new Date().toISOString()}] Trial expiry warning: sent=${sent} failed=${failed} total=${expiringUsers.length}`
    );

    return NextResponse.json({
      success: true,
      emailsSent: sent,
      emailsFailed: failed,
      usersFound: expiringUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[trial-expiry-warning] Cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
