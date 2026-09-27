// src/components/BannerRenderer.jsx
// Reusable banner renderer — single, split, overlay, slide, grid
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Size config — backend se aata hai, hardcoded nahi                  */
/* ------------------------------------------------------------------ */
const DEFAULT_ASPECT = '16/5';

/**
 * Build a style object from a size config.
 * Accepts:
 *   - string (e.g. 'full') → falls back to DEFAULT_ASPECT
 *   - object (e.g. { value: 'full', aspect: '16/5', label: 'Full' })
 *   - undefined → DEFAULT_ASPECT
 */
function getSizeStyle(sizeConfig) {
  let aspect = DEFAULT_ASPECT;

  if (typeof sizeConfig === 'string') {
    // Fallback map for legacy calls
    const LEGACY = {
      small:  '3/2',
      medium: '2/1',
      large:  '3/1',
      xl:     '16/5',
      full:   '16/5',
      square: '1/1',
      tall:   '1/2',
    };
    aspect = LEGACY[sizeConfig] || DEFAULT_ASPECT;
  } else if (sizeConfig && typeof sizeConfig === 'object') {
    aspect = sizeConfig.aspect || DEFAULT_ASPECT;
  }

  return { aspectRatio: aspect };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const shouldShowText = (banner) => {
  if (!banner) return false;
  if (banner.showTextOverlay !== true) return false;

  const hasRealTitle =
    banner.title &&
    banner.title.trim() &&
    banner.title !== 'Untitled Banner';

  return !!(hasRealTitle || banner.subtitle || banner.buttonText);
};

const getTitle = (banner) => {
  const t = banner?.title?.trim();
  if (!t || t === 'Untitled Banner') return '';
  return t;
};

const getImage = (banner) => {
  if (!banner) return '';
  if (Array.isArray(banner.images) && banner.images[0]) return banner.images[0];
  if (typeof banner.image === 'string' && banner.image) return banner.image;
  return '';
};

const getLink = (banner) => {
  if (!banner) return '#';
  return banner.link || '#';
};

/* ------------------------------------------------------------------ */
/* Single — image + optional text overlay                             */
/* ------------------------------------------------------------------ */
function SingleBanner({ banner, sizeStyle }) {
  const img = getImage(banner);
  const link = getLink(banner);
  const title = getTitle(banner);

  return (
    <Link to={link} className="block group">
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-pink-400 to-rose-400"
        style={sizeStyle}
      >
        {img ? (
          <img
            src={img}
            alt={title || 'Banner'}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">✨</span>
          </div>
        )}

        {shouldShowText(banner) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
            <div className="text-center text-white px-4">
              {title && (
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
                  {title}
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

/* ------------------------------------------------------------------ */
/* Split — text left, image right (stacked on mobile)                 */
/* ------------------------------------------------------------------ */
function SplitBanner({ banner, sizeStyle }) {
  const img = getImage(banner);
  const link = getLink(banner);
  const showText = shouldShowText(banner);
  const title = getTitle(banner);

  return (
    <Link to={link} className="block group">
      <div
        className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-pink-50 to-rose-50 flex flex-col md:flex-row"
        style={sizeStyle}
      >
        <div className="md:w-1/2 flex items-center p-6 md:p-8 order-2 md:order-1">
          <div>
            {showText && title && (
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {title}
              </h3>
            )}
            {showText && banner.subtitle && (
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {banner.subtitle}
              </p>
            )}
            {showText && banner.buttonText && (
              <span className="inline-block mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md group-hover:shadow-lg transition">
                {banner.buttonText}
              </span>
            )}
          </div>
        </div>

        <div className="md:w-1/2 h-40 md:h-full order-1 md:order-2">
          {img ? (
            <img
              src={img}
              alt={title || 'Banner'}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
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

/* ------------------------------------------------------------------ */
/* Overlay — full image + centered text overlay                       */
/* ------------------------------------------------------------------ */
function OverlayBanner({ banner, sizeStyle }) {
  const img = getImage(banner);
  const link = getLink(banner);
  const showText = shouldShowText(banner);
  const title = getTitle(banner);

  return (
    <Link to={link} className="block group">
      <div className="relative w-full rounded-2xl overflow-hidden" style={sizeStyle}>
        {img ? (
          <img
            src={img}
            alt={title || 'Banner'}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500" />
        )}

        {showText && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-6">
              {title && (
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">
                  {title}
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
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Slide — multiple banners with auto-rotate + dots + arrows          */
/* ------------------------------------------------------------------ */
function SlideBanner({ banners, sizeStyle }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const total = banners.length;

  const goTo = (idx) => setCurrent((idx + total) % total);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  useEffect(() => {
    if (total <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [total]);

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
  const img = getImage(banner);
  const link = getLink(banner);
  const showText = shouldShowText(banner);
  const title = getTitle(banner);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden group"
      style={sizeStyle}
    >
      <Link to={link} className="block w-full h-full">
        {img ? (
          <img
            src={img}
            alt={title || 'Banner'}
            className="w-full h-full object-cover object-center transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-500 to-rose-500" />
        )}

        {showText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
            <div className="text-center text-white px-4">
              {title && (
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">
                  {title}
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

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prev();
              resetTimer();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              next();
              resetTimer();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                goTo(idx);
                resetTimer();
              }}
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

/* ------------------------------------------------------------------ */
/* Grid — 2-4 banners side by side                                    */
/* ------------------------------------------------------------------ */
function GridBanner({ banners, sizeStyle }) {
  const cols =
    banners.length >= 3
      ? 'grid-cols-2 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${cols} gap-3 sm:gap-4`}>
      {banners.map((banner, idx) => {
        const img = getImage(banner);
        const link = getLink(banner);
        const showText = shouldShowText(banner);
        const title = getTitle(banner);

        return (
          <Link
            to={link}
            key={banner._id || banner.id || idx}
            className="block group"
          >
            <div
              className="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-pink-400 to-rose-400"
              style={sizeStyle}
            >
              {img ? (
                <img
                  src={img}
                  alt={title || 'Banner'}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl">🖼️</span>
                </div>
              )}

              {showText && title && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <div className="text-white">
                    <h4 className="font-semibold text-sm sm:text-base drop-shadow">
                      {title}
                    </h4>
                    {banner.subtitle && (
                      <p className="text-xs opacity-90 drop-shadow">
                        {banner.subtitle}
                      </p>
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
/* Main renderer                                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {Object|Array} banners - Single banner or array (for slide/grid)
 * @param {string|Object} size - Size value ('full', 'xl', ...) OR
 *                               full size config object from backend
 *                               ({ value, label, hint, aspect })
 * @param {string} style - 'single' | 'split' | 'overlay' | 'slide' | 'grid'
 */
function BannerRenderer({ banners, size, style = 'single' }) {
  const list = Array.isArray(banners) ? banners : [banners].filter(Boolean);

  if (list.length === 0) return null;

  const sizeStyle = getSizeStyle(size);

  if (list.length > 1 && style === 'single') {
    return <GridBanner banners={list} sizeStyle={sizeStyle} />;
  }

  if (list.length === 1) {
    const banner = list[0];
    if (style === 'split') return <SplitBanner banner={banner} sizeStyle={sizeStyle} />;
    if (style === 'overlay') return <OverlayBanner banner={banner} sizeStyle={sizeStyle} />;
    return <SingleBanner banner={banner} sizeStyle={sizeStyle} />;
  }

  switch (style) {
    case 'slide':
      return <SlideBanner banners={list} sizeStyle={sizeStyle} />;
    case 'grid':
      return <GridBanner banners={list} sizeStyle={sizeStyle} />;
    case 'split':
      return <SplitBanner banner={list[0]} sizeStyle={sizeStyle} />;
    case 'overlay':
      return <OverlayBanner banner={list[0]} sizeStyle={sizeStyle} />;
    default:
      return <GridBanner banners={list} sizeStyle={sizeStyle} />;
  }
}

export default BannerRenderer;
