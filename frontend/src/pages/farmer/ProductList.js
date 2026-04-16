import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Leaf, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Tag, AlertCircle, CheckCircle, Package, ArrowUpRight, ArrowDownRight, Minus
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

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (id, cur) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !cur });
      fetchData();
    } catch { alert('Failed to update status'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this listing? This action is permanent.')) return;
    try {
      await api.delete(`/products/${id}/`);
      fetchData();
    } catch { alert('Failed to delete product'); }
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
          className="inline-flex items-center justify-center gap-2 bg-[#22543d] hover:bg-[#1a402e] text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(34,84,61,0.3)] transition-transform hover:-translate-y-1"
          onClick={() => navigate('/farmer-dashboard/product/new')}
        >
          <Plus size={16} strokeWidth={2.5} /> Inject Listing
        </button>
      </div>

      {/* ── UNIFIED FILTER ARCHITECTURE ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm mb-6 flex flex-col items-stretch xl:flex-row gap-4 xl:items-center w-full">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-xs font-semibold text-slate-700 placeholder-slate-400"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1" />

        {/* Category Select */}
        <div className="relative w-full xl:w-48">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-xs font-bold text-slate-700 appearance-none cursor-pointer"
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
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${statusFilter === t.key ? 'bg-white text-[#22543d] shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label} <span className={`px-1 py-0.5 rounded text-[9px] ${statusFilter === t.key ? 'bg-[#22543d]/10' : 'bg-slate-200'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest flex justify-between items-center">
        <span>Matrix Resolution: {filtered.length} Object{filtered.length !== 1 ? 's' : ''}</span>
        {searchTerm && <span className="text-amber-500 flex items-center gap-1"><Search size={12}/> Filter Engine Active</span>}
      </div>

      {/* ── ZERO-SCROLL DATA GRID ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package size={32} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-black text-slate-800 mb-2">Void Sector</h2>
          <p className="text-slate-500 text-sm font-medium mb-4">No parameters match your current filters.</p>
          {(searchTerm || catFilter || statusFilter !== 'ALL') ? (
            <button className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors" onClick={() => { setSearch(''); setCat(''); setStatus('ALL'); }}>
              Reset Engine
            </button>
          ) : (
            <button className="bg-[#22543d] border border-[#22543d] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-[#1a402e] transition-colors" onClick={() => navigate('/farmer-dashboard/product/new')}>
              Deploy Source Listing
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative w-full">
          <div className="w-full max-w-full overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[1000px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#22543d] text-emerald-100 uppercase text-[10px] tracking-widest font-black">
                  <th className="px-4 py-3 w-64 truncate">Node Spec</th>
                  <th className="px-4 py-3 w-32 truncate">Class</th>
                  <th className="px-4 py-3 w-40 truncate">Origin Base</th>
                  <th className="px-4 py-3 w-32 truncate text-right">Val (DZD)</th>
                  <th className="px-4 py-3 w-24 truncate text-right">Vol</th>
                  <th className="px-4 py-3 w-32 truncate">Quality</th>
                  <th className="px-4 py-3 w-32 truncate">State</th>
                  <th className="px-4 py-3 w-32 truncate text-right">Op</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-2.5">
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
                    <td className="px-3 py-2.5">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200 truncate max-w-full">
                        {p.category_name || 'UNDEF'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[10px] font-extrabold text-[#22543d] truncate" title={p.farm_name}>
                        {p.farm_name || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-black text-slate-800 text-xs truncate w-full">{p.price}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">/{p.unit}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className={`font-black text-xs flex justify-end items-center gap-1 ${p.stock < 10 ? 'text-red-600' : 'text-slate-800'}`}>
                        {p.stock}
                        {p.stock < 10 && <AlertCircle size={10} className="animate-pulse" />}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{p.unit}S</div>
                    </td>
                    <td className="px-3 py-2.5 truncate">
                      <QualityBadge quality={p.quality} />
                    </td>
                    <td className="px-3 py-2.5">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-[9px] tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <CheckCircle size={10} strokeWidth={3} /> LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-black text-[9px] tracking-widest bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          <EyeOff size={10} strokeWidth={3} /> HIDDEN
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-transform hover:scale-110 shadow-sm ${!p.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 border border-slate-200'}`}
                          title={p.is_active ? 'Halt Listing' : 'Publish Listing'}
                          onClick={() => toggleActive(p.id, p.is_active)}
                        >
                          {p.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center bg-slate-50 text-[#22543d] hover:bg-emerald-100 border border-slate-200 hover:border-[#22543d]/30 rounded-lg transition-transform hover:scale-110 shadow-sm"
                          title="Configure"
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center bg-slate-50 text-red-400 hover:text-white hover:bg-red-500 border border-slate-200 hover:border-red-500 rounded-lg transition-transform hover:scale-110 shadow-sm"
                          title="Purge Node"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 size={12} />
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
