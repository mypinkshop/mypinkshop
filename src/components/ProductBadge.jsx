// src/components/ProductBadge.jsx
import React from 'react';

const ProductBadge = ({ product }) => {
  return (
    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
      {product.isMyPinkShopChoice && (
        <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-medium flex items-center gap-1">
          <span className="text-sm">✨</span> MyPinkShop Choice
        </span>
      )}
      
      {product.isBestSeller && !product.isMyPinkShopChoice && (
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-medium">
          ⭐ Best Seller
        </span>
      )}
      
      {product.isNew && !product.isMyPinkShopChoice && !product.isBestSeller && (
        <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-medium">
          🆕 New Arrival
        </span>
      )}
      
      {product.discountPercent >= 20 && (
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
          {product.discountPercent}% OFF
        </span>
      )}
    </div>
  );
};

export default ProductBadge;
