import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
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
  PlusCircle,
  ArrowLeft,
  Settings2,
  Save,
  Archive
} from 'lucide-react';



function CategoryManager() {
  const navigate = useNavigate();
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
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <ArrowLeft size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <Settings2 size={11} /> Domain Taxonomy
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]">
              <Layers size={28} strokeWidth={2.5} />
            </div>
            Taxonomic <span className="text-[#064e3b]">Architecture</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Institutional framework for global product classifications, market navigation, and index guardrails.
          </p>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Form Panel ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-7">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">
                  {editingId ? 'Modify Domain' : 'Initialize Domain'}
                </h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Registry Classification</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-6 animate-shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#064e3b] text-[10px] font-bold uppercase tracking-widest mb-6 animate-fade-in">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Domain Identity *</label>
                <input
                  type="text"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all uppercase"
                  placeholder="e.g. LEGUMES"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Taxonomic Scope</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all"
                  rows={4}
                  placeholder="Describe the scope of products included in this classification..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className={`flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                    editingId ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/20' : 'bg-[#064e3b] hover:bg-[#166534] text-white shadow-emerald-900/20'
                  }`}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? '...' : <><Save size={18} /> {editingId ? 'Commit Changes' : 'Register Domain'}</>}
                </button>
                <button
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"
                  type="button"
                  onClick={() => { setFormData({ name: '', description: '', icon: 'Layers' }); setEditingId(null); }}
                >
                  <X size={20} />
                </button>
              </div>
            </form>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
            <div className="shrink-0">
              <Info size={20} className="text-[#064e3b]" />
            </div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
              Domain taxonomy governs platform-wide product categorization and market index guardrails.
            </p>
          </div>
        </div>

        {/* ── Table Panel ───────────────────────── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#064e3b]">
                  <Archive size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">Registered Taxonomy</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Official Registry Index</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm">{categories.length} Domains</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#064e3b] text-white">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b]">Classification Entity</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b]">Scope Definition</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#064e3b] rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Search size={40} />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                            No taxonomic records found in the registry index.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categories.map(c => (
                      <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#064e3b] shadow-inner group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                              <Layers size={18} />
                            </div>
                            <div className="font-black text-slate-900 text-sm tracking-tight uppercase">{c.name}</div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-md">
                            {c.description || <span className="italic opacity-30">Institutional definition pending.</span>}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-[#064e3b] hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn" title="Edit Domain" onClick={() => handleEdit(c)}>
                              <Layers size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn" title="Decommission" onClick={() => handleDelete(c.id)}>
                              <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
