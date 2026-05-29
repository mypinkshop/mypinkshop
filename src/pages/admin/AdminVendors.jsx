import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

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
    if (tab === 'approved') setActiveTab('approved');
    if (tab === 'blocked') setActiveTab('blocked');
  }, [location]);

  // Load vendors from localStorage (ONLY REAL DATA)
  const loadVendors = () => {
    const registeredVendors = localStorage.getItem('registeredVendors');
    let registeredList = registeredVendors ? JSON.parse(registeredVendors) : [];
    
    // ✅ Filter: Only vendors (role === 'vendor')
    registeredList = registeredList.filter(v => v.role === 'vendor');
    
    setVendors(registeredList);
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadVendors();
  }, [navigate]);

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
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'blocked': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Blocked</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // ✅ Click handlers for stats cards
  const handleStatsClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      navigate('/admin/vendors');
    } else {
      navigate(`/admin/vendors?tab=${tab}`);
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (activeTab !== 'all' && v.vendorStatus !== activeTab) return false;
    if (searchTerm && !v.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) && !v.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pendingCount = vendors.filter(v => v.vendorStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.vendorStatus === 'approved').length;
  const blockedCount = vendors.filter(v => v.vendorStatus === 'blocked').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendor data...</p>
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
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Vendor Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage seller accounts and applications</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by brand name or email..." 
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
          
          {/* Stats Cards - CLICKABLE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div 
              onClick={() => handleStatsClick('all')}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition hover:border-pink-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Vendors</p>
                <span className="text-lg">🏪</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{vendors.length}</p>
            </div>
            <div 
              onClick={() => handleStatsClick('approved')}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition hover:border-green-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Approved</p>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div 
              onClick={() => handleStatsClick('pending')}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition hover:border-yellow-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Pending</p>
                <span className="text-lg">⏳</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div 
              onClick={() => handleStatsClick('blocked')}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition hover:border-red-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Blocked</p>
                <span className="text-lg">🚫</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveTab('all')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All ({vendors.length})</button>
            <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Pending ({pendingCount})</button>
            <button onClick={() => setActiveTab('approved')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Approved ({approvedCount})</button>
            <button onClick={() => setActiveTab('blocked')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'blocked' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Blocked ({blockedCount})</button>
          </div>

          {/* Vendors Table - ONLY REAL DATA */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left">Vendor</th>
                    <th className="px-5 py-3 text-left">Contact</th>
                    <th className="px-5 py-3 text-center">Products</th>
                    <th className="px-5 py-3 text-right">Total Sales</th>
                    <th className="px-5 py-3 text-center">Joined</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVendors.length === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">🏪</div>
                        <p>No vendors found</p>
                        <p className="text-xs mt-1">Vendors will appear here after registration</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-pink-50/30 transition cursor-pointer" onClick={() => { setSelectedVendor(vendor); setShowDetails(true); }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-sm">
                              {vendor.brandName?.charAt(0).toUpperCase() || vendor.name?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{vendor.brandName || vendor.name}</p>
                              <p className="text-xs text-gray-400">ID: {vendor.id?.toString().slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-gray-600 text-sm">{vendor.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{vendor.phone}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="font-semibold text-gray-800">{vendor.productsCount || 0}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold text-green-600">
                            ₹{(vendor.totalSales || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-xs text-gray-500">
                            {vendor.joinedDate ? new Date(vendor.joinedDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getStatusBadge(vendor.vendorStatus)}
                        </td>
                        <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-2">
                            {vendor.vendorStatus === 'pending' && (
                              <>
                                <button onClick={() => approveVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Approve">✅</button>
                                <button onClick={() => rejectVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Reject">❌</button>
                              </>
                            )}
                            {vendor.vendorStatus === 'approved' && (
                              <button onClick={() => blockVendor(vendor.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Block">🔒</button>
                            )}
                            {vendor.vendorStatus === 'blocked' && (
                              <button onClick={() => unblockVendor(vendor.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Unblock">🔓</button>
                            )}
                            <button onClick={() => deleteVendor(vendor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>
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
            <p className="text-xs text-gray-400">Showing {filteredVendors.length} of {vendors.length} vendors</p>
          </div>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showDetails && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Vendor Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedVendor.brandName?.charAt(0).toUpperCase() || selectedVendor.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedVendor.brandName || selectedVendor.name}</h2>
                  <p className="text-xs text-gray-500">Vendor since {selectedVendor.joinedDate ? new Date(selectedVendor.joinedDate).toLocaleDateString() : 'N/A'}</p>
                  {getStatusBadge(selectedVendor.vendorStatus)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">📞 Contact Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Email</p><p className="font-medium text-gray-800">{selectedVendor.email}</p></div>
                  <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium text-gray-800">{selectedVendor.phone}</p></div>
                  <div><p className="text-gray-500 text-xs">GST Number</p><p className="font-medium text-gray-800">{selectedVendor.gstNumber || 'Not provided'}</p></div>
                  <div><p className="text-gray-500 text-xs">Commission</p><p className="font-medium text-gray-800">{selectedVendor.commission || 15}%</p></div>
                  <div className="col-span-2"><p className="text-gray-500 text-xs">Address</p><p className="font-medium text-gray-800">{selectedVendor.address || 'Not provided'}</p></div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">📊 Business Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-purple-600">{selectedVendor.productsCount || 0}</p>
                    <p className="text-xs text-gray-500">Total Products</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-green-600">₹{(selectedVendor.totalSales || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Sales</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex gap-3">
                {selectedVendor.vendorStatus === 'pending' && (
                  <>
                    <button onClick={() => { approveVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition">Approve</button>
                    <button onClick={() => { rejectVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">Reject</button>
                  </>
                )}
                {selectedVendor.vendorStatus === 'approved' && (
                  <button onClick={() => { blockVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition">Block Vendor</button>
                )}
                {selectedVendor.vendorStatus === 'blocked' && (
                  <button onClick={() => { unblockVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition">Unblock Vendor</button>
                )}
                <button onClick={() => { deleteVendor(selectedVendor.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
