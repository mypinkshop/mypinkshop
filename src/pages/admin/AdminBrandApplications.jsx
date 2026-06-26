import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminBrandApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadApplications(token);
  }, [navigate]);

  // ✅ Load brand applications from backend
  const loadApplications = async (token) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/admin/brand-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setApplications(data.applications || []);
      } else {
        setError(data.message || 'Failed to load applications');
        toast.error(data.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approve brand application
  const approveBrand = async (appId) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(appId);

    try {
      const res = await fetch(`${API_URL}/api/admin/brand-applications/${appId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminRemarks: remarks })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('✅ Brand approved successfully! Vendor can now login.');
        setApplications(applications.filter(a => a._id !== appId));
        setShowModal(false);
        setRemarks('');
        loadApplications(token);
      } else {
        toast.error(data.message || 'Failed to approve brand');
      }
    } catch (err) {
      console.error('Error approving brand:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Reject brand application
  const rejectBrand = async (appId) => {
    if (!window.confirm('Reject this brand application?')) return;

    const token = localStorage.getItem('adminToken');
    setProcessingId(appId);

    try {
      const res = await fetch(`${API_URL}/api/admin/brand-applications/${appId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminRemarks: remarks || 'Application rejected' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('❌ Brand application rejected');
        setApplications(applications.filter(a => a._id !== appId));
        loadApplications(token);
      } else {
        toast.error(data.message || 'Failed to reject brand');
      }
    } catch (err) {
      console.error('Error rejecting brand:', err);
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
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 fixed top-0 right-0 left-64 z-40 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">🏷️ Brand Applications</h1>
        <p className="text-xs text-gray-400 mt-0.5">Review and manage brand registration requests</p>
      </div>

      {/* Main Content */}
      <main className="ml-64 pt-20 p-6">
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">®️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No pending brand applications</h2>
            <p className="text-gray-400">All brand applications have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map(app => (
              <div key={app._id || app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{app.brandName}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600"><span className="font-medium">Vendor:</span> {app.vendorName || 'N/A'}</p>
                      <p className="text-gray-600"><span className="font-medium">Email:</span> {app.vendorEmail || 'N/A'}</p>
                      <p className="text-gray-600"><span className="font-medium">Trademark:</span> {app.trademarkNumber || 'N/A'}</p>
                      <p className="text-gray-600"><span className="font-medium">Office:</span> {app.trademarkOffice || 'India'}</p>
                      <p className="text-gray-600"><span className="font-medium">Submitted:</span> {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : app.submittedDate || 'N/A'}</p>
                      {app.brandWebsite && (
                        <p className="text-gray-600"><span className="font-medium">Website:</span> <a href={app.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">{app.brandWebsite}</a></p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {app.productCategories?.map(cat => (
                        <span key={cat} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs border border-pink-200">{cat}</span>
                      ))}
                    </div>
                    {app.manufacturingCountries?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs text-gray-400">Manufacturing:</span>
                        {app.manufacturingCountries.map(c => (
                          <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>
                        ))}
                      </div>
                    )}
                    {app.brandCertificate && (
                      <div className="mt-2">
                        <a href={app.brandCertificate} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">📄 View Certificate</a>
                      </div>
                    )}
                  </div>
                  
                  {app.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => { setSelectedApp(app); setShowModal(true); }} 
                        disabled={processingId === app._id}
                        className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => rejectBrand(app._id || app.id)} 
                        disabled={processingId === app._id}
                        className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {app.status !== 'pending' && (
                    <span className="text-xs text-gray-400">Processed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approve Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">✅ Approve Brand</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-600"><span className="font-medium">Brand:</span> {selectedApp.brandName}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">Vendor:</span> {selectedApp.vendorName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remarks (Optional)</label>
                <textarea 
                  rows="3" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-sm" 
                  placeholder="Add any remarks about this approval..."
                />
              </div>
              <button 
                onClick={() => approveBrand(selectedApp._id || selectedApp.id)} 
                disabled={processingId === selectedApp._id}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {processingId === selectedApp._id ? '⏳ Processing...' : '✅ Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBrandApplications;
