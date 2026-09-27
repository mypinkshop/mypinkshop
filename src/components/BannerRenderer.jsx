// src/components/BannerRenderer.jsx
// Reusable banner renderer — single, split, overlay, slide, grid
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Size → Tailwind class map                                          */
/* ------------------------------------------------------------------ */
const SIZE_CLASSES = {
  small:  'h-32 sm:h-40',
  medium: 'h-48 sm:h-56',
  large:  'h-64 sm:h-80',
  xl:     'h-80 sm:h-96',
  full:   'h-96 sm:h-[500px]',
  square: 'aspect-square',
  tall:   'h-[500px]',
};

const getSizeClass = (size) => SIZE_CLASSES[size] || SIZE_CLASSES.large;

/* ------------------------------------------------------------------ */
/* Individual style components                                        */
/* ------------------------------------------------------------------ */

/** Single — image + text overlay (agar showTextOverlay true ho) */
function SingleBanner({ banner, sizeClass }) {
  const img = banner.images?.[0] || banner.image;
  const link = banner.link || '#';

  return (
    <Link to={link} className="block group">
      <div className={`relative w-full ${sizeClass} rounded-2xl overflow-hidden bg-gradient-to-r from-pink-400 to-rose-400`}>
        {img ? (
          <img
            src={img}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">✨</span>
          </div>
        )}

        {banner.showTextOverlay && (banner.title || banner.subtitle || banner.buttonText) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
            <div className="text-center text-white px-4">
              {banner.title && (
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="mt-1 text-sm sm:text-base drop-shadow-md opacity-95">
                  {banner.subtitle}
                </p>
              )}
              {banner.buttonText && (
                <span className="inline-block mt-3 bg-white text-pink-600 px-6 py-2 rounded-full text-sm font-semibold shadow-lg group-hover:bg-pink-50 transition">
                  {banner.buttonText}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/** Split — text left, image right (mobile: stacked) */
function SplitBanner({ banner, sizeClass }) {
  const img = banner.images?.[0] || banner.image;
  const link = banner.link || '#';

  return (
    <Link to={link} className="block group">
      <div className={`w-full ${sizeClass} rounded-2xl overflow-hidden bg-gradient-to-r from-pink-50 to-rose-50 flex flex-col md:flex-row`}>
        {/* Text side */}
        <div className="md:w-1/2 flex items-center p-6 md:p-8 order-2 md:order-1">
          <div>
            {banner.title && (
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {banner.title}
              </h3>
            )}
            {banner.subtitle && (
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {banner.subtitle}
              </p>
            )}
            {banner.buttonText && (
              <span className="inline-block mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md group-hover:shadow-lg transition">
                {banner.buttonText}
              </span>
            )}
          </div>
        </div>

        {/* Image side */}
        <div className="md:w-1/2 h-40 md:h-full order-1 md:order-2">
          {img ? (
            <img
              src={img}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center">
              <span className="text-4xl">🖼️</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Overlay — full image bg + centered text */
function OverlayBanner({ banner, sizeClass }) {
  const img = banner.images?.[0] || banner.image;
  const link = banner.link || '#';

  return (
    <Link to={link} className="block group">
      <div className={`relative w-full ${sizeClass} rounded-2xl overflow-hidden`}>
        {img ? (
          <img
            src={img}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500" />
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-6">
            {banner.title && (
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">
                {banner.title}
              </h3>
            )}
            {banner.subtitle && (
              <p className="mt-2 text-base sm:text-lg drop-shadow-md opacity-95">
                {banner.subtitle}
              </p>
            )}
            {banner.buttonText && (
              <span className="inline-block mt-4 bg-white text-pink-600 px-8 py-2.5 rounded-full text-sm font-semibold shadow-lg group-hover:bg-pink-50 transition">
                {banner.buttonText}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Slide — multiple banners rotate (auto + dots + arrows) */
function SlideBanner({ banners, sizeClass }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const total = banners.length;

  const goTo = (idx) => setCurrent((idx + total) % total);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Auto-rotate every 5s
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  // Reset timer on manual nav
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % total);
      }, 5000);
    }
  };

  if (total === 0) return null;

  const banner = banners[current];
  const img = banner.images?.[0] || banner.image;
  const link = banner.link || '#';

  return (
    <div className={`relative w-full ${sizeClass} rounded-2xl overflow-hidden group`}>
      <Link to={link} className="block w-full h-full">
        {img ? (
          <img
            src={img}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500" />
        )}

        {banner.showTextOverlay !== false && (banner.title || banner.subtitle || banner.buttonText) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
            <div className="text-center text-white px-4">
              {banner.title && (
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="mt-2 text-base sm:text-lg drop-shadow-md">
                  {banner.subtitle}
                </p>
              )}
              {banner.buttonText && (
                <span className="inline-block mt-4 bg-white text-pink-600 px-8 py-2.5 rounded-full text-sm font-semibold shadow-lg">
                  {banner.buttonText}
                </span>
              )}
            </div>
          </div>
        )}
      </Link>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); prev(); resetTimer(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); next(); resetTimer(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => { e.preventDefault(); goTo(idx); resetTimer(); }}
              className={`w-2 h-2 rounded-full transition ${
                idx === current ? 'bg-white w-6' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Grid — 2-4 banners side by side */
function GridBanner({ banners, sizeClass }) {
  const cols = banners.length >= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${cols} gap-3 sm:gap-4`}>
      {banners.map((banner, idx) => {
        const img = banner.images?.[0] || banner.image;
        const link = banner.link || '#';
        return (
          <Link to={link} key={banner._id || banner.id || idx} className="block group">
            <div className={`relative w-full ${sizeClass} rounded-xl overflow-hidden bg-gradient-to-r from-pink-400 to-rose-400`}>
              {img ? (
                <img
                  src={img}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl">🖼️</span>
                </div>
              )}
              {banner.showTextOverlay !== false && banner.title && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <div className="text-white">
                    <h4 className="font-semibold text-sm sm:text-base drop-shadow">
                      {banner.title}
                    </h4>
                    {banner.subtitle && (
                      <p className="text-xs opacity-90 drop-shadow">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main renderer — ek banner ya group of banners handle karta hai      */
/* ------------------------------------------------------------------ */

/**
 * @param {Object|Array} banners - Single banner object ya array (slide/grid ke liye)
 * @param {string} size - 'small' | 'medium' | 'large' | 'xl' | 'full' | 'square' | 'tall'
 * @param {string} style - 'single' | 'split' | 'overlay' | 'slide' | 'grid'
 */
function BannerRenderer({ banners, size, style = 'single' }) {
  // Array me convert karo
  const list = Array.isArray(banners) ? banners : [banners].filter(Boolean);

  if (list.length === 0) return null;

  const sizeClass = getSizeClass(size);

  // Agar multiple banners hain aur style single hai → grid fallback
  if (list.length > 1 && style === 'single') {
    return <GridBanner banners={list} sizeClass={sizeClass} />;
  }

  // Agar single banner hai aur style slide/grid hai → single fallback
  if (list.length === 1) {
    const banner = list[0];
    if (style === 'split') return <SplitBanner banner={banner} sizeClass={sizeClass} />;
    if (style === 'overlay') return <OverlayBanner banner={banner} sizeClass={sizeClass} />;
    return <SingleBanner banner={banner} sizeClass={sizeClass} />;
  }

  // Multiple banners
  switch (style) {
    case 'slide':
      return <SlideBanner banners={list} sizeClass={sizeClass} />;
    case 'grid':
      return <GridBanner banners={list} sizeClass={sizeClass} />;
    case 'split':
      return <SplitBanner banner={list[0]} sizeClass={sizeClass} />;
    case 'overlay':
      return <OverlayBanner banner={list[0]} sizeClass={sizeClass} />;
    default:
      return <GridBanner banners={list} sizeClass={sizeClass} />;
  }
}

export default BannerRenderer;
