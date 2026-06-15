'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { getCurrentPosition } from '@/lib/location';

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  rentPeriod: string;
  securityDeposit: number | null;
  address: string | null;
  city: string;
  state: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  images: { id: string; url: string; sortOrder: number }[];
  amenities: { id: string; key: string; value: string }[];
  category: { id: string; name: string; slug: string };
  owner: { id: string; profile: { fullName: string; avatarUrl: string | null; city: string | null } };
}

interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
}

const AMENITY_ICONS: Record<string, string> = {
  'Bedrooms': 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  'Bathrooms': 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  'Area (sq.ft)': 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
  'Furnishing': 'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819',
  'Floor': 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  'Parking': 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.375m-17.25 0V6.375c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v11.25',
  'Brand': 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
  'Fuel Type': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z',
  'Seats': 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  'Capacity': 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375',
  'Transmission': 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m0 0l4.5-7.795',
  'Year': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  'Occupancy': 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  'WiFi': 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
  'Meals': 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .37m12 .001l.264.096A48.108 48.108 0 0121 16.5',
  'Energy Rating': 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  'Technology': 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5',
  'Engine': 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.657m5.014-.134a4.985 4.985 0 00-3.124-1.738 4.929 4.929 0 00-5.26 1.738M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Mileage': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  'Color': 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197',
  'Weight': 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
};

const DEFAULT_AMENITY_ICON = 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';

const PERIOD_LABELS: Record<string, string> = {
  HOURLY: 'hour', DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year',
};

const formatCurrency = (value: number | string | null | undefined) => Number(value || 0).toLocaleString('en-IN');

