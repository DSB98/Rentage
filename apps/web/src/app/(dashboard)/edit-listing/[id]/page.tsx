'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import Header from '@/components/Header';
import { getCurrentPosition, reverseGeocode } from '@/lib/location';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AmenityRow {
  key: string;
  value: string;
}

interface ExistingImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface ListingFormData {
  title: string;
  description: string;
  categoryId: string;
  price: string;
  rentPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  securityDeposit: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  amenities: AmenityRow[];
}

const RENT_PERIODS = [
  { value: 'DAILY', label: 'Per Day' },
  { value: 'WEEKLY', label: 'Per Week' },
  { value: 'MONTHLY', label: 'Per Month' },
  { value: 'YEARLY', label: 'Per Year' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
];

const ListingLocationMap = dynamic(() => import('@/components/ListingLocationMap'), {
  ssr: false,
});

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const [form, setForm] = useState<ListingFormData>({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    rentPeriod: 'MONTHLY',
    securityDeposit: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    amenities: [{ key: '', value: '' }],
  });

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'OWNER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'))) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const cats = data.data || data;
      setCategories(Array.isArray(cats) ? cats : []);
    }).catch(() => {});
  }, []);

  // Fetch existing listing data and pre-fill form
  useEffect(() => {
    const listingId = params.id;
    if (!listingId || !isAuthenticated) return;

    setLoadingListing(true);
    api.get(`/listings/${listingId}`)
      .then(({ data }) => {
        const listing = data.data || data;

        const amenities = Array.isArray(listing.amenities) && listing.amenities.length > 0
          ? listing.amenities.map((a: any) => ({ key: a.key || a.label || '', value: a.value || '' }))
          : [{ key: '', value: '' }];

        setForm({
          title: listing.title || '',
          description: listing.description || '',
          categoryId: listing.categoryId || listing.category?.id || '',
          price: String(listing.price || ''),
          rentPeriod: listing.rentPeriod || 'MONTHLY',
          securityDeposit: listing.securityDeposit ? String(listing.securityDeposit) : '',
          address: listing.address || '',
          city: listing.city || '',
          state: listing.state || '',
          pincode: listing.pincode || '',
          latitude: listing.latitude ? String(listing.latitude) : '',
          longitude: listing.longitude ? String(listing.longitude) : '',
          amenities,
        });

        if (Array.isArray(listing.images)) {
          setExistingImages(listing.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            sortOrder: img.sortOrder ?? 0,
          })));
        }
      })
      .catch(() => setError('Failed to load listing. It may not exist or you may not have permission.'))
      .finally(() => setLoadingListing(false));
  }, [params.id, isAuthenticated]);

  const updateForm = (field: keyof ListingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addAmenity = () => {
    setForm((prev) => ({ ...prev, amenities: [...prev.amenities, { key: '', value: '' }] }));
  };

  const removeAmenity = (index: number) => {
    setForm((prev) => ({ ...prev, amenities: prev.amenities.filter((_, i) => i !== index) }));
  };

  const updateAmenity = (index: number, field: 'key' | 'value', value: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const applyCoordinates = useCallback(async (latitude: number, longitude: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));

    setResolvingAddress(true);
    const geo = await reverseGeocode(latitude, longitude);
    setResolvingAddress(false);

    if (!geo) return;

    setForm((prev) => ({
      ...prev,
      address: prev.address || geo.address || prev.address,
      city: prev.city || geo.city || prev.city,
      state: prev.state || geo.state || prev.state,
      pincode: prev.pincode || geo.pincode || prev.pincode,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setError('');
    setLocating(true);

    try {
      const { latitude, longitude } = await getCurrentPosition();
      await applyCoordinates(latitude, longitude);
    } catch (err: any) {
      setError(err?.message || 'Could not access your current location. Please allow location permission and try again.');
    } finally {
      setLocating(false);
    }
  }, [applyCoordinates]);

  const handleNewImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target as any).files || []) as File[];
    const total = existingImages.length - removedImageIds.length + newImages.length + files.length;
    if (total > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    const valid = files.filter((f: File) => f.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    setNewImages((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      const ReaderCtor = (globalThis as any)?.FileReader;
      if (!ReaderCtor) return;
      const reader = new ReaderCtor();
      reader.onload = (ev: any) => setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, [existingImages.length, removedImageIds.length, newImages.length]);

  const removeExistingImage = (id: string) => {
    setRemovedImageIds((prev) => [...prev, id]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1: return !!form.categoryId && !!form.title.trim() && !!form.description.trim();
      case 2: return !!form.price && parseFloat(form.price) > 0;
      case 3: return !!form.city.trim() && !!form.state && !!form.latitude && !!form.longitude;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const listingId = params.id;

    try {
      const amenities = form.amenities.filter((a) => a.key.trim() && a.value.trim());
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        price: parseFloat(form.price),
        rentPeriod: form.rentPeriod,
        securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : null,
        address: form.address.trim() || null,
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        amenities: amenities.length > 0 ? amenities : undefined,
      };

      await api.patch(`/listings/${listingId}`, payload);

      // Remove deleted images
      for (const imgId of removedImageIds) {
        try {
            await api.delete(`/listings/images/${imgId}`);
        } catch {
          // non-critical
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        const uploaded: { url: string; publicId: string; sortOrder: number }[] = [];
        const startOrder = existingImages.filter((img) => !removedImageIds.includes(img.id)).length;

        for (let i = 0; i < newImages.length; i++) {
          const formData = new FormData();
          formData.append('file', newImages[i]);
          try {
            const { data: uploadRes } = await api.post('/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadData = uploadRes.data || uploadRes;
            uploaded.push({ url: uploadData.url, publicId: uploadData.publicId, sortOrder: startOrder + i });
          } catch {
            // skip failed images
          }
        }

        if (uploaded.length > 0) {
          await api.post(`/listings/${listingId}/images`, { images: uploaded });
        }
      }

      router.push('/my-listings');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingListing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const totalSteps = 5;
  const visibleExisting = existingImages.filter((img) => !removedImageIds.includes(img.id));
  const totalImageCount = visibleExisting.length + newImages.length;
  const latNumber = form.latitude ? Number(form.latitude) : null;
  const lngNumber = form.longitude ? Number(form.longitude) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
            <p className="mt-1 text-sm text-gray-500">Update your listing details</p>
          </div>
          <Link href="/my-listings" className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
        </div>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  s < step ? 'bg-primary-600 text-white' : s === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && <div className={`h-0.5 flex-1 ${s < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Details</span><span>Pricing</span><span>Location</span><span>Images</span><span>Review</span>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select value={form.categoryId} onChange={(e: any) => updateForm('categoryId', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">Select a category</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input type="text" value={form.title} onChange={(e: any) => updateForm('title', e.target.value)} maxLength={200} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <p className="mt-1 text-xs text-gray-400">{form.title.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea value={form.description} onChange={(e: any) => updateForm('description', e.target.value)} maxLength={5000} rows={5} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <p className="mt-1 text-xs text-gray-400">{form.description.length}/5000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Details</label>
              <p className="text-xs text-gray-400">e.g., Bedrooms: 2, Fuel Type: Petrol, Brand: Samsung</p>
              <div className="mt-2 space-y-2">
                {form.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={amenity.key} onChange={(e: any) => updateAmenity(i, 'key', e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <input type="text" value={amenity.value} onChange={(e: any) => updateAmenity(i, 'value', e.target.value)} placeholder="Value" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    {form.amenities.length > 1 && (
                      <button type="button" onClick={() => removeAmenity(i)} className="rounded p-1 text-red-400 hover:bg-red-50">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addAmenity} className="text-sm font-medium text-primary-600 hover:text-primary-700">+ Add another detail</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Amount (₹) *</label>
                <input type="number" value={form.price} onChange={(e: any) => updateForm('price', e.target.value)} min="0" step="100" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Period *</label>
                <select value={form.rentPeriod} onChange={(e: any) => updateForm('rentPeriod', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                  {RENT_PERIODS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
              <input type="number" value={form.securityDeposit} onChange={(e: any) => updateForm('securityDeposit', e.target.value)} min="0" step="100" placeholder="Optional" className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600">Pick exact listing location from map</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {locating ? 'Locating...' : 'Use Current Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, latitude: '', longitude: '' }))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Clear Pin
                  </button>
                </div>
              </div>
              <ListingLocationMap
                latitude={typeof latNumber === 'number' && !Number.isNaN(latNumber) ? latNumber : null}
                longitude={typeof lngNumber === 'number' && !Number.isNaN(lngNumber) ? lngNumber : null}
                onChange={({ latitude, longitude }) => {
                  void applyCoordinates(latitude, longitude);
                }}
                interactive
                markerLabel="Listing location"
              />
              <p className="text-[11px] text-slate-500">
                Click on map to pin location. Current-location uses browser permission.
                {resolvingAddress ? ' Resolving address...' : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" value={form.address} onChange={(e: any) => updateForm('address', e.target.value)} placeholder="Full address" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
                <input type="text" value={form.city} onChange={(e: any) => updateForm('city', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State *</label>
                <select value={form.state} onChange={(e: any) => updateForm('state', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input type="text" value={form.pincode} onChange={(e: any) => updateForm('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input type="text" value={form.latitude} onChange={(e: any) => updateForm('latitude', e.target.value)} placeholder="12.9716" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input type="text" value={form.longitude} onChange={(e: any) => updateForm('longitude', e.target.value)} placeholder="77.5946" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {step === 4 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Images</h2>
            <p className="text-sm text-gray-500">Max 10 images total (JPEG, PNG, WebP, max 5 MB each). Remove existing or add new ones.</p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {/* Existing images */}
              {existingImages.map((img) =>
                removedImageIds.includes(img.id) ? null : (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={img.url} alt="Existing" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">Saved</span>
                  </div>
                )
              )}

              {/* New image previews */}
              {newImagePreviews.map((preview, i) => (
                <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img src={preview} alt={`New ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-indigo-600/80 px-1.5 py-0.5 text-xs text-white">New</span>
                </div>
              ))}

              {totalImageCount < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition hover:border-primary-400 hover:bg-primary-50">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="mt-1 text-xs text-gray-500">Add Photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Review Changes</h2>
              <div className="mt-4 divide-y">
                <ReviewRow label="Category" value={categories.find((c) => c.id === form.categoryId)?.name || '—'} />
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Description" value={form.description.length > 100 ? form.description.slice(0, 100) + '…' : form.description} />
                <ReviewRow label="Price" value={`₹${parseFloat(form.price || '0').toLocaleString('en-IN')} / ${RENT_PERIODS.find((p) => p.value === form.rentPeriod)?.label}`} />
                {form.securityDeposit && <ReviewRow label="Security Deposit" value={`₹${parseFloat(form.securityDeposit).toLocaleString('en-IN')}`} />}
                <ReviewRow label="Location" value={`${form.city}, ${form.state}${form.pincode ? ` - ${form.pincode}` : ''}`} />
                <ReviewRow label="Images" value={`${visibleExisting.length} existing + ${newImages.length} new = ${totalImageCount} total`} />
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Saving these changes will update your listing immediately. If the listing was active, it will remain active after saving.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
          ) : (
            <Link href="/my-listings" className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
          )}

          {step < totalSteps ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!validateStep(step)} className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-primary-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
