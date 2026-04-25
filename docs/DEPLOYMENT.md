# Rentage — Deployment Guide

## 1. Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Architecture                       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Vercel     │    │  VPS/Render  │    │  Hostinger   │       │
│  │  (Next.js)   │───▶│  (NestJS)    │───▶│  (MySQL 8)   │       │
│  │  Free Tier   │    │  API Server  │    │  Shared Host │       │
│  └──────────────┘    └──────┬───────┘    └──────────────┘       │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Cloudinary  │    │   Firebase   │    │   Razorpay   │       │
│  │  (Images)    │    │   (FCM)      │    │ (Payments)   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  Mobile:  Expo EAS → Play Store / App Store                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Hosting Breakdown

| Component | Host | Plan | Cost | Notes |
|---|---|---|---|---|
| **MySQL Database** | Hostinger Shared Hosting | Existing plan | Included | Remote connection must be enabled |
| **NestJS API** | **Option A:** Hostinger VPS | KVM 1 (1 vCPU, 4GB RAM) | ~₹259/mo | Recommended for production |
| | **Option B:** Render | Free tier | Free | 750 hours/mo, spins down on idle |
| | **Option C:** Railway | Hobby plan | ~$5/mo | Reliable, easy deploy |
| **Next.js Web** | Vercel | Hobby (free) | Free | Best Next.js host, global CDN |
| **Mobile App** | Expo EAS | Free tier | Free | Build & submit to stores |
| **Images** | Cloudinary | Free | Free | 25GB storage, 25GB bandwidth |
| **Push Notifications** | Firebase | Spark (free) | Free | FCM for push notifications only |
| **Payments** | Razorpay | Standard | 2% per txn | No monthly fee |

### Recommended Setup (Budget-Optimized)

**Minimal (Free):** Render (API) + Vercel (Web) + Hostinger MySQL = **₹0/mo** (cold starts on API)

**Production (Reliable):** Hostinger VPS (API) + Vercel (Web) + Hostinger MySQL = **~₹259/mo**

---

## 3. Environment Configuration

### 3.1 Environment Files

```
.env.development    # Local development
.env.staging        # Staging environment
.env.production     # Production (never committed)
.env.example        # Template (committed)
```

### 3.2 Required Environment Variables

```env
# ─── Database ───
DATABASE_URL=mysql://user:password@host:3306/rentage_db

# ─── JWT Secrets ───
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ─── Firebase (FCM only) ───
FIREBASE_PROJECT_ID=rentage-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rentage-xxxxx.iam.gserviceaccount.com

# ─── Google OAuth ───
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=https://api.rentage.in/api/v1/auth/google/callback

# ─── Phone OTP (Twilio or MSG91) ───
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx

# ─── Razorpay ───
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# ─── Cloudinary ───
CLOUDINARY_CLOUD_NAME=rentage
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# ─── Google Maps ───
GOOGLE_MAPS_API_KEY=AIza_xxxxx

# ─── App URLs ───
APP_URL=https://rentage.in
API_URL=https://api.rentage.in
ADMIN_URL=https://rentage.in/admin

# ─── General ───
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://rentage.in,https://www.rentage.in
```

---

## 4. NestJS API Deployment

### Option A: Hostinger VPS (Recommended)

#### Initial Server Setup

```bash
# SSH into VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

#### Deploy API

```bash
# Clone repo
git clone <repo-url> /var/www/rentage
cd /var/www/rentage

# Install dependencies
pnpm install --filter api... --frozen-lockfile

# Build
pnpm --filter api build

# Run migrations
cd apps/api
npx prisma migrate deploy

# Start with PM2
pm2 start dist/main.js --name rentage-api --env production
pm2 save
pm2 startup
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/api.rentage.in

