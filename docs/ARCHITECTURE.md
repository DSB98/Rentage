# Rentage — Architecture Document

## 1. System Overview

Rentage follows a **monorepo architecture** with three applications (API, Web, Mobile) sharing common packages. The system is designed as a modular, layered architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│                                                                 │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│   │   Next.js    │   │ React Native │   │    Admin     │       │
│   │   Web App    │   │  Mobile App  │   │    Panel     │       │
│   │  (Vercel)    │   │   (Expo)     │   │ (Next.js)    │       │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘       │
│          │                  │                   │               │
└──────────┼──────────────────┼───────────────────┼───────────────┘
           │                  │                   │
           ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS API Server                           │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Auth   │ │ Listing │ │   Chat   │ │ Payment  │            │
│  │ Module  │ │ Module  │ │  Module  │ │  Module  │   ...      │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘            │
│       │           │           │             │                   │
│  ┌────┴───────────┴───────────┴─────────────┴──────────┐       │
│  │              Prisma ORM (Data Layer)                 │       │
│  └─────────────────────┬───────────────────────────────┘       │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
           ┌─────────────┼──────────────┐
           ▼             ▼              ▼
    ┌────────────┐ ┌──────────┐  ┌─────────────┐
    │  MySQL 8   │ │Cloudinary│  │  Firebase    │
    │ (Hostinger)│ │ (Images) │  │   (FCM)     │
    └────────────┘ └──────────┘  └─────────────┘
