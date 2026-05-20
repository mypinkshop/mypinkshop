import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  const products = [
    { 
      id: 1, 
      status: 'Out of stock', 
      statusDate: '20 Jan 2022, 06:03 am',
      title: 'Teksu SCW-009 Combination Screw Driver Kit with Tester (Blue and Silver, 9 Pcs)',
      asin: 'B09HL8NQ6B',
      sku: 'scrwset-1pcs',
      sales: 0,
      available: 0,
      price: 285.00,
      mrp: 315.00,
      image: '🔧'
    },
    { 
      id: 2, 
      status: 'Out of stock', 
      statusDate: '20 Jan 2022, 06:02 am',
      title: 'Teksu Rice Light Cork Lights, Battery Operated 20 LEDs Silver Wire 2M/7.2FT',
      asin: 'B09GX6HP23',
      sku: 'WWCL10PCS',
      sales: 0,
      available: 0,
      price: 285.00,
      mrp: 315.00,
      image: '💡'
    },
    { 
      id: 3, 
      status: 'Out of stock', 
      statusDate: '16 Oct 2021, 02:14 pm',
      title: 'Teksu Smart LED Music Light Bulb Controlled via Bluetooth Remote',
      asin: 'B09GX6HP24',
      sku: 'LEDBLUETOOTH01',
      sales: 0,
      available: 0,
      price: 285.00,
      mrp: 315.00,
      image: '💡'
    },
  ];

  const stats = {
    suppressed: 11,
    inactive: 11,
    active: 0,
    outOfStock: 3,
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.asin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Amazon Style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">MyPinkShop</h1>
            <span className="text-xs text-gray-400">Seller Central</span>
            <div className="relative ml-4">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-80 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-pink-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-800">EN ▼</button>
            <button className="text-sm text-gray-600 hover:text-gray-800">Help</button>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">SA</div>
          </div>
        </div>
      </header>

      {/* Amazon Style Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-6 text-sm">
        <button className="text-pink-600 border-b-2 border-pink-600 pb-2 font-medium">Manage Inventory</button>
        <button className="text-gray-600 hover:text-gray-800 pb-2">Orders</button>
        <button className="text-gray-600 hover:text-gray-800 pb-2">Reports</button>
        <button className="text-gray-600 hover:text-gray-800 pb-2">Performance</button>
        <button className="text-gray-600 hover:text-gray-800 pb-2">Settings</button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        
        {/* Welcome Banner */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Manage All Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your inventory across marketplaces from a single place.</p>
        </div>

        {/* Stats Cards - Amazon Style */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Suppressed and Inactive Listings</p>
            <p className="text-2xl font-semibold text-gray-800">{stats.suppressed}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Active Listings</p>
            <p className="text-2xl font-semibold text-gray-800">{stats.active}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Out of Stock</p>
            <p className="text-2xl font-semibold text-red-500">{stats.outOfStock}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Total Listings</p>
            <p className="text-2xl font-semibold text-gray-800">{stats.suppressed + stats.active}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="bg-pink-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-pink-700 transition">Add Products</button>
          <button className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition">Manage Pricing</button>
          <button className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition">Listing Tools ▼</button>
        </div>

        {/* Search and Sort Bar */}
        <div className="bg-white border border-gray-200 rounded mb-4 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Search</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option>All</option>
                <option>SKU</option>
                <option>Title</option>
                <option>ASIN</option>
              </select>
              <input 
                type="text" 
                placeholder="Search SKU, Title/Keyword, FNSKU, ASIN, UPC/EAN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-96 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500"
              />
              <button className="bg-pink-600 text-white px-4 py-1.5 rounded text-sm">Search</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>1 - {filteredProducts.length} of {filteredProducts.length}</span>
              <span className="border-l border-gray-300 pl-2">Sort by: Sales: Highest on top ▼</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
            <div className="col-span-3">Listing status</div>
            <div className="col-span-4">Product details</div>
            <div className="col-span-1 text-center">Performance</div>
            <div className="col-span-1 text-center">Inventory</div>
            <div className="col-span-2 text-right">Price and shipping cost</div>
            <div className="col-span-1 text-right">Estimated fees</div>
          </div>

          {/* Product Rows */}
          {filteredProducts.map(product => (
            <div key={product.id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition">
              {/* Listing Status */}
              <div className="col-span-3">
                <div className="text-red-600 font-medium text-sm">{product.status}</div>
                <div className="text-xs text-gray-400">{product.statusDate}</div>
              </div>

              {/* Product Details */}
              <div className="col-span-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                    {product.image}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 line-clamp-2">{product.title}</p>
                    <p className="text-xs text-gray-400 mt-1">ASIN: {product.asin}</p>
                    <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="col-span-1 text-center">
                <p className="text-sm text-gray-600">—</p>
                <p className="text-xs text-gray-400">Units sold</p>
              </div>

              {/* Inventory */}
              <div className="col-span-1 text-center">
                <p className="text-sm text-gray-600">{product.available}</p>
                <p className="text-xs text-gray-400">Available</p>
              </div>

              {/* Price */}
              <div className="col-span-2 text-right">
                <p className="text-sm text-gray-800">₹{product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-400 line-through">MRP: ₹{product.mrp.toFixed(2)}</p>
                <p className="text-xs text-pink-600 mt-1">View reference prices</p>
              </div>

              {/* Fees */}
              <div className="col-span-1 text-right">
                <p className="text-sm text-gray-400">—</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-6">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">‹</button>
          <button className="px-3 py-1 border border-pink-600 bg-pink-600 text-white rounded text-sm">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">›</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
