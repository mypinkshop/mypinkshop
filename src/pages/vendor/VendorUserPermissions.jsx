import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorUserPermissions() {
  const [users, setUsers] = useState([{ id: 1, name: 'Admin User', email: 'admin@store.com', role: 'admin', status: 'active' }]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'editor' });

  const addUser = () => { if (!newUser.name || !newUser.email) return; setUsers([...users, { id: Date.now(), ...newUser, status: 'active' }]); setShowModal(false); setNewUser({ name: '', email: '', role: 'editor' }); alert('User added!'); };
  const removeUser = (id) => { if (window.confirm('Remove this user?')) setUsers(users.filter(u => u.id !== id)); };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader /><VendorSidebar activeTab="permissions" />
      <main className="ml-64 pt-16 p-6"><div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold text-gray-800">User Permissions</h1><p className="text-gray-500">Manage team access to your seller account</p></div><button onClick={() => setShowModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg">+ Invite User</button></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-center">Role</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Action</th></tr></thead><tbody className="divide-y">{users.map(u => (<tr key={u.id}><td className="px-4 py-3 font-medium">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3 text-center capitalize">{u.role}</td><td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span></td><td className="px-4 py-3 text-center"><button onClick={() => removeUser(u.id)} className="text-red-500 text-sm">Remove</button></td></tr>))}</tbody></table></div>
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}><div className="bg-white rounded-2xl max-w-md w-full"><div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">Invite User</h3><button onClick={() => setShowModal(false)}>✕</button></div><div className="p-5 space-y-4"><input type="text" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /><input type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /><select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="admin">Admin - Full Access</option><option value="editor">Editor - Manage Products</option><option value="viewer">Viewer - Read Only</option></select><button onClick={addUser} className="w-full bg-pink-600 text-white py-2 rounded-lg">Send Invite</button></div></div></div>)}
      </main>
    </div>
  );
}
export default VendorUserPermissions;
