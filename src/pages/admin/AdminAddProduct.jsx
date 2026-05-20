import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Vital Info
    productName: '',
    brand: '',
    category: '',
    subCategory: '',
    // Images
    images: [],
    // Pricing
    mrp: '',
    sellingPrice: '',
    tax: 5,
    // Inventory
    sku: '',
    quantity: '',
    lowStockThreshold: 10,
    // Variations
    hasVariations: false,
    variations: [],
    // Description
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    // Specifications
    specifications: {},
    // Shipping
    weight: '',
    dimensions: '',
    shippingCharges: '',
    // SEO
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  const [keyFeature, setKeyFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches'],
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setFormData({ ...formData, images: [...formData.images, ...newImages] });
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

  const submitProduct = () => {
    alert('✅ Product listed successfully!');
    navigate('/admin/inventory');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Add a Product</h1>
          <button onClick={() => navigate('/admin/inventory')} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[
            { num: 1, label: 'Vital Info' },
            { num: 2, label: 'Images' },
            { num: 3, label: 'Pricing' },
            { num: 4, label: 'Inventory' },
            { num: 5, label: 'Description' },
            { num: 6, label: 'Shipping' },
            { num: 7, label: 'SEO' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s.num ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s.num}
              </div>
              <span className={`text-xs mt-1 ${step >= s.num ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Vital Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Vital Information</h2>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label><input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Select Category</option>{Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label><select value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!formData.category}><option value="">Select Sub Category</option>{formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(2)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 2: Images */}
        {step === 2 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Product Images</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-wrap gap-4 mb-4">{formData.images.map((img, idx) => (<div key={idx} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"><img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" /></div>))}</div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">Upload Images</label>
              <p className="text-xs text-gray-400 mt-2">Upload up to 5 images. First image will be the main product image.</p>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(3)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Pricing</h2>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">MRP (Maximum Retail Price) *</label><input type="number" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label><input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label><input type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(4)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 4: Inventory */}
        {step === 4 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Inventory</h2>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit) *</label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Unique identifier" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label><input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(5)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 5: Description */}
        {step === 5 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Product Description</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label><textarea rows="2" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Brief description for search results" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label><textarea rows="5" value={formData.fullDescription} onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Detailed product description" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label><div className="flex flex-wrap gap-2 mb-2">{formData.keyFeatures.map((feature, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">{feature}<button onClick={() => removeKeyFeature(idx)} className="text-gray-400 hover:text-red-500">✕</button></span>))}</div><div className="flex gap-2"><input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., Dermatologically tested" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" /><button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label><div className="space-y-2 mb-2">{Object.entries(formData.specifications).map(([key, value]) => (<div key={key} className="flex gap-2"><span className="w-1/3 px-3 py-1 bg-gray-50 rounded text-sm">{key}</span><span className="flex-1 px-3 py-1 bg-gray-50 rounded text-sm">{value}</span></div>))}</div><div className="flex gap-2"><input type="text" placeholder="Key (e.g., Material)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" /><input type="text" placeholder="Value (e.g., Plastic)" value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" /><button onClick={addSpecification} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(4)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(6)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 6: Shipping */}
        {step === 6 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Shipping Details</h2>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label><input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L x W x H in cm)</label><input type="text" value={formData.dimensions} onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="20 x 10 x 5" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label><input type="number" value={formData.shippingCharges} onChange={(e) => setFormData({ ...formData, shippingCharges: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0 for free shipping" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(5)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setStep(7)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue</button></div>
          </div>
        )}

        {/* Step 7: SEO */}
        {step === 7 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-medium">Search Engine Optimization (SEO)</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label><input type="text" value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Product title for search engines" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label><textarea rows="2" value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label><input type="text" value={formData.seoKeywords} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Comma separated keywords" /></div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(6)} className="px-6 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={submitProduct} className="bg-green-600 text-white px-6 py-2 rounded-lg">Submit Product</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
