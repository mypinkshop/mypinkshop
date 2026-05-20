import { useState } from 'react';

function AdminTax() {
  const [taxRates, setTaxRates] = useState([
    { id: 1, name: 'GST (Standard)', rate: 18, type: 'percentage', applicableOn: 'all', status: 'active' },
    { id: 2, name: 'GST (Reduced)', rate: 5, type: 'percentage', applicableOn: 'essentials', status: 'active' },
    { id: 3, name: 'GST (Zero)', rate: 0, type: 'percentage', applicableOn: 'exempt', status: 'active' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Tax Settings</h1></div>
      </div>

      <div className="p-6">
        <div className="flex justify-end mb-4"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Tax Rate</button></div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Tax Name</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Applicable On</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y">
              {taxRates.map(tax => (
                <tr key={tax.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{tax.name}</td>
                  <td className="px-4 py-3 text-right">{tax.rate}%</td>
                  <td className="px-4 py-3 capitalize">{tax.type}</td>
                  <td className="px-4 py-3 capitalize">{tax.applicableOn}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${tax.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{tax.status}</span></td>
                  <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button className="text-blue-500">✏️</button><button className="text-red-500">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-800">💡 GST Configuration: Standard rate (18%) applies to most products. Reduced rate (5%) applies to essential items like skincare basics. Zero rate for exempted items.</p></div>
      </div>
    </div>
  );
}

export default AdminTax;
