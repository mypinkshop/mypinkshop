import { useState } from 'react';

function AdminPayments() {
  const [transactions, setTransactions] = useState([
    { id: 'TXN001', vendor: 'Nykaa Beauty', amount: 125000, commission: 18750, payout: 106250, status: 'paid', date: '2025-05-15' },
    { id: 'TXN002', vendor: 'Mamaearth', amount: 89000, commission: 13350, payout: 75650, status: 'pending', date: '2025-05-14' },
    { id: 'TXN003', vendor: 'Sugar Cosmetics', amount: 45000, commission: 6750, payout: 38250, status: 'processing', date: '2025-05-13' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Payments</h1></div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Total Earnings</p><p className="text-2xl font-semibold">₹38,850</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Pending Payouts</p><p className="text-2xl font-semibold text-yellow-600">₹75,650</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Total Vendors Paid</p><p className="text-2xl font-semibold">1</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Commission Rate</p><p className="text-2xl font-semibold">15%</p></div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Transaction ID</th><th className="px-4 py-3 text-left">Vendor</th><th className="px-4 py-3 text-right">Sales Amount</th><th className="px-4 py-3 text-right">Commission (15%)</th><th className="px-4 py-3 text-right">Vendor Payout</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Date</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
            <tbody className="divide-y">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{tx.id}</td>
                  <td className="px-4 py-3">{tx.vendor}</td>
                  <td className="px-4 py-3 text-right">₹{tx.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{tx.commission.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{tx.payout.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{tx.status}</span></td>
                  <td className="px-4 py-3 text-center text-gray-500">{tx.date}</td>
                  <td className="px-4 py-3 text-center">{tx.status === 'pending' && <button className="text-green-600 hover:text-green-700 text-sm">Release Payment</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPayments;
