import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    const mockVendors = [
      { id: 1, brandName: 'Nykaa Beauty', email: 'nykaa@mypinkshop.com', phone: '9876543210', vendorStatus: 'approved', productsCount: 24, totalSales: 125000, joinedDate: '2024-01-15', gstNumber: '22AAAAA0000A1Z', address: 'Mumbai, Maharashtra' },
      { id: 2, brandName: 'Mamaearth', email: 'mamaearth@mypinkshop.com', phone: '9876543211', vendorStatus: 'approved', productsCount: 18, totalSales: 89000, joinedDate: '2024-02-01', gstNumber: '22BBBBB0000B2Z', address: 'Gurgaon, Haryana' },
      { id: 3, brandName: 'Sugar Cosmetics', email: 'sugar@mypinkshop.com', phone: '9876543212', vendorStatus: 'pending', productsCount: 0, totalSales: 0, joinedDate: '2024-05-10', gstNumber: '22CCCCC0000C3Z', address: 'Bangalore, Karnataka' },
      { id: 4, brandName: 'Plum Beauty', email: 'plum@mypinkshop.com', phone: '9876543213', vendorStatus: 'pending', productsCount: 0, totalSales: 0, joinedDate: '2024-05-12', gstNumber: '22DDDDD0000D4Z', address: 'Pune, Maharashtra' },
    ];
    setVendors(mockVendors);
    setLoading(false);
  }, [token, navigate]);

  const approveVendor = (vendorId) => { setVendors(vendors.map(v => v.id === vendorId ? { ...v, vendorStatus: 'approved' } : v)); alert('✅ Vendor approved!'); };
  const rejectVendor = (vendorId) => { if (confirm('Reject this vendor?')) { setVendors(vendors.filter(v => v.id !== vendorId)); alert('❌ Vendor rejected'); } };
  const deleteVendor = (vendorId) => { if (confirm('Delete this vendor?')) { setVendors(vendors.filter(v => v.id !== vendorId)); alert('🗑️ Vendor deleted'); } };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredVendors = vendors.filter(v => activeTab === 'all' ? true : v.vendorStatus === activeTab);
  const pendingCount = vendors.filter(v => v.vendorStatus === 'pending').length;

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-pink-500 transition"><span className="text-xl">←</span><span className="text-sm">Back</span></button>
            <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition"><div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div><h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1></Link>
          </div>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500 text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1><p className="text-gray-500 text-sm">Manage vendor registrations and approvals</p></div><div className="flex gap-3"><div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">⏳ Pending: {pendingCount}</div><div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">✅ Approved: {vendors.filter(v => v.vendorStatus === 'approved').length}</div></div></div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'all' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>All Vendors ({vendors.length})</button>
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'pending' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Pending ({pendingCount})</button>
          <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'approved' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Approved ({vendors.filter(v => v.vendorStatus === 'approved').length})</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="border-b"><th className="px-6 py-3 text-left">Brand Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Products</th><th className="px-6 py-3 text-left">Total Sales</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filteredVendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><p className="font-medium">{vendor.brandName}</p><p className="text-xs text-gray-400">GST: {vendor.gstNumber}</p></td>
                  <td className="px-6 py-4">{vendor.email}</td>
                  <td className="px-6 py-4">{vendor.productsCount}</td>
                  <td className="px-6 py-4">₹{vendor.totalSales.toLocaleString()}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.vendorStatus)}`}>{vendor.vendorStatus === 'approved' ? 'Approved' : 'Pending'}</span></td>
                  <td className="px-6 py-4"><div className="flex gap-2">
                    {vendor.vendorStatus === 'pending' && <><button onClick={() => approveVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Approve">✅</button><button onClick={() => rejectVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject">❌</button></>}
                    <button onClick={() => deleteVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminVendors;
