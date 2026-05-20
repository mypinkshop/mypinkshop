import { useState } from 'react';

function AdminReports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('last30');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Reports</h1></div>
      </div>

      <div className="p-6">
        {/* Report Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex gap-4"><button onClick={() => setReportType('sales')} className={`px-4 py-2 rounded-lg text-sm ${reportType === 'sales' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Sales Report</button><button onClick={() => setReportType('inventory')} className={`px-4 py-2 rounded-lg text-sm ${reportType === 'inventory' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Inventory Report</button><button onClick={() => setReportType('tax')} className={`px-4 py-2 rounded-lg text-sm ${reportType === 'tax' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Tax Report</button></div>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm"><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="last90">Last 90 days</option><option value="year">This Year</option></select>
        </div>

        {/* Sales Report */}
        {reportType === 'sales' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Sales Summary</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">342</p></div>
              <div className="bg-gray-50 rounded-lg p-4 text-center"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">₹45,20,000</p></div>
              <div className="bg-gray-50 rounded-lg p-4 text-center"><p className="text-sm text-gray-500">Average Order Value</p><p className="text-2xl font-bold">₹13,216</p></div>
            </div>
            <div className="border-t border-gray-200 pt-4"><h3 className="font-medium mb-3">Top Selling Products</h3><table className="w-full text-sm"><thead><tr><th className="text-left py-2">Product</th><th className="text-right py-2">Units Sold</th><th className="text-right py-2">Revenue</th></tr></thead><tbody><tr><td className="py-2">Glass Skin Serum</td><td className="text-right">234</td><td className="text-right">₹3,03,966</td></tr><tr><td className="py-2">Cherry Lip Tint</td><td className="text-right">189</td><td className="text-right">₹1,13,211</td></tr><tr><td className="py-2">Satin Slip Dress</td><td className="text-right">156</td><td className="text-right">₹3,89,844</td></tr></tbody></table></div>
            <div className="mt-6 flex justify-end"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">Download Report (CSV)</button></div>
          </div>
        )}

        {/* Inventory Report */}
        {reportType === 'inventory' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Inventory Summary</h2>
            <div className="grid grid-cols-4 gap-4 mb-6"><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total SKUs</p><p className="text-xl font-bold">284</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">In Stock</p><p className="text-xl font-bold text-green-600">245</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Low Stock</p><p className="text-xl font-bold text-yellow-600">28</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-xl font-bold text-red-600">11</p></div></div>
            <div className="flex justify-end"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">Download Report (CSV)</button></div>
          </div>
        )}

        {/* Tax Report */}
        {reportType === 'tax' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tax Summary</h2>
            <div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total Tax Collected</p><p className="text-2xl font-bold">₹2,26,000</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">GST (5%)</p><p className="text-2xl font-bold">₹2,26,000</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Tax Period</p><p className="text-lg font-medium">May 2025</p></div></div>
            <div className="flex justify-end"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">Download Tax Report (CSV)</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
