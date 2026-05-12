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
        <div className={`flex items-center justify
