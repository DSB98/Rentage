# Rentage — Database Schema

## 1. Overview

- **Database:** MySQL 8
- **ORM:** Prisma
- **Naming Convention:** snake_case for DB columns, camelCase in Prisma schema

---

## 2. Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User        │     │   UserProfile    │     │  OAuthAccount    │
│──────────────────│     │──────────────────│     │──────────────────│
│ id (PK)          │──┐  │ id (PK)          │     │ id (PK)          │
│ email            │  ├──│ userId (FK)      │     │ userId (FK)      │
│ passwordHash     │  │  │ fullName         │     │ provider         │
│ role             │  │  │ phone            │     │ providerAccountId│
│ isEmailVerified  │  │  │ avatarUrl        │     └──────────────────┘
│ isActive         │  │  │ bio              │
│ createdAt        │  │  │ city             │
│ updatedAt        │  │  │ state            │
└──────────────────┘  │  │ latitude         │
                      │  │ longitude        │
                      │  └──────────────────┘
                      │
                      │  ┌──────────────────┐     ┌──────────────────┐
                      ├──│  RefreshToken    │     │   Category       │
                      │  │──────────────────│     │──────────────────│
                      │  │ id (PK)          │     │ id (PK)          │
                      │  │ userId (FK)      │     │ name             │
                      │  │ token            │     │ slug             │
                      │  │ expiresAt        │     │ description      │
                      │  └──────────────────┘     │ icon             │
                      │                           │ parentId (FK)    │──┐ self-ref
                      │                           │ sortOrder        │──┘
                      │                           │ isActive         │
                      │                           └──────┬───────────┘
                      │                                  │
                      │  ┌──────────────────┐            │
                      ├──│    Listing       │            │
                      │  │──────────────────│            │
                      │  │ id (PK)          │            │
                      │  │ ownerId (FK)     │──── User   │
                      │  │ categoryId (FK)  │──── Category
                      │  │ title            │
                      │  │ description      │
                      │  │ price            │
                      │  │ rentPeriod       │
                      │  │ status           │
                      │  │ isFeatured       │
                      │  │ address          │
                      │  │ city             │
                      │  │ state            │
                      │  │ latitude         │
                      │  │ longitude        │
                      │  │ rejectionReason  │
                      │  │ createdAt        │
                      │  │ updatedAt        │
                      │  └──────┬───────────┘
                      │         │
                      │         ├── ListingImage (1:M)
                      │         ├── ListingAmenity (1:M)
                      │         ├── SavedListing (M:M via User)
                      │         ├── Conversation (1:M)
                      │         └── Report (1:M)
                      │
                      │  ┌──────────────────┐     ┌──────────────────┐
                      ├──│  Conversation    │     │    Message       │
                      │  │──────────────────│     │──────────────────│
                      │  │ id (PK)          │──┐  │ id (PK)          │
                      │  │ listingId (FK)   │  ├──│ conversationId   │
                      │  │ ownerId (FK)     │  │  │ senderId (FK)    │
                      │  │ renterId (FK)    │  │  │ content          │
                      │  │ lastMessageAt    │  │  │ messageType      │
                      │  │ createdAt        │  │  │ imageUrl         │
                      │  └──────────────────┘  │  │ isRead           │
                      │                        │  │ readAt           │
                      │                        │  │ createdAt        │
                      │                        │  └──────────────────┘
                      │
                      │  ┌──────────────────┐
                      ├──│ ContactReveal    │
                      │  │──────────────────│
                      │  │ id (PK)          │
                      │  │ revealerId (FK)  │──── User (renter)
                      │  │ ownerId (FK)     │──── User (owner)
                      │  │ listingId (FK)   │──── Listing
                      │  │ createdAt        │
                      │  └──────────────────┘
                      │
                      │  ┌──────────────────┐     ┌──────────────────┐
                      ├──│ UserSubscription │     │SubscriptionPlan  │
                      │  │──────────────────│     │──────────────────│
                      │  │ id (PK)          │     │ id (PK)          │
                      │  │ userId (FK)      │     │ name             │
                      │  │ planId (FK)      │─────│ slug             │
                      │  │ razorpaySubId    │     │ price            │
                      │  │ status           │     │ currency         │
                      │  │ currentPeriodStart│    │ interval         │
                      │  │ currentPeriodEnd │     │ maxListings      │
                      │  │ cancelledAt      │     │ maxContactReveals│
                      │  │ createdAt        │     │ features (JSON)  │
                      │  │ updatedAt        │     │ razorpayPlanId   │
                      │  └──────────────────┘     │ isActive         │
                      │                           │ sortOrder        │
                      │  ┌──────────────────┐     │ createdAt        │
                      ├──│    Payment       │     │ updatedAt        │
                      │  │──────────────────│     └──────────────────┘
                      │  │ id (PK)          │
                      │  │ userId (FK)      │
                      │  │ subscriptionId   │
                      │  │ razorpayPaymentId│
                      │  │ amount           │
                      │  │ currency         │
                      │  │ status           │
                      │  │ method           │
                      │  │ invoiceUrl       │
                      │  │ paidAt           │
                      │  │ createdAt        │
                      │  └──────────────────┘
                      │
                      │  ┌──────────────────┐     ┌──────────────────┐
                      ├──│   Notification   │     │    Report        │
                      │  │──────────────────│     │──────────────────│
                      │  │ id (PK)          │     │ id (PK)          │
                      │  │ userId (FK)      │     │ reporterId (FK)  │
                      │  │ type             │     │ listingId (FK)   │
                      │  │ title            │     │ reason           │
                      │  │ body             │     │ description      │
                      │  │ data (JSON)      │     │ status           │
                      │  │ isRead           │     │ adminNotes       │
                      │  │ createdAt        │     │ resolvedAt       │
                      │  └──────────────────┘     │ resolvedById (FK)│
                      │                           │ createdAt        │
                      │  ┌──────────────────┐     └──────────────────┘
                      └──│   AdminLog       │
                         │──────────────────│
                         │ id (PK)          │
                         │ adminId (FK)     │
                         │ action           │
                         │ entity           │
                         │ entityId         │
                         │ details (JSON)   │
                         │ createdAt        │
                         └──────────────────┘
