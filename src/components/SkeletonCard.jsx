function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-pink-100 animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 sm:h-52 md:h-60 bg-gradient-to-br from-gray-200 to-gray-300"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-8"></div>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-9 bg-gray-200 rounded-full"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
