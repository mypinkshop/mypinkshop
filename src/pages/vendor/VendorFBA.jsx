import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorFBA() {
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader /><VendorSidebar activeTab="fba" />
      <main className="ml-64 pt-16 p-6 flex items-center justify-center h-screen"><div className="text-center"><div className="text-6xl mb-4">🚚</div><h2 className="text-2xl font-bold text-gray-800 mb-2">FBA Shipments</h2><p className="text-gray-500 mb-4">Fulfillment by Amazon feature is coming soon!</p><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block"><p className="text-sm text-yellow-800">⚡ We're working on bringing you FBA capabilities. Stay tuned!</p></div></div></main>
    </div>
  );
}
export default VendorFBA;
