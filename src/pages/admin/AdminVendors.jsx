import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AdminVendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Get tab from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'pending') setActiveTab('pending');
  }, [location]);

  // Load vendors from localStorage
  const loadVendors = () => {
    const registeredVendors = localStorage.getItem('registeredVendors');
    let registeredList = registeredVendors ? JSON.parse(registeredVendors) : [];
    
    if (registeredList.length === 0) {
      registeredList = [
        { id: 1, brandName: 'Nykaa Beauty', email: 'nykaa@mypinkshop.com', phone: '9876543210', vendorStatus: 'approved', productsCount: 24, totalSales: 1250000, joinedDate: '2024-01-15', gstNumber: '22AAAAA0000A1Z', address: 'Mumbai, Maharashtra', commission: 15 },
        { id: 2, brandName: 'Mamaearth', email: 'mamaearth@mypinkshop.com', phone: '9876543211', vendorStatus: 'approved', productsCount: 18, totalSales: 890000, joinedDate: '2024-02-01', gstNumber: '22BBBBB0000B2Z', address: 'Gurgaon, Haryana', commission: 15 },
      ];
      localStorage.setItem('registeredVendors', JSON.stringify(registeredList));
    }
    
    setVendors(registeredList);
    setLoading(false);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const approveVendor = (vendorId) => {
    const updatedVendors = vendors.map(v => v.id === vendorId ? { ...v, vendorStatus: 'approved' } : v);
    setVendors(updatedVendors);
    localStorage.setItem('registeredVendors', JSON.stringify(updatedVendors));
    alert('✅ Vendor approved successfully!');
  };

  const rejectVendor = (vendorId) => {
    if (confirm('Reject this vendor application?')) {
      const updatedVendors = vendors.filter(v => v.id !== vendorId);
      setVendors(updatedVendors);
      localStorage.setItem('registeredVendors', JSON.stringify(updatedVendors));
      alert('❌ Vendor application rejected.');
    }
  };

  const blockVendor = (vendorId) => {
    if (confirm('Block this vendor?')) {
      const updatedVendors = vendors.map(v => v.id === vendorId ? { ...v, vendorStatus: 'blocked' } : v);
      setVendors(updatedVendors);
      localStorage.setItem('registeredVendors', JSON.stringify(updatedVendors));
      alert('🔒 Vendor blocked.');
    }
  };

  const unblockVendor = (vendorId) => {
    const updatedVendors = vendors.map(v => v.id === vendorId ? { ...v, vendorStatus: 'approved' } : v);
    setVendors(updatedVendors);
    localStorage.setItem('registeredVendors', JSON.stringify(updatedVendors));
    alert('🔓 Vendor unblocked.');
  };

  const deleteVendor = (vendorId) => {
    if (confirm('Delete this vendor permanently?')) {
      const updatedVendors = vendors.filter(v => v.id !== vendorId);
      setVendors(updatedVendors);
      localStorage.setItem('registeredVendors', JSON.stringify(updatedVendors));
      alert('🗑️ Vendor deleted.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Approved</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span>;
      case 'blocked': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Blocked</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (activeTab !== 'all' && v.vendorStatus !== activeTab) return false;
    if (searchTerm && !v.brandName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pendingCount = vendors.filter(v => v.vendorStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.vendorStatus === 'approved').length;
  const blockedCount = vendors.filter(v => v.vendorStatus === 'blocked').length;

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
          <h1 className="text-xl font-semibold text-gray-800">Vendor Management</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Vendors</p>
            <p className="text-2xl font-semibold">{vendors.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-2xl font-semibold text-green-600">{approvedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Blocked</p>
            <p className="text-2xl font-semibold text-red-600">{blockedCount}</p>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({vendors.length})</button>
              <button onClick={() => setActiveTab('pending')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'pending' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending ({pendingCount})</button>
              <button onClick={() => setActiveTab('approved')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'approved' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Approved ({approvedCount})</button>
              <button onClick={() => setActiveTab('blocked')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'blocked' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Blocked ({blockedCount})</button>
            </div>
            <div className="relative">
              <input type="text" placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Brand Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-center">Products</th>
                  <th className="px-4 py-3 text-right">Total Sales</th>
                  <th className="px-4 py-3 text-center">Joined</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedVendor(vendor); setShowDetails(true); }}>
                    <td className="px-4 py-3 font-medium">{vendor.brandName}</td>
                    <td className="px-4 py-3">{vendor.email}</td>
                    <td className="px-4 py-3">{vendor.phone}</td>
                    <td className="px-4 py-3 text-center">{vendor.productsCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{vendor.totalSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{new Date(vendor.joinedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(vendor.vendorStatus)}</td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        {vendor.vendorStatus === 'pending' && (
                          <>
                            <button onClick={() => approveVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Approve">✅</button>
                            <button onClick={() => rejectVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject">❌</button>
                          </>
                        )}
                        {vendor.vendorStatus === 'approved' && (
                          <button onClick={() => blockVendor(vendor.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Block">🔒</button>
                        )}
                        {vendor.vendorStatus === 'blocked' && (
                          <button onClick={() => unblockVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Unblock">✅</button>
                        )}
                        <button onClick={() => deleteVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVendors.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No vendors found</p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showDetails && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{selectedVendor.brandName}</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Email</p><p className="font-medium">{selectedVendor.email}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium">{selectedVendor.phone}</p></div>
                <div><p className="text-xs text-gray-400">GST Number</p><p className="font-medium">{selectedVendor.gstNumber}</p></div>
                <div><p className="text-xs text-gray-400">Commission</p><p className="font-medium">{selectedVendor.commission}%</p></div>
                <div><p className="text-xs text-gray-400">Address</p><p className="font-medium">{selectedVendor.address}</p></div>
                <div><p className="text-xs text-gray-400">Joined</p><p className="font-medium">{new Date(selectedVendor.joinedDate).toLocaleDateString()}</p></div>
              </div>
              <div className="pt-4 border-t grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Total Products</p><p className="text-xl font-bold">{selectedVendor.productsCount}</p></div>
                <div><p className="text-xs text-gray-400">Total Sales</p><p className="text-xl font-bold text-green-600">₹{selectedVendor.totalSales.toLocaleString()}</p></div>
              </div>
              <div className="pt-4 border-t flex gap-3">
                {selectedVendor.vendorStatus === 'pending' && (
                  <>
                    <button onClick={() => { approveVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg">Approve</button>
                    <button onClick={() => { rejectVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg">Reject</button>
                  </>
                )}
                {selectedVendor.vendorStatus === 'approved' && (
                  <button onClick={() => { blockVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-orange-500 text-white py-2 rounded-lg">Block</button>
                )}
                {selectedVendor.vendorStatus === 'blocked' && (
                  <button onClick={() => { unblockVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg">Unblock</button>
                )}
                <button onClick={() => { deleteVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
