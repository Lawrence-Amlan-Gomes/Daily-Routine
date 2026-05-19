# Pricing Mechanism – My Daily Routine

Canonical reference for subscription model, Paddle integration, and payment flows.

## Architecture

**Model:** Freemium SaaS. Free 30-day trial, then paywall. 3 tiers (Standard/Premium/Admin), each tier monthly or annual billing.

**Payment provider:** Paddle (`@paddle/paddle-js` frontend, REST API backend). Webhook-driven: Paddle sends events (transaction, subscription lifecycle) → backend updates user payment state.

**Source of truth:** MongoDB `users` collection. Fields: `paymentType` (string, e.g. "Standard Monthly"), `expiredAt` (Date), `paddleSubscriptionId` (string, stored on subscription for cancellation).

---

## Products & Price IDs

6 price IDs in Paddle (2 billing periods × 3 tiers):

| Tier | Monthly | Annual |
|---|---|---|
| **Standard** | $5/mo | $55/yr (~$4.58/mo) |
| **Premium** | $10/mo | $110/yr (~$9.16/mo) |
| **Admin** | $1/mo | $1/yr (test tier, discount applied) |
| **Free** | N/A (in-app only) | N/A (in-app only) |

### Price ID Map

```
Standard Monthly  → pri_01kpf5zbeyrp5nygyc1hma68ed
Standard Annual   → pri_01kpf65jm2m5cg2y7z0sqrajjg
Premium Monthly   → pri_01kpf635sdhtbak3tecz31cjkr
Premium Annual    → pri_01kpf66wsrnfnzd9ptnvrxdaxy
Admin Monthly     → pri_01krx4s2cbrsawpppxybw9rggg
Admin Annual      → pri_01krx4nkm89ftvjk6jba3drgd2
```

**CRITICAL:** This map exists in TWO places; **they must stay in sync**:
1. Frontend: [src/components/PaddleForm.tsx](src/components/PaddleForm.tsx:151-158) — `priceIdMap` object
2. Backend: [src/app/api/paddle/webhooks/route.ts](src/app/api/paddle/webhooks/route.ts:45-55) — `PRICE_ID_TO_PLAN` object

If one changes, update both. No automated sync.

### Admin Discount

Admin tier gets discount code `dsc_01krwxp338pq4avppr6ybmjtfq` applied at checkout (frontend only, hardcoded in PaddleForm). Discount not required; system works without it, but applied when `auth.isAdmin === true`.

---

## Data Flow: User Perspective

### 1. Marketing → Pricing Page

User lands on `/pricing`. Sees 4 plan cards (Free, Standard, Premium, Admin-if-admin).

**Pricing component:** [src/components/Pricing.tsx](src/components/Pricing.tsx)
- Hardcoded plan array (title, price, features)
- Monthly/annual toggle → Redux `setBillingPeriod` action
- "Get Started" button → Redux `setWantToPayment(type, duration)` + redirect to `/billing` (if logged in) or `/login` (if not)

---

### 2. Checkout (Logged-In Path)

User lands on `/billing`, which renders [src/components/PaddleForm.tsx](src/components/PaddleForm.tsx).

