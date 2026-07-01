import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ReviewProvider } from './context/ReviewContext';
import FloatingCartButton from './components/FloatingCartButton'; // ✅ ADDED
import VendorWallet from './pages/vendor/VendorWallet';

// ✅ CUSTOMER PAGES - Lazy Loaded
const Home = lazy(() => import('./pages/Home'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Shop = lazy(() => import('./pages/Shop'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const ShippingInfo = lazy(() => import('./pages/ShippingInfo'));
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'));
const FAQs = lazy(() => import('./pages/FAQs'));

// ✅ CATEGORY PAGES - Lazy Loaded
const SkincarePage = lazy(() => import('./pages/SkincarePage'));
const MakeupPage = lazy(() => import('./pages/MakeupPage'));
const ClothingPage = lazy(() => import('./pages/ClothingPage'));
const AccessoriesPage = lazy(() => import('./pages/AccessoriesPage'));
const HairPage = lazy(() => import('./pages/HairPage'));

// ✅ ADMIN PAGES - Lazy Loaded
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminBrandApplications = lazy(() => import('./pages/admin/AdminBrandApplications'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminAdvertising = lazy(() => import('./pages/admin/AdminAdvertising'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminAddProduct = lazy(() => import('./pages/admin/AdminAddProduct'));
const AdminShipping = lazy(() => import('./pages/admin/AdminShipping'));
const AdminTax = lazy(() => import('./pages/admin/AdminTax'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminEditProduct = lazy(() => import('./pages/admin/AdminEditProduct'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminBulkUpload = lazy(() => import('./pages/admin/AdminBulkUpload'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

// ✅ VENDOR PAGES - Lazy Loaded
const VendorLogin = lazy(() => import('./pages/vendor/VendorLogin'));
const VendorRegister = lazy(() => import('./pages/vendor/VendorRegister'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorBusinessDetails = lazy(() => import('./pages/vendor/VendorBusinessDetails'));
const VendorBrandApplication = lazy(() => import('./pages/vendor/VendorBrandApplication'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorAddProduct = lazy(() => import('./pages/vendor/VendorAddProduct'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorEarnings = lazy(() => import('./pages/vendor/VendorEarnings'));
const VendorAds = lazy(() => import('./pages/vendor/VendorAds'));
const VendorShipping = lazy(() => import('./pages/vendor/VendorShipping'));
const VendorTax = lazy(() => import('./pages/vendor/VendorTax'));
const VendorReports = lazy(() => import('./pages/vendor/VendorReports'));
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings'));
const VendorAccountHealth = lazy(() => import('./pages/vendor/VendorAccountHealth'));
const VendorReturns = lazy(() => import('./pages/vendor/VendorReturns'));
const VendorCoupons = lazy(() => import('./pages/vendor/VendorCoupons'));
const VendorOrderReports = lazy(() => import('./pages/vendor/VendorOrderReports'));
const VendorUserPermissions = lazy(() => import('./pages/vendor/VendorUserPermissions'));
const VendorFBA = lazy(() => import('./pages/vendor/VendorFBA'));
const VendorStoreBuilder = lazy(() => import('./pages/vendor/VendorStoreBuilder'));
const VendorBulkUpload = lazy(() => import('./pages/vendor/VendorBulkUpload'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));

// ✅ Amazon Importer Component - Lazy Loaded
const AmazonImporter = lazy(() => import('./components/AmazonImporter'));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <ReviewProvider>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                  </div>
                </div>
              }>
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
                  <Route path="/vendor/wallet" element={<VendorWallet />} />
                </Routes>
              </Suspense>

              {/* ✅ FLOATING CART BUTTON - Shows on all pages */}
              <FloatingCartButton />
              
            </ReviewProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
