// components/CategorySidebar.js
import { Link } from 'react-router-dom';

const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedRating,
  setSelectedRating,
  clearFilters,
  products,
  filteredProducts
}) => {
  return (
    <div className="md:block md:w-80 lg:w-96 space-y-5">
      
      {/* Categories */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-pink-500">✨</span> Categories
        </h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="category" 
                  checked={selectedCategory === cat.id} 
                  onChange={() => setSelectedCategory(cat.id)}
                  className="w-4 h-4 text-pink-500 focus:ring-pink-400"
                />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </div>
              <span className="text-xs text-gray-400">{cat.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-pink-500">💰</span> Price Range
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input 
              type="number" 
              placeholder="Min ₹" 
              value={minPrice} 
              onChange={(e) => setMinPrice(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
          <div className="flex-1">
            <input 
              type="number" 
              placeholder="Max ₹" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-pink-500">⭐</span> Rating
        </h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(r => (
            <label key={r} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
              <input 
                type="radio" 
                name="rating" 
                checked={selectedRating === r} 
                onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} 
                className="w-4 h-4 text-pink-500"
              />
              <div className="flex text-yellow-400 text-sm">
                {'★'.repeat(r)}{'☆'.repeat(5 - r)}
              </div>
              <span className="text-xs text-gray-500">& above</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button 
        onClick={clearFilters} 
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-sm font-medium hover:shadow-lg transition-all"
      >
        Clear All Filters ✨
      </button>
    </div>
  );
};

export default CategorySidebar;
