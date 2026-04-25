# Rentage — API Design

## 1. API Conventions

| Aspect | Convention |
|---|---|
| **Base URL** | `https://api.rentage.in/api/v1` |
| **Format** | JSON |
| **Auth** | Bearer token in `Authorization` header |
| **Pagination** | Cursor-based (`?cursor=xxx&limit=20`) |
| **Errors** | Consistent error envelope |
| **Docs** | Swagger UI at `/api/docs` |
| **Versioning** | URL prefix (`/api/v1/`) |

### Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cursor": "eyJpZCI6MTUwfQ==",
    "hasMore": true,
    "total": 150
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "statusCode": 400,
    "details": [
      { "field": "title", "message": "Title must not be empty" }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient role/permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `LISTING_LIMIT_REACHED` | 403 | Plan listing limit exceeded |
| `REVEAL_LIMIT_REACHED` | 403 | Plan contact reveal limit exceeded |
| `PLAN_REQUIRED` | 403 | Action requires paid plan |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/register`

Register a new user with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "OWNER"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "OWNER",
      "isEmailVerified": false
    },
    "message": "Verification email sent"
  }
}
```

---

### `POST /api/v1/auth/login`

Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "OWNER", "profile": { ... } },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### `GET /api/v1/auth/google`

Initiate Google OAuth 2.0 sign-in. Redirects to Google consent screen.

> The API redirects the user to Google. After consent, Google redirects to the callback URL below.

---

### `GET /api/v1/auth/google/callback`

Google OAuth callback. Handles authorization code, creates/finds user, issues JWT.

**Query:** `?code=<authorization_code>&state=<state>`

> `role` is passed via the `state` parameter on first login (account creation). Ignored if user exists.

**Response:** Redirects to web app with tokens:
```
https://rentage.in/auth/callback?accessToken=eyJ...&refreshToken=eyJ...
```

---

### `POST /api/v1/auth/otp/send`

Send OTP to phone number via Twilio/MSG91.

**Body:**
```json
{
  "phone": "+919876543210"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "OTP sent",
    "expiresIn": 300
  }
}
```

---

### `POST /api/v1/auth/otp/verify`

Verify phone OTP and authenticate.

