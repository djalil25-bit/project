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
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'Layers' });
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
      setFormData({ name: '', description: '', icon: 'Layers' });
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
      icon: cat.icon || 'Layers'
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
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#022c22] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#064e3b] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <Layers size={12} /> Taxonomic Architecture
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Domain Taxonomy
          </h1>
          <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-2">
            Manage global product classifications
          </p>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Form Panel ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#064e3b] flex items-center justify-center">
                <Plus size={18} />
              </div>
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">
                {editingId ? 'Modify Classification' : 'Initialize Domain'}
              </h3>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-6">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#064e3b] text-[10px] font-bold uppercase tracking-widest mb-6">
                <CheckCircle size={14} /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Domain Name *</label>
                <input
                  type="text"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner transition-all"
                  placeholder="e.g. Legumes"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>



              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Taxonomic Scope</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner transition-all"
                  rows={4}
                  placeholder="Describe the scope of products included..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                    editingId ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/20' : 'bg-[#064e3b] hover:bg-emerald-700 text-white shadow-emerald-900/20'
                  }`}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? '...' : <><Plus size={16} /> {editingId ? 'Update Domain' : 'Add Domain'}</>}
                </button>
                <button
                  className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-[#064e3b] transition-all flex items-center justify-center"
                  type="button"
                  onClick={() => { setFormData({ name: '', description: '', icon: 'Layers' }); setEditingId(null); }}
                >
                  <X size={18} />
                </button>
              </div>
            </form>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
            <Info size={20} className="text-[#064e3b] shrink-0" />
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
              Categories defined here govern marketplace navigation and price index guardrails.
            </p>
          </div>
        </div>

        {/* ── Table Panel ───────────────────────── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#064e3b]" />
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">Registered Taxonomy Registry</h3>
              </div>
              <span className="text-[9px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest">{categories.length} Domains</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Calculating Registry...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Scope / Definition</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Administrative Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          <div className="flex flex-col items-center gap-3 py-16 text-slate-300">
                            <Search size={40} className="opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest">No taxonomic domains identified.</p>
                          </div>
                        </td>
                      </tr>
                    ) : categories.map(c => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#064e3b] shadow-inner">
                              <Layers size={18} />
                            </div>
                            <div className="font-black text-slate-800 text-sm tracking-tight">{c.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-md">
                            {c.description || <span className="italic opacity-30">No scope defined for this domain.</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-[#064e3b] hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm" title="Modify" onClick={() => handleEdit(c)}>
                              <Layers size={14} />
                            </button>
                            <button className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm" title="Decommission" onClick={() => handleDelete(c.id)}>
                              <Trash2 size={14} />
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
        </div>

      </div>
    </div>
  );
}

export default CategoryManager;
