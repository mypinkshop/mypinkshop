import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    const detailsFilled = localStorage.getItem('vendorDetailsFilled');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }
    
    setVendor(JSON.parse(vendorData));
    
    // First time login - show business details form
    if (!detailsFilled) {
      navigate('/vendor/business-details');
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{vendor?.brandName}</span>
              <button onClick={() => { localStorage.removeItem('vendorToken'); localStorage.removeItem('vendor'); navigate('/vendor/login'); }} className="text-sm text-red-500">Logout</button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold">Welcome back, {vendor?.brandName}! 👋</h1>
            <p className="opacity-90 mt-1">Here's your store performance overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Total Products</p><p className="text-2xl font-bold">24</p></div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Total Orders</p><p className="text-2xl font-bold">156</p></div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Total Sales</p><p className="text-2xl font-bold text-green-600">₹1,25,000</p></div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Earnings</p><p className="text-2xl font-bold text-pink-600">₹1,06,250</p></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Link to="/vendor/products" className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md"><div className="text-2xl mb-2">📦</div><p className="font-medium">Products</p></Link>
            <Link to="/vendor/add-product" className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md"><div className="text-2xl mb-2">➕</div><p className="font-medium">Add Product</p></Link>
            <Link to="/vendor/orders" className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md"><div className="text-2xl mb-2">📋</div><p className="font-medium">Orders</p></Link>
            <Link to="/vendor/ads" className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md"><div className="text-2xl mb-2">📢</div><p className="font-medium">Ads</p></Link>
            <Link to="/vendor/earnings" className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md"><div className="text-2xl mb-2">💰</div><p className="font-medium">Earnings</p></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
