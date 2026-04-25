'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import Header from '@/components/Header';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface AmenityRow {
  key: string;
  value: string;
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

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'OWNER')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const cats = data.data || data;
      setCategories(Array.isArray(cats) ? cats : []);
    }).catch(() => {});
  }, []);

  const updateForm = (field: keyof ListingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addAmenity = () => {
    setForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, { key: '', value: '' }],
    }));
  };

  const removeAmenity = (index: number) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const updateAmenity = (index: number, field: 'key' | 'value', value: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) return false;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return false;
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!form.categoryId && !!form.title.trim() && !!form.description.trim();
      case 2:
        return !!form.price && parseFloat(form.price) > 0;
      case 3:
        return !!form.city.trim() && !!form.state;
      case 4:
        return true; // images optional
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      // 1. Create listing
      const amenities = form.amenities.filter((a) => a.key.trim() && a.value.trim());
      const listingPayload = {
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

      const { data: listingRes } = await api.post('/listings', listingPayload);
      const listing = listingRes.data || listingRes;

      // 2. Upload images if any
      if (images.length > 0) {
        const uploadedImages: { url: string; publicId: string; sortOrder: number }[] = [];

        for (let i = 0; i < images.length; i++) {
          const formData = new FormData();
          formData.append('file', images[i]);

          try {
            const { data: uploadRes } = await api.post('/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadData = uploadRes.data || uploadRes;
            uploadedImages.push({
              url: uploadData.url,
              publicId: uploadData.publicId,
              sortOrder: i,
            });
          } catch {
            console.error(`Failed to upload image ${i + 1}`);
          }
        }

        if (uploadedImages.length > 0) {
          await api.post(`/listings/${listing.id}/images`, { images: uploadedImages });
        }
      }

      router.push('/my-listings');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">List Your Item for Rent</h1>
        <p className="mt-1 text-sm text-gray-500">Fill in the details to create your listing</p>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  s < step
                    ? 'bg-primary-600 text-white'
                    : s === step
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && (
                <div className={`h-0.5 flex-1 ${s < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Details</span>
          <span>Pricing</span>
          <span>Location</span>
          <span>Images</span>
          <span>Review</span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => updateForm('categoryId', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                maxLength={200}
                placeholder="e.g., 2BHK Apartment in Koramangala"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-400">{form.title.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Describe your item, its condition, what's included, availability..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-400">{form.description.length}/5000</p>
            </div>

            {/* Amenities / Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Details</label>
              <p className="text-xs text-gray-400">e.g., Bedrooms: 2, Fuel Type: Petrol, Brand: Samsung</p>
              <div className="mt-2 space-y-2">
                {form.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={amenity.key}
                      onChange={(e) => updateAmenity(i, 'key', e.target.value)}
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={amenity.value}
                      onChange={(e) => updateAmenity(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none"
                    />
                    {form.amenities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAmenity(i)}
                        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAmenity}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  + Add another detail
                </button>
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
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm('price', e.target.value)}
                  min="0"
                  step="100"
                  placeholder="5000"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Period *</label>
                <select
                  value={form.rentPeriod}
                  onChange={(e) => updateForm('rentPeriod', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {RENT_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
              <input
                type="number"
                value={form.securityDeposit}
                onChange={(e) => updateForm('securityDeposit', e.target.value)}
                min="0"
                step="100"
                placeholder="Optional"
                className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="Full address (visible only after contact reveal)"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => updateForm('state', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => updateForm('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="560001"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => updateForm('latitude', e.target.value)}
                  placeholder="12.9716"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => updateForm('longitude', e.target.value)}
                  placeholder="77.5946"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {step === 4 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Images</h2>
            <p className="text-sm text-gray-500">Upload up to 10 images (JPEG, PNG, WebP, max 5MB each)</p>

            {/* Image grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img src={preview} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {images.length < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition hover:border-primary-400 hover:bg-primary-50">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="mt-1 text-xs text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Review Your Listing</h2>

              <div className="mt-4 divide-y">
                <ReviewRow label="Category" value={categories.find((c) => c.id === form.categoryId)?.name || '—'} />
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Description" value={form.description} />
                <ReviewRow label="Price" value={`₹${parseFloat(form.price || '0').toLocaleString('en-IN')} / ${RENT_PERIODS.find((p) => p.value === form.rentPeriod)?.label}`} />
                {form.securityDeposit && <ReviewRow label="Security Deposit" value={`₹${parseFloat(form.securityDeposit).toLocaleString('en-IN')}`} />}
                <ReviewRow label="Location" value={`${form.city}, ${form.state}${form.pincode ? ` - ${form.pincode}` : ''}`} />
                {form.address && <ReviewRow label="Address" value={form.address} />}
                {form.amenities.filter((a) => a.key && a.value).length > 0 && (
                  <div className="py-3">
                    <dt className="text-sm text-gray-500">Details</dt>
                    <dd className="mt-1 grid grid-cols-2 gap-1">
                      {form.amenities.filter((a) => a.key && a.value).map((a, i) => (
                        <span key={i} className="text-sm text-gray-900">{a.key}: <strong>{a.value}</strong></span>
                      ))}
                    </dd>
                  </div>
                )}
                <ReviewRow label="Images" value={`${images.length} image(s)`} />
              </div>
            </div>

            {images.length > 0 && (
              <div className="rounded-xl border bg-white p-6">
                <h3 className="text-sm font-medium text-gray-700">Image Preview</h3>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {imagePreviews.map((preview, i) => (
                    <img key={i} src={preview} alt={`Preview ${i + 1}`} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Your listing will be submitted for review. Once approved by our team, it will be visible to renters.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!validateStep(step)}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Listing'}
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
      <dd className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</dd>
    </div>
  );
}
