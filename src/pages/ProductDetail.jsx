import { useState, useEffect, useMemo } from 'react';
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

// ✅ Image optimizer — crop nahi karega
const getOptimizedImage = (url) => {
  if (!url) return null;
  if (url.includes('amazon') || url.includes('media-amazon')) {
    return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
  }
  return url;
};

// ✅ Size order (logical, Amazon jaisa)
const SIZE_ORDER = {
  'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, '3XL': 8, '4XL': 9, '5XL': 10,
  'Free Size': 11, 'One Size': 12, 'Adjustable': 13,
};

const getSizeOrder = (size) => {
  if (!size) return 999;
  const s = String(size).trim().toUpperCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (SIZE_ORDER[s] !== undefined) return SIZE_ORDER[s];
  const mlMatch = s.match(/^(\d+)\s*(ML|G|GM|KG|L)$/i);
  if (mlMatch) return 100 + parseInt(mlMatch[1], 10);
  return 500;
};

// ✅ Color order
const COLOR_ORDER = {
  'Black': 1, 'White': 2, 'Grey': 3, 'Navy': 4, 'Blue': 5, 'Red': 6,
  'Pink': 7, 'Purple': 8, 'Green': 9, 'Yellow': 10, 'Orange': 11, 'Brown': 12,
  'Gold': 13, 'Silver': 14, 'Rose Gold': 15, 'Multicolor': 16,
};