**Steps:**
1. Initialize Paddle SDK with `process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (sandbox or production env).
2. Read plan type + duration from Redux (`wantToPaymentType`, `wantToPaymentDuration`).
3. Map to priceId via `priceIdMap`.
4. Open Paddle iframe checkout with:
   - `items: [{ priceId, quantity: 1 }]`
   - `customer: { email: auth.email }`
   - `customData: { userEmail: auth.email }` (Paddle echo; used in webhook to find user)
   - `discountId` (only if Admin tier)
5. User enters payment in iframe.
6. On `checkout.completed` event → call `handleConfirm` (optimistic update to Redux auth state) → redirect to home.

**Result:** Transaction sent to Paddle backend. Webhook fires.

---

### 3. Webhook: Transaction Processing

Paddle sends `POST /api/paddle/webhooks` with event. [Webhook handler](src/app/api/paddle/webhooks/route.ts).

**Verification:**
- HMAC-SHA256 signature check: `sha256(ts:rawBody, PADDLE_WEBHOOK_SECRET)` must match `paddle-signature` header.
- Fail → return 401.
- Pass → extract event, check dedup (PaddleWebhookEvent collection), process.

**Three event types:**

#### A. `transaction.completed` (one-time purchase fallback)
- Extract `priceId` from `transaction.items[0].price_id` (or `.price.id`).
- Lookup `priceId` in `PRICE_ID_TO_PLAN` → get `{ type, duration }`.
- Extract user email from `transaction.custom_data.userEmail` or `transaction.customer.email`.
- **Calculate expiry:** add 30 days (monthly) or 365 days (annual) to now.
- Call `updatePaymentType(email, "Standard Monthly", expiredAt, { bypassAuth: true })`.
- Result: User `paymentType` set to "Standard Monthly", `expiredAt` set.

#### B. `subscription.activated` (recurring subscription created)
- Same priceId → plan lookup, email extraction.
- Extract `subscription_id` from `subscription.subscription_id` (or fallback to `.id`).
- **Store `paddleSubscriptionId`:** `updatePaymentType(..., { subscriptionId })`.
- Calculate and set expiry as in (A).
- Result: User has `paddleSubscriptionId` stored (needed for cancellation). Expiry set.

#### C. `subscription.canceled` (user cancels subscription)
- Extract email from `custom_data.userEmail` or `customer.email`.
- Call `updatePaymentType(email, "Expired", new Date(), { clearSubscriptionId: true })`.
- Result: User `paymentType` set to "Expired", `paddleSubscriptionId` cleared.

**Dedup:** Each webhook event has `event_id`. On arrival, check if `PaddleWebhookEvent` collection already has this `event_id`. If yes, return 200 (silent idempotency). If no, process and store.

---

## Data Flow: Backend

### updatePaymentType Action

[src/app/actions/index.ts:281](src/app/actions/index.ts:281-305)

```typescript
export async function updatePaymentType(
  email: string,
  paymentType: string,  // e.g., "Standard Monthly"
  expiredAt: Date,
  options?: {
    bypassAuth?: boolean;      // webhook calls with true
    subscriptionId?: string;   // store Paddle subscription ID
    clearSubscriptionId?: boolean;  // on cancel
  }
)
```

- If NOT `bypassAuth`, verify actor is owner or admin.
- Update user doc: `{ paymentType, expiredAt, [paddleSubscriptionId] }`.
- Revalidate cache.

---

### Auto-Cancel Old Subscription (Webhook)

When user purchases new subscription while one is active:
1. Webhook receives `subscription.activated` event for new subscription
2. Fetches user from DB, gets `paddleSubscriptionId` (old subscription)
3. If old subscription exists and differs from new one, calls Paddle API: `POST /subscriptions/{oldId}/cancel`
4. On success, continues with subscription activation (stores new subscription ID + sets expiry)
5. On failure, logs error but continues (doesn't block new subscription)

**Implementation:** [src/app/api/paddle/webhooks/route.ts:217-232](src/app/api/paddle/webhooks/route.ts:217-232)

Result: Old subscription canceled immediately in Paddle. New subscription active. User loses unused days from old plan (trade-off for simplicity, no refund logic).

---

### cancelSubscription Action

[src/app/actions/index.ts:307](src/app/actions/index.ts:307-350)

User calls this from `/profile` to cancel their subscription.

**Flow:**
1. Verify actor (owner or admin).
2. Fetch user from DB, get `paddleSubscriptionId`.
3. If stored, call Paddle API: `POST /subscriptions/{paddleSubscriptionId}/cancel` (defaults to end-of-period cancellation).
4. If NOT stored (fallback), fetch active subscriptions from Paddle API filtered by customer email, cancel first match.
5. Result: Paddle processes cancellation → sends `subscription.canceled` webhook → backend updates `paymentType: "Expired"`.

---

## Database Schema (User Doc)

Relevant payment fields in MongoDB `users` collection:

```typescript
{
  _id: ObjectId,
  email: string,
  paymentType: string,           // "Free" | "Standard Monthly" | "Standard Annually" | "Premium Monthly" | "Premium Annually" | "Admin Monthly" | "Admin Annually" | "Expired"
  expiredAt: Date,                // when subscription expires
  paddleSubscriptionId: string,    // Paddle subscription ID (for cancellation), empty if none
  isAdmin: boolean,
  isEmailVerified: boolean,
  // ... other fields
}
```

**Notes:**
- `paymentType` is never "Free" explicitly; missing `paymentType` or `paymentType === "Expired"` signals free/expired.
- `expiredAt` checked client-side to show expiry warnings; server-side enforced on protected routes.
- `paddleSubscriptionId` only set when `subscription.activated` event fires. Empty string if subscription not created (one-time purchase) or canceled.

---

## Frontend Integration Points

### Pricing Component
**File:** [src/components/Pricing.tsx](src/components/Pricing.tsx)

- Displays 4 hardcoded plan cards.
- Toggle billingPeriod (monthly/annual).
- **Upgrade Warning Modal:** When user with active subscription tries to upgrade to different plan:
  1. Shows modal with current expiry date, days remaining, what will happen
  2. Lists consequences: old subscription cancels immediately, new plan starts, unused days lost
  3. User can "Cancel" or "Confirm & Continue"
  4. On confirm, proceeds to `/billing` checkout
- Derives CTA button state:
  - Free user + not expired → "Use Now" → `/dashBoard`
  - Free user + expired → "Upgrade to continue" → `/billing` (Standard preset)
  - Paid user + has active subscription on THIS plan → "✓ Manage Subscription" → `/profile`
  - Paid user + trying different plan (any active subscription) → shows warning modal
  - Paid user + subscription expired → shows upgrade button
  - Not logged in → all CTAs → `/login`

### PaddleForm Component
**File:** [src/components/PaddleForm.tsx](src/components/PaddleForm.tsx)

- Initializes Paddle SDK.
- Maps plan + duration to priceId.
- Opens Paddle checkout iframe.
- Listens for `checkout.completed` → optimistic auth state update → redirect home.

### Redux Price Slice
**File:** [src/store/features/price/priceSlice.ts](src/store/features/price/priceSlice.ts)

- Stores `billingPeriod`, `selectedPlan`, `wantToPaymentType`, `wantToPaymentDuration`, `isFreeTierExpired`.
- Actions: `setBillingPeriod`, `setWantToPayment`, etc.

---

## Environment Variables

| Var | Purpose | Where Used |
|---|---|---|
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle SDK init token (public) | PaddleForm |
| `NEXT_PUBLIC_PADDLE_ENV` | `"sandbox"` or `"production"` | (logged, not used; hardcoded "production") |
| `PADDLE_API_KEY` | Server-side Paddle API calls | cancelSubscription |
| `PADDLE_WEBHOOK_SECRET` | HMAC key for webhook verification | Webhook handler |

---

## How to Add a New Pricing Tier

1. **Create new price in Paddle dashboard.** Get price ID.
2. **Add to both price maps:**
   - [PaddleForm.tsx:151](src/components/PaddleForm.tsx:151-158) — `priceIdMap`
   - [route.ts:45](src/app/api/paddle/webhooks/route.ts:45-55) — `PRICE_ID_TO_PLAN`
3. **Add to Pricing component:**
   - [Pricing.tsx:34](src/components/Pricing.tsx:34-173) — add plan object to `plans` array
4. **Test:** Select new tier on `/pricing` → checkout → verify webhook sets correct `paymentType`.

---

## How to Modify Prices

1. **Edit price in Paddle dashboard.** Price ID stays same; amount changes.
2. **NO code changes needed** — priceId is what matters. Old subscriptions unaffected.
3. **Verify** on pricing page (next deploy) — frontend shows new amount via Paddle pricing API (if integrated; currently hardcoded, so update [Pricing.tsx](src/components/Pricing.tsx:70-71) manually).

---

## How to Debug Payment Issues

### User paid but `paymentType` not set
1. Check Paddle webhook logs (Paddle dashboard → Webhooks → Event log).
2. Verify signature verification passed (HMAC check).
3. Check MongoDB: is `PaddleWebhookEvent` collection deduping? Is `users` doc updated?
4. Manually verify webhook: `curl -X POST http://localhost:3000/api/paddle/webhooks -H "Content-Type: application/json" -H "paddle-signature: ..." -d '...'` (requires valid signature).

