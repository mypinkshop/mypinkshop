import { Routes, Route } from 'react-router-dom';
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
import VendorLogin from './pages/vendor/VendorLogin';
import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorAddProduct from './pages/vendor/VendorAddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorEarnings from './pages/vendor/VendorEarnings';
import VendorBusinessDetails from './pages/vendor/VendorBusinessDetails';
import VendorAds from './pages/vendor/VendorAds';
import VendorShipping from './pages/vendor/VendorShipping';
import VendorTax from './pages/vendor/VendorTax';
import VendorReports from './pages/vendor/VendorReports';
import VendorSettings from './pages/vendor/VendorSettings';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ReviewProvider } from './context/ReviewContext';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ReviewProvider>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/track-order/:orderId" element={<TrackOrder />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/vendors" element={<AdminVendors />} />
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
              
              {/* Vendor Routes */}
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/vendor/register" element={<VendorRegister />} />
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
            </Routes>
          </ReviewProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