const getColorOrder = (color) => {
  if (!color) return 999;
  const c = String(color).trim();
  const cap = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
  return COLOR_ORDER[cap] ?? 500;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showZoom, setShowZoom] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ✅ Variant selection state
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [option1Name, setOption1Name] = useState('Size');
  const [option2Name, setOption2Name] = useState('Color');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // ============================================================
  // DERIVED: variants, sizes, colors, selected variant
  // ============================================================
  const variants = useMemo(() => {
    return Array.isArray(product?.variants) ? product.variants : [];
  }, [product]);

  const hasVariants = variants.length > 0;

  // Unique sizes (logical order)
  const availableSizes = useMemo(() => {
    const set = new Set();
    variants.forEach(v => {
      const val = v.option1?.value;
      if (val) set.add(val);
    });
    return [...set].sort((a, b) => getSizeOrder(a) - getSizeOrder(b));
  }, [variants]);

  // Unique colors (with representative image)
  const availableColors = useMemo(() => {
    const map = new Map();
    variants.forEach(v => {
      const val = v.option2?.value;
      if (val && !map.has(val)) {
        map.set(val, {
          name: val,
          image: v.image || '',
          inStock: variants.some(x => x.option2?.value === val && x.inStock),
        });
      } else if (val && map.has(val)) {
        const existing = map.get(val);
        if (!existing.image && v.image) existing.image = v.image;
        if (v.inStock) existing.inStock = true;
      }
    });
    return [...map.values()].sort((a, b) => getColorOrder(a.name) - getColorOrder(b.name));
  }, [variants]);

  // Selected variant
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find(v => {
      const sizeMatch = !selectedSize || v.option1?.value === selectedSize;
      const colorMatch = !selectedColor || v.option2?.value === selectedColor;
      return sizeMatch && colorMatch;
    }) || null;
  }, [variants, selectedSize, selectedColor, hasVariants]);

  // Current price/stock
  const getCurrentPrice = () => {
    if (selectedVariant?.price) return Number(selectedVariant.price);
    return Number(product?.price || product?.sellingPrice || 0);
  };
  const getCurrentStock = () => {
    if (selectedVariant) return Number(selectedVariant.stock ?? 0);
    return Number(product?.stock ?? 0);
  };
  const getCurrentMrp = () => {
    if (selectedVariant?.compareAtPrice) return Number(selectedVariant.compareAtPrice);
    return Number(
      product?.original_price ??
      product?.originalPrice ??
      product?.mrp ??
      (getCurrentPrice() * 1.2)
    );
  };
  const getDiscountPercent = () => {
    const mrp = getCurrentMrp(), price = getCurrentPrice();
    return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  };

  // ============================================================
  // Gallery update based on variant
  // ============================================================
  const updateGalleryForVariant = (variant, productImagesList) => {
    const arr = Array.isArray(productImagesList) ? productImagesList : [productImagesList];

    // ✅ Variant image blank → parent image fallback
    const variantImg = variant?.image || arr[0] || '';

    if (!variantImg) {
      setGalleryImages([...arr]);
      setSelectedImage(0);
      setImageLoaded(false);
      return;
    }

    // Variant image first, baaki parent images uske baad (duplicate avoid)
    const remaining = arr.filter(img => img !== variantImg);
    const newGallery = [variantImg, ...remaining];

    setGalleryImages(newGallery);
    setSelectedImage(0);
    setImageLoaded(false);
  };

  // ============================================================
  // Fetch related products
  // ============================================================
  const fetchRelatedProducts = async (category) => {
    if (!category) return;
    try {
      const res = await fetch(`${API_URL}/api/products?category=${category}&limit=10`);
      const data = await res.json();
      let related = Array.isArray(data) ? data : (data.data || []);
      related = related.filter(p => (p._id !== id && p.id !== id)).slice(0, 8);
      setRelatedProducts(related);
    } catch (e) { console.error(e); }
  };

  // ============================================================
  // Apply product data
  // ============================================================
  const applyProduct = (p) => {
    setProduct(p);
    const imgs = p.images?.length ? p.images : [];
    setGalleryImages([...imgs]);
    setSelectedImage(0);
    setImageLoaded(false);
    fetchRelatedProducts(p.mainCategory || p.category);

    // ✅ Variants initialize
    const vars = Array.isArray(p.variants) ? p.variants : [];
    if (vars.length > 0) {
      setOption1Name(p.option1Name || 'Size');
      setOption2Name(p.option2Name || 'Color');

      // First in-stock variant select karo
      const firstInStock = vars.find(v => v.inStock) || vars[0];
      const s1 = firstInStock.option1?.value || '';
      const s2 = firstInStock.option2?.value || '';
      setSelectedSize(s1);
      setSelectedColor(s2);
      setSelectedVariantId(firstInStock.id);

      updateGalleryForVariant(firstInStock, imgs);
    } else {
      setSelectedSize('');
      setSelectedColor('');
      setSelectedVariantId('');
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || id === 'undefined') { setProduct(null); setLoading(false); return; }
      try {
        setLoading(true);
        const cached = getCacheWithTTL(sessionStorage, `product_${id}`);
        if (cached && (cached._id || cached.id)) {
          applyProduct(cached);
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.data || data;
        if (p && (p._id || p.id)) {
          setCacheWithTTL(sessionStorage, `product_${id}`, p, 5 * 60 * 1000); // 5 min cache
          applyProduct(p);
        } else setProduct(null);
      } catch (e) { console.error(e); setProduct(null); }
      finally { setLoading(false); }
    };
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ============================================================
  // Variant selection handlers
  // ============================================================
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setQuantity(1);
    const match = variants.find(v =>
      v.option1?.value === size && v.option2?.value === selectedColor
    );
    if (match) {
      setSelectedColor(match.option2?.value || '');
      setSelectedVariantId(match.id);
      updateGalleryForVariant(match, product?.images || []);
    } else {
      const anyMatch = variants.find(v => v.option1?.value === size && v.inStock)
        || variants.find(v => v.option1?.value === size);
      if (anyMatch) {
        setSelectedColor(anyMatch.option2?.value || '');
        setSelectedVariantId(anyMatch.id);
        updateGalleryForVariant(anyMatch, product?.images || []);
      }
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setQuantity(1);
    const match = variants.find(v =>
      v.option2?.value === color && v.option1?.value === selectedSize
    );
    if (match) {
      setSelectedVariantId(match.id);
      updateGalleryForVariant(match, product?.images || []);
    } else {
      const anyMatch = variants.find(v => v.option2?.value === color && v.inStock)
        || variants.find(v => v.option2?.value === color);
      if (anyMatch) {
        setSelectedSize(anyMatch.option1?.value || '');
        setSelectedVariantId(anyMatch.id);
        updateGalleryForVariant(anyMatch, product?.images || []);
      }
    }
  };

  const isColorAvailableForSize = (size, color) => {
    return variants.some(v =>
      v.option1?.value === size &&
      v.option2?.value === color &&
      v.inStock
    );
  };

  const isSizeAvailable = (size) => {
    return variants.some(v => v.option1?.value === size && v.inStock);
  };

  const isColorAvailable = (color) => {
    return variants.some(v => v.option2?.value === color && v.inStock);
  };

  // ============================================================
  // Delivery check
  // ============================================================
  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) return toast.error('Please enter a valid 6-digit pincode');
    setCheckingDelivery(true);
    setDeliveryStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/shipping/check-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, cartTotal: getCurrentPrice(), weight: product?.weight || 0.5 })
      });
      const data = await res.json();
      const dd = data.data || data;
      if ((data.success || dd.success) && dd.deliverable !== false) {
        let text = '';
        const est = dd.estimatedDelivery;
        if (est?.minDate && est?.maxDate) {
          text = est.minDate === est.maxDate ? `Delivery on ${est.maxDate}` : `Delivery between ${est.minDate} - ${est.maxDate}`;
        } else if (est?.maxDays) text = `Delivery in ${est.maxDays} business days`;
        else text = `Delivery available to PIN ${pincode}`;
        setDeliveryStatus({ isDeliverable: true, message: text });
        toast.success('Delivery available!');
      } else {
        setDeliveryStatus({ isDeliverable: false, message: dd.message || 'Delivery not available' });
        toast.error('Not available');
      }
    } catch (e) { toast.error('Network error'); }
    finally { setCheckingDelivery(false); }
  };

  // ============================================================
  // Cart
  // ============================================================
  const buildCartItem = () => {
    const item = {
      id: product._id || product.id,
      name: product.name,
      price: getCurrentPrice(),
      quantity,
      image: galleryImages[0] || product.images?.[0] || null,
      category: product.category || product.mainCategory,
      stock: getCurrentStock(),
    };
    if (selectedVariant) {
      item.variantId = selectedVariant.id;
      item.variantSku = selectedVariant.sku;
      item.variantImage = selectedVariant.image || '';
      item.size = selectedVariant.option1?.value || '';
      item.color = selectedVariant.option2?.value || '';
      item.option1Name = selectedVariant.option1?.name || option1Name;
      item.option2Name = selectedVariant.option2?.name || option2Name;
      item.variantLabel = [
        selectedVariant.option1?.value,
        selectedVariant.option2?.value,
      ].filter(Boolean).join(' / ');
    }
    return item;
  };

  const validateVariant = () => {
    if (hasVariants) {
      if (!selectedVariant) return 'Please select size and color';
      if (!selectedVariant.inStock) return 'This combination is out of stock';
    }
    return null;
  };

  const handleAddToCart = () => {
    if (!product || quantity < 1) return toast.error('Select quantity');
    const err = validateVariant();
    if (err) return toast.error(err);
    if (quantity > getCurrentStock()) return toast.error(`Only ${getCurrentStock()} in stock`);
    if (addedToCart) return navigate('/cart');
    addToCart(buildCartItem());
    setAddedToCart(true);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!product || quantity < 1) return toast.error('Select quantity');
    const err = validateVariant();
    if (err) return toast.error(err);
    if (quantity > getCurrentStock()) return toast.error(`Only ${getCurrentStock()} in stock`);
    addToCart(buildCartItem());
    toast.success('Proceeding to checkout!');
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const pid = product._id || product.id;
    if (isInWishlist(pid)) { removeFromWishlist(pid); toast.success('Removed from wishlist'); }
    else { addToWishlist(product); toast.success('Added to wishlist'); }
  };

  const handleRatingSubmitted = async () => {
    try {
      safeRemoveItem(sessionStorage, `product_${id}`);
      const res = await fetch(`${API_URL}/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.data || data;
        if (p && (p._id || p.id)) {
          setCacheWithTTL(sessionStorage, `product_${id}`, p, 5 * 60 * 1000);
          setProduct(p);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const productImages = product?.images?.length ? product.images : [];

  const getDescriptionBullets = () => {
    if (Array.isArray(product?.description)) return product.description.filter(b => b?.trim());
    if (typeof product?.description === 'string') {
      if (product.description.includes('|')) return product.description.split('|').map(b => b.trim()).filter(b => b);
      if (product.description.includes('\n')) return product.description.split('\n').filter(b => b.trim() && b.length > 5);
      return [product.description];
    }
    if (Array.isArray(product?.fullDescription)) return product.fullDescription.filter(b => b?.trim());
    return [];
  };

  const getKeyFeatures = () => product?.keyFeatures || [];

  const getSpecifications = () => {
    const s = {};
    if (product?.brand) s['Brand'] = product.brand;
    if (product?.mainCategory || product?.category) s['Category'] = product.mainCategory || product.category;
    if (product?.weight) s['Weight'] = product.weight;
    if (product?.dimensions) s['Dimensions'] = product.dimensions;
    if (product?.fabric) s['Fabric'] = product.fabric;
    if (product?.material) s['Material'] = product.material;
    if (product?.gender && product.gender !== 'unisex') s['Gender'] = product.gender;
    if (product?.skinType && product.skinType !== 'all') s['Skin Type'] = product.skinType;
    if (product?.hairType && product.hairType !== 'all') s['Hair Type'] = product.hairType;
    if (product?.finish) s['Finish'] = product.finish;
    if (product?.coverage) s['Coverage'] = product.coverage;
    if (product?.shade) s['Shade'] = product.shade;
    if (product?.ingredients) s['Key Ingredients'] = product.ingredients;
    if (product?.sku) s['SKU'] = product.sku;
    if (product?.tax) s['GST'] = `${product.tax}%`;
    s['Return Policy'] = '7 days return';
    return s;
  };

  const generateProductSchema = () => {
    if (!product) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": productImages[0],
      "description": product.shortDescription || '',
      "sku": product._id || product.id,
      "brand": { "@type": "Brand", "name": product.brand || "MyPinkShop" },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": getCurrentPrice(),
        "availability": getCurrentStock() > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Helmet><title>Product Not Found | MyPinkShop</title></Helmet>
        <OfferBanner />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-xl transition">
            Browse Products →
          </Link>
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
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock < 10;
  const isButtonDisabled = isOutOfStock || quantity < 1;
  const productSchema = generateProductSchema();
  const savings = currentMrp > currentPrice ? Math.round(currentMrp - currentPrice) : 0;
  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.review_count || product.reviewCount || 0);
  const mainImageSrc = galleryImages[selectedImage] || productImages[0] || '';

  return (
    <>
      <Helmet>
        <title>{product.name} | MyPinkShop</title>
        <meta name="description" content={product.shortDescription || `Buy ${product.name} online.`} />
        <link rel="canonical" href={`https://www.mypinkshop.com/product/${product._id || product.id}`} />
        {productSchema && <script type="application/ld+json">{JSON.stringify(productSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-white">
        <OfferBanner />

        {/* ============ STICKY HEADER ============ */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-9 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">MyPinkShop</h1>
                  <p className="text-[9px] text-pink-500 font-semibold tracking-wider">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:bg-white text-sm transition"
                  />
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/wishlist" className="relative p-2.5 rounded-full hover:bg-pink-50 text-gray-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-pink-50 text-gray-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> : (
                  <Link to="/login" className="p-2.5 rounded-full hover:bg-pink-50 text-gray-700 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ============ BREADCRUMB ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <Link to="/" className="hover:text-pink-500 transition">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-pink-500 transition">Shop</Link>
            {product.mainCategory && (
              <>
                <span>/</span>
                <Link to={`/shop?category=${product.mainCategory}`} className="hover:text-pink-500 transition">{product.mainCategory}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>
        </div>

        {/* ============ PRODUCT MAIN ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* LEFT: IMAGE GALLERY */}
            <div className="lg:col-span-7 lg:sticky lg:top-20 lg:self-start">
              <div className="flex flex-col-reverse md:flex-row gap-4">
                {/* Sidebar thumbnails (desktop) */}
                {galleryImages.length > 1 && (
                  <div className="hidden md:flex flex-col gap-3 w-20">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedImage(idx); setImageLoaded(false); }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white ${
                          selectedImage === idx
                            ? 'border-pink-500 shadow-md scale-105'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <img
                          src={getOptimizedImage(img)}
                          alt=""
                          className="w-full h-full object-contain p-2 bg-white"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main image */}
                <div className="flex-1">
                  <div className="relative bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center group cursor-zoom-in">
                    {!imageLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-pink-100 to-rose-100"></div>
                    )}
                    <img
                      key={mainImageSrc}
                      src={getOptimizedImage(mainImageSrc)}
                      alt={product.name}
                      className={`w-full h-full object-contain p-4 sm:p-8 transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onClick={() => setShowZoom(true)}
                      ref={(el) => {
                        if (el && el.complete && el.naturalWidth > 0) {
                          setImageLoaded(true);
                        }
                      }}
                    />

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {discountPercent}% OFF
                      </div>
                    )}

                    {/* Wishlist */}
                    <button
                      onClick={handleWishlistToggle}
                      className="absolute top-4 right-4 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all"
                    >
                      <span className="text-xl">{isInWishlist(product._id || product.id) ? '❤️' : '🤍'}</span>
                    </button>

                    {/* Out of stock overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-gray-900 text-white font-bold px-6 py-3 rounded-full text-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Zoom hint */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-[11px] text-gray-600 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                      🔍 Click to zoom
                    </div>
                  </div>

                  {/* Mobile thumbnails */}
                  {galleryImages.length > 1 && (
                    <div className="flex md:hidden gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setSelectedImage(idx); setImageLoaded(false); }}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-white ${
                            selectedImage === idx ? 'border-pink-500 shadow-md' : 'border-gray-200'
                          }`}
                        >
                          <img src={getOptimizedImage(img)} alt="" className="w-full h-full object-contain p-1 bg-white" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: PRODUCT INFO */}
            <div className="lg:col-span-5 space-y-5">
              {product.brand && (
                <Link to={`/shop?brand=${encodeURIComponent(product.brand)}`} className="inline-block text-xs font-bold text-pink-600 uppercase tracking-wider hover:text-pink-700">
                  {product.brand}
                </Link>
              )}

              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-gray-100">
                {rating > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2.5 py-1 rounded-md shadow-sm">
                      <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                      <span className="text-xs">★</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {reviewCount.toLocaleString()} {reviewCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No ratings yet</span>
                )}
                {user && (
                  <>
                    <span className="text-gray-300">|</span>
                    <QuickRating productId={id} onRatingSubmitted={handleRatingSubmitted} buttonText="⭐ Rate" showPopup={true} />
                  </>
                )}
              </div>

              {/* Price block */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">₹{currentPrice.toLocaleString()}</span>
                  {currentMrp > currentPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through">₹{currentMrp.toLocaleString()}</span>
                      <span className="text-lg font-bold text-emerald-600">{discountPercent}% off</span>
                    </>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-emerald-600 font-semibold">You save ₹{savings.toLocaleString()}</p>
                )}
                <p className="text-xs text-gray-500">Inclusive of all taxes</p>
              </div>

              {/* Stock */}
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Only {currentStock} left — order soon!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  In Stock
                </div>
              )}

              {/* ============================================================ */}
              {/* VARIANT SELECTORS */}
              {/* ============================================================ */}
              {hasVariants && (
                <div className="pt-4 border-t border-gray-100 space-y-5">

                  {/* SIZE SELECTOR */}
                  {availableSizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {option1Name}
                        </h3>
                        {selectedSize && (
                          <span className="text-xs text-gray-500">
                            Selected: <span className="font-bold text-gray-900">{selectedSize}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => {
                          const isSel = selectedSize === size;
                          const avail = isSizeAvailable(size);

                          // Is size ka representative variant (with image)
                          const sizeVariants = variants.filter(v => v.option1?.value === size);
                          const variantWithImage = sizeVariants.find(v => v.image) || sizeVariants[0];
                          const thumbImage = variantWithImage?.image || '';

                          return (
                            <button
                              key={size}
                              onClick={() => handleSizeSelect(size)}
                              disabled={!avail}
                              className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] px-2 py-2 rounded-lg border-2 transition-all ${
                                isSel
                                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                  : !avail
                                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                  : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600 bg-white'
                              }`}
                            >
                              {/* Thumbnail — object-contain, no crop */}
                              {variantWithImage?.image ? (
                                <img
                                  src={getOptimizedImage(thumbImage)}
                                  alt={size}
                                  className={`w-10 h-10 rounded object-contain bg-white p-0.5 ${!avail ? 'opacity-40 grayscale' : ''}`}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : null}

                              <span className={`text-xs font-bold ${!avail ? 'line-through' : ''}`}>
                                {size}
                              </span>

                              {!avail && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-[8px]">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* COLOR SELECTOR */}
                  {availableColors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {option2Name}
                        </h3>
                        {selectedColor && (
                          <span className="text-xs text-gray-500">
                            Selected: <span className="font-bold text-gray-900">{selectedColor}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {availableColors.map((c) => {
                          const isSel = selectedColor === c.name;
                          const avail = selectedSize
                            ? isColorAvailableForSize(selectedSize, c.name)
                            : isColorAvailable(c.name);
                          return (
                            <button
                              key={c.name}
                              onClick={() => handleColorSelect(c.name)}
                              disabled={!avail}
                              title={c.name}
                              className={`relative group flex flex-col items-center gap-1.5 transition-all ${
                                !avail ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all bg-white ${
                                  isSel
                                    ? 'border-pink-500 ring-2 ring-pink-200 scale-105'
                                    : 'border-gray-300 group-hover:border-pink-400'
                                }`}
                              >
                                {c.image ? (
                                  <img
                                    src={getOptimizedImage(c.image)}
                                    alt={c.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white"
                                    style={{ backgroundColor: c.name.toLowerCase().replace(/\s/g, '') }}
                                  >
                                    {c.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-semibold max-w-[60px] truncate ${
                                  isSel ? 'text-pink-600' : 'text-gray-600'
                                }`}
                              >
                                {c.name}
                              </span>
                              {!avail && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-[8px]">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected variant SKU */}
                  {selectedVariant?.sku && (
                    <p className="text-[11px] text-gray-500">
                      SKU: <span className="font-mono font-semibold text-gray-700">{selectedVariant.sku}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Quantity</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 hover:bg-gray-50 disabled:opacity-30 text-lg font-bold text-gray-700 transition"
                      >−</button>
                      <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                      <button
                        onClick={() => quantity < currentStock && setQuantity(quantity + 1)}
                        disabled={quantity >= currentStock}
                        className="w-10 h-10 hover:bg-gray-50 disabled:opacity-30 text-lg font-bold text-gray-700 transition"
                      >+</button>
                    </div>
                    <span className="text-xs text-gray-500">Max {currentStock}</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isButtonDisabled}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isButtonDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : addedToCart
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  {isOutOfStock ? '❌ Out of Stock' : addedToCart ? '✓ Go to Cart' : '🛒 Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isButtonDisabled}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isButtonDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  ⚡ Buy Now
                </button>
              </div>

              {/* Delivery */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📍</span> Check Delivery
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                  <button
                    onClick={checkDelivery}
                    disabled={checkingDelivery || pincode.length !== 6}
                    className="px-5 py-3 bg-gray-900 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-800 transition"
                  >
                    {checkingDelivery ? '...' : 'Check'}
                  </button>
                </div>
                {deliveryStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                    deliveryStatus.isDeliverable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {deliveryStatus.isDeliverable ? '✅ ' : '❌ '}{deliveryStatus.message}
                  </div>
                )}
              </div>

              {/* Trust icons */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {[
                  { icon: '🚚', label: 'Free Shipping', sub: 'Above ₹499' },
                  { icon: '💵', label: 'COD', sub: 'Available' },
                  { icon: '↩️', label: '7-Day', sub: 'Return' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-[11px] font-bold text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INFO TABS */}
          <div className="mt-16 border-t border-gray-200">
            <div className="sticky top-16 bg-white z-30 border-b border-gray-200">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'description', label: 'About' },
                  { id: 'features', label: 'Highlights' },
                  { id: 'specifications', label: 'Specifications' },
                  { id: 'reviews', label: 'Reviews' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.id
                        ? 'text-pink-600 border-pink-600'
                        : 'text-gray-500 border-transparent hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-8">
              {activeTab === 'description' && (
                <div className="max-w-3xl">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">About this item</h2>
                  {descriptionBullets.length > 0 ? (
                    <ul className="space-y-3">
                      {descriptionBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-center py-12">No description available</p>
                  )}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="max-w-3xl">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">Product Highlights</h2>
                  {keyFeatures.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {keyFeatures.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-pink-50/50 border border-pink-100">
                          <span className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span className="text-sm text-gray-700 font-medium">{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-12">No highlights available</p>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="max-w-2xl">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">Specifications</h2>
                  <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                    {Object.entries(specifications).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-3 gap-4 py-3">
                        <span className="text-sm font-semibold text-gray-500">{k}</span>
                        <span className="text-sm text-gray-900 col-span-2">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <ReviewSection productId={id} onReviewSubmitted={handleRatingSubmitted} />
                </div>
              )}
            </div>
          </div>

          {/* RELATED */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-16 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">You May Also Like</h2>
                <Link to={`/shop?category=${product.mainCategory || product.category}`} className="text-pink-600 text-sm font-bold hover:underline">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {relatedProducts.map((rp) => {
                  const rpPrice = rp.price || rp.sellingPrice || 0;
                  const rpMrp = rp.original_price ?? rp.originalPrice ?? rp.mrp ?? 0;
                  const rpDiscount = rpMrp > rpPrice ? Math.round(((rpMrp - rpPrice) / rpMrp) * 100) : 0;
                  const rpRating = Number(rp.rating || 0);
                  return (
                    <Link
                      key={rp._id || rp.id}
                      to={`/product/${rp._id || rp.id}`}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
                        <img
                          src={getOptimizedImage(rp.images?.[0])}
                          alt={rp.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {rpDiscount > 0 && (
                          <span className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {rpDiscount}% OFF
                          </span>
                        )}
                        {rpRating > 0 && (
                          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="text-emerald-600">{rpRating.toFixed(1)}</span>
                            <span className="text-yellow-400">★</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {rp.brand && (
                          <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-1">{rp.brand}</p>
                        )}
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] mb-2">
                          {rp.name}
                        </h3>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-gray-900">
                            ₹{rpPrice.toLocaleString()}
                          </span>
                          {rpMrp > rpPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{rpMrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ZOOM */}
        {showZoom && (
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setShowZoom(false)}
          >
            <img
              src={getOptimizedImage(galleryImages[selectedImage] || productImages[0])}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition">
              ✕
            </button>
          </div>
        )}

        {/* FOOTER */}
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
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500 transition">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow</h4>
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
