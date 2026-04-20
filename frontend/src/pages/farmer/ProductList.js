import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Leaf, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Tag, AlertCircle, CheckCircle, Package, ArrowUpRight, ArrowDownRight, Minus, Home
} from 'lucide-react';

const PriceCompBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'above') return (
    <div className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md w-fit tracking-wide mt-0.5">
      <ArrowUpRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  if (status === 'below') return (
    <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md w-fit tracking-wide mt-0.5">
      <ArrowDownRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md w-fit tracking-wide mt-0.5">
      <Minus size={10} strokeWidth={3} /> Avg
    </div>
  );
};

const QualityBadge = ({ quality }) => {
  const map = {
    PREMIUM:  { cls: 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border border-amber-300', icon: '⭐' },
    ORGANIC:  { cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: '🌿' },
    STANDARD: { cls: 'bg-slate-100 text-slate-700 border border-slate-200', icon: '✅' },
    ECONOMY:  { cls: 'bg-slate-50 text-slate-500 border border-slate-200', icon: '📦' },
  };
  const q = map[quality] || map.STANDARD;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest shadow-sm ${q.cls}`}>
    {q.icon} {quality}
  </span>;
};

export default function ProductList() {
  const navigate   = useNavigate();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [catFilter, setCat]       = useState('');
  const [toast, setToast]         = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/?my_products=true'),
        api.get('/categories/'),
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleActive = async (id, cur) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !cur });
      showToast(`Listing ${!cur ? 'published' : 'hidden'} successfully!`);
      // Update local state instead of full refetch for smoother UX
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !cur } : p));
    } catch (err) { 
      console.error(err);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this listing? This action is permanent.')) return;
    try {
      await api.delete(`/products/${id}/`);
      showToast('Listing purged from ecosystem.');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { 
      showToast('Failed to delete product', 'error');
    }
  };

  const filtered = products.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(s) ||
      p.category_name?.toLowerCase().includes(s) ||
      p.farm_name?.toLowerCase().includes(s);
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.is_active) ||
      (statusFilter === 'INACTIVE' && !p.is_active);
    const matchCat = !catFilter || p.category_name === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Inventory...</span>
    </div>
  );

  const tabs = [
    { key: 'ALL',      label: 'All Matrix', count: products.length },
    { key: 'ACTIVE',   label: 'Published',  count: products.filter(p => p.is_active).length },
    { key: 'INACTIVE', label: 'Hidden',     count: products.filter(p => !p.is_active).length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative z-0">

      {/* Floating Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        {toast && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 'bg-[#22543d] border-emerald-500 text-emerald-50'}`}>
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="text-sm font-black tracking-tight">{toast.msg}</span>
          </div>
        )}
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#22543d] mb-2">
            <Link to="/farmer-dashboard" className="hover:underline">Farmer Hub</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><Package size={12}/> My Listings</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Inventory</h1>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 bg-[#22543d] hover:bg-[#1a402e] text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(34,84,61,0.2)] transition-all hover:-translate-y-1 active:scale-95"
          onClick={() => navigate('/farmer-dashboard/product/new')}
        >
          <Plus size={16} strokeWidth={2.5} /> Inject Listing
        </button>
      </div>

      {/* ── UNIFIED FILTER ARCHITECTURE ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-6 flex flex-col items-stretch xl:flex-row gap-4 xl:items-center w-full">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-xs font-bold text-slate-700 placeholder-slate-400 shadow-inner"
            placeholder="Search catalog by name, category or farm..."
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1" />

        {/* Category Select */}
        <div className="relative w-full xl:w-48">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-xs font-bold text-slate-700 appearance-none cursor-pointer shadow-inner"
            value={catFilter}
            onChange={e => setCat(e.target.value)}
          >
            <option value="">Global Category</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1" />

        {/* Status Tab Group */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl overflow-x-auto hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === t.key ? 'bg-white text-[#22543d] shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label} <span className={`px-2 py-0.5 rounded-md text-[9px] ${statusFilter === t.key ? 'bg-[#22543d]/10 text-[#22543d]' : 'bg-slate-200 text-slate-600'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-black text-slate-400 mb-4 px-1 uppercase tracking-widest flex justify-between items-center">
        <span className="flex items-center gap-2">Matrix Resolution: <span className="text-slate-600">{filtered.length} Object{filtered.length !== 1 ? 's' : ''}</span></span>
        {searchTerm && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1.5"><Search size={10} strokeWidth={3}/> Query Engine Active</span>}
      </div>

      {/* ── ZERO-SCROLL DATA GRID ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner text-slate-300">
            <Package size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight uppercase">Void Sector Detected</h2>
          <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs leading-relaxed">No data parameters in the current registry match your selection criteria.</p>
          {(searchTerm || catFilter || statusFilter !== 'ALL') ? (
            <button className="bg-white border border-slate-200 hover:border-slate-400 text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95" onClick={() => { setSearch(''); setCat(''); setStatus('ALL'); }}>
              Reset Engine Parameters
            </button>
          ) : (
            <button className="bg-[#22543d] border border-[#1a402e] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-[#1a402e] transition-all transform active:scale-95" onClick={() => navigate('/farmer-dashboard/product/new')}>
              Initialize New Listing
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_15px_40px_rgb(0,0,0,0.04)] overflow-hidden relative w-full">
          <div className="w-full max-w-full overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[1100px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-[9px] tracking-widest font-black border-b border-slate-100">
                  <th className="px-6 py-4 w-72 truncate">Listing Registry</th>
                  <th className="px-6 py-4 w-36 truncate">Classification</th>
                  <th className="px-6 py-4 w-44 truncate">Production Origin</th>
                  <th className="px-6 py-4 w-36 truncate text-right">Unit Val (DZD)</th>
                  <th className="px-6 py-4 w-28 truncate text-right">Inventory</th>
                  <th className="px-6 py-4 w-36 truncate">Quality Spec</th>
                  <th className="px-6 py-4 w-32 truncate">Deployment</th>
                  <th className="px-6 py-4 w-36 truncate text-right pr-8">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group ${!p.is_active ? 'opacity-70 bg-slate-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center shadow-sm">
                          {p.image ? (
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <Leaf size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-xs text-slate-900 truncate" title={p.title}>{p.title}</div>
                          <PriceCompBadge comparison={p.official_price_comparison} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200/50 truncate max-w-full">
                        {p.category_name || 'UNDEF'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-extrabold text-[#22543d] flex items-center gap-1.5 truncate" title={p.farm_name}>
                        <Home size={10} className="text-emerald-500" /> {p.farm_name || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-slate-900 text-xs truncate w-full tracking-tight">{Number(p.price).toLocaleString()}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">DZD / {p.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-black text-xs flex justify-end items-center gap-1.5 ${p.stock < 10 ? 'text-red-600' : 'text-slate-800'}`}>
                        {p.stock}
                        {p.stock < 10 && <AlertCircle size={10} className="animate-pulse" />}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{p.unit}S</div>
                    </td>
                    <td className="px-6 py-4 truncate">
                      <QualityBadge quality={p.quality} />
                    </td>
                    <td className="px-6 py-4">
                      {p.is_active ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[9px] tracking-widest bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> PUBLISHED
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-slate-500 font-black text-[9px] tracking-widest bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <EyeOff size={10} strokeWidth={3} /> HIDDEN
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110 shadow-sm border ${p.is_active ? 'bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:border-amber-200' : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'}`}
                          title={p.is_active ? 'Hide Listing' : 'Publish Listing'}
                          onClick={() => toggleActive(p.id, p.is_active)}
                        >
                          {p.is_active ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                        </button>
                        <button
                          className="w-9 h-9 flex items-center justify-center bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all hover:scale-110 shadow-sm"
                          title="Edit Configuration"
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                        >
                          <Edit3 size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          className="w-9 h-9 flex items-center justify-center bg-white text-red-400 hover:text-white hover:bg-red-500 border border-slate-200 hover:border-red-500 rounded-xl transition-all hover:scale-110 shadow-sm"
                          title="Purge Listing"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
