import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrderReports() {
  const [dateRange, setDateRange] = useState('last30');

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader /><VendorSidebar activeTab="reports" />
      <main className="ml-64 pt-16 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Reports</h1>
        <p className="text-gray-500 mb-6">Download your order data and analytics</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex justify-between items-center mb-4"><h2 className="font-semibold">Sales Summary</h2><select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-1 border rounded-lg text-sm"><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="last90">Last 90 days</option></select></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">156</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total Sales</p><p className="text-2xl font-bold text-green-600">₹1,25,000</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Average Order Value</p><p className="text-2xl font-bold">₹801</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Return Rate</p><p className="text-2xl font-bold text-orange-500">2.3%</p></div></div>
        <div className="flex gap-3 justify-end"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">Download CSV</button><button className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Download PDF</button></div></div>
      </main>
    </div>
  );
}
export default VendorOrderReports;
