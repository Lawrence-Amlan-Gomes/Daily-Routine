# CLAUDE.md

## Project Overview

**My Daily Routine** (`mydailyroutine.app`) — Next.js productivity web app for planning weekly routines, tracking goals, and recording daily completion stats. Features an AI routine builder (Google Gemini), goal management with subtasks, profile photos, email/password + Google OAuth, email OTP verification, one-time Paddle checkout for premium tier, and admin tooling (users, feedback).

## Tech Stack

- **Runtime / framework:** Next.js 16 (App Router, React Compiler enabled), React 19.2, TypeScript 5.9 (`strict: true`)
- **Styling:** Tailwind CSS 3.4 (`darkMode: "class"`), `tailwind-scrollbar`, `clsx`, Framer Motion 12, Lucide / React Icons
- **State:** Redux Toolkit 2 + react-redux 9
- **Auth:** NextAuth v5 beta (Google provider) + custom JWT via `jose` (email/password users); cookie name `authToken`; `bcrypt` for password hashing
- **Database:** MongoDB via Mongoose 8 (global connection cache on `globalThis._mongoosePromise`)
- **Storage:** S3-compatible (MinIO) via `@aws-sdk/client-s3`; `sharp` resizes profile photos to 256×256 webp
- **Payments:** Paddle (`@paddle/paddle-js`) — subscription model with recurring billing (monthly/annual), HMAC-SHA256 webhook signature verification
- **AI:** `@google/genai` (Gemini) for the AI routine builder
- **Email:** `nodemailer` over Brevo SMTP (OTP, welcome, password reset)
- **Charts:** Recharts 3
- **Toasts:** Sonner 2
- **Lint:** ESLint 9 + `eslint-config-next` 16 + TypeScript ESLint 8 (note: both `.eslintrc.json` and `eslint.config.mjs` present — flat config is current)

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout, metadata, ThemeProvider, ClientLayout
│   ├── ClientLayout.tsx        # Redux Provider + client-side wrappers
│   ├── page.tsx, home/         # Marketing / landing
│   ├── (auth)/forgot-password/ # Route group for auth flows
│   ├── login/, register/       # Auth pages
│   ├── dashBoard/, goals/, stats/, profile/, billing/, ai-routine/,
│   ├── admin/, changePassword/, color/    # Protected app pages
│   ├── pricing/, privacy/, terms-and-conditions/, refund/, testimonials/
│   ├── actions/index.ts        # ~970 LOC — all server actions (auth, user, goals, routine, feedback, photo, AI routine doc)
│   ├── server.ts               # Gemini AI server action (aiRoutineResponse)
│   ├── hooks/                  # useAuth, usePrice, useResponse
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handlers
│   │   ├── cron/cleanup-unverified/ # Deletes unverified users >30d; Bearer CRON_SECRET
│   │   ├── paddle/webhooks/    # HMAC-verified Paddle webhook
│   │   ├── send-otp/, verify-jwt/
│   ├── manifest.ts, sitemap.ts, robots.ts
│   └── error/, not-found.tsx
├── auth.ts                     # NextAuth config (Google provider only)
├── middleware.ts               # Protects routes; checks NextAuth session or JWT cookie
├── components/                 # ~45 feature components (PascalCase .tsx)
├── lib/
│   ├── mongo.ts                # dbConnect w/ global promise cache
│   ├── data-util.ts            # cleanUserForClient (Mongoose → plain)
│   ├── photoService.ts         # S3 upload/delete + sharp resize
│   ├── s3.ts                   # S3 client
│   └── server/                 # email.ts, jwt.ts, rate-limit.ts
├── models/                     # Mongoose schemas: User, AIRoutine, Feedback, OtpCode, ApiRateLimit, PaddleWebhookEvent
└── store/                      # Redux: store.ts + features/{auth,price,response}/*Slice.ts
public/                         # Icons, images, OG assets
next.config.ts                  # CSP, Paddle frame-src, reactCompiler, 10MB server action body limit
```

## Getting Started

1. Install deps:
   ```bash
   npm install
   ```
2. Create `.env.local` at repo root (see **Environment Variables** below). Required at minimum: `MONGODB_URI`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`.
3. Optional services:
   - **Google OAuth:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - **Gemini AI:** `GEMINI_API_KEY`
   - **Paddle:** `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_ENV`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`
   - **SMTP (Brevo):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - **S3 / MinIO:** `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL`
   - **Cron:** `CRON_SECRET` (protects `/api/cron/cleanup-unverified`)
4. Run dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

MongoDB connection is dialed lazily on first request. No seed script; data accumulates through registration.

## Development Commands

```bash
npm run dev      # next dev (hot reload, React Compiler on)
npm run build    # next build
npm run start    # next start (after build)
npm run lint     # eslint
```

No test runner, no formatter script. `prettier` field is empty in `package.json` — rely on editor defaults.

## Architecture & Key Concepts

### Auth: dual identity
- **Google users** go through NextAuth v5 (`src/auth.ts`). Session set via NextAuth cookies.
- **Email/password users** use custom flow: `performLogin` → `bcrypt.compare` → `generateToken` (jose, HS256, 7d expiry) → sets httpOnly `authToken` cookie.
- `src/middleware.ts` protects `/dashBoard`, `/goals`, `/stats`, `/profile`, `/billing`, `/ai-routine`, `/admin`, `/changePassword`, `/color`. Checks NextAuth session first, falls back to `jwtVerify(authToken, JWT_SECRET)`. Redirects to `/login?callbackUrl=...` on failure.
- Server actions re-derive the caller via `getActionActor()` in `src/app/actions/index.ts` — **never trust client-passed email**; `assertActorCanAccessEmail(target)` guards cross-user access unless `isAdmin`.

### Email verification
- OTP codes stored hashed in `OtpCode` collection with `expiresAt` and `attempts`.
- Unverified users auto-deleted after 30 days by `GET /api/cron/cleanup-unverified` (Bearer `CRON_SECRET`).

### Data model (User doc)
Single `users` collection holds routine (per-weekday array of `{name, time, category}`), goals (with subtasks, priority, status, repeat, tags), stats (per-day completed task names), plus `paymentType`, `expiredAt`, `isAdmin`, `isEmailVerified`, `photo` + `photoKey`.

### AI Routine
- Separate `AIRoutine` collection per user holds conversation history + AI-generated routine.
- `src/app/server.ts#aiRoutineResponse` wraps Gemini with a system prompt that references the user's real routine and the current AI routine; returns text + optional `updatedRoutine`.

