# Rentage — Implementation Plan

## Timeline Overview

| Phase | Duration | Weeks | Focus |
|---|---|---|---|
| Phase 1 | 2 weeks | Week 1–2 | Foundation & Auth |
| Phase 2 | 2 weeks | Week 3–4 | Core Marketplace |
| Phase 3 | 2 weeks | Week 5–6 | Communication |
| Phase 4 | 2 weeks | Week 7–8 | Subscriptions & Monetization |
| Phase 5 | 2 weeks | Week 9–10 | Admin Panel |
| Phase 6 | 4 weeks | Week 9–12 | Mobile App (parallel with Phase 5) |
| Phase 7 | 2 weeks | Week 13–14 | Polish & Launch |

**Total: ~14 weeks**

---

## Phase 1 — Foundation & Auth (Week 1–2)

### Week 1: Project Setup & Infrastructure

| # | Task | Details | DoD (Definition of Done) |
|---|---|---|---|
| 1.1 | **Monorepo setup** | Initialize Turborepo + pnpm workspaces, create `apps/api`, `apps/web`, `apps/mobile`, and `packages/` structure | `pnpm install` works, `pnpm dev` starts all apps |
| 1.2 | **Shared config** | ESLint, Prettier, TypeScript base configs in `packages/config/` | Linting works across all apps with shared rules |
| 1.3 | **NestJS API scaffold** | Create NestJS app with module structure, global exception filter, validation pipe, response interceptor, Swagger setup | `GET /api/health` returns 200, Swagger visible at `/api/docs` |
| 1.4 | **Prisma + MySQL** | Setup Prisma, define full schema (all models), run initial migration, verify connection to MySQL | `prisma migrate dev` succeeds, `prisma studio` shows tables |
| 1.5 | **Seed script** | Create `prisma/seed.ts` with admin user, default categories, subscription plans | `prisma db seed` populates all default data |
| 1.6 | **Next.js web scaffold** | Setup Next.js 14 with App Router, Tailwind CSS, shadcn/ui, route groups `(public)`, `(auth)`, `(dashboard)`, `(admin)` | Home page renders with Tailwind styling |
| 1.7 | **Shared packages** | Create `shared-types` (interfaces/enums) and `validation` (Zod schemas) packages | Import types in both API and web, Zod schemas validate |

### Week 2: Authentication System

| # | Task | Details | DoD |
|---|---|---|---|
| 1.8 | **Email/password auth** | Register endpoint (bcrypt hash), login (JWT access + refresh), refresh token rotation, email verification (token link) | Register → verify email → login → get tokens → refresh |
| 1.9 | **Google OAuth** | Passport.js GoogleStrategy in NestJS, OAuth 2.0 flow (authorization code → tokens), find/create user, issue JWT | Google sign-in on web → API creates user → JWT returned |
| 1.10 | **Phone OTP** | Twilio/MSG91 integration, send OTP via SMS, verify OTP, find/create user, issue JWT | Phone OTP on web → API creates user → JWT returned |
| 1.11 | **Auth guards** | `JwtAuthGuard`, `RolesGuard` (OWNER, RENTER, ADMIN), attach user to request | Protected routes return 401/403 correctly |
| 1.12 | **Password reset** | Forgot password (send email) → reset password (with token) | Full reset flow works end-to-end |
| 1.13 | **User profile module** | CRUD endpoints: get profile, update profile, upload avatar (Cloudinary) | Profile update + avatar upload works |
| 1.14 | **Web auth pages** | Login, register (with role selection), forgot password, email verification pages | All auth flows work on web |
| 1.15 | **Auth state management** | Zustand auth store, API client with token interceptor, auto-refresh, protected route wrapper | Auto-refresh works, redirects on 401 |

**Phase 1 Deliverables:**
- Monorepo running with all apps
- Full auth system (3 methods)
- User profile CRUD
- Shared packages working
- Database schema migrated

---

## Phase 2 — Core Marketplace (Week 3–4)

### Week 3: Listings & Categories

