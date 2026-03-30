import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, Trophy,
  BarChart2, ChevronRight, AlertCircle, Calendar, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function FarmerStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboards/farmer-analytics/?timeframe=${timeframe}`)
      .then(res => { setData(res.data); setError(null); })
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, [timeframe]);

  if (loading && !data) return (
    <div className="flex-center py-5"><div className="spinner-agr" /><span className="ms-3 text-muted">Loading statistics...</span></div>
  );
  if (error) return (
    <div className="alert-agr alert-agr-danger d-flex align-items-center gap-2"><AlertCircle size={18} /> {error}</div>
  );

  return (
    <div className="farmer-stats-page animate-fade-in">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Statistics</span>
      </div>

      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2"><TrendingUp className="text-primary" size={28} />My Statistics</h1>
          <p className="page-subtitle text-muted">Track your farm performance, revenue and sales trends.</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white rounded-lg border shadow-sm p-2">
          <Calendar size={16} className="text-primary" />
          <select
            className="form-select form-select-sm border-0 fw-bold text-primary"
            style={{ width: 130 }}
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><DollarSign size={22} /></div>
          <div>
            <div className="stat-value">{(data?.total_revenue || 0).toLocaleString()} <small className="very-small">DZD</small></div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><ShoppingCart size={22} /></div>
          <div>
            <div className="stat-value">{data?.total_orders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber"><BarChart2 size={22} /></div>
          <div>
            <div className="stat-value">{data?.best_farms?.length || 0}</div>
            <div className="stat-label">Active Farms</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><Package size={22} /></div>
          <div>
            <div className="stat-value">{data?.best_products?.length || 0}</div>
            <div className="stat-label">Selling Products</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Revenue Trend */}
        <div className="col-lg-8">
          <div className="agr-card p-4 h-100">
            <h5 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Revenue Trend
            </h5>
            <div style={{ width: '100%', height: 280 }}>
              {data?.revenue_trend?.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
                    <Tooltip formatter={v => [`${v.toLocaleString()} DZD`, 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="flex-center h-100 text-muted small">No revenue data for this period</div>}
            </div>
          </div>
        </div>

        {/* Orders Trend */}
        <div className="col-lg-4">
          <div className="agr-card p-4 h-100">
            <h5 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
              <ShoppingCart size={16} className="text-primary" /> Orders Trend
            </h5>
            <div style={{ width: '100%', height: 280 }}>
              {data?.orders_trend?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={data.orders_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(59,130,246,0.1)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex-center h-100 text-muted small">No order data for this period</div>}
            </div>
          </div>
        </div>

        {/* Best Farms */}
        <div className="col-lg-6">
          <div className="agr-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="h6 fw-bold mb-0 d-flex align-items-center gap-2"><Trophy size={16} className="text-amber" />Top Performing Farms</h5>
              <span className="very-small text-muted text-uppercase fw-bold">By Revenue</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {data?.best_farms?.length > 0 ? data.best_farms.map((f, i) => (
                <div key={f.id} className="ranking-item d-flex align-items-center p-3 rounded-lg bg-light-soft hover-bg-light animate-fade-in">
                  <div className="rank-number h4 fw-bold text-muted me-3 mb-0" style={{ opacity: 0.3, width: 30 }}>0{i + 1}</div>
                  <div className="flex-grow-1">
                    <div className="fw-bold small">{f.name}</div>
                    <div className="very-small text-muted">{f.orders} orders</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary small">{f.revenue.toLocaleString()} DZD</div>
                    <div className="progress mt-1" style={{ height: 4, width: 60, marginLeft: 'auto' }}>
                      <div className="progress-bar bg-success" style={{ width: `${(f.revenue / data.best_farms[0].revenue) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-4 text-muted small">No farm sales data yet.</div>}
            </div>
          </div>
        </div>

        {/* Best Products */}
        <div className="col-lg-6">
          <div className="agr-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="h6 fw-bold mb-0 d-flex align-items-center gap-2"><Leaf size={16} className="text-primary" />Best-Selling Products</h5>
              <span className="very-small text-muted text-uppercase fw-bold">By Quantity</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {data?.best_products?.length > 0 ? data.best_products.map((p, i) => (
                <div key={p.id} className="ranking-item d-flex align-items-center p-3 rounded-lg bg-light-soft hover-bg-light animate-fade-in">
                  <div className="rank-number h4 fw-bold text-muted me-3 mb-0" style={{ opacity: 0.3, width: 30 }}>0{i + 1}</div>
                  <div className="flex-grow-1">
                    <div className="fw-bold small">{p.name}</div>
                    <div className="very-small text-muted">{p.qty} units sold</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary small">{p.revenue.toLocaleString()} DZD</div>
                    <div className="progress mt-1" style={{ height: 4, width: 60, marginLeft: 'auto' }}>
                      <div className="progress-bar bg-primary" style={{ width: `${(p.qty / data.best_products[0].qty) * 100}%` }}></div>
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
