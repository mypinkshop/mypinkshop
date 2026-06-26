import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    blockedCustomers: 0,
    totalOrders: 0,
    totalSpent: 0
  });
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCustomers(token);
  }, [navigate]);

  // ✅ Load customers from backend
  const loadCustomers = async (token) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/users?role=customer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        const customersData = data.users || data || [];
        setCustomers(customersData);
        calculateStats(customersData);
      } else {
        setError(data.message || 'Failed to load customers');
        toast.error(data.message || 'Failed to load customers');
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate stats from customers data
  const calculateStats = (customersList) => {
    const active = customersList.filter(c => c.status === 'active' || c.status === 'approved').length;
    const blocked = customersList.filter(c => c.status === 'blocked' || c.status === 'suspended').length;
    const totalOrders = customersList.reduce((sum, c) => sum + (c.orderCount || 0), 0);
    const totalSpent = customersList.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    setStats({
      totalCustomers: customersList.length,
      activeCustomers: active,
      blockedCustomers: blocked,
      totalOrders,
      totalSpent
    });
  };

  // ✅ Block customer
  const blockCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to block this customer?')) return;

    const token = localStorage.getItem('adminToken');
    setProcessingId(id);

    try {
      const res = await fetch(`${API_URL}/api/users/${id}/block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('🔒 Customer blocked successfully');
        await loadCustomers(token);
      } else {
        toast.error(data.message || 'Failed to block customer');
      }
    } catch (err) {
      console.error('Error blocking customer:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Unblock customer
  const unblockCustomer = async (id) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(id);

    try {
      const res = await fetch(`${API_URL}/api/users/${id}/unblock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('🔓 Customer unblocked successfully');
        await loadCustomers(token);
      } else {
        toast.error(data.message || 'Failed to unblock customer');
      }
    } catch (err) {
      console.error('Error unblocking customer:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Reset password
  const resetPassword = async (customer) => {
    setSelectedCustomer(customer);
    setNewPassword('');
    setConfirmPassword('');
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const token = localStorage.getItem('adminToken');
    setProcessingId(selectedCustomer._id || selectedCustomer.id);

    try {
      const res = await fetch(`${API_URL}/api/users/${selectedCustomer._id || selectedCustomer.id}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`✅ Password reset successfully for ${selectedCustomer.name}`);
        setShowResetPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        await loadCustomers(token);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Edit customer name
  const editCustomer = async (customer) => {
    const newName = window.prompt('Enter new name:', customer.name);
    if (!newName || !newName.trim()) return;

    const token = localStorage.getItem('adminToken');
    setProcessingId(customer._id || customer.id);

    try {
      const res = await fetch(`${API_URL}/api/users/${customer._id || customer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('✅ Customer name updated successfully');
        await loadCustomers(token);
      } else {
        toast.error(data.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Delete customer
  const deleteCustomer = async (id) => {
    if (!window.confirm('⚠️ Are you sure you want to permanently delete this customer?')) return;

    const token = localStorage.getItem('adminToken');
    setProcessingId(id);

    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('🗑️ Customer deleted successfully');
        await loadCustomers(token);
      } else {
        toast.error(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    if (status === 'active' || status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'blocked' || status === 'suspended') return 'bg-red-100 text-red-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const filteredCustomers = customers.filter(c => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && c.status !== 'active' && c.status !== 'approved') return false;
      if (filterStatus === 'blocked' && c.status !== 'blocked' && c.status !== 'suspended') return false;
      if (filterStatus === 'pending' && c.status !== 'pending') return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(searchLower)) ||
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c._id && c._id.toString().includes(searchTerm))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">👥 Customer Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage, monitor, and control customer accounts</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by name, email, phone or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 lg:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 md:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className="text-xs text-gray-500">Total Customers</p>
                <span className="text-base sm:text-lg">👥</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className="text-xs text-gray-500">Active</p>
                <span className="text-base sm:text-lg">🟢</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className="text-xs text-gray-500">Blocked</p>
                <span className="text-base sm:text-lg">🔴</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.blockedCustomers}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className="text-xs text-gray-500">Total Orders</p>
                <span className="text-base sm:text-lg">📦</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className="text-xs text-gray-500">Total Spent</p>
                <span className="text-base sm:text-lg">💰</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-pink-600">₹{stats.totalSpent.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setFilterStatus('all')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All ({stats.totalCustomers})</button>
            <button onClick={() => setFilterStatus('active')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Active ({stats.activeCustomers})</button>
            <button onClick={() => setFilterStatus('blocked')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === 'blocked' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Blocked ({stats.blockedCustomers})</button>
            <button onClick={() => setFilterStatus('pending')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Pending</button>
          </div>

          {/* Customers Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-left">Customer</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-left">Contact</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-center">Orders</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right">Spent</th>
                    <th className="hidden md:table-cell px-3 sm:px-5 py-2 sm:py-3 text-center">Joined</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-center">Status</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">👥</div>
                        <p>No customers found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer._id || customer.id} className="hover:bg-pink-50/30 transition">
                        <td className="px-3 sm:px-5 py-2 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xs sm:text-base shadow-sm">
                              {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-xs sm:text-sm line-clamp-1">{customer.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400">ID: {(customer._id || customer.id)?.toString().slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3">
                          <div>
                            <p className="text-gray-600 text-[11px] sm:text-sm truncate max-w-[120px] sm:max-w-none">{customer.email}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{customer.phone || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-center">
                          <span className="font-semibold text-gray-800">{customer.orderCount || 0}</span>
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-right">
                          <span className="font-semibold text-pink-600 text-xs sm:text-sm">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-5 py-2 sm:py-3 text-center">
                          <span className="text-[10px] sm:text-xs text-gray-500">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-center">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(customer.status)}`}>
                            {customer.status || 'active'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => viewCustomerDetails(customer)} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="View Details">👁️</button>
                            <button onClick={() => editCustomer(customer)} className="p-1 text-purple-500 hover:bg-purple-50 rounded-lg transition" title="Edit">✏️</button>
                            <button onClick={() => resetPassword(customer)} className="p-1 text-yellow-500 hover:bg-yellow-50 rounded-lg transition" title="Reset Password">🔑</button>
                            {(customer.status === 'active' || customer.status === 'approved') ? (
                              <button onClick={() => blockCustomer(customer._id || customer.id)} disabled={processingId === (customer._id || customer.id)} className="p-1 text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-50" title="Block">🔒</button>
                            ) : (customer.status === 'blocked' || customer.status === 'suspended') ? (
                              <button onClick={() => unblockCustomer(customer._id || customer.id)} disabled={processingId === (customer._id || customer.id)} className="p-1 text-green-500 hover:bg-green-50 rounded-lg transition disabled:opacity-50" title="Unblock">🔓</button>
                            ) : null}
                            <button onClick={() => deleteCustomer(customer._id || customer.id)} disabled={processingId === (customer._id || customer.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Showing {filteredCustomers.length} of {customers.length} customers</p>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-5 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">📋 Customer Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-500">Since {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>{selectedCustomer.status || 'active'}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">📞 Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs">Email</p><p className="font-medium text-gray-800 text-sm break-all">{selectedCustomer.email}</p></div>
                  <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium text-gray-800 text-sm">{selectedCustomer.phone || 'Not provided'}</p></div>
                  <div><p className="text-gray-500 text-xs">Customer ID</p><p className="font-mono text-sm text-gray-600">{selectedCustomer._id || selectedCustomer.id}</p></div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">📊 Order Statistics</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-pink-50 rounded-xl p-2 sm:p-3"><p className="text-xl sm:text-2xl font-bold text-pink-600">{selectedCustomer.orderCount || 0}</p><p className="text-[10px] sm:text-xs text-gray-500">Orders</p></div>
                  <div className="bg-green-50 rounded-xl p-2 sm:p-3"><p className="text-xl sm:text-2xl font-bold text-green-600">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</p><p className="text-[10px] sm:text-xs text-gray-500">Total Spent</p></div>
                  <div className="bg-blue-50 rounded-xl p-2 sm:p-3"><p className="text-xl sm:text-2xl font-bold text-blue-600">₹{selectedCustomer.orderCount ? Math.round((selectedCustomer.totalSpent || 0) / selectedCustomer.orderCount).toLocaleString() : 0}</p><p className="text-[10px] sm:text-xs text-gray-500">Avg Order</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <Link to={`/admin/orders?customer=${selectedCustomer.email}`} className="text-center bg-pink-500 text-white py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-pink-600 transition">View Orders</Link>
                <button onClick={() => { editCustomer(selectedCustomer); setShowDetailsModal(false); }} className="text-center bg-purple-500 text-white py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-purple-600 transition">Edit Profile</button>
                <button onClick={() => { resetPassword(selectedCustomer); setShowDetailsModal(false); }} className="text-center bg-yellow-500 text-white py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-yellow-600 transition">Reset Password</button>
                {(selectedCustomer.status === 'active' || selectedCustomer.status === 'approved') ? (
                  <button onClick={() => { blockCustomer(selectedCustomer._id || selectedCustomer.id); setShowDetailsModal(false); }} disabled={processingId === (selectedCustomer._id || selectedCustomer.id)} className="text-center bg-orange-500 text-white py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">Block</button>
                ) : (selectedCustomer.status === 'blocked' || selectedCustomer.status === 'suspended') ? (
                  <button onClick={() => { unblockCustomer(selectedCustomer._id || selectedCustomer.id); setShowDetailsModal(false); }} disabled={processingId === (selectedCustomer._id || selectedCustomer.id)} className="text-center bg-green-500 text-white py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">Unblock</button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowResetPasswordModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 p-4 sm:p-5 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">🔑 Reset Password</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-sm text-gray-600">Resetting password for: <span className="font-semibold text-pink-600">{selectedCustomer.name}</span></p>
              <p className="text-xs text-gray-500 break-all">Email: {selectedCustomer.email}</p>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="Min 6 characters" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="Confirm password" /></div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowResetPasswordModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleResetPassword} disabled={processingId === (selectedCustomer._id || selectedCustomer.id)} className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50">Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
