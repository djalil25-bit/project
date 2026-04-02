import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Sprout, TrendingUp, Clock, DollarSign,
  Package, ChevronRight, CheckCircle, ExternalLink,
  BadgeCheck, ShoppingBag, Wheat, BarChart2,
  Activity, AlertTriangle, CloudSun, Target
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
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading farm data…</span>
    </div>
  );

  const recent = stats?.recent_pending_orders || [];

  const kpis = stats ? [
    {
      icon: <Sprout size={22} />,
      color: 'green',
      value: stats.my_products_count,
      label: 'Active Listings',
      micro: 'Products on marketplace',
    },
    {
      icon: <ShoppingBag size={22} />,
      color: 'gold',
      value: stats.pending_orders,
      label: 'Pending Orders',
      micro: 'Awaiting your confirmation',
    },
    {
      icon: <TrendingUp size={22} />,
      color: 'blue',
      value: stats.total_items_sold,
      label: 'Units Sold',
      micro: 'Total across all products',
    },
    {
      icon: <DollarSign size={22} />,
      color: 'sage',
      value: null,
      rawRevenue: stats.total_revenue,
      label: 'Total Revenue',
      micro: 'All confirmed orders',
    },
  ] : [];

  return (
    <div className="farmer-page-wrapper">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="f-hero">
        <div className="f-hero-inner">
          <div>
            <div className="f-hero-badge">
              <BadgeCheck size={12} /> Certified Producer Workspace
            </div>
            <h1 className="f-hero-title">Farmer Workspace</h1>
            <p className="f-hero-subtitle">
              Manage your agricultural operations, track your
              sales directly with buyers, and optimize your listings based on official Ministry data.
            </p>
            {/* Intelligence Bar */}
            <div className="f-hero-intel-bar">
              <div className="f-intel-item">
                <Activity size={16} />
                <div>
                  <div className="f-intel-label">Farm Status</div>
                  <div className="f-intel-val">Operational</div>
                </div>
              </div>
              <div className="f-intel-item">
                <Target size={16} />
                <div>
                  <div className="f-intel-label">Market Signal</div>
                  <div className="f-intel-val">High Demand</div>
                </div>
              </div>
              <div className="f-intel-item">
                <CloudSun size={16} />
                <div>
                  <div className="f-intel-label">Seasonality</div>
                  <div className="f-intel-val">Spring Planting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────── */}
      {stats && (
        <div className="f-kpi-grid">
          {kpis.map((k, i) => (
            <div key={i} className="f-kpi-card">
              <div className={`f-kpi-icon ${k.color}`}>
                {k.icon}
              </div>
              <div className="f-kpi-body">
                <div className="f-kpi-value">
                  {k.rawRevenue != null
                    ? <>{parseFloat(k.rawRevenue || 0).toLocaleString()}<small>DZD</small></>
                    : k.value
                  }
                </div>
                <div className="f-kpi-label">{k.label}</div>
                <div className="f-kpi-micro">{k.micro}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── QUICK ACTIONS STRIP ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button className="btn-f-secondary btn-f-sm" onClick={() => navigate('/farmer/products')}>
          <Package size={16} strokeWidth={2.2} /> My Listings
        </button>
        <button className="btn-f-secondary btn-f-sm" onClick={() => navigate('/farmer/orders')}>
          <ShoppingBag size={16} strokeWidth={2.2} /> All Orders
        </button>
        <button className="btn-f-secondary btn-f-sm" onClick={() => navigate('/farmer-dashboard/farms')}>
          <Sprout size={16} strokeWidth={2.2} /> My Farms
        </button>
        <button className="btn-f-secondary btn-f-sm" onClick={() => navigate('/farmer-dashboard/stats')}>
          <TrendingUp size={16} strokeWidth={2.2} /> Analytics
        </button>
        <button className="btn-f-secondary btn-f-sm" onClick={() => navigate('/farmer-dashboard/product/new')} style={{ marginLeft: 'auto', background: 'var(--f-olive)', color: '#fff' }}>
          <Plus size={16} strokeWidth={2.2} /> Add Product
        </button>
      </div>

      {/* ── SMART INSIGHT MODULES ─────────────────────────── */}
      <div className="f-insight-grid">
        <div className="f-card f-insight-module">
          <div className="f-insight-icon-wrap primary"><Activity size={20} /></div>
          <div className="f-insight-content">
            <h4 className="f-insight-title">Operational Metrics</h4>
            <div className="f-insight-data">
              <div className="f-insight-row">
                <span>Orders requiring action</span>
                <strong>{stats?.pending_orders || 0}</strong>
              </div>
              <div className="f-insight-row">
                <span>Active products</span>
                <strong>{stats?.my_products_count || 0}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="f-card f-insight-module">
          <div className="f-insight-icon-wrap warning"><AlertTriangle size={20} /></div>
          <div className="f-insight-content">
            <h4 className="f-insight-title">Action Items</h4>
            <div className="f-insight-data">
              {stats?.pending_orders > 0 ? (
                <div className="f-insight-row hint">
                  <span>You have pending orders awaiting approval before transport can be assigned.</span>
                </div>
              ) : (
                <div className="f-insight-row ok">
                  <span>All operational checks are green. You are fully caught up today.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT PENDING ORDERS ───────────────────────────── */}
      <div className="f-card">
        <div className="f-card-header">
          <div className="f-section-title">
            <div className="f-section-title-icon"><Clock size={15} /></div>
            Recent Pending Orders
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>(last 24h)</span>
          </div>
          <button
            className="btn-f-ghost btn-f-sm"
            onClick={() => navigate('/farmer/orders?status=PENDING')}
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="f-empty-state">
            <div className="f-empty-icon">
              <CheckCircle size={32} />
            </div>
            <div className="f-empty-title">All caught up!</div>
            <div className="f-empty-sub">No new pending orders at the moment.</div>
            <button className="btn-f-ghost btn-f-sm" onClick={() => navigate('/farmer/orders')}>
              View Order History
            </button>
          </div>
        ) : (
          <div className="f-table-wrap">
            <table className="f-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Buyer</th>
                  <th className="right">Total</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => {
                  const localNum = o.farmer_order_number
                    ? `#F-${String(o.farmer_order_number).padStart(3, '0')}`
                    : `#${o.id}`;
                  return (
                    <tr key={o.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--f-forest)' }}>{localNum}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div className="f-avatar">{o.buyer_name?.charAt(0)?.toUpperCase()}</div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.buyer_name}</span>
                        </div>
                      </td>
                      <td className="col-right" style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                        {o.total?.toLocaleString()} <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>DZD</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{timeAgo(o.created_at)}</td>
                      <td>
                        <button
                          className="btn-f-icon btn-f-icon-sm"
                          title="Manage order"
                          onClick={() => navigate('/farmer/orders?status=PENDING')}
                        >
                          <ExternalLink size={14} />
                        </button>
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
  );
}
