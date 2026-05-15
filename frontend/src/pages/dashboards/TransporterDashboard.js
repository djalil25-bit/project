import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ALGERIAN_WILAYAS } from '../../utils/constants';
import Select from 'react-select';
import {
  Truck,
  ClipboardList,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Navigation,
  Camera,
  X,
  Phone,
  CloudSun,
  Route
} from 'lucide-react';
import ProofOfDeliveryModal from '../../components/logistics/ProofOfDeliveryModal';
import VehicleSelectionModal from '../../components/logistics/VehicleSelectionModal';
import MissionDetailsModal from '../../components/logistics/MissionDetailsModal';
import RefusalModal from '../../components/logistics/RefusalModal';
import MiniWeatherWidget from '../../components/weather/MiniWeatherWidget';

const StatusBadge = ({ status }) => {
  const map = {
    open:                { label: 'Available',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    assigned:            { label: 'Assigned',    cls: 'bg-[#10B981]/20 text-[#2DA83B] border-[#10B981]/50' },
    picked_up:           { label: 'Picked Up',   cls: 'bg-[#10B981]/20 text-[#2DA83B] border-[#10B981]/50 shadow-sm' },
    in_transit:          { label: 'In Transit',  cls: 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm animate-pulse' },
    refused_delivery:    { label: 'Refused',     cls: 'bg-rose-100 text-rose-800 border-rose-200 font-bold' },
    return_in_progress:  { label: 'Returning',   cls: 'bg-rose-50 text-rose-700 border-rose-200 border-dashed animate-pulse' },
    returned:            { label: 'Returned',    cls: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black' },
    delivered:           { label: 'Delivered',   cls: 'bg-slate-900 text-white border-slate-900 shadow-sm font-black' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>;
};

const reactSelectStyles = {
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    minHeight: '31px',
    fontSize: '0.75rem',
    fontWeight: '500',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#cbd5e1'
    }
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.75rem',
    fontWeight: state.isSelected ? '700' : '500',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#6c757d',
  })
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
  const [myVehicles, setMyVehicles] = useState([]);
  const [pickupWilaya, setPickupWilaya] = useState('');
  const [deliveryWilaya, setDeliveryWilaya] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, delivRes, vehicleRes] = await Promise.all([
        api.get('/dashboards/transporter-stats/'),
        api.get('/deliveries/', { params: { pickup_wilaya: pickupWilaya, delivery_wilaya: deliveryWilaya } }),
        api.get('/vehicles/')
      ]);
      setStats(statsRes.data);
      setDeliveries(delivRes.data.results || delivRes.data);
      setMyVehicles(vehicleRes.data.results || vehicleRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [pickupWilaya, deliveryWilaya]);

  const handleAccept = async (id, vehicleId) => {
    setActionLoading(id + '_accept');
    try {
      await api.post(`/deliveries/${id}/accept/`, { vehicle_id: vehicleId });
      fetchData();
      setActiveTab('mine'); // Switch to active missions automatically
    } catch (err) { 
      console.error('[LOGISTICS] Mission Acceptance Failed:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept mission';
      // If backend says we have an active mission, refresh data to sync UI
      if (msg.includes('current mission is completed')) {
        fetchData();
      }
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

  // Refined active mission check: Priority 1: stats from backend. Priority 2: local data scan.
  const hasActiveMission = stats?.my_active_missions > 0 || deliveries.some(d => 
    d.transporter != null && 
    ['assigned', 'picked_up', 'in_transit'].includes(d.status)
  );

  const checkCompatibility = (mission) => {
    if (!myVehicles || myVehicles.length === 0) return { compatible: false, reason: 'No vehicles registered' };
    
    const compatibleVehicles = myVehicles.filter(v => {
      const isTypeMatch = !mission.required_vehicle_type || mission.required_vehicle_type === 'standard' || v.type === mission.required_vehicle_type;
      const isCapacityMatch = parseFloat(v.capacity) >= parseFloat(mission.total_quantity || 0);
      const isActive = v.is_active !== false && v.status === 'ACTIVE';
      return isTypeMatch && isCapacityMatch && isActive;
    });

    if (compatibleVehicles.length > 0) return { compatible: true };
    
    // Determine reason
    const hasActiveType = myVehicles.some(v => v.status === 'ACTIVE' && v.is_active !== false);
    if (!hasActiveType) return { compatible: false, reason: 'No active/approved vehicles' };
    
    const typeMatch = !mission.required_vehicle_type || mission.required_vehicle_type === 'standard' || myVehicles.some(v => v.type === mission.required_vehicle_type);
    if (!typeMatch) return { compatible: false, reason: 'No matching vehicle type' };
    
    return { compatible: false, reason: 'Insufficient payload capacity' };
  };

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
      <div className="transporter-hero-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ zIndex: 1, position: 'relative', flex: 1 }}>
          <div className="transporter-hero-deco">🚛🛣️</div>
          <div className="transporter-hero-content">
            <div className="transporter-hero-tag">
              <Clock size={13} /> Real-time Updates
            </div>
            <h1 className="transporter-hero-title">Logistics Control Center</h1>
            <p className="transporter-hero-sub" style={{ maxWidth: '80%' }}>
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
        <div style={{ zIndex: 10, position: 'relative', marginTop: '1rem', marginRight: '1rem' }} className="hidden md:block">
          <MiniWeatherWidget farmId={null} />
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────── */}
      {stats && (
        <div className="buyer-kpi-grid mb-4 mt-2">
          <div className="buyer-kpi-card stagger-1 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#10B9811a', color: '#10B981' }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.open_requests}</div>
              <div className="buyer-kpi-label">Available Missions</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-2 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#10B9811a', color: '#10B981' }}>
              <Truck size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_active_missions}</div>
              <div className="buyer-kpi-label">Active Routes</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-3 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#10B9811a', color: '#10B981' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_completed_missions}</div>
              <div className="buyer-kpi-label">Completed Deliveries</div>
            </div>
          </div>
          <div className="buyer-kpi-card stagger-4 animate-fade-up">
            <div className="buyer-kpi-icon" style={{ background: '#10B9811a', color: '#10B981' }}>
              <span className="font-black text-sm">DZ</span>
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

        <div className="px-3 py-3 bg-slate-50 border-bottom d-flex flex-wrap gap-3 align-items-end">
          <div className="flex-grow-1" style={{ maxWidth: 220 }}>
            <label className="very-small text-muted fw-bold mb-1 uppercase tracking-wider text-[9px]">Pickup Wilaya</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={[
                { value: 'ALL_ALGERIA', label: '🌍 All Algeria' },
                { value: 'ALL_ZONES',   label: '🏢 All My Service Zones' },
                ...(stats?.service_zones?.map(z => ({ value: z, label: z })) || [])
              ]}
              value={
                pickupWilaya === 'ALL_ALGERIA' ? { value: 'ALL_ALGERIA', label: '🌍 All Algeria' } :
                pickupWilaya === 'ALL_ZONES' || !pickupWilaya ? { value: 'ALL_ZONES', label: '🏢 All My Service Zones' } :
                { value: pickupWilaya, label: pickupWilaya }
              }
              onChange={val => setPickupWilaya(val ? val.value : 'ALL_ZONES')}
              placeholder="All My Service Zones"
              menuPlacement="bottom"
              menuPortalTarget={document.body}
              styles={reactSelectStyles}
            />
          </div>
          <div className="flex-grow-1" style={{ maxWidth: 220 }}>
            <label className="very-small text-muted fw-bold mb-1 uppercase tracking-wider text-[9px]">Destination Wilaya (Optional)</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={ALGERIAN_WILAYAS.map(w => ({ value: w.name, label: w.name }))}
              value={deliveryWilaya ? { value: deliveryWilaya, label: deliveryWilaya } : null}
              onChange={val => setDeliveryWilaya(val ? val.value : '')}
              placeholder="Select destination"
              isClearable
              menuPlacement="bottom"
              menuPortalTarget={document.body}
              styles={reactSelectStyles}
            />
          </div>
          <button className="btn-agr btn-primary btn-sm rounded shadow-sm px-4 fw-bold h-[38px]" onClick={fetchData}>
             Apply Filters
          </button>
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
                <th>Mission Details</th>
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
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-bold text-primary">MIL-{d.id.toString().padStart(4, '0')}</span>
                      <div className="very-small text-muted d-flex align-items-center gap-1">
                        <Clock size={10} />
                        {new Date(d.created_at).toLocaleDateString('en-GB')}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                         <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-black text-emerald-600 uppercase">
                            {parseFloat(d.estimated_fee || 0).toLocaleString()} DZD
                         </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <div className="mission-origin">
                        <MapPin size={11} />
                        {(d.pickup_location || `Farm #${d.order_detail?.items?.[0]?.farmer}`)}
                      </div>
                      <div className="mission-dest">
                        <Navigation size={11} />
                        {(d.delivery_location || d.order_detail?.delivery_address)}
                      </div>
                      <div className="mt-1 d-flex align-items-center gap-3">
                        <div className="very-small text-muted d-flex align-items-center gap-1">
                          <Route size={10} className="text-slate-400" />
                          <span className="fw-bold">{d.estimated_distance_km || '0'} KM</span>
                        </div>
                        <div className="very-small text-muted d-flex align-items-center gap-1">
                          <Clock size={10} className="text-slate-400" />
                          <span className="fw-bold">{d.estimated_duration || 'N/A'}</span>
                        </div>
                      </div>
                      {d.vehicle_size && !d.assigned_vehicle_info && (
                        <span className="status-badge status-assigned very-small" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', marginTop: 2 }}>
                          {d.vehicle_size} vehicle req.
                        </span>
                      )}
                      {d.assigned_vehicle_info && (
                        <div className="mt-2 p-1.5 bg-[#10B981]/20 border border-indigo-100 rounded-lg flex items-center gap-2 w-fit">
                           <Truck size={10} className="text-[#10B981]" />
                           <span className="text-[9px] font-black text-[#2DA83B] uppercase tracking-tight">
                              {d.assigned_vehicle_info.plate} — {d.assigned_vehicle_info.model}
                           </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="small fw-bold">Mission #{d.order}</div>
                    <div className="text-muted very-small d-flex align-items-center mt-1 gap-1">
                      <Package size={10} />
                      {d.order_detail?.items?.length || 0} items
                    </div>
                    {d.order_detail?.buyer_phone && (
                      <div className="mt-2 pt-2 border-top border-slate-100">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Buyer Contact</div>
                        <a 
                          href={`https://wa.me/${d.order_detail.buyer_phone}?text=${encodeURIComponent('Hello, I am the transporter assigned to your mission #' + d.order + '. I will contact you shortly.')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="d-inline-flex align-items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-black hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                        >
                          <Phone size={11} className="fill-emerald-700" /> {d.order_detail.buyer_phone}
                        </a>
                      </div>
                    )}
                    <button
                      className="btn-agr btn-primary btn-sm rounded-pill px-3 mt-2 d-flex align-items-center gap-1.5 font-black text-[10px] uppercase tracking-widest shadow-sm hover:scale-105 transition-all"
                      onClick={() => setViewingCargo(d)}
                    >
                      <ClipboardList size={11} /> Mission Manifest
                    </button>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {d.status === 'open' && (() => {
                      const { compatible, reason } = checkCompatibility(d);
                      const disabled = !compatible || hasActiveMission || actionLoading === d.id + '_accept';
                      
                      return (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <button
                            className={`btn-agr btn-sm rounded-pill px-4 py-2 fw-black text-[10px] uppercase tracking-widest shadow-md transition-all ${disabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-0' : 'btn-primary hover:scale-105 active:scale-95'}`}
                            onClick={() => setAcceptanceTarget(d)}
                            disabled={disabled}
                          >
                            {actionLoading === d.id + '_accept' ? 'Authorizing...' : 'Accept Mission'}
                          </button>
                          {hasActiveMission ? (
                            <div className="text-muted text-[9px] font-bold italic mt-1">
                              Complete active mission first.
                            </div>
                          ) : !compatible && (
                            <div className="text-rose-500 text-[9px] font-black uppercase tracking-tighter mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                               <X size={8} strokeWidth={3} /> {reason}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
        <MissionDetailsModal
          mission={viewingCargo}
          onClose={() => setViewingCargo(null)}
          onAccept={(m) => {
            setViewingCargo(null);
            setAcceptanceTarget(m);
          }}
          hasActiveMission={hasActiveMission}
          actionLoading={actionLoading === viewingCargo.id + '_accept'}
          compatibility={checkCompatibility(viewingCargo)}
        />
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
