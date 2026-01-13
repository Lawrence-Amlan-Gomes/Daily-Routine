// app/api/cron/cleanup-unverified/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongo';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic'; // ← Critical for cron jobs

export async function GET(request: Request) {
  // Security – Vercel sends this special header, but we use our own secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await User.deleteMany({
      isEmailVerified: false,
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(
      `[${new Date().toISOString()}] Cleanup unverified: ` +
      `deleted ${result.deletedCount} accounts older than 30 days`
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unverified cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}