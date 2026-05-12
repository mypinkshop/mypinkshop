import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const navigate = useNavigate();

  // Check admin login
  const adminToken = localStorage.getItem('adminToken');
  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
  }, [adminToken, navigate]);

  // Mock vendor data
  const mockVendors = [
    { 
      id: 1, 
      brandName: 'Nykaa Beauty', 
      name: 'Nykaa Beauty',
      email: 'nykaa@mypinkshop.com', 
      phone: '9876543210', 
      vendorStatus: 'approved',
      productsCount: 24, 
      totalSales: 125000, 
      joinedDate: '2024-01-15',
      gstNumber: '22AAAAA0000A1Z',
      address: 'Mumbai, Maharashtra'
    },
    { 
      id: 2, 
      brandName: 'Mamaearth', 
      name: 'Mamaearth',
      email: 'mamaearth@mypinkshop.com', 
      phone: '9876543211', 
      vendorStatus: 'approved',
      productsCount: 18, 
      totalSales: 89000, 
      joinedDate: '2024-02-01',
      gstNumber: '22BBBBB0000B2Z',
      address: 'Gurgaon, Haryana'
    },
    { 
      id: 3, 
      brandName: 'Sugar Cosmetics', 
      name: 'Sugar Cosmetics',
      email: 'sugar@mypinkshop.com', 
      phone: '9876543212', 
      vendorStatus: 'pending',
      productsCount: 0, 
      totalSales: 0, 
      joinedDate: '2024-05-10',
      gstNumber: '22CCCCC0000C3Z',
      address: 'Bangalore, Karnataka'
    },
    { 
      id: 4, 
      brandName: 'Plum Beauty', 
      name: 'Plum Beauty',
      email: 'plum@mypinkshop.com', 
      phone: '9876543213', 
      vendorStatus: 'pending',
      productsCount: 0, 
      totalSales: 0, 
      joinedDate: '2024-05-12',
      gstNumber: '22DDDDD0000D4Z',
      address: 'Pune, Maharashtra'
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setVendors(mockVendors);
      setLoading(false);
    }, 500);
  }, []);

  const approveVendor = (vendorId) => {
    setVendors(vendors.map(vendor => 
      vendor.id === vendorId ? { ...vendor, vendorStatus: 'approved' } : vendor
    ));
    alert('✅ Vendor approved successfully! They can now login.');
  };

  const rejectVendor = (vendorId) => {
    if (window.confirm('Are you sure you want to reject this vendor application?')) {
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, vendorStatus: 'rejected' } : vendor
      ));
      alert('❌ Vendor application rejected.');
    }
  };

  const blockVendor = (vendorId) => {
    if (window.confirm('Are you sure you want to block this vendor?')) {
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, vendorStatus: 'blocked' } : vendor
      ));
      alert('🔒 Vendor blocked successfully.');
    }
  };

  const deleteVendor = (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor permanently?')) {
      setVendors(vendors.filter(vendor => vendor.id !== vendorId));
      alert('🗑️ Vendor deleted successfully.');
    }
  };

  const viewVendorDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'blocked': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending Approval';
      case 'rejected': return 'Rejected';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    if (activeTab === 'all') return true;
    return vendor.vendorStatus === activeTab;
  });

  const pendingCount = vendors.filter(v => v.vendorStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.vendorStatus === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1>
            <span className="text-xs text-gray-400">| Vendor Management</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('admin');
              navigate('/admin/login');
            }}
            className="text-red-500 hover:text-red-600 text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage vendor registrations and approvals</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
              ⏳ Pending: {pendingCount}
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              ✅ Approved: {approvedCount}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === 'all' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === 'pending' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === 'approved' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-gray-600">Brand Name</th>
                  <th className="px-6 py-3 text-left text-gray-600">Contact Email</th>
                  <th className="px-6 py-3 text-left text-gray-600">Phone</th>
                  <th className="px-6 py-3 text-left text-gray-600">Products</th>
                  <th className="px-6 py-3 text-left text-gray-600">Total Sales</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Joined</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{vendor.brandName}</p>
                        <p className="text-xs text-gray-400">GST: {vendor.gstNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vendor.email}</td>
                    <td className="px-6 py-4 text-gray-600">{vendor.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{vendor.productsCount}</td>
                    <td className="px-6 py-4 text-gray-600">₹{vendor.totalSales.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.vendorStatus)}`}>
                        {getStatusText(vendor.vendorStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(vendor.joinedDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewVendorDetails(vendor)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {vendor.vendorStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => approveVendor(vendor.id)}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => rejectVendor(vendor.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {vendor.vendorStatus === 'approved' && (
                          <button
                            onClick={() => blockVendor(vendor.id)}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                            title="Block"
                          >
                            🔒
                          </button>
                        )}
                        <button
                          onClick={() => deleteVendor(vendor.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredVendors.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 mt-4">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500">No vendors found in {activeTab} list.</p>
          </div>
        )}
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Vendor Details</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Brand Name</p>
                  <p className="font-medium">{selectedVendor.brandName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedVendor.vendorStatus)}`}>
                    {getStatusText(selectedVendor.vendorStatus)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm">{selectedVendor.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">GST Number</p>
                  <p className="text-sm">{selectedVendor.gstNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Joined Date</p>
                  <p className="text-sm">{new Date(selectedVendor.joinedDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm">{selectedVendor.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Products</p>
                  <p className="text-sm">{selectedVendor.productsCount}</p>
                </div>
              </div>

              {selectedVendor.vendorStatus === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      approveVendor(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    ✅ Approve Vendor
                  </button>
                  <button
                    onClick={() => {
                      rejectVendor(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
