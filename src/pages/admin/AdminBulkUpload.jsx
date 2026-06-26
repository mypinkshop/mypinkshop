import { useNavigate } from 'react-router-dom';
import BulkUpload from '../../components/BulkUpload';
import toast from 'react-hot-toast';

function AdminBulkUpload() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/admin/inventory')}
                className="text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1 text-sm transition"
              >
                ← Back to Inventory
              </button>
              <h1 className="text-2xl font-bold text-gray-800">📤 Bulk Upload Products</h1>
              <p className="text-gray-500 text-sm">Add multiple products at once</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Admin Portal
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <BulkUpload 
          userRole="admin" 
          onSuccess={() => {
            toast.success('✅ Products uploaded successfully!');
          }}
        />
        
        {/* Admin Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">📝 Admin Instructions:</h3>
          <ul className="text-sm space-y-1 text-yellow-700">
            <li>• CSV Upload: Best for <strong>10+ products</strong></li>
            <li>• Form Upload: Best for <strong>2-10 products</strong></li>
            <li>• All products will be <strong>auto-approved</strong></li>
            <li>• Images need to be added <strong>separately</strong> after upload</li>
            <li>• Max <strong>500 products</strong> per batch</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminBulkUpload;
