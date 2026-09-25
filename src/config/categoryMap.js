// Slug → Category Name mapping (URL ke liye)
export const CATEGORY_MAP = {
  'skincare': { name: 'Skincare', icon: '🧴', page: 'skincare' },
  'makeup': { name: 'Makeup', icon: '💄', page: 'makeup' },
  'haircare': { name: 'Haircare', icon: '💇‍♀️', page: 'hair' },
  'fashion': { name: 'Fashion', icon: '👗', page: 'clothing' },
  'accessories': { name: 'Accessories', icon: '👜', page: 'accessories' },
  'home-kitchen': { name: 'Home & Kitchen', icon: '🏠', page: 'home-kitchen' },
  'health-wellness': { name: 'Health & Wellness', icon: '🌿', page: 'health-wellness' },
  'electronics': { name: 'Electronics', icon: '📱', page: 'electronics' },
  'books-stationery': { name: 'Books & Stationery', icon: '📚', page: 'books-stationery' },
};

export const getCategoryBySlug = (slug) => CATEGORY_MAP[slug] || null;
