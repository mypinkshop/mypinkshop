import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import VendorLogin from './pages/vendor/VendorLogin';
import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorAddProduct from './pages/vendor/VendorAddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorEarnings from './pages/vendor/VendorEarnings';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
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
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
            
            {/* Vendor Routes */}
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/add-product" element={<VendorAddProduct />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            <Route path="/vendor/earnings" element={<VendorEarnings />} />
          </Routes>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
