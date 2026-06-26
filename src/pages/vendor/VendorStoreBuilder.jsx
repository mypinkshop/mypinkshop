import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';
import { Link } from 'react-router-dom';

function VendorStoreBuilder() {
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="store" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-7xl mb-6">🏪</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Store Builder</h2>
            <p className="text-gray-500 text-lg mb-6">Create your brand storefront</p>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl">🚀</span>
                <p className="text-lg font-semibold text-purple-800">Coming Soon!</p>
              </div>
              <p className="text-purple-700 text-sm">
                We're building an amazing store builder for you. 
                Launch your custom brand store with zero coding!
              </p>
            </div>

            <div className="mt-8 text-left bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-800 mb-3">✨ What's Coming:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Custom brand logo & banner
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Product collection showcase
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Brand story section
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Social media links integration
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> SEO optimized store page
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Mobile responsive design
                </div>
              </div>
            </div>

            <Link 
              to="/vendor/dashboard"
              className="mt-8 inline-block px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorStoreBuilder;
