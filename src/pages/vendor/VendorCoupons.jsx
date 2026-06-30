import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';
import toast from 'react-hot-toast';

function VendorCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    minOrder: '',
    maxDiscount: '',
    usageLimit: 100,
    validTill: ''
  });

  const navigate = useNavigate();
  const API_URL = 'https://api.mypinkshop.com/api';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorData(token);
  }, [navigate]);

  // ✅ Fetch vendor data and coupons
  const fetchVendorData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch vendor profile
      const profileRes = await fetch(`${API_URL}/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setVendorInfo(profileData.vendor);
      }

      // 2. Fetch vendor coupons
      const couponsRes = await fetch(`${API_URL}/vendor/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const couponsData = await couponsRes.json();
      
      if (couponsData.success) {
        setCoupons(couponsData.coupons || []);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create coupon
  const createCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) {
      toast.error('⚠️ Please fill all required fields');
      return;
    }

    const token = localStorage.getItem('vendorToken') || localStorage.getItem('token');
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/vendor/coupons/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          discountType: newCoupon.type,
          discountValue: parseFloat(newCoupon.discount),
          minOrderValue: parseFloat(newCoupon.minOrder) || 0,
          maxDiscount: parseFloat(newCoupon.maxDiscount) || 0,
          usageLimit: parseInt(newCoupon.usageLimit) || 100,
          endDate: newCoupon.validTill || null,
          vendorId: vendorInfo?._id || vendorInfo?.id
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons([data.coupon, ...coupons]);
        setShowModal(false);
        setNewCoupon({ 
          code: '', 
          discount: '', 
          type: 'percentage', 
          minOrder: '', 
          maxDiscount: '', 
          usageLimit: 100, 
          validTill: '' 
        });
        toast.success('✅ Coupon created successfully!');
        
        // ✅ Update coupon list
        const token = localStorage.getItem('vendorToken') || localStorage.getItem('token');
        fetchVendorData(token);
      } else {
        toast.error(data.message || 'Failed to create coupon');
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Toggle coupon status
  const toggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('vendorToken') || localStorage.getItem('token');
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`${API_URL}/vendor/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus === 'active' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons(coupons.map(c => 
          c._id === id ? { ...c, isActive: newStatus === 'active', status: newStatus } : c
        ));
        toast.success(`Coupon ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Network error. Please try again.');
    }
  };

  // ✅ Delete coupon
  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;

    const token = localStorage.getItem('vendorToken') || localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/vendor/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons(coupons.filter(c => c._id !== id));
        toast.success('✅ Coupon deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Network error. Please try again.');
    }
  };

  const isExpired = (validTill) => {
    return validTill && new Date(validTill) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="coupons" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🎫 Coupons & Promotions</h1>
              <p className="text-gray-500 text-sm">Create discounts to boost sales</p>
            </div>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2"
            >
              ➕ Create Coupon
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-800">{coupons.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {coupons.filter(c => c.isActive !== false && !isExpired(c.endDate)).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Expired/Inactive</p>
              <p className="text-2xl font-bold text-gray-400">
                {coupons.filter(c => !c.isActive || isExpired(c.endDate)).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Used</p>
              <p className="text-2xl font-bold text-blue-600">
                {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
              </p>
            </div>
          </div>

          {/* Coupons Table */}
          {coupons.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No coupons yet</h3>
              <p className="text-gray-500 mb-4">Create your first coupon to offer discounts to customers</p>
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-pink-500 text-white px-6 py-2.5 rounded-lg hover:bg-pink-600 transition"
              >
                ➕ Create Coupon
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Code</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Discount</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Min Order</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Valid Till</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Used</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map(c => {
                      const isCouponExpired = isExpired(c.endDate);
                      const isActive = c.isActive !== false && !isCouponExpired;
                      
                      return (
                        <tr key={c._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono font-bold text-pink-600">{c.code}</td>
                          <td className="px-4 py-3 text-center font-medium">
                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </td>
                          <td className="px-4 py-3 text-right">₹{c.minOrderValue || 0}</td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'No expiry'}
                            {isCouponExpired && (
                              <span className="ml-1 text-red-500 text-xs">(Expired)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{c.usedCount || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive 
                                ? 'bg-green-100 text-green-700' 
                                : isCouponExpired 
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                              {isActive ? 'Active' : isCouponExpired ? 'Expired' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              {!isCouponExpired && (
                                <button 
                                  onClick={() => toggleStatus(c._id, isActive ? 'active' : 'inactive')} 
                                  className={`text-sm font-medium transition ${
                                    isActive 
                                      ? 'text-yellow-600 hover:text-yellow-800' 
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                >
                                  {isActive ? '⏸️ Disable' : '▶️ Enable'}
                                </button>
                              )}
                              {isCouponExpired && (
                                <span className="text-xs text-gray-400">Expired</span>
                              )}
                              <button 
                                onClick={() => deleteCoupon(c._id)} 
                                className="text-red-500 hover:text-red-700 transition"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">✨ Create Coupon</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input 
                  type="text" 
                  placeholder="e.g., SUMMER10" 
                  value={newCoupon.code} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select 
                    value={newCoupon.type} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  >
                    <option value="percentage">% Percentage</option>
                    <option value="fixed">₹ Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input 
                    type="number" 
                    placeholder={newCoupon.type === 'percentage' ? '10' : '200'} 
                    value={newCoupon.discount} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input 
                    type="number" 
                    placeholder="999" 
                    value={newCoupon.minOrder} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0 = no limit" 
                    value={newCoupon.maxDiscount} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    value={newCoupon.usageLimit} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till</label>
                  <input 
                    type="date" 
                    value={newCoupon.validTill} 
                    onChange={(e) => setNewCoupon({ ...newCoupon, validTill: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <button 
                onClick={createCoupon} 
                disabled={saving}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? 'Creating...' : '✨ Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorCoupons;
