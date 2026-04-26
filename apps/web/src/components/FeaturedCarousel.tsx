'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ListingCard from './ListingCard';

interface FeaturedCarouselProps {
  listings: any[];
}

export default function FeaturedCarousel({ listings }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // ─── Check scroll boundaries ─────────────────────
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current as any;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current as any;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState, listings]);

  // ─── Manual scroll via buttons ────────────────────
  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current as any;
    if (!el) return;
    // Scroll by roughly one card width + gap
    const cardWidth = 320;
    const amount = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // ─── Auto-scroll every 4 seconds ─────────────────
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      const el = scrollRef.current as any;
      if (!el) return;

      // If at the end, scroll back to start
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 4000);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (listings.length > 0 && !isHovered && !isDragging) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [listings, isHovered, isDragging, startAutoScroll, stopAutoScroll]);

  // ─── Drag-to-scroll (mouse) ───────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current as any;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = e.pageX;
    scrollStartX.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current as any;
    if (!el) return;
    e.preventDefault();
    const dx = e.pageX - dragStartX.current;
    el.scrollLeft = scrollStartX.current - dx;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const el = scrollRef.current as any;
    if (el) el.style.cursor = 'grab';
  };

  if (listings.length === 0) return null;

  return (
    <section className="section bg-gradient-to-b from-white to-surface-50">
      <div className="w-full">
        {/* ─── Header ─── */}
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200/60">
              <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </div>
            <h2 className="section-heading">Featured Listings</h2>
            <p className="section-subheading">Handpicked premium rentals for you</p>
          </div>

          {/* Navigation buttons */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="mr-2 text-xs font-medium text-surface-400">
              {listings.length} featured
            </span>
            <button
              onClick={() => scrollBy('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white text-surface-500 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-surface-200 disabled:hover:bg-white disabled:hover:text-surface-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white text-surface-500 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-surface-200 disabled:hover:bg-white disabled:hover:text-surface-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Carousel ─── */}
        <div
          className="group relative mt-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); handleMouseUp(); }}
        >
          {/* Left fade + button (mobile) */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute -left-1 bottom-0 top-0 z-10 w-16 bg-gradient-to-r from-white/90 via-white/50 to-transparent sm:hidden">
              <button
                onClick={() => scrollBy('left')}
                className="pointer-events-auto absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white/95 text-surface-600 shadow-md backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Right fade + button (mobile) */}
          {canScrollRight && (
            <div className="pointer-events-none absolute -right-1 bottom-0 top-0 z-10 w-16 bg-gradient-to-l from-white/90 via-white/50 to-transparent sm:hidden">
              <button
                onClick={() => scrollBy('right')}
                className="pointer-events-auto absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white/95 text-surface-600 shadow-md backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="scrollbar-hide flex gap-5 overflow-x-auto scroll-smooth pb-4"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {listings.map((listing: any) => (
              <div
                key={listing.id}
                className="w-[300px] flex-shrink-0 select-none first:ml-0"
              >
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  rentPeriod={listing.rentPeriod}
                  city={listing.city}
                  state={listing.state}
                  imageUrl={listing.images?.[0]?.url}
                  images={listing.images}
                  categoryName={listing.category?.name}
                  categorySlug={listing.category?.slug}
                  ownerName={listing.owner?.profile?.fullName}
                  isFeatured={listing.isFeatured}
                  createdAt={listing.createdAt}
                  amenities={listing.amenities}
                />
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(Math.ceil(listings.length / 3), 8) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = scrollRef.current as any;
                    if (!el) return;
                    const scrollTarget = (el.scrollWidth / Math.ceil(listings.length / 3)) * i;
                    el.scrollTo({ left: scrollTarget, behavior: 'smooth' });
                  }}
                  className="h-1.5 rounded-full bg-surface-200 transition-all hover:bg-primary-400"
                  style={{ width: '20px' }}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
