import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-pink-50">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="bg-pink-500 text-white px-6 py-3 rounded-full hover:bg-pink-600 transition inline-block">
            Continue Shopping →
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal();
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-pink-100">
        <div className="flex items-center justify-between flex-wrap gap-4 px-4 py-3 max-w-7xl mx-auto">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">MyPinkShop</h1>
            <p className="text-xs text-pink-400">for the girlies ✨</p>
          </Link>
          <div className="flex gap-5 text-gray-600">
            <i className="fa-regular fa-heart text-xl cursor-pointer"></i>
            <Link to="/cart" className="relative">
              <i className="fa-solid fa-bag-shopping text-xl"></i>
              <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full px-1.5">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </Link>
            <i className="fa-regular fa-user text-xl cursor-pointer"></i>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link to="/" className="hover:text-pink-500">Home</Link> &gt; <span className="text-pink-500">Cart</span>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-pink-100 overflow-hidden">
              {/* Header Row - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-pink-50 text-sm font-semibold text-gray-600 border-b border-pink-100">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Total</div>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-6 py-5 border-b border-pink-100">
                  {/* Product Info */}
                  <div className="md:col-span-6 flex gap-4">
                    <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center text-3xl">
                      {item.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-red-400 mt-2 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2 text-center">
                    <span className="md:hidden text-gray-500 text-sm mr-2">Price:</span>
                    <span className="font-semibold text-gray-800">₹{item.price}</span>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 flex justify-center">
                    <div className="flex items-center gap-3 border border-pink-100 rounded-full px-3 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full hover:bg-pink-100 text-pink-500 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full hover:bg-pink-100 text-pink-500 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2 text-center">
                    <span className="md:hidden text-gray-500 text-sm mr-2">Total:</span>
                    <span className="font-bold text-pink-500">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/" className="inline-flex items-center gap-2 mt-6 text-pink-500 hover:text-pink-600">
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-xl border border-pink-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-pink-100">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : '₹' + shipping}</span>
                </div>
                <div className="flex justify-between text-gray-600 pb-2 border-b border-pink-100">
                  <span>Tax (5% GST)</span>
                  <span>₹{tax}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-800 mb-6">
                <span>Total</span>
                <span className="text-pink-500">₹{total}</span>
              </div>

              <button className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-3 rounded-full font-semibold hover:from-pink-600 transition">
                Proceed to Checkout →
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Free shipping on orders above ₹999
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-10 py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-pink-500 font-bold text-lg mb-2">MyPinkShop</h3>
            <p className="text-sm">aesthetic & affordable 💕</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Shop</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Skincare</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Makeup</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">The Drip</a>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Contact Us</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">FAQs</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Shipping</a>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Social</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Instagram</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">TikTok</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Pinterest</a>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-gray-800 mt-8">
          <p>© 2025 MyPinkShop – made with 💖 for the girlies</p>
        </div>
      </footer>
    </div>
  );
}

export default Cart;