### Payments (Paddle, subscription model)
- **Pricing tiers:** 6 price IDs mapped in webhooks handler (Standard/Premium/Admin, each monthly & annual).
- **Checkout flow:** Frontend opens Paddle checkout via `@paddle/paddle-js`. User email passed as `custom_data.userEmail` for webhook matching.
- **Webhook events:** `POST /api/paddle/webhooks` handles `transaction.completed`, `subscription.activated`, `subscription.canceled`. Each event is HMAC-SHA256 verified (`ts:rawBody`), deduped via `PaddleWebhookEvent` collection.
  - `transaction.completed` → updates user with plan + `expiredAt` (30d for monthly, 365d for annual)
  - `subscription.activated` → stores `paddleSubscriptionId` for future cancellation; overwrites plan/expiredAt
  - `subscription.canceled` → sets `paymentType: "Expired"`, clears `paddleSubscriptionId`
- **Cancellation:** `cancelSubscription` action calls `POST /subscriptions/{id}/cancel` in Paddle API (defaults to end-of-period cancellation). User keeps access until period ends; webhook finalizes when Paddle sends `subscription.canceled` event.
- **Fallback:** If `paddleSubscriptionId` not stored, cancellation fetches active subscriptions from Paddle API and filters by customer email.

### Photos
- Server action `uploadPhoto(email, FormData)` → `uploadToS3` → `sharp` 256×256 webp → stored under `profiles/<userId>/<uuid>.webp` with `ACL: public-read`. Replaces prior `photoKey`.

### Rate limiting
MongoDB-backed (`ApiRateLimit` collection) keyed by IP + optional extra parts. Fixed-window counter with `expiresAt` TTL. Use `enforceRateLimit(req, { route, max, windowMs, keyParts })` in `src/lib/server/rate-limit.ts` from any route handler.

