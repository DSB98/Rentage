# Rentage v2 — Full Rental Marketplace Plan

> **Status**: Locked (decisions confirmed). Living document — update as phases complete.
> **Last updated**: April 2026

---

## TL;DR

Evolve Rentage from its current MVP (auth + listings + chat + admin scaffolding) into a production-grade, multi-sided rental marketplace covering individual owners, tenants, and commercial agencies — with a built-in **CRM** (linked inquiries + chats + leads + tasks), **dual-audience subscriptions** (owner & renter), full **payments + invoicing** (Razorpay), **multichannel notifications** (Email / SMS / WhatsApp / Push / In-app), KYC, reviews, legal/consent compliance, and a premium polished UX on web + mobile.

Delivered across **13 phases** grouped into **5 streams** so foundational Stream-A work unblocks parallel Streams B–E.

---

## Locked Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Booking scope | **Full lifecycle with calendar holds** — `Booking` model with status (REQUESTED/CONFIRMED/CANCELLED/COMPLETED) and listing availability calendar. Required for agency / rental-business use case. **No in-app rent payments in v1** (subscription-only revenue, per existing REQUIREMENTS.md). |
| 2 | Web auth storage | **Hybrid** — short-lived access token kept in memory (Zustand), refresh token in `httpOnly Secure SameSite=Lax` cookie. Best security posture for a payments-handling app. Mobile keeps bearer in `expo-secure-store`. |
| 3 | WhatsApp provider | **Gupshup** — India-first pricing, faster template approvals. Abstracted behind a `WhatsappAdapter` interface so we can swap to Meta Cloud API later. |
| 4 | Realtime scale | Single-node Socket.io for v1. Add Redis adapter in **Phase 10** when MAUs justify. |
| 5 | Role model | Primary role is permanent at registration (per REQUIREMENTS.md), but a user **may also hold roles inside organizations** via `OrgMember` (e.g., a Renter user can be an Agent in Agency X). Effective permissions = primary role ∪ active org-roles. |

### Stack additions confirmed

- **Email** — Resend (fall back to AWS SES at scale)
- **SMS** — MSG91
- **WhatsApp** — Gupshup
- **Push** — Firebase Cloud Messaging (`firebase-admin` on API; `expo-notifications` on mobile; web push via FCM JS SDK)
- **Queue / Cache / Pub-Sub** — Redis (BullMQ for jobs, cache layer in Phase 10, Socket.io adapter in Phase 10)
- **Web UI** — shadcn/ui + Radix + Tailwind (existing) + RHF + zod + `@tanstack/react-query` + sonner
- **Mobile UI** — NativeWind + hand-rolled component library (no RN equivalent of shadcn yet)
- **Observability** — Sentry (all 3 apps), PostHog (product analytics), UptimeRobot
- **Database** — MySQL 8 stays (no PostGIS); geo via lat/lng + geohash + bbox queries

### Excluded from v1 (parking lot)

In-app rent payments, escrow, video calls, AI recommendations, multi-currency, multi-language i18n.

---

## Current State (audited April 2026)

### API (`apps/api`)
- **Solid**: NestJS modules for `auth, user, category, listing, chat, upload, health, admin`. JWT + refresh rotation, Google OAuth, Socket.io chat with typing/read-receipts/presence, Cloudinary uploads, comprehensive admin panel with stats/audit log.
- **Missing modules entirely**: `notification, fcm, inquiry, subscription, billing, contact-reveal, kyc, review, report (public), org, saved-search, coupon`.
- **Bootstrap gaps**: existing `AllExceptionsFilter` + `TransformInterceptor` are dead code (not registered globally); `ThrottlerGuard` not bound; `@Public()` decorator file missing despite guard reading the meta key.
- **Security bugs**: socket `join_conversation` lacks membership check; OAuth callback leaks tokens via URL; refresh-token expiry parsing buggy (`parseInt('15m')` → 15 days); most controllers use `@Body() any` (no validation).
- **Quotas not enforced**: `maxListings`, `maxContactReveals` stored on plans but never checked anywhere.

