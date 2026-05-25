import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminBrandApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const pendingBrands = JSON.parse(localStorage.getItem('pendingBrandApplications') || '[]');
    setApplications(pendingBrands);
    setLoading(false);
  }, [navigate]);

  const approveBrand = (appId) => {
    const updatedApps = applications.map(app => 
      app.id === appId ? { ...app, status: 'approved', adminRemarks: remarks, approvedDate: new Date().toISOString().split('T')[0] } : app
    );
    setApplications(updatedApps);
    localStorage.setItem('pendingBrandApplications', JSON.stringify(updatedApps.filter(a => a.status === 'pending')));
    
    // Move to approved brands
    const approvedBrands = JSON.parse(localStorage.getItem('approvedBrands') || '[]');
    const approved = applications.find(a => a.id === appId);
    approved.status = 'approved';
    approved.approvedDate = new Date().toISOString().split('T')[0];
    approved.adminRemarks = remarks;
    approvedBrands.push(approved);
    localStorage.setItem('approvedBrands', JSON.stringify(approvedBrands));
    
    // Create vendor account
    const pendingVendors = JSON.parse(localStorage.getItem('pendingVendors') || '[]');
    const registeredVendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
    const vendorToApprove = pendingVendors.find(v => v.email === approved.vendorEmail);
    
    if (vendorToApprove) {
      vendorToApprove.vendorStatus = 'approved';
      vendorToApprove.brandApproved = true;
      vendorToApprove.brandApprovedDate = new Date().toISOString().split('T')[0];
      registeredVendors.push(vendorToApprove);
      const updatedPending = pendingVendors.filter(v => v.email !== approved.vendorEmail);
      localStorage.setItem('pendingVendors', JSON.stringify(updatedPending));
      localStorage.setItem('registeredVendors', JSON.stringify(registeredVendors));
    }
    
    alert('Brand approved successfully! Vendor can now login.');
    setShowModal(false);
    setRemarks('');
  };

  const rejectBrand = (appId) => {
    if (window.confirm('Reject this brand application?')) {
      const updatedApps = applications.filter(app => app.id !== appId);
      setApplications(updatedApps);
      localStorage.setItem('pendingBrandApplications', JSON.stringify(updatedApps));
      
      // Delete temp vendor
      const pendingVendors = JSON.parse(localStorage.getItem('pendingVendors') || '[]');
      const appToReject = applications.find(a => a.id === appId);
      const updatedVendors = pendingVendors.filter(v => v.email !== appToReject?.vendorEmail);
      localStorage.setItem('pendingVendors', JSON.stringify(updatedVendors));
      
      alert('Brand application rejected');
    }
  };

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
      <div className="bg-white border-b border-gray-200 px-6 py-3 fixed top-0 right-0 left-64 z-40">
        <h1 className="text-xl font-semibold text-gray-800">Brand Applications</h1>
      </div>

      <main className="ml-64 pt-16 p-6">
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-3">®️</div>
            <p className="text-gray-500">No pending brand applications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{app.brandName}</h3>
                    <p className="text-sm text-gray-500">Vendor: {app.vendorName} ({app.vendorEmail})</p>
                    <p className="text-sm text-gray-500">Trademark: {app.trademarkNumber}</p>
                    <p className="text-sm text-gray-500">Submitted: {app.submittedDate}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.productCategories?.map(cat => <span key={cat} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{cat}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedApp(app); setShowModal(true); }} className="bg-green-500 text-white px-4 py-1 rounded-lg text-sm">Approve</button>
                    <button onClick={() => rejectBrand(app.id)} className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">Approve Brand</h3><button onClick={() => setShowModal(false)}>✕</button></div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Remarks (Optional)</label><textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Add any remarks..." /></div>
              <button onClick={() => approveBrand(selectedApp.id)} className="w-full bg-green-500 text-white py-2 rounded-lg">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBrandApplications;