**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "role": "RENTER"
}
```

> `role` is only required on first login (account creation). Ignored if user exists.

**Response:** `200 OK` — Same as login response.

---

### `POST /api/v1/auth/refresh`

Refresh access token.

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### `POST /api/v1/auth/verify-email`

Verify email address.

**Query:** `?token=verification-token-uuid`

**Response:** `200 OK` — `{ "success": true, "data": { "message": "Email verified" } }`

---

### `POST /api/v1/auth/forgot-password`

Request password reset email.

**Body:** `{ "email": "user@example.com" }`

**Response:** `200 OK` — `{ "success": true, "data": { "message": "Reset email sent" } }`

---

### `POST /api/v1/auth/reset-password`

Reset password with token.

**Body:**
```json
{
  "token": "reset-token-uuid",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK` — `{ "success": true, "data": { "message": "Password reset successful" } }`

---

### `POST /api/v1/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK` — Invalidates refresh token.

---

## 3. User Endpoints

### `GET /api/v1/users/me`

Get current user profile. **Auth required.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "OWNER",
    "isEmailVerified": true,
    "profile": {
      "fullName": "John Doe",
      "phone": "+919876543210",
      "avatarUrl": "https://res.cloudinary.com/...",
      "bio": "...",
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "subscription": {
      "plan": "Basic",
      "status": "ACTIVE",
      "currentPeriodEnd": "2026-05-01T00:00:00Z",
      "limits": {
        "maxListings": 15,
        "usedListings": 8,
        "maxReveals": 30,
        "usedReveals": 12
      }
    }
  }
}
```

---

### `PATCH /api/v1/users/me`

Update profile. **Auth required.**

**Body (multipart/form-data):**
```
fullName: "John Doe"
phone: "+919876543210"
bio: "Experienced landlord"
city: "Mumbai"
state: "Maharashtra"
avatar: [file]
```

**Response:** `200 OK` — Updated user object.

---

## 4. Category Endpoints

### `GET /api/v1/categories`

List all active categories. **Public.**

**Query:** `?includeChildren=true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Homes",
      "slug": "homes",
      "icon": "home",
      "description": "Residential homes for rent",
      "listingCount": 45,
      "children": [
        { "id": "uuid", "name": "Villas", "slug": "villas", ... }
      ]
    },
    ...
  ]
}
```

---

### `POST /api/v1/categories` — **Admin only**

### `PATCH /api/v1/categories/:id` — **Admin only**

### `DELETE /api/v1/categories/:id` — **Admin only**

---

## 5. Listing Endpoints

### `POST /api/v1/listings`

Create a new listing. **Owner only.** Checks plan listing limit.

**Body (multipart/form-data):**
```
title: "2 BHK Apartment in Andheri West"
description: "Fully furnished 2 BHK..."
categoryId: "uuid"
price: 25000
rentPeriod: "MONTHLY"
address: "123, ABC Road, Andheri West"
city: "Mumbai"
state: "Maharashtra"
latitude: 19.1364
longitude: 72.8296
images: [file1, file2, file3]  (up to 10)
amenities: [{"key": "bhk", "value": "2"}, {"key": "furnished", "value": "yes"}]
status: "PENDING_APPROVAL"
```

**Response:** `201 Created` — Created listing object.

---

### `GET /api/v1/listings`

Search/browse listings. **Public.**

**Query Parameters:**
```
?q=apartment                    # Full-text search
&categoryId=uuid                # Filter by category
&city=Mumbai                    # Filter by city
&minPrice=10000                 # Min price
&maxPrice=50000                 # Max price
&rentPeriod=MONTHLY             # Filter by rent period
&sort=newest|price_asc|price_desc|nearest
&latitude=19.1364               # For nearest sort
&longitude=72.8296              # For nearest sort
&cursor=eyJ...                  # Pagination cursor
&limit=20                       # Items per page (max 50)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2 BHK Apartment in Andheri West",
      "price": 25000,
      "rentPeriod": "MONTHLY",
      "city": "Mumbai",
      "state": "Maharashtra",
      "category": { "id": "uuid", "name": "Homes", "slug": "homes" },
      "images": [{ "url": "https://res.cloudinary.com/...", "sortOrder": 0 }],
      "owner": { "id": "uuid", "fullName": "John Doe", "avatarUrl": "..." },
      "isSaved": false,
      "isFeatured": false,
      "createdAt": "2026-03-28T10:00:00Z"
    },
    ...
  ],
  "meta": {
    "cursor": "eyJ...",
    "hasMore": true,
    "total": 150
  }
}
```

---

### `GET /api/v1/listings/:id`

Get listing details. **Public.**

**Response:** Full listing object with:
- All fields
- All images
- All amenities
- Owner info (name, avatar, member since — **phone hidden**)
- `isRevealed: true/false` (if user is authenticated and has revealed this listing)
- `isSaved: true/false`
- Category info
- Map data (latitude, longitude)

---

### `PATCH /api/v1/listings/:id`

Update listing. **Owner only** (must own the listing).

---

### `DELETE /api/v1/listings/:id`

Delete listing. **Owner only** (must own the listing).

---

### `PATCH /api/v1/listings/:id/status`

Change listing status (deactivate/reactivate). **Owner only.**

**Body:** `{ "status": "INACTIVE" }`

---

### `GET /api/v1/listings/my`

Get current owner's listings. **Owner only.**

**Query:** `?status=ACTIVE|PENDING_APPROVAL|DRAFT|INACTIVE|REJECTED`

---

### `POST /api/v1/listings/:id/save`

Save (favorite) a listing. **Auth required.**

---

### `DELETE /api/v1/listings/:id/save`

Unsave a listing. **Auth required.**

---

### `GET /api/v1/listings/saved`

Get saved listings. **Auth required.**

---

## 6. Chat Endpoints

### `POST /api/v1/conversations`

Create or get existing conversation. **Renter only.**

**Body:**
```json
{
  "listingId": "uuid"
}
```

**Response:** `200 OK` or `201 Created` — Conversation object.

---

### `GET /api/v1/conversations`

Get user's conversations. **Auth required.**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "listing": { "id": "uuid", "title": "2 BHK...", "images": [...] },
      "otherUser": { "id": "uuid", "fullName": "...", "avatarUrl": "..." },
      "lastMessage": { "content": "Is this still available?", "createdAt": "..." },
      "unreadCount": 2,
      "lastMessageAt": "2026-03-28T10:00:00Z"
    },
    ...
  ]
}
```

---

### `GET /api/v1/conversations/:id/messages`

Get messages in a conversation. **Auth required** (must be participant).

**Query:** `?cursor=eyJ...&limit=50`

**Response:** Paginated messages (newest last).

---

### `POST /api/v1/conversations/:id/messages`

Send a message (HTTP fallback, primary is Socket.io). **Auth required.**

**Body:**
```json
{
  "content": "Is this still available?",
  "messageType": "TEXT"
}
```

---

### Socket.io Events

**Connection:** `wss://api.rentage.in/socket.io?token=<accessToken>`

