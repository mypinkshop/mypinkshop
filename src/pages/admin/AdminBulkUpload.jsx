import { useNavigate } from 'react-router-dom';
import BulkUpload from '../../components/BulkUpload';

function AdminBulkUpload() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/admin/inventory')}
                className="text-gray-500 hover:text-gray-700 mb-1"
              >
                ← Back to Inventory
              </button>
              <h1 className="text-2xl font-bold">Bulk Upload Products</h1>
              <p className="text-gray-500 text-sm">Add multiple products at once</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <BulkUpload 
          userRole="admin" 
          onSuccess={() => {
            // Optional: refresh product list or show success message
            console.log('Products added successfully');
          }}
        />
        
        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium mb-2">📝 Admin Instructions:</h3>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• CSV Upload: Best for 10+ products</li>
            <li>• Form Upload: Best for 2-10 products</li>
            <li>• All products will be auto-approved</li>
            <li>• Images need to be added separately after upload</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminBulkUpload;
