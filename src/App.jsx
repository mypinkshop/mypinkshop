import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Shop from './pages/Shop';
import TrackOrder from './pages/TrackOrder';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminInventory from './pages/admin/AdminInventory';
import AdminAdvertising from './pages/admin/AdminAdvertising';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import AdminShipping from './pages/admin/AdminShipping';
import AdminTax from './pages/admin/AdminTax';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBrandApplications from './pages/admin/AdminBrandApplications';
import AdminBanners from './pages/admin/AdminBanners';
import AdminReviews from './pages/admin/AdminReviews';
import AdminEditProduct from './pages/admin/AdminEditProduct';
import AdminOffers from './pages/admin/AdminOffers';
import AdminBulkUpload from './pages/admin/AdminBulkUpload';

// ✅ Amazon Importer Component Import
import AmazonImporter from './components/AmazonImporter';

import VendorLogin from './pages/vendor/VendorLogin';
import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorAddProduct from './pages/vendor/VendorAddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorEarnings from './pages/vendor/VendorEarnings';
import VendorBusinessDetails from './pages/vendor/VendorBusinessDetails';
import VendorBrandApplication from './pages/vendor/VendorBrandApplication';
import VendorAds from './pages/vendor/VendorAds';
import VendorShipping from './pages/vendor/VendorShipping';
import VendorTax from './pages/vendor/VendorTax';
import VendorReports from './pages/vendor/VendorReports';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorAccountHealth from './pages/vendor/VendorAccountHealth';
import VendorReturns from './pages/vendor/VendorReturns';
import VendorCoupons from './pages/vendor/VendorCoupons';
import VendorOrderReports from './pages/vendor/VendorOrderReports';
import VendorUserPermissions from './pages/vendor/VendorUserPermissions';
import VendorFBA from './pages/vendor/VendorFBA';
import VendorStoreBuilder from './pages/vendor/VendorStoreBuilder';
import VendorBulkUpload from './pages/vendor/VendorBulkUpload';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ReviewProvider } from './context/ReviewContext';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ContactUs from './pages/ContactUs';
import ShippingInfo from './pages/ShippingInfo';
import ReturnsPolicy from './pages/ReturnsPolicy';
import FAQs from './pages/FAQs';

// ✅ Category Pages
import SkincarePage from './pages/SkincarePage';
import MakeupPage from './pages/MakeupPage';
import ClothingPage from './pages/ClothingPage';
import AccessoriesPage from './pages/AccessoriesPage';
import HairPage from './pages/HairPage';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ReviewProvider>
            <Routes>
              {/* ============ PAGES WITHOUT HEADER/FOOTER (Only Auth Pages) ============ */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/vendor/register" element={<VendorRegister />} />

              {/* ============ PAGES WITH HEADER/FOOTER ============ */}
              <Route element={<Layout />}>
                {/* Main Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
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

                {/* Auth Pages WITH Header/Footer (except login/register) */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                {/* Category Pages */}
                <Route path="/skincare" element={<SkincarePage />} />
                <Route path="/makeup" element={<MakeupPage />} />
                <Route path="/clothing" element={<ClothingPage />} />
                <Route path="/accessories" element={<AccessoriesPage />} />
                <Route path="/hair" element={<HairPage />} />

                {/* Admin Dashboard */}
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

                {/* Vendor Dashboard */}
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/brand-application" element={<VendorBrandApplication />} />
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
              </Route>
            </Routes>
          </ReviewProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