### Security headers (next.config.ts)
Global CSP with `frame-src` allowlisting Paddle (sandbox + prod), `frame-ancestors 'none'`, strict `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, disabled camera/mic/geolocation. Server Actions body limit bumped to 10 MB for photo uploads.

### State
Redux store has three slices: `auth` (user + routine + goals + stats), `price` (Paddle pricing), `response` (AI conversation). Theme is handled by `ThemeProvider` (class-based dark mode), no theme slice despite folder existing.

## Code Conventions

- **Path alias:** `@/*` → `./src/*` (used everywhere; prefer over relative ranges).
- **Components:** PascalCase filenames in `src/components/`, one component per file, `.tsx`.
- **Server actions:** colocated in `src/app/actions/index.ts` with `"use server"` at top. Never pass `email` from client without re-deriving actor server-side.
- **Models:** one Mongoose schema per file in `src/models/`. Pattern: `mongoose.models.<name> || mongoose.model(...)` to survive HMR. `select: false` on `password`; use `.select("+password")` when needed.
- **Routes:** mix of camelCase (`/dashBoard`, `/changePassword`) and kebab (`/ai-routine`, `/terms-and-conditions`) — **match existing** when adding links; do not rename.
- **Imports:** external first, then `@/` aliases, then relative. Default ESLint `import` order is not enforced, but existing files follow this loosely.
- **Types:** re-exported widely from `src/store/features/auth/authSlice` (`CleanUser`, `IRoutine`, `IGoal`, `IStatEntry`, etc.). Use these instead of redefining.
- **Clean for client:** always run Mongoose docs through `cleanUserForClient` (or analogous helpers in `jwt.ts`) before sending to client — strips `_id`, version keys, Buffer internals.
- **ESLint quirks:** `@typescript-eslint/no-explicit-any` is **off**, `react/prop-types` off, `react/react-in-jsx-scope` off.
- **`.eslintrc.json` and `eslint.config.mjs` coexist** — flat config is authoritative for ESLint 9, legacy file kept for editor plugins.

## Environment Variables

| Var | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | Mongo connection string | Yes |
| `JWT_SECRET` | Signs custom `authToken` (HS256, 7d) | Yes |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | NextAuth v5 session secret | Yes |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks | Yes |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL for metadata / emails | Yes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | If using Google sign-in |
| `GEMINI_API_KEY` | Google Gemini for AI routine builder | If AI routine enabled |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js client token (exposed) | Paid tier |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` or `production` | Paid tier |
| `PADDLE_API_KEY` | Paddle server API key | Paid tier |
| `PADDLE_WEBHOOK_SECRET` | HMAC key for webhook verification | Paid tier |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Brevo SMTP for OTP & transactional email | Email flows |
| `S3_ENDPOINT` / `S3_REGION` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL` | MinIO/S3 for profile photos | Photo upload |
| `CRON_SECRET` | Bearer token on `/api/cron/cleanup-unverified` | Cron cleanup |
| `NEXT_PUBLIC_EMAILJS_*` | EmailJS client keys (legacy, exposed) | Optional |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics (exposed) | Optional |

## Testing

No test framework, no test directory, no test script. Verification is manual: `npm run dev` + browser. TypeScript (`tsc --noEmit` implicit via `next build`) and ESLint are the only automated checks.

## Important Notes for AI Assistance

- **`.env.local` is committed** and contains real production secrets (Paddle live keys, Mongo URI with creds, SMTP password, S3 creds, Gemini key). Do not paste contents into logs, PRs, external tools, or new docs. If asked to rotate, do locally — never push secrets back.
- **Two auth systems run in parallel.** When touching auth, handle both: NextAuth session (Google) AND the custom JWT cookie (`authToken`). `getActionActor()` in `src/app/actions/index.ts` is the canonical pattern; reuse it.
- **Server actions receive an `email` param from client** but MUST NOT trust it. Always call `assertActorCanAccessEmail(email)` (or equivalent) before mutating.
- **Mongoose docs leak internals** into Redux / JWT payloads. Run through `cleanUserForClient` or the deep-sanitize helpers in `lib/server/jwt.ts` before serializing.
- **`mongoose.models.<name> || mongoose.model(...)` pattern** is load-bearing for HMR and Next.js route handlers — keep it when adding models.
- **Route path casing is inconsistent** (`/dashBoard`, `/changePassword` vs `/ai-routine`). Do not "normalize" existing paths; middleware matcher and all links depend on exact casing.
- **React Compiler is enabled** (`reactCompiler: true`). Avoid unnecessary `useMemo`/`useCallback` — compiler handles memoization. But do not remove existing memoization in a sweep; do it only when touching the component.
- **CSP is strict.** New third-party scripts/frames require editing `next.config.ts#headers`. Paddle domains already allowlisted.
- **Paddle subscriptions** (monthly & annual plans). Webhook events fire on `transaction.completed`, `subscription.activated`, and `subscription.canceled`. On cancellation, user keeps access until end of billing period; webhook finalizes expiry. `paddleSubscriptionId` stored on `subscription.activated` for fast cancellation via `POST /subscriptions/{id}/cancel`.
- **`src/app/actions/index.ts` is ~970 lines.** When adding an action, append to the relevant `====` banner section; resist extracting into new files unless the user asks (existing convention is one fat actions file).
- **Dark mode is class-based** (`darkMode: "class"`, `ThemeProvider` sets it). Use `dark:` Tailwind variants; do not use media-query approach.
- **Server action bodies up to 10 MB** (for photo upload). Do not reduce without checking photo flow.
- **No tests.** If you change auth, payments, or webhooks, verify manually in browser + hit endpoints with `curl`. Do not claim success from type-check alone.
