import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminVendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  // Get tab from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'pending') setActiveTab('pending');
    if (tab === 'approved') setActiveTab('approved');
    if (tab === 'blocked') setActiveTab('blocked');
  }, [location]);

  // ✅ Load vendors from backend API
  const loadVendors = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/admin/vendors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(data.vendors || []);
      } else {
        setError(data.message || 'Failed to load vendors');
        toast.error(data.message || 'Failed to load vendors');
      }
    } catch (err) {
      console.error('Error loading vendors:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadVendors();
  }, [navigate]);

  // ✅ Approve vendor
  const approveVendor = async (vendorId) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(vendorId);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${vendorId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(vendors.map(v => 
          v._id === vendorId ? { ...v, status: 'approved', vendorStatus: 'approved' } : v
        ));
        toast.success('✅ Vendor approved successfully!');
        if (showDetails) setShowDetails(false);
      } else {
        toast.error(data.message || 'Failed to approve vendor');
      }
    } catch (err) {
      console.error('Error approving vendor:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Reject vendor
  const rejectVendor = async (vendorId) => {
    if (!window.confirm('Reject this vendor application?')) return;
    
    const token = localStorage.getItem('adminToken');
    setProcessingId(vendorId);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${vendorId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(vendors.map(v => 
          v._id === vendorId ? { ...v, status: 'rejected', vendorStatus: 'rejected' } : v
        ));
        toast.success('❌ Vendor rejected successfully!');
        if (showDetails) setShowDetails(false);
      } else {
        toast.error(data.message || 'Failed to reject vendor');
      }
    } catch (err) {
      console.error('Error rejecting vendor:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Block vendor
  const blockVendor = async (vendorId) => {
    if (!window.confirm('Block this vendor?')) return;
    
    const token = localStorage.getItem('adminToken');
    setProcessingId(vendorId);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${vendorId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(vendors.map(v => 
          v._id === vendorId ? { ...v, status: 'suspended', vendorStatus: 'suspended' } : v
        ));
        toast.success('🔒 Vendor blocked successfully!');
        if (showDetails) setShowDetails(false);
      } else {
        toast.error(data.message || 'Failed to block vendor');
      }
    } catch (err) {
      console.error('Error blocking vendor:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Unblock vendor
  const unblockVendor = async (vendorId) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(vendorId);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${vendorId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(vendors.map(v => 
          v._id === vendorId ? { ...v, status: 'approved', vendorStatus: 'approved' } : v
        ));
        toast.success('🔓 Vendor unblocked successfully!');
        if (showDetails) setShowDetails(false);
      } else {
        toast.error(data.message || 'Failed to unblock vendor');
      }
    } catch (err) {
      console.error('Error unblocking vendor:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Delete vendor
  const deleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor permanently?')) return;
    
    const token = localStorage.getItem('adminToken');
    setProcessingId(vendorId);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVendors(vendors.filter(v => v._id !== vendorId));
        toast.success('🗑️ Vendor deleted successfully!');
        if (showDetails) setShowDetails(false);
      } else {
        toast.error(data.message || 'Failed to delete vendor');
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Approved</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">⏳ Pending</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ Rejected</span>;
      case 'suspended': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">🔒 Suspended</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleStatsClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      navigate('/admin/vendors');
    } else {
      navigate(`/admin/vendors?tab=${tab}`);
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (activeTab !== 'all' && v.status !== activeTab && v.vendorStatus !== activeTab) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const brand = (v.brandName || v.name || '').toLowerCase();
      const email = (v.email || '').toLowerCase();
      if (!brand.includes(search) && !email.includes(search)) return false;
    }
    return true;
  });

  const pendingCount = vendors.filter(v => v.status === 'pending' || v.vendorStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.status === 'approved' || v.vendorStatus === 'approved').length;
  const suspendedCount = vendors.filter(v => v.status === 'suspended' || v.vendorStatus === 'suspended').length;
  const rejectedCount = vendors.filter(v => v.status === 'rejected' || v.vendorStatus === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">🏪 Vendor Management</h1>
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
          
          {/* Stats Cards */}
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
              onClick={() => handleStatsClick('suspended')}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition hover:border-red-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Suspended</p>
                <span className="text-lg">🚫</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{suspendedCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveTab('all')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All ({vendors.length})</button>
            <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Pending ({pendingCount})</button>
            <button onClick={() => setActiveTab('approved')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Approved ({approvedCount})</button>
            <button onClick={() => setActiveTab('suspended')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'suspended' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Suspended ({suspendedCount})</button>
            <button onClick={() => setActiveTab('rejected')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'rejected' ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>Rejected ({rejectedCount})</button>
          </div>

          {/* Vendors Table */}
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
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">🏪</div>
                        <p>No vendors found</p>
                        <p className="text-xs mt-1">Vendors will appear here after registration</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-pink-50/30 transition cursor-pointer" onClick={() => { setSelectedVendor(vendor); setShowDetails(true); }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-sm">
                              {vendor.brandName?.charAt(0).toUpperCase() || vendor.name?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{vendor.brandName || vendor.name}</p>
                              <p className="text-xs text-gray-400">ID: {vendor._id?.slice(-6) || vendor.storeId?.slice(-6) || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-gray-600 text-sm">{vendor.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{vendor.phone || 'N/A'}</p>
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
                            {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getStatusBadge(vendor.status || vendor.vendorStatus)}
                        </td>
                        <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-2">
                            {(vendor.status === 'pending' || vendor.vendorStatus === 'pending') && (
                              <>
                                <button 
                                  onClick={() => approveVendor(vendor._id)} 
                                  disabled={processingId === vendor._id}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition disabled:opacity-50" 
                                  title="Approve"
                                >
                                  ✅
                                </button>
                                <button 
                                  onClick={() => rejectVendor(vendor._id)} 
                                  disabled={processingId === vendor._id}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" 
                                  title="Reject"
                                >
                                  ❌
                                </button>
                              </>
                            )}
                            {(vendor.status === 'approved' || vendor.vendorStatus === 'approved') && (
                              <button 
                                onClick={() => blockVendor(vendor._id)} 
                                disabled={processingId === vendor._id}
                                className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-50" 
                                title="Block"
                              >
                                🔒
                              </button>
                            )}
                            {(vendor.status === 'suspended' || vendor.vendorStatus === 'suspended') && (
                              <button 
                                onClick={() => unblockVendor(vendor._id)} 
                                disabled={processingId === vendor._id}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition disabled:opacity-50" 
                                title="Unblock"
                              >
                                🔓
                              </button>
                            )}
                            <button 
                              onClick={() => deleteVendor(vendor._id)} 
                              disabled={processingId === vendor._id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" 
                              title="Delete"
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

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Showing {filteredVendors.length} of {vendors.length} vendors</p>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Vendor Details Modal with proper address display */}
      {showDetails && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">📋 Vendor Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedVendor.brandName?.charAt(0).toUpperCase() || selectedVendor.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedVendor.brandName || selectedVendor.name}</h2>
                  <p className="text-xs text-gray-500">Vendor since {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleDateString() : 'N/A'}</p>
                  {getStatusBadge(selectedVendor.status || selectedVendor.vendorStatus)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">📞 Contact Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Email</p><p className="font-medium text-gray-800">{selectedVendor.email}</p></div>
                  <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium text-gray-800">{selectedVendor.phone || 'N/A'}</p></div>
                  <div><p className="text-gray-500 text-xs">GST Number</p><p className="font-medium text-gray-800">{selectedVendor.gstNumber || 'Not provided'}</p></div>
                  <div><p className="text-gray-500 text-xs">Store ID</p><p className="font-medium text-gray-800">{selectedVendor.storeId || 'N/A'}</p></div>
                  
                  {/* ✅ FIXED: Address Display - No object render */}
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Address</p>
                    {selectedVendor.address ? (
                      <div className="font-medium text-gray-800 text-sm space-y-0.5">
                        <p>{selectedVendor.address.street || ''}</p>
                        <p>
                          {selectedVendor.address.city || ''} 
                          {selectedVendor.address.city && selectedVendor.address.state ? ', ' : ''}
                          {selectedVendor.address.state || ''}
                        </p>
                        <p>{selectedVendor.address.pincode || ''}</p>
                        <p>{selectedVendor.address.country || 'India'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Not provided</p>
                    )}
                  </div>
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
                {(selectedVendor.status === 'pending' || selectedVendor.vendorStatus === 'pending') && (
                  <>
                    <button 
                      onClick={() => { approveVendor(selectedVendor._id); }} 
                      disabled={processingId === selectedVendor._id}
                      className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => { rejectVendor(selectedVendor._id); }} 
                      disabled={processingId === selectedVendor._id}
                      className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {(selectedVendor.status === 'approved' || selectedVendor.vendorStatus === 'approved') && (
                  <button 
                    onClick={() => { blockVendor(selectedVendor._id); }} 
                    disabled={processingId === selectedVendor._id}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    🔒 Block
                  </button>
                )}
                {(selectedVendor.status === 'suspended' || selectedVendor.vendorStatus === 'suspended') && (
                  <button 
                    onClick={() => { unblockVendor(selectedVendor._id); }} 
                    disabled={processingId === selectedVendor._id}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                  >
                    🔓 Unblock
                  </button>
                )}
                <button 
                  onClick={() => { deleteVendor(selectedVendor._id); }} 
                  disabled={processingId === selectedVendor._id}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
