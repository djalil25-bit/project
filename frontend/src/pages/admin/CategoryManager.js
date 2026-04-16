import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  Search,
  BookOpen,
  Info,
  X,
  PlusCircle
} from 'lucide-react';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '🌱' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories/');
      setCategories(res.data.results || res.data);
    } catch { console.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/categories/${editingId}/`, formData);
        setSuccess('Category updated successfully.');
      } else {
        await api.post('/categories/', formData);
        setSuccess('Category registered successfully.');
      }
      setFormData({ name: '', description: '', icon: '🌱' });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save the category.');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '🌱'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will remove this classification category.')) return;
    try {
      await api.delete(`/categories/${id}/`);
      setSuccess('Category removed from registry.');
      fetchCategories();
    } catch { setError('Failed to decommission category.'); }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up">

      {/* ── Breadcrumb ────────────────────────────────── */}
      <div className="adm-breadcrumb">
        <Link to="/admin-dashboard">Admin Hub</Link>
        <ChevronRight size={12} className="text-slate-600" />
        <span className="text-slate-500">Product Classifications</span>
      </div>

      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <Layers className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">Domain Taxonomy</h1>
          <p className="text-slate-500 text-sm">Initialize and manage standard categories for the product catalog.</p>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Form Panel ─────────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
            <PlusCircle size={16} className="text-emerald-400" />
            {editingId ? 'Edit Classification' : 'New Classification'}
          </h3>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
              <CheckCircle size={14} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="adm-label">Domain Name *</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="e.g. Legumes"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="adm-label">Icon</label>
                <input
                  type="text"
                  className="adm-input text-center text-lg"
                  placeholder="🌱"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  maxLength="10"
                />
              </div>
            </div>

            <div>
              <label className="adm-label">Taxonomic Description</label>
              <textarea
                className="adm-input"
                style={{ minHeight: 90 }}
                placeholder="Scope of products included..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                className={`adm-btn flex-1 justify-center py-2.5 ${editingId ? 'adm-btn-success' : 'adm-btn-primary'}`}
                type="submit"
                disabled={submitting}
              >
                <Plus size={16} /> {submitting ? 'Saving...' : (editingId ? 'Update Domain' : 'Add Domain')}
              </button>
              <button
                className="adm-btn adm-btn-ghost adm-btn-icon"
                type="button"
                title="Reset Form"
                onClick={() => { setFormData({ name: '', description: '', icon: '🌱' }); setEditingId(null); }}
              >
                <X size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Table Panel ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" /> Registered Taxonomy
                <span className="adm-badge adm-badge-approved ml-1">{categories.length}</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <div className="adm-spinner"></div>
                <span className="text-slate-500 text-sm">Calculating domains...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="pl-6">Classification</th>
                      <th>Scope / Description</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          <div className="flex flex-col items-center gap-3 py-14 text-slate-600">
                            <Search size={40} className="opacity-20" />
                            <p className="text-sm">No taxonomic domains identified.</p>
                          </div>
                        </td>
                      </tr>
                    ) : categories.map(c => (
                      <tr key={c.id}>
                        <td className="pl-6">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{c.icon || '🌱'}</span>
                            <div className="font-semibold text-slate-200">{c.name}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-xs text-slate-500 leading-relaxed" style={{ maxWidth: '300px' }}>
                            {c.description || <span className="italic opacity-50">No scope defined</span>}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2 pr-6">
                            <button className="adm-btn adm-btn-ghost adm-btn-icon" title="Edit" onClick={() => handleEdit(c)}>
                              <Layers size={14} className="text-blue-400" />
                            </button>
                            <button className="adm-btn adm-btn-ghost adm-btn-icon" title="Remove" onClick={() => handleDelete(c.id)}>
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="adm-info-block">
            <Info size={16} className="shrink-0 mt-0.5 opacity-60" />
            <div>Categories defined here are used to group products in the marketplace and for price index filtering.</div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CategoryManager;
