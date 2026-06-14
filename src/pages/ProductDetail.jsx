import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

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
  
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedVariationId, setSelectedVariationId] = useState('');
  
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  
  const [galleryImages, setGalleryImages] = useState([]);

  const API_URL = 'https://api.mypinkshop.com';

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
      let related = Array.isArray(data) ? data : data.products || [];
      related = related.filter(p => p._id !== id).slice(0, 6);
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

  // Load product with caching
  useEffect(() => {
    const loadProduct = async () => {
      if (!id || id === 'undefined') {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check cache first
        const cached = sessionStorage.getItem(`product_${id}`);
        const cacheTime = sessionStorage.getItem(`product_cache_time_${id}`);
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 60000) {
          const data = JSON.parse(cached);
          setProduct(data);
          
          const isClothing = data.mainCategory === 'Clothing' || data.category === 'Clothing';
          const productImgs = data.images && data.images.length > 0 ? data.images : [];
          setGalleryImages([...productImgs]);
          setSelectedImage(0);
          fetchRelatedProducts(data.mainCategory || data.category);
          
          if (data.variations && data.variations.length > 0) {
            const defaultVariation = data.variations[0];
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
        
        if (data && data._id) {
          // Save to cache
          sessionStorage.setItem(`product_${id}`, JSON.stringify(data));
          sessionStorage.setItem(`product_cache_time_${id}`, Date.now().toString());
          
          setProduct(data);
          
          const isClothing = data.mainCategory === 'Clothing' || data.category === 'Clothing';
          const productImgs = data.images && data.images.length > 0 ? data.images : [];
          setGalleryImages([...productImgs]);
          setSelectedImage(0);
          fetchRelatedProducts(data.mainCategory || data.category);
          
          if (data.variations && data.variations.length > 0) {
            const defaultVariation = data.variations[0];
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
      
      if (data.success && data.deliverable) {
        let deliveryText = '';
        if (data.estimatedDelivery?.minDate && data.estimatedDelivery?.maxDate) {
          if (data.estimatedDelivery.minDate === data.estimatedDelivery.maxDate) {
            deliveryText = `Expected delivery on ${data.estimatedDelivery.maxDate}`;
          } else {
            deliveryText = `Expected delivery between ${data.estimatedDelivery.minDate} - ${data.estimatedDelivery.maxDate}`;
          }
        } else if (data.estimatedDelivery?.maxDays) {
          deliveryText = `Expected delivery in ${data.estimatedDelivery.maxDays} business days`;
        } else {
          deliveryText = `Delivery available to PIN ${pincode}`;
        }
        
        setDeliveryStatus({
          isDeliverable: true,
          message: `✅ ${deliveryText}`,
          estimatedDays: data.estimatedDelivery?.maxDays ? `${data.estimatedDelivery.maxDays} days` : null
        });
        toast.success('Delivery available!');
      } else {
        setDeliveryStatus({
          isDeliverable: false,
          message: data.message || '❌ Sorry, delivery is not available to this pincode yet.'
        });
        toast.error('Delivery not available');
      }
    } catch (error) {
      console.error('Delivery check error:', error);
      setDeliveryStatus({
        isDeliverable: false,
        message: 'Unable to check delivery. Please try again later.'
      });
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
        id: product._id,
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
      id: product._id,
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
    const productId = product._id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
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
      "sku": product._id,
      "brand": { "@type": "Brand", "name": product.brand || "MyPinkShop" },
      "offers": {
        "@type": "Offer",
        "url": `https://www.mypinkshop.com/product/${product._id}`,
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
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

  return (
    <>
      <Helmet>
        <title>{product.name} | Buy Online at Best Price | MyPinkShop</title>
        <meta name="description" content={product.shortDescription || `Buy ${product.name} online at best price in India. ${product.brand || 'MyPinkShop'} product with ₹${currentPrice}. Free shipping available. Shop now!`} />
        <link rel="canonical" href={`https://www.mypinkshop.com/product/${product._id}`} />
        <meta property="og:title" content={`${product.name} | MyPinkShop`} />
        <meta property="og:description" content={product.shortDescription || `Shop ${product.name} at best price. ${discountPercent}% off available.`} />
        <meta property="og:image" content={productImages[0]} />
        <meta property="product:price:amount" content={currentPrice} />
        <meta property="product:price:currency" content="INR" />
        {productSchema && <script type="application/ld+json">{JSON.stringify(productSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        <OfferBanner />

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
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 bg-gray-50"
                  />
                  <button onClick={handleSearch} className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-sm">🔍</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/wishlist')} className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{wishlistCount}</span>}
                </button>
                <Link to="/cart" className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></Link>}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/shop" className="text-gray-500 hover:text-pink-500">Shop</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Images */}
            <div>
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-pink-100 min-h-[300px] flex items-center justify-center">
                <img 
                  src={getOptimizedImage(galleryImages[selectedImage] || productImages[0])} 
                  alt={product.name} 
                  className="max-w-full max-h-[400px] object-contain"
                  loading="eager"
                />
                <button onClick={handleWishlistToggle} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition">
                  <span className="text-xl">{isInWishlist(product._id) ? '❤️' : '🤍'}</span>
                </button>
                {product.badge && <span className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full">{product.badge}</span>}
              </div>
              
              {galleryImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-14 h-14 border-2 rounded-lg overflow-hidden flex-shrink-0 ${selectedImage === idx ? 'border-pink-500 shadow-md' : 'border-gray-200'}`}>
                      <img src={getOptimizedImage(img)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{product.name}</h1>
              
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400 text-sm">
                  {'★'.repeat(Math.floor(product.rating || 0))}{'☆'.repeat(5 - Math.floor(product.rating || 0))}
                </div>
                <span className="text-sm font-medium">{product.rating || 0}</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">{product.reviewCount || 0} reviews</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-pink-600">₹{currentPrice}</span>
                {currentMrp > currentPrice && (
                  <>
                    <span className="text-sm text-gray-400 line-through">₹{currentMrp}</span>
                    <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs font-medium">{discountPercent}% OFF</span>
                  </>
                )}
              </div>

              {hasVariations && product.variations && product.variations.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Select Option</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.variations.map((variation) => {
                      const variationId = variation.id || variation._id;
                      const displayName = variation.secondaryName ? `${variation.name} - ${variation.secondaryName}` : variation.name;
                      const isSelected = selectedVariationId === variationId;
                      const variationStock = variation.stock !== undefined ? variation.stock : 0;
                      const isVariationOutOfStock = variationStock === 0;
                      
                      return (
                        <button
                          key={variationId}
                          onClick={() => handleVariationChange(variationId)}
                          disabled={isVariationOutOfStock}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            isSelected ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md' :
                            isVariationOutOfStock ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' :
                            'border-gray-300 text-gray-700 hover:border-pink-400'
                          }`}
                        >
                          {displayName}
                          {isVariationOutOfStock && <span className="ml-1 text-xs text-red-500">(Out of Stock)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isOutOfStock ? (
                <div className="text-sm text-red-600 font-semibold">❌ Out of Stock</div>
              ) : isLowStock ? (
                <div className="text-sm text-amber-600 font-semibold">⚠️ Only {currentStock} left in stock</div>
              ) : (
                <div className="text-sm text-green-600">✅ In Stock ({currentStock} available)</div>
              )}

              {/* Delivery Check */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Check Delivery</h3>
                <div className="flex gap-3">
                  <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength="6" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button onClick={checkDelivery} disabled={checkingDelivery || pincode.length !== 6} className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">Check</button>
                </div>
                {deliveryStatus && <div className={`mt-3 p-3 rounded-lg text-sm ${deliveryStatus.isDeliverable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{deliveryStatus.message}</div>}
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Quantity:</h3>
                  <div className="flex items-center border border-gray-300 rounded-full w-fit">
                    <button onClick={decreaseQuantity} className="w-8 h-8 rounded-full hover:bg-gray-100 text-xl">-</button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button onClick={increaseQuantity} className="w-8 h-8 rounded-full hover:bg-gray-100 text-xl">+</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={handleCartButtonClick} disabled={isButtonDisabled} className={`flex-1 py-3 rounded-full font-medium transition-all ${isButtonDisabled ? 'bg-gray-300 cursor-not-allowed' : addedToCart ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'}`}>
                  {isOutOfStock ? 'Out of Stock' : (addedToCart ? '✓ Go to Cart' : 'Add to Cart')}
                </button>
                <button onClick={handleBuyNow} disabled={isButtonDisabled} className={`flex-1 py-3 rounded-full font-medium border-2 transition-all ${isButtonDisabled ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-pink-500 text-pink-600 hover:bg-pink-50'}`}>Buy Now</button>
              </div>

              {/* Product Details Box */}
              <div className="border border-pink-100 rounded-xl overflow-hidden">
                <div className="bg-pink-100/50 px-4 py-3 border-b border-pink-100">
                  <h3 className="text-sm font-semibold text-gray-800">📋 Product Details</h3>
                </div>
                <div className="divide-y divide-pink-100">
                  {Object.entries(specifications).slice(0, 8).map(([key, value], idx) => (
                    <div key={idx} className="flex flex-wrap justify-between px-4 py-3 gap-2">
                      <span className="text-gray-600 text-sm">{key}:</span>
                      <span className="text-gray-800 font-medium text-sm text-right">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-12">
            <div className="flex gap-6 border-b border-gray-200 overflow-x-auto pb-1">
              {['description', 'features', 'specifications', 'reviews'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-sm font-medium capitalize whitespace-nowrap transition ${activeTab === tab ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                  {tab === 'description' ? 'About' : tab === 'features' ? 'Highlights' : tab === 'specifications' ? 'Specs' : 'Reviews'}
                </button>
              ))}
            </div>

            <div className="py-6">
              {activeTab === 'description' && (
                <ul className="space-y-3">
                  {descriptionBullets.length > 0 ? descriptionBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-600"><span className="text-pink-500">•</span><span className="text-sm">{bullet}</span></li>
                  )) : <p className="text-gray-500 text-center py-8">No description available</p>}
                </ul>
              )}

              {activeTab === 'features' && (
                <ul className="space-y-3">
                  {keyFeatures.length > 0 ? keyFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-600"><span className="text-green-500">✓</span><span className="text-sm">{feature}</span></li>
                  )) : <p className="text-gray-500 text-center py-8">No highlights available</p>}
                </ul>
              )}

              {activeTab === 'specifications' && (
                <div className="bg-gradient-to-r from-pink-50 to-white rounded-xl overflow-hidden border border-pink-100">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-pink-100">
                      {Object.entries(specifications).map(([key, value], idx) => (
                        <tr key={idx} className="hover:bg-pink-100/30">
                          <td className="px-4 py-3 font-medium text-pink-700 w-1/3 bg-pink-50/50">{key}</td>
                          <td className="px-4 py-3 text-gray-700">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && <ReviewSection productId={id} />}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {relatedProducts.map((rp) => (
                  <Link key={rp._id} to={`/product/${rp._id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition">
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img src={getOptimizedImage(rp.images?.[0])} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                      {rp.badge && <span className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{rp.badge}</span>}
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">{rp.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-pink-600">₹{rp.price}</span>
                        {rp.originalPrice > rp.price && <span className="text-[10px] text-gray-400 line-through">₹{rp.originalPrice}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default ProductDetail;