### Web (`apps/web`)
- **Solid**: Next.js 14 App Router, polished public marketing site, full admin panel (users / listings / categories / plans / reports / audit log).
- **Gaps**: `(dashboard)` shell is plain/placeholder vs polished admin theme; profile / subscription / chat pages are one-line stubs; no edit-listing route despite link; no shadcn / RHF / React Query / SSR / `next/image`; Inter font declared but not loaded; tokens in `localStorage`; uses `alert()` and `confirm()`.

### Mobile (`apps/mobile`)
- **~300 LOC scaffold only** — Expo Router tabs + 4 stub screens + 2 non-functional auth forms. Dependencies declared but never imported. **~0% of features.**

### Schema (`prisma/schema.prisma`)
- **Present**: 18 models, 8 enums.
- **Missing**: Org / OrgMember, Inquiry / InquiryActivity, Booking, KycSubmission / KycDocument, Review / ReviewReport, FcmToken, NotificationPreference, TermsVersion / ConsentLog, SavedSearch, Address, ListingAvailability, ListingView, Coupon, Invoice, Payout, RefundRequest, Document, EventLog, LoginAttempt.

---

## Phase Roadmap (5 streams · 13 phases)

```
Stream A  ─── Phase 0 ─── Phase 1 ─────────────────── Phase 10 ─── Phase 11 ─── Phase 12
                              │
              ┌───────────────┼───────────────┐
Stream B      └─ Phase 2 ─── Phase 3
Stream C      └─ Phase 4 ─── Phase 5
Stream D      └─ Phase 6
                              │
                              └────── Phase 7 ─── Phase 8 ─── Phase 9   (Stream E)
```

### Stream A — Foundation Hardening (blocking)

#### Phase 0 — API Bootstrap & Security Fixes

1. Register `AllExceptionsFilter` + `TransformInterceptor` globally in `apps/api/src/main.ts` so the `IApiResponse` envelope is real.
2. Bind `ThrottlerGuard` globally via `APP_GUARD` in `app.module.ts`; add stricter throttles on auth endpoints (5 / 15 min).
3. Create `apps/api/src/common/decorators/public.decorator.ts` to match the `isPublic` meta key already read by `JwtAuthGuard`.
4. Fix refresh-token expiry parsing (replace `parseInt(env)` with the `ms` package).
5. Move OAuth callback tokens from URL to httpOnly cookie + short-lived exchange code in `google.strategy.ts`.
6. Add socket conversation-membership check in `chat.gateway.ts` `join_conversation`.
7. Replace all `@Body() data: any` with class-validator DTOs (or adopt `nestjs-zod` to consume `packages/validation`).
8. Add `pino-http` logger, `compression`, `cookie-parser`, `enableShutdownHooks`.
9. Standardise CORS allow-list (web + admin + mobile origins).
10. Audit-log interceptor — extract admin action logging into a reusable `@AuditLog()` decorator + interceptor writing `AdminLog`.

#### Phase 1 — Schema Evolution (single migration)

**New models**

`Organization`, `OrgMember` (with org-role), `Inquiry`, `InquiryActivity`, `Booking`, `KycSubmission`, `KycDocument`, `Review`, `ReviewReport`, `FcmToken`, `NotificationPreference`, `TermsVersion`, `ConsentLog`, `SavedSearch`, `Address`, `ListingAvailability`, `ListingView`, `Coupon`, `Invoice`, `Payout`, `RefundRequest`, `Document`, `EventLog`, `LoginAttempt`.

**Extended enums**

