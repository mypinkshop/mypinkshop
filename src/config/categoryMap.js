// src/config/categoryMap.js
// Slug → Category Name mapping (URL ke liye)

export const CATEGORY_MAP = {
  'skincare':          { name: 'Skincare',          icon: '🧴' },
  'makeup':            { name: 'Makeup',            icon: '💄' },
  'haircare':          { name: 'Haircare',          icon: '💇‍♀️' },
  'fashion':           { name: 'Fashion',           icon: '👗' },
  'accessories':       { name: 'Accessories',       icon: '👜' },
  'home-kitchen':      { name: 'Home & Kitchen',    icon: '🏠' },
  'health-wellness':   { name: 'Health & Wellness', icon: '🌿' },
  'electronics':       { name: 'Electronics',       icon: '📱' },
  'books-stationery':  { name: 'Books & Stationery', icon: '📚' },
};

export const getCategoryBySlug = (slug) => CATEGORY_MAP[slug] || null;
