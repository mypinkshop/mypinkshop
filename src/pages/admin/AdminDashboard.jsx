import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  // Mock Data
  const mockVendors = [
    { id: 1, name: 'Nykaa Beauty', email: 'nykaa@mypinkshop.com', phone: '9876543210', status: 'approved', products: 24, sales: 125000, joined: '2024-01-15' },
    { id: 2, name: 'Mamaearth', email: 'mamaearth@mypinkshop.com', phone: '9876543211', status: 'approved', products: 18, sales: 89000, joined: '2024-02-01' },
    { id: 3, name: 'Sugar Cosmetics', email: 'sugar@mypinkshop.com', phone: '9876543212', status: 'pending', products: 0, sales: 0, joined: '2024-05-01' },
    { id: 4, name: 'Plum Beauty', email: 'plum@mypinkshop.com', phone: '9876543213', status: 'blocked', products: 0, sales: 0, joined: '2024-05-05' },
  ];

  const mockProducts = [
    { id: 1, name: 'Glass Skin Serum', vendor: 'Nykaa Beauty', category: 'Skincare', price: 1299, stock: 45, status: 'active' },
    { id: 2, name: 'Cherry Lip Tint', vendor: 'Nykaa Beauty', category: 'Makeup', price: 599, stock: 100, status: 'active' },
    { id: 3, name: 'Vitamin C Face Wash', vendor: 'Mamaearth', category: 'Skincare', price: 399, stock: 0, status: 'outofstock' },
    { id: 4, name: 'Satin Slip Dress', vendor: 'Nykaa Fashion', category: 'Drip', price: 2499, stock: 25, status: 'active' },
  ];

  const mockOrders = [
    { id: '#MPS-1001', customer: 'Priya Sharma', vendor: 'Nykaa Beauty', amount: 2598, status: 'delivered', date: '2024-05-10' },
    { id: '#MPS-1002', customer: 'Aditi Singh', vendor: 'Mamaearth', amount: 1798, status: 'shipped', date: '2024-05-09' },
    { id: '#MPS-1003', customer: 'Neha Gupta', vendor: 'Sugar Cosmetics', amount: 899, status: 'pending', date: '2024-05-09' },
    { id: '#MPS-1004', customer: 'Riya Mehta', vendor: 'Nykaa Beauty', amount: 3499, status: 'processing', date: '2024-05-08' },
  ];

  const mockUsers = [
    { id: 1, name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9988776655', orders: 5, totalSpent: 12500, status: 'active', joined: '2024-01-10' },
    { id: 2, name: 'Aditi Singh', email: 'aditi@gmail.com', phone: '9876543210', orders: 3, totalSpent: 8900, status: 'active', joined: '2024-02-15' },
    { id: 3, name: 'Neha Gupta', email: 'neha@gmail.com', phone: '9765432109', orders: 1, totalSpent: 899, status: 'blocked', joined: '2024-03-20' },
  ];

  const mockCategories = [
    { id: 1, name: 'Skincare', slug: 'skincare', productCount: 45, icon: '🧴', status: 'active' },
    { id: 2, name: 'Makeup', slug: 'makeup', productCount: 32, icon: '💄', status: 'active' },
    { id: 3, name: 'The Drip', slug: 'drip', productCount: 28, icon: '👗', status: 'active' },
    { id: 4, name: 'Accessories', slug: 'accessories', productCount: 15, icon: '👜', status: 'active' },
  ];

  const mockBanners = [
    { id: 1, title: 'Summer Sale', image: '🏖️', link: '/sale', status: 'active', position: 'homepage' },
    { id: 2, title: 'Buy 1 Get 1', image: '🎁', link: '/offers', status: 'active', position: 'homepage' },
    { id: 3, title: 'New Arrivals', image: '✨', link: '/new', status: 'inactive', position: 'sidebar' },
  ];

  const mockCoupons = [
    { id: 1, code: 'WELCOME15', discount: 15, type: 'percentage', minOrder: 999, validTill: '2024-12-31', usageCount: 234, maxUses: 1000 },
    { id: 2, code: 'FLAT100', discount: 100, type: 'fixed', minOrder: 499, validTill: '2024-06-30', usageCount: 89, maxUses: 500 },
  ];

  useEffect(() => {
    setVendors(mockVendors);
    setProducts(mockProducts);
    setOrders(mockOrders);
    setUsers(mockUsers);
    setCategories(mockCategories);
    setBanners(mockBanners);
    setCoupons(mockCoupons);
    setLoading(false);
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      blocked: 'bg-red-100 text-red-700',
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-gray-100 text-gray-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      shipped: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      outofstock: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    totalRevenue: 4582000,
    totalOrders: 342,
    totalProducts: 2847,
    totalVendors: 342,
    totalUsers: 12580,
    pendingVendors: 18,
    lowStock: 12,
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-5 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white text-xl`}>{icon}</div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
        activeTab === id
          ? 'bg-pink-500 text-white shadow-md'
          : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span>{icon}</span> {label}
    </button>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'vendors':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Vendor Management</h2>
              <button onClick={() => { setModalType('vendor'); setShowModal(true); }} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>➕</span> Add Vendor
              </button>
            </div>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm`}>
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Brand Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Products</th>
                    <th className="px-5 py-3 text-left">Sales</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{vendor.name}</td>
                      <td className="px-5 py-3">{vendor.email}</td>
                      <td className="px-5 py-3">{vendor.products}</td>
                      <td className="px-5 py-3">₹{vendor.sales.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                          <button className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                          {vendor.status === 'pending' && <button className="p-1 text-green-500 hover:bg-green-50 rounded">✅</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Product Management</h2>
              <button onClick={() => { setModalType('product'); setShowModal(true); }} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>➕</span> Add Product
              </button>
            </div>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm`}>
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-left">Vendor</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-left">Stock</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{product.name}</td>
                      <td className="px-5 py-3">{product.vendor}</td>
                      <td className="px-5 py-3">{product.category}</td>
                      <td className="px-5 py-3">₹{product.price}</td>
                      <td className="px-5 py-3">{product.stock}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                          <button className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Order Management</h2>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm`}>
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Order ID</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Vendor</th>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{order.id}</td>
                      <td className="px-5 py-3">{order.customer}</td>
                      <td className="px-5 py-3">{order.vendor}</td>
                      <td className="px-5 py-3">₹{order.amount}</td>
                      <td className="px-5 py-3">{order.date}</td>
                      <td className="px-5 py-3">
                        <select className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(order.status)}`} defaultValue={order.status}>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">👁️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">User Management</h2>
              <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>📧</span> Bulk Email
              </button>
            </div>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm`}>
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Phone</th>
                    <th className="px-5 py-3 text-left">Orders</th>
                    <th className="px-5 py-3 text-left">Total Spent</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{user.name}</td>
                      <td className="px-5 py-3">{user.email}</td>
                      <td className="px-5 py-3">{user.phone}</td>
                      <td className="px-5 py-3">{user.orders}</td>
                      <td className="px-5 py-3">₹{user.totalSpent.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                          <button className="p-1 text-red-500 hover:bg-red-50 rounded">🚫</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Category Management</h2>
              <button onClick={() => { setModalType('category'); setShowModal(true); }} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>➕</span> Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center text-2xl">{cat.icon}</div>
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-xs text-gray-500">Slug: {cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>{cat.productCount} products</span>
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                      <button className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'banners':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Banner / Ads Management</h2>
              <button onClick={() => { setModalType('banner'); setShowModal(true); }} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>➕</span> Add Banner
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map(banner => (
                <div key={banner.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center gap-4`}>
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center text-4xl">{banner.image}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{banner.title}</h3>
                    <p className="text-xs text-gray-500">Position: {banner.position}</p>
                    <p className="text-xs text-gray-500">Link: {banner.link}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(banner.status)}`}>{banner.status}</span>
                    <div className="flex gap-2 mt-2">
                      <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                      <button className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coupons':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Coupon Management</h2>
              <button onClick={() => { setModalType('coupon'); setShowModal(true); }} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
                <span>➕</span> Add Coupon
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map(coupon => (
                <div key={coupon.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono font-bold text-lg bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-lg inline-block">{coupon.code}</div>
                      <p className="text-sm mt-2">{coupon.discount}% OFF</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge('active')}`}>Active</span>
                  </div>
                  <div className="text-sm space-y-1 text-gray-500">
                    <p>Min Order: ₹{coupon.minOrder}</p>
                    <p>Valid till: {coupon.validTill}</p>
                    <p>Used: {coupon.usageCount} / {coupon.maxUses}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition`}>
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-semibold">Sales Report</h3>
                <p className="text-sm text-gray-500 mt-1">Download monthly sales report</p>
                <button className="mt-3 text-sm text-pink-500">Download CSV →</button>
              </div>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition`}>
                <div className="text-4xl mb-3">🏪</div>
                <h3 className="font-semibold">Vendor Report</h3>
                <p className="text-sm text-gray-500 mt-1">Vendor-wise sales report</p>
                <button className="mt-3 text-sm text-pink-500">Download CSV →</button>
              </div>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition`}>
                <div className="text-4xl mb-3">📦</div>
                <h3 className="font-semibold">Product Report</h3>
                <p className="text-sm text-gray-500 mt-1">Best selling products</p>
                <button className="mt-3 text-sm text-pink-500">Download CSV →</button>
              </div>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm text-center cursor-pointer hover:shadow-md transition`}>
                <div className="text-4xl mb-3">👥</div>
                <h3 className="font-semibold">User Report</h3>
                <p className="text-sm text-gray-500 mt-1">User activity summary</p>
                <button className="mt-3 text-sm text-pink-500">Download CSV →</button>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Site Settings</h2>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Name</label>
                  <input type="text" defaultValue="MyPinkShop" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input type="email" defaultValue="contact@mypinkshop.com" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input type="text" defaultValue="+91 9876543210" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Commission (%)</label>
                  <input type="number" defaultValue="15" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Free Shipping Threshold (₹)</label>
                  <input type="number" defaultValue="999" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                </div>
                <button className="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition">Save Settings</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="💰" color="from-pink-500 to-rose-500" />
              <StatCard title="Total Orders" value={stats.totalOrders} icon="📦" color="from-blue-500 to-cyan-500" />
              <StatCard title="Total Vendors" value={stats.totalVendors} icon="🏪" color="from-purple-500 to-indigo-500" />
              <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="from-emerald-500 to-teal-500" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => setActiveTab('vendors')} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 text-center hover:shadow-md transition`}>
                <div className="text-2xl mb-1">🏪</div>
                <p className="text-sm font-medium">Manage Vendors</p>
                <p className="text-xs text-gray-500">{stats.pendingVendors} pending</p>
              </button>
              <button onClick={() => setActiveTab('products')} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 text-center hover:shadow-md transition`}>
                <div className="text-2xl mb-1">📦</div>
                <p className="text-sm font-medium">Low Stock Alert</p>
                <p className="text-xs text-gray-500">{stats.lowStock} products</p>
              </button>
              <button onClick={() => setActiveTab('orders')} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 text-center hover:shadow-md transition`}>
                <div className="text-2xl mb-1">📋</div>
                <p className="text-sm font-medium">Pending Orders</p>
                <p className="text-xs text-gray-500">2 orders</p>
              </button>
              <button onClick={() => setActiveTab('coupons')} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 text-center hover:shadow-md transition`}>
                <div className="text-2xl mb-1">🎫</div>
                <p className="text-sm font-medium">Active Coupons</p>
                <p className="text-xs text-gray-500">{coupons.length} coupons</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
              <h3 className="font-semibold mb-4">📋 Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-500">New vendor registered: Sugar Cosmetics</span>
                  <span className="ml-auto text-xs text-gray-400">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-500">Order #MPS-1002 shipped to Aditi Singh</span>
                  <span className="ml-auto text-xs text-gray-400">1 hour ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-gray-500">Low stock alert: 12 products</span>
                  <span className="ml-auto text-xs text-gray-400">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Bar */}
      <div className={`fixed top-0 right-0 left-0 z-50 ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90'} backdrop-blur-md border-b shadow-sm`}>
        <div className="px-6 py-3 flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
            <h1 className="font-bold text-lg">MyPinkShop <span className="text-xs text-gray-400 font-normal">Super Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className={`pl-9 pr-4 py-1.5 rounded-lg text-sm w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-pink-500`} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-100 text-xl leading-none">{darkMode ? '☀️' : '🌙'}</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">SA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 h-full w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} border-r z-40 overflow-y-auto`}>
        <nav className="p-4 space-y-1">
          <TabButton id="dashboard" label="Dashboard" icon="📊" />
          <TabButton id="vendors" label="Vendors" icon="🏪" />
          <TabButton id="products" label="Products" icon="👗" />
          <TabButton id="orders" label="Orders" icon="📦" />
          <TabButton id="users" label="Users" icon="👥" />
          <TabButton id="categories" label="Categories" icon="📁" />
          <TabButton id="banners" label="Banners & Ads" icon="🎨" />
          <TabButton id="coupons" label="Coupons" icon="🎫" />
          <TabButton id="reports" label="Reports" icon="📈" />
          <TabButton id="settings" label="Settings" icon="⚙️" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pl-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New {modalType}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
              <input type="email" placeholder="Email" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
              <button className="w-full py-2 bg-pink-500 text-white rounded-lg font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
