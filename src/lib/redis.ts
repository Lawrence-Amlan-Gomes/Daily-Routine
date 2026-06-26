import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

export function getRedis(): Redis {
  if (globalThis._redis) return globalThis._redis;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL env var is not set");

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
  });

  client.on("error", (err) => console.error("[redis]", err));

  globalThis._redis = client;
  return client;
}
