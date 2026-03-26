import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Truck, 
  Package, 
  ClipboardList, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  User,
  Navigation,
  ExternalLink
} from 'lucide-react';

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status.replace(/_/g, ' ')}</span>
);

function TransporterDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [actionLoading, setActionLoading] = useState(null);

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
    <div className="flex-center py-5" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr" /> <span className="ms-3 text-muted">Loading mission board...</span>
    </div>
  );

  return (
    <div className="transporter-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logistics Control</h1>
          <p className="page-subtitle">Manage missions, monitor routes, and track your performance.</p>
        </div>
        <div className="page-actions">
           <button className="btn-agr btn-outline" onClick={() => navigate('/transporter/history')}>
             <Clock size={16} className="me-2" /> History
           </button>
           <button className="btn-agr btn-primary">
             <Navigation size={16} className="me-2" /> Route Optimizer
           </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid mb-4">
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber"><ClipboardList size={24} /></div>
            <div>
              <div className="stat-value">{stats.open_requests}</div>
              <div className="stat-label">Available Missions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><Truck size={24} /></div>
            <div>
              <div className="stat-value">{stats.my_active_missions}</div>
              <div className="stat-label">Current Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><CheckCircle size={24} /></div>
            <div>
              <div className="stat-value">{stats.my_completed_missions}</div>
              <div className="stat-label">Total Deliveries</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><DollarSign size={24} /></div>
            <div>
              <div className="stat-value">{(stats.my_completed_missions * 1200)} <small className="very-small">DZD</small></div>
              <div className="stat-label">Est. Revenue</div>
            </div>
          </div>
        </div>
      )}

      <div className="agr-card">
        <div className="agr-card-header d-flex justify-content-between align-items-center">
          <h3 className="agr-card-title">Delivery Mission Board</h3>
          <div className="text-muted small fw-medium">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
        
        <div className="px-3 py-2 bg-light-soft border-bottom">
          <div className="tab-pills m-0">
            {[
              { key: 'open', label: `Public Market (${deliveries.filter(d => d.status === 'open').length})` }, 
              { key: 'mine', label: 'My Assigned Jobs' }, 
              { key: 'done', label: 'Completed Missions' }
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
                <th>Order Details</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-empty py-5">
                      <Package size={48} className="text-muted mb-3 opacity-25" />
                      <div className="table-empty-text">No missions found in this category.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <span className="fw-bold text-primary">MIL-{d.id.toString().padStart(4, '0')}</span>
                    <div className="very-small text-muted d-flex align-items-center mt-1">
                      <Clock size={10} className="me-1" /> {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <div className="very-small d-flex align-items-center text-muted">
                        <MapPin size={10} className="me-1 text-success" /> 
                        <span className="fw-bold text-dark">Pickup:</span> Farm #{d.farmer}
                      </div>
                      <div className="very-small d-flex align-items-center text-muted">
                        <Navigation size={10} className="me-1 text-primary" /> 
                        <span className="fw-bold text-dark">Dropoff:</span> {d.order_detail?.delivery_address?.substring(0, 35)}...
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="small fw-bold">Order #{d.order}</div>
                    <div className="text-muted very-small d-flex align-items-center">
                      <Package size={10} className="me-1" /> {d.order_detail?.items?.length || 0} units for delivery
                    </div>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {d.status === 'open' && (
                      <button
                        className="btn-agr btn-primary btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => handleAccept(d.id)}
                        disabled={actionLoading === d.id + '_accept'}
                      >
                        {actionLoading === d.id + '_accept' ? 'Processing...' : 'Accept Mission'}
                      </button>
                    )}
                    {d.status === 'assigned' && (
                      <button
                        className="btn-agr btn-success btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => handleStatusUpdate(d.id, 'picked_up')}
                      >
                         Mark as Picked Up
                      </button>
                    )}
                    {d.status === 'picked_up' && (
                      <button
                        className="btn-agr btn-warning btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => handleStatusUpdate(d.id, 'in_transit')}
                      >
                         Start Transit
                      </button>
                    )}
                    {d.status === 'in_transit' && (
                      <button
                        className="btn-agr btn-dark btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => handleStatusUpdate(d.id, 'delivered')}
                      >
                         Confirm Delivery
                      </button>
                    )}
                    {d.status === 'delivered' && (
                      <div className="text-success fw-bold very-small d-flex align-items-center justify-content-end">
                        <CheckCircle size={14} className="me-1" /> Job Finalized
                      </div>
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
