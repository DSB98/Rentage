# Rentage — Requirements Document

## 1. Introduction

### 1.1 Purpose

Rentage is a rental marketplace platform that enables asset owners to list items for rent and renters to discover and connect with owners. The platform supports any rentable asset — from real estate to household appliances.

### 1.2 Scope

- Web application (public-facing + admin panel)
- Mobile application (iOS + Android)
- Backend API with real-time capabilities
- Subscription-based monetization

### 1.3 Definitions

| Term | Definition |
|---|---|
| **Owner** | A registered user who lists assets for rent |
| **Renter** | A registered user who searches for and rents assets |
| **Listing** | An asset posted by an owner, available for rent |
| **Contact Reveal** | Action of viewing an owner's hidden phone number (quota-limited) |
| **Subscription Plan** | A recurring paid tier that unlocks platform features |

---

## 2. User Roles & Personas

### 2.1 Owner

- **Goal:** List assets to find renters
- **Actions:** Register → Choose "Owner" role → Subscribe (optional) → Create listings → Respond to chat inquiries → Manage listings
- **Constraints:** Listing count and contact reveal quotas depend on subscription tier

### 2.2 Renter

- **Goal:** Find assets to rent
- **Actions:** Register → Choose "Renter" role → Browse/search listings → Save favorites → Chat with owners → Reveal owner phone numbers
- **Constraints:** Contact reveal quota depends on subscription tier

### 2.3 Admin

- **Goal:** Manage the platform, moderate content, configure monetization
- **Actions:** Dashboard analytics → Approve/reject listings → Manage users → Manage categories → Configure subscription plans → View reports
- **Constraints:** Admin accounts created manually or via seed script (not public registration)

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Users can register with email + password | Must Have |
| FR-AUTH-02 | Users can sign in with Google (OAuth 2.0 via Passport.js) | Must Have |
| FR-AUTH-03 | Users can sign in with Phone OTP (Twilio / MSG91) | Must Have |
| FR-AUTH-04 | Email verification is required after registration | Must Have |
| FR-AUTH-05 | Users choose role (Owner/Renter) at registration | Must Have |
| FR-AUTH-06 | Role is permanent and cannot be switched | Must Have |
| FR-AUTH-07 | JWT access token (15 min) + refresh token (7 days) | Must Have |
| FR-AUTH-08 | Password reset via email link | Must Have |
| FR-AUTH-09 | Admin accounts are seeded, not publicly registerable | Must Have |
| FR-AUTH-10 | Role-based route protection (Owner, Renter, Admin) | Must Have |

### 3.2 User Profile

| ID | Requirement | Priority |
|---|---|---|
| FR-PROF-01 | Users can view and edit their profile (name, avatar, bio, location) | Must Have |
| FR-PROF-02 | Avatar upload to Cloudinary with image optimization | Must Have |
| FR-PROF-03 | Users can view their subscription status and plan details | Must Have |
| FR-PROF-04 | Users can view their activity history (listings, chats, reveals) | Should Have |
| FR-PROF-05 | Account deletion (soft delete with data retention policy) | Should Have |

### 3.3 Categories

| ID | Requirement | Priority |
|---|---|---|
| FR-CAT-01 | Categories are admin-managed (CRUD) | Must Have |
| FR-CAT-02 | Default seeded categories: Homes, Flats, PGs, Cars, Bikes, Washing Machines, Water Filters, Electronics, Furniture, Tools, Others | Must Have |
| FR-CAT-03 | Categories have: name, icon, description, active/inactive status | Must Have |
| FR-CAT-04 | Categories support hierarchical structure (parent → subcategory) | Should Have |
| FR-CAT-05 | Admin can reorder categories (sort order) | Should Have |
| FR-CAT-06 | Categories define custom amenity fields (e.g., "BHK" for Homes, "CC" for Bikes) | Nice to Have |

### 3.4 Listings

