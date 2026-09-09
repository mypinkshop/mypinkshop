if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-5xl text-green-600 font-bold">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully! 🎉</h1>
            
            <p className="text-gray-500 mb-2">Order ID: <span className="font-semibold text-pink-600 font-mono text-base">{orderId}</span></p>
            <p className="text-gray-600 mb-6 text-sm">Your order has been confirmed and is being prepared for dispatch.</p>
            
            {shippingInfo.estimatedDelivery && (
              <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left border border-green-100 shadow-sm">
                <p className="font-semibold text-green-800 mb-1 flex items-center gap-1.5"><span>📦</span> Delivery Estimate</p>
                <p className="text-green-700 text-sm font-medium">{getDeliveryDateDisplay()}</p>
              </div>
            )}
            
            <div className="bg-pink-50/70 rounded-2xl p-5 mb-8 text-left border border-pink-100 shadow-sm space-y-2">
              <p className="font-bold text-gray-800 text-sm mb-3 pb-2 border-b border-pink-200/50 flex items-center gap-1.5"><span>📋</span> Order Summary</p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Amount:</span>
                <span className="font-bold text-pink-600 text-base">₹{orderTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-gray-800 uppercase">{paymentOptions.find(m => m.id === paymentMethod)?.name || paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-pink-200/50">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">📍 Delivered To:</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">{formData.fullName}</strong> ({formData.phone})<br />
                  {formData.address}, {formData.city}, {formData.state} - <span className="font-mono font-medium">{formData.pincode}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/my-orders" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg shadow-pink-200 transition">
                View Orders 📦
              </Link>
              <Link to="/shop" className="border-2 border-pink-500 text-pink-600 px-8 py-3 rounded-full font-semibold hover:bg-pink-50 transition">
                Continue Shopping →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
