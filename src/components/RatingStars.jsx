// src/components/RatingStars.jsx
import { useState } from 'react';

const RatingStars = ({ 
  rating = 0, 
  maxStars = 5, 
  size = 'md', 
  interactive = false, 
  onRatingChange = null,
  showLabel = false,
  label = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl'
  };

  const handleClick = (star) => {
    if (!interactive) return;
    setSelectedRating(star);
    if (onRatingChange) onRatingChange(star);
  };

  const handleMouseEnter = (star) => {
    if (!interactive) return;
    setHoverRating(star);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const displayRating = interactive ? (hoverRating || selectedRating) : rating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(maxStars)].map((_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= displayRating;
          
          return (
            <button
              key={starNumber}
              type="button"
              onClick={() => handleClick(starNumber)}
              onMouseEnter={() => handleMouseEnter(starNumber)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                ${sizeClasses[size]} 
                transition-all duration-150
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                ${!interactive && 'pointer-events-none'}
                focus:outline-none
              `}
            >
              <span className={isFilled ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          );
        })}
      </div>
      
      {showLabel && (
        <span className="text-sm text-gray-500 ml-1">
          {label || (rating > 0 ? `${rating.toFixed(1)} ★` : 'No ratings')}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
