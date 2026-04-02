import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import {
  TrendingUp, DollarSign, ListOrdered, Sprout,
  Award, BarChart2, ChevronRight, AlertCircle, Leaf, Tractor
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* ── Custom premium tooltip ─────────────────────────────── */
const AgriTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a4a2e', borderRadius: 10, padding: '0.6rem 1rem',
      boxShadow: '0 10px 25px rgba(26,74,46,0.25)',
      fontSize: '0.8rem', minWidth: 130,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: '#fff', fontWeight: 800 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {p.name === 'Revenue' ? ' DZD' : ''}
        </div>
      ))}
    </div>
  );
};

const AREA_GRAD = 'fRevArea';
const BAR_GRAD  = 'fOrderBar';

function getRankClass(i) {
  if (i === 0) return 'r1';
  if (i === 1) return 'r2';
  if (i === 2) return 'r3';
  return 'rn';
}

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
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading statistics…</span>
    </div>
  );

  if (error) return (
    <div className="f-alert f-alert-danger">
      <AlertCircle size={16} /> {error}
    </div>
  );

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>Sales &amp; Revenue Analytics</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} style={{ color: 'var(--f-olive)' }} />
            Sales &amp; Revenue Analytics
          </h1>
          <p style={{ color: '#6b7280', margin: '0.3rem 0 0', fontSize: '0.88rem' }}>
            Track your farm performance, revenue trends, and top products.
          </p>
        </div>
        {/* Segmented timeframe control */}
        <div className="f-segmented">
          {[
            { key: 'all',   label: 'All Time'   },
            { key: 'year',  label: 'This Year'  },
            { key: 'month', label: 'This Month' },
          ].map(t => (
            <button
              key={t.key}
              className={`f-segmented-btn ${timeframe === t.key ? 'active' : ''}`}
              onClick={() => setTimeframe(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="f-kpi-grid" style={{ marginBottom: '1.75rem' }}>
        {[
          { icon: <DollarSign size={22} />, color: 'green', val: `${(data?.total_revenue || 0).toLocaleString()} DZD`, label: 'Total Revenue' },
          { icon: <ListOrdered size={22} />, color: 'blue', val: data?.total_orders || 0, label: 'Total Orders' },
          { icon: <Tractor size={22} />, color: 'gold', val: data?.best_farms?.length || 0, label: 'Active Farms' },
          { icon: <Sprout size={22} />, color: 'sage', val: data?.best_products?.length || 0, label: 'Selling Products' },
        ].map((k, i) => (
          <div key={i} className="f-kpi-card">
            <div className={`f-kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="f-kpi-body">
              <div className="f-kpi-value">{k.val}</div>
              <div className="f-kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Revenue trend — Area */}
        <div className="f-chart-card">
          <div className="f-chart-header">
            <div className="f-chart-title">
              <TrendingUp size={15} style={{ color: 'var(--f-olive)' }} /> Revenue Trend (DZD)
            </div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Monthly</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {data?.revenue_trend?.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={AREA_GRAD} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--f-forest)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--f-forest)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f4f1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={42} />
                  <Tooltip content={<AgriTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke="var(--f-forest)" strokeWidth={2.5}
                    fill={`url(#${AREA_GRAD})`}
                    dot={{ r: 4, fill: 'var(--f-forest)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'var(--f-forest)', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="f-chart-empty">No revenue data for this period</div>
            )}
          </div>
        </div>

        {/* Orders trend — Bar */}
        <div className="f-chart-card">
          <div className="f-chart-header">
            <div className="f-chart-title">
              <ListOrdered size={15} style={{ color: 'var(--f-olive)' }} /> Orders per Period
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {data?.orders_trend?.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={data.orders_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={BAR_GRAD} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--f-olive)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--f-forest)" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f4f1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} width={28} />
                  <Tooltip content={<AgriTooltip />} cursor={{ fill: 'rgba(122,171,138,0.08)' }} />
                  <Bar dataKey="orders" name="Orders" fill={`url(#${BAR_GRAD})`} radius={[5,5,0,0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="f-chart-empty">No order data for this period</div>
            )}
          </div>
        </div>
      </div>

      {/* Rankings row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Top Farms */}
        <div className="f-chart-card">
          <div className="f-chart-header">
            <div className="f-chart-title">
              <Award size={15} style={{ color: 'var(--f-gold)' }} /> Top Performing Farms
            </div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>By Revenue</span>
          </div>
          {data?.best_farms?.length > 0 ? (
            data.best_farms.map((f, i) => (
              <div key={f.id} className="f-ranking-item">
                <div className={`f-rank-badge ${getRankClass(i)}`}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ flex: 1 }}>
                  <div className="f-rank-name">{f.name}</div>
                  <div className="f-rank-sub">{f.orders} orders</div>
                </div>
                <div className="f-rank-value">
                  <div className="f-rank-rev">{f.revenue.toLocaleString()} DZD</div>
                  <div className="f-rank-bar-wrap">
                    <div className="f-rank-bar" style={{ width: `${Math.min((f.revenue / (data.best_farms[0]?.revenue || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="f-chart-empty">No farm sales data yet.</div>
          )}
        </div>

        {/* Best Products */}
        <div className="f-chart-card">
          <div className="f-chart-header">
            <div className="f-chart-title">
              <Leaf size={15} style={{ color: 'var(--f-olive)' }} /> Best-Selling Products
            </div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>By Quantity</span>
          </div>
          {data?.best_products?.length > 0 ? (
            data.best_products.map((p, i) => (
              <div key={p.id} className="f-ranking-item">
                <div className={`f-rank-badge ${getRankClass(i)}`}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ flex: 1 }}>
                  <div className="f-rank-name">{p.name}</div>
                  <div className="f-rank-sub">{p.qty} units sold</div>
                </div>
                <div className="f-rank-value">
                  <div className="f-rank-rev">{p.revenue.toLocaleString()} DZD</div>
                  <div className="f-rank-bar-wrap">
                    <div className="f-rank-bar" style={{
                      width: `${Math.min((p.qty / (data.best_products[0]?.qty || 1)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, var(--f-gold) 0%, var(--f-amber) 100%)'
                    }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="f-chart-empty">No product sales data yet.</div>
          )}
        </div>

      </div>
    </div>
  );
}
