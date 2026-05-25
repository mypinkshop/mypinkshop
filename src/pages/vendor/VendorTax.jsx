import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorTax() {
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState({
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    taxCollected: 0,
    taxPeriod: 'May 2025',
  });
  const [gstHistory, setGstHistory] = useState([]);
  const [vendor, setVendor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    const vendorName = vendorInfo.brandName || vendorInfo.name;
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    const deliveredOrders = myOrders.filter(o => o.status === 'delivered');
    
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    const taxCollected = totalSales * 0.05;
    
    setTaxSettings(prev => ({
      ...prev,
      taxCollected: taxCollected,
    }));
    
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 4; i >= 0; i--) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      monthlyData.push({
        month: months[monthIndex],
        sales: Math.floor(Math.random() * 50000) + 20000,
        tax: Math.floor(Math.random() * 2500) + 1000,
      });
    }
    setGstHistory(monthlyData);
    
    setLoading(false);
  }, [navigate]);

  const handleGstChange = (e) => {
    const newGstRate = parseInt(e.target.value);
    setTaxSettings({
      ...taxSettings,
      gstRate: newGstRate,
      cgstRate: newGstRate / 2,
      sgstRate: newGstRate / 2,
      igstRate: newGstRate,
    });
  };

  const saveTaxSettings = () => {
    localStorage.setItem('vendorTaxSettings', JSON.stringify(taxSettings));
    alert('Tax settings saved successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="tax" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Tax & GST Settings</h1>
            <p className="text-gray-500 text-sm">Configure your tax rates and GST details</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GST Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">GST Configuration</h2>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <select value={taxSettings.gstRate} onChange={handleGstChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Essential Goods)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
                    <input type="text" value={taxSettings.cgstRate} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                    <p className="text-xs text-gray-400 mt-1">Central GST (50% of total GST)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
                    <input type="text" value={taxSettings.sgstRate} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                    <p className="text-xs text-gray-400 mt-1">State GST (50% of total GST)</p>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-medium text-gray-800 mb-2">GST Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Total GST Collected</span><span className="font-semibold">₹{taxSettings.taxCollected.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">CGST Amount</span><span className="font-semibold">₹{(taxSettings.taxCollected / 2).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-600">SGST Amount</span><span className="font-semibold">₹{(taxSettings.taxCollected / 2).toLocaleString()}</span></div>
                  </div>
                </div>
                <button onClick={saveTaxSettings} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">
                  Save GST Settings
                </button>
              </div>
            </div>

            {/* GST Filing History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">GST Filing History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Period</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">GST Collected</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gstHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.month} 2025</td>
                        <td className="px-4 py-3 text-right">₹{item.sales.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{item.tax.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Filed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">Important GST Information</p>
            <p className="text-xs text-yellow-600 mt-1">GST is automatically calculated based on the product category. Ensure your GSTIN is updated in Business Details.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorTax;
