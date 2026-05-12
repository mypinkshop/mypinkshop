import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    const mockCustomers = [
      { id: 1, name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9988776655', orders: 5, totalSpent: 12500, status: 'active', joined: '2024-01-15' },
      { id: 2, name: 'Aditi Singh', email: 'aditi@gmail.com', phone: '9876543210', orders: 3, totalSpent: 8900, status: 'active', joined: '2024-02-10' },
      { id: 3, name: 'Neha Gupta', email: 'neha@gmail.com', phone: '9765432109', orders: 1, totalSpent: 899, status: 'blocked', joined: '2024-03-05' },
    ];
    setCustomers(mockCustomers);
    setLoading(false);
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
              <p className="text-gray-500 text-sm">Manage all registered customers</p>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <div className="relative">
              <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-center">Orders</th>
                  <th className="px-6 py-3 text-center">Total Spent</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{customer.name}</td>
                    <td className="px-6 py-4">{customer.email}</td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4 text-center">{customer.orders}</td>
                    <td className="px-6 py-4 text-center">₹{customer.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{customer.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminCustomers;
