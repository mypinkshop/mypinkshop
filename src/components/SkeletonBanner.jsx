function SkeletonBanner() {
  return (
    <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonBanner;