| ID | Requirement | Priority |
|---|---|---|
| FR-LIST-01 | Owners can create a listing with: title, description, category, price, rent period, location, images, amenities | Must Have |
| FR-LIST-02 | Multi-step listing creation form (Details → Images → Location → Pricing → Review) | Must Have |
| FR-LIST-03 | Support multiple images per listing (up to 10), uploaded to Cloudinary | Must Have |
| FR-LIST-04 | Rent period options: Hourly, Daily, Weekly, Monthly, Yearly | Must Have |
| FR-LIST-05 | Location input with Google Maps autocomplete + map pin | Must Have |
| FR-LIST-06 | Listings require admin approval before going live | Must Have |
| FR-LIST-07 | Listing statuses: Draft, Pending Approval, Active, Inactive, Rejected | Must Have |
| FR-LIST-08 | Owners can edit, deactivate, reactivate, and delete their listings | Must Have |
| FR-LIST-09 | Owner dashboard: "My Listings" with status filters | Must Have |
| FR-LIST-10 | Listing count is enforced against subscription plan limit | Must Have |
| FR-LIST-11 | Custom amenities per category (key-value pairs) | Should Have |
| FR-LIST-12 | Featured listings badge for Pro subscribers | Should Have |

### 3.5 Search & Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-SRCH-01 | Full-text search by keyword (title, description) | Must Have |
| FR-SRCH-02 | Filter by category | Must Have |
| FR-SRCH-03 | Filter by city/location | Must Have |
| FR-SRCH-04 | Filter by price range | Must Have |
| FR-SRCH-05 | Filter by rent period (daily, monthly, etc.) | Must Have |
| FR-SRCH-06 | Sort by: Newest, Price (low→high / high→low), Nearest | Must Have |
| FR-SRCH-07 | Cursor-based pagination (infinite scroll on mobile, paginated on web) | Must Have |
| FR-SRCH-08 | Google Maps autocomplete for location search | Must Have |
| FR-SRCH-09 | Map view showing listings as pins | Should Have |
| FR-SRCH-10 | "Nearby listings" using device geolocation | Should Have |
| FR-SRCH-11 | Category browsing (grid/list of categories → listings) | Must Have |
| FR-SRCH-12 | Recently viewed listings | Nice to Have |

### 3.6 Listing Detail

| ID | Requirement | Priority |
|---|---|---|
| FR-DET-01 | Display full listing info: images (gallery), title, description, price, rent period, location (map), amenities | Must Have |
| FR-DET-02 | Owner info: name, avatar, member since (phone hidden) | Must Have |
| FR-DET-03 | "Contact Owner" button → opens chat | Must Have |
| FR-DET-04 | "Reveal Phone Number" button → deducts 1 contact reveal credit | Must Have |
| FR-DET-05 | Save/unsave (favorite) listing | Must Have |
| FR-DET-06 | "Similar Listings" section (same category, nearby) | Should Have |
| FR-DET-07 | Report listing (flag for admin review) | Should Have |
| FR-DET-08 | Share listing (URL, WhatsApp, copy link) | Should Have |

### 3.7 Saved Listings

| ID | Requirement | Priority |
|---|---|---|
| FR-FAV-01 | Renters can save/unsave listings | Must Have |
| FR-FAV-02 | "My Saved Listings" page with grid view | Must Have |
| FR-FAV-03 | Saved state shown on listing cards and detail page | Must Have |

### 3.8 Real-Time Chat

| ID | Requirement | Priority |
|---|---|---|
| FR-CHAT-01 | Renter initiates chat from a listing detail page | Must Have |
| FR-CHAT-02 | One conversation per listing+renter pair (no duplicates) | Must Have |
| FR-CHAT-03 | Real-time message delivery via Socket.io | Must Have |
| FR-CHAT-04 | Message types: text and image | Must Have |
| FR-CHAT-05 | Read receipts (delivered, read) | Should Have |
| FR-CHAT-06 | Online/offline indicator | Should Have |
| FR-CHAT-07 | Chat list: all conversations sorted by latest message | Must Have |
| FR-CHAT-08 | Unread message count badge | Must Have |
| FR-CHAT-09 | Image sharing in chat (upload to Cloudinary) | Should Have |
| FR-CHAT-10 | Chat persisted in database (message history) | Must Have |

