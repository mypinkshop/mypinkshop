import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Checkout() {
  const { cart, cartTotal, clearCart, removeFromCart, updateQuantity } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    saveAddress: true,
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [shippingInfo, setShippingInfo] = useState({
    deliverable: true,
    estimatedDelivery: null,
    shippingCharge: 0,
    freeShippingThreshold: 499,
    checking: false,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const subtotal = cartTotal();           // ✅ Product amount (GST already included)
  const discount = couponDiscount;

  // ✅ Shipping only — no separate GST
  const deliveryCharges =
    subtotal >= (shippingInfo.freeShippingThreshold || 499)
      ? 0
      : Number(shippingInfo.shippingCharge) || 0;

  // ✅ Total = Subtotal + Shipping − Discount
  const total = subtotal + deliveryCharges - discount;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    const loadShippingSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shipping/settings`);
        const data = await response.json();
        if (data.success || data.data) {
          const settings = data.data || data.settings || data;
          setShippingInfo((prev) => ({
            ...prev,
            freeShippingThreshold: settings.freeShippingThreshold || 499,
          }));
        }
      } catch (error) {
        console.error('Error loading shipping settings:', error);
      }
    };
    loadShippingSettings();
  }, [API_URL]);

  useEffect(() => {
    const checkDelivery = async () => {
      if (formData.pincode && formData.pincode.length === 6) {
        setShippingInfo((prev) => ({ ...prev, checking: true }));
        try {
          const response = await fetch(`${API_URL}/api/shipping/check-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pincode: formData.pincode,
              cartTotal: subtotal,
              weight: 0.5,
            }),
          });
          const data = await response.json();
          const deliveryData = data.data || data;

          if (deliveryData.success !== false) {
            setShippingInfo({
              deliverable: true,
              estimatedDelivery: deliveryData.estimatedDelivery,
              shippingCharge: deliveryData.shippingCharge || 0,
              freeShippingThreshold: deliveryData.freeShippingThreshold || 499,
              checking: false,
            });
          } else {
            setShippingInfo((prev) => ({
              ...prev,
              deliverable: false,
              checking: false,
              estimatedDelivery: null,
            }));
          }
        } catch (error) {
          console.error('Delivery check error:', error);
          setShippingInfo((prev) => ({
            ...prev,
            checking: false,
            estimatedDelivery: { maxDays: 4 },
          }));
        }
      }
    };

    const timeoutId = setTimeout(checkDelivery, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.pincode, subtotal, API_URL]);

  useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
    const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    setSavedAddresses(addresses);
    if (user) {
      setFormData((prev) => ({ ...prev, email: user.email, fullName: user.name || '' }));
    }
  }, [cart.length, navigate, orderPlaced, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (address) => {
    if (selectedAddress === address.id) {
      setSelectedAddress(null);
      setFormData({ ...formData, fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
    } else {
      setSelectedAddress(address.id);
      setFormData({
        ...formData,
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      });
      setIsEditing(false);
      setEditingAddressId(null);
      toast.success('Address selected! ✨');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setIsEditing(true);
    setFormData({
      ...formData,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setSelectedAddress(null);
  };

  const saveEditedAddress = () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast.error('Please fill all fields');
      return;
    }

    const updatedAddresses = savedAddresses.map((addr) => {
      if (addr.id === editingAddressId) {
        return {
          ...addr,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        };
      }
      return addr;
    });

    setSavedAddresses(updatedAddresses);
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    setEditingAddressId(null);
    setIsEditing(false);
    setSelectedAddress(null);
    toast.success('Address updated successfully!');
  };

  const handleDeleteAddress = (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    const updatedAddresses = savedAddresses.filter((addr) => addr.id !== addressId);
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));

    if (selectedAddress === addressId) {
      setSelectedAddress(null);
      setFormData({ ...formData, fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
    }
    toast.success('Address deleted successfully!');
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    setIsEditing(false);
    setFormData({ ...formData, fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
    setSelectedAddress(null);
  };

  const saveNewAddress = () => {
    const newAddress = {
      id: Date.now(),
      fullName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    };

    const duplicate = savedAddresses.find(
      (addr) =>
        addr.pincode === newAddress.pincode &&
        addr.fullName.toLowerCase() === newAddress.fullName.toLowerCase() &&
        addr.address.toLowerCase() === newAddress.address.toLowerCase() &&
        addr.city.toLowerCase() === newAddress.city.toLowerCase() &&
        addr.phone === newAddress.phone
    );

    if (!duplicate) {
      const updatedAddresses = [...savedAddresses, newAddress];
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      return true;
    }
    return false;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);

    try {
      const response = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: subtotal,
          userId: user?._id || null,
        }),
      });

      const data = await response.json();
      const result = data.data || data;

      if (result.valid) {
        setCouponDiscount(result.discountAmount);
        setCouponApplied(true);
        toast.success(`🎉 Coupon applied! You saved ₹${result.discountAmount}`);
      } else {
        setCouponDiscount(0);
        setCouponApplied(false);
        toast.error(data.error || result.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error('Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    toast.success('Coupon removed');
  };

  const handlePhonePePayment = async (newOrderId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

      const payResponse = await fetch(`${API_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: newOrderId }),
      });

      const payData = await payResponse.json();
      const paymentInfo = payData.data || payData;

      if (!payResponse.ok || !paymentInfo.redirectUrl) {
        throw new Error(payData.error || 'Failed to initiate payment');
      }

      toast.success('Redirecting to PhonePe...');
      window.location.href = paymentInfo.redirectUrl;
    } catch (error) {
      console.error('PhonePe Payment Error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      throw error;
    }
  };

  const placeOrder = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    if (!token) {
      toast.error('Please login to place your order');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast.error('Please fill all address fields');
      return;
    }

    if (!shippingInfo.deliverable && formData.pincode.length === 6) {
      toast.error('Sorry, we do not deliver to this pincode');
      return;
    }

    setIsPlacingOrder(true);
    setOrderTotal(total);

    if (formData.saveAddress && !isEditing) {
      saveNewAddress();
    }

    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
          variationName: item.variationName || null,
          variationSecondary: item.variationSecondary || null,
          vendorId: item.vendorId || null,
        })),
        total: total,
        address: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country || 'India',
        },
        paymentMethod: paymentMethod || 'cod',
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const result = data.data || data;
      const newOrderId =
        result.orderNumber ||
        result.order_number ||
        result.orderId ||
        result.order?.id ||
        result.order?._id;

      if (!newOrderId) {
        throw new Error('Order ID missing from server response');
      }

      if (formData.saveAddress) {
        fetch(`${API_URL}/api/users/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.fullName,
            phone: formData.phone,
            line1: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            isDefault: false,
          }),
        }).catch((err) => console.log('Address sync warning:', err));
      }

      if (paymentMethod === 'upi') {
        await handlePhonePePayment(newOrderId);
        setIsPlacingOrder(false);
        return;
      }

      setOrderId(newOrderId);
      clearCart();
      setOrderPlaced(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const paymentOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
    { id: 'upi', name: 'PhonePe / UPI', icon: '📱', description: 'PhonePe, Google Pay, Paytm' },
  ];

  const getDeliveryDateDisplay = () => {
    if (!shippingInfo.estimatedDelivery) return 'Check pincode for delivery estimate';
    if (shippingInfo.estimatedDelivery.minDate && shippingInfo.estimatedDelivery.maxDate) {
      if (shippingInfo.estimatedDelivery.minDate === shippingInfo.estimatedDelivery.maxDate) {
        return `Expected delivery on ${shippingInfo.estimatedDelivery.minDate}`;
      }
      return `Expected delivery between ${shippingInfo.estimatedDelivery.minDate} - ${shippingInfo.estimatedDelivery.maxDate}`;
    }
    if (shippingInfo.estimatedDelivery.maxDays) {
      return `Expected delivery in ${shippingInfo.estimatedDelivery.maxDays} business days`;
    }
    return 'Delivery available (4-5 business days)';
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
        <Helmet>
          <title>Order Confirmed - MyPinkShop</title>
        </Helmet>
        <OfferBanner />

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    MyPinkShop
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-pink-500 font-semibold tracking-wider">
                    FOR THE GIRLIES ✨
                  </p>
                </div>
              </Link>

              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Avatar user={user} onLogout={logout} />
                ) : (
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-5xl text-green-600 font-bold">✓</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Order Placed Successfully! 🎉
            </h1>

            <p className="text-gray-500 mb-2">
              Order ID: <span className="font-semibold text-pink-600 font-mono text-base">{orderId}</span>
            </p>
            <p className="text-gray-600 mb-6 text-sm">
              Your order has been confirmed and is being prepared for dispatch.
            </p>

            <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left border border-green-100 shadow-sm">
              <p className="font-semibold text-green-800 mb-1 flex items-center gap-1.5">
                <span>📦</span> Delivery Estimate
              </p>
              <p className="text-green-700 text-sm font-medium">{getDeliveryDateDisplay()}</p>
            </div>

            <div className="bg-pink-50 rounded-2xl p-5 mb-8 text-left border border-pink-100 shadow-sm space-y-2">
              <p className="font-bold text-gray-800 text-sm mb-3 pb-2 border-b border-pink-200/50 flex items-center gap-1.5">
                <span>📋</span> Order Summary
              </p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Amount:</span>
                <span className="font-bold text-pink-600 text-base">₹{orderTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-gray-800 uppercase">
                  {paymentOptions.find((m) => m.id === paymentMethod)?.name || paymentMethod}
                </span>
              </div>
              <div className="pt-2 border-t border-pink-200/50">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">📍 Delivered To:</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">{formData.fullName}</strong> ({formData.phone})
                  <br />
                  {formData.address}, {formData.city}, {formData.state} -{' '}
                  <span className="font-mono font-medium">{formData.pincode}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/profile?tab=orders"
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
              >
                View My Orders 📦
              </Link>
              <Link
                to="/shop"
                className="border-2 border-pink-500 text-pink-600 px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-all"
              >
                Continue Shopping →
              </Link>
            </div>
          </div>
        </div>

        <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - MyPinkShop | Secure Checkout</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
        <OfferBanner />

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    MyPinkShop
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-pink-500 font-semibold tracking-wider">
                    FOR THE GIRLIES ✨
                  </p>
                </div>
              </Link>

              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {cart.length}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Avatar user={user} onLogout={logout} />
                ) : (
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/cart" className="text-gray-500 hover:text-pink-500 transition">Cart</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Checkout</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            <div className="lg:col-span-2 space-y-5">

              {/* STEPPER */}
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-10 right-10 top-5 h-0.5 bg-gray-200 hidden sm:block">
                    <div
                      className={`h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                        step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'
                      }`}
                    ></div>
                  </div>

                  {[
                    { step: 1, label: 'Address', icon: '📍' },
                    { step: 2, label: 'Delivery', icon: '🚚' },
                    { step: 3, label: 'Payment', icon: '💳' },
                  ].map((s) => (
                    <div key={s.step} className="flex flex-col items-center relative z-10 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                          step >= s.step
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 scale-105'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {step > s.step ? '✓' : s.icon}
                      </div>
                      <p
                        className={`text-xs mt-2 font-medium ${
                          step >= s.step ? 'text-pink-600' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 1 — ADDRESS */}
              {step === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                      <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                    </div>
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-3">📌 Saved Addresses</p>
                      <div className="grid grid-cols-1 gap-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleAddressSelect(addr)}
                            className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                              selectedAddress === addr.id
                                ? 'border-pink-500 bg-pink-50 shadow-md'
                                : 'border-gray-200 hover:border-pink-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="savedAddress"
                                checked={selectedAddress === addr.id}
                                onChange={() => {}}
                                className="mt-1 w-4 h-4 accent-pink-500 flex-shrink-0 pointer-events-none"
                              />
                              <div className="flex-1 pointer-events-none">
                                <p className="font-semibold text-gray-900">{addr.fullName}</p>
                                <p className="text-sm text-gray-500">
                                  {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleEditAddress(addr)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {editingAddressId === addr.id && (
                              <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                <p className="text-xs text-blue-600 font-medium mb-2">✏️ Editing this address...</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEditedAddress}
                                    className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-1.5 bg-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-300 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {selectedAddress === addr.id && !editingAddressId && (
                              <div className="mt-3 pt-3 border-t border-pink-200" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setStep(2);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                                >
                                  Continue to Delivery 🚚 →
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-pink-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 bg-white text-gray-400 font-medium">or add new address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street, building, area"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        maxLength="6"
                        placeholder="6-digit pincode"
                        className="w-full px-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                        required
                      />
                      {shippingInfo.checking && (
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <span className="animate-spin">⏳</span> Checking...
                        </p>
                      )}
                      {!shippingInfo.checking && formData.pincode.length === 6 && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                          ✅ {getDeliveryDateDisplay()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={formData.saveAddress}
                        onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                        className="w-4 h-4 accent-pink-500 rounded"
                      />
                      <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-600">
                        Save this address for future
                      </label>
                    </div>
                  </div>

                  {!selectedAddress && (
                    <button
                      onClick={() => {
                        if (formData.fullName && formData.phone && formData.address && formData.city && formData.pincode) {
                          setStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          toast.error('Please fill all required address fields');
                        }
                      }}
                      className="mt-6 w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                      Continue to Delivery 🚚 →
                    </button>
                  )}
                </div>
              )}

              {/* STEP 2 — DELIVERY */}
              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition font-medium text-sm"
                    >
                      ← Back to Address
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">🚚</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Delivery Options</h2>
                      <p className="text-sm text-gray-500">How fast do you want it?</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        true ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="delivery"
                          defaultChecked
                          className="w-4 h-4 accent-pink-500"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Standard Delivery</p>
                          <p className="text-sm text-gray-500">📦 {getDeliveryDateDisplay()}</p>
                        </div>
                      </div>
                      <p
                        className={`font-bold text-lg ${
                          deliveryCharges === 0 ? 'text-green-600' : 'text-gray-800'
                        }`}
                      >
                        {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                      </p>
                    </label>
                  </div>

                  {subtotal < shippingInfo.freeShippingThreshold && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        🚚 Add ₹{shippingInfo.freeShippingThreshold - subtotal} more for{' '}
                        <strong>FREE delivery</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                      Continue to Payment 💳 →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 — PAYMENT */}
              {step === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition font-medium text-sm"
                    >
                      ← Back to Delivery
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">💳</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                      <p className="text-sm text-gray-500">Choose how you want to pay</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === option.id
                            ? 'border-pink-500 bg-pink-50 shadow-md'
                            : 'border-gray-200 hover:border-pink-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.id}
                          checked={paymentMethod === option.id}
                          onChange={() => setPaymentMethod(option.id)}
                          className="w-4 h-4 accent-pink-500"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <span>{option.icon}</span> {option.name}
                          </p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={placeOrder}
                      disabled={isPlacingOrder}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPlacingOrder ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Placing Order...
                        </span>
                      ) : (
                        `Place Order • ₹${total.toLocaleString()}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ORDER SUMMARY SIDEBAR */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-6 lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🛒</span>
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                  <span className="ml-auto text-xs bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full font-bold">
                    {cart.length} items
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-pink-50">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-pink-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🛍️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-800 truncate">{item.name}</p>
                        {item.variationName && (
                          <p className="text-[10px] text-gray-500">
                            {item.variationName}
                            {item.variationSecondary && ` • ${item.variationSecondary}`}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-pink-100 rounded text-pink-600 font-bold hover:bg-pink-200"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-gray-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-pink-100 rounded text-pink-600 font-bold hover:bg-pink-200"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-bold text-pink-600 mt-1">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success('Item removed');
                        }}
                        className="text-red-500 hover:text-red-700 text-xs self-start mt-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* COUPON */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 border-2 border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition uppercase font-mono bg-white"
                      disabled={couponApplied}
                    />
                    {couponApplied ? (
                      <button
                        onClick={removeCoupon}
                        className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={applyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-bold hover:shadow-md transition disabled:opacity-50"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>

                {/* SUMMARY — NO SEPARATE GST */}
                <div className="space-y-2.5 text-sm border-t border-pink-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>💰 Coupon Discount</span>
                      <span className="font-bold">−₹{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span
                      className={`font-semibold ${
                        deliveryCharges === 0 ? 'text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {deliveryCharges === 0 ? 'FREE 🎉' : `₹${deliveryCharges}`}
                    </span>
                  </div>

                  <div className="flex justify-between pt-3 border-t-2 border-pink-100">
                    <span className="font-bold text-gray-900 text-base">Total</span>
                    <span className="font-bold text-pink-600 text-xl">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 text-right pt-1">
                    Inclusive of all taxes
                  </p>
                </div>

                {formData.address && (
                  <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-100">
                    <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                      📍 Delivery Address
                    </p>
                    <p className="text-sm text-gray-900 font-semibold">{formData.fullName}</p>
                    <p className="text-xs text-gray-600">
                      {formData.address}, {formData.city} - {formData.pincode}
                    </p>
                    <p className="text-xs text-gray-600">📞 {formData.phone}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-pink-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg">🔒</div>
                    <p className="text-[10px] text-gray-500 font-medium">Secure</p>
                  </div>
                  <div>
                    <div className="text-lg">💳</div>
                    <p className="text-[10px] text-gray-500 font-medium">UPI / COD</p>
                  </div>
                  <div>
                    <div className="text-lg">🚚</div>
                    <p className="text-[10px] text-gray-500 font-medium">Free ₹499+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-gray-900 text-gray-400 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500 transition">Hair</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">Facebook</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-gray-800">
              <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
              <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Checkout;
