import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'top_banner',
    isActive: true,
    categoryMode: 'global',    // 'global' | 'single' | 'multiple'
    selectedCategories: [],     // array of slugs (agar single/multiple)
    position: 'top_banner',
    icon: '🎉',
    priority: 0,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const safeArray = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    if (responseData && Array.isArray(responseData.offers)) return responseData.offers;
    return [];
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/api/offers/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load offers');

      const data = await response.json();
      setOffers(safeArray(data));
    } catch (error) {
      console.error('Error loading offers:', error);
      setError('Failed to load offers');
      toast.error('Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error('Session expired. Please login again.');
      return;
    }
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.error('Please enter offer title');
    if (!formData.description.trim()) return toast.error('Please enter offer description');

    // ✅ Validate category selection
    if (formData.categoryMode !== 'global' && formData.selectedCategories.length === 0) {
      return toast.error('Please select at least one category');
    }

    setProcessingId('submitting');

    try {
      // ✅ Category data prepare karo
      let categoryData = null;
      if (formData.categoryMode === 'single' && formData.selectedCategories.length > 0) {
        categoryData = formData.selectedCategories[0];
      } else if (formData.categoryMode === 'multiple' && formData.selectedCategories.length > 0) {
        categoryData = JSON.stringify(formData.selectedCategories);
      }

      const url = editingOffer
        ? `${API_URL}/api/offers/update/${editingOffer._id || editingOffer.id}`
        : `${API_URL}/api/offers/create`;

      const response = await fetch(url, {
        method: editingOffer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          category: categoryData,
          discountValue: parseInt(formData.discountValue) || 0,
          minOrderValue: parseInt(formData.minOrderValue) || 0,
          priority: parseInt(formData.priority) || 0,
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingOffer ? '✅ Offer updated!' : '✅ Offer created!');
        setShowModal(false);
        setEditingOffer(null);
        resetForm();
        loadOffers();
      } else {
        toast.error(data.error || data.message || 'Failed to save offer');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 499,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      type: 'top_banner',
      isActive: true,
      categoryMode: 'global',
      selectedCategories: [],
      position: 'top_banner',
      icon: '🎉',
      priority: 0,
    });
  };

  const toggleStatus = async (id, currentStatus) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${API_URL}/api/offers/toggle/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success(`Offer ${currentStatus ? 'deactivated' : 'activated'}!`);
        loadOffers();
      } else {
        toast.error('Failed to toggle');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    setProcessingId(id);
    try {
      const response = await fetch(`${API_URL}/api/offers/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('🗑️ Offer deleted');
        loadOffers();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Parse category to display
  const getCategoryLabel = (cat) => {
    if (!cat) return '🌐 Global (All Pages)';
    try {
      const parsed = JSON.parse(cat);
      if (Array.isArray(parsed)) {
        return parsed.map(c => categoryOptions.find(o => o.value === c)?.label || c).join(', ');
      }
    } catch (e) {}
    return categoryOptions.find(o => o.value === cat)?.label || cat;
  };

  // ✅ Toggle category selection
  const toggleCategory = (slug) => {
    setFormData(prev => {
      const exists = prev.selectedCategories.includes(slug);
      return {
        ...prev,
        selectedCategories: exists
          ? prev.selectedCategories.filter(c => c !== slug)
          : [...prev.selectedCategories, slug],
      };
    });
  };

  // ✅ Filtered offers
  const filteredOffers = offers.filter(o => {
    if (filterCategory !== 'all') {
      if (filterCategory === 'global' && o.category) return false;
      if (filterCategory !== 'global' && !o.category) return false;
    }
    if (filterPosition !== 'all' && o.position !== filterPosition) return false;
    return true;
  });

  const activeOffers = offers.filter(o => o.isActive);

  // ✅ Category options
  const categoryOptions = [
    { value: 'skincare', label: '🧴 Skincare' },
    { value: 'makeup', label: '💄 Makeup' },
    { value: 'haircare', label: '💇‍♀️ Haircare' },
    { value: 'fashion', label: '👗 Fashion' },
    { value: 'accessories', label: '👜 Accessories' },
    { value: 'electronics', label: '📱 Electronics' },
    { value: 'home-kitchen', label: '🏠 Home & Kitchen' },
    { value: 'health-wellness', label: '🌿 Health & Wellness' },
    { value: 'books-stationery', label: '📚 Books & Stationery' },
  ];

  const positionOptions = [
    { value: 'top_banner', label: '🔥 Top Banner (Global)' },
    { value: 'category_top', label: '🎯 Category Top' },
    { value: 'category_mid', label: '📢 Category Mid' },
    { value: 'category_bottom', label: '🎯 Category Bottom' },
    { value: 'product_page', label: '📦 Product Page' },
    { value: 'checkout', label: '💳 Checkout Page' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AdminSidebar />
        <div className="md:ml-64 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading offers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="md:ml-64 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎯 Offer Management</h1>
            <p className="text-gray-500 text-sm">Manage offers — global, single, or multi-category</p>
          </div>
          <button
            onClick={() => {
              setEditingOffer(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition"
          >
            + Create New Offer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4">
            <p className="text-xs text-gray-500">Total Offers</p>
            <p className="text-2xl font-bold text-gray-800">{offers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeOffers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4">
            <p className="text-xs text-gray-500">Global</p>
            <p className="text-2xl font-bold text-pink-600">
              {offers.filter(o => !o.category).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4">
            <p className="text-xs text-gray-500">Category-wise</p>
            <p className="text-2xl font-bold text-purple-600">
              {offers.filter(o => o.category).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Categories</option>
              <option value="global">🌐 Global Only</option>
              {categoryOptions.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Positions</option>
              {positionOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <span className="ml-auto text-xs text-gray-400 self-center">
              Showing {filteredOffers.length} of {offers.length}
            </span>
          </div>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-pink-50 border-b border-pink-100">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Icon</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Position</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold">Discount</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold">Priority</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      No offers found. Create your first offer!
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map(offer => (
                    <tr key={offer._id || offer.id} className="hover:bg-pink-50/30 transition">
                      <td className="px-4 py-3 text-2xl">{offer.icon || '🎉'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{offer.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{offer.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">
                          {getCategoryLabel(offer.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-medium">
                          {positionOptions.find(p => p.value === offer.position)?.label || offer.position || 'top_banner'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-pink-600">
                        {offer.discountType === 'percentage' || offer.discount_type === 'percentage'
                          ? `${offer.discountValue || offer.discount_value}%`
                          : `₹${offer.discountValue || offer.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {offer.priority || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStatus(offer._id || offer.id, offer.isActive || offer.is_active)}
                          disabled={processingId === (offer._id || offer.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            (offer.isActive || offer.is_active)
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {(offer.isActive || offer.is_active) ? '✅ Active' : '⛔ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              // ✅ Parse category for editing
                              let categoryMode = 'global';
                              let selectedCategories = [];
                              if (offer.category) {
                                try {
                                  const parsed = JSON.parse(offer.category);
                                  if (Array.isArray(parsed)) {
                                    categoryMode = parsed.length > 1 ? 'multiple' : 'single';
                                    selectedCategories = parsed;
                                  } else {
                                    categoryMode = 'single';
                                    selectedCategories = [offer.category];
                                  }
                                } catch (e) {
                                  categoryMode = 'single';
                                  selectedCategories = [offer.category];
                                }
                              }

                              setEditingOffer(offer);
                              setFormData({
                                title: offer.title,
                                description: offer.description,
                                discountType: offer.discountType || offer.discount_type,
                                discountValue: offer.discountValue || offer.discount_value,
                                minOrderValue: offer.minOrderValue || offer.min_order_value,
                                startDate: (offer.startDate || offer.start_date)?.split('T')[0] || '',
                                endDate: (offer.endDate || offer.end_date)?.split('T')[0] || '',
                                type: offer.type || 'top_banner',
                                isActive: offer.isActive !== undefined ? offer.isActive : (offer.is_active === 1),
                                categoryMode,
                                selectedCategories,
                                position: offer.position || 'top_banner',
                                icon: offer.icon || '🎉',
                                priority: offer.priority || 0,
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteOffer(offer._id || offer.id)}
                            disabled={processingId === (offer._id || offer.id)}
                            className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-pink-100 p-5 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOffer ? '✏️ Edit Offer' : '✨ Create New Offer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Icon + Title */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-center border border-gray-200 rounded-xl px-3 py-2.5 text-2xl"
                    maxLength="2"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                    placeholder="e.g., Summer Sale Offer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 resize-none"
                  placeholder="FREE SHIPPING ON ORDERS ABOVE ₹499"
                />
              </div>

              {/* ✅ CATEGORY MODE SELECTION */}
              <div className="border border-pink-100 rounded-xl p-4 bg-pink-50/30">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📍 Where should this offer show?
                </label>

                {/* Mode Radio Buttons */}
                <div className="space-y-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryMode"
                      value="global"
                      checked={formData.categoryMode === 'global'}
                      onChange={(e) => setFormData({ ...formData, categoryMode: e.target.value, selectedCategories: [] })}
                      className="w-4 h-4 text-pink-500"
                    />
                    <span className="text-sm text-gray-700">
                      🌐 <strong>All Pages</strong> (Global — everywhere)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryMode"
                      value="single"
                      checked={formData.categoryMode === 'single'}
                      onChange={(e) => setFormData({ ...formData, categoryMode: e.target.value, selectedCategories: [] })}
                      className="w-4 h-4 text-pink-500"
                    />
                    <span className="text-sm text-gray-700">
                      🎯 <strong>Single Category</strong> (only one category page)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryMode"
                      value="multiple"
                      checked={formData.categoryMode === 'multiple'}
                      onChange={(e) => setFormData({ ...formData, categoryMode: e.target.value, selectedCategories: [] })}
                      className="w-4 h-4 text-pink-500"
                    />
                    <span className="text-sm text-gray-700">
                      🎨 <strong>Multiple Categories</strong> (show on selected categories)
                    </span>
                  </label>
                </div>

                {/* Category Checkboxes — Show if single or multiple */}
                {formData.categoryMode !== 'global' && (
                  <div className="mt-3 pt-3 border-t border-pink-100">
                    <p className="text-xs text-gray-500 mb-2">
                      {formData.categoryMode === 'single'
                        ? '👇 Select 1 category:'
                        : '👇 Select multiple categories:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {categoryOptions.map(cat => {
                        const isSelected = formData.selectedCategories.includes(cat.value);
                        const isDisabled = formData.categoryMode === 'single'
                          && formData.selectedCategories.length >= 1
                          && !isSelected;

                        return (
                          <button
                            key={cat.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => toggleCategory(cat.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                              isSelected
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                : 'bg-white border border-pink-200 text-gray-700 hover:border-pink-400'
                            } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {isSelected ? '✓ ' : ''}{cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📍 Position (Kahan dikhega?)</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 bg-white"
                >
                  {positionOptions.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Discount + Min Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-pink-500"
                    />
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-20 border border-gray-200 rounded-xl px-2 py-2.5 bg-white text-sm"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Higher = shows first</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-pink-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === 'submitting'}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
                >
                  {processingId === 'submitting' ? '⏳ Saving...' : (editingOffer ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOffers;
