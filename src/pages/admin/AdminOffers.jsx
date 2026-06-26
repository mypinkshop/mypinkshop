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
  const [formData, setFormData] = useState({
    title: 'Free Shipping',
    description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'top_banner',
    isActive: true
  });

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  // Load offers
  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/api/offers/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load offers');
      }
      
      const data = await response.json();
      setOffers(Array.isArray(data) ? data : []);
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
    loadOffers();
  }, []);

  // Create/Update offer
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter offer title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter offer description');
      return;
    }
    if (!formData.minOrderValue || formData.minOrderValue <= 0) {
      toast.error('Please enter valid min order value');
      return;
    }
    if (!formData.discountValue || formData.discountValue <= 0) {
      toast.error('Please enter valid discount value');
      return;
    }
    
    setProcessingId('submitting');

    try {
      const url = editingOffer 
        ? `${API_URL}/api/offers/update/${editingOffer._id}`
        : `${API_URL}/api/offers/create`;
      
      const response = await fetch(url, {
        method: editingOffer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discountValue: parseInt(formData.discountValue),
          minOrderValue: parseInt(formData.minOrderValue)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(editingOffer ? '✅ Offer updated successfully!' : '✅ Offer created successfully!');
        setShowModal(false);
        setEditingOffer(null);
        resetForm();
        loadOffers();
      } else {
        toast.error(data.error || 'Failed to save offer');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 499,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      type: 'top_banner',
      isActive: true
    });
  };

  // Toggle offer status
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
        toast.error('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast.error('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete offer
  const deleteOffer = async (id) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    setProcessingId(id);
    try {
      const response = await fetch(`${API_URL}/api/offers/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('🗑️ Offer deleted successfully');
        loadOffers();
      } else {
        toast.error('Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Network error');
    } finally {
      setProcessingId(null);
    }
  };

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

  if (error && offers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="md:ml-64 flex items-center justify-center h-screen">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="md:ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎯 Offer Management</h1>
            <p className="text-gray-500 text-sm">Manage top banner offers and promotions</p>
          </div>
          <button
            onClick={() => {
              setEditingOffer(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition"
          >
            + Create New Offer
          </button>
        </div>

        {/* Active Offer Preview */}
        {offers.some(o => o.isActive && o.type === 'top_banner') ? (
          <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white rounded-2xl p-4 mb-6 animate-pulse">
            <p className="text-center text-sm font-medium">
              🔥 LIVE OFFER: {offers.find(o => o.isActive && o.type === 'top_banner')?.description}
            </p>
          </div>
        ) : (
          <div className="bg-gray-200 text-gray-500 rounded-2xl p-4 mb-6">
            <p className="text-center text-sm font-medium">
              ⚠️ No active offer. Create one below!
            </p>
          </div>
        )}

        {/* Offers List */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-pink-50 border-b border-pink-100">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Description</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-semibold">Min Order</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-semibold">Discount</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      No offers created yet. Click "Create New Offer" to get started.
                    </td>
                  </tr>
                ) : (
                  offers.map(offer => (
                    <tr key={offer._id} className="hover:bg-pink-50/30 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{offer.title}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-md truncate">{offer.description}</td>
                      <td className="px-6 py-4 text-center">₹{offer.minOrderValue}</td>
                      <td className="px-6 py-4 text-center">
                        {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(offer._id, offer.isActive)}
                          disabled={processingId === offer._id}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            offer.isActive 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {offer.isActive ? '✅ Active' : '⛔ Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingOffer(offer);
                              setFormData({
                                title: offer.title,
                                description: offer.description,
                                discountType: offer.discountType,
                                discountValue: offer.discountValue,
                                minOrderValue: offer.minOrderValue,
                                startDate: offer.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                                endDate: offer.endDate?.split('T')[0] || '',
                                type: offer.type || 'top_banner',
                                isActive: offer.isActive
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteOffer(offer._id)}
                            disabled={processingId === offer._id}
                            className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
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
      </div>

      {/* Modal - Properly Centered */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-pink-100 p-5 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOffer ? '✏️ Edit Offer' : '✨ Create New Offer'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl transition"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition"
                  placeholder="e.g., Summer Sale Offer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Banner Text) *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition resize-none"
                  placeholder="FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF"
                />
                <p className="text-xs text-gray-400 mt-1">This text will appear on the top banner</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Order (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition"
                    placeholder="499"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: parseInt(e.target.value) || 0})}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition"
                      placeholder="10"
                    />
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition bg-white"
                    >
                      <option value="percentage">% OFF</option>
                      <option value="fixed">₹ OFF</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty for no expiry</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === 'submitting'}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {processingId === 'submitting' ? '⏳ Saving...' : (editingOffer ? '💾 Update Offer' : '✨ Create Offer')}
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
