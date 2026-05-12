import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', parentId: null, icon: '📁', status: 'active', order: 0 });
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    setCategories([
      { id: 1, name: 'Skincare', slug: 'skincare', parentId: null, icon: '🧴', status: 'active', order: 1, productCount: 156, children: [
        { id: 2, name: 'Face Wash', slug: 'face-wash', parentId: 1, icon: '🧼', status: 'active', order: 1, productCount: 34 },
        { id: 3, name: 'Serums', slug: 'serums', parentId: 1, icon: '💧', status: 'active', order: 2, productCount: 28 },
      ]},
      { id: 4, name: 'Makeup', slug: 'makeup', parentId: null, icon: '💄', status: 'active', order: 2, productCount: 234, children: [
        { id: 5, name: 'Lipsticks', slug: 'lipsticks', parentId: 4, icon: '💋', status: 'active', order: 1, productCount: 67 },
      ]},
    ]);
    setLoading(false);
  }, [token, navigate]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); if (e.target.name === 'name') setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-') })); };
  const handleSubmit = (e) => { e.preventDefault(); const newCat = { id: Date.now(), ...formData, productCount: 0, children: [] }; setCategories([...categories, newCat]); setShowModal(false); setFormData({ name: '', slug: '', parentId: null, icon: '📁', status: 'active', order: 0 }); alert('Category added!'); };
  const deleteCategory = (id) => { if (confirm('Delete this category?')) { setCategories(categories.filter(c => c.id !== id)); alert('Deleted!'); } };

  const CategoryRow = ({ category, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    return (
      <div>
        <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50`} style={{ paddingLeft: `${20 + level * 30}px` }}>
          <div className="flex items-center gap-3"><button onClick={() => setExpanded(!expanded)} className="text-gray-400">{expanded ? '▼' : '▶'}</button><div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-xl">{category.icon}</div><div><p className="font-medium">{category.name}</p><p className="text-xs text-gray-400">slug: {category.slug}</p></div><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{category.productCount} products</span></div>
          <div className="flex gap-2"><button onClick={() => deleteCategory(category.id)} className="text-red-500 p-1">🗑️</button></div>
        </div>
        {category.children && expanded && category.children.map(child => <CategoryRow key={child.id} category={child} level={level + 1} />)}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-pink-500"><span className="text-xl">←</span><span className="text-sm">Back</span></button><Link to="/admin/dashboard" className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div><h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1></Link></div>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold">Category Management</h1><p className="text-gray-500">Organize products with categories</p></div><button onClick={() => setShowModal(true)} className="bg-pink-500 text-white px-5 py-2 rounded-lg">➕ Add Category</button></div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b"><div className="grid grid-cols-2"><span>Category Name</span><span className="text-right">Actions</span></div></div>
          {categories.map(cat => <CategoryRow key={cat.id} category={cat} />)}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">Add Category</h3><button onClick={() => setShowModal(false)} className="text-gray-400">✕</button></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="text" name="name" placeholder="Category Name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" name="slug" placeholder="Slug" value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
              <select name="parentId" value={formData.parentId || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"><option value="">Parent Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <div className="flex gap-3"><input type="text" name="icon" placeholder="Icon" value={formData.icon} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg" /><input type="number" name="order" placeholder="Order" value={formData.order} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg" /></div>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg">Add Category</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
