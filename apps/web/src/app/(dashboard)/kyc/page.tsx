'use client';

import { useState, useRef } from 'react';
import { useKyc } from '@/hooks/useKyc';
import api from '@/lib/api';

export default function KycPage() {
  const { submitKyc, loading: submitting } = useKyc();
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
  ];

  // Upload file to Cloudinary
  const uploadFile = async (file: File, isDocument: boolean) => {
    try {
      if (isDocument) {
        setUploadingDoc(true);
      } else {
        setUploadingFace(true);
      }

      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<{ publicId: string; url: string }>(
        '/upload/image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (isDocument) {
        setDocumentUrl(data.url);
      } else {
        setFacePhotoUrl(data.url);
      }

      return data.url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload file');
      throw err;
    } finally {
      if (isDocument) {
        setUploadingDoc(false);
      } else {
        setUploadingFace(false);
      }
    }
  };

  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Document must be less than 5MB');
      return;
    }

    setError(null);

    try {
      await uploadFile(file, true);
    } catch {
      // Error handled in uploadFile
    }
  };

  const handleFacePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB');
      return;
    }

    setError(null);

    try {
      await uploadFile(file, false);
    } catch {
      // Error handled in uploadFile
    }
  };

  const handleSubmit = async () => {
    if (!documentUrl || !facePhotoUrl) {
      setError('Please upload both document and face photo');
      return;
    }

    try {
      setError(null);
      await submitKyc(documentType, documentUrl, facePhotoUrl);
      alert('KYC submitted successfully! You will be notified once it is reviewed.');
      // Reset form
      setStep(1);
      setDocumentUrl(null);
      setFacePhotoUrl(null);
    } catch {
      // Error handled in submitKyc
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your identity verification to unlock all features
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                  step >= stepNum
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`h-1 w-12 ${
                    step > stepNum ? 'bg-primary-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
          <span>Document Type</span>
          <span>Upload Document</span>
          <span>Face Photo</span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Step 1: Document Type Selection */}
        {step === 1 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Document Type</h2>
            <div className="space-y-3">
              {documentTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: documentType === type.value ? '#3b82f6' : '#e2e8f0',
                    backgroundColor: documentType === type.value ? '#eff6ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    value={type.value}
                    checked={documentType === type.value}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-slate-900">{type.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Document</h2>
            <p className="text-sm text-slate-600 mb-4">
              Upload a clear photo of your {documentTypes.find((t) => t.value === documentType)?.label}
            </p>

            <div
              className="relative rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary-400 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  uploadFile(file, true).catch(() => {});
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDocumentSelect}
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploadingDoc}
              />

              {documentUrl ? (
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">✓ Document uploaded</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0117.25 19.5H6.75z"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {uploadingDoc ? 'Uploading...' : 'Drag and drop, or click to select'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 5MB</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                  >
                    {uploadingDoc ? 'Uploading...' : 'Select File'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!documentUrl}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Face Photo */}
        {step === 3 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Face Photo</h2>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a clear selfie for verification purposes
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFacePhotoSelect}
              accept="image/*"
              className="hidden"
              disabled={uploadingFace}
            />

            <div
              className="relative rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary-400 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  uploadFile(file, false).catch(() => {});
                }
              }}
            >
              {facePhotoUrl ? (
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">✓ Photo uploaded</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0117.25 19.5H6.75z"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {uploadingFace ? 'Uploading...' : 'Drag and drop, or click to select'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFace}
                    className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                  >
                    {uploadingFace ? 'Uploading...' : 'Select File'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!facePhotoUrl || submitting}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Section */}
      <div className="mt-12 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Verification Benefits</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Unlock all platform features
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Build trust with other users
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Increase listing visibility
          </li>
        </ul>
      </div>
    </div>
  );
}