| # | Task | Details | DoD |
|---|---|---|---|
| 2.1 | **Category module** | CRUD endpoints (admin-only for create/update/delete), public list with hierarchy, seeded defaults | Admin can manage categories, public can browse |
| 2.2 | **Listing creation API** | Create listing endpoint with validation, multi-image upload to Cloudinary, amenities, geocoding | Owner creates listing with images → stored correctly |
| 2.3 | **Listing management API** | Edit, delete, deactivate, reactivate, status transitions, owner's listings list | Owner full CRUD on their listings |
| 2.4 | **Listing approval API** | Admin endpoints: pending queue, approve/reject with reason, feature/unfeature | Admin approves → listing becomes ACTIVE |
| 2.5 | **Subscription guard** | Middleware that checks listing count against plan limit before creation | Free user blocked at 4th listing with upgrade prompt |
| 2.6 | **Multi-step listing form (web)** | 5-step form: Details → Images (drag-drop upload) → Location (Google Maps autocomplete + pin) → Pricing → Review & Submit | Owner completes multi-step form → listing created |
| 2.7 | **Owner dashboard (web)** | "My Listings" page with status tabs (All/Active/Pending/Draft), listing cards with edit/delete actions | Owner sees all their listings filtered by status |

### Week 4: Search & Discovery

| # | Task | Details | DoD |
|---|---|---|---|
| 2.8 | **Search API** | MySQL FULLTEXT search on title+description, filters (category, city, price range, rent period), sort (newest, price, nearest), cursor pagination | Search with filters returns correct paginated results |
| 2.9 | **Category browse API** | Listings by category with same filters/pagination, category stats (listing count) | Category pages show filtered listings |
| 2.10 | **Saved listings API** | Save/unsave endpoints, get saved listings for user | Save works, status shown correctly |
| 2.11 | **Search page (web)** | Search bar with autocomplete, filter sidebar (category, city, price range, rent period), sort dropdown, listing card grid, infinite scroll | User searches, filters, sorts — results update |
| 2.12 | **Category browse (web)** | Categories grid on home page, category detail page with listings | Category grid → click → filtered listings |
| 2.13 | **Listing detail page (web)** | Image gallery, full details, amenities, map, owner info (phone hidden), save button, similar listings section | Detail page renders all listing data |
| 2.14 | **Home page (web)** | Hero section, category grid, featured listings, recent listings, search bar | Home page is the main entry point |

**Phase 2 Deliverables:**
- Full listing lifecycle (create → approve → search → view)
- Category system with seeded defaults
- Search with filters, sort, and pagination
- Owner dashboard
- Saved listings

---

## Phase 3 — Communication (Week 5–6)

### Week 5: Real-Time Chat

| # | Task | Details | DoD |
|---|---|---|---|
| 3.1 | **Chat module (API)** | Conversation & Message models, create conversation (per listing+renter), get conversations list, get messages with pagination | API correctly manages conversations and messages |
| 3.2 | **Socket.io gateway** | NestJS WebSocket gateway, JWT auth for socket connections, room-based (conversation ID), events: `send_message`, `new_message`, `typing`, `mark_read` | Real-time messages between 2 users in same conversation |
| 3.3 | **Read receipts** | Mark messages as read when conversation opened, `message_read` event to sender | Read status updates in real-time |
| 3.4 | **Online status** | Track connected users via Socket.io, `user_online`/`user_offline` events | Online indicator shows correctly |
| 3.5 | **Chat UI (web)** | Chat list (sorted by latest message, unread count), chat window (message bubbles, input, image send), typing indicator | Full chat experience on web |
| 3.6 | **Chat integration** | "Contact Owner" button on listing detail → opens/creates conversation → redirects to chat | Renter clicks Contact → chat opens with context |

### Week 6: Contact Reveals & Notifications

