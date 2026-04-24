# My Daily Routine

[mydailyroutine.app](https://mydailyroutine.app) — a productivity web app for planning weekly routines, tracking goals, and recording daily completion stats. Built with Next.js 16 and the App Router.

Features include an AI-assisted routine builder (Google Gemini), goal management with subtasks and priorities, profile photos, email/password and Google OAuth sign-in, email OTP verification, one-time Paddle checkout for the premium tier, and admin tooling for user and feedback management.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React Compiler), React 19.2, TypeScript 5.9 (strict) |
| Styling | Tailwind CSS 3.4 (class-based dark mode), Framer Motion 12, Lucide, `clsx` |
| State | Redux Toolkit 2 + react-redux 9 |
| Auth | NextAuth v5 beta (Google) + custom JWT via `jose` (email/password), `bcrypt` |
| Database | MongoDB via Mongoose 8 |
| Storage | S3-compatible (MinIO) via `@aws-sdk/client-s3`, `sharp` for image resize |
| Payments | Paddle (one-time purchase), HMAC-SHA256 webhook verification |
| AI | `@google/genai` (Gemini) |
| Email | `nodemailer` over Brevo SMTP |
| Charts | Recharts 3 |
| Toasts | Sonner 2 |

## Prerequisites

- Node.js 20+ and npm
- A MongoDB instance (local or Atlas)
- Optional services, depending on which flows you want to exercise locally:
  - Google Cloud project with OAuth 2.0 client (Google sign-in)
  - Google Gemini API key (AI routine builder)
  - Paddle sandbox account (checkout and webhooks)
  - Brevo (or any SMTP provider) account (OTP, welcome, password reset)
  - S3-compatible bucket, e.g. MinIO or AWS S3 (profile photos)

## Getting Started

```bash
# 1. Clone and install
git clone <repo-url>
cd "Daily Routine"
npm install

# 2. Create .env.local at the repo root (see Environment Variables below)

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

MongoDB connects lazily on the first request; there is no seed script. Users accumulate through registration.

## Development Commands

```bash
npm run dev      # next dev — hot reload, React Compiler enabled
npm run build    # next build — production build
npm run start    # next start — run the production build
npm run lint     # ESLint 9 (flat config)
```

There is currently no test script and no formatter script. TypeScript is checked implicitly by `next build`.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, metadata, ThemeProvider
│   ├── ClientLayout.tsx          # Redux Provider and client wrappers
│   ├── page.tsx, home/           # Marketing and landing
│   ├── (auth)/forgot-password/   # Route group for auth flows
│   ├── login/, register/         # Auth pages
│   ├── dashBoard/, goals/,       # Protected app pages
│   │   stats/, profile/,
│   │   billing/, ai-routine/,
│   │   admin/, changePassword/,
│   │   color/
│   ├── pricing/, privacy/,       # Marketing and legal
│   │   terms-and-conditions/,
│   │   refund/, testimonials/
│   ├── actions/index.ts          # All server actions (auth, user, goals, routine, feedback, photo)
│   ├── server.ts                 # Gemini server action (aiRoutineResponse)
│   ├── hooks/                    # useAuth, usePrice, useResponse
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── cron/cleanup-unverified/  # Deletes unverified users >30 days old
│   │   ├── paddle/webhooks/      # HMAC-verified Paddle webhook receiver
│   │   ├── send-otp/, verify-jwt/
│   ├── manifest.ts, sitemap.ts, robots.ts
│   └── error/, not-found.tsx
├── auth.ts                       # NextAuth v5 configuration (Google provider)
├── middleware.ts                 # Route protection (NextAuth session or JWT cookie)
├── components/                   # Feature components (PascalCase .tsx)
├── lib/
│   ├── mongo.ts                  # Connection with global promise cache
│   ├── data-util.ts              # cleanUserForClient (Mongoose → plain object)
│   ├── photoService.ts           # S3 upload/delete with sharp resize
│   ├── s3.ts                     # S3 client
│   └── server/                   # email.ts, jwt.ts, rate-limit.ts
├── models/                       # Mongoose schemas
└── store/                        # Redux store and feature slices
public/                           # Icons, images, Open Graph assets
next.config.ts                    # CSP, Paddle frame-src, 10 MB server action body limit
```

