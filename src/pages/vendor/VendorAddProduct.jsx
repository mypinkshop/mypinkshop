import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: '',
    subCategory: '',
    mrp: '',
    sellingPrice: '',
    tax: 5,
    sku: '',
    quantity: '',
    lowStockThreshold: 10,
    hasVariations: false,
    variations: [],
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    specifications: {},
    weight: '',
    dimensions: '',
    shippingCharges: '',
    seoTitle: '',
    seoDescription: '',
  });
  
  const [keyFeature, setKeyFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [variationType, setVariationType] = useState('size');
  const [variationValue, setVariationValue] = useState('');

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches'],
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
    setImagePreview([...imagePreview, ...newImages]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const addKeyFeature = () => {
    if (keyFeature.trim()) {
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, keyFeature.trim()] });
      setKeyFeature('');
    }
  };

  const removeKeyFeature = (index) => {
    setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData({
        ...formData,
        specifications: { ...formData.specifications, [specKey.trim()]: specValue.trim() }
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addVariation = () => {
    if (variationValue.trim()) {
      const newVariation = { type: variationType, value: variationValue.trim(), price: '', stock: '' };
      setFormData({ ...formData, variations: [...formData.variations, newVariation] });
      setVariationValue('');
    }
  };

  const removeVariation = (index) => {
    setFormData({ ...formData, variations: formData.variations.filter((_, i) !== index) });
  };

  const submitProduct = () => {
    if (!formData.productName || !formData.sellingPrice || !formData.quantity) {
      alert('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    
    const newProduct = {
      id: Date.now(),
      name: formData.productName,
      sku: formData.sku || 'SKU-' + Date.now(),
      category: formData.category,
      subCategory: formData.subCategory,
      price: parseInt(formData.sellingPrice),
      originalPrice: parseInt(formData.mrp) || parseInt(formData.sellingPrice),
      stock: parseInt(formData.quantity),
      status: 'active',
      adminApproved: false,
      vendor: vendorData.brandName || vendorData.name,
      images: imagePreview,
      description: formData.fullDescription,
      shortDescription: formData.shortDescription,
      keyFeatures: formData.keyFeatures,
      specifications: formData.specifications,
      variations: formData.variations,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shippingCharges: formData.shippingCharges,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      sales: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
    };
    
    allProducts.push(newProduct);
    localStorage.setItem('adminProductsList', JSON.stringify(allProducts));
    
    setTimeout(() => {
      setLoading(false);
      alert('Product submitted for admin approval!');
      navigate('/vendor/products');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="add-product" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800">Add New Product</h1>
              <p className="text-sm text-gray-500">List your product on MyPinkShop</p>
            </div>
            
            <div className="flex border-b border-gray-200 bg-white px-6 py-3">
              {['Vital Info', 'Images', 'Pricing', 'Inventory', 'Variations', 'Description', 'Shipping', 'SEO'].map((label, idx) => (
                <div key={idx} className="flex items-center">
                  <button onClick={() => setStep(idx + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${step === idx + 1 ? 'bg-pink-600 text-white' : step > idx + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</button>
                  <span className={`text-xs ml-1 mr-3 ${step === idx + 1 ? 'text-pink-600 font-medium' : 'text-gray-500'}`}>{label}</span>
                  {idx < 7 && <div className="w-6 h-px bg-gray-300 mr-3"></div>}
                </div>
              ))}
            </div>
            
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Select Category</option>{Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label><select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!formData.category}><option value="">Select Sub Category</option>{formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select></div>
                  </div>
                  <div className="flex justify-end pt-4"><button onClick={() => setStep(2)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Product Images</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-wrap gap-3 mb-4">{imagePreview.map((img, idx) => (<div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"><img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">✕</button></div>))}</div>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Upload Images</button>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <p className="text-xs text-gray-400 mt-2">Upload up to 5 images. First image will be the main product image.</p>
                  </div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(1)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(3)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Pricing</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">MRP *</label><input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label><input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label><input type="number" name="tax" value={formData.tax} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  </div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(2)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(4)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Inventory</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Unique identifier" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label><input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  </div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(3)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(5)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Product Variations</h2>
                  <div className="flex items-center gap-3 mb-4"><input type="checkbox" checked={formData.hasVariations} onChange={(e) => setFormData({ ...formData, hasVariations: e.target.checked })} className="w-4 h-4" /><label>This product has variations (Size, Color, etc.)</label></div>
                  {formData.hasVariations && (<div className="border rounded-lg p-4 space-y-4"><div className="flex gap-3"><select value={variationType} onChange={(e) => setVariationType(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="size">Size</option><option value="color">Color</option><option value="weight">Weight</option></select><input type="text" placeholder="Value (e.g., S, M, L)" value={variationValue} onChange={(e) => setVariationValue(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={addVariation} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div><div className="flex flex-wrap gap-2">{formData.variations.map((v, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">{v.type}: {v.value}<button onClick={() => removeVariation(idx)} className="text-red-500 ml-1">✕</button></span>))}</div></div>)}
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(4)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(6)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 6 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Product Description</h2>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label><textarea name="shortDescription" rows="2" value={formData.shortDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label><textarea name="fullDescription" rows="5" value={formData.fullDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label><div className="flex flex-wrap gap-2 mb-2">{formData.keyFeatures.map((f, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">{f}<button onClick={() => removeKeyFeature(idx)} className="text-red-500">✕</button></span>))}</div><div className="flex gap-2"><input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., Dermatologically tested" className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label><div className="space-y-2 mb-2">{Object.entries(formData.specifications).map(([key, value]) => (<div key={key} className="flex gap-2"><span className="w-1/3 px-3 py-1 bg-gray-50 rounded text-sm">{key}</span><span className="flex-1 px-3 py-1 bg-gray-50 rounded text-sm">{value}</span><button onClick={() => removeSpecification(key)} className="text-red-500">✕</button></div>))}</div><div className="flex gap-2"><input type="text" placeholder="Key (e.g., Material)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" /><input type="text" placeholder="Value (e.g., Plastic)" value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={addSpecification} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(5)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(7)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 7 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Shipping Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label><input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L x W x H cm)</label><input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="20 x 10 x 5" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label><input type="number" name="shippingCharges" value={formData.shippingCharges} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0 for free shipping" /></div>
                  </div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(6)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(8)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}
              
              {step === 8 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label><input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label><textarea name="seoDescription" rows="2" value={formData.seoDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div className="flex justify-between pt-4"><button onClick={() => setStep(7)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-lg disabled:opacity-50">{loading ? 'Submitting...' : 'Submit for Approval'}</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorAddProduct;
