// app/api/cron/cleanup-unverified/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongo';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic'; // ← Critical for cron jobs

export async function GET(request: Request) {
  // Security – Vercel sends this special header, but we use our own secret
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const authHeader = request.headers.get('authorization'); // Retrieves the value of the "authorization" header from the incoming request.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { // Checks if the authorization header matches the expected format and value.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // If the header is missing or incorrect, it returns a 401 Unauthorized response.
  }

  try {
    await dbConnect(); // Connects to the database using a helper function (dbConnect).

    const thirtyDaysAgo = new Date(); // Creates a new Date object representing the current date and time.
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // Modifies the Date object to represent the date 30 days in the past by subtracting 30 from the current date.

    const result = await User.deleteMany({ // Executes a delete operation on the User collection in the database, targeting documents that match the specified criteria.
      isEmailVerified: false,
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(
      `[${new Date().toISOString()}] Cleanup unverified: ` +
      `deleted ${result.deletedCount} accounts older than 30 days`
    );

    return NextResponse.json({ // Returns a JSON response indicating the success of the operation, the number of deleted accounts, and a timestamp.
      success: true,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) { // Catches any errors that occur during the database operation.
    console.error('Unverified cleanup error:', error);
    return NextResponse.json( // Returns a JSON response indicating the failure of the operation and an error message.
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}