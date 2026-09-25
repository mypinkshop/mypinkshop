import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminCategories() {
  const [categories, setCategories] = useState([]);         // Tree structure
  const [flatCategories, setFlatCategories] = useState([]); // Flat list (dropdown ke liye)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    icon: '📁', 
    status: 'active', 
    order: 0,
    description: '',
    type: 'main',          // ✅ NAYA
    parent_id: ''          // ✅ NAYA
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});  // ✅ NAYA
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCategories(token);
  }, [navigate]);

  // ✅ FIX: Response format handle karo (data.data)
  const loadCategories = async (token) => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/categories/tree`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const json = await res.json();

      if (res.ok) {
        // ✅ FIX: `data.data` ya `data` dono handle karo
        const tree = json.data || json;
        const treeArray = Array.isArray(tree) ? tree : [];
        
        setCategories(treeArray);
        
        // ✅ Flat list banao (dropdown ke liye)
        const flat = [];
        treeArray.forEach(mainCat => {
          flat.push({ ...mainCat, type: 'main' });
          (mainCat.children || []).forEach(subCat => {
            flat.push({ ...subCat, type: 'sub', parent_name: mainCat.name });
          });
        });
        setFlatCategories(flat);
      } else {
        setError(json.message || 'Failed to load categories');
        toast.error(json.message || 'Failed to load categories');
        setCategories([]);
        setFlatCategories([]);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
      setCategories([]);
      setFlatCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCategoryToAPI = async (categoryData, isEdit = false) => {
    const token = localStorage.getItem('adminToken');
    const url = isEdit 
      ? `${API_URL}/api/categories/${editingCategory._id || editingCategory.id}`
      : `${API_URL}/api/categories`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: categoryData.name,
        slug: categoryData.slug,
        icon: categoryData.icon || '📁',
        status: categoryData.status || 'active',
        order: parseInt(categoryData.order) || 0,
        description: categoryData.description || '',
        type: categoryData.type || 'main',              // ✅ NAYA
        parent_id: categoryData.parent_id || null       // ✅ NAYA
      })
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save category');
    }
    return data;
  };

  const deleteCategoryFromAPI = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete category');
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        slug: value.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') 
      }));
    }
    // ✅ Type change hone pe parent_id reset karo
    if (name === 'type' && value === 'main') {
      setFormData(prev => ({ ...prev, parent_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter category name');
      return;
    }

    // ✅ Sub category ke liye parent zaroori hai
    if (formData.type === 'sub' && !formData.parent_id) {
      toast.error('Please select a parent category');
      return;
    }

    setProcessingId('submitting');

    try {
      await saveCategoryToAPI(formData, !!editingCategory);
      toast.success(editingCategory ? '✅ Category updated successfully!' : '✅ Category added successfully!');
      await loadCategories(localStorage.getItem('adminToken'));
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', icon: '📁', status: 'active', order: 0, description: '', type: 'main', parent_id: '' });
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err.message || 'Failed to save category');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`⚠️ Delete "${name}"? Sub-categories bhi delete hongi.`)) return;

    setProcessingId(id);
    try {
      await deleteCategoryFromAPI(id);
      toast.success('🗑️ Category deleted successfully!');
      await loadCategories(localStorage.getItem('adminToken'));
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setProcessingId(null);
    }
  };

  const editCategory = (category, type = 'main') => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '📁',
      status: category.status || 'active',
      order: category.order || 0,
      description: category.description || '',
      type: type,
      parent_id: category.parent_id || ''
    });
    setShowModal(true);
  };

  // ✅ Add sub-category shortcut
  const addSubCategory = (parentCategory) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📁',
      status: 'active',
      order: 0,
      description: '',
      type: 'sub',
      parent_id: parentCategory.id
    });
    setShowModal(true);
  };

  const toggleCategoryStatus = async (category) => {
    setProcessingId(category.id);
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      
      const res = await fetch(`${API_URL}/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          icon: category.icon || '📁',
          status: newStatus,
          order: category.order || 0,
          description: category.description || '',
          type: category.type || 'main',
          parent_id: category.parent_id || null
        })
      });

      if (!res.ok) throw new Error('Failed to toggle status');
      
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      await loadCategories(token);
    } catch (err) {
      console.error('Error toggling category:', err);
      toast.error('Failed to toggle category status');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getMainCategoriesCount = () => categories.length;
  const getSubCategoriesCount = () => flatCategories.filter(c => c.type === 'sub').length;
  const getActiveCount = () => flatCategories.filter(cat => cat.status === 'active').length;

  // ✅ Filter — name ya parent name se match karo
  const filteredCategories = categories.filter(cat => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (cat.name.toLowerCase().includes(term)) return true;
    if (cat.children?.some(sub => sub.name.toLowerCase().includes(term))) return true;
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">📂 Category Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Main + sub-categories manage karo</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button 
              onClick={() => { 
                setEditingCategory(null); 
                setFormData({ name: '', slug: '', icon: '📁', status: 'active', order: 0, description: '', type: 'main', parent_id: '' }); 
                setShowModal(true); 
              }} 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition whitespace-nowrap"
            >
              + Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 md:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Main Categories</p>
                <span className="text-lg">📂</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{getMainCategoriesCount()}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Sub Categories</p>
                <span className="text-lg">📁</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{getSubCategoriesCount()}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Active</p>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{getActiveCount()}</p>
            </div>

            <Link to="/admin/products" className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:scale-105 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Products</p>
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-bold text-pink-600">→</p>
            </Link>
          </div>

          {/* Categories Tree */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-gray-700">Category Name</span>
                <span className="text-right font-semibold text-gray-700">Actions</span>
              </div>
            </div>
            <div>
              {filteredCategories.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <div className="text-5xl mb-3">📂</div>
                  <p>No categories found</p>
                  <button 
                    onClick={() => { 
                      setEditingCategory(null); 
                      setFormData({ name: '', slug: '', icon: '📁', status: 'active', order: 0, description: '', type: 'main', parent_id: '' }); 
                      setShowModal(true); 
                    }} 
                    className="mt-3 text-pink-500 text-sm hover:underline"
                  >
                    + Add your first category
                  </button>
                </div>
              ) : (
                filteredCategories.map(mainCat => (
                  <div key={mainCat.id}>
                    {/* ✅ MAIN CATEGORY */}
                    <div className="flex items-center justify-between py-3 px-4 hover:bg-pink-50/30 transition border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button 
                          onClick={() => toggleExpand(mainCat.id)} 
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          {mainCat.children?.length > 0 ? (expandedCategories[mainCat.id] ? '▼' : '▶') : '•'}
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                          {mainCat.icon || '📁'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">{mainCat.name}</p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Main</span>
                            {mainCat.status === 'inactive' && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {mainCat.children?.length || 0} subs
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{mainCat.description || ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => addSubCategory(mainCat)} 
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" 
                          title="Add Sub-category"
                        >
                          ➕
                        </button>
                        <button 
                          onClick={() => toggleCategoryStatus(mainCat)} 
                          disabled={processingId === mainCat.id}
                          className={`p-1.5 rounded-lg transition ${mainCat.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} disabled:opacity-50`} 
                          title={mainCat.status === 'active' ? 'Disable' : 'Enable'}
                        >
                          {mainCat.status === 'active' ? '🔒' : '🔓'}
                        </button>
                        <button onClick={() => editCategory(mainCat, 'main')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
                        <button 
                          onClick={() => deleteCategory(mainCat.id, mainCat.name)} 
                          disabled={processingId === mainCat.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" 
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* ✅ SUB CATEGORIES (expand hone pe) */}
                    {expandedCategories[mainCat.id] && mainCat.children?.map(subCat => (
                      <div 
                        key={subCat.id} 
                        className="flex items-center justify-between py-2 px-4 pl-16 bg-gray-50/50 hover:bg-pink-50/30 transition border-b border-gray-100"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base shadow-sm shrink-0">
                            {subCat.icon || '📁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-700">{subCat.name}</p>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Sub</span>
                              {subCat.status === 'inactive' && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => toggleCategoryStatus(subCat)} 
                            disabled={processingId === subCat.id}
                            className={`p-1 rounded-lg transition text-sm ${subCat.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} disabled:opacity-50`} 
                            title={subCat.status === 'active' ? 'Disable' : 'Enable'}
                          >
                            {subCat.status === 'active' ? '🔒' : '🔓'}
                          </button>
                          <button onClick={() => editCategory(subCat, 'sub')} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition text-sm" title="Edit">✏️</button>
                          <button 
                            onClick={() => deleteCategory(subCat.id, subCat.name)} 
                            disabled={processingId === subCat.id}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition text-sm disabled:opacity-50" 
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Total {getMainCategoriesCount()} main + {getSubCategoriesCount()} sub categories
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCategory ? '✏️ Edit Category' : (formData.type === 'sub' ? '➕ Add Sub-Category' : '➕ Add Main Category')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* ✅ Type selector (sirf naye category ke liye) */}
              {!editingCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Type *</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, type: 'main', parent_id: '' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${formData.type === 'main' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      📂 Main Category
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, type: 'sub' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${formData.type === 'sub' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      📁 Sub Category
                    </button>
                  </div>
                </div>
              )}

              {/* ✅ Parent selector (agar sub category) */}
              {formData.type === 'sub' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                  <select 
                    name="parent_id" 
                    value={formData.parent_id} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                    required
                  >
                    <option value="">Select parent category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="e.g., Electronics" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input 
                  type="text" 
                  name="slug" 
                  placeholder="e.g., electronics" 
                  value={formData.slug} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                  <input 
                    type="text" 
                    name="icon" 
                    placeholder="e.g., 📱" 
                    value={formData.icon} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    name="order" 
                    placeholder="0" 
                    value={formData.order} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="2" 
                  placeholder="Category description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={processingId === 'submitting'}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 mt-2"
              >
                {processingId === 'submitting' ? '⏳ Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
