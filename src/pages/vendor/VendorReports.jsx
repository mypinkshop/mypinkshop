import VendorSidebar from './components/VendorSidebar';

function VendorReports() {
  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Reports</h1>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div className="text-4xl mb-3">📊</div><h3 className="font-semibold">Sales Report</h3><p className="text-sm text-gray-500 mt-1">Download your sales data</p><button className="mt-3 text-pink-500 text-sm">Download CSV →</button></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div className="text-4xl mb-3">📦</div><h3 className="font-semibold">Inventory Report</h3><p className="text-sm text-gray-500 mt-1">Stock summary report</p><button className="mt-3 text-pink-500 text-sm">Download CSV →</button></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div className="text-4xl mb-3">💰</div><h3 className="font-semibold">Tax Report</h3><p className="text-sm text-gray-500 mt-1">GST summary report</p><button className="mt-3 text-pink-500 text-sm">Download CSV →</button></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div className="text-4xl mb-3">📋</div><h3 className="font-semibold">Order Report</h3><p className="text-sm text-gray-500 mt-1">Order details report</p><button className="mt-3 text-pink-500 text-sm">Download CSV →</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorReports;
