import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status.replace(/_/g, ' ')}</span>
);

function TransporterDashboard() {
  const [stats, setStats] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [actionLoading, setActionLoading] = useState(null);

  const STATUS_OPTIONS = [
    { value: 'picked_up', label: '📦 Picked Up' },
    { value: 'in_transit', label: '🚚 In Transit' },
    { value: 'delivered', label: '✅ Delivered' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, delivRes] = await Promise.all([
        api.get('/dashboards/transporter-stats/'),
        api.get('/delivery-requests/'),
      ]);
      setStats(statsRes.data);
      setDeliveries(delivRes.data.results || delivRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id) => {
    setActionLoading(id + '_accept');
    try {
      await api.post(`/delivery-requests/${id}/accept/`);
      fetchData();
    } catch { alert('Failed to accept delivery'); }
    finally { setActionLoading(null); }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id + '_status');
    try {
      await api.post(`/delivery-requests/${id}/update_status/`, { status });
      fetchData();
    } catch { alert('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const filtered = activeTab === 'open'
    ? deliveries.filter(d => d.status === 'open')
    : activeTab === 'mine'
    ? deliveries.filter(d => d.transporter != null && d.status !== 'delivered')
    : deliveries.filter(d => d.status === 'delivered');

  if (loading) return (
    <div className="loading-wrapper" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><span>Fetching your delivery route...</span>
    </div>
  );

  return (
    <div className="transporter-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logistics Control</h1>
          <p className="page-subtitle">Manage your missions, track earnings, and update delivery status.</p>
        </div>
        <div className="page-actions">
           <button className="btn-agr btn-outline" onClick={() => window.location.href='/transporter-dashboard/vehicles'}>🚛 My Fleet</button>
           <button className="btn-agr btn-outline" onClick={() => window.location.href='/transporter-dashboard/zones'}>📍 Service Zones</button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">📋</div>
            <div>
              <div className="stat-value">{stats.open_requests}</div>
              <div className="stat-label">Available Requests</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">🚚</div>
            <div>
              <div className="stat-value">{stats.my_active_missions}</div>
              <div className="stat-label">Current Missions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">📦</div>
            <div>
              <div className="stat-value">{stats.my_completed_missions}</div>
              <div className="stat-label">Jobs Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">💰</div>
            <div>
              <div className="stat-value">{(stats.my_completed_missions * 1200)} <small style={{fontSize: '0.6em'}}>DZD</small></div>
              <div className="stat-label">Est. Earnings</div>
            </div>
          </div>
        </div>
      )}

      <div className="agr-card mt-4">
        <div className="agr-card-header border-bottom-0">
          <h3 className="agr-card-title">Delivery Mission Board</h3>
        </div>
        
        <div className="px-3 pb-2">
          <div className="tab-pills m-0">
            {[
              { key: 'open', label: `Open Market (${deliveries.filter(d => d.status === 'open').length})` }, 
              { key: 'mine', label: 'My Active Jobs' }, 
              { key: 'done', label: 'History' }
            ].map(t => (
              <button key={t.key} className={`tab-pill ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="agr-table">
            <thead>
              <tr>
                <th>Mission Ref</th>
                <th>Origins & Destination</th>
                <th>Order Items</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5"><div className="table-empty py-5"><div className="table-empty-icon">🚛</div><div className="table-empty-text">No deliveries found in this category.</div></div></td></tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <span className="fw-bold text-primary">DR-{d.id.toString().padStart(5, '0')}</span>
                    <div className="text-muted small">Created: {new Date(d.created_at).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <div className="small"><span className="text-muted">From:</span> <span className="fw-bold">Farmer ID #{d.farmer}</span></div>
                      <div className="small"><span className="text-muted">To:</span> <span className="fw-bold">{d.order_detail?.delivery_address?.substring(0, 40)}...</span></div>
                    </div>
                  </td>
                  <td>
                    <div className="small">Order #{d.order}</div>
                    <div className="text-muted italic small">{d.order_detail?.items?.length || 0} items in package</div>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {d.status === 'open' && (
                      <button
                        className="btn-agr btn-primary btn-sm rounded-pill px-3"
                        onClick={() => handleAccept(d.id)}
                        disabled={actionLoading === d.id + '_accept'}
                      >
                        {actionLoading === d.id + '_accept' ? '...' : '⚡ Accept Mission'}
                      </button>
                    )}
                    {['assigned', 'picked_up', 'in_transit'].includes(d.status) && (
                      <div className="d-inline-block">
                        <select
                          className="form-input rounded-pill py-1 px-3"
                          style={{ width: 'auto', fontSize: '0.8rem', height: '36px' }}
                          onChange={e => e.target.value && handleStatusUpdate(d.id, e.target.value)}
                          disabled={actionLoading === d.id + '_status'}
                          defaultValue=""
                        >
                          <option value="">Update Step...</option>
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    )}
                    {d.status === 'delivered' && (
                      <span className="text-success fw-bold small">
                        <span className="me-1">📦</span> Job Finalized
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TransporterDashboard;
