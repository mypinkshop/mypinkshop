import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CreateAd = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [adType, setAdType] = useState('product'); // 'product' or 'banner'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    budget: '',
    dailyBudget: '',
    bidType: 'cpc',
    bidAmount: '',
    startDate: '',
    endDate: '',
    // Banner specific
    bannerImage: '',
    bannerLink: '',
    bannerCta: 'Shop Now',
    bannerPosition: 'homepage_top',
    // Targeting
    categories: [],
    gender: 'all',
    ageMin: 18,
    ageMax: 65,
    device: 'all'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // Fetch vendor products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendor/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter campaign name');
      return;
    }

    if (adType === 'product' && !formData.productId) {
      toast.error('Please select a product');
      return;
    }

    if (adType === 'banner' && !formData.bannerImage) {
      toast.error('Please enter banner image URL');
      return;
    }

    if (adType === 'banner' && !formData.bannerLink) {
      toast.error('Please enter banner link URL');
      return;
    }

    if (!formData.budget || parseFloat(formData.budget) < 100) {
      toast.error('Minimum budget is ₹100');
      return;
    }

    if (!formData.dailyBudget || parseFloat(formData.dailyBudget) < 10) {
      toast.error('Minimum daily budget is ₹10');
      return;
    }

    if (!formData.bidAmount || parseFloat(formData.bidAmount) < 1) {
      toast.error('Minimum bid amount is ₹1');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();

    if (start < now) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      let endpoint = `${API_URL}/api/ads/${adType}`;
      let payload = {};

      if (adType === 'product') {
        payload = {
          name: formData.name,
          productId: formData.productId,
          budget: parseFloat(formData.budget),
          dailyBudget: parseFloat(formData.dailyBudget),
          bidType: formData.bidType,
          bidAmount: parseFloat(formData.bidAmount),
          startDate: formData.startDate,
          endDate: formData.endDate,
          targeting: {
            categories: formData.categories,
            gender: formData.gender,
            ageRange: {
              min: parseInt(formData.ageMin),
              max: parseInt(formData.ageMax)
            },
            device: formData.device
          }
        };
      } else {
        payload = {
          name: formData.name,
          budget: parseFloat(formData.budget),
          dailyBudget: parseFloat(formData.dailyBudget),
          bidType: 'cpm',
          bidAmount: parseFloat(formData.bidAmount),
          startDate: formData.startDate,
          endDate: formData.endDate,
          banner: {
            imageUrl: formData.bannerImage,
            linkUrl: formData.bannerLink,
            ctaText: formData.bannerCta,
            position: formData.bannerPosition
          },
          targeting: {
            categories: formData.categories,
            gender: formData.gender,
            ageRange: {
              min: parseInt(formData.ageMin),
              max: parseInt(formData.ageMax)
            },
            device: formData.device
          }
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Campaign created successfully!');
        navigate('/vendor/ads');
      } else {
        toast.error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Skincare', 'Makeup', 'Hair', 'Clothing', 'Accessories', 'Fragrance', 'Jewelry'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/vendor/ads" className="text-pink-500 hover:underline text-sm">
            ← Back to Ads
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Create New Campaign</h1>
        </div>

        {/* Ad Type Selection */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <button
              onClick={() => setAdType('product')}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition ${
                adType === 'product'
                  ? 'bg-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📦 Product Ad
            </button>
            <button
              onClick={() => setAdType('banner')}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition ${
                adType === 'banner'
                  ? 'bg-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🖼️ Banner Ad
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Campaign Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Summer Sale Campaign"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          {/* Product Selection (for product ads) */}
          {adType === 'product' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product *
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                required
              >
                <option value="">Select a product</option>
                {loadingProducts ? (
                  <option disabled>Loading products...</option>
                ) : (
                  products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - ₹{product.price}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Banner Details (for banner ads) */}
          {adType === 'banner' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image URL *
                </label>
                <input
                  type="url"
                  name="bannerImage"
                  value={formData.bannerImage}
                  onChange={handleChange}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
                {formData.bannerImage && (
                  <div className="mt-2">
                    <img 
                      src={formData.bannerImage} 
                      alt="Banner preview"
                      className="w-full max-h-40 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Link URL *
                </label>
                <input
                  type="url"
                  name="bannerLink"
                  value={formData.bannerLink}
                  onChange={handleChange}
                  placeholder="https://example.com/product"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  name="bannerCta"
                  value={formData.bannerCta}
                  onChange={handleChange}
                  placeholder="Shop Now"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Position
                </label>
                <select
                  name="bannerPosition"
                  value={formData.bannerPosition}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="homepage_top">Homepage Top</option>
                  <option value="homepage_middle">Homepage Middle</option>
                  <option value="category_page">Category Page</option>
                  <option value="product_page">Product Page</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Budget (₹) *
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="1000"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                min="100"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Min: ₹100</p>
            </div>

            {/* Daily Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Budget (₹) *
              </label>
              <input
                type="number"
                name="dailyBudget"
                value={formData.dailyBudget}
                onChange={handleChange}
                placeholder="100"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                min="10"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Min: ₹10</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Bid Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Type
              </label>
              <select
                name="bidType"
                value={formData.bidType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                disabled={adType === 'banner'}
              >
                <option value="cpc">Cost Per Click (CPC)</option>
                <option value="cpm">Cost Per 1000 Impressions (CPM)</option>
              </select>
              {adType === 'banner' && (
                <p className="text-xs text-gray-400 mt-1">Banner ads use CPM by default</p>
              )}
            </div>

            {/* Bid Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bid Amount (₹) *
              </label>
              <input
                type="number"
                name="bidAmount"
                value={formData.bidAmount}
                onChange={handleChange}
                placeholder={adType === 'product' ? '5' : '50'}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                min="1"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {adType === 'product' ? 'Per click' : 'Per 1000 impressions'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Targeting Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Targeting</h3>

            {/* Categories */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      formData.categories.includes(cat)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Select categories to target. Leave empty for all.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Device */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device
                </label>
                <select
                  name="device"
                  value={formData.device}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="all">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Age
                </label>
                <input
                  type="number"
                  name="ageMin"
                  value={formData.ageMin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  min="13"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Age
                </label>
                <input
                  type="number"
                  name="ageMax"
                  value={formData.ageMax}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  min="13"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <Link
              to="/vendor/ads"
              className="px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
