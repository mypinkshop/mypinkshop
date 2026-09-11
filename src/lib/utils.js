// src/lib/utils.js
// Frontend-only storage helpers — quota-safe + TTL cache

const CACHE_PREFIXES = [
  'product_',
  'products_cache',
  'banners_cache',
  'category_cache',
  'home_cache',
  'product_cache_time_',
  'search_cache_',
  'api_cache_',
];

const PROTECTED_PREFIXES = [
  'checkout_',
  'cart_',
  'cart',
  'user_',
  'user',
  'auth_',
  'auth',
  'token',
  'wishlist_',
  'wishlist',
  'order_',
  'address_',
  'coupon_',
  'session_',
];

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_FLAG_KEY = 'last_auto_cleanup_v2';

function isProtectedKey(key) {
  if (!key) return false;
  return PROTECTED_PREFIXES.some(p => key === p || key.startsWith(p));
}

function isCacheKey(key) {
  if (!key) return false;
  if (isProtectedKey(key)) return false;
  return CACHE_PREFIXES.some(p => key === p || key.startsWith(p));
}

export function safeSetItem(storage, key, value, options = {}) {
  const { protected: isProtected = false } = options;
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    const isQuota =
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 ||
      e.code === 1014;

    if (!isQuota) {
      console.warn('⚠️ Storage setItem failed:', e);
      return false;
    }

    console.warn('⚠️ Storage quota exceeded. Starting smart cleanup...');
    removeExpiredCache(storage);
    const removed = removeOldestCache(storage, 10);

    try {
      storage.setItem(key, value);
      console.log(`✅ Saved after cleanup (freed ${removed} items)`);
      return true;
    } catch (e2) {
      if (!isProtected) {
        console.warn('⚠️ Still full. Clearing all cache...');
        clearAllCache(storage);
        try {
          storage.setItem(key, value);
          console.log('✅ Saved after full cache clear');
          return true;
        } catch (e3) {
          console.error('❌ Storage completely full. Save skipped.');
          return false;
        }
      }
      console.error('❌ Cannot save protected key — storage full.');
      return false;
    }
  }
}

export function safeGetItem(storage, key, parseJson = false) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    if (!parseJson) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function safeRemoveItem(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function setCacheWithTTL(storage, key, value, ttlMs = CACHE_MAX_AGE_MS) {
  const payload = JSON.stringify({
    v: value,
    t: Date.now(),
    exp: Date.now() + ttlMs,
  });
  return safeSetItem(storage, key, payload);
}

export function getCacheWithTTL(storage, key) {
  const raw = safeGetItem(storage, key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.exp && Date.now() > parsed.exp) {
      safeRemoveItem(storage, key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

function removeExpiredCache(storage) {
  let removed = 0;
  const now = Date.now();
  const keys = [];

  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (isCacheKey(k)) keys.push(k);
  }

  for (const k of keys) {
    try {
      const raw = storage.getItem(k);
      if (!raw) continue;
      if (raw.startsWith('{"v":')) {
        const parsed = JSON.parse(raw);
        if (parsed.exp && now > parsed.exp) {
          storage.removeItem(k);
          removed++;
        }
      }
    } catch {
      storage.removeItem(k);
      removed++;
    }
  }
  return removed;
}

function removeOldestCache(storage, count = 10) {
  const entries = [];
  const now = Date.now();

  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!isCacheKey(k)) continue;
    try {
      const raw = storage.getItem(k);
      let ts = 0;
      if (raw && raw.startsWith('{"v":')) {
        const parsed = JSON.parse(raw);
        ts = parsed.t || 0;
      }
      entries.push({ key: k, age: now - ts });
    } catch {
      entries.push({ key: k, age: Infinity });
    }
  }

  entries.sort((a, b) => b.age - a.age);

  let removed = 0;
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    storage.removeItem(entries[i].key);
    removed++;
  }
  return removed;
}

export function runAutoCleanup(storage = localStorage) {
  try {
    const last = storage.getItem(CLEANUP_FLAG_KEY);
    const now = Date.now();

    if (last && now - parseInt(last, 10) < AUTO_CLEANUP_INTERVAL_MS) {
      return { skipped: true };
    }

    const expired = removeExpiredCache(storage);
    const oldest = removeOldestCache(storage, 20);

    storage.setItem(CLEANUP_FLAG_KEY, String(now));
    console.log(`✅ Auto-cleanup done (expired: ${expired}, oldest: ${oldest})`);
    return { expired, oldest };
  } catch (e) {
    console.warn('Cleanup error:', e);
    return { error: true };
  }
}

export function clearAllCache(storage = localStorage) {
  const keys = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (isCacheKey(k)) keys.push(k);
  }
  keys.forEach(k => storage.removeItem(k));
  console.log(`✅ Cleared ${keys.length} cache items`);
  return keys.length;
}

export function clearAllStorage(storage = localStorage) {
  try {
    storage.clear();
    console.log('✅ All storage cleared');
    return true;
  } catch {
    return false;
  }
}

export function getStorageUsage(storage = localStorage) {
  let total = 0;
  let cacheBytes = 0;
  let protectedBytes = 0;
  let cacheCount = 0;
  let protectedCount = 0;

  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k) continue;
    const size = ((storage.getItem(k) || '').length + k.length) * 2;
    total += size;
    if (isCacheKey(k)) {
      cacheBytes += size;
      cacheCount++;
    } else if (isProtectedKey(k)) {
      protectedBytes += size;
      protectedCount++;
    }
  }

  const QUOTA = 5 * 1024 * 1024;
  return {
    totalBytes: total,
    totalKB: (total / 1024).toFixed(2),
    totalMB: (total / (1024 * 1024)).toFixed(2),
    percent: ((total / QUOTA) * 100).toFixed(2),
    cacheBytes,
    cacheKB: (cacheBytes / 1024).toFixed(2),
    cacheCount,
    protectedBytes,
    protectedKB: (protectedBytes / 1024).toFixed(2),
    protectedCount,
  };
}

export function initStorageManager() {
  if (typeof window === 'undefined') return;
  try {
    runAutoCleanup(localStorage);
    runAutoCleanup(sessionStorage);
    window.addEventListener('beforeunload', () => {
      try {
        removeExpiredCache(localStorage);
        removeExpiredCache(sessionStorage);
      } catch {}
    });
  } catch (e) {
    console.warn('Storage manager init failed:', e);
  }
}
