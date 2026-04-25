import Link from 'next/link';

const categories = [
  { name: 'Homes', slug: 'homes', icon: '🏠' },
  { name: 'Flats', slug: 'flats', icon: '🏢' },
  { name: 'PGs', slug: 'pgs', icon: '🛏️' },
  { name: 'Cars', slug: 'cars', icon: '🚗' },
  { name: 'Bikes', slug: 'bikes', icon: '🏍️' },
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Furniture', slug: 'furniture', icon: '🪑' },
  { name: 'Appliances', slug: 'washing-machines', icon: '🫧' },
  { name: 'Others', slug: 'others', icon: '📦' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-surface-200/60 bg-slate-950 text-surface-400">
      {/* Subtle gradient glow */}
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                Rent<span className="text-primary-400">age</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-surface-400">
              India&apos;s premier marketplace for renting anything — homes, vehicles, appliances, electronics, and much more.
            </p>
            <div className="mt-6 flex gap-3">
              {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <button key={social} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-surface-400 transition-colors hover:bg-white/10 hover:text-white">
                  <span className="text-xs font-medium">{social[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-surface-300">Categories</h4>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 7).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/listings?category=${cat.slug}`} className="text-sm transition-colors hover:text-white">
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-surface-300">Quick Links</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/listings" className="text-sm transition-colors hover:text-white">Browse Listings</Link></li>
              <li><Link href="/register" className="text-sm transition-colors hover:text-white">Create Account</Link></li>
              <li><Link href="/pricing" className="text-sm transition-colors hover:text-white">Pricing Plans</Link></li>
              <li><Link href="/about" className="text-sm transition-colors hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-sm transition-colors hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-surface-300">Stay Connected</h4>
            <p className="mt-4 text-sm">Get updates on new listings and features.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-surface-400 transition-colors focus:border-primary-500 focus:outline-none"
              />
              <button className="shrink-0 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500">
                Join
              </button>
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <p>📧 support@rentage.in</p>
              <p>📞 +91 98765 43210</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-surface-400">&copy; {new Date().getFullYear()} Rentage. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-surface-400">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
