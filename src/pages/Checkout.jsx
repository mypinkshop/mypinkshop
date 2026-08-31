import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
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
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    deliverable: true,
    estimatedDelivery: null,
    shippingCharge: 0,
    freeShippingThreshold: 999,
    cutOffTime: '16:00',
    checking: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const subtotal = cartTotal();
  const discount = couponDiscount;
  const tax = Math.round((subtotal - discount) * 0.05);
  const deliveryCharges = shippingInfo.shippingCharge;
  const total = subtotal - discount + tax + deliveryCharges;

  // ✅ Nykaa Style Order ID Generator
  const generateOrderId = () => {
    const prefix = 'MPS';
    const part1 = Math.floor(Math.random() * 900000000 + 100000000).toString();
    const part2 = Math.floor(Math.random() * 9000000 + 1000000).toString();
    const part3 = Math.floor(Math.random() * 9 + 1).toString();
    return `${prefix}-${part1}-${part2}-${part3}`;
  };

  useEffect(() => {
    const loadShippingSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shipping/settings`);
        const data = await response.json();
        if (data.success) {
          setShippingInfo(prev => ({
            ...prev,
            freeShippingThreshold: data.settings.freeShippingThreshold,
            cutOffTime: data.settings.cutOffTime
          }));
        }
      } catch (error) {
        console.error('Error loading shipping settings:', error);
      }
    };
    loadShippingSettings();
  }, []);

  useEffect(() => {
    const checkDelivery = async () => {
      if (formData.pincode && formData.pincode.length === 6) {
        setShippingInfo(prev => ({ ...prev, checking: true }));
        try {
          const response = await fetch(`${API_URL}/api/shipping/check-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pincode: formData.pincode,
              cartTotal: subtotal,
              weight: 0.5
            })
          });
          const data = await response.json();
          
          if (data.success && data.deliverable) {
            setShippingInfo({
              deliverable: true,
              estimatedDelivery: data.estimatedDelivery,
              shippingCharge: data.shippingCharge,
              freeShippingThreshold: data.freeShippingThreshold,
              cutOffTime: data.cutOffTime,
              checking: false
            });
          } else {
            setShippingInfo(prev => ({
              ...prev,
              deliverable: false,
              checking: false,
              estimatedDelivery: null
            }));
          }
        } catch (error) {
          console.error('Delivery check error:', error);
          setShippingInfo(prev => ({ ...prev, checking: false }));
        }
      }
    };
    
    const timeoutId = setTimeout(checkDelivery, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.pincode, subtotal]);

  useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
    const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    setSavedAddresses(addresses);
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email, fullName: user.name || '' }));
    }
  }, [cart.length, navigate, orderPlaced, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Toggle address selection - click anywhere on card
  const handleAddressSelect = (address) => {
    if (selectedAddress === address.id) {
      // If already selected, unselect it
      setSelectedAddress(null);
      setFormData({
        ...formData,
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } else {
      // Select new address
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

    const updatedAddresses = savedAddresses.map(addr => {
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
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    
    if (selectedAddress === addressId) {
      setSelectedAddress(null);
      setFormData({
        ...formData,
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    }
    toast.success('Address deleted successfully!');
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    setIsEditing(false);
    setFormData({
      ...formData,
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
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
    
    const duplicate = savedAddresses.find(addr => 
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
      toast.success('Address saved successfully!');
      return true;
    } else {
      toast.error('This address already exists!');
      return false;
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setApplyingCoupon(true);
    setCouponMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: subtotal,
          userId: user?._id || null
        })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setCouponDiscount(data.coupon.discountAmount);
        setCouponApplied(true);
        setCouponMessage({ type: 'success', text: `✓ Coupon applied! You saved ₹${data.coupon.discountAmount}` });
        setTimeout(() => setCouponMessage(null), 3000);
      } else {
        setCouponDiscount(0);
        setCouponApplied(false);
        setCouponMessage({ type: 'error', text: data.message || 'Invalid coupon code' });
      }
    } catch (error) {
      console.error('Coupon error:', error);
      setCouponMessage({ type: 'error', text: 'Failed to apply coupon. Please try again.' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponMessage({ type: 'info', text: 'Coupon removed' });
    setTimeout(() => setCouponMessage(null), 2000);
  };

  // ✅ placeOrder with Nykaa Style Order ID
  const placeOrder = async () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast.error('Please fill all address fields');
      return;
    }
    
    if (!shippingInfo.deliverable) {
      toast.error('Sorry, delivery is not available at this pincode');
      return;
    }

    setIsPlacingOrder(true);

    const finalTotal = total;
    setOrderTotal(finalTotal);

    if (formData.saveAddress && !isEditing) {
      saveNewAddress();
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
          variationName: item.size || null,
          variationSecondary: item.color || null,
          vendorId: item.vendorId || null
        })),
        total: finalTotal,
        address: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country || 'India'
        },
        paymentMethod: paymentMethod || 'cod'
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      // ✅ Nykaa Style Order ID
      const newOrderId = data.order?._id || generateOrderId();
      setOrderId(newOrderId);
      
      clearCart();
      setOrderPlaced(true);
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', price: 0 },
    { id: 'express', name: 'Express Delivery', price: 99 },
  ];

  const paymentOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
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
    return 'Delivery available';
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl text-green-600">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed! 🎉</h1>
            <p className="text-gray-500 mb-2">Order ID: <span className="font-semibold text-pink-600 font-mono">{orderId}</span></p>
            <p className="text-gray-600 mb-6">Your order has been confirmed. You will receive a confirmation email shortly.</p>
            
            {shippingInfo.estimatedDelivery && (
              <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
                <p className="font-semibold text-green-800 mb-1">📦 Delivery Estimate</p>
                <p className="text-green-700 text-sm">{getDeliveryDateDisplay()}</p>
              </div>
            )}
            
            <div className="bg-pink-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold mb-2 text-gray-800">Order Summary</p>
              <p className="text-sm text-gray-600">Total Amount: <span className="font-bold text-pink-600">₹{orderTotal}</span></p>
              <p className="text-sm text-gray-600">Payment Method: {paymentOptions.find(m => m.id === paymentMethod)?.name}</p>
              <p className="text-sm text-gray-600">Delivery to: {formData.address}, {formData.city}</p>
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/my-orders" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition">
                View Orders
              </Link>
              <Link to="/shop" className="border-2 border-pink-500 text-pink-600 px-6 py-3 rounded-full font-medium hover:bg-pink-50 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <OfferBanner />

      {/* 🔥 TOP BAR REMOVED - Free Shipping, Secure Checkout hataya */}

      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">MyPinkShop</h1>
                <p className="text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline">🔒 Secure Checkout</span>
              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="text-sm font-medium text-gray-700">{cart.length}</span>
                <span className="text-xs text-gray-400">items</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* 🔥 3 Steps - Clean Design */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-10 right-10 top-5 h-0.5 bg-gray-200 hidden sm:block">
                  <div className={`h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                    step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'
                  }`}></div>
                </div>
                
                {[
                  { step: 1, label: 'Address', icon: '📍' },
                  { step: 2, label: 'Delivery', icon: '🚚' },
                  { step: 3, label: 'Payment', icon: '💳' },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center relative z-10 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                      step >= s.step 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 scale-105' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step > s.step ? '✓' : s.icon}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      step >= s.step ? 'text-pink-600' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1 - Address */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Shipping Address</h2>
                    <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                  </div>
                </div>
                
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">📌 Saved Addresses</p>
                    <div className="grid grid-cols-1 gap-3">
                      {savedAddresses.map(addr => (
                        <div 
                          key={addr.id} 
                          onClick={() => handleAddressSelect(addr)}
                          className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                            selectedAddress === addr.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-pink-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedAddress === addr.id}
                              onChange={() => {}}
                              className="mt-1 w-4 h-4 text-pink-600 accent-pink-500 flex-shrink-0 pointer-events-none"
                            />
                            <div className="flex-1 pointer-events-none">
                              <p className="font-semibold text-gray-800">{addr.fullName}</p>
                              <p className="text-sm text-gray-500">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Address"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Delete Address"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
                                  Save Changes
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
                                  if (!shippingInfo.deliverable) {
                                    toast.error('Sorry, delivery is not available at this pincode');
                                    return;
                                  }
                                  setStep(2);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all"
                              >
                                Continue to Delivery 🚚 →
                              </button>
                              <p className="text-xs text-gray-400 text-center mt-1.5">
                                ✓ Address selected. Click to proceed.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-400 font-medium">or add new address</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street, building, area"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      maxLength="6"
                      placeholder="Enter 6-digit pincode"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition"
                      required
                    />
                    {shippingInfo.checking && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="animate-spin">⏳</span> Checking delivery availability...
                      </p>
                    )}
                    {!shippingInfo.checking && formData.pincode.length === 6 && !shippingInfo.deliverable && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        ❌ Delivery not available at this pincode
                      </p>
                    )}
                    {!shippingInfo.checking && formData.pincode.length === 6 && shippingInfo.deliverable && shippingInfo.estimatedDelivery && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        ✅ {getDeliveryDateDisplay()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={formData.saveAddress}
                      onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                      className="w-4 h-4 text-pink-600 rounded accent-pink-500"
                    />
                    <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-600">Save this address for future</label>
                  </div>
                </div>
                
                {!selectedAddress && (
                  <button
                    onClick={() => {
                      if (formData.fullName && formData.phone && formData.address && formData.city && formData.pincode) {
                        if (!shippingInfo.deliverable) {
                          toast.error('Sorry, delivery is not available at this pincode');
                          return;
                        }
                        setStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        toast.error('Please fill all required address fields');
                      }
                    }}
                    className="mt-6 w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all"
                  >
                    Continue to Delivery 🚚 →
                  </button>
                )}
              </div>
            )}

            {/* STEP 2 - Delivery */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* 🔥 BACK BUTTON - Top Left */}
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={() => setStep(1)} 
                    className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition font-medium text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Address
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Delivery Options</h2>
                    <p className="text-sm text-gray-500">Choose how you want your order delivered</p>
                  </div>
                </div>
                
                {shippingInfo.estimatedDelivery && (
                  <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <span className="text-xl">📦</span>
                    <div>
                      <p className="font-medium text-blue-800">{getDeliveryDateDisplay()}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Orders placed before {shippingInfo.cutOffTime} will be processed today</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {deliveryOptions.map(option => {
                    const optionShippingCharge = option.id === 'express' ? 99 : shippingInfo.shippingCharge;
                    const isFree = subtotal >= shippingInfo.freeShippingThreshold;
                    const displayPrice = isFree ? 0 : optionShippingCharge;
                    
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          deliveryMethod === option.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-pink-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="delivery"
                            value={option.id}
                            checked={deliveryMethod === option.id}
                            onChange={() => setDeliveryMethod(option.id)}
                            className="w-4 h-4 text-pink-600 accent-pink-500"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{option.name}</p>
                            <p className="text-sm text-gray-500">
                              {option.id === 'express' ? '🚀 Faster delivery' : '📦 Standard delivery'}
                            </p>
                          </div>
                        </div>
                        <p className={`font-bold ${displayPrice === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                          {displayPrice === 0 ? 'FREE' : `₹${displayPrice}`}
                        </p>
                      </label>
                    );
                  })}
                </div>
                
                {subtotal < shippingInfo.freeShippingThreshold && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      🚚 Add ₹{shippingInfo.freeShippingThreshold - subtotal} more for <strong>FREE delivery</strong>
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={() => setStep(3)} 
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all"
                  >
                    Continue to Payment 💳 →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - Payment */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* 🔥 BACK BUTTON - Top Left */}
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={() => setStep(2)} 
                    className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition font-medium text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Delivery
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Payment Method</h2>
                    <p className="text-sm text-gray-500">Choose how you want to pay</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentOptions.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === option.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={() => setPaymentMethod(option.id)}
                        className="w-4 h-4 text-pink-600 accent-pink-500"
                      />
                      <div>
                        <p className="font-medium text-gray-800 flex items-center gap-1.5">
                          <span>{option.icon}</span> {option.name}
                        </p>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={placeOrder}
                    disabled={isPlacingOrder || !shippingInfo.deliverable}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Placing Order...
                      </span>
                    ) : (
                      `Place Order • ₹${total}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🛒</span>
                <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
                <span className="ml-auto text-sm bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
                  {cart.length} items
                </span>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                    <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-pink-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <span className="text-2xl">🛍️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity}
                        {item.size && ` • ${item.size}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                      <p className="text-sm font-semibold text-pink-600">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition uppercase"
                    disabled={couponApplied}
                  />
                  {couponApplied ? (
                    <button
                      onClick={removeCoupon}
                      className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-5 py-2.5 bg-pink-100 text-pink-600 rounded-xl text-sm font-medium hover:bg-pink-200 transition disabled:opacity-50"
                    >
                      {applyingCoupon ? (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                          ...
                        </span>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`text-xs mt-1.5 font-medium ${
                    couponMessage.type === 'success' ? 'text-green-600' : 
                    couponMessage.type === 'error' ? 'text-red-500' : 'text-blue-600'
                  }`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>💰 Coupon Discount</span>
                    <span className="font-medium">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Charges</span>
                  <span className={`font-medium ${deliveryCharges === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (GST)</span>
                  <span className="font-medium text-gray-800">₹{tax}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-800 text-base">Total</span>
                  <span className="font-bold text-pink-600 text-xl">₹{total}</span>
                </div>
              </div>

              {formData.address && (
                <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-100">
                  <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    📍 Delivery Address
                  </p>
                  <p className="text-sm text-gray-800 font-medium">{formData.fullName}</p>
                  <p className="text-xs text-gray-500">{formData.address}, {formData.city} - {formData.pincode}</p>
                  <p className="text-xs text-gray-500">📞 {formData.phone}</p>
                  {shippingInfo.estimatedDelivery && (
                    <p className="text-xs text-green-600 mt-1.5 font-medium">✅ {getDeliveryDateDisplay()}</p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">🔒 Secure</span>
                  <span className="flex items-center gap-1">🛡️ Protected</span>
                  <span className="flex items-center gap-1">✅ Trusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
