import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    minOrder: '',
    maxDiscount: '',
    validTill: '',
    usageLimit: '',
    description: '',
    status: 'active'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com/api';

  // ✅ Check admin auth
  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCoupons(token);
  }, [navigate]);

  // ✅ Load coupons from backend
  const loadCoupons = async (token) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/coupons/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setCoupons(data || []);
      } else {
        setError(data.message || 'Failed to load coupons');
        toast.error(data.message || 'Failed to load coupons');
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save coupon to backend
  const saveCouponToAPI = async (couponData, isEdit = false) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const url = isEdit 
      ? `${API_URL}/coupons/update/${editingCoupon._id || editingCoupon.id}`
      : `${API_URL}/coupons/create`;
    
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      code: couponData.code,
      discountType: couponData.type,
      discountValue: parseFloat(couponData.discount),
      minOrderValue: parseFloat(couponData.minOrder) || 0,
      maxDiscount: parseFloat(couponData.maxDiscount) || 0,
      usageLimit: parseInt(couponData.usageLimit) || 100,
      endDate: couponData.validTill || null,
      description: couponData.description || '',
      isActive: couponData.status === 'active'
    };

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save coupon');
    }
    return data;
  };

  // ✅ Delete coupon from backend
  const deleteCouponFromAPI = async (id) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const res = await fetch(`${API_URL}/coupons/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete coupon');
    }
    return true;
  };

  // ✅ Toggle coupon status
  const toggleCouponStatusAPI = async (id, currentStatus) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const res = await fetch(`${API_URL}/coupons/toggle/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to toggle coupon');
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'code') {
      setFormData(prev => ({ ...prev, code: value.toUpperCase().replace(/[^A-Z0-9]/g, '') }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount || !formData.minOrder || !formData.validTill) {
      toast.error('Please fill all required fields');
      return;
    }

    const duplicate = coupons.some(c => 
      c.code === formData.code && 
      (!editingCoupon || (c._id !== editingCoupon._id && c.id !== editingCoupon.id))
    );
    if (duplicate) {
      toast.error('Coupon code already exists!');
      return;
    }

    setProcessingId('submitting');

    try {
      await saveCouponToAPI(formData, !!editingCoupon);
      toast.success(editingCoupon ? '✅ Coupon updated successfully!' : '✅ Coupon created successfully!');
      await loadCoupons(localStorage.getItem('adminToken') || localStorage.getItem('token'));
      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
    } catch (err) {
      console.error('Error saving coupon:', err);
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      type: 'percentage',
      minOrder: '',
      maxDiscount: '',
      validTill: '',
      usageLimit: '',
      description: '',
      status: 'active'
    });
  };

  const editCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discountValue || coupon.discount,
      type: coupon.discountType || coupon.type || 'percentage',
      minOrder: coupon.minOrderValue || coupon.minOrder,
      maxDiscount: coupon.maxDiscount || '',
      validTill: coupon.endDate || coupon.validTill,
      usageLimit: coupon.usageLimit || '',
      description: coupon.description || '',
      status: coupon.isActive !== undefined ? (coupon.isActive ? 'active' : 'inactive') : coupon.status || 'active'
    });
    setShowModal(true);
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('⚠️ Delete this coupon? This action cannot be undone.')) return;

    setProcessingId(id);
    try {
      await deleteCouponFromAPI(id);
      toast.success('🗑️ Coupon deleted successfully!');
      await loadCoupons(localStorage.getItem('adminToken') || localStorage.getItem('token'));
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error(err.message || 'Failed to delete coupon');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    setProcessingId(id);
    try {
      await toggleCouponStatusAPI(id, currentStatus);
      toast.success(`Coupon ${currentStatus ? 'deactivated' : 'activated'}!`);
      await loadCoupons(localStorage.getItem('adminToken') || localStorage.getItem('token'));
    } catch (err) {
      console.error('Error toggling coupon:', err);
      toast.error(err.message || 'Failed to toggle coupon');
    } finally {
      setProcessingId(null);
    }
  };

  const isExpired = (validTill) => {
    return validTill && new Date(validTill) < new Date();
  };

  const getStatusBadge = (status, validTill) => {
    const isActive = status === 'active' || status === true;
    if (isExpired(validTill) && isActive) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expired</span>;
    if (isActive) return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
    if (status === 'inactive' || status === false) return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  };

  const getDiscountText = (coupon) => {
    const discount = coupon.discountValue || coupon.discount;
    const type = coupon.discountType || coupon.type;
    if (type === 'percentage') return `${discount}% OFF`;
    if (type === 'fixed') return `₹${discount} OFF`;
    if (type === 'shipping') return 'Free Shipping';
    return `${discount} OFF`;
  };

  const filteredCoupons = coupons.filter(c => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        const isActive = c.isActive !== undefined ? c.isActive : c.status === 'active';
        if (!isActive || isExpired(c.endDate || c.validTill)) return false;
      }
      if (filterStatus === 'expired') {
        if (!isExpired(c.endDate || c.validTill)) return false;
      }
    }
    if (searchTerm && !c.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeCoupons = coupons.filter(c => {
    const isActive = c.isActive !== undefined ? c.isActive : c.status === 'active';
    return isActive && !isExpired(c.endDate || c.validTill);
  }).length;
  
  const expiredCoupons = coupons.filter(c => isExpired(c.endDate || c.validTill)).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || c.usageCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading coupons...</p>
        </div>
      </div>
    );
  }

  if (error && coupons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">🎫 Coupons & Promotions</h1>
            <p className="text-xs text-gray-400 mt-0.5">Create and manage discount coupons</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input 
                type="text" 
                placeholder="Search coupons..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button 
              onClick={() => { setEditingCoupon(null); resetForm(); setShowModal(true); }} 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition"
            >
              + Create Coupon
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 md:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Coupons</p>
                <span className="text-lg">🎫</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{coupons.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Active</p>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeCoupons}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Expired</p>
                <span className="text-lg">📅</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{expiredCoupons}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Uses</p>
                <span className="text-lg">📊</span>
              </div>
              <p className="text-2xl font-bold text-pink-600">{totalUsage.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All ({coupons.length})</button>
            <button onClick={() => setFilterStatus('active')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Active ({activeCoupons})</button>
            <button onClick={() => setFilterStatus('expired')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'expired' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Expired ({expiredCoupons})</button>
          </div>

          {/* Coupons Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Coupon Code</th>
                    <th className="px-4 py-3 text-center">Discount</th>
                    <th className="px-4 py-3 text-center">Min Order</th>
                    <th className="px-4 py-3 text-center">Max Discount</th>
                    <th className="px-4 py-3 text-center">Valid Till</th>
                    <th className="px-4 py-3 text-center">Used</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">🎫</div>
                        <p>No coupons found</p>
                        <button onClick={() => { setEditingCoupon(null); resetForm(); setShowModal(true); }} className="mt-3 text-pink-500 text-sm hover:underline">
                          Create your first coupon →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map(coupon => (
                      <tr key={coupon._id || coupon.id} className="hover:bg-pink-50/30 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-mono font-bold text-pink-600 text-sm">{coupon.code}</p>
                            {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {getDiscountText(coupon)}
                        </td>
                        <td className="px-4 py-3 text-center">₹{(coupon.minOrderValue || coupon.minOrder || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {(coupon.maxDiscount || 0) > 0 ? `₹${(coupon.maxDiscount || 0).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs ${isExpired(coupon.endDate || coupon.validTill) ? 'text-red-500' : 'text-gray-600'}`}>
                            {coupon.endDate || coupon.validTill ? new Date(coupon.endDate || coupon.validTill).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div>
                            <span className="font-semibold">{coupon.usedCount || coupon.usageCount || 0}</span>
                            {coupon.usageLimit > 0 && <span className="text-xs text-gray-400"> / {coupon.usageLimit}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(coupon.isActive !== undefined ? (coupon.isActive ? 'active' : 'inactive') : coupon.status, coupon.endDate || coupon.validTill)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => editCoupon(coupon)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
                            <button 
                              onClick={() => toggleCouponStatus(coupon._id || coupon.id, coupon.isActive !== undefined ? coupon.isActive : coupon.status === 'active')} 
                              disabled={processingId === (coupon._id || coupon.id)}
                              className={`p-1.5 rounded-lg transition ${(coupon.isActive !== undefined ? coupon.isActive : coupon.status === 'active') ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} disabled:opacity-50`} 
                              title={(coupon.isActive !== undefined ? coupon.isActive : coupon.status === 'active') ? 'Disable' : 'Enable'}
                            >
                              {(coupon.isActive !== undefined ? coupon.isActive : coupon.status === 'active') ? '🔒' : '🔓'}
                            </button>
                            <button 
                              onClick={() => deleteCoupon(coupon._id || coupon.id)} 
                              disabled={processingId === (coupon._id || coupon.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" 
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {filteredCoupons.length} of {coupons.length} coupons
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editingCoupon ? '✏️ Edit Coupon' : '➕ Create New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input 
                  type="text" 
                  name="code" 
                  placeholder="e.g., WELCOME10" 
                  value={formData.code} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 uppercase" 
                  required 
                />
                <p className="text-xs text-gray-400 mt-1">Only letters and numbers, no spaces</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input 
                    type="number" 
                    name="discount" 
                    placeholder={formData.type === 'percentage' ? 'e.g., 10' : 'e.g., 200'} 
                    value={formData.discount} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount *</label>
                  <input 
                    type="number" 
                    name="minOrder" 
                    placeholder="e.g., 999" 
                    value={formData.minOrder} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                  <input 
                    type="number" 
                    name="maxDiscount" 
                    placeholder="e.g., 500" 
                    value={formData.maxDiscount} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty for no limit</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till *</label>
                  <input 
                    type="date" 
                    name="validTill" 
                    value={formData.validTill} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input 
                    type="number" 
                    name="usageLimit" 
                    placeholder="e.g., 1000" 
                    value={formData.usageLimit} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="2" 
                  placeholder="Brief description of the coupon" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={processingId === 'submitting'}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 mt-2"
              >
                {processingId === 'submitting' ? '⏳ Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ ENSURE DEFAULT EXPORT AT THE END
export default AdminCoupons;
