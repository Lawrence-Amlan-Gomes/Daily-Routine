import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { ApiRateLimit } from "@/models/ApiRateLimit";

type RateLimitOptions = {
  route: string;
  max: number;
  windowMs: number;
  keyParts?: string[];
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

async function enforceRateLimitCore(
  ip: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; retryAfterSec: number }> {
  await dbConnect();

  const parts = [ip, ...(options.keyParts ?? [])];
  const key = parts.join(":");
  const now = Date.now();
  const windowStart = new Date(now);
  const expiresAt = new Date(now + options.windowMs);

  const existing = await ApiRateLimit.findOne({ key, route: options.route });

  if (!existing || existing.expiresAt.getTime() <= now) {
    await ApiRateLimit.findOneAndUpdate(
      { key, route: options.route },
      {
        $set: {
          count: 1,
          windowStart,
          expiresAt,
        },
      },
      { upsert: true, new: true },
    );
    return {
      allowed: true,
      remaining: options.max - 1,
      retryAfterSec: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.expiresAt.getTime() - now) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  const updated = await ApiRateLimit.findOneAndUpdate(
    { key, route: options.route },
    { $inc: { count: 1 } },
    { new: true },
  );

  const remaining = Math.max(0, options.max - (updated?.count ?? options.max));
  const retryAfterSec = Math.max(
    1,
    Math.ceil(((updated?.expiresAt.getTime() ?? now + options.windowMs) - now) / 1000),
  );
  return { allowed: true, remaining, retryAfterSec };
}

export async function enforceRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; retryAfterSec: number }> {
  return enforceRateLimitCore(getClientIp(req), options);
}

// For use in server actions where NextRequest is unavailable — pass IP from next/headers.
export async function enforceRateLimitByIp(
  ip: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; retryAfterSec: number }> {
  return enforceRateLimitCore(ip, options);
}
