import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Mock customers data
    const mockCustomers = [
      { id: 1, name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9988776655', orders: 5, totalSpent: 12500, status: 'active', joined: '2024-01-15', address: 'Mumbai, Maharashtra' },
      { id: 2, name: 'Aditi Singh', email: 'aditi@gmail.com', phone: '9876543210', orders: 3, totalSpent: 8900, status: 'active', joined: '2024-02-10', address: 'Bangalore, Karnataka' },
      { id: 3, name: 'Neha Gupta', email: 'neha@gmail.com', phone: '9765432109', orders: 1, totalSpent: 899, status: 'blocked', joined: '2024-03-05', address: 'Pune, Maharashtra' },
      { id: 4, name: 'Riya Mehta', email: 'riya@gmail.com', phone: '9654321098', orders: 8, totalSpent: 25400, status: 'active', joined: '2024-01-20', address: 'Delhi, NCR' },
      { id: 5, name: 'Anjali Verma', email: 'anjali@gmail.com', phone: '9543210987', orders: 2, totalSpent: 3200, status: 'active', joined: '2024-02-25', address: 'Kolkata, West Bengal' },
      { id: 6, name: 'Sneha Reddy', email: 'sneha@gmail.com', phone: '9432109876', orders: 0, totalSpent: 0, status: 'inactive', joined: '2024-04-01', address: 'Hyderabad, Telangana' },
    ];
    setCustomers(mockCustomers);
    setLoading(false);
  }, []);

  const blockCustomer = (id) => {
    if (confirm('Block this customer? They will not be able to place orders.')) {
      setCustomers(customers.map(c => c.id === id ? { ...c, status: 'blocked' } : c));
      alert('Customer blocked successfully');
    }
  };

  const activateCustomer = (id) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, status: 'active' } : c));
    alert('Customer activated successfully');
  };

  const deleteCustomer = (id) => {
    if (confirm('Delete this customer permanently? This action cannot be undone.')) {
      setCustomers(customers.filter(c => c.id !== id));
      alert('Customer deleted');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
      case 'blocked': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Blocked</span>;
      case 'inactive': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">←</button>
          <h1 className="text-xl font-semibold text-gray-800">Customer Management</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Customers</p><p className="text-2xl font-semibold">{customers.length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-semibold text-green-600">{customers.filter(c => c.status === 'active').length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Blocked</p><p className="text-2xl font-semibold text-red-600">{customers.filter(c => c.status === 'blocked').length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Spent</p><p className="text-2xl font-semibold">₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</p></div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-3">
              <div className="relative">
                <input type="text" placeholder="Search by name or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                  <th className="px-4 py-3 text-center">Joined</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setShowDetails(true); }}>
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3 text-center">{customer.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{customer.totalSpent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{new Date(customer.joined).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(customer.status)}</td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        {customer.status === 'active' ? (
                          <button onClick={() => blockCustomer(customer.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Block">🔒</button>
                        ) : customer.status === 'blocked' ? (
                          <button onClick={() => activateCustomer(customer.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Activate">✅</button>
                        ) : null}
                        <button onClick={() => deleteCustomer(customer.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center"><p className="text-gray-500">No customers found</p></div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Customer Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Name</p><p className="font-medium">{selectedCustomer.name}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="font-medium">{selectedCustomer.email}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium">{selectedCustomer.phone}</p></div>
                <div><p className="text-xs text-gray-400">Address</p><p className="font-medium">{selectedCustomer.address}</p></div>
                <div><p className="text-xs text-gray-400">Joined</p><p className="font-medium">{new Date(selectedCustomer.joined).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-400">Status</p><p className="font-medium capitalize">{selectedCustomer.status}</p></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-400">Total Orders</p>
                <p className="text-xl font-bold">{selectedCustomer.orders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Spent</p>
                <p className="text-xl font-bold text-pink-600">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
              </div>
              <div className="pt-4 border-t flex gap-3">
                {selectedCustomer.status === 'active' ? (
                  <button onClick={() => { blockCustomer(selectedCustomer.id); setShowDetails(false); }} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">Block Customer</button>
                ) : (
                  <button onClick={() => { activateCustomer(selectedCustomer.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Activate Customer</button>
                )}
                <button onClick={() => { deleteCustomer(selectedCustomer.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