```

---

## 2. Tech Stack Details

### 2.1 Monorepo — Turborepo + pnpm

**Why:** Shared TypeScript types, validation schemas, and config across all apps. Faster builds with caching. Single `pnpm install` for all apps.

```
pnpm-workspace.yaml
├── apps/*       → Applications
└── packages/*   → Shared libraries
```

### 2.2 Backend — NestJS (TypeScript)

**Why chosen over Express:**
- Built-in module system → clean code organization for a large app
- Decorators for guards, interceptors, pipes → cleaner auth/validation
- Built-in WebSocket gateway → native Socket.io support
- Swagger auto-generation from decorators
- Dependency injection → testable services
- Class-validator + class-transformer → DTO validation

**Key modules:**
| Module | Responsibility |
|---|---|
| `AuthModule` | JWT, Google OAuth (Passport.js), Phone OTP (Twilio/MSG91), guards |
| `UserModule` | Profile CRUD, avatar upload |
| `CategoryModule` | Category CRUD (admin) |
| `ListingModule` | Listing CRUD, search, moderation |
| `ChatModule` | Socket.io gateway, messages, conversations |
| `SubscriptionModule` | Plans, Razorpay integration, webhooks |
| `NotificationModule` | In-app, push (FCM), email |
| `AdminModule` | Dashboard, analytics, reports |
| `UploadModule` | Cloudinary integration |
| `HealthModule` | Health check endpoint |

### 2.3 Web App — Next.js 14 (App Router)

**Why:**
- SSR for listing pages → SEO critical for marketplace
- App Router with route groups → clean separation of public/auth/admin
- React Server Components → smaller client bundles
- API routes for BFF (Backend for Frontend) patterns
- Image optimization built-in
- Vercel deployment (free tier, instant previews)

**Route structure:**
```
app/
├── (public)/           # Public pages (no auth)
│   ├── page.tsx             # Home
│   ├── listings/
│   │   ├── page.tsx         # Search results
│   │   └── [id]/page.tsx   # Listing detail
│   ├── categories/
│   │   └── [slug]/page.tsx # Category browse
│   └── pricing/page.tsx    # Plan comparison
├── (auth)/             # Auth pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (dashboard)/        # Authenticated user pages
│   ├── dashboard/page.tsx
│   ├── my-listings/page.tsx
│   ├── saved/page.tsx
│   ├── chat/page.tsx
│   ├── profile/page.tsx
│   └── subscription/page.tsx
├── (admin)/            # Admin panel
│   ├── admin/page.tsx       # Dashboard
│   ├── admin/users/page.tsx
│   ├── admin/listings/page.tsx
│   ├── admin/categories/page.tsx
│   ├── admin/plans/page.tsx
│   └── admin/reports/page.tsx
└── api/                # API routes (BFF)
    └── webhooks/
        └── razorpay/route.ts
```

**UI Framework:** Tailwind CSS + shadcn/ui
- Consistent design system
- Accessible components out of the box
- Themeable (light/dark mode)
- Tree-shakeable (only include used components)

### 2.4 Mobile App — React Native (Expo)

**Why Expo:**
- Same JavaScript/TypeScript ecosystem as web
- Expo Router for file-based navigation
- Expo Go for rapid development (no Xcode/Android Studio needed initially)
- EAS Build for production binaries
- Push notifications via expo-notifications + FCM

**Key screens:**
```
app/
├── (tabs)/
│   ├── index.tsx           # Home (featured + categories)
│   ├── search.tsx          # Search with filters
│   ├── saved.tsx           # Favorites
│   ├── chat.tsx            # Chat list
│   └── profile.tsx         # Profile & settings
├── listing/[id].tsx        # Listing detail
├── chat/[id].tsx           # Chat conversation
├── create-listing/         # Multi-step listing form
├── auth/
│   ├── login.tsx
│   └── register.tsx
└── subscription.tsx        # Plan selection
```

### 2.5 Database — MySQL 8 + Prisma ORM

**Why MySQL:** Hostinger shared hosting provides MySQL. Cost-effective.

**Why Prisma:**
- Type-safe database queries (auto-generated types from schema)
- Migration system (`prisma migrate`)
- Seed scripts (`prisma db seed`)
- Visual database browser (`prisma studio`)
- Protection against SQL injection by default

### 2.6 Real-Time — Socket.io

**Why:** Bi-directional communication for chat. NestJS has first-class `@WebSocketGateway` support.

**Events:**
```
Client → Server:
  join_conversation(conversationId)
  send_message({ conversationId, content, type })
  typing_start(conversationId)
  typing_stop(conversationId)
  mark_read(conversationId)

Server → Client:
  new_message({ message })
  message_read({ conversationId, readAt })
  user_typing({ conversationId, userId })
  user_online({ userId })
  user_offline({ userId })
```

### 2.7 Authentication — Custom JWT

**Flow:**
```
Email/Password:
  Register → bcrypt hash → store in DB → send verification email
  Login → verify credentials → issue JWT (access + refresh)

Google OAuth:
  Client → Google OAuth 2.0 consent → authorization code
  → Send to API → Passport.js GoogleStrategy verifies → find/create user → issue JWT

Phone OTP:
  Client → request OTP (API calls Twilio/MSG91) → user enters code
  → Send to API → verify OTP → find/create user → issue JWT
```

**Token Strategy:**
- Access token: 15 min expiry, stored in memory (web) / SecureStore (mobile)
- Refresh token: 7 day expiry, stored in httpOnly cookie (web) / SecureStore (mobile)
- Refresh rotation: new refresh token issued on each refresh

### 2.8 File Storage — Cloudinary

**Why:** Free 25GB storage, automatic format optimization (WebP/AVIF), responsive image transforms, CDN delivery, direct upload from client.

**Usage:**
- Listing images: up to 10 per listing, max 5MB each
- User avatars: 1 per user
- Chat images: inline image messages
- Transforms: thumbnail (300x300), medium (800x600), full (1200x900)

### 2.9 Payment — Razorpay Subscriptions

**Why:** India-focused, supports recurring subscriptions, robust webhook system, test mode for development.

**Flow:**
```
1. Admin creates plans in DB → synced to Razorpay as Plans
2. User selects plan → API creates Razorpay Subscription → returns payment link
3. User completes payment on Razorpay checkout
4. Razorpay sends webhook → API verifies signature → updates UserSubscription
5. Monthly: Razorpay auto-charges → webhook → API confirms renewal
6. Cancel: User cancels → API cancels Razorpay subscription → downgrade to Free at period end
```

---

## 3. Monorepo Structure

```
Rentage/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/         # JWT, Google OAuth, OTP
│   │   │   │   │   ├── guards/             # RolesGuard, JwtGuard
│   │   │   │   │   └── dto/
│   │   │   │   ├── user/
│   │   │   │   ├── listing/
│   │   │   │   ├── category/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── chat.module.ts
│   │   │   │   │   ├── chat.gateway.ts     # Socket.io
│   │   │   │   │   ├── chat.service.ts
│   │   │   │   │   └── chat.controller.ts
│   │   │   │   ├── subscription/
│   │   │   │   ├── notification/
│   │   │   │   ├── upload/
│   │   │   │   ├── admin/
│   │   │   │   └── health/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/               # Global exception filter
│   │   │   │   ├── interceptors/           # Response transform, logging
│   │   │   │   ├── pipes/                  # Validation pipe
│   │   │   │   └── middleware/             # Rate limiter, CORS
│   │   │   ├── config/                     # Environment config
│   │   │   ├── prisma/
│   │   │   │   └── prisma.service.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   ├── web/                          # Next.js Web App + Admin Panel
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages (see 2.3)
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui components
│   │   │   │   ├── layout/          # Header, Footer, Sidebar
│   │   │   │   ├── listing/         # ListingCard, ListingForm, etc.
│   │   │   │   ├── chat/            # ChatWindow, MessageBubble, etc.
│   │   │   │   └── admin/           # Admin-specific components
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # API client (axios/fetch wrapper)
│   │   │   │   ├── auth.ts          # Auth context/hooks
│   │   │   │   ├── socket.ts        # Socket.io client
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── stores/              # Zustand stores (auth, chat, etc.)
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── mobile/                       # React Native (Expo)
│       ├── app/                      # Expo Router (see 2.4)
│       ├── components/
│       ├── lib/
│       ├── hooks/
│       ├── stores/
│       ├── assets/
│       ├── app.json
│       ├── eas.json
│       └── package.json
│
├── packages/
│   ├── shared-types/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts              # User, UserProfile interfaces
│   │   │   ├── listing.ts           # Listing, Category interfaces
│   │   │   ├── chat.ts              # Message, Conversation interfaces
│   │   │   ├── subscription.ts      # Plan, Subscription interfaces
│   │   │   ├── api.ts               # API response/error types
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── validation/                   # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── auth.ts              # Login, Register schemas
│   │   │   ├── listing.ts           # Create/edit listing schemas
│   │   │   ├── user.ts              # Profile update schemas
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── config/                       # Shared configs
│       ├── eslint-config/
│       ├── tsconfig/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   ├── nestjs.json
│       │   └── react-native.json
│       └── prettier-config/
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Migration files
│   └── seed.ts                       # Seed script
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test on PR
│       └── deploy.yml                # Deploy on main merge
│
├── .env.example
├── .gitignore
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 4. API Architecture (NestJS)

### 4.1 Request Lifecycle

```
Request
  → Rate Limiter (middleware)
  → CORS (middleware)
  → Helmet (middleware)
  → Global Validation Pipe (Zod/class-validator)
  → Auth Guard (JWT verification)
  → Roles Guard (role check)
  → Subscription Guard (plan limit check)
  → Controller
  → Service (business logic)
  → Prisma (database)
  → Response Interceptor (standard envelope)
  → Client
```

### 4.2 Standard API Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "cursor": "eyJpZCI6MTUwfQ=="
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "LISTING_LIMIT_REACHED",
    "message": "You have reached your plan's listing limit. Upgrade to add more.",
    "statusCode": 403
  }
}
```

### 4.3 Environment Configuration

```env
# Database
DATABASE_URL=mysql://user:pass@host:3306/rentage

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Firebase (FCM only — push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback

# Phone OTP (Twilio or MSG91)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Maps
GOOGLE_MAPS_API_KEY=

# App
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
NODE_ENV=development
PORT=4000
```

---

## 5. State Management

### 5.1 Web (Next.js)

| Concern | Solution |
|---|---|
| Server state | TanStack Query (React Query) |
| Client state | Zustand (auth, UI, chat) |
| Form state | React Hook Form + Zod |
| URL state | Next.js searchParams |

### 5.2 Mobile (React Native)

| Concern | Solution |
|---|---|
| Server state | TanStack Query |
| Client state | Zustand |
| Form state | React Hook Form + Zod |
| Secure storage | expo-secure-store (tokens) |
| Navigation | Expo Router |

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Security Layers                    │
├─────────────────────────────────────────────────────┤
│ L1: Network        │ HTTPS, CORS, Helmet headers    │
│ L2: Rate Limiting  │ Throttle: 100 req/min/user     │
│ L3: Authentication │ Custom JWT + Passport.js          │
│ L4: Authorization  │ Role-based guards               │
│ L5: Plan Limits    │ Subscription guard middleware    │
│ L6: Input          │ Zod validation, sanitization    │
│ L7: Data           │ Prisma parameterized queries    │
│ L8: Files          │ Type + size validation (5MB)    │
│ L9: Payments       │ Razorpay signature verification │
│ L10: Logging       │ Audit trail, error tracking     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Third-Party Service Integration

| Service | Purpose | Free Tier Limits |
|---|---|---|
| **Cloudinary** | Image storage + CDN | 25GB storage, 25GB bandwidth/mo |
| **Twilio / MSG91** | Phone OTP | Twilio: $0.0079/SMS; MSG91: ₹0.20/SMS |
| **Firebase FCM** | Push notifications | Free (unlimited) |
| **Razorpay** | Subscription billing | 2% per transaction |
| **Google Maps** | Geocoding, autocomplete | $200 free credit/mo |
| **Google OAuth** | Google sign-in | Free (Cloud Console) |
| **Vercel** | Next.js hosting | Free tier (hobby) |
| **Hostinger** | MySQL database | Included in hosting plan |
