import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    blockedCustomers: 0,
    totalOrders: 0,
    totalSpent: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadCustomerData();
  }, [navigate]);

  const loadCustomerData = () => {
    const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    
    // Calculate customer stats from orders
    const customersWithStats = allCustomers.map(customer => {
      const customerOrders = allOrders.filter(order => order.customerEmail === customer.email);
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
      const orderCount = customerOrders.length;
      const lastOrder = customerOrders.length > 0 ? customerOrders[0].date : null;
      
      return {
        ...customer,
        orders: orderCount,
        totalSpent: totalSpent,
        lastOrder: lastOrder,
        status: customer.status || 'active',
        joinedDate: customer.createdAt || new Date().toISOString()
      };
    });
    
    // Sort by join date (newest first)
    customersWithStats.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate));
    setCustomers(customersWithStats);
    
    // Calculate overall stats
    const activeCustomers = customersWithStats.filter(c => c.status === 'active').length;
    const blockedCustomers = customersWithStats.filter(c => c.status === 'blocked').length;
    const totalOrders = customersWithStats.reduce((sum, c) => sum + (c.orders || 0), 0);
    const totalSpent = customersWithStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    
    setStats({
      totalCustomers: customersWithStats.length,
      activeCustomers,
      blockedCustomers,
      totalOrders,
      totalSpent
    });
    
    setLoading(false);
  };

  const blockCustomer = (id) => {
    if (window.confirm('Are you sure you want to block this customer?')) {
      const updated = customers.map(c => c.id === id ? { ...c, status: 'blocked' } : c);
      setCustomers(updated);
      const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
      const updatedAll = allCustomers.map(c => c.id === id ? { ...c, status: 'blocked' } : c);
      localStorage.setItem('registeredCustomers', JSON.stringify(updatedAll));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeCustomers: prev.activeCustomers - 1,
        blockedCustomers: prev.blockedCustomers + 1
      }));
      
      alert('Customer blocked successfully');
    }
  };

  const unblockCustomer = (id) => {
    const updated = customers.map(c => c.id === id ? { ...c, status: 'active' } : c);
    setCustomers(updated);
    const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
    const updatedAll = allCustomers.map(c => c.id === id ? { ...c, status: 'active' } : c);
    localStorage.setItem('registeredCustomers', JSON.stringify(updatedAll));
    
    setStats(prev => ({
      ...prev,
      activeCustomers: prev.activeCustomers + 1,
      blockedCustomers: prev.blockedCustomers - 1
    }));
    
    alert('Customer unblocked successfully');
  };

  const deleteCustomer = (id) => {
    if (window.confirm('⚠️ Are you sure you want to permanently delete this customer? This action cannot be undone.')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
      const updatedAll = allCustomers.filter(c => c.id !== id);
      localStorage.setItem('registeredCustomers', JSON.stringify(updatedAll));
      
      setStats(prev => ({
        ...prev,
        totalCustomers: prev.totalCustomers - 1,
        activeCustomers: prev.activeCustomers - (customers.find(c => c.id === id)?.status === 'active' ? 1 : 0),
        blockedCustomers: prev.blockedCustomers - (customers.find(c => c.id === id)?.status === 'blocked' ? 1 : 0)
      }));
      
      alert('Customer deleted successfully');
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const filteredCustomers = customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(searchTerm)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 fixed top-0 right-0 left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Customer Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage and monitor customer accounts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by name, email or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 lg:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      <main className="ml-64 pt-20 p-4 sm:p-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Customers</p>
              <span className="text-lg">👥</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Active</p>
              <span className="text-lg">🟢</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Blocked</p>
              <span className="text-lg">🔴</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.blockedCustomers}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Orders</p>
              <span className="text-lg">📦</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Spent</p>
              <span className="text-lg">💰</span>
            </div>
            <p className="text-2xl font-bold text-pink-600">₹{stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Customers ({stats.totalCustomers})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'active'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Active ({stats.activeCustomers})
          </button>
          <button
            onClick={() => setFilterStatus('blocked')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'blocked'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Blocked ({stats.blockedCustomers})
          </button>
        </div>

        {/* Customers Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3 text-right">Total Spent</th>
                  <th className="px-5 py-3 text-center">Joined</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                      <div className="text-5xl mb-3">👥</div>
                      <p>No customers found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-pink-50/30 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold shadow-sm">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{customer.name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">ID: {customer.id}</p>
                          </div>
                        </div>
                       </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-600 text-sm">{customer.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{customer.phone || 'No phone'}</p>
                        </div>
                       </td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-semibold text-gray-800">{customer.orders || 0}</span>
                        {customer.lastOrder && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Last: {new Date(customer.lastOrder).toLocaleDateString()}
                          </p>
                        )}
                       </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-semibold text-pink-600">
                          ₹{(customer.totalSpent || 0).toLocaleString()}
                        </span>
                       </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs text-gray-500">
                          {new Date(customer.joinedDate).toLocaleDateString()}
                        </span>
                       </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status || 'active'}
                        </span>
                       </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => viewCustomerDetails(customer)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            👁️
                          </button>
                          {customer.status === 'active' ? (
                            <button
                              onClick={() => blockCustomer(customer.id)}
                              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                              title="Block Customer"
                            >
                              🔒
                            </button>
                          ) : (
                            <button
                              onClick={() => unblockCustomer(customer.id)}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                              title="Unblock Customer"
                            >
                              🔓
                            </button>
                          )}
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Customer"
                          >
                            🗑️
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      </main>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedCustomer.name || 'N/A'}</h2>
                  <p className="text-gray-500">Customer since {new Date(selectedCustomer.joinedDate).toLocaleDateString()}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                    {selectedCustomer.status || 'active'}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📞</span> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{selectedCustomer.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Order Statistics */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📊</span> Order Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-pink-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-pink-600">{selectedCustomer.orders || 0}</p>
                    <p className="text-xs text-gray-500">Total Orders</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-green-600">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{selectedCustomer.orders ? Math.round(selectedCustomer.totalSpent / selectedCustomer.orders).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-gray-500">Avg Order Value</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Link
                  to={`/admin/orders?customer=${selectedCustomer.email}`}
                  className="flex-1 text-center bg-pink-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition"
                >
                  View Orders
                </Link>
                {selectedCustomer.status === 'active' ? (
                  <button
                    onClick={() => { blockCustomer(selectedCustomer.id); setShowDetailsModal(false); }}
                    className="flex-1 text-center bg-orange-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition"
                  >
                    Block Customer
                  </button>
                ) : (
                  <button
                    onClick={() => { unblockCustomer(selectedCustomer.id); setShowDetailsModal(false); }}
                    className="flex-1 text-center bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition"
                  >
                    Unblock Customer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
