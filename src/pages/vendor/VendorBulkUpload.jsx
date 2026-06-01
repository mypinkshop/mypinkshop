import { useNavigate } from 'react-router-dom';
import BulkUpload from '../../components/BulkUpload';

function VendorBulkUpload() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/vendor/products')}
                className="text-gray-500 hover:text-gray-700 mb-1"
              >
                ← Back to My Products
              </button>
              <h1 className="text-2xl font-bold">Bulk Upload Products</h1>
              <p className="text-gray-500 text-sm">Add multiple products at once</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <BulkUpload 
          userRole="vendor" 
          onSuccess={() => {
            alert('Products submitted for admin approval!');
            navigate('/vendor/products');
          }}
        />
        
        {/* Vendor Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium mb-2">📝 Vendor Instructions:</h3>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• Max 100 products per CSV upload</li>
            <li>• Max 50 products per form upload</li>
            <li>• Products will go for admin approval</li>
            <li>• You'll be notified when approved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VendorBulkUpload;
