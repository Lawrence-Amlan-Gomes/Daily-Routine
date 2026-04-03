// Check payment types of all users
// GET /api/check-payment-types

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    
    // Get all users with their payment types
    const allUsers = await User.find({}).select('email paymentType todayPremiumResponses thisMonthPremiumResponses');
    
    // Group by payment type
    const usersByPaymentType: { [key: string]: any[] } = {};
    
    allUsers.forEach(user => {
      const paymentType = user.paymentType || 'Unknown';
      if (!usersByPaymentType[paymentType]) {
        usersByPaymentType[paymentType] = [];
      }
      usersByPaymentType[paymentType].push({
        email: user.email,
        todayPremiumResponses: user.todayPremiumResponses,
        thisMonthPremiumResponses: user.thisMonthPremiumResponses
      });
    });
    
    return NextResponse.json({
      totalUsers: allUsers.length,
      usersByPaymentType,
      allUsers: allUsers.map(u => ({
        email: u.email,
        paymentType: u.paymentType,
        todayPremiumResponses: u.todayPremiumResponses,
        thisMonthPremiumResponses: u.thisMonthPremiumResponses
      }))
    });
    
  } catch (error) {
    console.error("Check failed:", error);
    return NextResponse.json(
      { 
        error: "Check failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
