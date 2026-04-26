import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'Rentage — Rent Anything, Anywhere',
  description:
    'Rental marketplace where you can rent homes, flats, cars, bikes, appliances, and more. List your assets or find rentals near you.',
  keywords: ['rent', 'rental', 'marketplace', 'homes', 'cars', 'bikes', 'appliances', 'India'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
