import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminPayments() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // requests | history | bulk
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('thisMonth');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseData, setReleaseData] = useState({ vendorId: '', amount: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalThisMonth: 0,
    totalVendors: 0,
    pendingRequests: 0,
    commissionRate: 15
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadPaymentData(token);
  }, [navigate]);

  const loadPaymentData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Load payment requests
      const requestsRes = await fetch(`${API_URL}/api/admin/payment-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (requestsRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPaymentRequests(data || []);
        calculateStats(data);
      }

      // 2. Load transaction history
      const historyRes = await fetch(`${API_URL}/api/admin/transaction-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyRes.ok) {
        const data = await historyRes.json();
        setTransactions(data || []);
      }

    } catch (err) {
      console.error('Error loading payment data:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests) => {
    const pending = requests.filter(r => r.status === 'pending');
    const paid = requests.filter(r => r.status === 'paid' || r.status === 'approved');
    const thisMonth = requests.filter(r => {
      const date = new Date(r.createdAt || r.requestDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const vendors = new Set(requests.map(r => r.vendorId || r.vendor));

    setStats({
      totalPending: pending.reduce((sum, r) => sum + (r.amount || 0), 0),
      totalPaid: paid.reduce((sum, r) => sum + (r.amount || 0), 0),
      totalThisMonth: thisMonth.reduce((sum, r) => sum + (r.amount || 0), 0),
      totalVendors: vendors.size,
      pendingRequests: pending.length,
      commissionRate: 15
    });
  };

  // ✅ Approve single payment request
  const approvePayment = async (requestId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('✅ Payment approved!');
        loadPaymentData(token);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to approve');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ✅ Reject payment request
  const rejectPayment = async (requestId) => {
    if (!window.confirm('Reject this payment request?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('❌ Payment rejected');
        loadPaymentData(token);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to reject');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ✅ Mark as paid
  const markAsPaid = async (requestId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-requests/${requestId}/paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('💰 Payment marked as paid!');
        loadPaymentData(token);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to mark as paid');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ✅ Bulk approve payments
  const bulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one request');
      return;
    }
    if (!window.confirm(`Approve ${selectedIds.length} payment requests?`)) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-requests/bulk-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        toast.success(`✅ ${selectedIds.length} payments approved!`);
        setSelectedIds([]);
        loadPaymentData(token);
      } else {
        toast.error('Bulk approve failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ✅ Bulk release payments
  const bulkRelease = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one request');
      return;
    }
    if (!window.confirm(`Release ${selectedIds.length} payments?`)) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-requests/bulk-release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        toast.success(`💰 ${selectedIds.length} payments released!`);
        setSelectedIds([]);
        loadPaymentData(token);
      } else {
        toast.error('Bulk release failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ✅ Download report
  const downloadReport = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/payments/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('📊 Report downloaded!');
      }
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const filteredRequests = paymentRequests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const vendor = (r.vendorName || r.vendor || '').toLowerCase();
      return vendor.includes(search);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AdminSidebar />
        <div className="md:ml-64 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">💳 Payment Management</h1>
              <p className="text-sm text-gray-500">Manage vendor payment requests and releases</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={downloadReport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
              >
                📊 Download Report
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">₹{stats.totalPending.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-pink-600">₹{stats.totalThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalVendors}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-2 text-sm font-medium transition-all ${
                activeTab === 'requests' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Payment Requests ({paymentRequests.filter(r => r.status === 'pending').length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 text-sm font-medium transition-all ${
                activeTab === 'history' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 History ({transactions.length})
            </button>
          </div>

          {/* Filters */}
          {activeTab === 'requests' && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'approved' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Approved
                </button>
                <button 
                  onClick={() => setFilterStatus('paid')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Paid
                </button>
                <button 
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Rejected
                </button>
              </div>
              <div className="relative flex-1 max-w-xs">
                <input 
                  type="text" 
                  placeholder="Search vendor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {activeTab === 'requests' && selectedIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-3">
              <span className="text-sm text-blue-700">{selectedIds.length} selected</span>
              <button onClick={bulkApprove} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                ✅ Approve Selected
              </button>
              <button onClick={bulkRelease} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                💰 Release Selected
              </button>
              <button onClick={() => setSelectedIds([])} className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition">
                Cancel
              </button>
            </div>
          )}

          {/* Payment Requests Table */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(filteredRequests.map(r => r._id || r.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                          className="rounded border-gray-300 text-pink-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Commission</th>
                      <th className="px-4 py-3 text-right">Net Payable</th>
                      <th className="px-4 py-3 text-center">Period</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                          <div className="text-5xl mb-3">💳</div>
                          <p>No payment requests found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map(request => (
                        <tr key={request._id || request.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(request._id || request.id)}
                              onChange={() => {
                                const id = request._id || request.id;
                                setSelectedIds(prev => 
                                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                );
                              }}
                              className="rounded border-gray-300 text-pink-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{request.vendorName || request.vendor}</td>
                          <td className="px-4 py-3 text-right">₹{(request.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-500">-₹{(request.commission || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">₹{(request.netPayable || request.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {request.period || request.month || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                              {request.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {request.status === 'pending' && (
                                <>
                                  <button onClick={() => approvePayment(request._id || request.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition" title="Approve">✅</button>
                                  <button onClick={() => rejectPayment(request._id || request.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition" title="Reject">❌</button>
                                </>
                              )}
                              {(request.status === 'pending' || request.status === 'approved') && (
                                <button onClick={() => markAsPaid(request._id || request.id)} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition" title="Mark as Paid">💰</button>
                              )}
                              <button className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition" title="View">👁️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Transaction ID</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Commission</th>
                      <th className="px-4 py-3 text-right">Net Paid</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                          <div className="text-5xl mb-3">📊</div>
                          <p>No transaction history</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx._id || tx.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs">#{tx._id?.slice(-8) || tx.id}</td>
                          <td className="px-4 py-3">{tx.vendorName || tx.vendor}</td>
                          <td className="px-4 py-3 text-right">₹{(tx.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-500">-₹{(tx.commission || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">₹{(tx.netPayable || tx.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {tx.date || tx.createdAt ? new Date(tx.createdAt || tx.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tx.status)}`}>
                              {tx.status || 'paid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPayments;
