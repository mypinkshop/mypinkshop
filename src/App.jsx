import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ReviewProvider } from './context/ReviewContext';
import FloatingCartButton from './components/FloatingCartButton';
import AdminAdAnalytics from './pages/admin/AdminAdAnalytics';
import ErrorBoundary from './components/ErrorBoundary';

// ============================================================
// ✅ LAZY WITH RETRY — network hiccup handle karega
// Agar chunk fetch fail ho (404/cache), toh 3 baar retry karega
// ============================================================
function lazyWithRetry(importFn, retries = 3) {
  return lazy(() => {
    return importFn().catch((err) => {
      if (retries <= 0) throw err;

      const key = `lazy_retry_${importFn.toString().slice(0, 50)}`;
      const lastRetry = sessionStorage.getItem(key);
      const now = Date.now();

      // ✅ Ek session mein sirf 1 baar full reload karo (infinite loop avoid)
      if (!lastRetry || now - parseInt(lastRetry) > 10000) {
        sessionStorage.setItem(key, String(now));
        // ✅ Full page reload — naya index.html + fresh chunks
        window.location.reload();
        return new Promise(() => {}); // Never resolve (page reload ho raha)
      }

      // ✅ Wait 1 sec, then retry
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(lazyWithRetry(importFn, retries - 1));
        }, 1000);
      });
    });
  });
}

