import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorUserPermissions() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'viewer',
  });
  const [vendor, setVendor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    
    // Load users from localStorage
    const savedUsers = JSON.parse(localStorage.getItem('vendorTeamMembers') || '[]');
    
    if (savedUsers.length === 0) {
      const defaultUsers = [
        { id: 1, name: vendorInfo.brandName || vendorInfo.name, email: vendorInfo.email, role: 'admin', status: 'active', joinedDate: new Date().toISOString().split('T')[0], permissions: 'Full Access' },
      ];
      setUsers(defaultUsers);
      localStorage.setItem('vendorTeamMembers', JSON.stringify(defaultUsers));
    } else {
      setUsers(savedUsers);
    }
    
    setLoading(false);
  }, [navigate]);

  const sendInvite = () => {
    if (!inviteForm.name || !inviteForm.email) {
      alert('Please fill name and email');
      return;
    }
    
    const newUser = {
      id: Date.now(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0],
      permissions: getRolePermissions(inviteForm.role),
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('vendorTeamMembers', JSON.stringify(updatedUsers));
    
    // Simulate sending email
    alert(`Invitation sent to ${inviteForm.email}`);
    
    setShowInviteModal(false);
    setInviteForm({ name: '', email: '', role: 'viewer' });
  };

  const updateUserRole = () => {
    if (!selectedUser) return;
    
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, role: selectedUser.role, permissions: getRolePermissions(selectedUser.role) }
        : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('vendorTeamMembers', JSON.stringify(updatedUsers));
    alert(`Role updated for ${selectedUser.name}`);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const removeUser = (userId) => {
    if (window.confirm('Remove this user from your team?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('vendorTeamMembers', JSON.stringify(updatedUsers));
      alert('User removed successfully');
    }
  };

  const resendInvite = (email) => {
    alert(`Invitation resent to ${email}`);
  };

  const getRolePermissions = (role) => {
    switch(role) {
      case 'admin':
        return 'Full Access - Manage products, orders, settings, and team members';
      case 'editor':
        return 'Edit Access - Manage products and view orders';
      case 'viewer':
        return 'View Only - View products and orders';
      default:
        return 'Limited Access';
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Admin</span>;
      case 'editor':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Editor</span>;
      case 'viewer':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Viewer</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
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
      <VendorHeader />
      <VendorSidebar activeTab="permissions" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Permissions</h1>
              <p className="text-gray-500 text-sm">Manage team access to your seller account</p>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition">
              Invite User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-center">Role</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-left">Permissions</th>
                    <th className="px-5 py-3 text-center">Joined</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{user.name} {user.role === 'admin' && <span className="ml-2 text-xs text-gray-400">(Owner)</span>}</td>
                      <td className="px-5 py-3">{user.email}</td>
                      <td className="px-5 py-3 text-center">{getRoleBadge(user.role)}</td>
                      <td className="px-5 py-3 text-center">{getStatusBadge(user.status)}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{user.permissions}</td>
                      <td className="px-5 py-3 text-center text-gray-500">{user.joinedDate}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {user.role !== 'admin' && (
                            <>
                              <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                              <button onClick={() => removeUser(user.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                            </>
                          )}
                          {user.status === 'pending' && (
                            <button onClick={() => resendInvite(user.email)} className="text-green-500 hover:text-green-700 text-sm">Resend</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">Role Permissions</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div><p className="font-medium text-sm text-purple-700">Admin</p><p className="text-xs text-blue-600">Full access to all features including managing team members</p></div>
              <div><p className="font-medium text-sm text-blue-700">Editor</p><p className="text-xs text-blue-600">Can manage products, view orders, and update inventory</p></div>
              <div><p className="font-medium text-sm text-gray-700">Viewer</p><p className="text-xs text-blue-600">Read-only access to products and orders</p></div>
            </div>
          </div>
        </div>
      </main>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Invite User</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="John Doe" /></div>
              <div><label className="block text-sm font-medium mb-1">Email Address</label><input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="john@example.com" /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="viewer">Viewer - Read Only</option><option value="editor">Editor - Manage Products</option><option value="admin">Admin - Full Access</option></select></div>
              <button onClick={sendInvite} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">Send Invitation</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit User Role</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <div className="p-5 space-y-4">
              <div><p className="text-sm text-gray-500">User</p><p className="font-medium">{selectedUser.name}</p><p className="text-sm text-gray-400">{selectedUser.email}</p></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="viewer">Viewer - Read Only</option><option value="editor">Editor - Manage Products</option><option value="admin">Admin - Full Access</option></select></div>
              <button onClick={updateUserRole} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">Update Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorUserPermissions;
