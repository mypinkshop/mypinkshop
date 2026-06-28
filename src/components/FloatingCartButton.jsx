import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function FloatingCartButton() {
  const { cartCount } = useCart();

  // Agar cart empty hai toh show mat karo
  if (cartCount === 0) {
    return null;
  }

  return (
    <Link
      to="/cart"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Go to cart"
    >
      <div className="relative">
        {/* Main Button */}
        <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95">
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
            />
          </svg>
        </div>

        {/* Count Badge */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {cartCount > 99 ? '99+' : cartCount}
        </span>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          View Cart ({cartCount} items)
        </div>
      </div>
    </Link>
  );
}

export default FloatingCartButton;
