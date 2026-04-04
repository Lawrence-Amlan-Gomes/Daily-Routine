// Initialize monthly responses for premium users who don't have the field yet
// POST /api/initialize-monthly-responses

import { dbConnect } from "@/lib/mongo";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await dbConnect();

    console.log("Initializing monthly responses for premium users...");

    // Get current month string in YYYY-MM format
    const currentMonth = new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
    });

    console.log(`Initializing for month: ${currentMonth}`);

    // Find all premium users who don't have thisMonthPremiumResponses
    const premiumUsers = await User.find({
      paymentType: { $regex: /premium/i },
      thisMonthPremiumResponses: { $exists: false },
    });

    console.log(
      `Found ${premiumUsers.length} premium users without monthly tracking`,
    );

    if (premiumUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All premium users already have monthly tracking",
        stats: { totalFound: 0, successfullyInitialized: 0, errors: 0 },
      });
    }

    let initializedCount = 0;
    const errors: string[] = [];

    for (const user of premiumUsers) {
      try {
        console.log(`Initializing user: ${user.email}`);

        // Initialize with 0 responses for current month
        const newMonthlyData = `${currentMonth} 0`;

        // Update the user document
        const updateResult = await User.updateOne(
          { _id: user._id },
          {
            $set: { thisMonthPremiumResponses: newMonthlyData },
            $unset: { todayPremiumResponses: "" }, // Remove old field if it exists
          },
        );

        console.log(`Update result for ${user.email}:`, updateResult);

        if (updateResult.modifiedCount > 0) {
          initializedCount++;
          console.log(`Successfully initialized user ${user.email}`);
        } else {
          console.log(`No changes made for user ${user.email}`);
        }
      } catch (error) {
        const errorMsg = `Error initializing user ${user.email}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      message: "Initialization completed",
      currentMonth,
      stats: {
        totalFound: premiumUsers.length,
        successfullyInitialized: initializedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`Initialization completed:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Initialization failed:", error);
    return NextResponse.json(
      {
        error: "Initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Allow GET to check status
export async function GET() {
  try {
    await dbConnect();

    // Count premium users without monthly tracking
    const premiumUsersWithoutMonthly = await User.countDocuments({
      paymentType: { $regex: /premium/i },
      thisMonthPremiumResponses: { $exists: false },
    });

    const premiumUsersWithMonthly = await User.countDocuments({
      paymentType: { $regex: /premium/i },
      thisMonthPremiumResponses: { $exists: true },
    });

    return NextResponse.json({
      status: "ready",
      premiumUsersWithoutMonthly,
      premiumUsersWithMonthly,
      message:
        premiumUsersWithoutMonthly > 0
          ? "Ready to initialize"
          : "All premium users initialized",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Status check failed", details: String(error) },
      { status: 500 },
    );
  }
}
