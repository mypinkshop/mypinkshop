import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: 'Free Shipping',
    description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 999,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'top_banner'
  });

  const API_URL = 'https://mypinkshop-dr93.vercel.app';
  const token = localStorage.getItem('adminToken');

  // Load offers
  const loadOffers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/offers/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
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
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert(editingOffer ? 'Offer updated!' : 'Offer created!');
        setShowModal(false);
        setEditingOffer(null);
        setFormData({
          title: 'Free Shipping',
          description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
          discountType: 'percentage',
          discountValue: 10,
          minOrderValue: 999,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          type: 'top_banner'
        });
        loadOffers();
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer');
    }
  };

  // Toggle offer status
  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/offers/toggle/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadOffers();
      }
    } catch (error) {
      console.error('Error toggling offer:', error);
    }
  };

  // Delete offer
  const deleteOffer = async (id) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      const response = await fetch(`${API_URL}/api/offers/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadOffers();
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="md:ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Offer Management</h1>
            <p className="text-gray-500 text-sm">Manage top banner offers and promotions</p>
          </div>
          <button
            onClick={() => {
              setEditingOffer(null);
              setFormData({
                title: 'Free Shipping',
                description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
                discountType: 'percentage',
                discountValue: 10,
                minOrderValue: 999,
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                type: 'top_banner'
              });
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition"
          >
            + Create New Offer
          </button>
        </div>

        {/* Active Offer Preview */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white rounded-2xl p-4 mb-6">
          <p className="text-center text-sm font-medium">
            🔥 LIVE OFFER: {offers.find(o => o.isActive && o.type === 'top_banner')?.description || 'No active offer'}
          </p>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
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
              {offers.map(offer => (
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        offer.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {offer.isActive ? 'Active' : 'Inactive'}
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
                            type: offer.type
                          });
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteOffer(offer._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No offers created yet. Click "Create New Offer" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-pink-100 p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Free Shipping Offer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Banner Text)</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: parseInt(e.target.value)})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: parseInt(e.target.value)})}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                    />
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-pink-500"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition"
                >
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
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
