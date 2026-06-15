const fs = require('fs');
const path = require('path');

// next.config.js is evaluated before Next.js loads .env files, so we parse
// .env.local manually to make ALLOWED_DEV_ORIGINS available at config time.
function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // .env.local is optional
  }
}
loadEnvLocal();

// The real API origin — used only server-side in the proxy rewrite.
// Never exposed to the browser bundle.
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostnames (no protocol, no port) that may load /_next/* assets during dev.
  // Set ALLOWED_DEV_ORIGINS=192.168.x.x (comma-separated) in apps/web/.env.local.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((o) => o.trim())
    : [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  env: {
    // Always a relative path — works from any origin (desktop, mobile, LAN).
    // Requests hit /api/proxy/* on the Next.js server which rewrites to the real API.
    NEXT_PUBLIC_API_URL: '/api/proxy/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        // /api/proxy/v1/listings → http://localhost:4000/api/v1/listings
        source: '/api/proxy/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