| # | Task | Details | DoD |
|---|---|---|---|
| 3.7 | **Contact reveal API** | Reveal phone endpoint, deduct from monthly quota, check if already revealed (no re-charge), enforce plan limit | Reveal works, quota decrements, already-revealed is free |
| 3.8 | **Contact reveal UI** | "Reveal Phone" button on listing detail, shows remaining credits, upgrade prompt when exhausted | Full reveal UX including limit prompts |
| 3.9 | **Notification module (API)** | Create notifications, mark read, get unread count, list notifications with pagination | Notifications CRUD works |
| 3.10 | **FCM push notifications** | Firebase Admin SDK, send push on: new message, listing approved/rejected, subscription expiry | Push notifications received on web/mobile |
| 3.11 | **Notification UI (web)** | Bell icon with unread count badge, dropdown notification list, mark read on click | Users see and interact with notifications |
| 3.12 | **Report listing** | Report endpoint (reason + description), report UI (modal), admin report queue | User reports listing → admin sees it in queue |

**Phase 3 Deliverables:**
- Real-time chat (text + images)
- Contact reveal with quota enforcement
- Push notifications
- In-app notification center
- Listing reporting

---

## Phase 4 — Subscriptions & Monetization (Week 7–8)

### Week 7: Razorpay Integration

| # | Task | Details | DoD |
|---|---|---|---|
| 4.1 | **Razorpay setup** | Install Razorpay SDK, configure keys, create service wrapper | Razorpay client initialized, test mode working |
| 4.2 | **Plan sync** | Sync SubscriptionPlan records to Razorpay Plans API, store `razorpayPlanId` | DB plans have corresponding Razorpay plan IDs |
| 4.3 | **Create subscription** | API endpoint: create Razorpay Subscription for user → return payment link/checkout URL | User initiates subscription → Razorpay checkout opens |
| 4.4 | **Webhook handler** | Webhook endpoint with signature verification, handle: `payment.captured`, `subscription.charged`, `subscription.cancelled`, `subscription.completed` | Webhooks update UserSubscription and Payment records |
| 4.5 | **Subscription management API** | Get current subscription, upgrade/downgrade, cancel (at period end), payment history | All subscription management endpoints work |
| 4.6 | **Subscription guard update** | Enhance guard to check both listing limits AND contact reveal limits, use current plan from UserSubscription | Limits enforced correctly per active plan |

### Week 8: Subscription UI & Plan Configuration

| # | Task | Details | DoD |
|---|---|---|---|
| 4.7 | **Pricing page (web)** | Plan comparison cards, feature table, CTA buttons | Users can compare plans |
| 4.8 | **Subscription page (web)** | Current plan display, usage stats (X/Y listings, X/Y reveals), upgrade/downgrade buttons, cancel option | Users manage their subscription |
| 4.9 | **Payment history (web)** | Transaction history table, invoice download links | Users see payment history |
| 4.10 | **Razorpay checkout integration** | Razorpay.js checkout popup on web, handle success/failure callbacks | Seamless payment flow |
| 4.11 | **Upgrade prompts** | Contextual prompts when user hits limits (listing create, contact reveal) with direct upgrade link | Users are guided to upgrade at the right moments |
| 4.12 | **Graceful downgrade** | When subscription expires/cancels, enforce Free tier limits, don't delete existing listings (just prevent new ones) | Expired users are gracefully restricted |

**Phase 4 Deliverables:**
- Razorpay recurring subscriptions working
- Webhook-driven subscription lifecycle
- Plan limits enforced across the app
- Subscription management UI
- Payment history

---

## Phase 5 — Admin Panel (Week 9–10)

### Week 9: Dashboard & Core Management

| # | Task | Details | DoD |
|---|---|---|---|
| 5.1 | **Admin layout** | Sidebar navigation (Dashboard, Users, Listings, Categories, Plans, Reports, Logs), admin-only auth guard | Admin panel accessible only to ADMIN role |
| 5.2 | **Dashboard** | Stats cards (total users, active listings, revenue, new signups), line chart (users over time), bar chart (revenue by month), pie chart (plan distribution) | Dashboard shows accurate real-time stats |
| 5.3 | **User management** | User table with search/filter (role, status), view profile, activate/deactivate toggle | Admin manages users |
| 5.4 | **Listing moderation** | Pending approval queue (cards with quick approve/reject), approved/rejected tabs, feature toggle, remove listing | Admin moderates listings efficiently |
| 5.5 | **Category management** | CRUD form (name, slug, icon, description, parent), drag-to-reorder, toggle active | Admin manages categories |