- `UserRole` adds `AGENT`, `AGENCY_ADMIN`, `MODERATOR`, `SUPER_ADMIN`.
- New: `InquiryStatus` (`NEW / RESPONDED / NEGOTIATING / VISIT_SCHEDULED / CONVERTED / LOST / CLOSED`), `KycStatus`, `ReviewStatus`, `BookingStatus`, `OrgType` (`INDIVIDUAL / AGENCY / RENTAL_BUSINESS`), `PlanAudience` (`OWNER / RENTER / AGENCY`), `ChannelType` (`IN_APP / EMAIL / SMS / WHATSAPP / PUSH`).

**Listing extensions**

`agencyId?`, `quantity`, `securityDeposit`, `viewCount`, `isVerified`, `deletedAt` (soft-delete), `availabilityType`, `slug`, `geohash`.

**User extensions**

`phoneVerifiedAt`, `kycStatus`, `defaultOrgId`, `consentVersion`, `deletedAt`.

**SubscriptionPlan extensions**

`audience` (enum), `maxInquiriesPerMonth`, `maxSavedSearches`, `featuredListingsIncluded`, `whatsappAlerts`, `prioritySupport`.

---

### Stream B — Communication & Trust *(parallel after Phase 1)*

#### Phase 2 — Notifications Infrastructure

- New module `apps/api/src/modules/notification/` — BullMQ + Redis queue dispatcher with pluggable channels.
- Channel adapters: `EmailAdapter` (Resend), `SmsAdapter` (MSG91), `WhatsappAdapter` (Gupshup), `PushAdapter` (FCM via `firebase-admin`), `InAppAdapter` (writes `Notification` rows).
- Template service — handlebars-style templates per event (verify_email, reset_password, otp, listing_approved, listing_rejected, new_inquiry, new_message, payment_success, payment_failed, kyc_status, subscription_renewed, subscription_grace, visit_reminder, review_received, etc.).
- User notification preferences endpoint + UI (per channel × event-type matrix).
- Wire pending TODOs: real email-verify + password-reset flows; replace stubbed phone OTP with MSG91.
- Admin broadcast endpoint + UI.
- New module `apps/api/src/modules/fcm/` for token registration from web + mobile.

#### Phase 3 — KYC + Reviews + Trust

- `kyc/` module — submit (PAN / Aadhaar / GST / selfie via Cloudinary signed upload to a private folder), status lifecycle (`PENDING → VERIFIED / REJECTED`), admin review queue.
- Verified badges surface on user / agency profiles + listings.
- `review/` module — review tied to a CONVERTED inquiry only (so only real interactions can review), 1-5 stars + text + photos, owner reply, admin moderation, aggregate rating cached on listing / user / agency.
- Public report-listing endpoint + UI on web + mobile.
- Block / mute conversation endpoints in `chat`.

---

### Stream C — Monetisation & CRM *(parallel after Phase 1; depends on Phase 2)*

#### Phase 4 — Subscriptions, Payments, Quotas

- `subscription/` module — plan picker (filter by `audience`), checkout (`POST /subscriptions/checkout` returns Razorpay subscription URL), webhook receiver (`POST /subscriptions/webhook` with HMAC verify), upgrade/downgrade/cancel/reactivate, current usage, billing history.
- `billing/` module — invoice PDF generation (`pdfmake`) with GSTIN, refunds, payout records (for future agency payouts).
- `contact-reveal/` module — `POST /listings/:id/reveal` debits one credit, idempotent per `(userId, listingId)`, returns phone/email; `GET /me/reveals/usage`.
- **Quota guards** — `@PlanLimit('listings' | 'inquiries' | 'reveals' | 'savedSearches')` decorator + interceptor on listing-create, inquiry-create, reveal endpoints. Returns standardised `LISTING_LIMIT_REACHED` / `REVEAL_LIMIT_REACHED` / `PLAN_REQUIRED` errors.
- Razorpay SDK integration; secrets per env.
- Coupon / promo code support (admin-created, percent or flat).
- Featured-listing purchase: separate one-time payment to feature for N days.

#### Phase 5 — CRM (Inquiries + Linked Chats + Leads + Tasks)

