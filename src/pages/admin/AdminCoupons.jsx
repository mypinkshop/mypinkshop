import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCoupons();
  }, [navigate]);

  const loadCoupons = () => {
    // Load from localStorage or use defaults
    const savedCoupons = JSON.parse(localStorage.getItem('adminCoupons') || '[]');
    if (savedCoupons.length > 0) {
      setCoupons(savedCoupons);
    } else {
      const defaultCoupons = [
        { id: 1, code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 999, maxDiscount: 500, validTill: '2025-12-31', usageCount: 234, usageLimit: 1000, status: 'active', description: '10% off on first order' },
        { id: 2, code: 'FLAT200', discount: 200, type: 'fixed', minOrder: 999, maxDiscount: 200, validTill: '2025-06-30', usageCount: 89, usageLimit: 500, status: 'active', description: '₹200 off on orders above ₹999' },
        { id: 3, code: 'PINK15', discount: 15, type: 'percentage', minOrder: 1499, maxDiscount: 1000, validTill: '2025-05-31', usageCount: 45, usageLimit: 300, status: 'expired', description: '15% off on beauty products' },
        { id: 4, code: 'FREESHIP', discount: 0, type: 'shipping', minOrder: 999, maxDiscount: 0, validTill: '2025-12-31', usageCount: 567, usageLimit: 2000, status: 'active', description: 'Free shipping on orders above ₹999' },
      ];
      setCoupons(defaultCoupons);
      localStorage.setItem('adminCoupons', JSON.stringify(defaultCoupons));
    }
    setLoading(false);
  };

  const saveCoupons = (updatedCoupons) => {
    setCoupons(updatedCoupons);
    localStorage.setItem('adminCoupons', JSON.stringify(updatedCoupons));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'code') {
      setFormData(prev => ({ ...prev, code: value.toUpperCase().replace(/[^A-Z0-9]/g, '') }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount || !formData.minOrder || !formData.validTill) {
      alert('Please fill all required fields');
      return;
    }

    // Check for duplicate coupon code
    const duplicate = coupons.some(c => c.code === formData.code && (!editingCoupon || c.id !== editingCoupon.id));
    if (duplicate) {
      alert('Coupon code already exists!');
      return;
    }

    if (editingCoupon) {
      // Update existing coupon
      const updatedCoupons = coupons.map(c => 
        c.id === editingCoupon.id ? { ...c, ...formData, discount: parseFloat(formData.discount), minOrder: parseFloat(formData.minOrder), maxDiscount: parseFloat(formData.maxDiscount) || 0 } : c
      );
      saveCoupons(updatedCoupons);
      alert('✅ Coupon updated successfully!');
    } else {
      // Add new coupon
      const newCoupon = {
        id: Date.now(),
        ...formData,
        discount: parseFloat(formData.discount),
        minOrder: parseFloat(formData.minOrder),
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        usageCount: 0,
        usageLimit: parseInt(formData.usageLimit) || 0,
      };
      saveCoupons([...coupons, newCoupon]);
      alert('✅ Coupon created successfully!');
    }
    
    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
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
      discount: coupon.discount,
      type: coupon.type,
      minOrder: coupon.minOrder,
      maxDiscount: coupon.maxDiscount || '',
      validTill: coupon.validTill,
      usageLimit: coupon.usageLimit || '',
      description: coupon.description || '',
      status: coupon.status
    });
    setShowModal(true);
  };

  const deleteCoupon = (id) => {
    if (window.confirm('⚠️ Delete this coupon? This action cannot be undone.')) {
      const updatedCoupons = coupons.filter(c => c.id !== id);
      saveCoupons(updatedCoupons);
      alert('🗑️ Coupon deleted successfully!');
    }
  };

  const toggleCouponStatus = (id) => {
    const updatedCoupons = coupons.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
    );
    saveCoupons(updatedCoupons);
  };

  const isExpired = (validTill) => {
    return new Date(validTill) < new Date();
  };

  const getStatusBadge = (status, validTill) => {
    if (isExpired(validTill) && status === 'active') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expired</span>;
    if (status === 'active') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
    if (status === 'inactive') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  };

  const getDiscountText = (coupon) => {
    if (coupon.type === 'percentage') return `${coupon.discount}% OFF`;
    if (coupon.type === 'fixed') return `₹${coupon.discount} OFF`;
    if (coupon.type === 'shipping') return 'Free Shipping';
    return `${coupon.discount} OFF`;
  };

  const filteredCoupons = coupons.filter(c => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && c.status !== 'active') return false;
      if (filterStatus === 'expired' && !isExpired(c.validTill)) return false;
      if (filterStatus === 'inactive' && c.status !== 'inactive') return false;
    }
    if (searchTerm && !c.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeCoupons = coupons.filter(c => c.status === 'active' && !isExpired(c.validTill)).length;
  const expiredCoupons = coupons.filter(c => isExpired(c.validTill)).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Coupons & Promotions</h1>
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
            <button onClick={() => { setEditingCoupon(null); resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
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
                  <tr className="border-b">
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
                    <tr className="hover:bg-pink-50/30">
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
                      <tr key={coupon.id} className="hover:bg-pink-50/30 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-mono font-bold text-pink-600 text-sm">{coupon.code}</p>
                            {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {getDiscountText(coupon)}
                        </td>
                        <td className="px-4 py-3 text-center">₹{coupon.minOrder.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {coupon.maxDiscount > 0 ? `₹${coupon.maxDiscount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs ${isExpired(coupon.validTill) ? 'text-red-500' : 'text-gray-600'}`}>
                            {new Date(coupon.validTill).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div>
                            <span className="font-semibold">{coupon.usageCount}</span>
                            {coupon.usageLimit > 0 && <span className="text-xs text-gray-400"> / {coupon.usageLimit}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(coupon.status, coupon.validTill)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => editCoupon(coupon)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
                            <button onClick={() => toggleCouponStatus(coupon.id)} className={`p-1.5 rounded-lg transition ${coupon.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={coupon.status === 'active' ? 'Disable' : 'Enable'}>
                              {coupon.status === 'active' ? '🔒' : '🔓'}
                            </button>
                            <button onClick={() => deleteCoupon(coupon.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
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

              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:shadow-lg transition mt-2">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoupons;
