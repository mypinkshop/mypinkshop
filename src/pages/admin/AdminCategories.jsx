import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    parentId: null, 
    icon: '📁', 
    status: 'active', 
    order: 0,
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCategories();
  }, [navigate]);

  const loadCategories = () => {
    // Load from localStorage or use default
    const savedCategories = JSON.parse(localStorage.getItem('adminCategories') || '[]');
    if (savedCategories.length > 0) {
      setCategories(savedCategories);
    } else {
      // Default categories
      const defaultCategories = [
        { id: 1, name: 'Skincare', slug: 'skincare', parentId: null, icon: '🧴', status: 'active', order: 1, productCount: 156, description: 'Skin care products for glowing skin', children: [
          { id: 2, name: 'Face Wash', slug: 'face-wash', parentId: 1, icon: '🧼', status: 'active', order: 1, productCount: 34, description: 'Gentle face cleansers' },
          { id: 3, name: 'Serums', slug: 'serums', parentId: 1, icon: '💧', status: 'active', order: 2, productCount: 28, description: 'Concentrated serums' },
          { id: 17, name: 'Moisturizers', slug: 'moisturizers', parentId: 1, icon: '🧴', status: 'active', order: 3, productCount: 42, description: 'Hydrating moisturizers' }
        ]},
        { id: 4, name: 'Makeup', slug: 'makeup', parentId: null, icon: '💄', status: 'active', order: 2, productCount: 234, description: 'Makeup products', children: [
          { id: 5, name: 'Lipsticks', slug: 'lipsticks', parentId: 4, icon: '💋', status: 'active', order: 1, productCount: 67, description: 'Matte, glossy, liquid lipsticks' },
          { id: 6, name: 'Foundation', slug: 'foundation', parentId: 4, icon: '🎨', status: 'active', order: 2, productCount: 45, description: 'Liquid and powder foundations' },
          { id: 7, name: 'Eyeshadow', slug: 'eyeshadow', parentId: 4, icon: '👁️', status: 'active', order: 3, productCount: 89, description: 'Eyeshadow palettes' }
        ]},
        { id: 8, name: 'Clothing', slug: 'clothing', parentId: null, icon: '👗', status: 'active', order: 3, productCount: 89, description: 'Fashion clothing', children: [
          { id: 9, name: 'Dresses', slug: 'dresses', parentId: 8, icon: '👗', status: 'active', order: 1, productCount: 34, description: 'Party and casual dresses' },
          { id: 10, name: 'Tops', slug: 'tops', parentId: 8, icon: '👚', status: 'active', order: 2, productCount: 28, description: 'Blouses and tops' }
        ]},
        { id: 11, name: 'Accessories', slug: 'accessories', parentId: null, icon: '👜', status: 'active', order: 4, productCount: 67, description: 'Fashion accessories', children: [
          { id: 12, name: 'Bags', slug: 'bags', parentId: 11, icon: '👜', status: 'active', order: 1, productCount: 23, description: 'Handbags and clutches' },
          { id: 13, name: 'Jewelry', slug: 'jewelry', parentId: 11, icon: '💍', status: 'active', order: 2, productCount: 34, description: 'Necklaces, earrings, rings' }
        ]}
      ];
      setCategories(defaultCategories);
      localStorage.setItem('adminCategories', JSON.stringify(defaultCategories));
    }
    setLoading(false);
  };

  const saveCategories = (updatedCategories) => {
    setCategories(updatedCategories);
    localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter category name');
      return;
    }

    if (editingCategory) {
      // Update existing category
      const updateCategory = (cats) => {
        return cats.map(cat => {
          if (cat.id === editingCategory.id) {
            return { ...cat, ...formData };
          }
          if (cat.children) {
            return { ...cat, children: updateCategory(cat.children) };
          }
          return cat;
        });
      };
      const updatedCategories = updateCategory(categories);
      saveCategories(updatedCategories);
      alert('✅ Category updated successfully!');
    } else {
      // Add new category
      const newCategory = {
        id: Date.now(),
        ...formData,
        productCount: 0,
        children: []
      };
      
      if (formData.parentId) {
        // Add as child
        const addChild = (cats) => {
          return cats.map(cat => {
            if (cat.id === formData.parentId) {
              return { ...cat, children: [...(cat.children || []), newCategory] };
            }
            if (cat.children) {
              return { ...cat, children: addChild(cat.children) };
            }
            return cat;
          });
        };
        const updatedCategories = addChild(categories);
        saveCategories(updatedCategories);
      } else {
        // Add as root category
        saveCategories([...categories, newCategory]);
      }
      alert('✅ Category added successfully!');
    }
    
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', parentId: null, icon: '📁', status: 'active', order: 0, description: '' });
  };

  const deleteCategory = (id) => {
    if (window.confirm('⚠️ Delete this category? All subcategories will also be deleted.')) {
      const deleteRecursive = (cats) => {
        return cats.filter(cat => {
          if (cat.id === id) return false;
          if (cat.children) {
            cat.children = deleteRecursive(cat.children);
          }
          return true;
        });
      };
      const updatedCategories = deleteRecursive(categories);
      saveCategories(updatedCategories);
      alert('🗑️ Category deleted successfully!');
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || null,
      icon: category.icon,
      status: category.status,
      order: category.order || 0,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const toggleCategoryStatus = (id) => {
    const toggleRecursive = (cats) => {
      return cats.map(cat => {
        if (cat.id === id) {
          return { ...cat, status: cat.status === 'active' ? 'inactive' : 'active' };
        }
        if (cat.children) {
          return { ...cat, children: toggleRecursive(cat.children) };
        }
        return cat;
      });
    };
    const updatedCategories = toggleRecursive(categories);
    saveCategories(updatedCategories);
  };

  const getCategoryCount = () => {
    let count = 0;
    const countRecursive = (cats) => {
      cats.forEach(cat => {
        count++;
        if (cat.children) countRecursive(cat.children);
      });
    };
    countRecursive(categories);
    return count;
  };

  const getActiveCount = () => {
    let count = 0;
    const countRecursive = (cats) => {
      cats.forEach(cat => {
        if (cat.status === 'active') count++;
        if (cat.children) countRecursive(cat.children);
      });
    };
    countRecursive(categories);
    return count;
  };

  const filterCategories = (cats, term) => {
    if (!term) return cats;
    return cats.filter(cat => {
      const matches = cat.name.toLowerCase().includes(term.toLowerCase());
      if (cat.children) {
        cat.children = filterCategories(cat.children, term);
      }
      return matches || (cat.children && cat.children.length > 0);
    });
  };

  const filteredCategories = filterCategories([...categories], searchTerm);

  const CategoryRow = ({ category, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <div>
        <div className={`flex items-center justify-between py-3 px-4 hover:bg-pink-50/30 transition border-b border-gray-100`} style={{ paddingLeft: `${20 + level * 30}px` }}>
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-pink-500 w-6">
                {expanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <div className="w-6"></div>}
            <div className="w-10 h-10 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-xl shadow-sm">
              {category.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800">{category.name}</p>
                <p className="text-xs text-gray-400">slug: {category.slug}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {category.productCount || 0} products
                </span>
                {category.status === 'inactive' && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleCategoryStatus(category.id)} className={`p-1.5 rounded-lg transition ${category.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={category.status === 'active' ? 'Disable' : 'Enable'}>
              {category.status === 'active' ? '🔒' : '🔓'}
            </button>
            <button onClick={() => editCategory(category)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
            <button onClick={() => deleteCategory(category.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>
          </div>
        </div>
        {hasChildren && expanded && category.children.map(child => (
          <CategoryRow key={child.id} category={child} level={level + 1} />
        ))}
      </div>
    );
  };

  // Flatten categories for parent select
  const getFlatCategories = (cats, level = 0, result = []) => {
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children) {
        getFlatCategories(cat.children, level + 1, result);
      }
    });
    return result;
  };

  const flatCategories = getFlatCategories(categories);

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
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Category Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Organize products with categories and subcategories</p>
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
            <button onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '', parentId: null, icon: '📁', status: 'active', order: 0, description: '' }); setShowModal(true); }} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
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
                <p className="text-xs text-gray-500">Total Categories</p>
                <span className="text-lg">📂</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{getCategoryCount()}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Active</p>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{getActiveCount()}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Root Categories</p>
                <span className="text-lg">🏠</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Products</p>
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-bold text-pink-600">
                {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
              </p>
            </div>
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
                </div>
              ) : (
                filteredCategories.map(cat => <CategoryRow key={cat.id} category={cat} />)
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Total {getCategoryCount()} categories • Hierarchical structure
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="e.g., Skincare" 
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
                  placeholder="e.g., skincare" 
                  value={formData.slug} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" 
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from name</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select 
                  name="parentId" 
                  value={formData.parentId || ''} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                >
                  <option value="">None (Root Category)</option>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id} disabled={editingCategory && cat.id === editingCategory.id}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <input 
                    type="text" 
                    name="icon" 
                    placeholder="e.g., 🧴" 
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
              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:shadow-lg transition mt-2">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
