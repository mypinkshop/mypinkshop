import { useState } from 'react';

function BulkUpload({ userRole, onSuccess }) {
  const [uploadMethod, setUploadMethod] = useState('csv');
  const [products, setProducts] = useState([{ name: '', price: '', stock: '' }]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('token');

  // Download CSV template
  const downloadTemplate = () => {
    window.open('/templates/product-template.csv');
  };

  // CSV Upload
  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('role', userRole);

    try {
      const response = await fetch(`${API_URL}/api/products/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.added > 0) {
        alert(`✅ ${result.added} products added successfully!\n❌ ${result.failed} failed`);
        if (onSuccess) onSuccess();
        setCsvFile(null);
      } else {
        alert('❌ Upload failed. Please check your file format.');
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
    setUploading(false);
  };

  // Form methods
  const addProductRow = () => {
    const maxLimit = userRole === 'vendor' ? 50 : 500;
    if (products.length >= maxLimit) {
      alert(`Maximum ${maxLimit} products at once`);
      return;
    }
    setProducts([...products, { name: '', price: '', stock: '', brand: '', category: '' }]);
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const submitFormProducts = async () => {
    const validProducts = products.filter(p => p.name && p.price && p.stock);
    
    if (validProducts.length === 0) {
      alert('Please fill at least one product');
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: validProducts.length });
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: product.name,
            brand: product.brand || 'Generic',
            category: product.category || 'Uncategorized',
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            description: product.description ? [product.description] : []
          })
        });

        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
      
      setProgress({ current: i + 1, total: validProducts.length });
    }

    alert(`✅ ${success} products added!\n❌ ${failed} failed`);
    
    if (success > 0) {
      setProducts([{ name: '', price: '', stock: '', brand: '', category: '' }]);
      if (onSuccess) onSuccess();
    }
    setUploading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setUploadMethod('csv')}
          className={`flex-1 py-3 text-center font-medium ${
            uploadMethod === 'csv' 
              ? 'text-pink-600 border-b-2 border-pink-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 CSV Upload
        </button>
        <button
          onClick={() => setUploadMethod('form')}
          className={`flex-1 py-3 text-center font-medium ${
            uploadMethod === 'form' 
              ? 'text-pink-600 border-b-2 border-pink-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Add Multiple Products
        </button>
      </div>

      {/* CSV Upload Tab */}
      {uploadMethod === 'csv' && (
        <div className="p-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">📥 Step 1: Download Template</h3>
            <button
              onClick={downloadTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Download CSV Template
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {userRole === 'vendor' ? 'Max 100 products per upload' : 'Unlimited products'}
            </p>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center mb-6">
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

          <button
            onClick={handleCSVUpload}
            disabled={!csvFile || uploading}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition"
          >
            {uploading ? 'Uploading...' : '🚀 Upload & Add Products'}
          </button>
        </div>
      )}

      {/* Form Tab */}
      {uploadMethod === 'form' && (
        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Products ({products.length})</h3>
            <button
              onClick={addProductRow}
              className="text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg text-sm hover:bg-pink-50"
            >
              + Add Another Product
            </button>
          </div>

          {/* Progress Bar */}
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
              <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Product #{idx + 1}</span>
                  {products.length > 1 && (
                    <button
                      onClick={() => removeProduct(idx)}
                      className="text-red-400 text-sm hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    placeholder="Product Name *"
                    value={product.name}
                    onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  />
                  <input
                    placeholder="Brand"
                    value={product.brand}
                    onChange={(e) => updateProduct(idx, 'brand', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  />
                  <input
                    placeholder="Category"
                    value={product.category}
                    onChange={(e) => updateProduct(idx, 'category', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  />
                  <input
                    placeholder="Price *"
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  />
                  <input
                    placeholder="Stock *"
                    type="number"
                    value={product.stock}
                    onChange={(e) => updateProduct(idx, 'stock', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Click "+ Add Another Product" to start adding products
            </div>
          )}

          <button
            onClick={submitFormProducts}
            disabled={uploading || products.filter(p => p.name).length === 0}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition"
          >
            {uploading ? 'Adding...' : `📦 Add ${products.filter(p => p.name).length} Products`}
          </button>

          {userRole === 'vendor' && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Maximum 50 products per batch for vendors
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BulkUpload;
