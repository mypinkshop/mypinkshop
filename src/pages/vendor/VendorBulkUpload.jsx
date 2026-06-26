import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BulkUpload from '../../components/BulkUpload';

function VendorBulkUpload() {
  const navigate = useNavigate();
  const [vendorName, setVendorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
    if (vendorData.brandName || vendorData.name) {
      setVendorName(vendorData.brandName || vendorData.name);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/vendor/products')}
                className="text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1 text-sm transition"
              >
                ← Back to My Products
              </button>
              <h1 className="text-2xl font-bold text-gray-800">📤 Bulk Upload Products</h1>
              <p className="text-gray-500 text-sm">Add multiple products at once</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Vendor</span>
              <p className="text-sm font-semibold text-pink-600">{vendorName || 'My Store'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <BulkUpload 
          userRole="vendor" 
          onSuccess={() => {
            alert('✅ Products submitted for admin approval!');
            navigate('/vendor/products');
          }}
        />
        
        {/* Vendor Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">📝 Vendor Instructions:</h3>
          <ul className="text-sm space-y-1 text-yellow-700">
            <li>• Max <strong>100 products</strong> per CSV upload</li>
            <li>• Max <strong>50 products</strong> per form upload</li>
            <li>• Products will go for <strong>admin approval</strong></li>
            <li>• You'll be notified when approved</li>
            <li>• Brand will be auto-filled from your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VendorBulkUpload;
