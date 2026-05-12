import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const deliveryCharges = deliveryMethod === 'express' ? 99 : 0;
  const subtotal = cartTotal();
  const discount = couponDiscount;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + tax + deliveryCharges;

  useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
    // Load saved addresses from localStorage
    const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    setSavedAddresses(addresses);
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email, fullName: user.name || '' }));
    }
  }, [cart.length, navigate, orderPlaced, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (address) => {
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
    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
  };

  const applyCoupon = () => {
    if (couponCode === 'WELCOME10') {
      setCouponDiscount(Math.round(subtotal * 0.1));
      setCouponApplied(true);
      alert('Coupon applied successfully! 10% discount added.');
    } else if (couponCode === 'FLAT200') {
      setCouponDiscount(200);
      setCouponApplied(true);
      alert('Coupon applied successfully! ₹200 discount added.');
    } else {
      alert('Invalid coupon code');
    }
  };

  const placeOrder = async () => {
    // Validate address
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      alert('Please fill all address fields');
      return;
    }

    if (formData.saveAddress) {
      saveNewAddress();
    }

    // Generate order ID
    const newOrderId = 'MPS' + Date.now();
    setOrderId(newOrderId);
    
    // Create order object
    const order = {
      id: newOrderId,
      date: new Date().toISOString(),
      items: cart,
      subtotal: subtotal,
      discount: discount,
      deliveryCharges: deliveryCharges,
      tax: tax,
      total: total,
      deliveryMethod: deliveryMethod,
      paymentMethod: paymentMethod,
      shippingAddress: formData,
      status: 'pending',
    };

    // Save order to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    // Clear cart
    clearCart();

    // Show success
    setOrderPlaced(true);
    
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', days: '3-5 business days', price: 0, icon: '🚚' },
    { id: 'express', name: 'Express Delivery', days: '1-2 business days', price: 99, icon: '⚡' },
  ];

  const paymentOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive the product' },
    { id: 'card', name: 'Credit / Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
  ];

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-pink-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-500 mb-4">Order ID: <span className="font-semibold text-pink-600">{orderId}</span></p>
            <p className="text-gray-600 mb-6">Your order has been confirmed. You will receive a confirmation email shortly.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold mb-2">Order Summary</p>
              <p className="text-sm text-gray-600">Total Amount: ₹{total}</p>
              <p className="text-sm text-gray-600">Payment Method: {paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
              <p className="text-sm text-gray-600">Delivery to: {formData.address}, {formData.city}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link to="/my-orders" className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">
                View Orders
              </Link>
              <Link to="/" className="border border-pink-500 text-pink-500 px-6 py-2 rounded-full hover:bg-pink-50 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paymentMethods = paymentOptions;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            MyPinkShop
          </Link>
          <div className="text-sm text-gray-500">
            <span className="text-pink-500 font-semibold">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column — Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Progress Steps */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: 'Address', icon: '📍' },
                  { step: 2, label: 'Delivery', icon: '🚚' },
                  { step: 3, label: 'Payment', icon: '💳' },
                ].map((s) => (
                  <div key={s.step} className="flex-1 text-center">
                    <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center text-lg ${
                      step >= s.step ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {s.icon}
                    </div>
                    <p className={`text-xs mt-2 ${step >= s.step ? 'text-pink-600 font-medium' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 — Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Saved Addresses</p>
                    <div className="space-y-2">
                      {savedAddresses.map(addr => (
                        <label key={addr.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selectedAddress === addr.id}
                            onChange={() => handleAddressSelect(addr)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{addr.fullName}</p>
                            <p className="text-sm text-gray-500">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-sm text-gray-500">{addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-400">or</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={formData.saveAddress}
                      onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="saveAddress" className="text-sm text-gray-600">Save this address for future</label>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (formData.fullName && formData.phone && formData.address) {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      alert('Please fill all address fields');
                    }
                  }}
                  className="mt-6 w-full bg-pink-500 text-white py-3 rounded-full font-medium hover:bg-pink-600 transition"
                >
                  Continue to Delivery →
                </button>
              </div>
            )}

            {/* Step 2 — Delivery */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Delivery Options</h2>
                <div className="space-y-3">
                  {deliveryOptions.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                        deliveryMethod === option.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={deliveryMethod === option.id}
                          onChange={() => setDeliveryMethod(option.id)}
                          className="w-4 h-4 text-pink-500"
                        />
                        <div>
                          <p className="font-medium">{option.name}</p>
                          <p className="text-sm text-gray-500">Delivery in {option.days}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{option.price === 0 ? 'FREE' : `₹${option.price}`}</p>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-pink-500 text-white py-3 rounded-full font-medium hover:bg-pink-600 transition"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Payment */}
            {step === 3 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {paymentOptions.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${
                        paymentMethod === option.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={() => setPaymentMethod(option.id)}
                        className="w-4 h-4 text-pink-500"
                      />
                      <div className="text-2xl">{option.icon}</div>
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={placeOrder}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-full font-semibold hover:shadow-lg transition"
                  >
                    Place Order → ₹{total}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                    <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center text-3xl">
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-pink-600">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponApplied}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 mt-1">Coupon applied! Saved ₹{couponDiscount}</p>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Charges</span>
                  <span>{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (5% GST)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                  <span>Total</span>
                  <span className="text-pink-600 text-lg">₹{total}</span>
                </div>
              </div>

              {/* Delivery Address Preview */}
              {formData.address && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-xs text-gray-500">{formData.fullName}, {formData.phone}</p>
                  <p className="text-xs text-gray-500">{formData.address}, {formData.city} - {formData.pincode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
