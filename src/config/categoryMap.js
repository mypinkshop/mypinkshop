// src/config/categoryMap.js
// Slug → Category Name mapping (URL ke liye)
// Ye file automatically categories table se match karti hai

export const CATEGORY_MAP = {
  'skincare':          { name: 'Skincare',          icon: '🧴', description: 'Glow up with premium skincare' },
  'makeup':            { name: 'Makeup',            icon: '💄', description: 'Enhance your beauty with makeup' },
  'haircare':          { name: 'Haircare',          icon: '💇‍♀️', description: 'Nourish your hair' },
  'fashion':           { name: 'Fashion',           icon: '👗', description: 'Trendy women\'s fashion' },
  'accessories':       { name: 'Accessories',       icon: '👜', description: 'Complete your look' },
  'home-kitchen':      { name: 'Home & Kitchen',    icon: '🏠', description: 'Make your home beautiful' },
  'health-wellness':   { name: 'Health & Wellness', icon: '🌿', description: 'Live healthy, live happy' },
  'electronics':       { name: 'Electronics',       icon: '📱', description: 'Latest gadgets & accessories' },
  'books-stationery':  { name: 'Books & Stationery', icon: '📚', description: 'Books, pens & more' },
};

export const getCategoryBySlug = (slug) => CATEGORY_MAP[slug] || null;

// ✅ Reverse lookup: naam se slug
export const getSlugByName = (name) => {
  const entry = Object.entries(CATEGORY_MAP).find(([_, v]) => v.name === name);
  return entry ? entry[0] : null;
};