server {
    server_name api.rentage.in;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and SSL
ln -s /etc/nginx/sites-available/api.rentage.in /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d api.rentage.in
```

### Option B: Render (Free Tier)

1. Connect GitHub repository to Render
2. Create **Web Service**:
   - **Root Directory:** `apps/api`
   - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter api build`
   - **Start Command:** `node dist/main.js`
   - **Environment:** Node 20
3. Add all environment variables in Render dashboard
4. Deploy — Render auto-deploys on `main` branch push

> **Warning:** Free tier spins down after 15 min of inactivity (30–60s cold start). Not ideal for WebSocket/chat.

### Option C: Railway

1. Connect GitHub repository
2. Add **Service** → point to `apps/api`
3. Configure:
   - **Build Command:** `pnpm install && pnpm --filter api build`
   - **Start Command:** `pnpm --filter api start:prod`
4. Add environment variables
5. Attach custom domain: `api.rentage.in`

---

## 5. Next.js Web Deployment (Vercel)

### Setup

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** (auto-detected) `next build`
   - **Output Directory:** (auto-detected) `.next`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.rentage.in
   NEXT_PUBLIC_APP_URL=https://rentage.in
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza_xxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   ```
4. Configure custom domain: `rentage.in` and `www.rentage.in`

### Vercel Configuration

```json
// apps/web/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=web",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

### Automatic Deployments

- **Production:** Auto-deploy on push to `main` branch
- **Preview:** Auto-deploy on pull request (unique preview URL)

---

## 6. Mobile App Deployment

### Expo EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure builds
cd apps/mobile
eas build:configure
```

### EAS Configuration

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "your-asc-app-id"
      }
    }
  }
}
```

### Build Commands

```bash
# Development build (for Expo Dev Client)
eas build --profile development --platform android

# Preview APK (for testing)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform android
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 7. Database Setup (Hostinger MySQL)

### Enable Remote Access

1. Login to Hostinger hPanel
2. Go to **Databases** → **Remote MySQL**
3. Add your VPS/server IP address to allowed list
4. Note connection details:
   - **Host:** your-hostinger-hostname
   - **Port:** 3306
   - **Database:** rentage_db
   - **Username:** rentage_user
   - **Password:** (set in hPanel)

### Connection String

```
DATABASE_URL=mysql://rentage_user:password@your-hostinger-hostname:3306/rentage_db
```

### Run Migrations

```bash
# From project root
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

---

## 8. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
```

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'packages/**'
      - 'prisma/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/rentage
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm --filter api build
            cd apps/api && npx prisma migrate deploy
            pm2 restart rentage-api
```

### Deploy Flow

```
Developer pushes to main
  → GitHub Actions: lint + test
  → If API changed: SSH deploy to VPS + PM2 restart
  → If Web changed: Vercel auto-deploy (webhook)
  → If Mobile changed: Manual EAS build trigger
```

---

## 9. Domain & DNS Setup

### DNS Records

| Type | Name | Value | TTL |
|---|---|---|---|
| A | rentage.in | Vercel IP (76.76.21.21) | 300 |
| CNAME | www | cname.vercel-dns.com | 300 |
| A | api | VPS IP address | 300 |

### SSL Certificates

- **Web (Vercel):** Automatic SSL provisioning
- **API (VPS):** Certbot with auto-renewal
  ```bash
  certbot --nginx -d api.rentage.in
  # Auto-renewal
  certbot renew --dry-run
  ```

---

## 10. Monitoring & Maintenance

### Health Checks

```bash
# API health check
curl https://api.rentage.in/api/health
# Expected: { "status": "ok", "db": "connected", "uptime": "..." }
```

### PM2 Monitoring (VPS)

```bash
pm2 status                  # Check process status
pm2 logs rentage-api        # View logs
pm2 monit                   # Real-time monitoring
pm2 restart rentage-api     # Restart
```

### Database Backups

```bash
# Manual backup
mysqldump -h hostname -u user -p rentage_db > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron on VPS)
# Add to crontab -e:
0 2 * * * mysqldump -h hostname -u user -ppassword rentage_db | gzip > /var/backups/rentage/backup_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
0 3 * * * find /var/backups/rentage -name "*.sql.gz" -mtime +30 -delete
```

### Uptime Monitoring

- Use [UptimeRobot](https://uptimerobot.com) (free tier: 50 monitors, 5 min intervals)
- Monitor:
  - `https://rentage.in` — web app
  - `https://api.rentage.in/api/health` — API

---

## 11. Production Checklist

### Before Launch

- [ ] Switch Razorpay from test mode to live mode
- [ ] Verify Razorpay webhook URL is registered for live mode
- [ ] Set strong JWT secrets (64+ random characters)
- [ ] Configure CORS to only allow production domains
- [ ] Enable Helmet.js security headers
- [ ] Enable rate limiting
- [ ] Test email sending (verification, password reset)
- [ ] Verify Firebase FCM is configured for push notifications
- [ ] Verify Google OAuth credentials are set for production redirect URI
- [ ] Verify Twilio/MSG91 is configured with production phone number
- [ ] Run `prisma migrate deploy` on production database
- [ ] Seed production data (admin user, categories, plans)
- [ ] Test full user flow end-to-end on production
- [ ] Set up database backup cron
- [ ] Set up uptime monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] SSL certificates active on all domains
- [ ] DNS propagation verified
- [ ] Google Maps API key restricted to production domains
- [ ] Cloudinary upload preset configured for production

### Post-Launch Monitoring

- [ ] Watch error logs for first 48 hours
- [ ] Monitor database performance (slow queries)
- [ ] Monitor API response times
- [ ] Verify Razorpay webhooks firing correctly
- [ ] Check push notification delivery
- [ ] Monitor Cloudinary usage (bandwidth, storage)
- [ ] Monitor Google Maps API usage and billing
