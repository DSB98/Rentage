# Rentage — Rental Marketplace Platform

> **Connect asset owners with renters. Anything can be rented.**

## Overview

Rentage is a full-featured rental marketplace platform where **owners** can list any rentable asset — homes, flats, PGs, cars, bikes, washing machines, water filters, electronics, furniture, and more — and **renters** can discover, search, and connect with owners to rent those assets.

The platform is **not a payment gateway for rent transactions**. Instead, it connects people and monetizes through **configurable subscription plans** (via Razorpay recurring billing). Owners and renters communicate via **real-time chat** and **phone contact reveals** (gated by subscription tier).

---

## Key Features

- **Multi-category asset listings** — homes, vehicles, appliances, electronics, furniture, and custom categories
- **Dual user roles** — Owner (lists assets) and Renter (discovers and contacts)
- **Real-time chat** — Socket.io powered messaging between owners and renters
- **Contact reveal system** — Phone numbers are hidden; reveals are quota-limited by subscription plan
- **Subscription-based monetization** — Admin-configurable plans (Free, Basic, Pro) via Razorpay
- **Admin panel** — Full dashboard with user management, listing moderation, category CRUD, plan configuration, and analytics
- **Location-based search** — Google Maps integration with autocomplete, geocoding, and map view
- **Cross-platform** — Web application (Next.js) + Mobile app (React Native / Expo) + Admin panel
- **Push notifications** — Firebase Cloud Messaging (FCM) for chat, listing approvals, subscription alerts
- **SEO optimized** — SSR, dynamic meta tags, structured data, sitemap

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm |
| Backend API | NestJS (TypeScript) |
| Web App | Next.js 14 (App Router) |
| Mobile App | React Native (Expo) |
| Admin Panel | Next.js (route group) |
| Database | MySQL 8 + Prisma ORM |
| Real-time | Socket.io |
| Auth | Custom JWT + Passport.js (Google OAuth) + Twilio/MSG91 (Phone OTP) |
| Payments | Razorpay Subscriptions API |
| File Storage | Cloudinary |
| Maps | Google Maps API |
| Push Notifications | Firebase Cloud Messaging |

---

## Documentation Index

| Document | Description |
|---|---|
| [Requirements](./REQUIREMENTS.md) | Detailed functional & non-functional requirements |
| [Architecture](./ARCHITECTURE.md) | Tech stack, monorepo structure, system design |
| [Database Schema](./DATABASE_SCHEMA.md) | Complete entity design with relationships |
| [Implementation Plan](./IMPLEMENTATION_PLAN.md) | Phased roadmap with weekly breakdown |
| [API Design](./API_DESIGN.md) | REST API endpoints and conventions |
| [Deployment](./DEPLOYMENT.md) | Hosting strategy, CI/CD, environment setup |

---

## Target Market

- **Geography:** India (INR currency, +91 phone, Razorpay)
- **Users:** Individual asset owners and renters
- **Categories:** Residential (homes, flats, PGs), Vehicles (cars, bikes), Appliances (washing machines, water filters), Electronics, Furniture, Tools, and more

---

## Monetization Model

Revenue comes **exclusively from subscription plans**, not per-transaction fees.

| Plan | Price | Listings | Contact Reveals/Month | Features |
|---|---|---|---|---|
| Free | ₹0 | 3 | 5 | Basic access |
| Basic | ₹199/mo | 15 | 30 | Priority support |
| Pro | ₹499/mo | Unlimited | Unlimited | Featured badge, priority listing |

> All plan parameters (name, price, limits, features) are admin-configurable.

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd Rentage

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Seed default data
pnpm prisma db seed

# Start all apps in development
pnpm dev
```

---

## License

Private — All rights reserved.
