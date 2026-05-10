import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-dr93.vercel.app';
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetch(`${API_URL}/api/auth/vendors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setVendors(data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, [token, navigate]);

  const approveVendor = async (vendorId) => {
    const res = await fetch(`${API_URL}/api/auth/vendors/${vendorId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      alert('Vendor approved!');
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading vendors...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">All Vendors</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Brand</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
             </tr>
          </thead>
          <tbody className="divide-y">
            {vendors.map(vendor => (
              <tr key={vendor._id}>
                <td className="px-6 py-4">{vendor.brandName || vendor.name}</td>
                <td className="px-6 py-4">{vendor.email}</td>
                <td className="px-6 py-4">{vendor.phone || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    vendor.vendorStatus === 'approved' ? 'bg-green-100 text-green-600' :
                    vendor.vendorStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {vendor.vendorStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {vendor.vendorStatus === 'pending' && (
                    <button
                      onClick={() => approveVendor(vendor._id)}
                      className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-pink-600"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminVendors;
