import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    minOrder: '',
    maxDiscount: '',
    validTill: '',
    usageLimit: '',
    description: '',
    status: 'active'
  });

  // ✅ API_URL - Without /api
  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCoupons(token);
  }, [navigate]);

  // ✅ Load coupons from backend
  const loadCoupons = async (token) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/coupons/all`, {  // ✅ Removed /api
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setCoupons(data || []);
      } else {
        setError(data.message || 'Failed to load coupons');
        toast.error(data.message || 'Failed to load coupons');
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save coupon to backend
  const saveCouponToAPI = async (couponData, isEdit = false) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const url = isEdit 
      ? `${API_URL}/coupons/update/${editingCoupon._id || editingCoupon.id}`  // ✅ Removed /api
      : `${API_URL}/coupons/create`;  // ✅ Removed /api
    
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      code: couponData.code,
      discountType: couponData.type,
      discountValue: parseFloat(couponData.discount),
      minOrderValue: parseFloat(couponData.minOrder) || 0,
      maxDiscount: parseFloat(couponData.maxDiscount) || 0,
      usageLimit: parseInt(couponData.usageLimit) || 100,
      endDate: couponData.validTill || null,
      description: couponData.description || '',
      isActive: couponData.status === 'active'
    };

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save coupon');
    }
    return data;
  };

  // ✅ Delete coupon from backend
  const deleteCouponFromAPI = async (id) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const res = await fetch(`${API_URL}/coupons/delete/${id}`, {  // ✅ Removed /api
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete coupon');
    }
    return true;
  };

  // ✅ Toggle coupon status
  const toggleCouponStatusAPI = async (id, currentStatus) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    const res = await fetch(`${API_URL}/coupons/toggle/${id}`, {  // ✅ Removed /api
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to toggle coupon');
    }
    return true;
  };

  // ... rest of the code (handleChange, handleSubmit, resetForm, editCoupon, deleteCoupon, toggleCouponStatus, etc.) ...

  // ✅ isExpired function - Add this
  const isExpired = (validTill) => {
    return validTill && new Date(validTill) < new Date();
  };

  // ✅ getStatusBadge function
  const getStatusBadge = (status, validTill) => {
    const isActive = status === 'active' || status === true;
    if (isExpired(validTill) && isActive) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expired</span>;
    }
    if (isActive) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>;
  };

  // ✅ getDiscountText function
  const getDiscountText = (coupon) => {
    const discount = coupon.discountValue || coupon.discount;
    const type = coupon.discountType || coupon.type;
    if (type === 'percentage') return `${discount}% OFF`;
    if (type === 'fixed') return `₹${discount} OFF`;
    if (type === 'shipping') return 'Free Shipping';
    return `${discount} OFF`;
  };

  // ✅ Filter coupons
  const filteredCoupons = coupons.filter(c => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        const isActive = c.isActive !== undefined ? c.isActive : c.status === 'active';
        if (!isActive || isExpired(c.endDate || c.validTill)) return false;
      }
      if (filterStatus === 'expired') {
        if (!isExpired(c.endDate || c.validTill)) return false;
      }
    }
    if (searchTerm && !c.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // ✅ Stats
  const activeCoupons = coupons.filter(c => {
    const isActive = c.isActive !== undefined ? c.isActive : c.status === 'active';
    return isActive && !isExpired(c.endDate || c.validTill);
  }).length;
  
  const expiredCoupons = coupons.filter(c => isExpired(c.endDate || c.validTill)).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || c.usageCount || 0), 0);

  // ... rest of the JSX remains the same ...
}