| Event | Direction | Payload |
|---|---|---|
| `join_conversation` | C → S | `{ conversationId }` |
| `leave_conversation` | C → S | `{ conversationId }` |
| `send_message` | C → S | `{ conversationId, content, messageType, imageUrl? }` |
| `new_message` | S → C | `{ message }` |
| `typing_start` | C → S | `{ conversationId }` |
| `typing_stop` | C → S | `{ conversationId }` |
| `user_typing` | S → C | `{ conversationId, userId }` |
| `mark_read` | C → S | `{ conversationId }` |
| `messages_read` | S → C | `{ conversationId, readBy, readAt }` |
| `user_online` | S → C | `{ userId }` |
| `user_offline` | S → C | `{ userId }` |

---

## 7. Contact Reveal Endpoints

### `POST /api/v1/listings/:id/reveal`

Reveal owner's phone number. **Auth required.** Deducts 1 reveal credit.

**Response:**
```json
{
  "success": true,
  "data": {
    "phone": "+919876543210",
    "remainingReveals": 4
  }
}
```

**Error (limit reached):**
```json
{
  "success": false,
  "error": {
    "code": "REVEAL_LIMIT_REACHED",
    "message": "You've used all 5 contact reveals this month. Upgrade to Basic for 30 reveals.",
    "statusCode": 403,
    "details": {
      "currentPlan": "Free",
      "usedReveals": 5,
      "maxReveals": 5,
      "upgradeUrl": "/pricing"
    }
  }
}
```

---

### `GET /api/v1/reveals/usage`

Get current month's reveal usage. **Auth required.**

**Response:**
```json
{
  "success": true,
  "data": {
    "used": 3,
    "max": 5,
    "remaining": 2,
    "resetsAt": "2026-05-01T00:00:00Z"
  }
}
```

---

## 8. Subscription Endpoints

### `GET /api/v1/plans`

