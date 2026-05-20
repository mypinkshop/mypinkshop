import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    brandName: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    commission: 15,
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    
    const mockVendors = [
      { id: 1, brandName: 'Nykaa Beauty', email: 'nykaa@mypinkshop.com', phone: '9876543210', status: 'approved', productsCount: 24, totalSales: 1250000, joinedDate: '2024-01-15', gstNumber: '22AAAAA0000A1Z', address: 'Mumbai, Maharashtra', commission: 15 },
      { id: 2, brandName: 'Mamaearth', email: 'mamaearth@mypinkshop.com', phone: '9876543211', status: 'approved', productsCount: 18, totalSales: 890000, joinedDate: '2024-02-01', gstNumber: '22BBBBB0000B2Z', address: 'Gurgaon, Haryana', commission: 15 },
      { id: 3, brandName: 'Sugar Cosmetics', email: 'sugar@mypinkshop.com', phone: '9876543212', status: 'pending', productsCount: 0, totalSales: 0, joinedDate: '2024-05-10', gstNumber: '22CCCCC0000C3Z', address: 'Bangalore, Karnataka', commission: 15 },
      { id: 4, brandName: 'Plum Beauty', email: 'plum@mypinkshop.com', phone: '9876543213', status: 'pending', productsCount: 0, totalSales: 0, joinedDate: '2024-05-12', gstNumber: '22DDDDD0000D4Z', address: 'Pune, Maharashtra', commission: 15 },
    ];
    setVendors(mockVendors);
    setLoading(false);
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addVendor = () => {
    if (!formData.brandName || !formData.email) {
      alert('Please fill brand name and email');
      return;
    }
    const newVendor = {
      id: Date.now(),
      ...formData,
      status: 'pending',
      productsCount: 0,
      totalSales: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setVendors([...vendors, newVendor]);
    setShowAddModal(false);
    setFormData({ brandName: '', email: '', phone: '', gstNumber: '', address: '', commission: 15 });
    alert('Vendor added successfully!');
  };

  const editVendor = () => {
    setVendors(vendors.map(v => v.id === selectedVendor.id ? { ...v, ...formData } : v));
    setShowEditModal(false);
    setSelectedVendor(null);
    setFormData({ brandName: '', email: '', phone: '', gstNumber: '', address: '', commission: 15 });
    alert('Vendor updated successfully!');
  };

  const openEditModal = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      brandName: vendor.brandName,
      email: vendor.email,
      phone: vendor.phone || '',
      gstNumber: vendor.gstNumber || '',
      address: vendor.address || '',
      commission: vendor.commission || 15,
    });
    setShowEditModal(true);
  };

  const approveVendor = (id) => {
    setVendors(vendors.map(v => v.id === id ? { ...v, status: 'approved' } : v));
    alert('Vendor approved!');
  };

  const rejectVendor = (id) => {
    if (confirm('Reject this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
      alert('Vendor rejected');
    }
  };

  const blockVendor = (id) => {
    if (confirm('Block this vendor?')) {
      setVendors(vendors.map(v => v.id === id ? { ...v, status: 'blocked' } : v));
      alert('Vendor blocked');
    }
  };

  const deleteVendor = (id) => {
    if (confirm('Delete this vendor permanently?')) {
      setVendors(vendors.filter(v => v.id !== id));
      alert('Vendor deleted');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (activeTab !== 'all' && v.status !== activeTab) return false;
    if (searchTerm && !v.brandName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
              <p className="text-gray-500 text-sm">Manage all marketplace sellers</p>
            </div>
            <button
              onClick={() => { setFormData({ brandName: '', email: '', phone: '', gstNumber: '', address: '', commission: 15 }); setShowAddModal(true); }}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Vendor
            </button>
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>All ({vendors.length})</button>
              <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'approved' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Approved ({vendors.filter(v => v.status === 'approved').length})</button>
              <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'pending' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pending ({vendors.filter(v => v.status === 'pending').length})</button>
            </div>
            <div className="relative">
              <input type="text" placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-6 py-3 text-left">Brand Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-center">Products</th>
                  <th className="px-6 py-3 text-center">Total Sales</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{vendor.brandName}</td>
                    <td className="px-6 py-4">{vendor.email}</td>
                    <td className="px-6 py-4 text-center">{vendor.productsCount}</td>
                    <td className="px-6 py-4 text-center">₹{vendor.totalSales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>{vendor.status}</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(vendor)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Edit">✏️</button>
                        {vendor.status === 'pending' && <button onClick={() => approveVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Approve">✅</button>}
                        {vendor.status === 'pending' && <button onClick={() => rejectVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject">❌</button>}
                        {vendor.status === 'approved' && <button onClick={() => blockVendor(vendor.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Block">🔒</button>}
                        <button onClick={() => deleteVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Add New Vendor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addVendor(); }} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Brand Name *</label><input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">GST Number</label><input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Address</label><textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Commission (%)</label><input type="number" name="commission" value={formData.commission} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">Add Vendor</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Edit Vendor</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); editVendor(); }} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Brand Name</label><input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">GST Number</label><input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Address</label><textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Commission (%)</label><input type="number" name="commission" value={formData.commission} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">Update Vendor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
