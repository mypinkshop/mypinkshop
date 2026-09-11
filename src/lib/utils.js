// src/lib/utils.js
// Frontend-only storage helpers — quota-safe + TTL cache
// ✅ AGGRESSIVE cleanup — kabhi quota full nahi hoga

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

// ✅ Max items allowed per cache prefix — auto-trim
const MAX_PRODUCT_CACHE = 30; // sirf 30 products cache honge
const MAX_CACHE_ITEMS = 100; // total cache items limit

function isProtectedKey(key) {
  if (!key) return false;
  return PROTECTED_PREFIXES.some(p => key === p || key.startsWith(p));
}

function isCacheKey(key) {
  if (!key) return false;
  if (isProtectedKey(key)) return false;
  return CACHE_PREFIXES.some(p => key === p || key.startsWith(p));
}

// ============================================================
// ✅ SAFE SET ITEM — Aggressive 4-step cleanup
// ============================================================
export function safeSetItem(storage, key, value, options = {}) {
  const { protected: isProtected = false } = options;

  // ✅ STEP 0: Pehle try karo normal
  try {
    storage.setItem(key, value);
    // ✅ Save hone ke baad — agar key cache type hai toh count check karo
    if (isCacheKey(key)) {
      enforceCacheLimit(storage);
    }
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

    console.warn('⚠️ Storage quota exceeded. Starting aggressive cleanup...');

    // ✅ STEP 1: Expired cache delete
    const expired = removeExpiredCache(storage);

    // ✅ STEP 2: Prefix-specific trim (products, banners, etc.)
    const trimmed = trimPerPrefix(storage, 20);

    // ✅ STEP 3: Retry
    try {
      storage.setItem(key, value);
      console.log(`✅ Saved after cleanup (expired: ${expired}, trimmed: ${trimmed})`);
      return true;
    } catch (e2) {
      // ✅ STEP 4: NUCLEAR — sab cache delete (protected safe)
      if (!isProtected) {
        console.warn('⚠️ Still full. CLEARING ALL CACHE...');
        const cleared = clearAllCache(storage);
        console.log(`🧹 Cleared ${cleared} cache items`);

        try {
          storage.setItem(key, value);
          console.log('✅ Saved after full cache clear');
          return true;
        } catch (e3) {
          console.error('❌ Storage completely full. Cannot save.');
          return false;
        }
      }
      console.error('❌ Cannot save protected key — storage full.');
      return false;
    }
  }
}

// ============================================================
// ✅ Enforce max cache limit (auto-trim on every save)
// ============================================================
function enforceCacheLimit(storage) {
  try {
    // ✅ Count total cache items
    let cacheCount = 0;
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (isCacheKey(k)) cacheCount++;
    }

    // ✅ Agar limit cross ho gayi — oldest delete
    if (cacheCount > MAX_CACHE_ITEMS) {
      const toRemove = cacheCount - MAX_CACHE_ITEMS + 10; // 10 extra margin
      removeOldestCache(storage, toRemove);
      console.log(`🧹 Auto-trimmed ${toRemove} cache items`);
    }

    // ✅ Prefix-specific limit (products)
    const productKeys = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith('product_prod_')) productKeys.push(k);
    }

    if (productKeys.length > MAX_PRODUCT_CACHE) {
      const toRemove = productKeys.length - MAX_PRODUCT_CACHE;
      // Oldest products hatao
      const withTs = productKeys.map(k => {
        try {
          const raw = storage.getItem(k);
          if (raw && raw.startsWith('{"v":')) {
            const parsed = JSON.parse(raw);
            return { key: k, t: parsed.t || 0 };
          }
        } catch {}
        return { key: k, t: 0 };
      }).sort((a, b) => a.t - b.t);

      for (let i = 0; i < toRemove; i++) {
        storage.removeItem(withTs[i].key);
      }
      console.log(`🧹 Trimmed ${toRemove} product cache items`);
    }
  } catch (e) {
    console.warn('Enforce limit error:', e);
  }
}

// ============================================================
// ✅ Trim per-prefix (aggressive)
// ============================================================
function trimPerPrefix(storage, keepPerPrefix = 20) {
  try {
    const prefixGroups = {};
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!isCacheKey(k)) continue;

      // Prefix nikaalo (first word before _)
      const prefix = k.split('_')[0];
      if (!prefixGroups[prefix]) prefixGroups[prefix] = [];
      prefixGroups[prefix].push(k);
    }

    let removed = 0;
    for (const [prefix, keys] of Object.entries(prefixGroups)) {
      if (keys.length <= keepPerPrefix) continue;

      // Oldest first
      const withTs = keys.map(k => {
        try {
          const raw = storage.getItem(k);
          if (raw && raw.startsWith('{"v":')) {
            const parsed = JSON.parse(raw);
            return { key: k, t: parsed.t || 0 };
          }
        } catch {}
        return { key: k, t: 0 };
      }).sort((a, b) => a.t - b.t);

      const toRemove = keys.length - keepPerPrefix;
      for (let i = 0; i < toRemove; i++) {
        storage.removeItem(withTs[i].key);
        removed++;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}

// ============================================================
// ✅ SAFE GET ITEM
// ============================================================
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

// ============================================================
// ✅ SAFE REMOVE ITEM
// ============================================================
export function safeRemoveItem(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// ✅ CACHE WITH TTL
// ============================================================
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

// ============================================================
// ✅ REMOVE EXPIRED CACHE
// ============================================================
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

// ============================================================
// ✅ REMOVE OLDEST CACHE (LRU)
// ============================================================
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

// ============================================================
// ✅ AUTO CLEANUP — app start par
// ============================================================
export function runAutoCleanup(storage = localStorage) {
  try {
    const last = storage.getItem(CLEANUP_FLAG_KEY);
    const now = Date.now();

    if (last && now - parseInt(last, 10) < AUTO_CLEANUP_INTERVAL_MS) {
      return { skipped: true };
    }

    const expired = removeExpiredCache(storage);
    const oldest = removeOldestCache(storage, 30);

    // ✅ Prefix-specific trim
    const trimmed = trimPerPrefix(storage, 20);

    storage.setItem(CLEANUP_FLAG_KEY, String(now));
    console.log(`✅ Auto-cleanup (expired: ${expired}, oldest: ${oldest}, trimmed: ${trimmed})`);
    return { expired, oldest, trimmed };
  } catch (e) {
    console.warn('Cleanup error:', e);
    return { error: true };
  }
}

// ============================================================
// ✅ CLEAR ALL CACHE (protected safe)
// ============================================================
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

// ============================================================
// ✅ STORAGE HEALTH CHECK
// ============================================================
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

// ============================================================
// ✅ INIT — app start par call karo
// ============================================================
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