### Week 10: Plans, Reports & Audit

| # | Task | Details | DoD |
|---|---|---|---|
| 5.6 | **Plan configuration** | CRUD form (name, price, limits, features JSON editor), sync to Razorpay on save | Admin creates/edits plans → synced to Razorpay |
| 5.7 | **Report management** | Reports list with status filter, view details, resolve/dismiss with admin notes | Admin resolves reports |
| 5.8 | **Audit log** | Log table with filters (admin, action, entity, date range), detail view | Admin actions are tracked and viewable |
| 5.9 | **Revenue analytics** | MRR calculation, subscriber count by plan, churn rate, revenue trend chart | Admin sees financial metrics |
| 5.10 | **Admin log middleware** | Auto-log all admin actions (approve, reject, deactivate, etc.) via NestJS interceptor | All admin actions automatically logged |

**Phase 5 Deliverables:**
- Full admin dashboard with analytics
- User, listing, category, plan management
- Report moderation
- Audit trail

---

## Phase 6 — Mobile App (Week 9–12, parallel with Phase 5)

### Week 9: Mobile Foundation

| # | Task | Details | DoD |
|---|---|---|---|
| 6.1 | **Expo project setup** | Initialize Expo project with Expo Router, configure navigation (tab layout + stack screens), theme | App runs in Expo Go with tab navigation |
| 6.2 | **Shared API client** | Axios instance with JWT interceptor, auto-refresh, error handling, reuse Zod schemas from packages | API calls work from mobile |
| 6.3 | **Auth screens** | Login (email + password), register (with role selection), Google sign-in (expo-auth-session + Passport.js), phone OTP (Twilio/MSG91) | All 3 auth methods work on mobile |
| 6.4 | **Secure token storage** | expo-secure-store for access/refresh tokens, auto-restore session on app launch | Session persists across app restarts |

### Week 10: Core Screens

| # | Task | Details | DoD |
|---|---|---|---|
| 6.5 | **Home screen** | Featured listings carousel, category grid, nearby listings (location permission), search bar | Home screen renders with real data |
| 6.6 | **Search screen** | Search bar, filter bottom sheet (category, city, price, rent period), sort, listing cards (FlatList), infinite scroll | Search with filters works on mobile |
| 6.7 | **Listing detail screen** | Image carousel (swipeable), full details, map view, Contact/Reveal/Save actions | Detail screen shows all listing info |
| 6.8 | **Category browse** | Category grid screen, category listings screen | Browse by category works |

### Week 11: Chat & Engagement

| # | Task | Details | DoD |
|---|---|---|---|
| 6.9 | **Chat list screen** | Conversations sorted by latest, unread count badge, last message preview | Chat list renders correctly |
| 6.10 | **Chat conversation screen** | Message bubbles, text input, image send (expo-image-picker), real-time via Socket.io, auto-scroll | Real-time chat works on mobile |
| 6.11 | **Push notifications** | expo-notifications + FCM, request permissions, handle notification tap (navigate to relevant screen) | Push notifications received and actionable |
| 6.12 | **Saved listings screen** | Grid of saved listings, unsave action | Favorites work on mobile |

### Week 12: Owner Flow & Settings

| # | Task | Details | DoD |
|---|---|---|---|
| 6.13 | **Create listing flow** | Multi-step form with expo-image-picker, location autocomplete, pricing, review | Owner creates listing from mobile |
| 6.14 | **My listings screen** | Owner's listings with status tabs, edit/delete actions | Owner manages listings on mobile |
| 6.15 | **Profile & settings** | Edit profile, avatar (camera/gallery), notification preferences | Profile management works |
| 6.16 | **Subscription screen** | Current plan, usage, plan comparison, Razorpay checkout (WebView or deep link) | Subscription management on mobile |

