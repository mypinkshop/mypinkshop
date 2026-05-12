import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    image: '',
    description: '',
    status: 'active',
    order: 0
  });
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  // Mock categories data
  const mockCategories = [
    { id: 1, name: 'Skincare', slug: 'skincare', parentId: null, icon: '🧴', image: '', status: 'active', order: 1, productCount: 156, children: [
      { id: 2, name: 'Face Wash', slug: 'face-wash', parentId: 1, icon: '🧼', status: 'active', order: 1, productCount: 34 },
      { id: 3, name: 'Serums', slug: 'serums', parentId: 1, icon: '💧', status: 'active', order: 2, productCount: 28 },
      { id: 4, name: 'Moisturizers', slug: 'moisturizers', parentId: 1, icon: '🧴', status: 'active', order: 3, productCount: 42 },
      { id: 5, name: 'Toners', slug: 'toners', parentId: 1, icon: '💦', status: 'active', order: 4, productCount: 18 }
    ]},
    { id: 6, name: 'Makeup', slug: 'makeup', parentId: null, icon: '💄', status: 'active', order: 2, productCount: 234, children: [
      { id: 7, name: 'Lipsticks', slug: 'lipsticks', parentId: 6, icon: '💋', status: 'active', order: 1, productCount: 67 },
      { id: 8, name: 'Foundation', slug: 'foundation', parentId: 6, icon: '🎨', status: 'active', order: 2, productCount: 45 },
      { id: 9, name: 'Eye Makeup', slug: 'eye-makeup', parentId: 6, icon: '👁️', status: 'active', order: 3, productCount: 56 }
    ]},
    { id: 10, name: 'The Drip', slug: 'drip', parentId: null, icon: '👗', status: 'active', order: 3, productCount: 89, children: [
      { id: 11, name: 'Dresses', slug: 'dresses', parentId: 10, icon: '👗', status: 'active', order: 1, productCount: 34 },
      { id: 12, name: 'Tops', slug: 'tops', parentId: 10, icon: '👕', status: 'active', order: 2, productCount: 28 }
    ]},
    { id: 13, name: 'Accessories', slug: 'accessories', parentId: null, icon: '👜', status: 'active', order: 4, productCount: 67, children: [
      { id: 14, name: 'Bags', slug: 'bags', parentId: 13, icon: '👜', status: 'active', order: 1, productCount: 23 },
      { id: 15, name: 'Jewelry', slug: 'jewelry', parentId: 13, icon: '💍', status: 'active', order: 2, productCount: 44 }
    ]}
  ];

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    setCategories(mockCategories);
    setLoading(false);
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'name') {
      setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-') }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCategory = {
      id: Date.now(),
      ...formData,
      productCount: 0,
      children: []
    };
    if (editingCategory) {
      // Edit logic
    } else {
      if (formData.parentId) {
        // Add as child
        setCategories(categories.map(cat => 
          cat.id === formData.parentId 
            ? { ...cat, children: [...cat.children, newCategory] }
            : cat
        ));
      } else {
        setCategories([...categories, newCategory]);
      }
    }
    setShowModal(false);
    resetForm();
    alert(`${editingCategory ? 'Category updated' : 'Category added'} successfully!`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      parentId: null,
      icon: '📁',
      image: '',
      description: '',
      status: 'active',
      order: 0
    });
    setEditingCategory(null);
  };

  const deleteCategory = (categoryId, parentId = null) => {
    if (window.confirm('Are you sure you want to delete this category? Sub-categories will also be deleted.')) {
      if (parentId) {
        setCategories(categories.map(cat =>
          cat.id === parentId
            ? { ...cat, children: cat.children.filter(child => child.id !== categoryId) }
            : cat
        ));
      } else {
        setCategories(categories.filter(cat => cat.id !== categoryId));
      }
      alert('Category deleted!');
    }
  };

  const toggleCategoryStatus = (categoryId, parentId = null) => {
    if (parentId) {
      setCategories(categories.map(cat =>
        cat.id === parentId
          ? { ...cat, children: cat.children.map(child =>
              child.id === categoryId ? { ...child, status: child.status === 'active' ? 'inactive' : 'active' } : child
            )}
          : cat
      ));
    } else {
      setCategories(categories.map(cat =>
        cat.id === categoryId ? { ...cat, status: cat.status === 'active' ? 'inactive' : 'active' } : cat
      ));
    }
  };

  const CategoryRow = ({ category, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="border-b border-gray-100">
        <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition`} style={{ paddingLeft: `${20 + level * 30}px` }}>
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
                {expanded ? '▼' : '▶'}
              </button>
            )}
            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-xl">{category.icon}</div>
            <div>
              <p className="font-medium text-gray-800">{category.name}</p>
              <p className="text-xs text-gray-400">slug: {category.slug}</p>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{category.productCount} products</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {category.status}
            </span>
            <button onClick={() => { setEditingCategory(category); setFormData(category); setShowModal(true); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded">
              ✏️
            </button>
            <button onClick={() => deleteCategory(category.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
              🗑️
            </button>
          </div>
        </div>
        {hasChildren && expanded && (
          <div className="border-t border-gray-50">
            {category.children.map(child => (
              <CategoryRow key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
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
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
            <p className="text-gray-500 text-sm">Organize your products with hierarchical categories</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-pink-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-pink-600 transition flex items-center gap-2"
          >
            <span>➕</span> Add Category
          </button>
        </div>

        {/* Categories Tree */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div className="grid grid-cols-2">
              <span className="font-semibold text-gray-600">Category Name</span>
              <span className="font-semibold text-gray-600 text-right">Actions</span>
            </div>
          </div>
          <div>
            {categories.map(category => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>💡 Tip: Categories with multiple levels help customers find products easily.</p>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg bg-gray-50" placeholder="auto-generated" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select name="parentId" value={formData.parentId || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">None (Top Level)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon/Emoji</label>
                  <input type="text" name="icon" value={formData.icon} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" name="order" value={formData.order} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
