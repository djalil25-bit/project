import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Info, 
  X, 
  Save,
  ChevronRight,
  Search,
  Layers,
  Archive,
  LineChart
} from 'lucide-react';

const CatalogManager = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', official_price: '', min_price: '', max_price: '', unit: 'kg' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, catProdRes] = await Promise.all([
        api.get('/categories/'),
        api.get('/catalog-products/')
      ]);
      setCategories(catRes.data.results || catRes.data);
      setCatalog(catProdRes.data.results || catProdRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/catalog-products/${editingId}/`, formData);
      } else {
        await api.post('/catalog-products/', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '', category: '', official_price: '', min_price: '', max_price: '', unit: 'kg' });
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      official_price: item.official_price,
      min_price: item.min_price,
      max_price: item.max_price,
      unit: item.unit
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will remove this product from the registry.')) {
      try {
        await api.delete(`/catalog-products/${id}/`);
        fetchData();
      } catch (err) { alert('Deletion failed. Ensure no active listings reference this product.'); }
    }
  };

  const filteredCatalog = catalog.filter(item =>
    selectedCategoryFilter === '' || item.category === parseInt(selectedCategoryFilter)
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <BookOpen size={12} /> Standardized Catalog
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Platform Products
          </h1>
          <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-2">
            Control marketplace pricing and units
          </p>
        </div>
        <div className="z-10 mt-3 md:mt-0">
          <button
            className="bg-[#0f5c44] hover:bg-[#166534] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all border border-emerald-500/30 shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            onClick={() => { setEditingId(null); setShowModal(true); }}
          >
            <Plus size={14} /> Register New Unit
          </button>
        </div>
      </div>

      {/* ── Catalog Registry Card ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-emerald-600" />
            <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">Available Standardized Units</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 bg-white border border-slate-200 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="text-[9px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest">{filteredCatalog.length} Units</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Designation</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Domain</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Price Range (DZD)</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Index Price</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center gap-3 py-16 text-slate-300">
                        <Search size={40} className="opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">No products match this criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCatalog.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                          <Tag size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-sm tracking-tight">{item.name}</div>
                          <div className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-[200px]">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        {categories.find(c => c.id === item.category)?.name || 'Unmapped'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-black tracking-tight">
                        <span className="text-rose-500">{item.min_price}</span>
                        <span className="w-2 h-[1px] bg-slate-200"></span>
                        <span className="text-emerald-600">{item.max_price}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-black text-slate-900 text-sm">
                        {item.official_price} <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">DZD/{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center shadow-sm" title="Price History" onClick={() => navigate(`/admin-dashboard/catalog/${item.id}/price-history`)}>
                          <LineChart size={14} />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm" title="Modify" onClick={() => handleEdit(item)}>
                          <Edit size={14} />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm" title="Remove" onClick={() => handleDelete(item.id)}>
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

      {/* ── Modal (Tailwind Styled) ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col animate-scale-in">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Plus size={18} />
                   </div>
                   <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">
                     {editingId ? 'Modify Product Unit' : 'Register New Catalog Item'}
                   </h3>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 animate-shake">
                    <Info size={14} /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Product Designation</label>
                    <input type="text" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Taxonomic Category</label>
                    <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="">Select Domain...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Min Price (DZD)</label>
                      <input type="number" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Max Price (DZD)</label>
                      <input type="number" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Official Index Price</label>
                      <input type="number" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required value={formData.official_price} onChange={e => setFormData({...formData, official_price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Unit</label>
                      <input type="text" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" required placeholder="e.g. kg, ton" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Technical Description</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2" disabled={submitting}>
                  <Save size={16} /> {submitting ? '...' : 'Save Catalog Entry'}
                </button>
                <button type="button" className="px-6 h-11 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