## Architecture Overview

### Authentication

The app runs two identity systems in parallel.

- **Google users** sign in through NextAuth v5 (`src/auth.ts`). The session is carried in NextAuth cookies.
- **Email/password users** use a custom flow: `performLogin` verifies the password with `bcrypt`, then issues an HS256 JWT (7-day expiry) via `jose` and stores it in an httpOnly `authToken` cookie.

`src/middleware.ts` protects `/dashBoard`, `/goals`, `/stats`, `/profile`, `/billing`, `/ai-routine`, `/admin`, `/changePassword`, and `/color`. It checks for a NextAuth session first and falls back to verifying the `authToken` cookie. On failure it redirects to `/login?callbackUrl=...`.

Server actions re-derive the caller with `getActionActor()` in `src/app/actions/index.ts`. The client-passed `email` argument is **never trusted**; actions call `assertActorCanAccessEmail(target)` to enforce that non-admin callers can only read or mutate their own data.

### Email verification

OTP codes are stored hashed in the `OtpCode` collection with `expiresAt` and `attempts`. Unverified accounts are removed after 30 days by `GET /api/cron/cleanup-unverified`, which requires a `Bearer ${CRON_SECRET}` header.

### Data model

A single `users` collection stores:

- `routine` — a per-weekday array of `{ name, time, category }`
- `goals` — each with subtasks, priority, status, repeat rule, tags
- `stats` — per-day list of completed task names
- Account fields: `paymentType`, `expiredAt`, `isAdmin`, `isEmailVerified`, `photo`, `photoKey`

The AI routine lives in its own `AIRoutine` collection, per user, and holds both conversation history and the AI-generated routine.

### AI routine builder

`src/app/server.ts#aiRoutineResponse` wraps Gemini with a system prompt that references the user's actual routine and the current AI routine, and returns a reply plus an optional `updatedRoutine` that the client can apply.

### Payments

The app uses Paddle with a one-time purchase model.

- The frontend opens Paddle Checkout via `@paddle/paddle-js`. A 100% discount is applied automatically for the Test plan.
- `POST /api/paddle/webhooks` validates the `Paddle-Signature` header (format `ts=...;h1=...`) by computing HMAC-SHA256 over `ts:rawBody` and comparing with `timingSafeEqual`.
- Events are deduplicated via the `PaddleWebhookEvent` collection.
- On successful payment the webhook invokes the `updatePaymentType` server action, which extends `expiredAt`.

### Photo upload

`uploadPhoto(email, FormData)` pipes the upload through `sharp` (resize to 256×256 WebP) and writes to `profiles/<userId>/<uuid>.webp` with `ACL: public-read`. The prior `photoKey` is deleted.

### Rate limiting

A MongoDB-backed fixed-window counter lives in the `ApiRateLimit` collection, keyed by IP plus optional extra parts and expired via a TTL index. Route handlers opt in with:

```ts
import { enforceRateLimit } from "@/lib/server/rate-limit";

await enforceRateLimit(req, {
  route: "send-otp",
  max: 5,
  windowMs: 60_000,
  keyParts: [email],
});
```

### Security headers

`next.config.ts` sets a strict Content Security Policy with Paddle domains allowlisted in `frame-src`, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that disables camera, microphone, and geolocation. The Server Actions body limit is raised to 10 MB to accommodate photo uploads.

### State management

The Redux store has three slices: `auth` (user, routine, goals, stats), `price` (Paddle pricing), and `response` (AI conversation). Theme is handled by `ThemeProvider` (class-based dark mode) and has no slice.

