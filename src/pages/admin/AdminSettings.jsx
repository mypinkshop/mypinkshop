import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* =================================================================== */
/* CONSTANTS                                                            */
/* =================================================================== */
const API_URL = `${import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com'}/api`;

const DEFAULT_SETTINGS = {
  // ── BACKEND (settings table) ──
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

  // ── LOCAL-ONLY ──
  siteName: 'MyPinkShop',
  siteEmail: 'contact@mypinkshop.com',
  sitePhone: '+91 9876543210',
  siteAddress: 'Mumbai, India',
  metaTitle: 'MyPinkShop - Shop for Girlies ✨',
  metaDescription: 'Discover the latest in beauty, fashion, and accessories at MyPinkShop.',
  metaKeywords: 'beauty, fashion, skincare, makeup, accessories',
  instagram: 'https://instagram.com/mypinkshop',
  facebook: 'https://facebook.com/mypinkshop',
  youtube: '',
  pinterest: '',
  twitter: '',
  commissionRate: 15,
  razorpayKey: '',
  razorpaySecret: '',
  razorpayEnabled: false,
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
  senderEmail: '',
  senderName: '',
  termsContent: '',
  privacyContent: '',
  returnPolicyContent: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
  primaryColor: '#ec4899',
  secondaryColor: '#f43f5e',
};

// Keys jo backend me save hote hain (POST to /settings/admin)
const BACKEND_KEYS = [
  'freeShippingThreshold', 'shippingCharge', 'expressShippingCharge',
  'taxPercent', 'codCharge', 'codAvailable', 'minOrderValue',
  'deliveryDaysMin', 'deliveryDaysMax', 'cutOffTime',
  'warehousePincode', 'warehouseCity', 'warehouseState', 'freeShippingEnabled',
];

/* =================================================================== */
/* NAV CONFIG                                                           */
/* =================================================================== */
const SECTIONS = [
  { id: 'store', name: 'Store Info', icon: '🏢', description: 'Basic store details' },
  { id: 'shipping', name: 'Shipping & Tax', icon: '🚚', description: 'Charges, thresholds, delivery' },
  { id: 'payment', name: 'Payment', icon: '💳', description: 'COD, gateways, currency' },
  { id: 'seo', name: 'SEO', icon: '🔍', description: 'Search engine optimization' },
  { id: 'social', name: 'Social Media', icon: '📱', description: 'Social links' },
  { id: 'commission', name: 'Commission', icon: '💰', description: 'Vendor commission' },
  { id: 'email', name: 'Email / SMTP', icon: '📧', description: 'Order notifications' },
  { id: 'legal', name: 'Legal Pages', icon: '📜', description: 'Terms, privacy, returns' },
  { id: 'analytics', name: 'Analytics', icon: '📊', description: 'GA, Pixel' },
  { id: 'theme', name: 'Theme', icon: '🎨', description: 'Colors, branding' },
  { id: 'danger', name: 'Danger Zone', icon: '⚠️', description: 'Reset & destructive' },
];

/* =================================================================== */
/* UI PRIMITIVES                                                        */
/* =================================================================== */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && (
          <span className="group relative cursor-help">
            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center">
              ?
            </span>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-20 shadow-lg">
              {hint}
            </span>
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">⚠️ {error}</p>}
    </div>
  );
}

