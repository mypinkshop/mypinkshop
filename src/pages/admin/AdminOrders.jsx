import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    total: 0,
    paymentMethod: 'cod',
    status: 'pending'
  });
  const [processingId, setProcessingId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOrders(token);
  }, [navigate]);

  const loadOrders = async (token) => {
    try {
      setLoading(true);
      setError('');

      const ordersRes = await fetch(`${API_URL}/api/orders/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (ordersRes.ok) {
        const json = await ordersRes.json();
        const ordersArray = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        
        const normalized = ordersArray.map(order => {
          let parsedAddress = order.shippingAddress || order.shipping_address || order.address;
          if (typeof parsedAddress === 'string') {
            try {
              parsedAddress = JSON.parse(parsedAddress);
            } catch (e) {}
          }

          return {
            ...order,
            _id: order._id || order.id,
            createdAt: order.createdAt || order.created_at,
            total: order.total || order.total_amount || order.subtotal || 0,
            shippingAddress: parsedAddress,
            paymentMethod: order.paymentMethod || order.payment_method || 'cod',
            paymentStatus: order.paymentStatus || order.payment_status || 'Paid',
            items: (order.items || []).map(item => ({
              ...item,
              productId: item.productId || item.product_id,
              name: item.name || item.product_name,
              brand: item.brand || item.product_brand || 'MyPinkShop',
              image: item.image || item.product_image || item.img,
              price: item.price || item.unit_price || 0,
            })),
          };
        });

        setOrders(normalized);
      } else {
        setError('Failed to load orders');
        toast.error('Failed to load orders');
      }

      const returnsRes = await fetch(`${API_URL}/api/orders/returns/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (returnsRes.ok) {
        const json = await returnsRes.json();
        const returnsData = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        setReturns(returnsData.map(r => ({ ...r, _id: r._id || r.id })));
      }

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(orderId);

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`✅ Order status updated to ${newStatus}`);
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        toast.error(data.error || data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveEditedOrder = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const orderId = editFormData._id;

    try {
      const payload = {
        total: Number(editFormData.total),
        paymentMethod: editFormData.paymentMethod,
        status: editFormData.status,
        shippingAddress: {
          fullName: editFormData.fullName,
          phone: editFormData.phone,
          addressLine1: editFormData.addressLine1,
          city: editFormData.city,
          state: editFormData.state,
          pincode: editFormData.pincode,
          country: 'India'
        }
      };

      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('✅ Order updated successfully');
        setShowEditModal(false);
        loadOrders(token);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Network error while updating order');
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold border border-emerald-200">Delivered</span>;
      case 'shipped': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-200">Shipped</span>;
      case 'confirmed': return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold border border-indigo-200">Confirmed</span>;
      case 'processing': return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-semibold border border-purple-200">Processing</span>;
      case 'pending': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-semibold border border-amber-200">Pending</span>;
      case 'cancelled': case 'failed': return <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-semibold border border-red-200">Cancelled</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">{status || 'Pending'}</span>;
    }
  };

  const getOrderIdDisplay = (order) => {
    if (!order) return 'N/A';
    if (order.order_number) return order.order_number;
    if (order.orderId) return order.orderId;
    if (order.orderNumber) return order.orderNumber;
    const idVal = order._id || order.id;
    return idVal ? String(idVal) : 'N/A';
  };
  
  const getCustomerName = (order) => {
    const addr = order.shippingAddress;
    return (typeof addr === 'object' && addr !== null ? (addr.fullName || addr.name) : null) || 
           order.buyerName || order.customerName || 
           order.userId?.name || order.user?.name || 'Customer';
  };

  const getCustomerPhone = (order) => {
    const addr = order.shippingAddress;
    return (typeof addr === 'object' && addr !== null ? addr.phone : null) || 
           order.userId?.phone || order.user?.phone || 'N/A';
  };

  const getCustomerAddress = (order) => {
    const addr = order.shippingAddress;
    if (typeof addr === 'object' && addr !== null) {
      const line = addr.addressLine1 || addr.address || addr.line1 || '';
      const city = addr.city || '';
      const state = addr.state || '';
      const pincode = addr.pincode || '';
      return `${line}, ${city}, ${state} - ${pincode}`;
    }
    return String(addr || 'N/A');
  };

  const getBrand = (order) => {
    if (order.vendorName || order.brand) return order.vendorName || order.brand;
    if (order.items && order.items.length > 0) {
      return order.items[0].brand || 'MyPinkShop';
    }
    return 'MyPinkShop';
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'cancelled') return ['cancelled', 'failed'].includes(order.status?.toLowerCase());
    if (['cancelled', 'failed'].includes(order.status?.toLowerCase())) return false; 

    if (filterStatus !== 'all' && order.status?.toLowerCase() !== filterStatus) return false;
    if (filterBrand !== 'all' && getBrand(order) !== filterBrand) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return String(getOrderIdDisplay(order)).toLowerCase().includes(searchLower) || 
             String(getCustomerName(order)).toLowerCase().includes(searchLower);
    }
    return true;
  });

  // 📥 Export Filtered Orders to CSV for Warehouse Team
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export!');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Items & Brands', 'Total (INR)', 'Payment', 'Status'];
    const rows = filteredOrders.map(order => [
      getOrderIdDisplay(order),
      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
      `"${getCustomerName(order)}"`,
      `"${getCustomerPhone(order)}"`,
      `"${getCustomerAddress(order).replace(/"/g, '""')}"`,
      `"${(order.items || []).map(i => `${i.quantity}x ${i.name} [Brand: ${i.brand}]`).join(' | ').replace(/"/g, '""')}"`,
      order.total || 0,
      order.paymentMethod || 'COD',
      order.status || 'Pending'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Warehouse_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 Orders exported successfully for warehouse!');
  };

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !['cancelled', 'failed', 'delivered'].includes(o.status?.toLowerCase())).length;
  const shippedOrders = orders.filter(o => o.status?.toLowerCase() === 'shipped').length;
  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const brands = [...new Set(orders.map(order => getBrand(order)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/75">
      <Helmet><title>Orders Manager - Amazon Seller Style</title></Helmet>
      <AdminSidebar />
      
      {/* Top Header */}
      <div className="bg-[#232f3e] text-white px-4 sm:px-6 py-3.5 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-md flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span>📋</span> Manage Orders & Shipments
          </h1>
          <p className="text-[11px] text-slate-300">Super Admin Order Fulfillment Central • MyPinkShop</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search Order ID, Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-56 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#ff9900]"
          />
          <button 
            onClick={exportToCSV}
            className="bg-[#ff9900] hover:bg-[#fa9400] text-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 shrink-0"
            title="Download CSV for Warehouse"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-6 pb-8">
          
          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Orders</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{totalOrders}</p>
            </div>
            <div onClick={() => { setActiveTab('orders'); setFilterStatus('processing'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-purple-600 uppercase font-semibold">Active Processing</p>
              <p className="text-xl font-bold text-purple-700 mt-1">{activeOrders}</p>
            </div>
            <div onClick={() => { setActiveTab('orders'); setFilterStatus('shipped'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-blue-600 uppercase font-semibold">Shipped Orders</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{shippedOrders}</p>
            </div>
            <div onClick={() => setActiveTab('returns')} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-orange-600 uppercase font-semibold">Return Requests</p>
              <p className="text-xl font-bold text-orange-700 mt-1">{pendingReturns}</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white rounded-t-xl border-x border-t border-slate-200 px-4 pt-3 gap-6">
            <button onClick={() => setActiveTab('orders')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'orders' ? 'text-[#ff9900] border-[#ff9900]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
              Orders List ({orders.filter(o => !['cancelled', 'failed'].includes(o.status?.toLowerCase())).length})
            </button>
            <button onClick={() => setActiveTab('returns')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'returns' ? 'text-[#ff9900] border-[#ff9900]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
              Returns & Refunds ({returns.length})
            </button>
          </div>

          {/* Filter Bar */}
          {activeTab === 'orders' && (
            <div className="bg-white border-x border-b border-slate-200 p-3.5 flex flex-wrap justify-between items-center gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff9900]">
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff9900]">
                  <option value="all">All Brands</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Orders Data Table */}
          <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eaeded] text-slate-700 text-xs uppercase font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-3">Order ID / Date</th>
                    <th className="p-3">Customer & Address</th>
                    <th className="p-3">Items & Brand Summary</th>
                    <th className="p-3 text-right">Total (INR)</th>
                    <th className="p-3 text-center">Payment</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action / Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {activeTab === 'orders' && filteredOrders.length === 0 ? (
                    <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-semibold">No orders found</td></tr>
                  ) : activeTab === 'returns' && returns.length === 0 ? (
                    <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-semibold">No returns found</td></tr>
                  ) : (
                    activeTab === 'orders' ? (
                      filteredOrders.map(order => (
                        <tr key={order._id} className="hover:bg-slate-50 transition">
                          <td className="p-3 align-top">
                            <p className="font-mono font-bold text-slate-900">{getOrderIdDisplay(order)}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-semibold text-slate-900">{getCustomerName(order)}</p>
                            <p className="text-[11px] text-slate-600">📞 {getCustomerPhone(order)}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{getCustomerAddress(order)}</p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-medium text-slate-800">{order.items?.length || 0} item(s)</p>
                            <div className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
                              {order.items?.map((i, idx) => (
                                <p key={idx} className="line-clamp-1">
                                  <span className="font-bold text-pink-600">[{i.brand || 'MyPinkShop'}]</span> {i.quantity}x {i.name}
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 align-top text-right font-bold text-slate-900">₹{(order.total || 0).toLocaleString()}</td>
                          <td className="p-3 align-top text-center"><span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold uppercase">{order.paymentMethod || 'COD'}</span></td>
                          <td className="p-3 align-top text-center">{getStatusBadge(order.status)}</td>
                          <td className="p-3 align-top text-center">
                            <div className="flex justify-center items-center gap-1.5 flex-wrap">
                              <select 
                                value={order.status || 'pending'} 
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                disabled={processingId === order._id}
                                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-800 outline-none focus:border-[#ff9900]"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  const addr = order.shippingAddress || {};
                                  setEditFormData({
                                    _id: order._id,
                                    fullName: getCustomerName(order),
                                    phone: getCustomerPhone(order),
                                    addressLine1: addr.addressLine1 || addr.address || '',
                                    city: addr.city || '',
                                    state: addr.state || '',
                                    pincode: addr.pincode || '',
                                    total: order.total || 0,
                                    paymentMethod: order.paymentMethod || 'cod',
                                    status: order.status || 'pending'
                                  });
                                  setShowEditModal(true);
                                }} 
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailsModal(true);
                                }} 
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-medium transition"
                              >
                                👁️ View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      returns.map(ret => (
                        <tr key={ret._id} className="hover:bg-slate-50 transition">
                          <td className="p-3">#{ret._id?.slice(-6)}</td>
                          <td className="p-3">#{ret.orderId?.slice(-6)}</td>
                          <td className="p-3 font-semibold">{ret.customerName || 'Customer'}</td>
                          <td className="p-3">{ret.productName || 'Product'}</td>
                          <td className="p-3 text-slate-500">{ret.reason || 'N/A'}</td>
                          <td className="p-3 text-right font-bold">₹{ret.amount || 0}</td>
                          <td className="p-3 text-center"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-semibold">{ret.status || 'pending'}</span></td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">📦 Order Details {getOrderIdDisplay(selectedOrder)}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <p><strong>Customer Name:</strong> {getCustomerName(selectedOrder)}</p>
              <p><strong>Phone:</strong> {getCustomerPhone(selectedOrder)}</p>
              <p><strong>Shipping Address:</strong> {getCustomerAddress(selectedOrder)}</p>
              <div className="border-t pt-2">
                <p className="font-bold mb-1">Items Ordered:</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span><strong>[{item.brand || 'MyPinkShop'}]</strong> {item.quantity}x {item.name}</span>
                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-[#ff9900]">₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Full Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">✏️ Super Admin Order Editor</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveEditedOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input type="text" value={editFormData.fullName} onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                <input type="text" value={editFormData.addressLine1} onChange={(e) => setEditFormData({...editFormData, addressLine1: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input type="text" value={editFormData.city} onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input type="text" value={editFormData.state} onChange={(e) => setEditFormData({...editFormData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input type="text" value={editFormData.pincode} onChange={(e) => setEditFormData({...editFormData, pincode: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total (₹)</label>
                  <input type="number" value={editFormData.total} onChange={(e) => setEditFormData({...editFormData, total: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#ff9900]" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment</label>
                  <select value={editFormData.paymentMethod} onChange={(e) => setEditFormData({...editFormData, paymentMethod: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#ff9900]">
                    <option value="cod">COD</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#ff9900]">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#ff9900] hover:bg-[#fa9400] text-slate-900 rounded-lg font-bold">Save All Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