```

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum UserRole {
  OWNER
  RENTER
  ADMIN
}

enum ListingStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  INACTIVE
  REJECTED
}

enum RentPeriod {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum MessageType {
  TEXT
  IMAGE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
}

enum PaymentStatus {
  PENDING
  CAPTURED
  FAILED
  REFUNDED
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}

// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?   // null for OAuth-only users
  role            UserRole
  isEmailVerified Boolean   @default(false)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  profile         UserProfile?
  oauthAccounts   OAuthAccount[]
  refreshTokens   RefreshToken[]
  ownedListings   Listing[]          @relation("OwnerListings")
  savedListings   SavedListing[]
  conversationsAsOwner  Conversation[] @relation("OwnerConversations")
  conversationsAsRenter Conversation[] @relation("RenterConversations")
  sentMessages    Message[]
  contactRevealsGiven    ContactReveal[] @relation("RevealerReveals")
  contactRevealsReceived ContactReveal[] @relation("OwnerReveals")
  subscription    UserSubscription?
  payments        Payment[]
  notifications   Notification[]
  reports         Report[]           @relation("ReporterReports")
  resolvedReports Report[]           @relation("ResolverReports")
  adminLogs       AdminLog[]

  @@map("users")
}

model UserProfile {
  id        String  @id @default(uuid())
  userId    String  @unique
  fullName  String
  phone     String?
  avatarUrl String?
  bio       String? @db.Text
  city      String?
  state     String?
  latitude  Float?
  longitude Float?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model OAuthAccount {
  id                String @id @default(uuid())
  userId            String
  provider          String // "google", "phone"
  providerAccountId String // Google sub ID or phone number

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

model Category {
  id          String  @id @default(uuid())
  name        String  @unique
  slug        String  @unique
  description String? @db.Text
  icon        String? // icon name or URL
  parentId    String?
  sortOrder   Int     @default(0)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Self-relation for hierarchy
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")

  listings Listing[]

  @@index([parentId])
  @@index([slug])
  @@map("categories")
}

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

model Listing {
  id              String        @id @default(uuid())
  ownerId         String
  categoryId      String
  title           String
  description     String        @db.Text
  price           Decimal       @db.Decimal(10, 2)
  rentPeriod      RentPeriod
  status          ListingStatus @default(DRAFT)
  isFeatured      Boolean       @default(false)
  address         String?       @db.Text
  city            String
  state           String
  latitude        Float?
  longitude       Float?
  rejectionReason String?       @db.Text
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  owner           User            @relation("OwnerListings", fields: [ownerId], references: [id])
  category        Category        @relation(fields: [categoryId], references: [id])
  images          ListingImage[]
  amenities       ListingAmenity[]
  savedBy         SavedListing[]
  conversations   Conversation[]
  contactReveals  ContactReveal[]
  reports         Report[]

  @@index([ownerId])
  @@index([categoryId])
  @@index([status])
  @@index([city])
  @@index([state])
  @@index([price])
  @@index([createdAt])
  @@fulltext([title, description])
  @@map("listings")
}

model ListingImage {
  id         String @id @default(uuid())
  listingId  String
  url        String // Cloudinary URL
  publicId   String // Cloudinary public ID (for deletion)
  sortOrder  Int    @default(0)
  createdAt  DateTime @default(now())

  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@map("listing_images")
}

model ListingAmenity {
  id        String @id @default(uuid())
  listingId String
  key       String // e.g., "bhk", "cc", "brand"
  value     String // e.g., "3", "150", "Samsung"

  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@map("listing_amenities")
}

model SavedListing {
  id        String   @id @default(uuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@index([userId])
  @@map("saved_listings")
}

// ─────────────────────────────────────────────
// CHAT & MESSAGING
// ─────────────────────────────────────────────

model Conversation {
  id            String   @id @default(uuid())
  listingId     String
  ownerId       String
  renterId      String
  lastMessageAt DateTime?
  createdAt     DateTime @default(now())

  listing  Listing   @relation(fields: [listingId], references: [id])
  owner    User      @relation("OwnerConversations", fields: [ownerId], references: [id])
  renter   User      @relation("RenterConversations", fields: [renterId], references: [id])
  messages Message[]

  @@unique([listingId, renterId]) // one conversation per listing+renter
  @@index([ownerId])
  @@index([renterId])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id             String      @id @default(uuid())
  conversationId String
  senderId       String
  content        String      @db.Text
  messageType    MessageType @default(TEXT)
  imageUrl       String?
  isRead         Boolean     @default(false)
  readAt         DateTime?
  createdAt      DateTime    @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id])

  @@index([conversationId, createdAt])
  @@index([senderId])
  @@map("messages")
}

// ─────────────────────────────────────────────
// CONTACT REVEALS
// ─────────────────────────────────────────────

model ContactReveal {
  id         String   @id @default(uuid())
  revealerId String   // renter who revealed
  ownerId    String   // owner whose phone was revealed
  listingId  String
  createdAt  DateTime @default(now())

  revealer User    @relation("RevealerReveals", fields: [revealerId], references: [id])
  owner    User    @relation("OwnerReveals", fields: [ownerId], references: [id])
  listing  Listing @relation(fields: [listingId], references: [id])

  @@unique([revealerId, listingId]) // one reveal per renter per listing
  @@index([revealerId, createdAt])  // for counting monthly reveals
  @@map("contact_reveals")
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS & PAYMENTS
// ─────────────────────────────────────────────

model SubscriptionPlan {
  id                String  @id @default(uuid())
  name              String  @unique
  slug              String  @unique
  description       String? @db.Text
  price             Decimal @db.Decimal(10, 2)
  currency          String  @default("INR")
  interval          String  @default("monthly") // "monthly", "yearly"
  maxListings       Int     // -1 = unlimited
  maxContactReveals Int     // -1 = unlimited
  features          Json?   // additional features as JSON
  razorpayPlanId    String? @unique // synced Razorpay plan ID
  isActive          Boolean @default(true)
  sortOrder         Int     @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  subscriptions UserSubscription[]

  @@index([slug])
  @@map("subscription_plans")
}

model UserSubscription {
  id                  String             @id @default(uuid())
  userId              String             @unique
  planId              String
  razorpaySubId       String?            @unique // Razorpay subscription ID
  status              SubscriptionStatus @default(ACTIVE)
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelledAt         DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  user User             @relation(fields: [userId], references: [id])
  plan SubscriptionPlan @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([currentPeriodEnd])
  @@map("user_subscriptions")
}

model Payment {
  id                String        @id @default(uuid())
  userId            String
  subscriptionId    String?       // UserSubscription ID
  razorpayPaymentId String?       @unique
  amount            Decimal       @db.Decimal(10, 2)
  currency          String        @default("INR")
  status            PaymentStatus @default(PENDING)
  method            String?       // "card", "upi", "netbanking"
  invoiceUrl        String?
  paidAt            DateTime?
  createdAt         DateTime      @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "new_message", "listing_approved", "listing_rejected", "subscription_expiry", "payment_success"
  title     String
  body      String   @db.Text
  data      Json?    // additional context (listingId, conversationId, etc.)
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

// ─────────────────────────────────────────────
// REPORTS & ADMIN
// ─────────────────────────────────────────────

model Report {
  id           String       @id @default(uuid())
  reporterId   String
  listingId    String
  reason       String       // "spam", "inappropriate", "misleading", "duplicate", "other"
  description  String?      @db.Text
  status       ReportStatus @default(PENDING)
  adminNotes   String?      @db.Text
  resolvedAt   DateTime?
  resolvedById String?
  createdAt    DateTime     @default(now())

  reporter   User    @relation("ReporterReports", fields: [reporterId], references: [id])
  listing    Listing @relation(fields: [listingId], references: [id])
  resolvedBy User?   @relation("ResolverReports", fields: [resolvedById], references: [id])

  @@index([listingId])
  @@index([status])
  @@map("reports")
}

model AdminLog {
  id        String   @id @default(uuid())
  adminId   String
  action    String   // "approve_listing", "reject_listing", "deactivate_user", etc.
  entity    String   // "listing", "user", "category", "plan"
  entityId  String
  details   Json?
  createdAt DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("admin_logs")
}
```

