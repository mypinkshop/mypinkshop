import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
    setCustomers(allCustomers);
    setLoading(false);
  }, [navigate]);

  const blockCustomer = (id) => {
    if (window.confirm('Block this customer?')) {
      const updated = customers.map(c => c.id === id ? { ...c, status: 'blocked' } : c);
      setCustomers(updated);
      localStorage.setItem('registeredCustomers', JSON.stringify(updated));
      alert('Customer blocked');
    }
  };

  const unblockCustomer = (id) => {
    const updated = customers.map(c => c.id === id ? { ...c, status: 'active' } : c);
    setCustomers(updated);
    localStorage.setItem('registeredCustomers', JSON.stringify(updated));
    alert('Customer unblocked');
  };

  const filteredCustomers = customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm && !c.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="bg-white border-b border-gray-200 px-6 py-3 fixed top-0 right-0 left-64 z-40"><h1 className="text-xl font-semibold text-gray-800">Customer Management</h1></div>
      <main className="ml-64 pt-16 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2"><button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>All</button><button onClick={() => setFilterStatus('active')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'active' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Active</button><button onClick={() => setFilterStatus('blocked')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'blocked' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Blocked</button></div>
          <div className="relative"><input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-center">Orders</th><th className="px-4 py-3 text-right">Total Spent</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y">{filteredCustomers.map(customer => (<tr key={customer.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{customer.name}</td><td className="px-4 py-3">{customer.email}</td><td className="px-4 py-3">{customer.phone || '-'}</td><td className="px-4 py-3 text-center">{customer.orders || 0}</td><td className="px-4 py-3 text-right">₹{(customer.totalSpent || 0).toLocaleString()}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{customer.status}</span></td><td className="px-4 py-3 text-center">{customer.status === 'active' ? <button onClick={() => blockCustomer(customer.id)} className="text-orange-500 hover:text-orange-700">Block</button> : <button onClick={() => unblockCustomer(customer.id)} className="text-green-500 hover:text-green-700">Unblock</button>}</td></tr>))}</tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default AdminCustomers;
