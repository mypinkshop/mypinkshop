import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorReturns() {
  const [returns, setReturns] = useState([
    { id: 'RET-001', orderId: '#MPS-1004', customer: 'Riya Mehta', product: 'Glass Skin Serum', reason: 'Damaged product', status: 'pending', requestedDate: '2025-05-20', amount: 1299 },
    { id: 'RET-002', orderId: '#MPS-1002', customer: 'Aditi Singh', product: 'Cherry Lip Tint', reason: 'Wrong size', status: 'approved', requestedDate: '2025-05-18', amount: 599 },
  ]);

  const updateStatus = (id, newStatus) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status: newStatus } : r));
    alert(`Return ${id} ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader /><VendorSidebar activeTab="returns" />
      <main className="ml-64 pt-16 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Returns & Refunds</h1>
        <p className="text-gray-500 mb-6">Manage customer return requests</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Return ID</th><th className="px-4 py-3 text-left">Order ID</th><th className="px-4 py-3 text-left">Customer</th><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">Reason</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
            <tbody className="divide-y">{returns.map(r => (<tr key={r.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-mono text-xs">{r.id}</td><td className="px-4 py-3">{r.orderId}</td><td className="px-4 py-3">{r.customer}</td><td className="px-4 py-3">{r.product}</td><td className="px-4 py-3 text-gray-500">{r.reason}</td><td className="px-4 py-3 text-right font-medium">₹{r.amount}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td><td className="px-4 py-3 text-center">{r.status === 'pending' && <div className="flex gap-2 justify-center"><button onClick={() => updateStatus(r.id, 'approved')} className="text-green-600 text-xs">Approve</button><button onClick={() => updateStatus(r.id, 'rejected')} className="text-red-600 text-xs">Reject</button></div>}</td></tr>))}</tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
export default VendorReturns;