## Environment Variables

Create `.env.local` at the repo root. The app reads the following:

### Required

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs the custom `authToken` cookie (HS256, 7-day expiry) |
| `NEXTAUTH_SECRET` | NextAuth v5 session secret |
| `AUTH_SECRET` | Alternate name NextAuth v5 recognises; set both |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL used in metadata and outbound email links |

### Google sign-in

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### AI routine builder

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key |

### Payments (Paddle)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js client token (exposed to the browser) |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` or `production` |
| `PADDLE_API_KEY` | Paddle server API key |
| `PADDLE_WEBHOOK_SECRET` | HMAC key for webhook signature verification |

### Email (Brevo SMTP)

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | `true` or `false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Default `From:` address |

### Storage (S3 / MinIO)

| Variable | Purpose |
| --- | --- |
| `S3_ENDPOINT` | S3 endpoint URL |
| `S3_REGION` | S3 region |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | Bucket name |
| `S3_PUBLIC_URL` | Public base URL used to render uploaded photos |

### Cron

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Bearer token required by `/api/cron/cleanup-unverified` |

### Optional analytics

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (exposed) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (exposed) |
| `NEXT_PUBLIC_EMAILJS_*` | Legacy EmailJS client keys (exposed) |

> **Never commit `.env.local`.** It contains production secrets in this project's history; if you pull and notice secrets, treat them as rotated and issue new keys.

## Code Conventions

- **Path alias** `@/*` maps to `./src/*`. Prefer it over deep relative imports.
- **Components** are PascalCase `.tsx`, one per file, under `src/components/`.
- **Server actions** live in `src/app/actions/index.ts` under `"use server"`. When adding an action, append to the relevant banner section rather than creating a new file.
- **Models** use the `mongoose.models.<name> || mongoose.model(...)` pattern to survive HMR, and `select: false` on sensitive fields such as `password`.
- **Sanitise before sending** Mongoose documents to the client. Use `cleanUserForClient` from `src/lib/data-util.ts` (or the deep-sanitise helpers in `src/lib/server/jwt.ts`) before writing to Redux or into a JWT.
- **Types** such as `CleanUser`, `IRoutine`, `IGoal`, and `IStatEntry` are re-exported from `src/store/features/auth/authSlice`. Reuse them instead of redefining.
- **React Compiler is enabled.** Avoid adding new `useMemo` / `useCallback` unless the compiler cannot see through the code. Do not strip existing memoisation in a sweep; touch only what you are editing.
- **ESLint** uses flat config (`eslint.config.mjs`). The legacy `.eslintrc.json` is kept for editor plugins.

## Testing

Testing is currently manual. The priority areas for automated coverage are the Paddle webhook handler and the dual-auth middleware — both are high-risk, low-tolerance-for-regression paths.

Verification today:

- Run `npm run dev` and exercise the flow in a browser.
- Hit API endpoints with `curl` where appropriate (webhooks, cron).
- `npm run lint` and `npm run build` are the only automated checks; `next build` runs `tsc --noEmit` as part of its pipeline.

Auth, payments, and webhook changes must be tested end-to-end manually. Type-checking alone is not sufficient.

## Deployment

The app is designed to run on any Node.js host that supports Next.js 16 (Vercel, Fly.io, a container platform, or a custom server). Ensure that:

- All required environment variables are set in the hosting environment, not baked into the image.
- `NEXT_PUBLIC_PADDLE_ENV` matches the Paddle account in use (`sandbox` in staging, `production` in live).
- The Paddle webhook endpoint (`/api/paddle/webhooks`) is reachable from the public internet and registered with the correct `PADDLE_WEBHOOK_SECRET`.
- A scheduler hits `GET /api/cron/cleanup-unverified` daily with `Authorization: Bearer ${CRON_SECRET}`.

## License

Proprietary. All rights reserved.
