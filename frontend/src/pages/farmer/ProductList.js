import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Leaf, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Tag, AlertCircle, CheckCircle, Package, 
  ArrowUpRight, ArrowDownRight, Minus, Home, 
  Layers, ShoppingBag, TrendingUp, BarChart3, Filter
} from 'lucide-react';

const PriceCompBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'above') return (
    <div className="f-price-above" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
      <ArrowUpRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  if (status === 'below') return (
    <div className="f-price-below" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
      <ArrowDownRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  return (
    <div className="f-badge-standard" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.25rem' }}>
      Avg
    </div>
  );
};

const QualityBadge = ({ quality }) => {
  const qClass = {
    PREMIUM:  'f-badge-premium',
    ORGANIC:  'f-badge-organic',
    STANDARD: 'f-badge-standard',
    ECONOMY:  'f-badge-economy',
  }[quality] || 'f-badge-standard';

  const icon = {
    PREMIUM:  '⭐',
    ORGANIC:  '🌿',
    STANDARD: '✅',
    ECONOMY:  '📦',
  }[quality] || '✅';

  return (
    <span className={`f-badge ${qClass}`}>
      {icon} {quality}
    </span>
  );
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
      showToast(`Product ${!cur ? 'published' : 'hidden'} successfully!`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !cur } : p));
    } catch (err) { 
      console.error(err);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This action is permanent.')) return;
    try {
      await api.delete(`/products/${id}/`);
      showToast('Product removed successfully.');
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

  // Calculate KPIs
  const kpis = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    lowStock: products.filter(p => p.stock < 10).length,
    totalValue: products.reduce((acc, p) => acc + (parseFloat(p.price) * p.stock), 0)
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Syncing Inventory Registry...</span>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`f-alert f-alert-${toast.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, boxShadow: 'var(--f-shadow-hover)', minWidth: '300px' }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <div>{toast.msg}</div>
        </div>
      )}

      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5">
          <Package size={11} /> Product Inventory
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
              <Layers size={22} strokeWidth={2.5} />
            </div>
            Marketplace Inventory
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Manage and monitor your agricultural product registry.</p>
        </div>
        
        <button 
          className="inline-flex items-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 border-0"
          onClick={() => navigate('/farmer-dashboard/product/new')}
        >
          <Plus size={16} strokeWidth={3} /> Register New Product
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
            <Package size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.total}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total SKUs</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.active}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Published LIVE</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${kpis.lowStock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${kpis.lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{kpis.lowStock}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Stock Alerts</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight truncate max-w-[120px]">{Math.round(kpis.totalValue).toLocaleString()}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Inventory Value <small className="text-[8px] opacity-70">DZD</small></div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 flex flex-col xl:flex-row gap-2 xl:items-center overflow-hidden">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E6F40] transition-colors" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40]/20 transition-all text-[10px] font-black text-slate-700 placeholder-slate-400 uppercase tracking-widest"
            placeholder="Search by product name, category or farm..."
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-100 mx-2" />

        <div className="flex items-center gap-2">
          <div className="relative">
            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              className="pl-8 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#2E6F40]/20 appearance-none cursor-pointer min-w-[160px]"
              value={catFilter}
              onChange={e => setCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto hide-scrollbar">
            <button 
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-white text-[#2E6F40] shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setStatus('ALL')}
            >
              All ({products.length})
            </button>
            <button 
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ACTIVE' ? 'bg-white text-[#2E6F40] shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setStatus('ACTIVE')}
            >
              Live ({kpis.active})
            </button>
            <button 
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'INACTIVE' ? 'bg-white text-[#2E6F40] shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setStatus('INACTIVE')}
            >
              Hidden ({kpis.total - kpis.active})
            </button>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-[#2E6F40] text-[#cee8d9] uppercase text-[9px] font-black tracking-widest">
                <th className="px-6 py-4">Product Identity</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Farm Origin</th>
                <th className="px-6 py-4 text-right">Unit Pricing</th>
                <th className="px-6 py-4 text-right">Inventory</th>
                <th className="px-6 py-4 text-center">Lifecycle</th>
                <th className="px-6 py-4 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="f-empty-state">
                      <div className="f-empty-icon"><Package size={40} /></div>
                      <div className="f-empty-title">No matching products found</div>
                      <div className="f-empty-sub">Adjust your search or filters to see your inventory items.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="bg-white hover:bg-[#f0faf4]/40 transition-colors group border-b border-slate-50 last:border-b-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <Leaf size={16} className="text-[#2E6F40]" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-[11px] text-slate-800 tracking-tight uppercase">{p.title}</div>
                          <PriceCompBadge comparison={p.official_price_comparison} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">
                        {p.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#2E6F40] uppercase tracking-tight">
                        <Home size={12} strokeWidth={2.5} /> {p.farm_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-[11px] text-slate-900 tabular-nums">{Number(p.price).toLocaleString()} <span className="text-[9px] text-slate-400 font-bold uppercase">DZD</span></div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">PER {p.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`flex items-center justify-end gap-1.5 font-black text-[11px] tabular-nums ${p.stock < 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.stock} <span className="text-[9px] text-slate-400 uppercase">{p.unit}S</span>
                        {p.stock < 10 && <AlertCircle size={10} />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                          <EyeOff size={10} /> Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 border ${p.is_active ? 'bg-white text-amber-500 border-slate-200 hover:bg-amber-50 hover:border-amber-200' : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'}`}
                          title={p.is_active ? 'Hide from Market' : 'Publish to Market'}
                          onClick={() => toggleActive(p.id, p.is_active)}
                        >
                          {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Edit Details"
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-white text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Remove Product"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 size={14} />
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
  );
}
