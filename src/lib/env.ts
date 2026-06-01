import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  // AUTH_SECRET is the NextAuth v5 alias for NEXTAUTH_SECRET — Coolify may only set one
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  // Nodemailer accepts "Display Name <addr>" format; don't apply Zod email regex here
  SMTP_FROM: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),
  PADDLE_API_KEY: z.string().min(1),
  PADDLE_WEBHOOK_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  // CRON_SECRET gates the cleanup cron endpoint; app works without it (returns 401)
  CRON_SECRET: z.string().min(1).optional(),
});

// Skip validation during `next build` — secrets are runtime-only and not present
// in the build container. The instrumentation hook re-imports this at server start,
// which is when the real parse runs and throws on any missing var.
export const env =
  process.env.NEXT_PHASE === "phase-production-build"
    ? ({} as z.infer<typeof envSchema>)
    : envSchema.parse(process.env);