- `inquiry/` module:
  - `POST /inquiries` (renter or agent on behalf) auto-creates `Inquiry` + linked `Conversation` (1:1 link via `inquiryId` on conversation).
  - Status pipeline transitions via `PATCH /inquiries/:id/status` audited in `InquiryActivity`.
  - **Auto-rules**:
    - Inquiry → `CONVERTED` on a `quantity=1` listing → listing flips to `INACTIVE` (sold/booked).
    - 5+ inquiries on same listing → admin alert.
    - Inquiry idle 7 days → auto-`CLOSED` with notification (cron).
- Action items — `POST /inquiries/:id/tasks` (`follow_up / schedule_visit / send_quote / share_docs`) with `dueAt`, assignee, status; reminders via Phase-2 notification queue.
- Lead assignment for agencies — round-robin among active members or manual reassign by `AGENCY_ADMIN`.
- Chat is the in-app communication thread of an inquiry. `chat.gateway.ts` + `chat.service.ts` extended: file/document attachments via signed upload, push-on-new-message via Phase-2 queue, listing+inquiry context card returned in conversation metadata.
- Visit / site-tour scheduling — `Visit` mini-feature inside Inquiry (date/time, location, status) with calendar invite email.

---

### Stream D — Multi-Sided Org Layer *(depends on Phase 1; parallel to C)*

#### Phase 6 — Agencies / Rental Businesses

- `org/` module — create organisation (`type=AGENCY|RENTAL_BUSINESS`), KYB documents (GST, Udyam), member invitation flow, member roles (`AGENCY_ADMIN`, `AGENT`).
- Listings can belong to a user OR an org (`agencyId` nullable on `Listing`).
- Public agency profile page `/agency/[slug]` — about, team, all listings, reviews, contact.
- Agency dashboard — aggregated listings, leads pipeline (kanban), agent performance, payout history, plan/usage.
- Agent role — handles inquiries assigned to them, can reply, can escalate.
- **Inventory model** for rental businesses (e.g., 20 bikes of one listing) — `quantity` field with availability calendar so the same listing serves multiple concurrent rentals.

---

### Stream E — Frontend Premium Overhaul + Mobile *(depends on B/C/D APIs)*

#### Phase 7 — Web Foundation Upgrade

- Install shadcn/ui (init), Radix primitives, `class-variance-authority`, `tailwind-merge`, `clsx`. Create `lib/utils.ts` `cn()`.
- Forms — `react-hook-form` + `@hookform/resolvers` + reuse `packages/validation` zod schemas.
- Server state — `@tanstack/react-query` provider in root `layout.tsx` (alongside `Toaster` via `sonner` and `ThemeProvider`).
- Replace `<img>` with `next/image`; load Inter via `next/font`.
- Add `middleware.ts` for auth/role-based redirects (eliminates flicker in `(dashboard)` and `admin`).
- Convert listing index + detail to RSC for SEO; dynamic metadata + JSON-LD (`Product` / `RealEstateListing`).
- Generate sitemap + robots route handlers; per-city × per-category SEO landing pages (`/rent/[category]/[city]`).
- Build missing public pages — pricing (split owner/renter tabs), about, contact, privacy, terms (versioned), help/FAQ, forgot-password, email-verified.

#### Phase 8 — Web Owner / Tenant / Agency Dashboards