### 3.9 Contact Reveal System

| ID | Requirement | Priority |
|---|---|---|
| FR-REVEAL-01 | Owner phone numbers are hidden by default | Must Have |
| FR-REVEAL-02 | "Reveal Phone" consumes 1 credit from monthly quota | Must Have |
| FR-REVEAL-03 | Once revealed, phone stays visible for that listing (no re-charge) | Must Have |
| FR-REVEAL-04 | Quota resets monthly based on subscription billing cycle | Must Have |
| FR-REVEAL-05 | Show remaining reveals count to user | Must Have |
| FR-REVEAL-06 | When quota exhausted, show upgrade prompt | Must Have |

### 3.10 Subscription & Payments

| ID | Requirement | Priority |
|---|---|---|
| FR-SUB-01 | Three default plans: Free, Basic (₹199/mo), Pro (₹499/mo) | Must Have |
| FR-SUB-02 | All plan parameters are admin-configurable (name, price, limits, features) | Must Have |
| FR-SUB-03 | Razorpay Subscriptions API for recurring billing | Must Have |
| FR-SUB-04 | Webhook handling: `payment.captured`, `subscription.charged`, `subscription.cancelled`, `subscription.completed` | Must Have |
| FR-SUB-05 | Payment history and invoice viewing | Must Have |
| FR-SUB-06 | Graceful downgrade: when plan expires, enforce Free tier limits | Must Have |
| FR-SUB-07 | Free plan is default for all new users (no payment required) | Must Have |
| FR-SUB-08 | Plan comparison page | Should Have |
| FR-SUB-09 | Subscription management: upgrade, downgrade, cancel | Must Have |
| FR-SUB-10 | NestJS guard middleware enforces plan limits on every relevant API call | Must Have |

### 3.11 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-NOTIF-01 | In-app notification center (bell icon with unread count) | Must Have |
| FR-NOTIF-02 | Push notifications via Firebase Cloud Messaging | Must Have |
| FR-NOTIF-03 | Notification triggers: new chat message, listing approved/rejected, subscription expiry warning, payment confirmation | Must Have |
| FR-NOTIF-04 | Email notifications (configurable per user) | Should Have |
| FR-NOTIF-05 | Notification preferences: toggle per notification type | Should Have |

### 3.12 Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| FR-ADMIN-01 | Dashboard: total users, active listings, revenue, new signups (charts) | Must Have |
| FR-ADMIN-02 | User management: list, search, view profile, activate/deactivate, change role | Must Have |
| FR-ADMIN-03 | Listing moderation: pending approval queue, approve/reject with reason, feature/unfeature, remove | Must Have |
| FR-ADMIN-04 | Category management: full CRUD, reorder, toggle active | Must Have |
| FR-ADMIN-05 | Subscription plan configuration: full CRUD, set limits and pricing | Must Have |
| FR-ADMIN-06 | Reports: view flagged listings, take action, add admin notes | Must Have |
| FR-ADMIN-07 | Audit log: track all admin actions with timestamp and actor | Should Have |
| FR-ADMIN-08 | Revenue analytics: MRR, plan distribution, churn rate | Should Have |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | API response time | < 300ms (p95) |
| NFR-PERF-02 | Page load time (web, LCP) | < 2.5 seconds |
| NFR-PERF-03 | Chat message delivery latency | < 500ms |
| NFR-PERF-04 | Search results returned | < 500ms |
| NFR-PERF-05 | Image optimization | Cloudinary auto-format, lazy loading |

