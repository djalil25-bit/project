import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import { Link } from 'react-router-dom';
import {
  Truck, ChevronRight, Search, Check, X, Clock,
  User, Phone, Mail, AlertTriangle, FileText,
  Gauge, Zap, RefreshCw
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending', color: '#d97706', bg: '#fffbeb' },
  { key: 'ACTIVE', label: 'Approved', color: '#059669', bg: '#ecfdf5' },
  { key: 'REJECTED', label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
];

export default function VehicleApprovals() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [carteGrisePreview, setCarteGrisePreview] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/vehicle-approvals/?status=${activeTab}&search=${search}`);
      setVehicles(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, [activeTab, search]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminApi.post(`/vehicle-approvals/${id}/`, { action: 'approve' });
      fetchVehicles();
    } catch (err) { alert('Approval failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal);
    try {
      await adminApi.post(`/vehicle-approvals/${rejectModal}/`, { action: 'reject', reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchVehicles();
    } catch (err) { alert('Rejection failed'); }
    finally { setActionLoading(null); }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorcycle': return <Zap size={22} />;
      default: return <Truck size={22} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-3 bg-slate-50 px-3 py-1.5 rounded-full w-fit border border-slate-100 shadow-sm">
            <Link to="/admin-dashboard" className="hover:text-slate-800 transition-colors">Admin Hub</Link>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-slate-900">Vehicle Approvals</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]">
              <Truck size={36} strokeWidth={2.5} />
            </div>
            Vehicle Verification
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2 max-w-xl leading-relaxed">
            Review and approve vehicle registrations before they can accept delivery missions.
          </p>
        </div>
        <button onClick={fetchVehicles} className="bg-white border border-slate-200 hover:bg-slate-50 text-[#064e3b] px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* TAB BAR */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-0">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.key
              ? 'border-current text-slate-900'
              : 'border-transparent text-slate-400 hover:text-[#064e3b]'
            }`}
            style={activeTab === tab.key ? { color: tab.color } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by plate, model, owner..."
          className="w-full h-12 pl-11 pr-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
            <Truck size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No {activeTab.toLowerCase()} vehicles</h3>
          <p className="text-slate-500 font-medium">There are no vehicles with this status currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm border ${
                    vehicle.status === 'ACTIVE' ? 'bg-emerald-50 text-[#064e3b] border-emerald-100' :
                    vehicle.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {getVehicleIcon(vehicle.type)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{vehicle.type} • {vehicle.model}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {vehicle.fuelType} • Cap: {vehicle.capacity} KG
                    </div>
                  </div>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  vehicle.status === 'ACTIVE' ? 'bg-emerald-50 text-[#064e3b] border-emerald-200' :
                  vehicle.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                  'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    vehicle.status === 'ACTIVE' ? 'bg-emerald-500' :
                    vehicle.status === 'REJECTED' ? 'bg-red-500' :
                    'bg-amber-500 animate-pulse'
                  }`} />
                  {vehicle.status}
                </span>
              </div>

              {/* Specs */}
              <div className="p-5 flex items-center justify-between bg-slate-50/30">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Registry Plate</span>
                  <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">{vehicle.plate}</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Load Capacity</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Gauge size={14} className="text-slate-500" />
                    <span className="text-lg font-black text-[#064e3b] font-mono">
                      {parseFloat(vehicle.capacity) >= 1000 ? `${(parseFloat(vehicle.capacity)/1000).toFixed(1)}T` : `${vehicle.capacity}KG`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="px-5 py-3">
                <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-[#064e3b] font-black text-xs">
                    {vehicle.owner_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <User size={11} /> {vehicle.owner_name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <Mail size={9} /> {vehicle.owner_email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Grise */}
              <div className="px-5 pb-3">
                {vehicle.carte_grise ? (
                  <button
                    onClick={() => setCarteGrisePreview(vehicle.carte_grise.startsWith('http') ? vehicle.carte_grise : `http://localhost:8000${vehicle.carte_grise}`)}
                    className="w-full flex items-center justify-center gap-2 bg-[#064e3b] hover:bg-[#166534] text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-600/20 active:scale-95"
                  >
                    <FileText size={14} /> View Carte Grise Document
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-400 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <FileText size={14} className="opacity-50" /> Document Missing
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {vehicle.status === 'REJECTED' && vehicle.rejection_reason && (
                <div className="px-5 pb-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Rejection Reason</span>
                      <p className="text-xs text-red-700 font-medium mt-0.5">{vehicle.rejection_reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {vehicle.status === 'PENDING' && (
                <div className="px-5 pb-5 flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => handleApprove(vehicle.id)}
                    disabled={actionLoading === vehicle.id}
                    className="flex-1 bg-[#064e3b] hover:bg-emerald-700 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(vehicle.id)}
                    disabled={actionLoading === vehicle.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="bg-[#022c22] px-5 py-2 flex items-center justify-between mt-auto">
                <div className="text-[8px] font-black text-[#064e3b] uppercase tracking-widest">
                  REG: #{vehicle.id.toString().padStart(4, '0')}
                </div>
                {vehicle.reviewed_at && (
                  <div className="text-[8px] text-[#064e3b] font-medium flex items-center gap-1">
                    <Clock size={8} /> {new Date(vehicle.reviewed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022c22]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-in relative">
            <button className="absolute top-5 right-5 w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
              <X size={20} />
            </button>
            <div className="mb-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Reject Vehicle</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Provide a reason so the transporter can correct and resubmit.</p>
            </div>
            <textarea
              className="w-full h-32 bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-medium resize-none focus:outline-none focus:border-red-400 transition-all"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#064e3b] h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 disabled:opacity-50">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* CARTE GRISE PREVIEW MODAL */}
      {carteGrisePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022c22]/60 backdrop-blur-sm animate-fade-in" onClick={() => setCarteGrisePreview(null)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl max-h-[85vh] animate-scale-in relative overflow-auto" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all z-10" onClick={() => setCarteGrisePreview(null)}>
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><FileText size={18} /> Carte Grise Document</h3>
            {carteGrisePreview.endsWith('.pdf') ? (
              <iframe src={carteGrisePreview} className="w-full h-[60vh] rounded-xl border" title="Carte Grise" />
            ) : (
              <img src={carteGrisePreview} alt="Carte Grise" className="w-full rounded-xl border shadow-sm" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
