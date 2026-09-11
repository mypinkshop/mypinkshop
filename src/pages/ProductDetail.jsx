import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import QuickRating from '../components/QuickRating';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';
import { setCacheWithTTL, getCacheWithTTL, safeRemoveItem } from '../lib/utils';

// Optimized image function
const getOptimizedImage = (url) => {
  if (!url) return null;
  if (url.includes('amazon') || url.includes('media-amazon')) {
    return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
  }
  return url;
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showZoom, setShowZoom] = useState(false);

  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedVariationId, setSelectedVariationId] = useState('');

  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);

  const [galleryImages, setGalleryImages] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const fetchRelatedProducts = async (category) => {
    if (!category) return;
    setLoadingRelated(true);
    try {
      const response = await fetch(`${API_URL}/api/products?category=${category}&limit=10`);
      const data = await response.json();
      let related = Array.isArray(data) ? data : (data.data || []);
      related = related.filter(p => (p._id !== id && p.id !== id)).slice(0, 6);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const updateGalleryForVariation = (variation, productImagesList, isClothing) => {
    if (!isClothing) {
      setGalleryImages([...productImagesList]);
      setSelectedImage(0);
      return;
    }

    if (!variation || !variation.image || variation.image.length === 0) {
      setGalleryImages([...productImagesList]);
      setSelectedImage(0);
      return;
    }

    const variationImages = Array.isArray(variation.image) ? variation.image : [variation.image];
    const productImagesListArr = Array.isArray(productImagesList) ? productImagesList : [productImagesList];

    const newGallery = [...variationImages];
    const remainingProductImages = productImagesListArr.slice(variationImages.length);
    newGallery.push(...remainingProductImages);

    setGalleryImages(newGallery);
    setSelectedImage(0);
  };

  // ✅ Load product with quota-safe cache
  useEffect(() => {
    const loadProduct = async () => {
      if (!id || id === 'undefined') {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ✅ Safe read from cache
        const cached = getCacheWithTTL(sessionStorage, `product_${id}`);

        if (cached && (cached._id || cached.id)) {
          const productData = cached;
          setProduct(productData);

          const isClothing = productData.mainCategory === 'Clothing' || productData.category === 'Clothing';
          const productImgs = productData.images && productData.images.length > 0 ? productData.images : [];
          setGalleryImages([...productImgs]);
          setSelectedImage(0);
          fetchRelatedProducts(productData.mainCategory || productData.category);

          if (productData.variations && productData.variations.length > 0) {
            const defaultVariation = productData.variations[0];
            setSelectedVariation(defaultVariation);
            setSelectedVariationId(defaultVariation.id || defaultVariation._id);
            updateGalleryForVariation(defaultVariation, productImgs, isClothing);
          }
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');

        const data = await response.json();
        const productData = data.data || data;

        if (productData && (productData._id || productData.id)) {
          // ✅ Safe write to cache (quota-safe, 24 hours TTL)
          setCacheWithTTL(sessionStorage, `product_${id}`, productData, 24 * 60 * 60 * 1000);

          setProduct(productData);

          const isClothing = productData.mainCategory === 'Clothing' || productData.category === 'Clothing';
          const productImgs = productData.images && productData.images.length > 0 ? productData.images : [];
          setGalleryImages([...productImgs]);
          setSelectedImage(0);
          fetchRelatedProducts(productData.mainCategory || productData.category);

          if (productData.variations && productData.variations.length > 0) {
            const defaultVariation = productData.variations[0];
            setSelectedVariation(defaultVariation);
            setSelectedVariationId(defaultVariation.id || defaultVariation._id);
            updateGalleryForVariation(defaultVariation, productImgs, isClothing);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setCheckingDelivery(true);
    setDeliveryStatus(null);

    try {
      const response = await fetch(`${API_URL}/api/shipping/check-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode: pincode,
          cartTotal: getCurrentPrice(),
          weight: product?.weight || 0.5
        })
      });

      const data = await response.json();
      const deliveryData = data.data || data;

      if ((data.success || deliveryData.success) && (deliveryData.deliverable !== false)) {
        let deliveryText = '';
        const est = deliveryData.estimatedDelivery;

        if (est?.minDate && est?.maxDate) {
          if (est.minDate === est.maxDate) {
            deliveryText = `Expected delivery on ${est.maxDate}`;
          } else {
            deliveryText = `Expected delivery between ${est.minDate} - ${est.maxDate}`;
          }
        } else if (est?.maxDays) {
          deliveryText = `Expected delivery in ${est.maxDays} business days`;
        } else {
          deliveryText = `Delivery available to PIN ${pincode}`;
        }

        setDeliveryStatus({
          isDeliverable: true,
          message: `✅ ${deliveryText}`,
          estimatedDays: est?.maxDays ? `${est.maxDays} days` : null
        });
        toast.success('Delivery available!');
      } else {
        setDeliveryStatus({
          isDeliverable: false,
          message: deliveryData.message || '❌ Sorry, delivery is not available to this pincode yet.'
        });
        toast.error('Delivery not available');
      }
    } catch (error) {
      console.error('Delivery check network error:', error);
      toast.error('Could not connect to shipping server');
    } finally {
      setCheckingDelivery(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    const maxStock = getCurrentStock();
    if (quantity < maxStock) setQuantity(quantity + 1);
  };

  const getCurrentPrice = () => {
    if (selectedVariation?.price) return selectedVariation.price;
    return product?.price || product?.sellingPrice || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariation && selectedVariation.stock !== undefined && selectedVariation.stock !== null) {
      return selectedVariation.stock;
    }
    if (product?.stock !== undefined && product?.stock !== null) {
      return product.stock;
    }
    return 0;
  };

  const getCurrentMrp = () => {
    if (selectedVariation?.mrp) return selectedVariation.mrp;
    return product?.originalPrice || product?.mrp || getCurrentPrice() * 1.2;
  };

  const getDiscountPercent = () => {
    const mrp = getCurrentMrp();
    const price = getCurrentPrice();
    if (mrp > price) return Math.round(((mrp - price) / mrp) * 100);
    return 0;
  };

  const handleVariationChange = (variationId) => {
    const variation = product.variations.find(v => (v.id || v._id) === variationId);
    if (variation) {
      setSelectedVariation(variation);
      setSelectedVariationId(variationId);
      setQuantity(1);

      const isClothing = product.mainCategory === 'Clothing' || product.category === 'Clothing';
      const productImgs = product.images && product.images.length > 0 ? product.images : [];
      updateGalleryForVariation(variation, productImgs, isClothing);
    }
  };

  const handleCartButtonClick = () => {
    if (!product) return;
    if (quantity < 1) {
      toast.error('Please select at least 1 quantity');
      return;
    }

    const currentStock = getCurrentStock();
    if (quantity > currentStock) {
      toast.error(`Only ${currentStock} items available in stock`);
      return;
    }

    if (addedToCart) {
      navigate('/cart');
    } else {
      const cartItem = {
        id: product._id || product.id,
        name: product.name,
        price: getCurrentPrice(),
        quantity: quantity,
        image: galleryImages[0] || (product.images && product.images[0]) || null,
        category: product.category,
        stock: getCurrentStock()
      };

      if (selectedVariation) {
        cartItem.variationName = selectedVariation.name;
        cartItem.variationSecondary = selectedVariation.secondaryName;
        cartItem.variationId = selectedVariation.id || selectedVariation._id;
        cartItem.variationImage = selectedVariation.image;
      }

      addToCart(cartItem);
      setAddedToCart(true);
      toast.success('Added to cart!');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (quantity < 1) {
      toast.error('Please select at least 1 quantity');
      return;
    }

    const currentStock = getCurrentStock();
    if (quantity > currentStock) {
      toast.error(`Only ${currentStock} items available in stock`);
      return;
    }

    const cartItem = {
      id: product._id || product.id,
      name: product.name,
      price: getCurrentPrice(),
      quantity: quantity,
      image: galleryImages[0] || (product.images && product.images[0]) || null,
      category: product.category,
      stock: getCurrentStock()
    };

    if (selectedVariation) {
      cartItem.variationName = selectedVariation.name;
      cartItem.variationSecondary = selectedVariation.secondaryName;
      cartItem.variationId = selectedVariation.id || selectedVariation._id;
      cartItem.variationImage = selectedVariation.image;
    }

    addToCart(cartItem);
    toast.success('Proceeding to checkout!');
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleRatingSubmitted = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        const productData = data.data || data;

        if (productData && (productData._id || productData.id)) {
          setProduct(productData);
          // ✅ Safe write (quota-safe)
          setCacheWithTTL(sessionStorage, `product_${id}`, productData, 24 * 60 * 60 * 1000);
        }
      }
    } catch (error) {
      console.error('Error refreshing product:', error);
    }
  };

  const productImages = product?.images && product.images.length > 0 ? product.images : [];

  const getDescriptionBullets = () => {
    if (product?.description && Array.isArray(product.description)) {
      return product.description.filter(b => b && b.trim());
    }
    if (product?.description && typeof product.description === 'string') {
      if (product.description.includes('|')) {
        return product.description.split('|').map(b => b.trim()).filter(b => b);
      }
      if (product.description.includes('\n')) {
        return product.description.split('\n').filter(b => b.trim() && b.length > 5);
      }
      return [product.description];
    }
    if (product?.fullDescription && Array.isArray(product.fullDescription)) {
      return product.fullDescription.filter(b => b && b.trim());
    }
    return [];
  };

  const getKeyFeatures = () => product?.keyFeatures || [];

  const getSpecifications = () => {
    const specs = {};
    if (product?.brand) specs['Brand'] = product.brand;
    if (product?.mainCategory || product?.category) specs['Category'] = product.mainCategory || product.category;
    if (product?.weight) specs['Weight'] = product.weight;
    if (product?.dimensions) specs['Dimensions'] = product.dimensions;
    if (product?.fabric) specs['Fabric'] = product.fabric;
    if (product?.material) specs['Material'] = product.material;
    if (product?.gender && product.gender !== 'unisex') specs['Gender'] = product.gender === 'men' ? 'Men' : product.gender === 'women' ? 'Women' : 'Kids';
    if (product?.skinType && product.skinType !== 'all') specs['Skin Type'] = product.skinType.charAt(0).toUpperCase() + product.skinType.slice(1);
    if (product?.hairType && product.hairType !== 'all') specs['Hair Type'] = product.hairType.charAt(0).toUpperCase() + product.hairType.slice(1);
    if (product?.finish) specs['Finish'] = product.finish;
    if (product?.coverage) specs['Coverage'] = product.coverage;
    if (product?.shade) specs['Shade'] = product.shade;
    if (product?.ingredients) specs['Key Ingredients'] = product.ingredients;
    if (product?.sku) specs['SKU'] = product.sku;
    if (product?.tax) specs['GST'] = `${product.tax}%`;
    specs['Return Policy'] = '7 days return';
    return specs;
  };

  const generateProductSchema = () => {
    if (!product) return null;
    const currentPrice = getCurrentPrice();
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": productImages[0],
      "description": product.shortDescription || (product.description ? (typeof product.description === 'string' ? product.description.substring(0, 200) : '') : ''),
      "sku": product._id || product.id,
      "brand": { "@type": "Brand", "name": product.brand || "MyPinkShop" },
      "offers": {
        "@type": "Offer",
        "url": `https://www.mypinkshop.com/product/${product._id || product.id}`,
        "priceCurrency": "INR",
        "price": currentPrice,
        "priceValidUntil": "2026-12-31",
        "availability": getCurrentStock() > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": { "@type": "Organization", "name": "MyPinkShop" }
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <Helmet><title>Product Not Found | MyPinkShop</title></Helmet>
        <OfferBanner />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Product Not Found</h2>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transition">Browse Products →</Link>
          </div>
        </div>
      </div>
    );
  }

  const descriptionBullets = getDescriptionBullets();
  const keyFeatures = getKeyFeatures();
  const specifications = getSpecifications();
  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const currentMrp = getCurrentMrp();
  const discountPercent = getDiscountPercent();
  const hasVariations = product.variations && product.variations.length > 0;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock < 10;
  const isButtonDisabled = isOutOfStock || quantity < 1;
  const isClothing = product.mainCategory === 'Clothing' || product.category === 'Clothing';
  const productSchema = generateProductSchema();
  const savings = currentMrp > currentPrice ? Math.round(currentMrp - currentPrice) : 0;

  return (
    <>
      <Helmet>
        <title>{product.name} | Buy Online at Best Price | MyPinkShop</title>
        <meta name="description" content={product.shortDescription || `Buy ${product.name} online at best price in India. ${product.brand || 'MyPinkShop'} product with ₹${currentPrice}. Free shipping available. Shop now!`} />
        <link rel="canonical" href={`https://www.mypinkshop.com/product/${product._id || product.id}`} />
        <meta property="og:title" content={`${product.name} | MyPinkShop`} />
        <meta property="og:description" content={product.shortDescription || `Shop ${product.name} at best price. ${discountPercent}% off available.`} />
        <meta property="og:image" content={productImages[0]} />
        <meta property="product:price:amount" content={currentPrice} />
        <meta property="product:price:currency" content="INR" />
        {productSchema && <script type="application/ld+json">{JSON.stringify(productSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* ============ HEADER ============ */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">MyPinkShop</h1>
                  <p className="text-[9px] text-gray-400">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-gray-50 transition-all"
                  />
                  <button onClick={handleSearch} className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:shadow-md">🔍</button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></Link>}
              </div>
            </div>
          </div>
        </header>

        {/* ============ BREADCRUMB ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/shop" className="text-gray-500 hover:text-pink-500 transition">Shop</Link>
            {product.mainCategory && (
              <>
                <span className="text-gray-400">/</span>
                <Link to={`/shop?category=${product.mainCategory}`} className="text-gray-500 hover:text-pink-500 transition">{product.mainCategory}</Link>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        {/* ============ MAIN PRODUCT SECTION ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* ============ LEFT — IMAGE GALLERY ============ */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Main Image */}
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg border border-pink-100 aspect-square flex items-center justify-center group">
                <img
                  src={getOptimizedImage(galleryImages[selectedImage] || productImages[0])}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain p-4 cursor-zoom-in"
                  loading="eager"
                  onClick={() => setShowZoom(true)}
                />

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistToggle}
                  className="absolute top-4 right-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all border border-pink-100"
                >
                  <span className="text-2xl">{isInWishlist(product._id || product.id) ? '❤️' : '🤍'}</span>
                </button>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {discountPercent}% OFF
                  </div>
                )}

                {/* Stock Badge */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-white text-gray-800 font-bold px-6 py-3 rounded-full">Out of Stock</span>
                  </div>
                )}

                {/* Zoom hint */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-xs text-gray-600 px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition">
                  🔍 Click to zoom
                </div>
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-2xl overflow-hidden flex-shrink-0 transition-all ${
                        selectedImage === idx
                          ? 'border-pink-500 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <img src={getOptimizedImage(img)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-3 text-center border border-pink-100 shadow-sm">
                  <div className="text-2xl mb-1">🚚</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Free Shipping</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-pink-100 shadow-sm">
                  <div className="text-2xl mb-1">💵</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 font-medium">COD Available</p>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center border border-pink-100 shadow-sm">
                  <div className="text-2xl mb-1">↩️</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 font-medium">7-Day Return</p>
                </div>
              </div>
            </div>

            {/* ============ RIGHT — PRODUCT INFO ============ */}
            <div className="space-y-5">

              {/* Brand */}
              {product.brand && (
                <Link
                  to={`/shop?brand=${encodeURIComponent(product.brand)}`}
                  className="inline-block text-sm font-semibold text-pink-600 hover:text-pink-700 transition"
                >
                  {product.brand}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                  <span className="text-sm font-bold text-green-700">{product.rating || 4.5}</span>
                  <span className="text-yellow-400 text-sm">★</span>
                </div>
                <span className="text-sm text-gray-500">
                  {(product.reviewCount || 0).toLocaleString()} ratings
                </span>
                {user && (
                  <>
                    <span className="text-gray-300">|</span>
                    <QuickRating
                      productId={id}
                      onRatingSubmitted={handleRatingSubmitted}
                      buttonText="⭐ Rate this"
                      enablePopup={true}
                    />
                  </>
                )}
              </div>

              {/* Price Block */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-pink-600">₹{currentPrice.toLocaleString()}</span>
                  {currentMrp > currentPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through">₹{currentMrp.toLocaleString()}</span>
                      <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    🎉 You save ₹{savings.toLocaleString()}!
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
              </div>

              {/* Stock Status */}
              {isOutOfStock ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-lg">❌</span>
                  <span className="text-sm font-semibold text-red-700">Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <span className="text-sm font-semibold text-amber-700">Only {currentStock} left in stock - order soon!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <span className="text-green-500 text-lg">✅</span>
                  <span className="text-sm font-semibold text-green-700">In Stock ({currentStock} available)</span>
                </div>
              )}

              {/* Variations */}
              {hasVariations && (
                <div className="border-t border-pink-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🎨</span> Select Option
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variations.map((variation) => {
                      const variationId = variation.id || variation._id;
                      const displayName = variation.secondaryName
                        ? `${variation.name} - ${variation.secondaryName}`
                        : variation.name;
                      const isSelected = selectedVariationId === variationId;
                      const variationStock = variation.stock !== undefined ? variation.stock : 0;
                      const isVariationOutOfStock = variationStock === 0;
                      const hasImage = variation.image && (Array.isArray(variation.image) ? variation.image[0] : variation.image);

                      return (
                        <button
                          key={variationId}
                          onClick={() => handleVariationChange(variationId)}
                          disabled={isVariationOutOfStock}
                          className={`relative px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-lg scale-105'
                              : isVariationOutOfStock
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 line-through'
                              : 'border-pink-200 text-gray-700 hover:border-pink-400 hover:bg-pink-50'
                          }`}
                        >
                          {hasImage && (
                            <img
                              src={Array.isArray(variation.image) ? variation.image[0] : variation.image}
                              alt={displayName}
                              className="w-6 h-6 rounded-full object-cover border border-white/50"
                            />
                          )}
                          <span>{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="border-t border-pink-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📦</span> Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-pink-200 rounded-full overflow-hidden bg-white">
                      <button onClick={decreaseQuantity} disabled={quantity <= 1} className="w-10 h-10 hover:bg-pink-50 disabled:opacity-30 text-xl font-bold text-pink-600 transition">−</button>
                      <span className="w-14 text-center font-bold text-gray-800 text-lg">{quantity}</span>
                      <button onClick={increaseQuantity} disabled={quantity >= currentStock} className="w-10 h-10 hover:bg-pink-50 disabled:opacity-30 text-xl font-bold text-pink-600 transition">+</button>
                    </div>
                    <span className="text-sm text-gray-500">Max: {currentStock}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={handleCartButtonClick}
                  disabled={isButtonDisabled}
                  className={`flex-1 py-3.5 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                    isButtonDisabled
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : addedToCart
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200'
                      : 'bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  {isOutOfStock ? '❌ Out of Stock' : addedToCart ? '✓ Go to Cart' : '🛒 Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isButtonDisabled}
                  className={`flex-1 py-3.5 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                    isButtonDisabled
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-xl shadow-pink-200 hover:scale-[1.02]'
                  }`}
                >
                  ⚡ Buy Now
                </button>
              </div>

              {/* Delivery Check */}
              <div className="border-t border-pink-100 pt-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📍</span> Check Delivery
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  />
                  <button
                    onClick={checkDelivery}
                    disabled={checkingDelivery || pincode.length !== 6}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:shadow-md transition"
                  >
                    {checkingDelivery ? '...' : 'Check'}
                  </button>
                </div>
                {deliveryStatus && (
                  <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${deliveryStatus.isDeliverable ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {deliveryStatus.message}
                  </div>
                )}
              </div>

              {/* ✅ Why Shop With Us */}
<div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-4">
  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
    <span>💖</span> Why Shop With Us
  </h4>
  <ul className="space-y-2.5 text-sm text-gray-700">
    <li className="flex items-start gap-2">
      <span className="text-green-500 mt-0.5 font-bold">✓</span>
      <span><strong>100% Original Products</strong> — Sourced directly from brands</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-green-500 mt-0.5 font-bold">✓</span>
      <span><strong>Easy 7-Day Returns</strong> on unused products with original packaging</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-green-500 mt-0.5 font-bold">✓</span>
      <span><strong>Free Shipping</strong> on orders above ₹499</span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-green-500 mt-0.5 font-bold">✓</span>
      <span><strong>Secure Payments</strong> — UPI, Cards, COD, NetBanking available</span>
    </li>
    {discountPercent > 0 && (
      <li className="flex items-start gap-2">
        <span className="text-green-500 mt-0.5 font-bold">✓</span>
        <span><strong>Best Price</strong> — {discountPercent}% off right now!</span>
      </li>
    )}
  </ul>
</div>
            </div>
          </div>

          {/* ============ TABS SECTION ============ */}
          <div className="mt-16 bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
            {/* Tab Buttons */}
            <div className="flex gap-2 border-b border-pink-100 px-4 sm:px-6 pt-4 overflow-x-auto scrollbar-hide">
              {[
                { id: 'description', label: '📖 About', icon: '' },
                { id: 'features', label: '✨ Highlights', icon: '' },
                { id: 'specifications', label: '📋 Specifications', icon: '' },
                { id: 'reviews', label: '⭐ Reviews', icon: '' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all rounded-t-xl ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 sm:p-8">
              {activeTab === 'description' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-5">📖 About this item</h2>
                  {descriptionBullets.length > 0 ? (
                    <ul className="space-y-3">
                      {descriptionBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <span className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm sm:text-base leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📝</div>
                      <p className="text-gray-400">No description available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'features' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-5">✨ Product Highlights</h2>
                  {keyFeatures.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {keyFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                          <span className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                          <span className="text-sm text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">✨</div>
                      <p className="text-gray-400">No highlights available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-5">📋 Specifications</h2>
                  <div className="bg-gradient-to-r from-pink-50 to-white rounded-2xl overflow-hidden border border-pink-100">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-pink-100">
                        {Object.entries(specifications).map(([key, value], idx) => (
                          <tr key={idx} className="hover:bg-pink-50/50 transition">
                            <td className="px-4 sm:px-6 py-3 font-semibold text-gray-700 w-1/3 bg-pink-50/30">{key}</td>
                            <td className="px-4 sm:px-6 py-3 text-gray-700">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-5">⭐ Customer Reviews</h2>
                  <ReviewSection productId={id} />
                </div>
              )}
            </div>
          </div>

          {/* ============ RELATED PRODUCTS ============ */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">💕 You May Also Like</h2>
                <Link to={`/shop?category=${product.mainCategory || product.category}`} className="text-pink-600 text-sm font-semibold hover:underline">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {relatedProducts.map((rp) => {
                  const rpPrice = rp.price || rp.sellingPrice || 0;
                  const rpMrp = rp.originalPrice || rp.mrp || 0;
                  const rpDiscount = rpMrp > rpPrice ? Math.round(((rpMrp - rpPrice) / rpMrp) * 100) : 0;
                  return (
                    <Link
                      key={rp._id || rp.id}
                      to={`/product/${rp._id || rp.id}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-pink-50"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
                        <img
                          src={getOptimizedImage(rp.images?.[0])}
                          alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        {rpDiscount > 0 && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {rpDiscount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {rp.brand && <p className="text-[10px] text-pink-600 font-semibold uppercase tracking-wider">{rp.brand}</p>}
                        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem] mt-1">{rp.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-bold text-pink-600">₹{rpPrice.toLocaleString()}</span>
                          {rpMrp > rpPrice && <span className="text-[10px] text-gray-400 line-through">₹{rpMrp.toLocaleString()}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ============ ZOOM MODAL ============ */}
        {showZoom && (
          <div
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setShowZoom(false)}
          >
            <img
              src={getOptimizedImage(galleryImages[selectedImage] || productImages[0])}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl text-gray-800 hover:bg-pink-50"
            >
              ✕
            </button>
          </div>
        )}

       {/* ============ FOOTER ============ */}
<footer className="bg-gray-900 text-gray-400 py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
        </div>
        <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Shop</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
          <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
          <li><Link to="/hair" className="hover:text-pink-500 transition">Hair</Link></li>
          <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
          <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Support</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
          <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
          <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
          <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-4">Follow Us</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
          <li><a href="#" className="hover:text-pink-500 transition">Facebook</a></li>
          <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
          <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
        </ul>
      </div>
    </div>
    <div className="text-center pt-8 border-t border-gray-800">
      <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
      <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
    </div>
  </div>
</footer>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
}

export default ProductDetail;
