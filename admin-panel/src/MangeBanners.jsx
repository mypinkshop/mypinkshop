import React, { useState } from 'react';
import { api } from '../services/adminApi';

const ManageBanners = () => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cashback: '',
    ctaLink: '',
    position: 'hero'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('subtitle', formData.subtitle);
    data.append('cashback', formData.cashback);
    data.append('ctaLink', formData.ctaLink);
    data.append('position', formData.position);
    data.append('image', imageFile);

    try {
      const result = await api.addBanner(data);
      if (result.success) {
        alert('Banner added successfully! 🎉');
        // Reset form
        setFormData({
          title: '',
          subtitle: '',
          cashback: '',
          ctaLink: '',
          position: 'hero'
        });
        setImageFile(null);
      }
    } catch (error) {
      alert('Error adding banner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Banner</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Banner Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded-lg p-2"
            placeholder="e.g., Shop t-shirts & polos"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Subtitle / Price</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
            className="w-full border rounded-lg p-2"
            placeholder="e.g., Under ₹399"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Cashback Text (Optional)</label>
          <input
            type="text"
            value={formData.cashback}
            onChange={(e) => setFormData({...formData, cashback: e.target.value})}
            className="w-full border rounded-lg p-2"
            placeholder="e.g., 5% cashback with ICICI card"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Banner Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">CTA Link</label>
          <input
            type="text"
            value={formData.ctaLink}
            onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
            className="w-full border rounded-lg p-2"
            placeholder="e.g., /shop/t-shirts"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Position</label>
          <select
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            className="w-full border rounded-lg p-2"
          >
            <option value="hero">Hero Banner (Top)</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Banner →'}
        </button>
      </form>
    </div>
  );
};

export default ManageBanners;
