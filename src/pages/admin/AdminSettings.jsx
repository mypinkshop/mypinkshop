import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminSettings() {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  if (!token) { navigate('/admin/login'); return null; }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 text-sm">Site configuration and preferences</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Site Name</label><input type="text" defaultValue="MyPinkShop" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Contact Email</label><input type="email" defaultValue="contact@mypinkshop.com" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone Number</label><input type="text" defaultValue="+91 9876543210" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Admin Commission (%)</label><input type="number" defaultValue="15" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Free Shipping Threshold (₹)</label><input type="number" defaultValue="999" className="w-full px-3 py-2 border rounded-lg" /></div>
              <button className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600">Save Settings</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminSettings;