### Webhook not firing
1. Check Paddle dashboard → Webhooks. Verify endpoint URL correct.
2. Check webhook status (Paddle shows retries).
3. Check logs: webhook route logs to console on error.

### Subscription cancellation fails
1. Verify `paddleSubscriptionId` is set in user doc.
2. Check Paddle API key is valid (`PADDLE_API_KEY`).
3. Manually verify: `curl -X POST https://api.paddle.com/subscriptions/{id}/cancel -H "Authorization: Bearer $PADDLE_API_KEY"`.

### User sees "Free trial expired" but shouldn't
1. Check `auth.paymentType === "Expired"` in Pricing component.
2. Check user doc `paymentType` field directly in MongoDB.
3. Check `expiredAt` vs current time (timezone issues?).

---

## Key Gotchas

1. **Price ID sync:** Frontend and backend maps MUST match. No auto-sync. Manual discipline.
   - Update both: [PaddleForm.tsx:151](src/components/PaddleForm.tsx:151-158) AND [route.ts:45](src/app/api/paddle/webhooks/route.ts:45-55)
2. **Custom data:** Paddle echo `customData.userEmail` in webhook — webhook uses to find user. If not set in checkout, webhook has no email → fails silently.
3. **Dedup:** Event ID dedup prevents re-processing same webhook. Idempotent by design. Good for retries, but means manual webhook replay requires new event ID.
4. **Free tier:** No explicit "Free" paymentType. Expired or missing `paymentType` = free. Confusing; could refactor.
5. **Admin discount:** Hardcoded in frontend. If discount code changes in Paddle, must update [PaddleForm.tsx:171](src/components/PaddleForm.tsx:171-174).
6. **Expiry enforcement:** Frontend shows warnings; backend enforces on protected routes (middleware checks `expiredAt`). If user clears cookies, they bypass check.
7. **Upgrade modal:** Detects ANY active subscription + different plan. Modal shows expiry, days left, consequences. User loses unused days (no refund). [Pricing.tsx:36-69](src/components/Pricing.tsx:36-69).
8. **Auto-cancel logic:** Webhook compares `paddleSubscriptionId` before canceling. If user upgrades twice rapidly, old subscription might already be canceling — API call will fail silently (logged, doesn't block new activation).

---

## Upgrade Behavior

**Scenario:** User has active subscription and buys different plan.

1. **Warning modal shows** on pricing page (displays expiry date, days left, consequences)
2. User clicks "Confirm & Continue" → redirects to `/billing` checkout
3. Payment completes → Paddle creates new subscription
4. Webhook fires `subscription.activated`:
   - Fetches user, finds old `paddleSubscriptionId`
   - Calls Paddle API to cancel old subscription
   - Updates user doc with new subscription ID + new expiry
5. **Result:** Old subscription canceled, new one active, user loses remaining days from old plan (no refund)

**Important:** User is NOT charged twice. Paddle immediately stops billing on old subscription. User pays only for new subscription.

---

## Testing Checklist

- [ ] Free tier: user gets 30-day trial, can access app.
- [ ] After 30 days: paymentType set to "Expired", UI shows upgrade CTA.
- [ ] Monthly purchase: checkout succeeds, webhook fires, user has "Standard Monthly", expiry is today + 30 days.
- [ ] Annual purchase: same, expiry is today + 365 days.
- [ ] Cancel subscription: user clicks cancel → Paddle API called → webhook fires → paymentType = "Expired".
- [ ] **Upgrade to different plan:** user on "Standard Monthly" (20 days left), clicks "Premium Annual" → warning modal shows → confirms → webhook cancels old subscription + activates new → MongoDB reflects only new subscription.
- [ ] **Verify no double-billing:** after upgrade, Paddle shows only new subscription active (old one is canceled).
- [ ] Admin tier with discount: checkout applies discount, price correct.
- [ ] Webhook idempotency: replay webhook (same event ID) → no duplicate user update.

---

## Implementation Status

**Last updated:** 2026-05-19

**Completed:**
- ✅ Single subscription per user model (no multi-subscription complexity)
- ✅ Webhook auto-cancels old subscription when user upgrades
- ✅ Pricing page warning modal (shows expiry, days left, consequences)
- ✅ Prevents double-billing (old subscription canceled immediately)
- ✅ No refund logic (user loses unused days, trade-off for simplicity)
- ✅ Webhook event dedup (idempotent, safe for retries)
- ✅ All 3 Paddle events subscribed: `transaction.completed`, `subscription.activated`, `subscription.canceled`

**Not implemented (by design):**
- Pro-rating / refunds (too complex, user loses unused time)
- Sequential subscription (let old run to completion) — chose immediate replacement
- Multi-subscription support — premature, not needed
- Pause/resume subscription — not business requirement

---

## References

- **Paddle API docs:** https://developer.paddle.com/
- **Webhook event types:** https://developer.paddle.com/webhooks/overview
- **Price ID format:** Paddle assigns; always `pri_*`.
- **Subscription ID format:** Paddle assigns; always `sub_*`.

