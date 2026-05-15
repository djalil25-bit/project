import React, { useState, useEffect, useCallback } from 'react';
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
  Route,
  AlertTriangle,
  ShieldOff,
  Flag,
  Star,
  Zap,
  ArrowRightFromLine,
  Upload
} from 'lucide-react';
import ProofOfDeliveryModal from '../../components/logistics/ProofOfDeliveryModal';
import VehicleSelectionModal from '../../components/logistics/VehicleSelectionModal';
import MissionDetailsModal from '../../components/logistics/MissionDetailsModal';
import RefusalModal from '../../components/logistics/RefusalModal';
import MiniWeatherWidget from '../../components/weather/MiniWeatherWidget';

const StatusBadge = ({ status }) => {
  const map = {
    open:                { label: 'Available',      cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    high_priority:       { label: '⚡ HIGH PRIORITY', cls: 'bg-red-600 text-white border-red-700 animate-pulse shadow-md' },
    assigned:            { label: 'Assigned',       cls: 'bg-[#10B981]/20 text-[#2DA83B] border-[#10B981]/50' },
    picked_up:           { label: 'Picked Up',      cls: 'bg-[#10B981]/20 text-[#2DA83B] border-[#10B981]/50 shadow-sm' },
    in_transit:          { label: 'In Transit',     cls: 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm animate-pulse' },
    refused_delivery:    { label: 'Refused',        cls: 'bg-rose-100 text-rose-800 border-rose-200 font-bold' },
    return_in_progress:  { label: 'Returning',      cls: 'bg-rose-50 text-rose-700 border-rose-200 border-dashed animate-pulse' },
    returned:            { label: 'Returned',       cls: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black' },
    delivered:           { label: 'Delivered',      cls: 'bg-slate-900 text-white border-slate-900 shadow-sm font-black' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>;
};

// ── Commitment Countdown Timer ──────────────────────────────────────────────
const CommitmentTimer = ({ commitmentStatus }) => {
  const [secsLeft, setSecsLeft] = useState(commitmentStatus?.remaining_seconds ?? 0);

  useEffect(() => {
    if (!commitmentStatus) return;
    setSecsLeft(commitmentStatus.remaining_seconds);
    const interval = setInterval(() => {
      setSecsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [commitmentStatus]);

  if (!commitmentStatus) return null;

  const h = Math.floor(secsLeft / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  const s = secsLeft % 60;
  const isUrgent = secsLeft < 1800; // < 30 min
  const isOverdue = secsLeft === 0;

  return (
    <div className={`mt-2 rounded-xl px-3 py-2 border flex items-center gap-2 ${
      isOverdue ? 'bg-red-50 border-red-200 animate-pulse' :
      isUrgent  ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200'
    }`}>
      <Clock size={12} className={isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-600' : 'text-emerald-600'} />
      <div className="flex flex-col">
        <span className={`text-[9px] font-black uppercase tracking-widest ${
          isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-emerald-700'
        }`}>
          {isOverdue ? '⚠ Window Expired — Depart Immediately' : 'Activation Window'}
        </span>
        <span className={`font-black text-sm tabular-nums ${
          isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-800' : 'text-emerald-800'
        }`}>
          {isOverdue ? 'OVERDUE' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
        </span>
      </div>
    </div>
  );
};

// ── Suspension Banner ───────────────────────────────────────────────────────
const SuspensionBanner = ({ suspendedUntil }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(suspendedUntil) - new Date();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [suspendedUntil]);

  return (
    <div className="mx-4 mt-4 bg-red-900 border border-red-700 rounded-2xl p-5 flex items-start gap-4 shadow-xl">
      <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center shrink-0">
        <ShieldOff size={24} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-white font-black text-base tracking-tight">Marketplace Access Suspended</h3>
        <p className="text-red-200 text-sm mt-1">
          Your marketplace access has been temporarily suspended due to repeated mission abandonment.
          You cannot accept new missions until the suspension expires.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="bg-red-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <Clock size={14} className="text-red-300" />
            <span className="text-white font-black text-sm">{timeLeft}</span>
          </div>
        </div>
        <p className="text-red-300 text-xs mt-3 font-medium">
          Complete your missions within the 2-hour activation window and limit your cancellations to avoid future suspensions.
        </p>
      </div>
    </div>
  );
};

// ── Relinquish Modal ────────────────────────────────────────────────────────
const RelinquishModal = ({ mission, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim() && !proofFile) {
      setError('Please provide a written reason or upload proof to relinquish this mission.');
      return;
    }
    onConfirm(mission.id, reason, proofFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-red-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag size={20} className="text-white" />
            <div>
              <h3 className="text-white font-black text-base">Relinquish Mission</h3>
              <p className="text-red-200 text-xs">Mission MIL-{String(mission.id).padStart(4,'0')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm font-medium">
              Relinquishing this mission will consume <strong>1 strike</strong> out of your 3 allowed cancellations.
              The mission will be returned to the marketplace. Exceeding 3 cancellations will result in an automatic <strong>7-day marketplace suspension</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              Reason for Relinquishment
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Vehicle breakdown, road blockage, medical emergency..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              Proof Image (Optional but recommended)
            </label>
            <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-500 font-medium">
                {proofFile ? proofFile.name : 'Upload breakdown photo or document'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { setProofFile(e.target.files[0]); setError(''); }}
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : <><Flag size={14} /> Confirm Relinquishment</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [relinquishTarget, setRelinquishTarget] = useState(null);
  const [myVehicles, setMyVehicles] = useState([]);
  const [pickupWilaya, setPickupWilaya] = useState('');
  const [deliveryWilaya, setDeliveryWilaya] = useState('');
  // Commitment enforcement state
  const [currentUser, setCurrentUser] = useState(null);
  const isSuspended = currentUser?.suspended_until && new Date(currentUser.suspended_until) > new Date();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, delivRes, vehicleRes, userRes] = await Promise.all([
        api.get('/dashboards/transporter-stats/'),
        api.get('/deliveries/', { params: { pickup_wilaya: pickupWilaya, delivery_wilaya: deliveryWilaya } }),
        api.get('/vehicles/'),
        api.get('/auth/me/')
      ]);
      setStats(statsRes.data);
      setDeliveries(delivRes.data.results || delivRes.data);
      setMyVehicles(vehicleRes.data.results || vehicleRes.data);
      setCurrentUser(userRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [pickupWilaya, deliveryWilaya]);

  const handleAccept = async (id, vehicleId) => {
    setActionLoading(id + '_accept');
    try {
      await api.post(`/deliveries/${id}/accept/`, { vehicle_id: vehicleId });
      fetchData();
      setActiveTab('mine');
    } catch (err) { 
      console.error('[LOGISTICS] Mission Acceptance Failed:', err);
      const errData = err.response?.data;
      // Handle suspension specifically
      if (errData?.error === 'marketplace_suspended') {
        fetchData(); // Refresh to show suspension banner
      }
      const msg = errData?.message || errData?.error || err.message || 'Failed to accept mission';
      if (msg.includes('current mission is completed')) fetchData();
      throw new Error(msg);
    } finally { setActionLoading(null); }
  };

  const handleStartMission = async (id) => {
    setActionLoading(id + '_start');
    try {
      await api.post(`/deliveries/${id}/start_mission/`);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start mission';
      alert(msg);
    } finally { setActionLoading(null); }
  };

  const handleRelinquish = async (id, reason, proofFile) => {
    setActionLoading(id + '_relinquish');
    try {
      const formData = new FormData();
      if (reason) formData.append('reason', reason);
      if (proofFile) formData.append('proof', proofFile);
      const res = await api.post(`/deliveries/${id}/relinquish/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRelinquishTarget(null);
      fetchData();
      setActiveTab('open');
      if (res.data.suspended) {
        alert("Mission relinquished. Warning: Your marketplace access is suspended for 7 days due to repeated cancellations.");
      } else {
        alert(`Mission relinquished. Strike ${res.data.cancellation_count}/3.`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to relinquish mission';
      throw new Error(msg);
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

  const openCount = deliveries.filter(d => ['open', 'high_priority'].includes(d.status)).length;

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
    ? deliveries.filter(d => ['open', 'high_priority'].includes(d.status))
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

      {/* ── SUSPENSION BANNER ───────────────────────────────────────── */}
      {isSuspended && (
        <SuspensionBanner
          suspendedUntil={currentUser.suspended_until}
        />
      )}

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
          <div className={`buyer-kpi-card stagger-4 animate-fade-up ${isSuspended ? 'border-red-200 bg-red-50' : ''}`}>
            <div className="buyer-kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className={`buyer-kpi-value ${isSuspended ? 'text-red-600' : ''}`}>
                {currentUser?.cancellation_count ?? 0} <span className="text-sm text-slate-400">/ 3</span>
                {isSuspended && <span className="text-[10px] font-black text-red-500 ml-1 uppercase">Suspended</span>}
              </div>
              <div className="buyer-kpi-label">Cancellations</div>
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
                      <div className="flex flex-col items-end gap-2">
                        {/* Live 2-hour countdown timer */}
                        <CommitmentTimer commitmentStatus={d.commitment_status} />
                        {/* Primary CTA: Departing to Farm */}
                        <button
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 w-full justify-center"
                          onClick={() => handleStartMission(d.id)}
                          disabled={actionLoading === d.id + '_start'}
                        >
                          <ArrowRightFromLine size={14} />
                          {actionLoading === d.id + '_start' ? 'Confirming...' : 'Departing to Farm'}
                        </button>
                        {/* Secondary: Relinquish */}
                        <button
                          className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all w-full justify-center"
                          onClick={() => setRelinquishTarget(d)}
                          disabled={actionLoading === d.id + '_relinquish'}
                        >
                          <Flag size={12} />
                          Relinquish Mission
                        </button>
                      </div>
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
                              <a
                                className="btn-agr btn-link p-0 mt-1 d-flex align-items-center gap-1"
                                style={{ fontSize: '0.65rem' }}
                                href={d.pod_photo} download target="_self"
                              >
                                <Camera size={10} /> Download Proof
                              </a>
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

      {relinquishTarget && (
        <RelinquishModal
          mission={relinquishTarget}
          onClose={() => setRelinquishTarget(null)}
          onConfirm={handleRelinquish}
          loading={actionLoading === relinquishTarget.id + '_relinquish'}
        />
      )}
    </div>
  );
}

export default TransporterDashboard;
