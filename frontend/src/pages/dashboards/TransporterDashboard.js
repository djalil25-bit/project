import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Truck,
  ClipboardList,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
  Navigation,
  Camera,
  X
} from 'lucide-react';
import ProofOfDeliveryModal from '../../components/logistics/ProofOfDeliveryModal';
import VehicleSelectionModal from '../../components/logistics/VehicleSelectionModal';
import RefusalModal from '../../components/logistics/RefusalModal';

const StatusBadge = ({ status }) => {
  const map = {
    open:                { label: 'Available',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    assigned:            { label: 'Assigned',    cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    picked_up:           { label: 'Picked Up',   cls: 'bg-purple-100 text-purple-800 border-purple-200 shadow-sm' },
    in_transit:          { label: 'In Transit',  cls: 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm animate-pulse' },
    refused_delivery:    { label: 'Refused',     cls: 'bg-rose-100 text-rose-800 border-rose-200 font-bold' },
    return_in_progress:  { label: 'Returning',   cls: 'bg-rose-50 text-rose-700 border-rose-200 border-dashed animate-pulse' },
    returned:            { label: 'Returned',    cls: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black' },
    delivered:           { label: 'Delivered',   cls: 'bg-slate-900 text-white border-slate-900 shadow-sm font-black' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>;
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
  const [acceptanceTarget, setAcceptanceTarget] = useState(null);
  const [refusalTarget, setRefusalTarget] = useState(null);

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

  const handleAccept = async (id, vehicleId) => {
    setActionLoading(id + '_accept');
    try {
      await api.post(`/deliveries/${id}/accept/`, { vehicle_id: vehicleId });
      fetchData();
      setActiveTab('mine'); // Switch to active missions automatically
    } catch (err) { 
      const msg = err.response?.data?.error || 'Failed to accept mission';
      throw new Error(msg); // Let the modal handle error display
    } finally { setActionLoading(null); }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id + '_status');
    try {
      await api.post(`/deliveries/${id}/update_status/`, { status });
      fetchData();
    } catch { alert('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const handleRefuse = async (id, data) => {
    setActionLoading(id + '_refuse');
    try {
      await api.post(`/deliveries/${id}/refuse/`, data);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Refusal Protocol Failed.';
      throw new Error(msg);
    } finally { setActionLoading(null); }
  };

  const handleMarkReturned = async (id) => {
    if (!window.confirm("Confirm return to farmer? This will finalize the cycle and restore stock.")) return;
    setActionLoading(id + '_return');
    try {
      await api.post(`/deliveries/${id}/mark_returned/`);
      fetchData();
      setActiveTab('done');
    } catch { 
      alert('Failed to complete return protocol.'); 
    } finally { setActionLoading(null); }
  };

  const openCount = deliveries.filter(d => d.status === 'open').length;

  const filtered = activeTab === 'open'
    ? deliveries.filter(d => d.status === 'open')
    : activeTab === 'mine'
    ? deliveries.filter(d => d.transporter != null && !['delivered', 'returned'].includes(d.status))
    : deliveries.filter(d => ['delivered', 'returned'].includes(d.status));

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
                      {d.vehicle_size && !d.assigned_vehicle_info && (
                        <span className="status-badge status-assigned very-small" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', marginTop: 2 }}>
                          {d.vehicle_size} vehicle req.
                        </span>
                      )}
                      {d.assigned_vehicle_info && (
                        <div className="mt-2 p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2 w-fit">
                           <Truck size={10} className="text-indigo-600" />
                           <span className="text-[9px] font-black text-indigo-900 uppercase tracking-tight">
                              {d.assigned_vehicle_info.plate} — {d.assigned_vehicle_info.model}
                           </span>
                        </div>
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
                        className="btn-agr btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                        onClick={() => setAcceptanceTarget(d)}
                        disabled={actionLoading === d.id + '_accept'}
                      >
                        {actionLoading === d.id + '_accept' ? 'Authorizing...' : 'Accept Mission'}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-agr btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                          onClick={() => setRefusalTarget(d)}
                        >
                          Refused Delivery
                        </button>
                        <button
                          className="btn-agr btn-dark btn-sm rounded-pill px-3 fw-bold"
                          onClick={() => setPodTarget(d)}
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                    {d.status === 'return_in_progress' && (
                       <button
                         className="btn-agr btn-success btn-sm rounded-pill px-4 fw-bold shadow-md animate-pulse"
                         onClick={() => handleMarkReturned(d.id)}
                         disabled={actionLoading === d.id + '_return'}
                       >
                         {actionLoading === d.id + '_return' ? 'Processing...' : 'Complete Return to Farmer'}
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
              <div className="p-4 bg-slate-50 border-bottom">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                     <MapPin size={48} className="absolute -right-2 -top-2 text-slate-100 group-hover:text-emerald-50 transition-colors" />
                     <div className="very-small text-slate-400 text-uppercase font-black tracking-widest mb-1 relative z-10">Pickup Point</div>
                     <div className="small font-black text-slate-800 d-flex align-items-center gap-1.5 relative z-10">
                        <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0"><MapPin size={10} /></div>
                        {viewingCargo.pickup_location}
                     </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                     <Navigation size={48} className="absolute -right-2 -top-2 text-slate-100 group-hover:text-blue-50 transition-colors" />
                     <div className="very-small text-slate-400 text-uppercase font-black tracking-widest mb-1 relative z-10">Delivery Node</div>
                     <div className="small font-black text-slate-800 d-flex align-items-center gap-1.5 relative z-10">
                        <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0"><Navigation size={10} /></div>
                        {viewingCargo.delivery_location}
                     </div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-2 py-1 border-bottom d-flex align-items-center justify-between">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Inventory Ledger</div>
                 <div className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-pill mx-3">Order #{viewingCargo.order} — {viewingCargo.order_detail?.buyer_name}</div>
              </div>

              <div className="table-responsive" style={{ maxHeight: 400 }}>
                <table className="agr-table mb-0">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-[0.1em]">
                      <th className="ps-4">Product / Node</th>
                      <th className="text-center">Origin</th>
                      <th className="text-end">Payload</th>
                      <th className="text-center pe-4">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingCargo.order_detail?.items?.map(item => (
                      <tr key={item.id} className="hover-bg-light transition-colors group">
                        <td className="ps-4 py-3">
                          <div className="fw-black text-slate-900 small">{item.product_name}</div>
                          <div className="very-small text-muted font-bold uppercase tracking-tighter mt-0.5 group-hover:text-primary transition-colors">ID: {item.id}</div>
                        </td>
                        <td className="text-center">
                           <div className="very-small font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded d-inline-block border border-emerald-100 shadow-sm">{item.farm_name || "Unknown Farm"}</div>
                        </td>
                        <td className="text-end">
                          <span className="fw-black text-slate-800">{parseFloat(item.quantity).toLocaleString()}</span>
                          <span className="ms-1 text-slate-400 very-small font-black uppercase">{item.product_unit}</span>
                        </td>
                        <td className="text-center pe-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.product_quality?.toLowerCase() === 'premium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                             {item.product_quality || 'Standard'}
                          </span>
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

      {acceptanceTarget && (
        <VehicleSelectionModal
          isOpen={!!acceptanceTarget}
          mission={acceptanceTarget}
          onClose={() => setAcceptanceTarget(null)}
          onAccept={handleAccept}
        />
      )}

      {refusalTarget && (
        <RefusalModal
          isOpen={!!refusalTarget}
          mission={refusalTarget}
          onClose={() => setRefusalTarget(null)}
          onConfirm={handleRefuse}
        />
      )}
    </div>
  );
}

export default TransporterDashboard;
