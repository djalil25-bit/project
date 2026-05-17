import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ListOrdered, Sprout,
  Award, BarChart2, ChevronRight, AlertCircle, Leaf, Tractor, ArrowLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* ── Custom premium tooltip ─────────────────────────────── */
const AgriTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 rounded-xl px-5 py-4 shadow-xl min-w-[140px] border border-slate-700">
      <div className="text-emerald-400 mb-2 font-black text-[10px] uppercase tracking-widest">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-white font-black text-sm flex items-center justify-between gap-4">
          <span className="text-slate-300">{p.name}</span>
          <span>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            {p.name === 'Revenue' ? ' DZD' : ''}
          </span>
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#2E6F40] animate-spin" />
      <span className="text-xs font-black text-[#2E6F40] uppercase tracking-widest animate-pulse">Aggregating Data...</span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white border border-red-200 text-red-600 p-6 rounded-3xl flex items-center justify-center gap-3 font-bold shadow-sm">
        <AlertCircle size={24} /> {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 animate-fade-in relative z-0 selection:bg-[#a2d4b5]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
          <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
          <ChevronRight size={10} className="text-[#2E6F40]/40" />
          <span className="text-[#2E6F40] flex items-center gap-1.5">
            <BarChart2 size={11} /> Yield Analytics
          </span>
        </div>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              Sales & <span className="text-[#2E6F40]">Revenue Analytics</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
              Track farm performance, review localized revenue trends, and identify high-yield products across specified periods.
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
            {[
              { key: 'all',   label: 'ALL TIME'   },
              { key: 'year',  label: 'THIS YEAR'  },
              { key: 'month', label: 'THIS MONTH' },
            ].map(t => (
              <button
                key={t.key}
                className={`px-5 py-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${timeframe === t.key ? 'bg-[#2E6F40] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
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
            { icon: <span className="font-black text-xl">DZ</span>, val: `${(data?.total_revenue || 0).toLocaleString()}`, suf: ' DZD', label: 'Total Gross Revenue', trend: '+12.5%' },
            { icon: <ListOrdered size={24} />, val: data?.total_orders || 0, label: 'Confirmed Transactions', trend: '+4.2%' },
            { icon: <Tractor size={24} />, val: data?.best_farms?.length || 0, label: 'Top-Yielding Farms', trend: 'Stable' },
            { icon: <Sprout size={24} />, val: data?.best_products?.length || 0, label: 'High-Demand Varieties', trend: '+2 New' },
          ].map((k, i) => (
            <div key={i} className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#2E6F40] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:bg-[#255933] transition-all duration-300">
                    {k.icon}
                  </div>
                  <div className="flex items-center gap-1 bg-[#f0faf4] text-[#2E6F40] text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-[#cee8d9]">
                    {k.trend.includes('+') ? <ArrowUpRight size={12} /> : null}
                    {k.trend}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                    {k.val}
                    {k.suf && <span className="text-base text-slate-400 ml-1 font-bold">{k.suf}</span>}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{k.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          
          {/* Revenue Trend Area */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:border-[#2E6F40]/20 transition-all group">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trend</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Periodic Growth Performance</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f0faf4] flex items-center justify-center text-[#2E6F40] border border-[#cee8d9] shadow-sm">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
            </div>

            <div className="w-full h-[260px]">
              {data?.revenue_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue_trend} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={AREA_GRAD} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2E6F40" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2E6F40" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={38} dx={-6} />
                    <Tooltip content={<AgriTooltip />} cursor={{ stroke: '#2E6F40', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#2E6F40" strokeWidth={3} fill={`url(#${AREA_GRAD})`}
                      dot={{ r: 4, fill: '#fff', strokeWidth: 3, stroke: '#2E6F40' }}
                      activeDot={{ r: 6, fill: '#2E6F40', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No revenue data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Orders Bar */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:border-[#2E6F40]/20 transition-all group">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Transaction Volume</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order Fulfillment Analytics</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                <ListOrdered size={20} strokeWidth={2.5} />
              </div>
            </div>

            <div className="w-full h-[260px]">
              {data?.orders_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.orders_trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={BAR_GRAD} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2E6F40" stopOpacity={1} />
                        <stop offset="100%" stopColor="#255933" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} allowDecimals={false} width={38} />
                    <Tooltip content={<AgriTooltip />} cursor={{ fill: 'rgba(16,185,129,0.04)' }} />
                    <Bar dataKey="orders" name="Orders" fill={`url(#${BAR_GRAD})`} radius={[6,6,0,0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 gap-3">
                  <BarChart2 size={24} className="text-slate-300" />
                  No transactions recorded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RANKINGS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Top Farms */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:border-[#2E6F40]/20 transition-all group">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Yielding Nodes</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ranked by Gross Operational Value</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                <Award size={20} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="space-y-4">
              {data?.best_farms?.length > 0 ? (
                data.best_farms.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl hover:border-[#a2d4b5] hover:shadow-md transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 truncate group-hover:text-[#2E6F40] transition-colors">{f.name}</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">{f.orders} Confirmed Shipments</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 mb-1.5">{f.revenue.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase tracking-widest">DZD</span></div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                        <div className="h-full bg-[#f0faf4]0 rounded-full" style={{ width: `${Math.min((f.revenue / (data.best_farms[0]?.revenue || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">Awaiting node optimization data.</div>
              )}
            </div>
          </div>

          {/* Best Products */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:border-[#2E6F40]/20 transition-all group">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">High-Velocity Products</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ranked by Liquid Market Volume</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f0faf4] flex items-center justify-center text-[#2E6F40] border border-[#cee8d9] shadow-sm">
                <Leaf size={20} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="space-y-4">
              {data?.best_products?.length > 0 ? (
                data.best_products.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl hover:border-[#a2d4b5] hover:shadow-md transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm ${i === 0 ? 'bg-gradient-to-br from-[#2E6F40] to-[#255933]' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : i === 2 ? 'bg-gradient-to-br from-[#1A4024] to-[#112a18]' : 'bg-slate-100 text-slate-400'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 truncate group-hover:text-[#2E6F40] transition-colors">{p.name}</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">{p.qty} Global Units Liquidated</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 mb-1.5">{p.revenue.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase tracking-widest">DZD</span></div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                        <div className="h-full bg-gradient-to-r from-[#4a8c5f] to-[#2E6F40] rounded-full" style={{ width: `${Math.min((p.qty / (data.best_products[0]?.qty || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">Awaiting liquidity parameters.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
