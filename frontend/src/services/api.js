// YAHAN SE SARI API CALLS HONGI
const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Hero banner fetch karne ke liye
  getHeroBanner: async () => {
    const response = await fetch(`${API_BASE_URL}/homepage/hero-banner`);
    return response.json();
  },

  // Deals fetch karne ke liye
  getDeals: async () => {
    const response = await fetch(`${API_BASE_URL}/homepage/deals`);
    return response.json();
  },

  // Categories fetch karne ke liye
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/homepage/categories`);
    return response.json();
  },

  // Admin panel se banner add karne ke liye
  addBanner: async (bannerData) => {
    const response = await fetch(`${API_BASE_URL}/admin/banners`, {
      method: 'POST',
      body: bannerData, // FormData
    });
    return response.json();
  },

  // Admin panel se deal add karne ke liye
  addDeal: async (dealData) => {
    const response = await fetch(`${API_BASE_URL}/admin/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealData),
    });
    return response.json();
  },
};
