// src/hooks/useSettings.js
import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com'}/api`;

// Module-level cache — sab components share karenge
let cachedSettings = null;
let cachedAt = 0;
let inflightPromise = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FALLBACK = {
  freeShippingThreshold: 499,
  shippingCharge: 49,
  expressShippingCharge: 99,
  taxPercent: 5,
  codCharge: 0,
  codAvailable: true,
  minOrderValue: 0,
  deliveryDaysMin: 3,
  deliveryDaysMax: 5,
  cutOffTime: '16:00',
  warehousePincode: '400072',
  warehouseCity: 'Mumbai',
  warehouseState: 'Maharashtra',
  freeShippingEnabled: true,
};

async function fetchSettings() {
  const now = Date.now();

  // 1. Return cached if fresh
  if (cachedSettings && (now - cachedAt) < CACHE_TTL_MS) {
    return cachedSettings;
  }

  // 2. If a fetch is already in progress, share it
  if (inflightPromise) return inflightPromise;

  // 3. Start new fetch
  inflightPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/settings/public`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json?.data || json;

      // Parse numbers safely
      const parsed = {
        freeShippingThreshold: Number(data.freeShippingThreshold ?? FALLBACK.freeShippingThreshold),
        shippingCharge: Number(data.shippingCharge ?? FALLBACK.shippingCharge),
        expressShippingCharge: Number(data.expressShippingCharge ?? FALLBACK.expressShippingCharge),
        taxPercent: Number(data.taxPercent ?? FALLBACK.taxPercent),
        codCharge: Number(data.codCharge ?? FALLBACK.codCharge),
        codAvailable: data.codAvailable === true || data.codAvailable === 'true' || data.codAvailable === 1,
        minOrderValue: Number(data.minOrderValue ?? FALLBACK.minOrderValue),
        deliveryDaysMin: Number(data.deliveryDaysMin ?? FALLBACK.deliveryDaysMin),
        deliveryDaysMax: Number(data.deliveryDaysMax ?? FALLBACK.deliveryDaysMax),
        cutOffTime: data.cutOffTime || FALLBACK.cutOffTime,
        warehousePincode: data.warehousePincode || FALLBACK.warehousePincode,
        warehouseCity: data.warehouseCity || FALLBACK.warehouseCity,
        warehouseState: data.warehouseState || FALLBACK.warehouseState,
        freeShippingEnabled: data.freeShippingEnabled !== false,
      };

      cachedSettings = parsed;
      cachedAt = Date.now();
      return parsed;
    } catch (err) {
      console.error('useSettings fetch failed:', err);
      return cachedSettings || FALLBACK;
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

/**
 * useSettings() — returns { settings, loading, error, refresh }
 * Settings ek baar fetch hote hain, phir cache se aate hain (5 min TTL).
 */
export function useSettings() {
  const [settings, setSettings] = useState(cachedSettings || FALLBACK);
  const [loading, setLoading] = useState(!cachedSettings);
  const [error, setError] = useState(null);

  const load = async (force = false) => {
    if (force) {
      cachedSettings = null;
      cachedAt = 0;
    }
    try {
      setLoading(true);
      const s = await fetchSettings();
      setSettings(s);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    settings,
    loading,
    error,
    refresh: () => load(true),
  };
}

export default useSettings;
