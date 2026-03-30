import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Settings, Wheat, TrendingUp, Clock, DollarSign, Sprout,
  Package, Home, ChevronRight, ShoppingCart, BarChart2,
  AlertCircle, CheckCircle, ExternalLink, RefreshCw, User
} from 'lucide-react';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
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
    <div className="loading-wrapper flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr" /> <span className="ms-3">Loading farm data...</span>
    </div>
  );

  const recent = stats?.recent_pending_orders || [];

  return (
    <div className="farmer-dashboard animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Farm Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening on your farms today.</p>
        </div>
        <div className="page-actions d-flex gap-2 flex-wrap">
          <button className="btn-agr btn-outline d-flex align-items-center gap-2" onClick={() => navigate('/farmer-dashboard/stats')}>
            <BarChart2 size={17} /> Statistics
          </button>
          <button className="btn-agr btn-outline d-flex align-items-center gap-2" onClick={() => navigate('/farmer-dashboard/harvests')}>
            <Wheat size={17} /> Harvests
          </button>
          <button className="btn-agr btn-primary d-flex align-items-center gap-2" onClick={() => navigate('/farmer-dashboard/product/new')}>
            <Plus size={17} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats KPI cards */}
      {stats && (
        <div className="stats-grid mb-4">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><Sprout size={24} /></div>
            <div>
              <div className="stat-value">{stats.my_products_count}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><TrendingUp size={24} /></div>
            <div>
              <div className="stat-value">{stats.total_items_sold}</div>
              <div className="stat-label">Units Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber"><Clock size={24} /></div>
            <div>
              <div className="stat-value">{stats.pending_orders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><DollarSign size={24} /></div>
            <div>
              <div className="stat-value">{parseFloat(stats.total_revenue || 0).toLocaleString()} <small className="very-small">DZD</small></div>
              <div className="stat-label">Total Earnings</div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Recent Pending Orders (last 24h) */}
        <div className="col-lg-12">
          <div className="agr-card h-100">
            <div className="agr-card-header d-flex justify-content-between align-items-center">
              <h3 className="agr-card-title d-flex align-items-center gap-2">
                <Clock size={18} className="text-amber" /> Recent Orders
                <span className="very-small text-muted fw-normal ms-1">(last 24h)</span>
              </h3>
              <button
                className="btn-agr btn-link btn-sm text-primary text-decoration-none d-flex align-items-center gap-1"
                onClick={() => navigate('/farmer/orders?status=PENDING')}
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="p-5 text-center">
                <CheckCircle size={40} className="text-success mb-3 opacity-50" />
                <h4 className="h6 text-muted">All clear!</h4>
                <p className="small text-muted mb-3">No new pending orders in the last 24 hours.</p>
                <button className="btn-agr btn-outline btn-sm" onClick={() => navigate('/farmer/orders')}>
                  View All Orders
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
                      <th>Time</th>
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
                              title="Manage Order"
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
      </div>
    </div>
  );
}

export default FarmerDashboard;
