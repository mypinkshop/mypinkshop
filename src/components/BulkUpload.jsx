import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function BulkUpload({ userRole, onSuccess }) {
  const [uploadMethod, setUploadMethod] = useState('csv');
  const [products, setProducts] = useState([{ name: '', price: '', stock: '', brand: '', category: '', subCategory: '', description: '' }]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ API se categories
  const [apiCategories, setApiCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const API_URL = import.meta.env?.VITE_API_URL || 'https://api.mypinkshop.com';
  const token = localStorage.getItem('vendorToken') || localStorage.getItem('adminToken');
  const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');

  // ✅ API se categories fetch karo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(`${API_URL}/api/categories/tree`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const json = await res.json();
        const tree = json.data || json;
        setApiCategories(Array.isArray(tree) ? tree : []);
      } catch (err) {
        console.error('❌ Categories fetch error:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Fallback categories
  const fallbackCategories = [
    'Skincare', 'Makeup', 'Haircare', 'Fashion', 'Accessories',
    'Electronics', 'Home & Kitchen', 'Health & Wellness', 'Books & Stationery'
  ];

  const mainCategoriesList = apiCategories.length > 0
    ? apiCategories.map(c => ({ name: c.name, icon: c.icon, subs: (c.children || []).map(s => s.name) }))
    : fallbackCategories.map(name => ({ name, icon: '📁', subs: [] }));

  const getSubCategories = (mainCatName) => {
    const cat = mainCategoriesList.find(c => c.name === mainCatName);
    return cat ? cat.subs : [];
  };

  // ✅ Download CSV template (backend format ke saath match)
  const downloadTemplate = () => {
    const headers = [
      'name', 'brand', 'main_category', 'sub_category',
      'price', 'original_price', 'stock', 'tax', 'sku',
      'description', 'key_features', 'images',
      'short_description', 'weight', 'dimensions',
      'meta_title', 'meta_description', 'meta_keywords', 'is_featured'
    ];
    const sampleRow1 = [
      'iPhone 15', 'Apple', 'Electronics', 'Mobile Phones',
      '79999', '89999', '50', '18', 'IPH15-001',
      'Latest iPhone with A16 chip|6.1 inch display|48MP camera',
      '5G Ready|Face ID|iOS 17',
      'https://example.com/img1.jpg|https://example.com/img2.jpg',
      'Apple iPhone 15 with A16 Bionic chip', '171g', '15x7x0.8 cm',
      'iPhone 15 - Buy Online | MyPinkShop',
      'Buy iPhone 15 at best price', 'iphone 15, apple, mobile', 'true'
    ];
    const sampleRow2 = [
      'Vitamin C Serum', 'Nykaa', 'Skincare', 'Serums & Essence',
      '499', '699', '100', '18', 'VCS-001',
      'Brightening serum with Vitamin C|Reduces dark spots',
      'Dermatologically tested|Paraben free',
      'https://example.com/serum.jpg',
      'Vitamin C face serum', '50ml', '',
      'Vitamin C Serum - Buy Online | MyPinkShop',
      'Buy Vitamin C Serum at best price', 'vitamin c serum, skincare', 'false'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow1.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','),
      sampleRow2.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📄 Template downloaded!');
  };

  // ✅ CSV Upload — backend bulk endpoint use karo
  const handleCSVUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      // ✅ Backend bulk-upload endpoint use karo (fast + auto-categories)
      const res = await fetch(`${API_URL}/api/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // ❌ Content-Type mat set karo — browser khud set karega multipart ke liye
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok && (data.success || data.data)) {
        const result = data.data || data;
        const successCount = result.success || 0;
        const failedCount = result.failed || 0;

        setSuccess(`✅ ${successCount} products added! ${failedCount > 0 ? `❌ ${failedCount} failed` : ''}`);
        
        if (failedCount > 0 && result.errors?.length > 0) {
          console.warn('Failed rows:', result.errors);
          toast.error(`${failedCount} rows failed — check console`);
        }

        if (successCount > 0 && onSuccess) onSuccess();
        setCsvFile(null);
        document.getElementById('csvFile').value = '';
      } else {
        setError(data.message || data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('CSV upload error:', err);
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Form methods
  const addProductRow = () => {
    const maxLimit = userRole === 'vendor' ? 50 : 500;
    if (products.length >= maxLimit) {
      setError(`Maximum ${maxLimit} products at once`);
      return;
    }
    setProducts([...products, { name: '', price: '', stock: '', brand: '', category: '', subCategory: '', description: '' }]);
    setError('');
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    // ✅ Category change hone pe subcategory reset
    if (field === 'category') {
      updated[index].subCategory = '';
    }
    setProducts(updated);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // ✅ Submit form products — /api/products/create use karo
  const submitFormProducts = async () => {
    const validProducts = products.filter(p => p.name && p.price);
    
    if (validProducts.length === 0) {
      setError('Please fill at least one product with name and price');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress({ current: 0, total: validProducts.length });
    
    let successCount = 0;
    let failedCount = 0;
    const vendorBrand = vendorData.brandName || vendorData.name || '';
    const vendorId = vendorData._id || vendorData.id || '';

    for (let i = 0; i < validProducts.length; i++) {
      const p = validProducts[i];
      
      try {
        const productData = {
          name: p.name,
          brand: p.brand || vendorBrand || 'MyPinkShop',
          mainCategory: p.category || 'Other',       // ✅ Empty na ho
          subCategory: p.subCategory || '',
          price: parseFloat(p.price) || 0,
          originalPrice: parseFloat(p.originalPrice) || parseFloat(p.price) * 1.2 || 0,
          stock: parseInt(p.stock) || 10,
          description: p.description ? [p.description] : [],
          keyFeatures: [],
          images: [],
          vendorId: userRole === 'vendor' ? vendorId : 'admin',
          vendorName: userRole === 'vendor' ? vendorBrand : 'MyPinkShop',
          isActive: true,
          adminApproved: userRole === 'admin',
        };

        // ✅ Sahi endpoint use karo — /api/products/create
        const res = await fetch(`${API_URL}/api/products/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });

        const data = await res.json();
        if (res.ok && (data.success || data.data)) {
          successCount++;
        } else {
          failedCount++;
          console.error('Failed:', p.name, data.message || data.error);
        }
      } catch (err) {
        failedCount++;
        console.error('Error:', err);
      }
      
      setProgress({ current: i + 1, total: validProducts.length });
    }

    setSuccess(`✅ ${successCount} products added! ${failedCount > 0 ? `❌ ${failedCount} failed` : ''}`);
    
    if (successCount > 0) {
      setProducts([{ name: '', price: '', stock: '', brand: '', category: '', subCategory: '', description: '' }]);
      if (onSuccess) onSuccess();
    }
    setUploading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">📤 Bulk Upload</h2>
        <p className="text-sm text-gray-500">
          {userRole === 'vendor' ? 'Add products to your store' : 'Add products to the marketplace'}
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setUploadMethod('csv'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-center font-medium transition ${
              uploadMethod === 'csv' 
                ? 'text-pink-600 border-b-2 border-pink-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 CSV Upload
          </button>
          <button
            onClick={() => { setUploadMethod('form'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-center font-medium transition ${
              uploadMethod === 'form' 
                ? 'text-pink-600 border-b-2 border-pink-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Manual Entry
          </button>
        </div>

        {/* CSV Upload Tab */}
        {uploadMethod === 'csv' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">📥 Step 1: Download Template</h3>
              <button
                onClick={downloadTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                📄 Download CSV Template
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Template mein <strong>main_category</strong> aur <strong>sub_category</strong> columns bharo. Nayi categories automatically create ho jayengi.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="hidden"
                id="csvFile"
              />
              <label htmlFor="csvFile" className="cursor-pointer block">
                <span className="text-5xl block mb-3">📄</span>
                <span className="text-pink-600 font-medium">
                  {csvFile ? csvFile.name : 'Click to select CSV file'}
                </span>
                <p className="text-xs text-gray-400 mt-2">Only .csv files accepted</p>
              </label>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-pink-500 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Uploading and processing...</p>
              </div>
            )}

            <button
              onClick={handleCSVUpload}
              disabled={!csvFile || uploading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition"
            >
              {uploading ? '⏳ Uploading...' : '🚀 Upload & Add Products'}
            </button>
          </div>
        )}

        {/* Form Tab */}
        {uploadMethod === 'form' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Products ({products.length})</h3>
              <button
                onClick={addProductRow}
                className="text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg text-sm hover:bg-pink-50 transition"
              >
                + Add Product
              </button>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Adding products...</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Product List */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {products.map((product, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-pink-200 transition">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Product #{idx + 1}</span>
                    {products.length > 1 && (
                      <button
                        onClick={() => removeProduct(idx)}
                        className="text-red-400 text-sm hover:text-red-600 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                      placeholder="Product Name *"
                      value={product.name}
                      onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    />
                    <input
                      placeholder="Brand"
                      value={product.brand}
                      onChange={(e) => updateProduct(idx, 'brand', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    />
                    
                    {/* ✅ Category dropdown (API se) */}
                    <select
                      value={product.category}
                      onChange={(e) => updateProduct(idx, 'category', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white"
                      disabled={categoriesLoading}
                    >
                      <option value="">{categoriesLoading ? 'Loading...' : 'Select Category'}</option>
                      {mainCategoriesList.map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>

                    {/* ✅ SubCategory dropdown */}
                    <select
                      value={product.subCategory}
                      onChange={(e) => updateProduct(idx, 'subCategory', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white disabled:bg-gray-100"
                      disabled={!product.category || getSubCategories(product.category).length === 0}
                    >
                      <option value="">Select Sub Category</option>
                      {getSubCategories(product.category).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>

                    <input
                      placeholder="Price *"
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    />
                    <input
                      placeholder="Stock *"
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateProduct(idx, 'stock', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    />
                    <input
                      placeholder="Description"
                      value={product.description}
                      onChange={(e) => updateProduct(idx, 'description', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 md:col-span-2 lg:col-span-3"
                    />
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Click "+ Add Product" to start adding products
              </div>
            )}

            <button
              onClick={submitFormProducts}
              disabled={uploading || products.filter(p => p.name).length === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition"
            >
              {uploading ? '⏳ Adding...' : `📦 Add ${products.filter(p => p.name).length} Products`}
            </button>

            {userRole === 'vendor' && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Maximum 50 products per batch. Your brand will be auto-filled.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkUpload;
