import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminReports() {
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
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-500 text-sm">Sales and analytics reports</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold">Sales Report</h3>
              <p className="text-sm text-gray-500 mt-2">Download monthly sales report</p>
              <button className="mt-4 text-pink-500 text-sm">Download →</button>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-semibold">Vendor Report</h3>
              <p className="text-sm text-gray-500 mt-2">Vendor-wise sales report</p>
              <button className="mt-4 text-pink-500 text-sm">Download →</button>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold">Product Report</h3>
              <p className="text-sm text-gray-500 mt-2">Best selling products report</p>
              <button className="mt-4 text-pink-500 text-sm">Download →</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminReports;