List all active subscription plans. **Public.**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Free",
      "slug": "free",
      "price": 0,
      "currency": "INR",
      "interval": "monthly",
      "maxListings": 3,
      "maxContactReveals": 5,
      "features": { "support": "community", "featuredBadge": false }
    },
    {
      "id": "uuid",
      "name": "Basic",
      "slug": "basic",
      "price": 199,
      "currency": "INR",
      "interval": "monthly",
      "maxListings": 15,
      "maxContactReveals": 30,
      "features": { "support": "priority", "featuredBadge": false }
    },
    {
      "id": "uuid",
      "name": "Pro",
      "slug": "pro",
      "price": 499,
      "currency": "INR",
      "interval": "monthly",
      "maxListings": -1,
      "maxContactReveals": -1,
      "features": { "support": "priority", "featuredBadge": true }
    }
  ]
}
```

---

### `POST /api/v1/subscriptions`

Create a new subscription (subscribe to a plan). **Auth required.**

**Body:**
```json
{
  "planId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "uuid",
    "razorpaySubscriptionId": "sub_xxxxx",
    "shortUrl": "https://rzp.io/i/xxxxx"
  }
}
```

---

### `GET /api/v1/subscriptions/current`

Get current subscription details. **Auth required.**

---

### `POST /api/v1/subscriptions/cancel`

Cancel current subscription (at period end). **Auth required.**

---

### `GET /api/v1/payments`

Get payment history. **Auth required.**

**Query:** `?cursor=eyJ...&limit=20`

---

### `POST /api/v1/webhooks/razorpay`

Razorpay webhook handler. **No auth** (verified by signature).

**Headers:** `X-Razorpay-Signature: <signature>`

**Handled events:**
- `payment.captured` → record payment
- `subscription.charged` → renew subscription period
- `subscription.cancelled` → mark subscription cancelled
- `subscription.completed` → mark subscription expired

---

## 9. Notification Endpoints

### `GET /api/v1/notifications`

Get notifications. **Auth required.**

**Query:** `?cursor=eyJ...&limit=20&unreadOnly=true`

---

### `GET /api/v1/notifications/unread-count`

Get unread notification count. **Auth required.**

**Response:** `{ "success": true, "data": { "count": 5 } }`

---

### `PATCH /api/v1/notifications/:id/read`

Mark notification as read. **Auth required.**

---

### `PATCH /api/v1/notifications/read-all`

Mark all notifications as read. **Auth required.**

---

## 10. Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` with `role: ADMIN`.

**Prefix:** `/api/v1/admin/`

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | Dashboard statistics (users, listings, revenue, signups) |
| GET | `/admin/charts/users` | User signup chart data (by day/week/month) |
| GET | `/admin/charts/revenue` | Revenue chart data (by month) |

### User Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List users (search, filter by role/status, paginate) |
| GET | `/admin/users/:id` | Get user detail |
| PATCH | `/admin/users/:id` | Update user (activate/deactivate) |

### Listing Moderation

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/listings` | List listings (filter by status, paginate) |
| GET | `/admin/listings/pending` | Pending approval queue |
| PATCH | `/admin/listings/:id/approve` | Approve listing |
| PATCH | `/admin/listings/:id/reject` | Reject listing (with reason) |
| PATCH | `/admin/listings/:id/feature` | Toggle featured status |
| DELETE | `/admin/listings/:id` | Remove listing |

### Category Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete category |
| PATCH | `/admin/categories/reorder` | Reorder categories |

### Plan Configuration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/plans` | List all plans (including inactive) |
| POST | `/admin/plans` | Create plan (syncs to Razorpay) |
| PATCH | `/admin/plans/:id` | Update plan |
| DELETE | `/admin/plans/:id` | Deactivate plan |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/reports` | List reports (filter by status) |
| PATCH | `/admin/reports/:id/resolve` | Resolve report (with admin notes) |
| PATCH | `/admin/reports/:id/dismiss` | Dismiss report |

### Audit Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/logs` | List audit logs (filter by admin, action, entity, date) |

---

## 11. Health Check

### `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-01T12:00:00Z",
  "uptime": 86400,
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 12. Rate Limits

| Endpoint Group | Limit |
|---|---|
| Auth endpoints (`/auth/*`) | 5 requests / 15 min / IP |
| Public endpoints | 60 requests / min / IP |
| Authenticated endpoints | 100 requests / min / user |
| File uploads | 10 requests / min / user |
| Webhooks | No limit (verified by signature) |