### 4.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | Passwords hashed with bcrypt (salt rounds: 12) |
| NFR-SEC-02 | JWT tokens with short expiry (15 min access, 7 day refresh) |
| NFR-SEC-03 | Rate limiting on auth endpoints (5 attempts / 15 min) |
| NFR-SEC-04 | Rate limiting on API (100 req/min per user) |
| NFR-SEC-05 | Input validation and sanitization on all endpoints (Zod + class-validator) |
| NFR-SEC-06 | CORS configured for allowed origins only |
| NFR-SEC-07 | Helmet.js security headers |
| NFR-SEC-08 | SQL injection prevention (Prisma parameterized queries) |
| NFR-SEC-09 | XSS prevention (sanitize HTML in user inputs) |
| NFR-SEC-10 | CSRF protection on state-changing requests |
| NFR-SEC-11 | Razorpay webhook signature verification |
| NFR-SEC-12 | File upload validation (type, size: max 5MB per image) |

### 4.3 Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-01 | Database: MySQL indexes on frequently queried columns |
| NFR-SCALE-02 | Cursor-based pagination (no offset) |
| NFR-SCALE-03 | API designed for horizontal scaling (stateless JWT) |
| NFR-SCALE-04 | Socket.io with Redis adapter (when scaling to multiple instances) |
| NFR-SCALE-05 | Cloudinary CDN for image delivery |

### 4.4 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-01 | Database backups: daily automated |
| NFR-REL-02 | Error tracking and logging (structured JSON logs) |
| NFR-REL-03 | Health check endpoint (`GET /api/health`) |
| NFR-REL-04 | Graceful error handling: global exception filter returns consistent error format |

### 4.5 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | Responsive web design (mobile, tablet, desktop) |
| NFR-UX-02 | Mobile-first UI design |
| NFR-UX-03 | Consistent design system via Tailwind CSS + shadcn/ui |
| NFR-UX-04 | Loading states and skeleton screens |
| NFR-UX-05 | Toast notifications for user actions |
| NFR-UX-06 | Form validation with inline error messages |
| NFR-UX-07 | Dark mode support |

### 4.6 SEO (Web)

| ID | Requirement |
|---|---|
| NFR-SEO-01 | Server-side rendering for listing pages |
| NFR-SEO-02 | Dynamic meta tags (title, description, OG image) per listing |
| NFR-SEO-03 | JSON-LD structured data for listing pages |
| NFR-SEO-04 | Auto-generated `sitemap.xml` |
| NFR-SEO-05 | Canonical URLs and proper heading hierarchy |

---

## 5. Constraints

| Constraint | Details |
|---|---|
| **Database** | MySQL 8 (Hostinger shared hosting for DB) |
| **Budget** | Minimize hosting costs; leverage free tiers where possible |
| **Geography** | India-focused: INR currency, Razorpay, +91 phone numbers |
| **No rental payments** | Platform connects people; rent is paid offline |
| **Role permanence** | Owner/Renter role chosen at registration, not switchable |

---

## 6. Assumptions

1. Users have a valid Indian mobile number or email address.
2. Owners have assets they legally own or are authorized to rent.
3. Platform is not responsible for rental disputes (terms of service for legal protection).
4. Razorpay test mode is used during development; live mode for production.
5. Google Maps API key has appropriate usage quota for the expected user base.
6. Cloudinary free tier (25GB) is sufficient for initial launch.

---

## 7. Out of Scope (v1)

- Rental agreement/contract generation
- In-app rent payment processing
- Identity verification (Aadhaar/PAN)
- Review and rating system
- Multi-language / internationalization
- Desktop application
- AI-powered recommendations
- Video calls between owner and renter

> These may be considered for v2 based on user feedback and traction.

---

## 8. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Registered users | 5,000+ |
| Active listings | 1,000+ |
| Monthly active users | 2,000+ |
| Paid subscribers | 200+ (4% conversion) |
| Monthly recurring revenue | ₹50,000+ |
| Chat messages/month | 10,000+ |
| Average listing approval time | < 24 hours |
