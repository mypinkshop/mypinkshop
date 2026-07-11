// src/components/RatingSummary.jsx
import { useState } from 'react';
import RatingStars from './RatingStars';

const RatingSummary = ({ 
  averageRating = 0, 
  totalReviews = 0, 
  ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  onFilterChange = null,
  className = ''
}) => {
  const [selectedFilter, setSelectedFilter] = useState(null);
  
  const handleFilterClick = (rating) => {
    const newFilter = selectedFilter === rating ? null : rating;
    setSelectedFilter(newFilter);
    if (onFilterChange) onFilterChange(newFilter);
  };
  
  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Average Rating */}
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-gray-800">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No'} ⭐
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
            <RatingStars rating={averageRating} size="lg" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}
          </p>
        </div>
        
        {/* Right: Rating Distribution */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            const isActive = selectedFilter === star;
            
            return (
              <button
                key={star}
                onClick={() => handleFilterClick(star)}
                className={`
                  flex items-center gap-3 w-full group transition
                  ${isActive ? 'opacity-100' : 'hover:opacity-80'}
                `}
              >
                <span className="text-sm text-gray-600 w-8">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`
                      h-full rounded-full transition-all duration-500
                      ${isActive ? 'bg-pink-500' : 'bg-yellow-400'}
                    `}
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;
