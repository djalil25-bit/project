import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, Trophy,
  BarChart2, ChevronRight, AlertCircle, Calendar, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

/* Premium chart color palette */
const CHART_COLORS = ['#1a7a4a', '#2563eb', '#d97706', '#7c3aed', '#ef4444'];
const AREA_GRADIENT_ID = 'revAreaGrad';
const BAR_GRADIENT_ID  = 'orderBarGrad';

/* Custom tooltip */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb',
      borderRadius: 10, padding: '0.65rem 1rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      fontSize: '0.8rem'
    }}>
      <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {p.name === 'Revenue' ? ' DZD' : ''}
        </div>
      ))}
    </div>
  );
};

export default function FarmerStats() {
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
    <div className="flex-center py-5" style={{ gap: '0.75rem' }}>
      <div className="spinner-agr" />
      <span className="text-muted">Loading statistics...</span>
    </div>
  );
  if (error) return (
    <div className="alert-agr alert-agr-danger d-flex align-items-center gap-2">
      <AlertCircle size={16} /> {error}
    </div>
  );

  return (
    <div className="farmer-stats-page animate-fade-in">
      {/* Breadcrumb */}
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Statistics</span>
      </div>

      {/* Page Header */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2">
            <TrendingUp className="text-primary" size={26} /> Sales & Revenue Analytics
          </h1>
          <p className="page-subtitle text-muted">Track your farm performance, revenue trends, and top products.</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white rounded-lg border shadow-sm p-2">
          <Calendar size={15} className="text-primary" />
          <select
            className="form-select form-select-sm border-0 fw-bold text-primary"
            style={{ width: 130, outline: 'none', cursor: 'pointer' }}
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="stats-grid mb-4">
        {[
          { icon: <DollarSign size={20} />, cls: 'stat-icon-green', value: `${(data?.total_revenue || 0).toLocaleString()} DZD`, label: 'Total Revenue' },
          { icon: <ShoppingCart size={20} />, cls: 'stat-icon-blue', value: data?.total_orders || 0, label: 'Total Orders' },
          { icon: <BarChart2 size={20} />, cls: 'stat-icon-amber', value: data?.best_farms?.length || 0, label: 'Active Farms' },
          { icon: <Package size={20} />, cls: 'stat-icon-green', value: data?.best_products?.length || 0, label: 'Selling Products' },
        ].map((s, i) => (
          <div key={i} className={`stat-card stagger-${i + 1} animate-fade-up`}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Revenue Trend — Area Chart */}
        <div className="col-lg-8">
          <div className="chart-card h-100">
            <div className="chart-card-title">
              <TrendingUp size={15} className="text-primary" /> Revenue Trend (DZD)
            </div>
            <div style={{ width: '100%', height: 280 }}>
              {data?.revenue_trend?.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#1a7a4a" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1a7a4a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      width={40}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area
                      type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#1a7a4a" strokeWidth={2.5}
                      fill={`url(#${AREA_GRADIENT_ID})`}
                      dot={{ r: 4, fill: '#1a7a4a', strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 6, fill: '#1a7a4a', stroke: 'white', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty h-100">No revenue data for this period</div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Trend — Bar Chart */}
        <div className="col-lg-4">
          <div className="chart-card h-100">
            <div className="chart-card-title">
              <ShoppingCart size={15} className="text-primary" /> Orders per Period
            </div>
            <div style={{ width: '100%', height: 280 }}>
              {data?.orders_trend?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={data.orders_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2563eb" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      allowDecimals={false} width={30}
                    />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                    <Bar dataKey="orders" name="Orders" fill={`url(#${BAR_GRADIENT_ID})`} radius={[5, 5, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty h-100">No order data for this period</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performing Farms */}
        <div className="col-lg-6">
          <div className="chart-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="chart-card-title mb-0">
                <Trophy size={15} style={{ color: '#d97706' }} /> Top Performing Farms
              </div>
              <span className="very-small text-muted text-uppercase fw-bold">By Revenue</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {data?.best_farms?.length > 0 ? data.best_farms.map((f, i) => (
                <div key={f.id} className="ranking-item animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="rank-number">0{i + 1}</div>
                  <div className="flex-grow-1 ms-2">
                    <div className="fw-bold small">{f.name}</div>
                    <div className="very-small text-muted">{f.orders} orders</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary small">{f.revenue.toLocaleString()} DZD</div>
                    <div className="mt-1" style={{ height: 4, width: 60, background: '#e5e7eb', borderRadius: 4, marginLeft: 'auto' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, background: '#1a7a4a',
                        width: `${Math.min((f.revenue / (data.best_farms[0]?.revenue || 1)) * 100, 100)}%`
                      }} />
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-4 text-muted small">No farm sales data yet.</div>}
            </div>
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="col-lg-6">
          <div className="chart-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="chart-card-title mb-0">
                <Leaf size={15} className="text-primary" /> Best-Selling Products
              </div>
              <span className="very-small text-muted text-uppercase fw-bold">By Quantity</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {data?.best_products?.length > 0 ? data.best_products.map((p, i) => (
                <div key={p.id} className="ranking-item animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="rank-number">0{i + 1}</div>
                  <div className="flex-grow-1 ms-2">
                    <div className="fw-bold small">{p.name}</div>
                    <div className="very-small text-muted">{p.qty} units sold</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary small">{p.revenue.toLocaleString()} DZD</div>
                    <div className="mt-1" style={{ height: 4, width: 60, background: '#e5e7eb', borderRadius: 4, marginLeft: 'auto' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, background: '#2563eb',
                        width: `${Math.min((p.qty / (data.best_products[0]?.qty || 1)) * 100, 100)}%`
                      }} />
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-4 text-muted small">No product sales data yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