- Replace plain `(dashboard)/layout.tsx` shell with the polished indigo theme used in `admin/layout.tsx` (consistent premium feel).
- **Owner dashboard** — stats (active/pending/views/leads), listings table (edit/pause/duplicate/feature), leads inbox (linked inquiry+chat), calendar (availability + visits), earnings, subscription, KYC, payouts, notifications, settings.
- **Tenant dashboard** — saved listings, saved searches, my inquiries (status pipeline), chats, viewing history, subscription, KYC, profile, addresses.
- **Agency dashboard** — org overview, members, listings (across team), leads kanban, agent performance, branches, plan/usage, payouts.
- Build the missing edit-listing page; refactor create-listing wizard to RHF.
- Real chat UI with `socket.io-client` (already in deps) — conversation list, thread view, attachments, typing/read receipts, listing/inquiry context card pinned.
- Subscription UI — plan picker → Razorpay checkout → success/failure → invoices list → cancel/upgrade.
- KYC UI — stepper, document upload, status tracking.
- Reviews UI — write/read/reply.
- Global — toasts everywhere (replace `alert/confirm`), skeleton consistency, error boundary, 404, loading states.

#### Phase 9 — Mobile App Build-out (Expo)

**Dependencies to add**: `nativewind`, `tailwindcss`, `expo-image`, `expo-image-picker`, `expo-document-picker`, `expo-location`, `react-native-maps`, `expo-notifications`, `react-native-razorpay`, `@expo/vector-icons`, `@tanstack/react-query`, `react-hook-form`, `@shopify/flash-list`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-auth-session`, `date-fns`, `sentry-expo`, `expo-updates`.

- **Foundation** — `apps/mobile/src/lib/api.ts` (axios + interceptors mirroring web), `src/stores/auth.store.ts` (zustand persisted to expo-secure-store), `src/lib/socket.ts` wrapper, `src/lib/queryClient.ts`, root providers in `_layout.tsx`, auth-state-aware routing (gate `(tabs)` behind session).
- **Component library** at `apps/mobile/src/components/` — Button, Input, Select, Card, ListingCard, Avatar, Badge, EmptyState, Skeleton, BottomSheet, Toast, ImagePicker.
- **Renter screens** — search (real, debounced), category, listing detail (`app/listing/[id].tsx` — currently a dead route reference), saved, inquiries, chats, profile.
- **Owner screens** — dashboard, create-listing wizard, edit, leads inbox, subscription.
- **Agency mode** — org switcher, member management.
- **Push notifications** via FCM / `expo-notifications` + deep linking from notification taps.
- **Razorpay checkout** via `react-native-razorpay`.
- **KYC flow** with document picker + camera.
- App icons / splash assets (currently referenced but missing). EAS env vars + production submit profile.

---

### Stream A continued — Performance, Compliance, Launch

#### Phase 10 — Performance & Observability

- Redis — cache hot reads (categories, plans, featured), Socket.io adapter for horizontal scaling, BullMQ backbone.
- Prisma N+1 audit — add `select`/`include` discipline, covering composite indexes for hot queries (search by `city+category+status+createdAt`; inquiries by `ownerId+status`; etc.).
- Image pipeline — Cloudinary transformations (`f_auto, q_auto, w_*`), lazy-loaded, blurDataURL placeholders.
- API — response compression, ETag, conditional GET on lists; cursor pagination everywhere.
- Web — Lighthouse 90+; bundle analysis; remove unused deps.
- Sentry on all 3 apps; PostHog for product analytics; UptimeRobot for uptime.
- DB backup automation (already documented); ensure cron + restore drill.

#### Phase 11 — Legal / Compliance / Consent

- `TermsVersion` model with markdown content + effective date; force re-consent on version bump.
- `ConsentLog` records every accept (T&Cs, privacy, marketing, WhatsApp opt-in) with IP, user-agent, timestamp.
- Cookie-consent banner on web (granular: necessary / analytics / marketing).
- **DPDP Act (India) compliance** — user data export endpoint, account deletion endpoint with 30-day soft-delete window.
- Razorpay-mandated invoice fields (GSTIN if seller has one).
- WhatsApp Business policy — opt-in tracking, template message approval flow, 24-hour customer service window.
- Refund policy + grievance officer details on `/contact`.
- Data retention configurable per entity; PII redaction on closed accounts.
- All 3rd-party SDKs gated by consent (analytics, marketing).

#### Phase 12 — Launch Hardening

- Penetration test (OWASP Top 10 sweep; OWASP ZAP scan).
- Load test API (k6) — target 500 RPS / p95 < 300 ms.
- DB migration rollback plan + canary deploys.
- Sentry release tracking; sourcemaps uploaded.
- Privacy policy + T&Cs legal review.
- App Store / Play Store submission (iOS bundle id `in.rentage.app`, Android package same).
- Feature-flag system (Unleash or DB-backed) to gate risky features at launch.
- Production runbook + on-call doc.

---

## High-Impact Files (touch points)

| File / Folder | Phase | Note |
|---|---|---|
| `prisma/schema.prisma` | 1 | Single migration; full schema evolution |
| `apps/api/src/main.ts` | 0 | Global filters, interceptors, helmet, compression |
| `apps/api/src/app.module.ts` | 0 | `APP_GUARD: ThrottlerGuard`, validation pipe |
| `apps/api/src/common/decorators/public.decorator.ts` | 0 | New file |
| `apps/api/src/modules/auth/strategies/google.strategy.ts` | 0 | OAuth cookie flow |
| `apps/api/src/modules/auth/auth.service.ts` | 0, 2 | Refresh expiry fix, real OTP, real verify-email |
| `apps/api/src/modules/chat/chat.gateway.ts` | 0, 5 | Membership security fix; push hook; Inquiry link |
| `apps/api/src/modules/listing/listing.service.ts` | 4, 5 | Quota guards, soft-delete, edit-after-approval, view counter |
| `apps/api/src/modules/notification/` (new) | 2 | Queue + adapters |
| `apps/api/src/modules/fcm/` (new) | 2 | Token registration |
| `apps/api/src/modules/inquiry/` (new) | 5 | CRM core |
| `apps/api/src/modules/subscription/` (new) | 4 | Razorpay integration |
| `apps/api/src/modules/billing/` (new) | 4 | Invoices, refunds, payouts |
| `apps/api/src/modules/contact-reveal/` (new) | 4 | Quota-gated reveals |
| `apps/api/src/modules/kyc/` (new) | 3 | Verification |
| `apps/api/src/modules/review/` (new) | 3 | Reviews |
| `apps/api/src/modules/report/` (new) | 3 | Public reporting |
| `apps/api/src/modules/org/` (new) | 6 | Agencies |
| `apps/api/src/modules/saved-search/` (new) | 4 | Tenant subscription perk |
| `apps/api/src/modules/coupon/` (new) | 4 | Promo codes |
| `apps/web/src/app/layout.tsx` | 7 | Providers (QueryClient, Toaster, Theme) |
| `apps/web/src/app/middleware.ts` (new) | 7 | Auth/role gating |
| `apps/web/src/app/(dashboard)/layout.tsx` | 8 | Premium shell rewrite |
| `apps/web/src/components/` | 7, 8 | shadcn primitives + dashboard widgets |
| `apps/web/package.json` | 7 | shadcn / RHF / React Query / sonner / recharts / lucide / date-fns |
| `apps/mobile/app/_layout.tsx` | 9 | Providers + auth gating |
| `apps/mobile/app/(tabs)/_layout.tsx` | 9 | Real tab bar with icons |
| `apps/mobile/src/` (new) | 9 | lib, stores, components, screens |
| `apps/mobile/package.json` | 9 | NativeWind + notifications + maps + Razorpay |
| `apps/mobile/app.json` | 9 | Permissions, plugins, EAS env, expo-updates |
| `packages/validation/src/` | 0, 4, 5 | Extend with chat, inquiry, subscription, kyc, review schemas |
| `packages/shared-types/src/` | 1 | New types: INotification, IInquiry, IReview, IOrganization, IKyc, IBooking |
| `prisma/seed.ts` | 1 | Seed terms version, default plans (owner+renter audience), demo agency, demo inquiries |

---

## Verification Strategy

### Per-phase smoke tests

| Phase | Verification |
|---|---|
| 0 | API integration tests confirm error envelope; throttler returns 429 after 5 logins; `@Public()` allows anonymous endpoints; socket connection denied for non-member |
| 1 | `prisma migrate dev` succeeds; existing seeds still pass; backward queries still work |
| 2 | Send-test endpoints in admin emit real email/sms/wa/push to test inbox; preferences endpoint toggles delivery |
| 3 | Submit KYC, admin approves, badge appears; create-review only allowed when `inquiry.status = CONVERTED` |
| 4 | Razorpay test-mode checkout completes; webhook updates `UserSubscription`; quota guard rejects 16th listing on Basic plan |
| 5 | `POST /inquiries` auto-creates conversation; status transitions audit-logged; converted inquiry on quantity=1 listing flips it to `INACTIVE`; idle inquiries auto-close after 7 d via cron |
| 6 | Create agency, invite agent, list listing under agency, agent receives inquiry, `AGENCY_ADMIN` reassigns lead |
| 7 | Lighthouse 90+ on homepage and listing detail; SSR returns full HTML for crawlers; middleware redirects unauthenticated `/dashboard` to `/login` with no flicker |
| 8 | Owner can edit listing; chat thread shows real-time messages with read receipts; Razorpay subscription completes from web |
| 9 | Detox/E2E on key flows: register → list → publish; search → reveal → chat → inquiry; subscribe; KYC |
| 10 | k6 hits 500 RPS p95 < 300 ms; Sentry receiving events from all apps; cache hit rate > 70 % on category/plan reads |
| 11 | Trigger T&C version bump → all users prompted; data-export returns full JSON archive; deletion soft-deletes with 30-day grace |
| 12 | OWASP ZAP scan clean; Razorpay live mode; iOS + Android approved |

### End-to-end smoke (run before each release)

1. Renter signup → email verify → OTP phone verify → accept T&C.
2. Owner signup → KYC → list a vehicle (multi-step) → publish (pending) → admin approve.
3. Renter searches → opens listing → starts inquiry (auto-chat) → reveals contact (debits credit).
4. Owner replies → schedules visit → marks `CONVERTED`.
5. Listing auto-flips to `INACTIVE` (quantity=1) and notification fires.
6. Renter writes review (allowed because converted).
7. Owner upgrades to Pro plan via Razorpay → invoice email arrives.
8. Push notification on every event arrives on mobile and email per preferences.

---

## Phase Status Tracker

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | API Bootstrap & Security Fixes | ⬜ Not started | |
| 1 | Schema Evolution | ⬜ Not started | |
| 2 | Notifications Infrastructure | ⬜ Not started | |
| 3 | KYC + Reviews + Trust | ⬜ Not started | |
| 4 | Subscriptions + Payments + Quotas | ⬜ Not started | |
| 5 | CRM (Inquiries + Linked Chats) | ⬜ Not started | |
| 6 | Agencies / Rental Businesses | ⬜ Not started | |
| 7 | Web Foundation Upgrade | ⬜ Not started | |
| 8 | Web Dashboards (Owner/Tenant/Agency) | ⬜ Not started | |
| 9 | Mobile App Build-out | ⬜ Not started | |
| 10 | Performance & Observability | ⬜ Not started | |
| 11 | Legal / Compliance / Consent | ⬜ Not started | |
| 12 | Launch Hardening | ⬜ Not started | |

Legend: ⬜ not started · 🟡 in progress · ✅ done · ⏸ blocked

---

## Reference Documents

- [docs/REQUIREMENTS.md](./REQUIREMENTS.md) — original functional + non-functional requirements
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — original tech stack rationale
- [docs/API_DESIGN.md](./API_DESIGN.md) — REST + Socket.io contract
- [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — original Prisma schema
- [docs/DEPLOYMENT.md](./DEPLOYMENT.md) — hosting + CI/CD plan
- [docs/IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — original 14-week roadmap (superseded by this file)
