import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorStoreBuilder() {
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="store" />
      <main className="ml-64 pt-16 p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Store Builder</h2>
          <p className="text-gray-500 mb-4">Create your brand storefront</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block max-w-md">
            <p className="text-sm text-yellow-800">✨ This feature is coming soon! ✨</p>
            <p className="text-xs text-yellow-600 mt-2">Build your custom brand store with your logo, products, and unique layout.</p>
          </div>
          <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <p className="font-medium text-gray-700 mb-2">What's coming:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Custom brand logo and banner</li>
              <li>✓ Product collection showcase</li>
              <li>✓ Brand story section</li>
              <li>✓ Social media links integration</li>
              <li>✓ SEO optimized store page</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorStoreBuilder;