**Phase 6 Deliverables:**
- Full-featured mobile app for iOS and Android
- All core features: auth, search, listings, chat, subscriptions
- Push notifications
- Owner and renter flows

---

## Phase 7 — Polish & Launch (Week 13–14)

### Week 13: Performance, SEO & Testing

| # | Task | Details | DoD |
|---|---|---|---|
| 7.1 | **SEO optimization** | Dynamic meta tags per listing, OpenGraph images, `sitemap.xml`, JSON-LD structured data, canonical URLs | Lighthouse SEO score > 90 |
| 7.2 | **Performance optimization** | Image lazy loading, API response caching (TanStack Query stale time), DB query optimization (EXPLAIN), bundle analysis | Lighthouse Performance score > 80 |
| 7.3 | **Unit tests** | Jest tests for API services (auth, listing, subscription, chat business logic) | > 80% coverage on critical services |
| 7.4 | **Integration tests** | API endpoint tests with test database, auth flow tests | Critical API paths tested |
| 7.5 | **E2E tests** | Playwright tests: register → create listing → search → view → chat → subscribe | Critical user journeys pass |

### Week 14: Security, Deployment & Launch

| # | Task | Details | DoD |
|---|---|---|---|
| 7.6 | **Security hardening** | Rate limiting (express-rate-limit/throttler), input sanitization, Helmet.js, CORS tightening, file upload validation | No critical OWASP vulnerabilities |
| 7.7 | **Error handling** | Global error boundary (web), Sentry/error tracking setup, structured logging | Errors captured and reported |
| 7.8 | **Deploy API** | Deploy NestJS to VPS/Render/Railway, configure MySQL connection, environment variables, PM2 process manager | API accessible at production URL |
| 7.9 | **Deploy web** | Deploy Next.js to Vercel, configure environment variables, domain setup | Web app live at production domain |
| 7.10 | **Build mobile** | EAS Build for Android APK/AAB, test on real devices, prepare Play Store listing | APK ready for distribution |
| 7.11 | **Production checklist** | Switch Razorpay to live mode, verify webhooks, DNS setup, SSL, backup strategy, monitoring | Production environment fully operational |
| 7.12 | **Soft launch** | Deploy to production, invite beta testers, monitor logs and metrics, fix critical bugs | App available for initial users |

**Phase 7 Deliverables:**
- SEO optimized web presence
- Test suite (unit, integration, E2E)
- Security hardened
- Production deployment
- Live application

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Razorpay integration complexity | Subscription billing fails | Start with test mode early; build webhook handler in Phase 4 |
| Socket.io scaling issues | Chat breaks under load | Start simple; add Redis adapter if needed post-launch |
| Google Maps API costs | Unexpected billing | Set billing alerts; cache geocoding results; use free OSM for mobile map tiles if needed |
| Shared hosting MySQL limitations | Connection limit or slow queries | Monitor query performance; optimize indexes; migrate to VPS MySQL if needed |
| Mobile app store review delays | Launch delay | Submit early; follow store guidelines; start review process in Week 12 |
| Scope creep | Timeline overruns | Strict MoSCoW prioritization; defer "Nice to Have" items to v2 |

---

## Dependencies & Blockers

| Dependency | Needed By | Action |
|---|---|---|
| Razorpay merchant account | Phase 4 (Week 7) | Apply early; test mode works without approval |
| Google Maps API key | Phase 2 (Week 3) | Create Google Cloud project, enable APIs |
| Cloudinary account | Phase 1 (Week 1) | Create free account |
| Firebase project | Phase 3 (Week 5) | Create project, enable FCM (push notifications only) |
| Twilio / MSG91 account | Phase 1 (Week 2) | Sign up for SMS OTP service |
| Google OAuth credentials | Phase 1 (Week 2) | Create OAuth 2.0 client in Google Cloud Console |
| Hostinger MySQL credentials | Phase 1 (Week 1) | Get connection details from Hostinger panel |
| Apple Developer account | Phase 6 (Week 12) | $99/year — required for iOS TestFlight/App Store |
| Google Play Developer account | Phase 6 (Week 12) | $25 one-time — required for Play Store |