// ============ CUSTOMER PAGES ============
const Home = lazyWithRetry(() => import('./pages/Home'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const MyOrders = lazyWithRetry(() => import('./pages/MyOrders'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'));
const Shop = lazyWithRetry(() => import('./pages/Shop'));
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));
const Terms = lazyWithRetry(() => import('./pages/Terms'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));
const ContactUs = lazyWithRetry(() => import('./pages/ContactUs'));
const ShippingInfo = lazyWithRetry(() => import('./pages/ShippingInfo'));
const ReturnsPolicy = lazyWithRetry(() => import('./pages/ReturnsPolicy'));
const FAQs = lazyWithRetry(() => import('./pages/FAQs'));

// ✅ IMPORTANT: PAYMENT SUCCESS PAGE
const PaymentSuccess = lazyWithRetry(() => import('./pages/PaymentSuccess'));

// ============ CATEGORY PAGES ============
const SkincarePage = lazyWithRetry(() => import('./pages/SkincarePage'));
const MakeupPage = lazyWithRetry(() => import('./pages/MakeupPage'));
const ClothingPage = lazyWithRetry(() => import('./pages/ClothingPage'));
const AccessoriesPage = lazyWithRetry(() => import('./pages/AccessoriesPage'));
const HairPage = lazyWithRetry(() => import('./pages/HairPage'));

// ============ ADMIN PAGES ============
const AdminLogin = lazyWithRetry(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminVendors = lazyWithRetry(() => import('./pages/admin/AdminVendors'));
const AdminBrandApplications = lazyWithRetry(() => import('./pages/admin/AdminBrandApplications'));
const AdminProducts = lazyWithRetry(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazyWithRetry(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazyWithRetry(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazyWithRetry(() => import('./pages/admin/AdminCustomers'));
const AdminReports = lazyWithRetry(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/AdminSettings'));
const AdminInventory = lazyWithRetry(() => import('./pages/admin/AdminInventory'));
const AdminAdvertising = lazyWithRetry(() => import('./pages/admin/AdminAdvertising'));
const AdminPayments = lazyWithRetry(() => import('./pages/admin/AdminPayments'));
const AdminAddProduct = lazyWithRetry(() => import('./pages/admin/AdminAddProduct'));
const AdminShipping = lazyWithRetry(() => import('./pages/admin/AdminShipping'));
const AdminTax = lazyWithRetry(() => import('./pages/admin/AdminTax'));
const AdminCoupons = lazyWithRetry(() => import('./pages/admin/AdminCoupons'));
const AdminBanners = lazyWithRetry(() => import('./pages/admin/AdminBanners'));
const AdminEditProduct = lazyWithRetry(() => import('./pages/admin/AdminEditProduct'));
const AdminReviews = lazyWithRetry(() => import('./pages/admin/AdminReviews'));
const AdminOffers = lazyWithRetry(() => import('./pages/admin/AdminOffers'));
const AdminBulkUpload = lazyWithRetry(() => import('./pages/admin/AdminBulkUpload'));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/AdminNotifications'));

// ============ VENDOR PAGES ============
const VendorLogin = lazyWithRetry(() => import('./pages/vendor/VendorLogin'));
const VendorRegister = lazyWithRetry(() => import('./pages/vendor/VendorRegister'));
const VendorDashboard = lazyWithRetry(() => import('./pages/vendor/VendorDashboard'));
const VendorBusinessDetails = lazyWithRetry(() => import('./pages/vendor/VendorBusinessDetails'));
const VendorBrandApplication = lazyWithRetry(() => import('./pages/vendor/VendorBrandApplication'));
const VendorProducts = lazyWithRetry(() => import('./pages/vendor/VendorProducts'));
const VendorAddProduct = lazyWithRetry(() => import('./pages/vendor/VendorAddProduct'));
const VendorOrders = lazyWithRetry(() => import('./pages/vendor/VendorOrders'));
const VendorEarnings = lazyWithRetry(() => import('./pages/vendor/VendorEarnings'));
const VendorAds = lazyWithRetry(() => import('./pages/vendor/VendorAds'));
const CreateAd = lazyWithRetry(() => import('./pages/vendor/CreateAd'));
const AdDetail = lazyWithRetry(() => import('./pages/vendor/AdDetail'));
const VendorWallet = lazyWithRetry(() => import('./pages/vendor/VendorWallet'));
const VendorShipping = lazyWithRetry(() => import('./pages/vendor/VendorShipping'));
const VendorTax = lazyWithRetry(() => import('./pages/vendor/VendorTax'));
const VendorReports = lazyWithRetry(() => import('./pages/vendor/VendorReports'));
const VendorSettings = lazyWithRetry(() => import('./pages/vendor/VendorSettings'));
const VendorAccountHealth = lazyWithRetry(() => import('./pages/vendor/VendorAccountHealth'));
const VendorReturns = lazyWithRetry(() => import('./pages/vendor/VendorReturns'));
const VendorCoupons = lazyWithRetry(() => import('./pages/vendor/VendorCoupons'));
const VendorOrderReports = lazyWithRetry(() => import('./pages/vendor/VendorOrderReports'));
const VendorUserPermissions = lazyWithRetry(() => import('./pages/vendor/VendorUserPermissions'));
const VendorFBA = lazyWithRetry(() => import('./pages/vendor/VendorFBA'));
const VendorStoreBuilder = lazyWithRetry(() => import('./pages/vendor/VendorStoreBuilder'));
const VendorBulkUpload = lazyWithRetry(() => import('./pages/vendor/VendorBulkUpload'));
const VendorProfile = lazyWithRetry(() => import('./pages/vendor/VendorProfile'));

// ✅ Amazon Importer Component
const AmazonImporter = lazyWithRetry(() => import('./components/AmazonImporter'));

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ReviewProvider>
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                      </div>
                    </div>
                  }
                >
                  <Routes>
                    {/* ============ CUSTOMER ROUTES ============ */}
                    <Route path="/" element={<Home />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/track-order/:orderId" element={<TrackOrder />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/shipping" element={<ShippingInfo />} />
                    <Route path="/returns" element={<ReturnsPolicy />} />
                    <Route path="/faqs" element={<FAQs />} />
                    <Route path="/payment-callback" element={<PaymentSuccess />} />

                    {/* ============ CATEGORY PAGES ============ */}
                    <Route path="/skincare" element={<SkincarePage />} />
                    <Route path="/makeup" element={<MakeupPage />} />
                    <Route path="/clothing" element={<ClothingPage />} />
                    <Route path="/accessories" element={<AccessoriesPage />} />
                    <Route path="/hair" element={<HairPage />} />

                    {/* ============ ADMIN ROUTES ============ */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/vendors" element={<AdminVendors />} />
                    <Route path="/admin/brand-applications" element={<AdminBrandApplications />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/inventory" element={<AdminInventory />} />
                    <Route path="/admin/advertising" element={<AdminAdvertising />} />
                    <Route path="/admin/payments" element={<AdminPayments />} />
                    <Route path="/admin/add-product" element={<AdminAddProduct />} />
                    <Route path="/admin/shipping" element={<AdminShipping />} />
                    <Route path="/admin/tax" element={<AdminTax />} />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/edit-product/:id" element={<AdminEditProduct />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route path="/admin/offers" element={<AdminOffers />} />
                    <Route path="/admin/bulk-upload" element={<AdminBulkUpload />} />
                    <Route path="/admin/notifications" element={<AdminNotifications />} />
                    <Route path="/admin/ad-analytics" element={<AdminAdAnalytics />} />

                    {/* ============ VENDOR ROUTES ============ */}
                    <Route path="/vendor/login" element={<VendorLogin />} />
                    <Route path="/vendor/register" element={<VendorRegister />} />
                    <Route path="/vendor/brand-application" element={<VendorBrandApplication />} />
                    <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor/business-details" element={<VendorBusinessDetails />} />
                    <Route path="/vendor/products" element={<VendorProducts />} />
                    <Route path="/vendor/add-product" element={<VendorAddProduct />} />
                    <Route path="/vendor/orders" element={<VendorOrders />} />
                    <Route path="/vendor/earnings" element={<VendorEarnings />} />
                    <Route path="/vendor/ads" element={<VendorAds />} />
                    <Route path="/vendor/create-ad" element={<CreateAd />} />
                    <Route path="/vendor/ads/:id" element={<AdDetail />} />
                    <Route path="/vendor/wallet" element={<VendorWallet />} />
                    <Route path="/vendor/shipping" element={<VendorShipping />} />
                    <Route path="/vendor/tax" element={<VendorTax />} />
                    <Route path="/vendor/reports" element={<VendorReports />} />
                    <Route path="/vendor/settings" element={<VendorSettings />} />
                    <Route path="/vendor/account-health" element={<VendorAccountHealth />} />
                    <Route path="/vendor/returns" element={<VendorReturns />} />
                    <Route path="/vendor/coupons" element={<VendorCoupons />} />
                    <Route path="/vendor/order-reports" element={<VendorOrderReports />} />
                    <Route path="/vendor/permissions" element={<VendorUserPermissions />} />
                    <Route path="/vendor/fba" element={<VendorFBA />} />
                    <Route path="/vendor/store-builder" element={<VendorStoreBuilder />} />
                    <Route path="/vendor/bulk-upload" element={<VendorBulkUpload />} />
                    <Route path="/vendor/profile" element={<VendorProfile />} />
                  </Routes>
                </Suspense>

                {/* ✅ FLOATING CART BUTTON */}
                <FloatingCartButton />
              </ReviewProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
