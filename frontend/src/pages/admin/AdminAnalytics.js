import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Package, Activity, AlertCircle, 
  Trophy, Medal, Award, ShoppingCart, Calendar, Filter
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const ROLE_COLORS = {
  'farmer': '#10b981',
  'buyer': '#3b82f6', 
  'transporter': '#f59e0b'
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboards/admin-analytics/?timeframe=${timeframe}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics data. Please ensure the backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="text-amber-400" size={20} />;
      case 1: return <Medal className="text-slate-400" size={20} />;
      case 2: return <Award className="text-emerald-400" size={20} />;
      default: return null;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <div className="adm-spinner"></div>
        <span className="text-slate-500 text-sm">Gathering metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <AlertCircle size={18} /> {error}
      </div>
    );
  }

  const chartTooltipStyle = {
    borderRadius: '10px',
    border: 'none',
    background: '#1e293b',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#e2e8f0',
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <TrendingUp className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">Platform Analytics</h1>
            <p className="text-slate-500 text-sm">Comprehensive overview of platform growth, revenue, and entity distributions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 glass-card-light px-4 py-2.5">
          <Calendar className="text-emerald-400" size={16} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">Interval:</span>
          <select
            className="adm-input border-0 bg-transparent text-emerald-400 font-bold text-sm p-0 focus:ring-0 focus:shadow-none cursor-pointer"
            style={{ width: '120px' }}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {data && (
        <div className="space-y-6">

          {/* ── Top 3 Farmers ───────────────────────────── */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" /> Top 3 Farmers by Sales
              </h3>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Top Producers this period</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.top_farmers?.length > 0 ? data.top_farmers.map((farmer, index) => (
                <div key={farmer.id} className="glass-card-light p-4 anim-scale-in hover:border-emerald-500/25 transition-colors"
                     style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                      {getRankIcon(index)}
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase">Rank #{index + 1}</span>
                  </div>
                  <div className="font-bold text-slate-200 mb-1">{farmer.name}</div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-extrabold text-emerald-400">{farmer.sales.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">DZD</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <ShoppingCart size={11} /> {farmer.orders} Orders
                    </div>
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(farmer.sales / data.top_farmers[0].sales) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-8 text-slate-600 text-sm">No producer data found for this period.</div>
              )}
            </div>
          </div>

          {/* ── Revenue + Role Distribution ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="glass-card p-6 lg:col-span-2">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
                <Activity size={16} className="text-emerald-400" /> Revenue Generation (Monthly)
              </h3>
              <div style={{ width: '100%', height: 280 }}>
                {data.revenue_trend?.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v}`} />
                      <Tooltip formatter={(value) => [`${value} DZD`, 'Revenue']} contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 text-sm">No revenue data available</div>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
                <Users size={16} className="text-blue-400" /> Role Distribution
              </h3>
              <div style={{ width: '100%', height: 240 }}>
                {data.role_distribution?.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.role_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.role_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 text-sm">No role data available</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Top Products + Registrations ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <Package size={16} className="text-emerald-400" /> Top 3 Best-Sellers
                </h3>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Most demanded products</span>
              </div>

              <div className="space-y-2">
                {data.top_products?.length > 0 ? data.top_products.map((product, index) => (
                  <div key={product.id}
                       className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors anim-fade-up"
                       style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="text-2xl font-extrabold text-slate-700 w-8 shrink-0">0{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.quantity.toLocaleString()} units sold</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-400 text-sm">{product.revenue.toLocaleString()} <span className="text-xs text-slate-500">DZD</span></div>
                      <div className="w-16 h-1 bg-slate-700 rounded-full mt-1.5 ml-auto overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(product.revenue / data.top_products[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-slate-600 text-sm">No product sales recorded yet.</div>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
                <Users size={16} className="text-blue-400" /> New Registrations (Monthly)
              </h3>
              <div style={{ width: '100%', height: 280 }}>
                {data.users_trend?.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={data.users_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'rgba(59,130,246,0.07)' }} contentStyle={chartTooltipStyle} />
                      <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 text-sm">No user registration data</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