const getPrimaryFacts = (listing: ListingDetail) => {
  const preferredKeys = ['Bedrooms', 'Bathrooms', 'Area (sq.ft)', 'Brand', 'Fuel Type', 'Engine (CC)', 'Capacity', 'Occupancy'];
  const facts = preferredKeys
    .map((key) => listing.amenities?.find((amenity) => amenity.key === key))
    .filter(Boolean) as ListingDetail['amenities'];

  return facts.slice(0, 4);
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ListingLocationMap = dynamic(() => import('@/components/ListingLocationMap'), {
  ssr: false,
});

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
  const [copied, setCopied] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ fullName: string; phone: string | null; email: string | null } | null>(null);
  const [revealingContact, setRevealingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const [checkingRevealStatus, setCheckingRevealStatus] = useState(true);
  const [usage, setUsage] = useState<any>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryBudgetMin, setInquiryBudgetMin] = useState('');
  const [inquiryBudgetMax, setInquiryBudgetMax] = useState('');
  const [inquiryPreferredAt, setInquiryPreferredAt] = useState('');
  const [openingDirections, setOpeningDirections] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/listings/${id}`)
        .then(({ data }) => {
          const l = data.data || data;
          setListing(l);
          setSimilarListings([]);
          setNearbyListings([]);
          setCategorySuggestions([]);
          if (l.category?.id) {
            api.get(`/listings/search?categoryId=${l.category.id}&nearListingId=${l.id}&excludeId=${l.id}&limit=10`).then(({ data: simData }) => {
              const items = (simData.data?.items || simData.items || []).filter((s: any) => s.id !== l.id);
              setSimilarListings(items.slice(0, 8));
            }).catch(() => {});
          }
          if (l.city) {
            api.get(`/listings/search?city=${encodeURIComponent(l.city)}&excludeId=${l.id}&limit=10`).then(({ data: cityData }) => {
              const items = (cityData.data?.items || cityData.items || []).filter((s: any) => s.id !== l.id && s.category?.id !== l.category?.id);
              setNearbyListings(items.slice(0, 4));
            }).catch(() => {});
          }
          api.get('/categories').then(({ data: catData }) => {
            const categories = Array.isArray(catData.data) ? catData.data : Array.isArray(catData) ? catData : [];
            setCategorySuggestions(categories.filter((cat: CategorySuggestion) => cat.slug !== l.category?.slug).slice(0, 8));
          }).catch(() => {});
        })
        .catch(() => setListing(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && id) {
      api.get('/listings/user/saved').then(({ data }) => {
        const saved = data.data || data || [];
        setIsSaved(saved.some((s: any) => s.id === id));
      }).catch(() => {});
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/subscriptions/usage').then(({ data }) => {
      setUsage(data || null);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setCheckingRevealStatus(false);
      return;
    }
    setCheckingRevealStatus(true);
    api
      .get(`/listings/${id}/reveal-status`)
      .then(({ data }) => {
        setIsPhoneRevealed(data?.isRevealed || false);
      })
      .catch(() => {})
      .finally(() => setCheckingRevealStatus(false));
  }, [isAuthenticated, id]);

  const handleSave = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setSaving(true);
    try {
      if (isSaved) { await api.delete(`/listings/${id}/save`); setIsSaved(false); }
      else { await api.post(`/listings/${id}/save`); setIsSaved(true); }
    } catch {} finally { setSaving(false); }
  };

  const handleContact = () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    router.push(`/chat?listingId=${id}`);
  };

  const handleRevealContact = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (contactInfo) {
      // Already revealed, just return
      return;
    }

    setRevealingContact(true);
    setContactError('');
    try {
      const { data } = await api.post(`/listings/${id}/reveal-contact`);
      setContactInfo(data?.owner || null);
      setIsPhoneRevealed(true);
    } catch (err: any) {
      setContactError(err.response?.data?.message || 'Unable to reveal contact right now');
    } finally {
      setRevealingContact(false);
    }
  };

  const handleCreateInquiry = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!listing?.id) {
      return;
    }

    setInquirySubmitting(true);
    setInquiryError('');

    try {
      const payload: any = {
        listingId: listing.id,
        source: 'listing_page',
      };

      if (inquiryMessage.trim()) payload.message = inquiryMessage.trim();
      if (inquiryBudgetMin.trim()) payload.budgetMin = Number(inquiryBudgetMin);
      if (inquiryBudgetMax.trim()) payload.budgetMax = Number(inquiryBudgetMax);
      if (inquiryPreferredAt.trim()) payload.preferredAt = new Date(inquiryPreferredAt).toISOString();

      const { data } = await api.post('/inquiries', payload);
      const inquiry = data || null;

      setInquiryOpen(false);
      setInquiryMessage('');
      setInquiryBudgetMin('');
      setInquiryBudgetMax('');
      setInquiryPreferredAt('');

      if (inquiry?.id) {
        router.push(`/inquiries/${inquiry.id}`);
      } else {
        router.push('/inquiries');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Unable to create inquiry right now';
      if (typeof message === 'string' && message.toLowerCase().includes('inquiry limit reached')) {
        setInquiryError(`${message} Upgrade your plan to continue.`);
      } else {
        setInquiryError(message);
      }
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleShare = async () => {
    const browser = globalThis as any;
    const url = browser?.location?.href || '';
    if (browser?.navigator?.share) {
      browser.navigator.share({ title: listing?.title, url });
    } else {
      await browser?.navigator?.clipboard?.writeText?.(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGetDirections = async () => {
    if (!listing?.latitude || !listing?.longitude) return;

    const destination = `${listing.latitude},${listing.longitude}`;
    setOpeningDirections(true);

    try {
      const { latitude, longitude } = await getCurrentPosition();
      const origin = `${latitude},${longitude}`;
      globalThis.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch {
      globalThis.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`,
        '_blank',
        'noopener,noreferrer',
      );
    } finally {
      setOpeningDirections(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="skeleton mb-4 h-4 w-64" />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="skeleton aspect-[16/10] rounded-2xl" />
              <div className="mt-3 flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-20 rounded-xl" />)}</div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="skeleton h-48 rounded-2xl" />
              <div className="skeleton h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-100 text-5xl">🔍</div>
          <h2 className="mt-6 text-xl font-bold text-slate-900">Listing not found</h2>
          <p className="mt-2 text-sm text-surface-400">This listing may have been removed or doesn&apos;t exist.</p>
          <Link href="/listings" className="btn-primary mt-6">Browse Listings</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner?.id;
  const primaryFacts = getPrimaryFacts(listing);
  const periodLabel = PERIOD_LABELS[listing.rentPeriod] || listing.rentPeriod.toLowerCase();

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50">
      <Header />

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-surface-400">
          <Link href="/" className="shrink-0 transition-colors hover:text-slate-700">Home</Link>
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <Link href="/listings" className="shrink-0 transition-colors hover:text-slate-700">Listings</Link>
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <Link href={`/listings?category=${listing.category?.slug}`} className="shrink-0 transition-colors hover:text-slate-700">
            {listing.category?.name}
          </Link>
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span className="min-w-0 truncate text-slate-600">{listing.title}</span>
        </nav>

        <section className="mt-4 overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-sm">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/listings?category=${listing.category?.slug}`} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100">
                  {listing.category?.name}
                </Link>
                {listing.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Featured pick</span>}
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Available now</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-500">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  {listing.city}, {listing.state}
                </span>
                <span>Listed {timeAgo(listing.createdAt)}</span>
                <span>{listing.images.length} photo{listing.images.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">Rent starts at</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-4xl font-black">₹{formatCurrency(listing.price)}</p>
                <p className="pb-1 text-sm text-slate-300">/ {periodLabel}</p>
              </div>
              {listing.securityDeposit && <p className="mt-2 text-sm text-slate-300">Security deposit ₹{formatCurrency(listing.securityDeposit)}</p>}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7">
          {/* LEFT: Gallery + Details */}
          <div className="min-w-0 space-y-5">
            {/* Image Gallery */}
            <div>
              {listing.images.length > 0 ? (
                <div className="space-y-3">
                  <div
                    className="group relative h-[260px] cursor-pointer overflow-hidden rounded-[28px] bg-surface-100 sm:h-[430px] lg:h-[520px]"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={listing.images[selectedImage]?.url}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      {selectedImage + 1} / {listing.images.length}
                    </div>
                    {listing.isFeatured && (
                      <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        Featured
                      </div>
                    )}
                    {listing.images.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p === 0 ? listing.images.length - 1 : p - 1)); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white">
                          <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p === listing.images.length - 1 ? 0 : p + 1)); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white">
                          <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                  {listing.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {listing.images.map((img, i) => (
                        <button key={img.id} onClick={() => setSelectedImage(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-200 ${i === selectedImage ? 'ring-2 ring-primary-500 ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl bg-surface-100">
                  <div className="text-center text-surface-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-200 text-3xl">📷</div>
                    <p className="mt-3 text-sm">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {(primaryFacts.length > 0 || listing.address) && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {primaryFacts.map((fact) => (
                  <div key={fact.id} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">{fact.key}</p>
                    <p className="mt-1 truncate text-lg font-bold text-slate-950">{fact.value}</p>
                  </div>
                ))}
                {listing.address && primaryFacts.length < 4 && (
                  <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">Area</p>
                    <p className="mt-1 truncate text-lg font-bold text-slate-950">{listing.address}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Verified owner flow', 'Use inquiry, chat, booking, and phone reveal without leaving Rentage.'],
                ['Location-aware picks', 'Recommendations below prioritize this category and nearby listings.'],
                ['Plan limits protected', 'Owner listing visibility still respects active subscription rules.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-surface-500">{body}</p>
                </div>
              ))}
            </div>

            {/* Amenities / Specifications */}
            {listing.amenities?.length > 0 && (
              <div className="card p-4 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                  {listing.category?.slug && ['homes', 'flats', 'pgs'].includes(listing.category.slug) ? 'Property Details' : listing.category?.slug && ['cars', 'bikes'].includes(listing.category.slug) ? 'Vehicle Specifications' : 'Details & Specifications'}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {listing.amenities.map((a) => {
                    const iconPath = AMENITY_ICONS[a.key] || DEFAULT_AMENITY_ICON;
                    return (
                      <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface-50 px-4 py-3 transition-colors hover:bg-surface-100">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                          <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath} /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-surface-400">{a.key}</p>
                          <p className="text-sm font-semibold text-slate-900">{a.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                Description
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-surface-500">{listing.description}</p>
            </div>

            {/* Location */}
            <div className="card overflow-hidden p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Location
              </h2>

              {typeof listing.latitude === 'number' && typeof listing.longitude === 'number' && (
                <div className="mt-4 overflow-hidden rounded-xl border border-surface-200">
                  <ListingLocationMap
                    latitude={listing.latitude}
                    longitude={listing.longitude}
                    markerLabel={listing.title}
                    className="h-64 w-full"
                  />
                </div>
              )}

              <div className="mt-4 space-y-2 text-sm text-surface-500">
                {listing.address && <p className="font-medium text-slate-700">{listing.address}</p>}
                <p>{listing.city}, {listing.state}{listing.pincode ? ` - ${listing.pincode}` : ''}</p>
              </div>
              {listing.latitude && listing.longitude && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleGetDirections}
                    disabled={openingDirections}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25l10.5-16.5-16.5 10.5 6.75 1.5 1.5 6.75z" /></svg>
                    {openingDirections ? 'Opening...' : 'Get Directions'}
                  </button>
                  <a href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-surface-300">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Listed {timeAgo(listing.createdAt)}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="min-w-0">
            <div className="sticky top-20 space-y-4">
              <div className="card p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-300">Listing snapshot</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-xs text-surface-400">Category</p>
                    <p className="mt-1 font-bold text-slate-900">{listing.category?.name}</p>
                  </div>
                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-xs text-surface-400">Status</p>
                    <p className="mt-1 font-bold text-green-700">Available</p>
                  </div>
                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-xs text-surface-400">City</p>
                    <p className="mt-1 font-bold text-slate-900">{listing.city}</p>
                  </div>
                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-xs text-surface-400">Listed</p>
                    <p className="mt-1 font-bold text-slate-900">{timeAgo(listing.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Price Card */}
              <div className="card overflow-hidden border-primary-100 shadow-lg shadow-primary-100/40">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-primary-800 px-4 py-5 sm:px-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Ready to rent</p>
                  <p className="mt-2 text-3xl font-black">₹{formatCurrency(listing.price)}</p>
                  <p className="mt-1 text-sm text-primary-100">per {periodLabel}</p>
                  {listing.securityDeposit && (
                    <p className="mt-2 text-xs text-primary-200">Security deposit: ₹{formatCurrency(listing.securityDeposit)}</p>
                  )}
                </div>
                {!isOwner && (
                  <div className="space-y-2.5 p-3 sm:p-5">
                    <button onClick={() => setInquiryOpen(true)} className="btn-secondary w-full py-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h5.25m-7.5 9l-1.286-3.857A2.25 2.25 0 015.478 13.5H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v8.25c0 .966.784 1.75 1.75 1.75h.75l1.25 3.75z" /></svg>
                      Send Inquiry
                    </button>
                    <Link href={`/bookings/new?listingId=${listing.id}`} className="btn-primary w-full py-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V5.25z" /></svg>
                      Book Now
                    </Link>
                    <button onClick={handleContact} className="btn-primary w-full py-3">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                      Chat with Owner
                    </button>
                    <button onClick={handleSave} disabled={saving} className={`w-full py-3 ${isSaved ? 'btn-primary bg-red-500 hover:bg-red-600' : 'btn-secondary'}`}>
                      <svg className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      {isSaved ? 'Saved' : 'Save Listing'}
                    </button>
                  </div>
                )}
                {isOwner && (
                  <div className="p-5">
                    <Link href={`/edit-listing/${listing.id}`} className="btn-secondary w-full py-3">Edit Listing</Link>
                  </div>
                )}
              </div>

              {/* Owner Card */}
              <div className="card p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-300">Listed by</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-sm">
                    {listing.owner?.profile?.fullName?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{listing.owner?.profile?.fullName || 'Owner'}</p>
                    {listing.owner?.profile?.city && (
                      <p className="flex items-center gap-1 text-xs text-surface-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        {listing.owner.profile.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-surface-50 px-4 py-2.5 text-center">
                  <p className="text-xs text-surface-400">Member since {new Date(listing.createdAt).getFullYear()}</p>
                </div>

                {!isOwner && (
                  <div className="mt-4 space-y-3">
                    {contactInfo ? (
                      <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">Contact Details</p>
                          {contactInfo.phone && <p className="text-surface-500">Phone: {contactInfo.phone}</p>}
                          {contactInfo.email && <p className="text-surface-500">Email: {contactInfo.email}</p>}
                        </div>
                      </div>
                    ) : isPhoneRevealed ? (
                      <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm">
                        <div className="space-y-2">
                          <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                            Phone Revealed
                          </p>
                          <p className="text-xs text-surface-400">Tap reveal button to load phone details</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm">
                        <p className="text-surface-400 mb-2">Reveal contact to see owner phone and email.</p>
                      </div>
                    )}
                    <button
                      onClick={handleRevealContact}
                      disabled={revealingContact || checkingRevealStatus}
                      className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isPhoneRevealed
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {revealingContact || checkingRevealStatus ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                          Loading...
                        </>
                      ) : isPhoneRevealed ? (
                        <>
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.25 6.75c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75V4.5a.75.75 0 00-.75-.75H3a.75.75 0 00-.75.75v2.25z" /><path d="M2.25 9h19.5a.75.75 0 00-.75.75v9a.75.75 0 00.75.75H2.25a.75.75 0 00-.75-.75v-9a.75.75 0 00.75-.75zm1.5.75a.75.75 0 001.5 0v-2.25a.25.25 0 01.25-.25h12a.25.25 0 01.25.25v2.25a.75.75 0 001.5 0V6a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v3.75z" /></svg>
                          View Phone
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Reveal Phone
                        </>
                      )}
                    </button>
                    {contactError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {contactError}
                        {contactError.toLowerCase().includes('limit reached') && (
                          <Link href="/subscription" className="ml-1 font-semibold text-red-700 hover:text-red-800 underline">
                            Upgrade
                          </Link>
                        )}
                      </div>
                    )}

                    {usage && (
                      <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-500">
                        <p>
                          Contact reveals: {usage?.usage?.contactReveals?.used || 0}/
                          {usage?.usage?.contactReveals?.limit && usage?.usage?.contactReveals?.limit > 0
                            ? usage.usage.contactReveals.limit
                            : '∞'}
                        </p>
                        <p>
                          Inquiries this month: {usage?.usage?.inquiriesThisMonth?.used || 0}/
                          {usage?.usage?.inquiriesThisMonth?.limit && usage?.usage?.inquiriesThisMonth?.limit > 0
                            ? usage.usage.inquiriesThisMonth.limit
                            : '∞'}
                        </p>
                        {usage?.usage?.inquiriesThisMonth?.limit && usage?.usage?.inquiriesThisMonth?.limit > 0 && (
                          <Link href="/subscription" className="mt-1 inline-block font-semibold text-primary-600 hover:text-primary-700">
                            Upgrade plan for higher limits
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Share & Actions */}
              <div className="flex gap-2">
                <button onClick={handleShare} className="btn-secondary flex-1 py-2.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <Link href={`/listings?category=${listing.category?.slug}`} className="btn-secondary flex-1 py-2.5">
                  More in {listing.category?.name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <section className="mt-10 rounded-[28px] border border-surface-200 bg-white p-4 shadow-sm sm:mt-16 sm:p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-500">Recommended for you</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Similar {listing.category?.name?.toLowerCase()} nearby</h2>
                <p className="mt-1 text-sm text-surface-500">Based on this listing&apos;s category and location.</p>
              </div>
              <Link href={`/listings?category=${listing.category?.slug}`} className="btn-secondary hidden sm:inline-flex">
                View All
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarListings.map((sl: any) => (
                <ListingCard
                  key={sl.id}
                  id={sl.id}
                  title={sl.title}
                  price={sl.price}
                  rentPeriod={sl.rentPeriod}
                  city={sl.city}
                  state={sl.state}
                  images={sl.images}
                  imageUrl={sl.images?.[0]?.url}
                  categoryName={sl.category?.name}
                  categorySlug={sl.category?.slug}
                  ownerName={sl.owner?.profile?.fullName}
                  isFeatured={sl.isFeatured}
                  createdAt={sl.createdAt}
                  amenities={sl.amenities}
                />
              ))}
            </div>
          </section>
        )}

        {nearbyListings.length > 0 && (
          <section className="mt-8 rounded-[28px] border border-surface-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-500">Around {listing.city}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">More rentals near this location</h2>
                <p className="mt-1 text-sm text-surface-500">Compare nearby options across categories before you book.</p>
              </div>
              <Link href={`/listings?city=${encodeURIComponent(listing.city)}`} className="btn-secondary self-start sm:self-auto">
                View {listing.city}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {nearbyListings.map((sl: any) => (
                <ListingCard
                  key={sl.id}
                  id={sl.id}
                  title={sl.title}
                  price={sl.price}
                  rentPeriod={sl.rentPeriod}
                  city={sl.city}
                  state={sl.state}
                  images={sl.images}
                  imageUrl={sl.images?.[0]?.url}
                  categoryName={sl.category?.name}
                  categorySlug={sl.category?.slug}
                  ownerName={sl.owner?.profile?.fullName}
                  isFeatured={sl.isFeatured}
                  createdAt={sl.createdAt}
                  amenities={sl.amenities}
                />
              ))}
            </div>
          </section>
        )}

        {categorySuggestions.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-surface-200 bg-slate-950 p-4 text-white shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-200">Explore more</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Other rental categories</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Jump to another department like an e-commerce catalog and compare options quickly.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categorySuggestions.map((category) => (
                  <Link
                    key={category.id}
                    href={`/listings?category=${category.slug}`}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300/40 hover:bg-white/10"
                  >
                    <p className="text-sm font-bold text-white">{category.name}</p>
                    <p className="mt-2 text-xs text-slate-400 group-hover:text-primary-100">Browse available rentals</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {inquiryOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 px-4" onClick={() => setInquiryOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Create Inquiry</h3>
            <p className="mt-1 text-sm text-slate-500">Send your requirement to the owner and track updates in timeline.</p>

            {inquiryError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {inquiryError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e: any) => setInquiryMessage(e.target.value)}
                  rows={4}
                  maxLength={3000}
                  placeholder="Tell the owner your intended dates, use-case, and questions"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget Min (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={inquiryBudgetMin}
                    onChange={(e: any) => setInquiryBudgetMin(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget Max (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={inquiryBudgetMax}
                    onChange={(e: any) => setInquiryBudgetMax(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Date/Time</label>
                <input
                  type="datetime-local"
                  value={inquiryPreferredAt}
                  onChange={(e: any) => setInquiryPreferredAt(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setInquiryOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleCreateInquiry}
                disabled={inquirySubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {inquirySubmitting ? 'Submitting...' : 'Send Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && listing.images.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxOpen(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" onClick={() => setLightboxOpen(false)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p === 0 ? listing.images.length - 1 : p - 1)); }} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <img src={listing.images[selectedImage]?.url} alt={listing.title} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setSelectedImage((p) => (p === listing.images.length - 1 ? 0 : p + 1)); }} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <p className="absolute bottom-4 text-sm text-white/60">{selectedImage + 1} / {listing.images.length}</p>
        </div>
      )}

      <Footer />
    </div>
  );
}
