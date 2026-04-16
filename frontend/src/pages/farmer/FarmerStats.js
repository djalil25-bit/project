import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, DollarSign, ListOrdered, Sprout,
  Award, BarChart2, ChevronRight, AlertCircle, Leaf, Tractor, ArrowLeft
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* ── Custom premium tooltip ─────────────────────────────── */
const AgriTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a402e] rounded-xl px-4 py-3 shadow-[0_10px_25px_rgba(26,74,46,0.5)] min-w-[130px] border border-emerald-500/20">
      <div className="text-white/60 mb-1 font-bold text-xs uppercase tracking-widest">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-white font-black text-sm">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {p.name === 'Revenue' ? ' DZD' : ''}
        </div>
      ))}
    </div>
  );
};

const AREA_GRAD = 'fRevArea';
const BAR_GRAD  = 'fOrderBar';

export default function FarmerStats() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboards/farmer-analytics/?timeframe=${timeframe}`)
      .then(res => { setData(res.data); setError(null); })
      .catch(() => setError('Failed to load analytics data.'))
      .finally(() => setLoading(false));
  }, [timeframe]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Computing Aggregates...</span>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-sm">
        <AlertCircle size={24} /> {error}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-16 animate-fade-in relative z-0">

      {/* ── BREADCRUMBS & HEADER ───────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#22543d] mb-4">
            <button onClick={() => navigate('/farmer-dashboard')} className="hover:underline hover:text-[#1a402e] flex items-center gap-1 transition-colors"><ArrowLeft size={12}/> Back to Dashboard</button>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><BarChart2 size={12}/> Yield Analytics</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-1">
            <TrendingUp size={28} className="text-[#22543d]" strokeWidth={2.5} /> Sales &amp; Revenue Analytics
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
            Track farm performance, review localized revenue trends, and identify high-yield products across specified periods.
          </p>
        </div>
        
        {/* Timeframe Toggles */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {[
            { key: 'all',   label: 'All Time'   },
            { key: 'year',  label: 'This Year'  },
            { key: 'month', label: 'This Month' },
          ].map(t => (
            <button
              key={t.key}
              className={`whitespace-nowrap px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${timeframe === t.key ? 'bg-white text-[#22543d] shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setTimeframe(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: <DollarSign size={24} />, color: 'emerald', val: `${(data?.total_revenue || 0).toLocaleString()} DZD`, label: 'Total Gross Revenue' },
          { icon: <ListOrdered size={24} />, color: 'blue', val: data?.total_orders || 0, label: 'Confirmed Transactions' },
          { icon: <Tractor size={24} />, color: 'amber', val: data?.best_farms?.length || 0, label: 'Top-Yielding Sectors' },
          { icon: <Sprout size={24} />, color: 'indigo', val: data?.best_products?.length || 0, label: 'High-Demand Varieties' },
        ].map((k, i) => {
          const bgMap = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            amber: 'bg-amber-50 text-amber-600 border-amber-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          };
          return (
            <div key={i} className={`flex items-center gap-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${bgMap[k.color]}`}>
                {k.icon}
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight mb-0.5">{k.val}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CHARTS ROW ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        
        {/* Revenue Trend Area */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#22543d]" strokeWidth={3} /> Revenue Trend Vector
            </h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">Periodic</span>
          </div>

          <div className="w-full h-[300px]">
            {data?.revenue_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={AREA_GRAD} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#22543d" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22543d" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={45} dx={-10} />
                  <Tooltip content={<AgriTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#22543d" strokeWidth={3} fill={`url(#${AREA_GRAD})`}
                    dot={{ r: 4, fill: '#22543d', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">Insufficient temporal data to render vector.</div>
            )}
          </div>
        </div>

        {/* Orders Bar */}
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ListOrdered size={20} className="text-[#22543d]" strokeWidth={3} /> Transaction Volume
            </h3>
          </div>

          <div className="w-full h-[300px]">
            {data?.orders_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.orders_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={BAR_GRAD} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#22543d" stopOpacity={1} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} allowDecimals={false} width={45} />
                  <Tooltip content={<AgriTooltip />} cursor={{ fill: 'rgba(34,84,61,0.05)' }} />
                  <Bar dataKey="orders" name="Orders" fill={`url(#${BAR_GRAD})`} radius={[6,6,0,0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm flex-col gap-2">
                <BarChart2 size={32} className="text-slate-200" />
                No transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RANKINGS ROW ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Top Farms */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award size={20} className="text-amber-500" strokeWidth={3} /> Top Yielding Nodes
            </h3>
            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200">By Gross Value</span>
          </div>
          
          <div className="space-y-4">
            {data?.best_farms?.length > 0 ? (
              data.best_farms.map((f, i) => (
                <div key={f.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-500' : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 border border-slate-400' : i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 border-amber-800' : 'bg-slate-200 text-slate-500'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 truncate">{f.name}</div>
                    <div className="text-xs font-bold text-slate-500 mt-0.5">{f.orders} Confirmed Shipments</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-[#22543d] mb-1">{f.revenue.toLocaleString()} <span className="text-[9px] uppercase tracking-widest">DZD</span></div>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-auto">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((f.revenue / (data.best_farms[0]?.revenue || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-100 rounded-2xl">Awaiting node optimization data.</div>
            )}
          </div>
        </div>

        {/* Best Products */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Leaf size={20} className="text-emerald-500" strokeWidth={3} /> High-Velocity Products
            </h3>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">By Liquid Volume</span>
          </div>
          
          <div className="space-y-4">
            {data?.best_products?.length > 0 ? (
              data.best_products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm ${i === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-500' : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 border border-slate-400' : i === 2 ? 'bg-gradient-to-br from-emerald-700 to-emerald-800 border-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs font-bold text-slate-500 mt-0.5">{p.qty} Global Units Liquidated</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-[#22543d] mb-1">{p.revenue.toLocaleString()} <span className="text-[9px] uppercase tracking-widest">DZD</span></div>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-auto">
                      <div className="h-full bg-gradient-to-r from-[#22543d] to-emerald-400 rounded-full" style={{ width: `${Math.min((p.qty / (data.best_products[0]?.qty || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-100 rounded-2xl">Awaiting liquidity parameters.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
