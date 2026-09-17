import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';
import { useReviews } from '../../context/ReviewContext';

function AdminReviews() {
  const navigate = useNavigate();
  const { exportReviews } = useReviews();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReviewId, setActionReviewId] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, avgRating: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // ✅ NEW: Add Review states
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: '',
    userName: '',
    rating: 0,
    hoverRating: 0,
    title: '',
    review: '',
    images: []
  });
  const [addImagesUploading, setAddImagesUploading] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  const safeArray = (data, ...keys) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (Array.isArray(data.data)) return data.data;
    }
    return [];
  };

  useEffect(() => {
    const token = getToken();
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const loadStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data || data.stats || {});
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      let url;
      if (activeTab === 'pending') {
        url = `${API_URL}/api/reviews/admin/pending`;
      } else {
        url = `${API_URL}/api/reviews/admin/all?status=${activeTab}&page=${currentPage}&limit=20&type=${filterType}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      const list = safeArray(data, 'reviews');
      setReviews(list);
      setTotalReviews(data.total || list.length);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filterType, navigate, API_URL]);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [loadReviews]);

  // ✅ Load products for Add Review modal
  const loadProducts = async () => {
    setProductsLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/products?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const list = safeArray(data, 'products');
      setProducts(list);
    } catch (err) {
      console.error('Products load error:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (showAddModal && products.length === 0) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal]);

  // ✅ Add review image upload
  const handleAddImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const maxSize = 5 * 1024 * 1024;
    if (files.some(f => f.size > maxSize)) {
      return toast.error('Each image must be less than 5MB');
    }
    if (addForm.images.length + files.length > 5) {
      return toast.error('Maximum 5 images allowed');
    }

    setAddImagesUploading(true);
    const token = getToken();
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('media', file);

        const res = await fetch(`${API_URL}/api/reviews/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (data.success && data.data?.urls) {
          uploadedUrls.push(...data.data.urls);
        }
      } catch (err) {
        console.error('Image upload error:', err);
      }
    }

    if (uploadedUrls.length > 0) {
      setAddForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success(`✅ ${uploadedUrls.length} image(s) uploaded`);
    } else {
      toast.error('Image upload failed');
    }
    setAddImagesUploading(false);
    e.target.value = '';
  };

  const removeAddImage = (idx) => {
    setAddForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  // ✅ Submit new review
  const handleAddReview = async () => {
    if (!addForm.productId) return toast.error('Please select a product');
    if (!addForm.rating || addForm.rating < 1) return toast.error('Please select a rating');
    if (!addForm.review.trim()) return toast.error('Please write a review');
    if (addForm.review.length < 10) return toast.error('Review must be at least 10 characters');

    setAddSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/reviews/admin/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: addForm.productId,
          userName: addForm.userName.trim() || 'Admin Review',
          rating: addForm.rating,
          title: addForm.title.trim(),
          review: addForm.review.trim(),
          images: addForm.images
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('✅ Review added successfully!');
        setShowAddModal(false);
        setAddForm({
          productId: '',
          userName: '',
          rating: 0,
          hoverRating: 0,
          title: '',
          review: '',
          images: []
        });
        setProductSearch('');
        await loadReviews();
        await loadStats();
      } else {
        toast.error(data.error || 'Failed to add review');
      }
    } catch (err) {
      console.error('Add review error:', err);
      toast.error('Network error');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ✅ Filter
  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const fields = [
        review.user_name, review.user_email,
        review.product_name, review.review, review.title
      ].filter(Boolean).map(x => String(x).toLowerCase());
      if (!fields.some(f => f.includes(s))) return false;
    }
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) return false;
    if (filterType === 'rating_only' && !review.isRatingOnly) return false;
    if (filterType === 'with_comment' && review.isRatingOnly) return false;
    return true;
  });

  // ✅ Sort
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt);
    const dateB = new Date(b.created_at || b.createdAt);
    switch(sortBy) {
      case 'newest': return dateB - dateA;
      case 'oldest': return dateA - dateB;
      case 'highest': return b.rating - a.rating;
      case 'lowest': return a.rating - b.rating;
      default: return 0;
    }
  });

  // ✅ Bulk actions
  const handleSelectAll = (e) => {
    setSelectedReviews(e.target.checked ? sortedReviews.map(r => r._id || r.id) : []);
  };

  const toggleSelect = (id) => {
    setSelectedReviews(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkAction = async (action) => {
    if (selectedReviews.length === 0) return toast.error('Select reviews first');
    if (!window.confirm(`${action} ${selectedReviews.length} reviews?`)) return;

    const token = getToken();
    let success = 0;
    let failed = 0;

    for (const id of selectedReviews) {
      try {
        let url, method;
        if (action === 'approve') {
          url = `${API_URL}/api/reviews/admin/${id}/approve`;
          method = 'PATCH';
        } else if (action === 'reject') {
          url = `${API_URL}/api/reviews/admin/${id}/reject`;
          method = 'PATCH';
        } else {
          url = `${API_URL}/api/reviews/admin/${id}`;
          method = 'DELETE';
        }

        const res = await fetch(url, {
          method,
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) success++; else failed++;
      } catch { failed++; }
    }

    toast.success(`✅ ${success} ${action}d${failed ? `, ${failed} failed` : ''}`);
    setSelectedReviews([]);
    await loadReviews();
    await loadStats();
  };

  // ✅ Single action
  const handleAction = async (reviewId, type, note = '') => {
    setActionLoading(true);
    const token = getToken();
    try {
      const url = type === 'delete'
        ? `${API_URL}/api/reviews/admin/${reviewId}`
        : `${API_URL}/api/reviews/admin/${reviewId}/${type}`;
      const method = type === 'delete' ? 'DELETE' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: type === 'delete' ? undefined : JSON.stringify({ adminNote: note })
      });
      
      if (res.ok) {
        toast.success(type === 'approve' ? '✅ Approved!' : type === 'reject' ? '❌ Rejected' : '🗑️ Deleted');
        await loadReviews();
        await loadStats();
        setShowDetails(false);
      } else {
        toast.error('Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
      setShowNoteModal(false);
      setAdminNote('');
    }
  };

  const openActionModal = (reviewId, type) => {
    setActionReviewId(reviewId);
    setActionType(type);
    setAdminNote('');
    setShowNoteModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRating('all');
    setFilterType('all');
    setSortBy('newest');
    setSelectedReviews([]);
  };

  const getRatingColor = (rating) => {
    return {
      5: 'from-emerald-400 to-green-500',
      4: 'from-blue-400 to-indigo-500',
      3: 'from-yellow-400 to-amber-500',
      2: 'from-orange-400 to-red-400',
      1: 'from-red-400 to-rose-500'
    }[rating] || 'from-gray-400 to-gray-500';
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-sm ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  );

  const tabs = [
    { id: 'pending', label: 'Pending', count: stats.pending || 0, color: 'amber', icon: '⏳' },
    { id: 'approved', label: 'Approved', count: stats.approved || 0, color: 'emerald', icon: '✅' },
    { id: 'rejected', label: 'Rejected', count: stats.rejected || 0, color: 'rose', icon: '❌' },
    { id: 'all', label: 'All', count: stats.total || 0, color: 'gray', icon: '📊' },
  ];

  // ✅ Filter products for search
  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 50);

  const selectedProduct = products.find(p => (p._id || p.id) === addForm.productId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <AdminSidebar />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                ⭐ Review Management
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Moderate customer reviews & ratings</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition flex items-center gap-2"
              >
                ➕ Add Review
              </button>
              <button
                onClick={() => exportReviews(activeTab)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition flex items-center gap-2"
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* ============ STATS CARDS — CLICKABLE ============ */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <button
              onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
              className={`bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                activeTab === 'pending' ? 'ring-4 ring-amber-300 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-90 uppercase">Pending</span>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl font-bold">{stats.pending || 0}</p>
              <p className="text-[10px] opacity-90 mt-1">Awaiting approval</p>
            </button>
            <button
              onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
              className={`bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl p-4 text-white shadow-lg text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                activeTab === 'approved' ? 'ring-4 ring-emerald-300 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-90 uppercase">Approved</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold">{stats.approved || 0}</p>
              <p className="text-[10px] opacity-90 mt-1">Live on site</p>
            </button>
            <button
              onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
              className={`bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl p-4 text-white shadow-lg text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                activeTab === 'rejected' ? 'ring-4 ring-rose-300 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-90 uppercase">Rejected</span>
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-3xl font-bold">{stats.rejected || 0}</p>
              <p className="text-[10px] opacity-90 mt-1">Hidden</p>
            </button>
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl p-4 text-white shadow-lg text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                activeTab === 'all' ? 'ring-4 ring-purple-300 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-90 uppercase">Total</span>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold">{stats.total || 0}</p>
              <p className="text-[10px] opacity-90 mt-1">All reviews</p>
            </button>
            <button
              onClick={() => setFilterRating('5')}
              className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl p-4 text-white shadow-lg text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-90 uppercase">Avg Rating</span>
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-3xl font-bold">{(stats.avgRating || 0).toFixed(1)}</p>
              <p className="text-[10px] opacity-90 mt-1">Out of 5.0</p>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border-2 border-pink-100 shadow-sm overflow-hidden mb-6">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const colorMap = {
                  amber: 'from-amber-500 to-orange-500',
                  emerald: 'from-emerald-500 to-green-500',
                  rose: 'from-rose-500 to-red-500',
                  gray: 'from-gray-500 to-slate-500'
                };
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setSelectedReviews([]); }}
                    className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 border-b-4 ${
                      isActive 
                        ? `bg-gradient-to-r ${colorMap[tab.color]} text-white border-transparent shadow-inner` 
                        : 'text-gray-600 border-transparent hover:bg-pink-50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border-2 border-pink-100 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <input 
                  type="text" 
                  placeholder="🔍 Search reviews, products, customers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              <select 
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2.5 border-2 border-pink-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
              >
                <option value="all">⭐ All Ratings</option>
                <option value="5">5 ★★★★★</option>
                <option value="4">4 ★★★★</option>
                <option value="3">3 ★★★</option>
                <option value="2">2 ★★</option>
                <option value="1">1 ★</option>
              </select>

              <select 
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 border-2 border-pink-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
              >
                <option value="all">📋 All Types</option>
                <option value="rating_only">⭐ Quick Ratings</option>
                <option value="with_comment">📝 With Comments</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border-2 border-pink-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
              >
                <option value="newest">🆕 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="highest">⭐ Highest Rating</option>
                <option value="lowest">📉 Lowest Rating</option>
              </select>

              {(searchTerm || filterRating !== 'all' || filterType !== 'all' || sortBy !== 'newest') && (
                <button 
                  onClick={clearFilters} 
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {selectedReviews.length > 0 && (
              <div className="mt-3 pt-3 border-t-2 border-pink-100 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full">
                  {selectedReviews.length} selected
                </span>
                <button onClick={() => bulkAction('approve')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-md transition">
                  ✅ Approve All
                </button>
                <button onClick={() => bulkAction('reject')} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-md transition">
                  ❌ Reject All
                </button>
                <button onClick={() => bulkAction('delete')} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-bold hover:shadow-md transition">
                  🗑️ Delete All
                </button>
                <button onClick={() => setSelectedReviews([])} className="px-3 py-2 text-gray-500 text-sm font-bold hover:text-gray-700">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-3xl border-2 border-pink-100 p-6">
                  <div className="h-6 bg-pink-50 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-pink-50 rounded w-full mb-2"></div>
                  <div className="h-4 bg-pink-50 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sortedReviews.length === 0 ? (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-100 p-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No reviews found</h3>
              <p className="text-gray-500 text-sm">
                {activeTab === 'pending' ? 'No pending reviews. Great job!' : 'No reviews match your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReviews.map((review) => {
                const reviewId = review._id || review.id;
                const isSelected = selectedReviews.includes(reviewId);
                const userName = review.user_name || review.userId?.name || 'Anonymous';
                const userEmail = review.user_email || review.userId?.email || '';
                const productName = review.product_name || review.productId?.name || 'Unknown Product';
                const productImage = review.product_image || review.productId?.images?.[0];
                const createdAt = review.created_at || review.createdAt;
                const reviewText = review.review || review.comment || '';
                const isRatingOnly = review.isRatingOnly === true || !reviewText;
                const initial = userName.charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={reviewId} 
                    className={`bg-white rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                      isSelected ? 'border-pink-400 ring-2 ring-pink-200' : 'border-pink-100'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row">
                      <div className="flex items-start gap-3 p-5 lg:w-[280px] bg-gradient-to-br from-pink-50/50 to-white lg:border-r-2 border-pink-100">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(reviewId)}
                          className="mt-1 w-5 h-5 rounded border-pink-300 text-pink-500 focus:ring-pink-400 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-pink-100 mb-3 flex items-center justify-center">
                            {productImage ? (
                              <img src={productImage} alt={productName} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-3xl">🛍️</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-2 mb-1">{productName}</p>
                          {review.product_price && (
                            <p className="text-xs font-bold text-pink-600">₹{review.product_price}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{userName}</p>
                              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-gray-400 font-medium">
                              {createdAt ? new Date(createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              }) : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {renderStars(review.rating)}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${getRatingColor(review.rating)} text-white shadow-sm`}>
                            {review.rating}.0
                          </span>
                          {isRatingOnly && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              ⭐ QUICK
                            </span>
                          )}
                          {review.status === 'pending' && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">⏳ PENDING</span>
                          )}
                          {review.status === 'approved' && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✅ LIVE</span>
                          )}
                          {review.status === 'rejected' && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">❌ REJECTED</span>
                          )}
                        </div>

                        {review.title && (
                          <h4 className="font-bold text-gray-900 text-sm mb-2">{review.title}</h4>
                        )}

                        {!isRatingOnly && reviewText && (
                          <p className="text-gray-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{reviewText}</p>
                        )}
                        
                        {isRatingOnly && (
                          <p className="text-gray-400 text-sm italic mb-3">No comment provided</p>
                        )}

                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {review.images.map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                alt={`Review ${idx}`}
                                className="w-16 h-16 rounded-xl object-cover border-2 border-pink-100 cursor-pointer hover:scale-105 transition"
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        )}

                        {review.helpful_count > 0 && (
                          <p className="text-xs text-gray-500 font-medium">
                            👍 {review.helpful_count} people found this helpful
                          </p>
                        )}
                      </div>

                      <div className="p-5 lg:w-[180px] bg-gradient-to-br from-white to-pink-50/50 lg:border-l-2 border-pink-100 flex flex-col gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(reviewId, 'approve')}
                              disabled={actionLoading}
                              className="w-full px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-md transition disabled:opacity-50"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => openActionModal(reviewId, 'reject')}
                              disabled={actionLoading}
                              className="w-full px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:shadow-md transition disabled:opacity-50"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setSelectedReview(review); setShowDetails(true); }}
                          className="w-full px-3 py-2.5 bg-white border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-bold hover:bg-pink-50 transition"
                        >
                          👁️ View Details
                        </button>
                        <button
                          onClick={() => handleAction(reviewId, 'delete')}
                          disabled={actionLoading}
                          className="w-full px-3 py-2.5 bg-white border-2 border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-pink-200 rounded-xl text-sm font-bold text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-pink-200 rounded-xl text-sm font-bold text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition"
              >
                Next →
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            Showing {sortedReviews.length} of {reviews.length} reviews
            {selectedReviews.length > 0 && ` • ${selectedReviews.length} selected`}
          </p>
        </div>
      </div>

      {/* ============ ADD REVIEW MODAL ============ */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !addSubmitting && setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-5 flex justify-between items-center z-10">
              <div>
                <h3 className="text-lg font-bold text-white">➕ Add Review Manually</h3>
                <p className="text-xs text-white/80 mt-0.5">Review turant live hoga (auto-approved)</p>
              </div>
              <button 
                onClick={() => !addSubmitting && setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Product select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Product <span className="text-pink-500">*</span>
                </label>
                
                {selectedProduct ? (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-pink-50 to-white border-2 border-pink-200 rounded-2xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border-2 border-pink-100 flex-shrink-0 flex items-center justify-center">
                      {selectedProduct.images?.[0] ? (
                        <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🛍️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedProduct.brand || 'No brand'} • ₹{selectedProduct.price || 0}
                      </p>
                    </div>
                    <button
                      onClick={() => { setAddForm(prev => ({ ...prev, productId: '' })); setProductSearch(''); }}
                      className="text-xs text-pink-600 hover:text-pink-700 font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="🔍 Search product by name or brand..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 transition"
                    />
                    {productSearch && (
                      <div className="mt-2 max-h-64 overflow-y-auto border-2 border-pink-100 rounded-2xl">
                        {productsLoading ? (
                          <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">No products found</div>
                        ) : (
                          filteredProducts.map(p => (
                            <button
                              key={p._id || p.id}
                              onClick={() => {
                                setAddForm(prev => ({ ...prev, productId: p._id || p.id }));
                                setProductSearch('');
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 transition text-left border-b border-pink-50 last:border-b-0"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-pink-100 flex-shrink-0">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                <p className="text-[10px] text-gray-500">{p.brand || 'No brand'} • ₹{p.price || 0}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Customer Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Priya Sharma (leave empty for 'Admin Review')"
                  value={addForm.userName}
                  onChange={(e) => setAddForm(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Rating <span className="text-pink-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setAddForm(prev => ({ ...prev, hoverRating: star }))}
                      onMouseLeave={() => setAddForm(prev => ({ ...prev, hoverRating: 0 }))}
                      onClick={() => setAddForm(prev => ({ ...prev, rating: star }))}
                      className="text-4xl focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={star <= (addForm.hoverRating || addForm.rating) ? 'text-yellow-400' : 'text-gray-200'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Review Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Amazing product!"
                  value={addForm.title}
                  onChange={(e) => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 transition"
                  maxLength="100"
                />
              </div>

              {/* Review text */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Review Text <span className="text-pink-500">*</span>
                </label>
                <textarea
                  rows="4"
                  placeholder="Write the review content..."
                  value={addForm.review}
                  onChange={(e) => setAddForm(prev => ({ ...prev, review: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 transition resize-none"
                  maxLength="2000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {addForm.review.length}/2000 characters
                  {addForm.review.length > 0 && addForm.review.length < 10 && (
                    <span className="text-rose-500 ml-2 font-bold">Minimum 10 characters</span>
                  )}
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Images <span className="text-gray-400 font-normal">(optional, max 5)</span>
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {addForm.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-100">
                      <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeAddImage(idx)} 
                        className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {addForm.images.length < 5 && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleAddImageUpload} 
                        className="hidden" 
                        id="addReviewImageUpload" 
                      />
                      <label 
                        htmlFor="addReviewImageUpload" 
                        className={`w-20 h-20 border-2 border-dashed border-pink-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition ${addImagesUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {addImagesUploading ? (
                          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="text-xl text-pink-400">📸</span>
                            <span className="text-[9px] text-pink-500 font-bold mt-1">Upload</span>
                          </>
                        )}
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl">✨</span>
                <p className="text-sm text-emerald-800 font-medium">
                  Admin-added reviews are <strong>auto-approved</strong> and will appear on the product page immediately.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddReview}
                  disabled={addSubmitting || !addForm.productId || addForm.rating === 0 || addForm.review.length < 10}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-2xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addSubmitting ? '⏳ Adding...' : '✓ Add Review'}
                </button>
                <button
                  onClick={() => !addSubmitting && setShowAddModal(false)}
                  disabled={addSubmitting}
                  className="px-6 py-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {showNoteModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowNoteModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-5 text-white ${
              actionType === 'approve' 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {actionType === 'approve' ? '✅ Approve Review' : '❌ Reject Review'}
              </h3>
              <p className="text-xs opacity-90 mt-1">
                {actionType === 'approve' 
                  ? 'This review will appear on the product page' 
                  : 'This review will be hidden from customers'}
              </p>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Admin Note <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows="3"
                placeholder="Add an internal note..."
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 transition resize-none"
              />
              
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => handleAction(actionReviewId, actionType, adminNote)}
                  disabled={actionLoading}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold transition disabled:opacity-50 ${
                    actionType === 'approve' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg'
                  }`}
                >
                  {actionLoading ? '⏳ Processing...' : (actionType === 'approve' ? '✓ Approve' : '✗ Reject')}
                </button>
                <button 
                  onClick={() => setShowNoteModal(false)} 
                  className="px-6 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedReview && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-5 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-white">📋 Review Details</h3>
              <button 
                onClick={() => setShowDetails(false)} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex gap-4 p-4 bg-gradient-to-br from-pink-50 to-white rounded-2xl border-2 border-pink-100">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-pink-200 flex-shrink-0">
                  {selectedReview.product_image ? (
                    <img src={selectedReview.product_image} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 uppercase">Product</p>
                  <p className="font-bold text-gray-900 text-sm line-clamp-2 mt-1">
                    {selectedReview.product_name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Customer</p>
                <p className="font-bold text-gray-900">{selectedReview.user_name || 'Anonymous'}</p>
                <p className="text-sm text-gray-500">{selectedReview.user_email || ''}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Rating</p>
                <div className="flex items-center gap-3">
                  {renderStars(selectedReview.rating)}
                  <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${getRatingColor(selectedReview.rating)} text-white`}>
                    {selectedReview.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Title</p>
                  <p className="font-bold text-gray-900">{selectedReview.title}</p>
                </div>
              )}

              {selectedReview.review && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Review</p>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedReview.review}
                  </p>
                </div>
              )}

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                    Images ({selectedReview.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedReview.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Review ${idx}`} 
                        className="w-full aspect-square rounded-2xl object-cover border-2 border-pink-100 cursor-pointer hover:scale-105 transition"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  selectedReview.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  selectedReview.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  Status: {selectedReview.status?.toUpperCase()}
                </span>
                {selectedReview.isRatingOnly && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                    ⭐ Quick Rating
                  </span>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t-2 border-pink-100">
                {selectedReview.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => { openActionModal(selectedReview._id || selectedReview.id, 'approve'); setShowDetails(false); }} 
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-2xl font-bold hover:shadow-lg transition"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => { openActionModal(selectedReview._id || selectedReview.id, 'reject'); setShowDetails(false); }} 
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-2xl font-bold hover:shadow-lg transition"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { handleAction(selectedReview._id || selectedReview.id, 'delete'); }} 
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl font-bold hover:shadow-lg transition"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
