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
  Navigation,
  X,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import ProofOfDeliveryModal from '../../components/logistics/ProofOfDeliveryModal';

const StatusBadge = ({ status }) => {
  const map = {
    open:       { label: 'Available',   cls: 'status-open' },
    assigned:   { label: 'Assigned',    cls: 'status-assigned' },
    picked_up:  { label: 'Picked Up',   cls: 'status-picked_up' },
    in_transit: { label: 'In Transit',  cls: 'status-in_transit' },
    delivered:  { label: 'Delivered',   cls: 'status-delivered' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`status-badge ${cls}`}>{label}</span>;
};

function TransporterDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingCargo, setViewingCargo] = useState(null);
  const [podTarget, setPodTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, delivRes] = await Promise.all([
        api.get('/dashboards/transporter-stats/'),
        api.get('/deliveries/'),
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
      await api.post(`/deliveries/${id}/accept/`);
      fetchData();
    } catch { alert('Failed to accept delivery'); }
    finally { setActionLoading(null); }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id + '_status');
    try {
      await api.post(`/deliveries/${id}/update_status/`, { status });
      fetchData();
    } catch { alert('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const openCount = deliveries.filter(d => d.status === 'open').length;

  const filtered = activeTab === 'open'
    ? deliveries.filter(d => d.status === 'open')
    : activeTab === 'mine'
    ? deliveries.filter(d => d.transporter != null && d.status !== 'delivered')
    : deliveries.filter(d => d.status === 'delivered');

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh', gap: '0.75rem' }}>
      <div className="spinner-agr" />
      <span className="text-muted">Loading logistics dashboard...</span>
    </div>
  );

  return (
    <div className="transporter-dashboard animate-fade-in">

      {/* ── HERO BANNER (amber/green logistics theme) ── */}
      <div className="transporter-hero-banner">
        <div className="transporter-hero-deco">🚛🛣️</div>
        <div className="transporter-hero-content">
          <div className="transporter-hero-tag">
            <Clock size={13} /> Real-time Updates
          </div>
          <h1 className="transporter-hero-title">Logistics Control Center</h1>
          <p className="transporter-hero-sub">
            Manage your delivery missions, monitor your routes, and track performance across the national network.
          </p>
          <div className="transporter-hero-actions">
            <button className="transporter-hero-btn" onClick={() => navigate('/transporter-dashboard/vehicles')}>
              <Truck size={14} /> My Fleet
            </button>
            <button className="transporter-hero-btn-outline" onClick={() => navigate('/transporter-dashboard/zones')}>
              <MapPin size={14} /> Service Zones
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────── */}
      {stats && (
        <div className="buyer-kpi-grid mb-4">
          <div className="buyer-kpi-card stagger-1 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.open_requests}</div>
              <div className="buyer-kpi-label">Available Missions</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-2 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <Truck size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_active_missions}</div>
              <div className="buyer-kpi-label">Active Routes</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-3 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_completed_missions}</div>
              <div className="buyer-kpi-label">Completed Deliveries</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-4 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">
                {(stats.my_completed_missions * 1200).toLocaleString()}
                <small className="very-small ms-1">DZD</small>
              </div>
              <div className="buyer-kpi-label">Est. Revenue</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MISSION TABLE ──────────────────────────── */}
      <div className="transporter-table-card">
        <div className="farmer-table-header">
          <h3 className="agr-card-title mb-0">Mission Board</h3>
          <div className="text-muted very-small fw-medium">
            Updated: {new Date().toLocaleTimeString('en-GB')}
          </div>
        </div>

        <div className="px-3 py-2 bg-light-soft border-bottom">
          <div className="segmented-tabs-wrapper">
            {[
              { key: 'open', label: `Open Market (${openCount})` },
              { key: 'mine', label: 'My Missions' },
              { key: 'done', label: 'History' },
            ].map(t => (
              <button
                key={t.key}
                className={`segmented-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="agr-table">
            <thead>
              <tr>
                <th>Mission Ref.</th>
                <th>Route</th>
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
                      <Package size={44} className="text-muted mb-3 opacity-25" />
                      <div className="table-empty-text text-muted">No missions found in this category.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <span className="fw-bold text-primary">MIL-{d.id.toString().padStart(4, '0')}</span>
                    <div className="very-small text-muted d-flex align-items-center mt-1 gap-1">
                      <Clock size={10} />
                      {new Date(d.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <div className="mission-origin">
                        <MapPin size={11} />
                        {(d.pickup_location || `Farm #${d.order_detail?.items?.[0]?.farmer}`)?.substring(0, 28)}...
                      </div>
                      <div className="mission-dest">
                        <Navigation size={11} />
                        {(d.delivery_location || d.order_detail?.delivery_address)?.substring(0, 28)}...
                      </div>
                      {d.vehicle_size && (
                        <span className="status-badge status-assigned very-small" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', marginTop: 2 }}>
                          {d.vehicle_size} vehicle
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="small fw-bold">Order #{d.order}</div>
                    <div className="text-muted very-small d-flex align-items-center mt-1 gap-1">
                      <Package size={10} />
                      {d.order_detail?.items?.length || 0} items
                    </div>
                    <button
                      className="btn-agr btn-link btn-sm p-0 mt-1 d-flex align-items-center gap-1"
                      onClick={() => setViewingCargo(d)}
                      style={{ fontSize: '0.72rem' }}
                    >
                      <ClipboardList size={11} /> View Cargo
                    </button>
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
                        Mark Picked Up
                      </button>
                    )}
                    {d.status === 'picked_up' && (
                      <button
                        className="btn-agr btn-warning btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => handleStatusUpdate(d.id, 'in_transit')}
                      >
                        Start Route
                      </button>
                    )}
                    {d.status === 'in_transit' && (
                      <button
                        className="btn-agr btn-dark btn-sm rounded-pill px-3 fw-bold"
                        onClick={() => setPodTarget(d)}
                      >
                        Confirm Delivery
                      </button>
                    )}
                    {d.status === 'delivered' && (
                      <div className="d-flex flex-column align-items-end gap-1">
                        <div className="text-success fw-bold very-small d-flex align-items-center gap-1">
                          <CheckCircle size={13} /> Delivery Complete
                        </div>
                        {d.pod_completed_at && (
                          <div className="very-small text-muted bg-light-soft px-2 py-1 rounded border">
                            <div className="fw-bold">Signed: {d.pod_recipient_name}</div>
                            {d.pod_photo && (
                              <button
                                className="btn-agr btn-link p-0 mt-1 d-flex align-items-center gap-1"
                                style={{ fontSize: '0.65rem' }}
                                onClick={() => window.open(d.pod_photo, '_blank')}
                              >
                                <Camera size={10} /> View Proof
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARGO MODAL ────────────────────────────── */}
      {viewingCargo && (
        <div className="modal-overlay" onClick={() => setViewingCargo(null)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header border-bottom">
              <h3 className="h6 mb-0 d-flex align-items-center gap-2">
                <Package size={16} className="text-primary" />
                Cargo Details — MIL-{viewingCargo.id.toString().padStart(4, '0')}
              </h3>
              <button className="btn-icon" onClick={() => setViewingCargo(null)}><X size={16} /></button>
            </div>
            <div className="modal-body p-0">
              <div className="p-3 bg-light-soft border-bottom">
                <div className="d-flex align-items-center gap-4">
                  <div>
                    <div className="very-small text-muted text-uppercase fw-bold">Origin</div>
                    <div className="small fw-bold d-flex align-items-center gap-1 mt-1">
                      <MapPin size={11} className="text-success" />
                      {viewingCargo.pickup_location}
                    </div>
                  </div>
                  <div className="text-muted">→</div>
                  <div>
                    <div className="very-small text-muted text-uppercase fw-bold">Destination</div>
                    <div className="small fw-bold d-flex align-items-center gap-1 mt-1">
                      <Navigation size={11} className="text-primary" />
                      {viewingCargo.delivery_location}
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive" style={{ maxHeight: 400 }}>
                <table className="agr-table mb-0">
                  <thead>
                    <tr>
                      <th>Product / Item</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-center">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingCargo.order_detail?.items?.map(item => (
                      <tr key={item.id} className="hover-bg-light">
                        <td>
                          <div className="fw-bold small">{item.product_name}</div>
                          {item.product_detail?.category_name && (
                            <div className="very-small text-muted">{item.product_detail.category_name}</div>
                          )}
                        </td>
                        <td className="text-end">
                          <span className="fw-bold">{item.quantity}</span>
                          <span className="ms-1 text-muted very-small">{item.product_unit}</span>
                        </td>
                        <td className="text-center">
                          {item.product_detail?.quality
                            ? <span className="status-badge status-assigned very-small">{item.product_detail.quality}</span>
                            : <span className="text-muted very-small">Standard</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewingCargo.notes && (
                <div className="p-3 bg-light-soft border-top">
                  <div className="very-small text-muted text-uppercase fw-bold mb-1">Logistics Notes</div>
                  <div className="small text-muted fst-italic">"{viewingCargo.notes}"</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-agr btn-outline w-100" onClick={() => setViewingCargo(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {podTarget && (
        <ProofOfDeliveryModal
          delivery={podTarget}
          isOpen={!!podTarget}
          onClose={() => setPodTarget(null)}
          onSuccess={() => { fetchData(); setActiveTab('done'); }}
        />
      )}
    </div>
  );
}

export default TransporterDashboard;