function Input({ prefix, suffix, error, className = '', ...props }) {
  const hasPrefix = !!prefix;
  const hasSuffix = !!suffix;
  return (
    <div className="relative">
      {hasPrefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition text-sm bg-white ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100'
        } ${hasPrefix ? 'pl-8' : ''} ${hasSuffix ? 'pr-12' : ''} ${className}`}
      />
      {hasSuffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Textarea({ label, hint, rows = 4, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        {...props}
        rows={rows}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition text-sm resize-none bg-white"
      />
    </Field>
  );
}

function Card({ title, description, children, actions }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
          <div>
            {title && <h3 className="font-bold text-gray-900 text-base">{title}</h3>}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

/* =================================================================== */
/* MAIN COMPONENT                                                       */
/* =================================================================== */
function AdminSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('shipping');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState({});

  // ✅ Dirty check — kya kuch change hua hai?
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // ✅ Unsaved changes warning
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* --------------------------------------------------------------- */
  /* Load settings                                                    */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadSettings(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async (token) => {
    try {
      setLoading(true);

      // 1. Load backend settings
      let backendData = {};
      try {
        const res = await fetch(`${API_URL}/settings/admin`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }

        if (res.ok) {
          const json = await res.json();
          const raw = json.data || json;

          // Parse snake_case → camelCase
          backendData = {
            freeShippingThreshold: Number(raw.free_shipping_threshold ?? raw.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold),
            shippingCharge: Number(raw.shipping_charge ?? raw.shippingCharge ?? DEFAULT_SETTINGS.shippingCharge),
            expressShippingCharge: Number(raw.express_shipping_charge ?? raw.expressShippingCharge ?? DEFAULT_SETTINGS.expressShippingCharge),
            taxPercent: Number(raw.tax_percent ?? raw.taxPercent ?? DEFAULT_SETTINGS.taxPercent),
            codCharge: Number(raw.cod_charge ?? raw.codCharge ?? DEFAULT_SETTINGS.codCharge),
            codAvailable: (raw.cod_available ?? raw.codAvailable ?? DEFAULT_SETTINGS.codAvailable) === true
              || (raw.cod_available ?? raw.codAvailable) === 'true',
            minOrderValue: Number(raw.min_order_value ?? raw.minOrderValue ?? DEFAULT_SETTINGS.minOrderValue),
            deliveryDaysMin: Number(raw.delivery_days_min ?? raw.deliveryDaysMin ?? DEFAULT_SETTINGS.deliveryDaysMin),
            deliveryDaysMax: Number(raw.delivery_days_max ?? raw.deliveryDaysMax ?? DEFAULT_SETTINGS.deliveryDaysMax),
            cutOffTime: raw.cut_off_time ?? raw.cutOffTime ?? DEFAULT_SETTINGS.cutOffTime,
            warehousePincode: raw.warehouse_pincode ?? raw.warehousePincode ?? DEFAULT_SETTINGS.warehousePincode,
            warehouseCity: raw.warehouse_city ?? raw.warehouseCity ?? DEFAULT_SETTINGS.warehouseCity,
            warehouseState: raw.warehouse_state ?? raw.warehouseState ?? DEFAULT_SETTINGS.warehouseState,
            freeShippingEnabled: (raw.free_shipping_enabled ?? raw.freeShippingEnabled ?? DEFAULT_SETTINGS.freeShippingEnabled) !== 'false'
              && (raw.free_shipping_enabled ?? raw.freeShippingEnabled) !== false,
          };
        }
      } catch (err) {
        console.error('Backend settings load failed:', err);
      }

      // 2. Load local settings
      const localData = JSON.parse(localStorage.getItem('adminSettingsLocal') || '{}');

      // 3. Merge
      const merged = { ...DEFAULT_SETTINGS, ...backendData, ...localData };
      setSettings(merged);
      setOriginalSettings(merged);
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------- */
  /* Save settings                                                    */
  /* --------------------------------------------------------------- */
  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Validate
    const newErrors = {};
    if (settings.deliveryDaysMin > settings.deliveryDaysMax) {
      newErrors.deliveryDaysMax = 'Max days should be >= min days';
    }
    if (settings.expressShippingCharge < settings.shippingCharge) {
      newErrors.expressShippingCharge = 'Express should be >= standard';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix validation errors');
      return;
    }
    setErrors({});

    setSaving(true);

    try {
      // 1. Build backend payload (only backend keys)
      const backendPayload = {};
      for (const key of BACKEND_KEYS) {
        backendPayload[key] = settings[key];
      }

      const res = await fetch(`${API_URL}/settings/admin`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save settings');
      }

      // 2. Save local-only fields
      const localPayload = { ...settings };
      for (const key of BACKEND_KEYS) delete localPayload[key];
      localStorage.setItem('adminSettingsLocal', JSON.stringify(localPayload));

      setOriginalSettings(settings);
      toast.success('✅ Settings saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------------------- */
  /* Reset                                                             */
  /* --------------------------------------------------------------- */
  const resetChanges = () => {
    if (!isDirty) return;
    if (!window.confirm('Discard all unsaved changes?')) return;
    setSettings(originalSettings);
    setErrors({});
    toast.success('Changes discarded');
  };

  const resetSection = (sectionId) => {
    if (!window.confirm(`Reset "${SECTIONS.find(s => s.id === sectionId)?.name}" to defaults?`)) return;
    // Section-specific reset — sirf us section ke fields
    const sectionFields = {
      store: ['siteName', 'siteEmail', 'sitePhone', 'siteAddress'],
      shipping: ['freeShippingThreshold', 'shippingCharge', 'expressShippingCharge', 'taxPercent',
        'minOrderValue', 'deliveryDaysMin', 'deliveryDaysMax', 'cutOffTime',
        'warehousePincode', 'warehouseCity', 'warehouseState', 'freeShippingEnabled'],
      payment: ['codCharge', 'codAvailable', 'razorpayKey', 'razorpaySecret', 'razorpayEnabled',
        'currencySymbol', 'currencyCode'],
      seo: ['metaTitle', 'metaDescription', 'metaKeywords'],
      social: ['instagram', 'facebook', 'youtube', 'pinterest', 'twitter'],
      commission: ['commissionRate'],
      email: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'senderEmail', 'senderName'],
      legal: ['termsContent', 'privacyContent', 'returnPolicyContent'],
      analytics: ['googleAnalyticsId', 'facebookPixelId'],
      theme: ['primaryColor', 'secondaryColor'],
    };
    const fields = sectionFields[sectionId] || [];
    const reset = { ...settings };
    for (const f of fields) reset[f] = DEFAULT_SETTINGS[f];
    setSettings(reset);
    toast.success('Section reset');
  };

  /* --------------------------------------------------------------- */
  /* Change handler                                                   */
  /* --------------------------------------------------------------- */
  const handleChange = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /* --------------------------------------------------------------- */
  /* Filtered sections for search                                     */
  /* --------------------------------------------------------------- */
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  /* --------------------------------------------------------------- */
  /* Shipping preview (live calculator)                               */
  /* --------------------------------------------------------------- */
  const previewSubtotals = [299, 599, 1299];
  const calculatePreview = (subtotal) => {
    const freeShip = settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold;
    const shipping = freeShip ? 0 : Number(settings.shippingCharge) || 0;
    const tax = Math.round(subtotal * (Number(settings.taxPercent) / 100) * 100) / 100;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  };

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ═══════════ TOP BAR ═══════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                ⚙️ Settings
                {isDirty && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    ● UNSAVED
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Manage your store configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isDirty && (
              <button
                onClick={resetChanges}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                ↺ Discard
              </button>
            )}
            <button
              onClick={saveSettings}
              disabled={!isDirty || saving}
              className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                !isDirty || saving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ BODY ═══════════ */}
      <div className="flex-1 flex">
        {/* ── SIDEBAR ── */}
        <aside
          className={`fixed lg:sticky top-[60px] lg:top-[60px] left-0 h-[calc(100vh-60px)] w-72 bg-white border-r border-gray-200 z-30 overflow-y-auto transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 transition"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* Nav */}
            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const isActive = activeSection === section.id;
                const isDanger = section.id === 'danger';
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                      isActive
                        ? isDanger
                          ? 'bg-red-50 border-2 border-red-200'
                          : 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{section.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-bold text-sm truncate ${
                          isActive
                            ? isDanger
                              ? 'text-red-700'
                              : 'text-pink-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {section.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{section.description}</p>
                    </div>
                    {isActive && (
                      <span className={`text-sm ${isDanger ? 'text-red-500' : 'text-pink-500'}`}>
                        →
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {filteredSections.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                No sections match "{searchQuery}"
              </p>
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          />
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Live shipping preview (only on shipping section) */}
            {activeSection === 'shipping' && (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">👁️</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Live Preview</h3>
                    <p className="text-xs text-gray-500">Ye values customers ko dikhengi</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {previewSubtotals.map((st) => {
                    const p = calculatePreview(st);
                    return (
                      <div
                        key={st}
                        className="bg-white/70 backdrop-blur rounded-xl p-3 border border-white"
                      >
                        <p className="text-[10px] text-gray-500 font-semibold mb-2">Cart ₹{st}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ship</span>
                            <span className={p.shipping === 0 ? 'text-green-600 font-bold' : 'font-semibold'}>
                              {p.shipping === 0 ? 'FREE' : `₹${p.shipping}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-semibold">₹{p.tax.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="font-bold text-gray-800">Total</span>
                            <span className="font-bold text-pink-600">₹{p.total.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SECTION: STORE ── */}
            {activeSection === 'store' && (
              <Card
                title="🏢 Store Information"
                description="Basic details shown to customers"
                actions={
                  <button
                    onClick={() => resetSection('store')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Store Name" required>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      placeholder="MyPinkShop"
                    />
                  </Field>
                  <Field label="Contact Email" required>
                    <Input
                      type="email"
                      value={settings.siteEmail}
                      onChange={(e) => handleChange('siteEmail', e.target.value)}
                      placeholder="contact@mypinkshop.com"
                    />
                  </Field>
                  <Field label="Phone Number">
                    <Input
                      value={settings.sitePhone}
                      onChange={(e) => handleChange('sitePhone', e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </Field>
                  <Field label="Store Address">
                    <Input
                      value={settings.siteAddress}
                      onChange={(e) => handleChange('siteAddress', e.target.value)}
                      placeholder="Mumbai, India"
                    />
                  </Field>
                </div>
              </Card>
            )}

            {/* ── SECTION: SHIPPING ── */}
            {activeSection === 'shipping' && (
              <>
                <Card
                  title="🚚 Shipping Charges"
                  description="Order pe shipping charge kaise calculate hoga"
                  actions={
                    <button
                      onClick={() => resetSection('shipping')}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700"
                    >
                      ↺ Reset
                    </button>
                  }
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Free Shipping Enabled</p>
                        <p className="text-xs text-gray-500">
                          Off karo to har order pe shipping charge lagega
                        </p>
                      </div>
                      <Toggle
                        checked={settings.freeShippingEnabled}
                        onChange={(v) => handleChange('freeShippingEnabled', v)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Field label="Free Shipping Above" hint="Is amount se upar wale orders pe shipping free">
                        <Input
                          type="number"
                          min="0"
                          prefix="₹"
                          value={settings.freeShippingThreshold}
                          onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value) || 0)}
                          disabled={!settings.freeShippingEnabled}
                        />
                      </Field>
                      <Field label="Standard Shipping" hint="Normal delivery charge">
                        <Input
                          type="number"
                          min="0"
                          prefix="₹"
                          value={settings.shippingCharge}
                          onChange={(e) => handleChange('shippingCharge', Number(e.target.value) || 0)}
                        />
                      </Field>
                      <Field label="Express Shipping" hint="Fast delivery charge">
                        <Input
                          type="number"
                          min="0"
                          prefix="₹"
                          value={settings.expressShippingCharge}
                          error={errors.expressShippingCharge}
                          onChange={(e) => handleChange('expressShippingCharge', Number(e.target.value) || 0)}
                        />
                      </Field>
                    </div>
                  </div>
                </Card>

                <Card title="💰 Tax" description="Order subtotal pe lagega (GST)">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field label="Tax / GST Percentage" hint="0 rakho to koi tax nahi lagega">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        suffix="%"
                        value={settings.taxPercent}
                        onChange={(e) => handleChange('taxPercent', Number(e.target.value) || 0)}
                      />
                    </Field>
                  </div>
                </Card>

                <Card title="📦 Delivery" description="Delivery time aur cut-off">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field label="Min Delivery Days">
                      <Input
                        type="number"
                        min="1"
                        value={settings.deliveryDaysMin}
                        onChange={(e) => handleChange('deliveryDaysMin', Number(e.target.value) || 1)}
                      />
                    </Field>
                    <Field
                      label="Max Delivery Days"
                      error={errors.deliveryDaysMax}
                    >
                      <Input
                        type="number"
                        min="1"
                        value={settings.deliveryDaysMax}
                        error={errors.deliveryDaysMax}
                        onChange={(e) => handleChange('deliveryDaysMax', Number(e.target.value) || 1)}
                      />
                    </Field>
                    <Field label="Same-day Cut-off Time" hint="Is time ke baad order next day dispatch">
                      <Input
                        type="time"
                        value={settings.cutOffTime}
                        onChange={(e) => handleChange('cutOffTime', e.target.value)}
                      />
                    </Field>
                  </div>
                </Card>

                <Card title="🏭 Warehouse" description="Pickup address (Shiprocket)">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field label="Pincode">
                      <Input
                        maxLength="6"
                        value={settings.warehousePincode}
                        onChange={(e) => handleChange('warehousePincode', e.target.value.replace(/\D/g, ''))}
                        placeholder="400072"
                      />
                    </Field>
                    <Field label="City">
                      <Input
                        value={settings.warehouseCity}
                        onChange={(e) => handleChange('warehouseCity', e.target.value)}
                        placeholder="Mumbai"
                      />
                    </Field>
                    <Field label="State">
                      <Input
                        value={settings.warehouseState}
                        onChange={(e) => handleChange('warehouseState', e.target.value)}
                        placeholder="Maharashtra"
                      />
                    </Field>
                  </div>
                </Card>
              </>
            )}

            {/* ── SECTION: PAYMENT ── */}
            {activeSection === 'payment' && (
              <>
                <Card
                  title="💳 Cash on Delivery"
                  description="COD settings"
                  actions={
                    <button
                      onClick={() => resetSection('payment')}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700"
                    >
                      ↺ Reset
                    </button>
                  }
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">COD Available</p>
                        <p className="text-xs text-gray-500">Off karo to sirf online payment</p>
                      </div>
                      <Toggle
                        checked={settings.codAvailable}
                        onChange={(v) => handleChange('codAvailable', v)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="COD Extra Charge" hint="COD order pe extra charge (0 = free)">
                        <Input
                          type="number"
                          min="0"
                          prefix="₹"
                          value={settings.codCharge}
                          onChange={(e) => handleChange('codCharge', Number(e.target.value) || 0)}
                          disabled={!settings.codAvailable}
                        />
                      </Field>
                      <Field label="Minimum Order Value" hint="0 = koi minimum nahi">
                        <Input
                          type="number"
                          min="0"
                          prefix="₹"
                          value={settings.minOrderValue}
                          onChange={(e) => handleChange('minOrderValue', Number(e.target.value) || 0)}
                        />
                      </Field>
                    </div>
                  </div>
                </Card>

                <Card title="💳 Razorpay" description="Online payment gateway (coming soon)">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Enable Razorpay</p>
                        <p className="text-xs text-gray-500">Card / Netbanking payments</p>
                      </div>
                      <Toggle
                        checked={settings.razorpayEnabled}
                        onChange={(v) => handleChange('razorpayEnabled', v)}
                      />
                    </div>
                    {settings.razorpayEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Razorpay Key ID">
                          <Input
                            value={settings.razorpayKey}
                            onChange={(e) => handleChange('razorpayKey', e.target.value)}
                            placeholder="rzp_live_xxxxxxxxx"
                          />
                        </Field>
                        <Field label="Razorpay Secret">
                          <Input
                            type="password"
                            value={settings.razorpaySecret}
                            onChange={(e) => handleChange('razorpaySecret', e.target.value)}
                            placeholder="••••••••"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="💱 Currency">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Currency Symbol">
                      <Input
                        value={settings.currencySymbol}
                        onChange={(e) => handleChange('currencySymbol', e.target.value)}
                        placeholder="₹"
                      />
                    </Field>
                    <Field label="Currency Code">
                      <Input
                        value={settings.currencyCode}
                        onChange={(e) => handleChange('currencyCode', e.target.value)}
                        placeholder="INR"
                      />
                    </Field>
                  </div>
                </Card>
              </>
            )}

            {/* ── SECTION: SEO ── */}
            {activeSection === 'seo' && (
              <Card
                title="🔍 SEO"
                description="Search engine optimization"
                actions={
                  <button
                    onClick={() => resetSection('seo')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="space-y-5">
                  <Field label="Meta Title" hint="50-60 characters best">
                    <Input
                      value={settings.metaTitle}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      maxLength="70"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {settings.metaTitle.length}/60
                    </p>
                  </Field>
                  <Textarea
                    label="Meta Description"
                    hint="150-160 characters best"
                    rows={3}
                    value={settings.metaDescription}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    maxLength="200"
                  />
                  <Field label="Meta Keywords" hint="Comma separated">
                    <Input
                      value={settings.metaKeywords}
                      onChange={(e) => handleChange('metaKeywords', e.target.value)}
                      placeholder="beauty, fashion, skincare"
                    />
                  </Field>
                </div>
              </Card>
            )}

            {/* ── SECTION: SOCIAL ── */}
            {activeSection === 'social' && (
              <Card
                title="📱 Social Media"
                description="Social links"
                actions={
                  <button
                    onClick={() => resetSection('social')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'instagram', label: '📸 Instagram' },
                    { key: 'facebook', label: '👍 Facebook' },
                    { key: 'youtube', label: '📺 YouTube' },
                    { key: 'pinterest', label: '📌 Pinterest' },
                    { key: 'twitter', label: '🐦 Twitter / X' },
                  ].map((s) => (
                    <Field key={s.key} label={s.label}>
                      <Input
                        type="url"
                        value={settings[s.key]}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        placeholder="https://..."
                      />
                    </Field>
                  ))}
                </div>
              </Card>
            )}

            {/* ── SECTION: COMMISSION ── */}
            {activeSection === 'commission' && (
              <Card
                title="💰 Commission"
                description="Vendor sale se admin ka cut"
                actions={
                  <button
                    onClick={() => resetSection('commission')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <Field label="Commission Rate" hint="Vendor ki har sale se % cut">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    suffix="%"
                    value={settings.commissionRate}
                    onChange={(e) => handleChange('commissionRate', Number(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </Field>
              </Card>
            )}

            {/* ── SECTION: EMAIL ── */}
            {activeSection === 'email' && (
              <Card
                title="📧 Email / SMTP"
                description="Order notifications"
                actions={
                  <button
                    onClick={() => resetSection('email')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
                    { key: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
                    { key: 'smtpUser', label: 'SMTP Username', placeholder: 'your@email.com' },
                    { key: 'smtpPass', label: 'SMTP Password', type: 'password', placeholder: '••••••••' },
                    { key: 'senderEmail', label: 'Sender Email', type: 'email', placeholder: 'noreply@mypinkshop.com' },
                    { key: 'senderName', label: 'Sender Name', placeholder: 'MyPinkShop' },
                  ].map((f) => (
                    <Field key={f.key} label={f.label}>
                      <Input
                        type={f.type || 'text'}
                        value={settings[f.key]}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                      />
                    </Field>
                  ))}
                </div>
              </Card>
            )}

            {/* ── SECTION: LEGAL ── */}
            {activeSection === 'legal' && (
              <Card
                title="📜 Legal Pages"
                description="Terms, privacy, returns"
                actions={
                  <button
                    onClick={() => resetSection('legal')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="space-y-5">
                  <Textarea
                    label="Terms of Service"
                    value={settings.termsContent}
                    onChange={(e) => handleChange('termsContent', e.target.value)}
                    placeholder="Terms of service content..."
                    rows={5}
                  />
                  <Textarea
                    label="Privacy Policy"
                    value={settings.privacyContent}
                    onChange={(e) => handleChange('privacyContent', e.target.value)}
                    placeholder="Privacy policy content..."
                    rows={5}
                  />
                  <Textarea
                    label="Return Policy"
                    value={settings.returnPolicyContent}
                    onChange={(e) => handleChange('returnPolicyContent', e.target.value)}
                    placeholder="Return policy content..."
                    rows={5}
                  />
                </div>
              </Card>
            )}

            {/* ── SECTION: ANALYTICS ── */}
            {activeSection === 'analytics' && (
              <Card
                title="📊 Analytics & Tracking"
                actions={
                  <button
                    onClick={() => resetSection('analytics')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="space-y-5">
                  <Field label="Google Analytics ID" hint="G-XXXXXXXXXX">
                    <Input
                      value={settings.googleAnalyticsId}
                      onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </Field>
                  <Field label="Facebook Pixel ID">
                    <Input
                      value={settings.facebookPixelId}
                      onChange={(e) => handleChange('facebookPixelId', e.target.value)}
                      placeholder="123456789012345"
                    />
                  </Field>
                </div>
              </Card>
            )}

            {/* ── SECTION: THEME ── */}
            {activeSection === 'theme' && (
              <Card
                title="🎨 Theme"
                description="Colors & branding"
                actions={
                  <button
                    onClick={() => resetSection('theme')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    ↺ Reset
                  </button>
                }
              >
                <div className="space-y-5">
                  {[
                    { key: 'primaryColor', label: 'Primary Color' },
                    { key: 'secondaryColor', label: 'Secondary Color' },
                  ].map((c) => (
                    <Field key={c.key} label={c.label}>
                      <div className="flex gap-3 items-center max-w-md">
                        <input
                          type="color"
                          value={settings[c.key]}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="w-14 h-14 border-2 border-gray-200 rounded-xl cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings[c.key]}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition text-sm font-mono"
                        />
                      </div>
                    </Field>
                  ))}
                </div>
              </Card>
            )}

            {/* ── SECTION: DANGER ZONE ── */}
            {activeSection === 'danger' && (
              <Card
                title="⚠️ Danger Zone"
                description="Irreversible actions — careful!"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 p-4 border-2 border-red-200 bg-red-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="font-bold text-red-900 text-sm">Reset All Settings</p>
                      <p className="text-xs text-red-700 mt-0.5">
                        Sab settings ko default values pe reset kar dega. Ye undo nahi ho sakta.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Reset ALL settings to defaults? This cannot be undone.')) return;
                        if (!window.confirm('Are you REALLY sure? This will overwrite everything.')) return;
                        setSettings(DEFAULT_SETTINGS);
                        setOriginalSettings(DEFAULT_SETTINGS);
                        toast.success('Reset locally. Save karo to persist hoga.');
                      }}
                      className="flex-shrink-0 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* ═══════════ BOTTOM STICKY BAR (mobile) ═══════════ */}
      {isDirty && (
        <div className="sticky bottom-0 lg:hidden bg-white border-t-2 border-pink-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3 z-30">
          <button
            onClick={resetChanges}
            className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Discard
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
