import { useState } from 'react';

function AdminCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 999, maxDiscount: 500, validTill: '2025-12-31', usageCount: 234, status: 'active' },
    { id: 2, code: 'FLAT200', discount: 200, type: 'fixed', minOrder: 999, maxDiscount: 200, validTill: '2025-06-30', usageCount: 89, status: 'active' },
    { id: 3, code: 'PINK15', discount: 15, type: 'percentage', minOrder: 1499, maxDiscount: 1000, validTill: '2025-05-31', usageCount: 45, status: 'expired' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Coupons & Promotions</h1></div>
      </div>

      <div className="p-6">
        <div className="flex justify-end mb-4"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">+ Create Coupon</button></div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Coupon Code</th><th className="px-4 py-3 text-center">Discount</th><th className="px-4 py-3 text-center">Min Order</th><th className="px-4 py-3 text-center">Max Discount</th><th className="px-4 py-3 text-center">Valid Till</th><th className="px-4 py-3 text-center">Used</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-pink-600">{coupon.code}</td>
                  <td className="px-4 py-3 text-center">{coupon.type === 'percentage' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}</td>
                  <td className="px-4 py-3 text-center">₹{coupon.minOrder}</td>
                  <td className="px-4 py-3 text-center">₹{coupon.maxDiscount}</td>
                  <td className="px-4 py-3 text-center">{coupon.validTill}</td>
                  <td className="px-4 py-3 text-center">{coupon.usageCount}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${coupon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{coupon.status}</span></td>
                  <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button className="text-blue-500">✏️</button><button className="text-red-500">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminCoupons;
