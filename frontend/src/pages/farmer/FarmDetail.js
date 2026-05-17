import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Home, MapPin, Maximize2, Package, ShoppingCart,
  Plus, Edit3, ChevronRight, Trophy,
  Eye, EyeOff, Edit, Leaf, Calendar
} from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #1a4a2e 0%, #4a7c59 100%)',
  'linear-gradient(135deg, #2d5a27 0%, #6aab5e 100%)',
  'linear-gradient(135deg, #3a5a40 0%, #7aab6a 100%)',
  'linear-gradient(135deg, #2e4a1e 0%, #5a8c3e 100%)',
  'linear-gradient(135deg, #1e3a2e 0%, #3a7a5a 100%)',
];

const QualityBadge = ({ quality }) => {
  const map = {
    PREMIUM:  'f-badge f-badge-premium',
    ORGANIC:  'f-badge f-badge-organic',
    STANDARD: 'f-badge f-badge-standard',
    ECONOMY:  'f-badge f-badge-economy',
  };
  return <span className={map[quality] || 'f-badge f-badge-standard'}>{quality || 'Standard'}</span>;
};

export default function FarmDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [farm, setFarm]       = useState(null);
  const [stats, setStats]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [farmRes, prodRes] = await Promise.all([
          api.get(`/farms/${id}/`),
          api.get(`/products/?my_products=true&farm=${id}`),
        ]);
        setFarm(farmRes.data);
        setProducts(prodRes.data.results || prodRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/farms/${id}/stats/?timeframe=${timeframe}`)
      .then(res => setStats(res.data))
      .catch(console.error);
  }, [id, timeframe]);

  const toggleProduct = async (pid, cur) => {
    await api.patch(`/products/${pid}/`, { is_active: !cur });
    const prodRes = await api.get(`/products/?my_products=true&farm=${id}`);
    setProducts(prodRes.data.results || prodRes.data);
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading farm…</span>
    </div>
  );
  if (!farm) return (
    <div className="f-card">
      <div className="f-empty-state">
        <div className="f-empty-icon"><Home size={32} /></div>
        <div className="f-empty-title">Farm not found</div>
      </div>
    </div>
  );

  const initials = farm.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gradient = GRADIENTS[farm.id % GRADIENTS.length];

  const statCards = [
    { icon: <Package size={20} />, color: 'green', val: stats?.product_count ?? products.length, label: 'Listed Products' },
    { icon: <ShoppingCart size={20} />, color: 'blue', val: stats?.order_count ?? '—', label: 'Orders Received' },
    { icon: <span className="font-black text-sm">DZ</span>, color: 'gold', val: stats ? <>{parseFloat(stats.revenue).toLocaleString()}<small>DZD</small></> : '—', label: 'Revenue' },
  ];

  return (
    <div className="farmer-page-wrapper">

      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <Link to="/farmer-dashboard/farms" className="hover:text-[#255933] transition-colors">Farms Registry</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
          {farm.name}
        </span>
      </div>

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.1)] mb-10 group">
        <div className="h-[320px] relative">
          {farm.image ? (
            <img src={farm.image} alt={farm.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
          ) : (
            <div style={{ background: gradient }} className="w-full h-full flex items-center justify-center">
              <span className="text-7xl font-black text-white/30 tracking-tighter">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#2E6F40] text-white px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-4 shadow-lg border border-white/20">
                <Home size={10} strokeWidth={3} /> Certified Node
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">
                {farm.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-400" strokeWidth={3} />
                  <span className="text-xs font-black uppercase tracking-widest">{farm.location}</span>
                </div>
                {farm.size_hectares && (
                  <div className="flex items-center gap-2 border-l border-white/20 pl-6">
                    <Maximize2 size={14} className="text-emerald-400" strokeWidth={3} />
                    <span className="text-xs font-black tracking-widest uppercase">{farm.size_hectares} Hectares</span>
                  </div>
                )}
                <div className="flex items-center gap-2 border-l border-white/20 pl-6">
                  <Calendar size={14} className="text-blue-400" strokeWidth={3} />
                  <span className="text-xs font-black tracking-widest uppercase">Registry: {new Date(farm.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
              >
                <Edit3 size={14} className="inline mr-2" strokeWidth={3} /> Edit Asset
              </button>
              <button 
                onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}
                className="px-6 py-3 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_10px_30px_rgba(46,111,64,0.4)] border-0"
              >
                <Plus size={14} className="inline mr-2" strokeWidth={3} /> Add Product
              </button>
            </div>
          </div>
        </div>
        {farm.description && (
          <div className="bg-white px-10 py-6 border-t border-slate-100">
            <p className="text-slate-500 font-medium text-sm leading-relaxed italic">
              "{farm.description}"
            </p>
          </div>
        )}
      </div>

      {/* ── PERFORMANCE HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-10">
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Trophy size={14} className="text-[#2E6F40]" strokeWidth={3}/> Node Performance
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-6">Operational analytics and order volume</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
          {[
            ['all','ALL TIME'],
            ['year','THIS YEAR'],
            ['month','THIS MONTH']
          ].map(([k, l]) => (
            <button
              key={k}
              className={`px-5 py-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${timeframe === k ? 'bg-[#2E6F40] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setTimeframe(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="f-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.75rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="f-kpi-card">
            <div className={`f-kpi-icon ${s.color}`}>{s.icon}</div>
            <div className="f-kpi-body">
              <div className="f-kpi-value">{s.val}</div>
              <div className="f-kpi-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── PRODUCTS TABLE ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden mb-10 mt-10">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-[#f0faf4] rounded-lg text-[#2E6F40] border border-[#cee8d9]">
                <Leaf size={16} strokeWidth={2.5} />
              </div>
              Inventory of <span className="text-[#2E6F40]">This Node</span>
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Marketplace availability protocol</p>
          </div>
          <span className="bg-[#2E6F40] text-white font-black tracking-widest uppercase px-3 py-1 rounded-full text-[9px] shadow-sm">
            {products.length} SKU{products.length !== 1 ? 's' : ''} Listed
          </span>
        </div>

        {products.length === 0 ? (
          <div className="p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No active listings</h3>
            <p className="text-xs font-medium text-slate-400 max-w-xs mb-8">Register your first product to begin marketplace operations.</p>
            <button 
              className="inline-flex items-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
              onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}
            >
              <Plus size={16} strokeWidth={3} /> Initialize Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2E6F40] text-[#cee8d9] uppercase text-[9px] font-black tracking-[0.2em]">
                  <th className="px-8 py-4">Product Registry</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4 text-right">Market Valuation</th>
                  <th className="px-8 py-4 text-right">Stock</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                  <tr key={p.id} className="bg-white hover:bg-[#f0faf4]/40 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-[11px] text-slate-800 tracking-tight uppercase">{p.title}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5"><QualityBadge quality={p.quality} /></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">{p.category_name}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-black text-[11px] text-slate-900 tabular-nums">
                        {p.price} <span className="text-[9px] text-slate-400 uppercase ml-1">DZD / {p.unit}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className={`font-black text-[11px] tabular-nums ${p.stock < 10 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                        {p.stock} <span className="text-[9px] text-slate-400 uppercase ml-1">{p.unit}S</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${p.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        <div className={`w-1 h-1 rounded-full ${p.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                        {p.is_active ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleProduct(p.id, p.is_active)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-90 border ${p.is_active ? 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                        >
                          {p.is_active ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                        </button>
                        <button 
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                          className="w-9 h-9 flex items-center justify-center bg-white text-[#2E6F40] border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all active:scale-90"
                        >
                          <Edit size={14} strokeWidth={2.5} />
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

      {/* Top products ranking */}
      {stats?.best_products?.length > 0 && (
        <div className="f-chart-card">
          <div className="f-chart-header">
            <div className="f-chart-title"><Trophy size={15} style={{ color: 'var(--f-gold)' }} /> Top Selling Products</div>
          </div>
          {stats.best_products.map((bp, i) => (
            <div key={bp.id} className="f-ranking-item">
              <div className={`f-rank-badge ${i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rn'}`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div className="f-rank-name">{bp.name}</div>
                <div className="f-rank-sub">{bp.qty} units sold</div>
              </div>
              <div className="f-rank-value">
                <div className="f-rank-rev">{bp.revenue.toLocaleString()} DZD</div>
                <div className="f-rank-bar-wrap">
                  <div className="f-rank-bar" style={{ width: `${Math.min((bp.revenue / (stats.best_products[0]?.revenue || 1)) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
