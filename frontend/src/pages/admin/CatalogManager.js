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
  LineChart,
  Apple,
  Sprout,
  Wheat,
  Box,
  Package,
  ArrowLeft
} from 'lucide-react';

const CatalogManager = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', ref_price: '', min_price: '', max_price: '', default_unit: 'kg' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      setFormData({ name: '', description: '', category: '', ref_price: '', min_price: '', max_price: '', default_unit: 'kg' });
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
      ref_price: item.ref_price,
      min_price: item.min_price,
      max_price: item.max_price,
      default_unit: item.default_unit || 'kg'
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

  const filteredCatalog = catalog.filter(item => {
    const matchesCategory = selectedCategoryFilter === '' || item.category === parseInt(selectedCategoryFilter);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <ArrowLeft size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <BookOpen size={11} /> Catalog Registry
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]">
              <Layers size={28} strokeWidth={2.5} />
            </div>
            Platform <span className="text-[#064e3b]">Catalog</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Institutional registry for standardized marketplace products, pricing bands, and unit control.
          </p>
        </div>

        <button
          className="bg-[#064e3b] hover:bg-[#166534] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-2"
          onClick={() => { setEditingId(null); setShowModal(true); }}
        >
          <Plus size={16} /> Register New Item
        </button>
      </div>

      {/* ── FILTER & SEARCH BAR ────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30 border-b border-slate-100">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search catalog registry..." 
              className="w-full h-12 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 text-xs font-black uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <button
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategoryFilter === '' 
                  ? 'bg-[#064e3b] text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              onClick={() => setSelectedCategoryFilter('')}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategoryFilter === c.id.toString()
                    ? 'bg-[#064e3b] text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => setSelectedCategoryFilter(c.id.toString())}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── REGISTRY TABLE ────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#064e3b] text-white">
                <th className="px-8 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b]">Product Identity</th>
                <th className="px-8 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b] text-center">Domain</th>
                <th className="px-8 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b] text-center">Market Index</th>
                <th className="px-8 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b] text-center">Target Range</th>
                <th className="px-8 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#064e3b] text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-[#064e3b] rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Registry Data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCatalog.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                        <Search size={40} />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        No catalog records found matching your filters.<br/>Try broadening your search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredCatalog.map(item => {
                const categoryName = categories.find(c => c.id === item.category)?.name || 'Unmapped';
                const getCatDetails = (name) => {
                  const n = name.toLowerCase();
                  if (n.includes('fruit')) return { style: "from-orange-400 to-rose-500", icon: <Apple size={18} /> };
                  if (n.includes('legume') || n.includes('vegetable')) return { style: "from-emerald-400 to-teal-600", icon: <Sprout size={18} /> };
                  if (n.includes('grain') || n.includes('cereal')) return { style: "from-amber-400 to-yellow-600", icon: <Wheat size={18} /> };
                  return { style: "from-slate-400 to-slate-600", icon: <Package size={18} /> };
                };
                const details = getCatDetails(categoryName);

                return (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-8 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br ${details.style} flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform`}>
                          {React.cloneElement(details.icon, { size: 16 })}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-black text-slate-900 text-[13px] truncate uppercase tracking-tight">{item.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">{item.description || 'No description.'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-3 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                        {categoryName}
                      </span>
                    </td>
                    <td className="px-8 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">DZD / {item.default_unit}</div>
                        <div className="font-black text-slate-900 text-sm tracking-tight">{item.ref_price}</div>
                      </div>
                    </td>
                    <td className="px-8 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[13px] font-black tracking-tighter">
                          <span className="text-rose-500">{item.min_price}</span>
                          <span className="w-3 h-[2px] bg-slate-200 rounded-full"></span>
                          <span className="text-emerald-600">{item.max_price}</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">Registry Band</span>
                      </div>
                    </td>
                    <td className="px-8 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#064e3b] hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn" 
                          onClick={() => navigate(`/admin-dashboard/catalog/${item.id}/price-history`)}
                        >
                          <LineChart size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn" 
                          onClick={() => handleEdit(item)}
                        >
                          <Edit size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn" 
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal (Standard Unified Style) ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col animate-scale-in">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                    <Plus size={20} />
                   </div>
                   <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">
                       {editingId ? 'Modify Record' : 'Register New Item'}
                     </h3>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Catalog Registry Management</p>
                   </div>
                </div>
                <button type="button" className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#064e3b] hover:bg-slate-100 transition-all flex items-center justify-center" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-shake">
                    <Info size={16} /> {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Designation</label>
                      <input type="text" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-inner uppercase" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Taxonomic Domain</label>
                      <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-inner uppercase" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="">Select Domain...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Index Price</label>
                      <div className="relative">
                        <input type="number" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 pr-12 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-inner" required value={formData.ref_price} onChange={e => setFormData({...formData, ref_price: e.target.value})} />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">DZD</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Standard Unit</label>
                      <input type="text" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-inner uppercase" required placeholder="e.g. KG, TON" value={formData.default_unit} onChange={e => setFormData({...formData, default_unit: e.target.value})} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Market Min Band</label>
                      <input type="number" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all shadow-inner" required value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Market Max Band</label>
                      <input type="number" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all shadow-inner" required value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Registry Annotation</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-inner" rows={3} placeholder="Technical specifications or classification details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button type="submit" className="flex-1 h-12 bg-[#064e3b] hover:bg-[#166534] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3" disabled={submitting}>
                  <Save size={18} /> {submitting ? 'Updating...' : 'Commit to Registry'}
                </button>
                <button type="button" className="px-8 h-12 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all" onClick={() => setShowModal(false)}>
                  Discard
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
