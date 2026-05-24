import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 999, validTill: '2025-12-31', usageCount: 45, status: 'active' },
    { id: 2, code: 'FLAT200', discount: 200, type: 'fixed', minOrder: 999, validTill: '2025-06-30', usageCount: 23, status: 'active' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'percentage', minOrder: '', validTill: '' });

  const createCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount) { alert('Please fill all fields'); return; }
    setCoupons([...coupons, { id: Date.now(), ...newCoupon, usageCount: 0, status: 'active' }]);
    setShowModal(false); setNewCoupon({ code: '', discount: '', type: 'percentage', minOrder: '', validTill: '' });
    alert('Coupon created!');
  };

  const toggleStatus = (id) => { setCoupons(coupons.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c)); };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader /><VendorSidebar activeTab="coupons" />
      <main className="ml-64 pt-16 p-6">
        <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Coupons & Promotions</h1><p className="text-gray-500">Create discounts to boost sales</p></div><button onClick={() => setShowModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg">+ Create Coupon</button></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-center">Discount</th><th className="px-4 py-3 text-right">Min Order</th><th className="px-4 py-3 text-center">Valid Till</th><th className="px-4 py-3 text-center">Used</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
          <tbody className="divide-y">{coupons.map(c => (<tr key={c.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-mono font-bold text-pink-600">{c.code}</td><td className="px-4 py-3 text-center">{c.type === 'percentage' ? `${c.discount}% OFF` : `₹${c.discount} OFF`}</td><td className="px-4 py-3 text-right">₹{c.minOrder}</td><td className="px-4 py-3 text-center">{c.validTill}</td><td className="px-4 py-3 text-center">{c.usageCount}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span></td><td className="px-4 py-3 text-center"><button onClick={() => toggleStatus(c.id)} className="text-blue-500 text-sm">{c.status === 'active' ? 'Disable' : 'Enable'}</button></td></tr>))}</tbody></table></div>
        {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}><div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}><div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">Create Coupon</h3><button onClick={() => setShowModal(false)}>✕</button></div><div className="p-5 space-y-4"><input type="text" placeholder="Coupon Code" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg" /><div className="flex gap-3"><select value={newCoupon.type} onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })} className="w-1/3 px-3 py-2 border rounded-lg"><option value="percentage">%</option><option value="fixed">₹</option></select><input type="number" placeholder="Discount" value={newCoupon.discount} onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg" /></div><input type="number" placeholder="Minimum Order Amount" value={newCoupon.minOrder} onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /><input type="date" placeholder="Valid Till" value={newCoupon.validTill} onChange={(e) => setNewCoupon({ ...newCoupon, validTill: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /><button onClick={createCoupon} className="w-full bg-pink-600 text-white py-2 rounded-lg">Create Coupon</button></div></div></div>)}
      </main>
    </div>
  );
}
export default VendorCoupons;
