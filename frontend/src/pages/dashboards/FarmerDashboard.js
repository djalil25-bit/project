import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Sprout, TrendingUp, Clock, DollarSign,
  Package, ChevronRight, CheckCircle, ExternalLink, ListOrdered,
  BadgeCheck, ShoppingBag, Activity, AlertTriangle, CloudSun, Target
} from 'lucide-react';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-GB');
}

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboards/farmer-stats/')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Data...</span>
    </div>
  );

  const recent = stats?.recent_pending_orders || [];

  const kpis = stats ? [
    {
      icon: <Sprout size={28} strokeWidth={2.5} className="text-white drop-shadow-sm" />,
      bgIconCls: 'bg-emerald-500 shadow-emerald-500/30',
      value: stats.my_products_count,
      label: 'Active Listings',
      micro: 'Products on marketplace',
    },
    {
      icon: <ShoppingBag size={28} strokeWidth={2.5} className="text-white drop-shadow-sm" />,
      bgIconCls: 'bg-amber-500 shadow-amber-500/30',
      value: stats.pending_orders,
      label: 'Pending Orders',
      micro: 'Awaiting your confirmation',
    },
    {
      icon: <TrendingUp size={28} strokeWidth={2.5} className="text-white drop-shadow-sm" />,
      bgIconCls: 'bg-blue-500 shadow-blue-500/30',
      value: stats.total_items_sold,
      label: 'Units Sold',
      micro: 'Total across all products',
    },
    {
      icon: <DollarSign size={28} strokeWidth={2.5} className="text-white drop-shadow-sm" />,
      bgIconCls: 'bg-emerald-700 shadow-emerald-700/30',
      value: null,
      rawRevenue: stats.total_revenue,
      label: 'Total Revenue',
      micro: 'All confirmed orders',
    },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative z-0">

      {/* ── HERO WIDGET ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#22543d] via-[#1a402e] to-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(34,84,61,0.35)] text-white p-6 lg:p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#22543d] rounded-full blur-2xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-sm">
              <BadgeCheck size={14} /> Certified Producer Workspace
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
              Welcome back, Farmer.
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl font-medium leading-relaxed mb-8 max-w-2xl">
              Manage your agricultural operations, track your sales directly with buyers, and optimize your listings based on official Ministry data.
            </p>
            
            {/* Quick Actions Strip inside Hero */}
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/farmer-dashboard/product/new')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 duration-300">
                <Plus size={18} strokeWidth={3} /> Add New Listing
              </button>
              <button onClick={() => navigate('/farmer-dashboard/stats')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-extrabold backdrop-blur-md transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 duration-300">
                <TrendingUp size={18} strokeWidth={3} /> View Analytics
              </button>
            </div>
          </div>

          {/* Intelligence Column */}
          <div className="w-full lg:w-80 bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shrink-0 group hover:bg-white/10 transition-colors duration-500">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <CloudSun size={18} strokeWidth={2.5} /> Market Intel
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-slate-300 font-bold">Farm Status</span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-lg flex items-center gap-1.5 border border-emerald-500/30"><Activity size={12}/> Operational</span>
              </div>
              <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-slate-300 font-bold">Market Signal</span>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-lg flex items-center gap-1.5 border border-amber-500/30"><Target size={12}/> High Demand</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID (GLASSMORPHISM) ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k, i) => (
            <div 
              key={i} 
              className="group flex flex-col justify-between bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(34,84,61,0.08)] hover:border-[#22543d]/30 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform hover:-translate-y-2 cursor-pointer relative overflow-hidden"
              onClick={() => {
                if (k.label === 'Active Listings') navigate('/farmer-dashboard/products');
                if (k.label === 'Pending Orders') navigate('/farmer/orders?status=PENDING');
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${k.bgIconCls} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {k.icon}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">{k.label}</div>
              </div>
              
              <div className="relative z-10 w-full overflow-hidden">
                <div className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm flex items-end gap-1 w-full truncate" title={k.rawRevenue != null ? k.rawRevenue : k.value}>
                  {k.rawRevenue != null && k.rawRevenue !== undefined
                    ? <><span className="truncate max-w-full inline-block overflow-hidden text-ellipsis">{parseFloat(k.rawRevenue || 0).toLocaleString()}</span> <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 shrink-0">DZD</span></>
                    : <span className="truncate max-w-full inline-block overflow-hidden text-ellipsis">{k.value}</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── SMART INSIGHT MODULES ─────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Activity size={22} strokeWidth={2.5} className="text-[#22543d]" /> System Status
          </h2>
          
          <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 ease-out"><Activity size={80} /></div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Operational Metrics</h4>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-600">Action Required</span>
                <span className="text-sm font-black text-white bg-amber-500 px-3 py-1 rounded-lg border border-amber-600 shadow-sm">{stats?.pending_orders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Active Products</span>
                <span className="text-sm font-black text-white bg-[#22543d] px-3 py-1 rounded-lg border border-[#1a402e] shadow-sm">{stats?.my_products_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={64} /></div>
            <h4 className="text-sm font-extrabold text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
              <AlertTriangle size={18} strokeWidth={2.5} /> Urgent Actions
            </h4>
            <div className="relative z-10">
              {stats?.pending_orders > 0 ? (
                <p className="text-sm text-amber-900 font-medium leading-relaxed">
                  You have <strong className="font-black bg-amber-200 px-1 rounded">{stats.pending_orders} pending orders</strong> awaiting your approval. Promptly confirming orders ensures logistics flow smoothly.
                </p>
              ) : (
                <p className="text-sm text-emerald-800 font-bold leading-relaxed flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600"/> All operational checks are green. You are fully caught up today.
                </p>
              )}
              <button 
                onClick={() => navigate('/farmer/orders?status=PENDING')}
                className="mt-5 w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 active:scale-95 duration-200 flex justify-center items-center gap-2"
              >
                Review Pending Intel <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* ── RECENT PENDING ORDERS ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Clock size={22} strokeWidth={2.5} className="text-[#22543d]" /> Recent Activity
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-2 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">last 24h</span>
            </h2>
            <button
              className="text-xs font-black uppercase tracking-widest text-[#22543d] hover:text-[#1a402e] flex items-center transition-all hover:bg-emerald-50 px-3 py-1.5 rounded-lg"
              onClick={() => navigate('/farmer/orders?status=PENDING')}
            >
              Full Log <ChevronRight size={14} className="ml-1" strokeWidth={3} />
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm transform hover:rotate-12 transition-transform duration-500">
                  <CheckCircle size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">All clear!</h3>
                <p className="text-slate-500 font-medium max-w-sm mb-8">No new pending orders detected in the matrix. Enjoy your well-earned break.</p>
                <button className="px-8 py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 text-slate-700 font-extrabold rounded-xl transition-all shadow-sm transform hover:-translate-y-0.5 active:scale-95 flex gap-2 items-center" onClick={() => navigate('/farmer/orders')}>
                  <ListOrdered size={16} /> Open Complete Registry
                </button>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-[#22543d] text-emerald-100 uppercase text-[10px] tracking-widest font-black">
                      <th className="px-4 py-3 w-32 truncate">Ref Code</th>
                      <th className="px-4 py-3 w-48 truncate">Buyer Identity</th>
                      <th className="px-4 py-3 w-32 truncate text-right">Value</th>
                      <th className="px-4 py-3 w-32 truncate text-center">Time</th>
                      <th className="px-4 py-3 w-20 truncate text-right">Op</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map(o => {
                      const localNum = o.farmer_order_number
                        ? `F-${String(o.farmer_order_number).padStart(3, '0')}`
                        : String(o.id);
                      return (
                        <tr key={o.id} className="hover:bg-emerald-50/50 transition-colors duration-300 group cursor-pointer" onClick={() => navigate('/farmer/orders?status=PENDING')}>
                          <td className="px-4 py-3 border-l-4 border-transparent group-hover:border-[#22543d]">
                            <span className="font-black text-[#22543d] text-sm">#{localNum}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22543d] to-[#1a402e] text-white flex items-center justify-center font-black text-xs shadow-md border border-[#1a402e]">
                                {o.buyer_name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="font-extrabold text-xs text-slate-800 truncate">{o.buyer_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-black text-slate-800 text-sm">{o.total?.toLocaleString()}</span>
                            <span className="text-slate-400 text-[10px] font-black uppercase ml-1">DZD</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                            {timeAgo(o.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex p-2 bg-slate-50 text-slate-400 group-hover:bg-[#22543d] group-hover:text-white rounded-lg transition-all duration-300 shadow-sm border border-slate-100 group-hover:border-[#1a402e]">
                              <ChevronRight size={14} strokeWidth={3} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