---

## 4. Indexes Strategy

| Table | Index | Purpose |
|---|---|---|
| `listings` | `(owner_id)` | Owner's listings query |
| `listings` | `(category_id)` | Category browse |
| `listings` | `(status)` | Admin moderation queue |
| `listings` | `(city)` | Location filter |
| `listings` | `(price)` | Price sort/filter |
| `listings` | `(created_at)` | Newest sort |
| `listings` | `FULLTEXT(title, description)` | Keyword search |
| `conversations` | `(owner_id)` | Owner's chat list |
| `conversations` | `(renter_id)` | Renter's chat list |
| `conversations` | `(last_message_at)` | Sort by latest |
| `messages` | `(conversation_id, created_at)` | Message history |
| `contact_reveals` | `(revealer_id, created_at)` | Monthly quota count |
| `notifications` | `(user_id, is_read)` | Unread count |
| `notifications` | `(user_id, created_at)` | Notification list |

---

## 5. Seed Data

The seed script (`prisma/seed.ts`) creates:

1. **Admin user** — email: `admin@rentage.in`, role: ADMIN
2. **Default categories** — Homes, Flats, PGs, Cars, Bikes, Washing Machines, Water Filters, Electronics, Furniture, Tools, Others
3. **Subscription plans:**
   - Free: ₹0, 3 listings, 5 reveals/month
   - Basic: ₹199/mo, 15 listings, 30 reveals/month
   - Pro: ₹499/mo, unlimited listings, unlimited reveals

---

## 6. Migration Strategy

- Use `prisma migrate dev` during development (auto-generates SQL migrations)
- Use `prisma migrate deploy` in production (applies pending migrations)
- Store all migration files in version control (`prisma/migrations/`)
- Never edit applied migrations; create new ones for schema changes
