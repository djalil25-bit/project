import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Wheat, TrendingUp, Clock, DollarSign, Sprout,
  Package, ChevronRight, BarChart2,
  CheckCircle, ExternalLink, BadgeCheck
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

function FarmerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboards/farmer-stats/');
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh', gap: '0.75rem' }}>
      <div className="spinner-agr" />
      <span className="text-muted">Loading farm data...</span>
    </div>
  );

  const recent = stats?.recent_pending_orders || [];

  return (
    <div className="farmer-dashboard animate-fade-in">

      {/* ── HERO BANNER ──────────────────────────── */}
      <div className="farmer-hero-banner">
        <div className="farmer-hero-deco">🌾🚜🚜🌾</div>
        <div className="farmer-hero-content">
          <div className="farmer-hero-text">
            <div className="farmer-hero-tag">
              <BadgeCheck size={13} /> Certified Producer Workspace
            </div>
            <h1 className="farmer-hero-title">Farmer Dashboard</h1>
            <p className="farmer-hero-sub">
              Manage your farm operations, list your harvests, and track your sales in direct liaison with the Ministry.
            </p>
            <div className="farmer-hero-actions">
              <button className="farmer-hero-btn" onClick={() => navigate('/farmer-dashboard/product/new')}>
                <Plus size={15} /> Add Product
              </button>
              <button className="farmer-hero-btn-outline" onClick={() => navigate('/farmer-dashboard/harvests')}>
                <Wheat size={15} /> My Harvests
              </button>
              <button className="farmer-hero-btn-outline" onClick={() => navigate('/farmer-dashboard/stats')}>
                <BarChart2 size={15} /> Statistics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────── */}
      {stats && (
        <div className="buyer-kpi-grid mb-4">
          <div className="buyer-kpi-card stagger-1 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <Sprout size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_products_count}</div>
              <div className="buyer-kpi-label">Active Listings</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-2 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.total_items_sold}</div>
              <div className="buyer-kpi-label">Units Sold</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-3 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.pending_orders}</div>
              <div className="buyer-kpi-label">Pending Orders</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-4 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">
                {parseFloat(stats.total_revenue || 0).toLocaleString()}
                <small className="very-small ms-1">DZD</small>
              </div>
              <div className="buyer-kpi-label">Total Revenue</div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECENT PENDING ORDERS ─────────────────── */}
      <div className="farmer-table-card">
        <div className="farmer-table-header">
          <h3 className="agr-card-title d-flex align-items-center gap-2 mb-0">
            <Clock size={16} className="text-warning" />
            Recent Orders
            <span className="very-small text-muted fw-normal ms-1">(last 24h)</span>
          </h3>
          <button
            className="btn-agr btn-link btn-sm p-0 d-flex align-items-center gap-1"
            onClick={() => navigate('/farmer/orders?status=PENDING')}
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-5 text-center">
            <CheckCircle size={38} className="text-success mb-3 opacity-50" />
            <h4 className="h6 text-muted fw-bold mb-1">All caught up!</h4>
            <p className="small text-muted mb-3">No new pending orders at the moment.</p>
            <button className="btn-agr btn-outline btn-sm" onClick={() => navigate('/farmer/orders')}>
              View Order History
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="agr-table mb-0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Buyer</th>
                  <th className="text-end">Total</th>
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
                    <tr key={o.id} className="hover-bg-light">
                      <td>
                        <span className="fw-bold text-primary">{localNum}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-xs-circle">{o.buyer_name?.charAt(0)?.toUpperCase()}</div>
                          <span className="small fw-medium">{o.buyer_name}</span>
                        </div>
                      </td>
                      <td className="text-end fw-bold small">{o.total.toLocaleString()} DZD</td>
                      <td className="very-small text-muted">{timeAgo(o.created_at)}</td>
                      <td>
                        <button
                          className="btn-icon btn-sm"
                          title="Manage order"
                          onClick={() => navigate('/farmer/orders?status=PENDING')}
                        >
                          <ExternalLink size={13} />
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

export default FarmerDashboard;
