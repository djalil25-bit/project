import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import { Link } from 'react-router-dom';
import {
  Tractor, ChevronRight, Search, Check, X, Clock,
  MapPin, Maximize2, User, Phone, Mail, AlertTriangle,
  ImageOff, RefreshCw
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending', color: '#d97706', bg: '#fffbeb' },
  { key: 'ACTIVE', label: 'Approved', color: '#059669', bg: '#ecfdf5' },
  { key: 'REJECTED', label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
];

export default function FarmApprovals() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/farm-approvals/?status=${activeTab}&search=${search}`);
      setFarms(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFarms(); }, [activeTab, search]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminApi.post(`/farm-approvals/${id}/`, { action: 'approve' });
      fetchFarms();
    } catch (err) { alert('Approval failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal);
    try {
      await adminApi.post(`/farm-approvals/${rejectModal}/`, { action: 'reject', reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchFarms();
    } catch (err) { alert('Rejection failed'); }
    finally { setActionLoading(null); }
  };

  const pendingCount = farms.length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-100 shadow-sm">
            <Link to="/admin-dashboard" className="hover:text-emerald-800 transition-colors">Admin Hub</Link>
            <ChevronRight size={10} className="text-emerald-300" />
            <span className="text-emerald-900">Farm Approvals</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-emerald-600">
              <Tractor size={36} strokeWidth={2.5} />
            </div>
            Farm Verification
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2 max-w-xl leading-relaxed">
            Review and approve farm registrations before they can list products.
          </p>
        </div>
        <button onClick={fetchFarms} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
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
              : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            style={activeTab === tab.key ? { color: tab.color } : {}}
          >
            {tab.label}
            {tab.key === 'PENDING' && pendingCount > 0 && activeTab === 'PENDING' && (
              <span className="ml-2 bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, farmer, wilaya..."
          className="w-full h-12 pl-11 pr-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</span>
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
            <Tractor size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No {activeTab.toLowerCase()} farms</h3>
          <p className="text-slate-500 font-medium">There are no farms with this status currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {farms.map(farm => (
            <div key={farm.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Image Header */}
              <div className="relative h-40 bg-slate-100">
                {farm.image ? (
                  <img src={farm.image.startsWith('http') ? farm.image : `http://localhost:8000${farm.image}`} alt={farm.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center">
                    <ImageOff size={32} className="text-white/20" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border backdrop-blur-sm ${
                    farm.status === 'PENDING' ? 'bg-amber-500/90 text-white border-amber-400' :
                    farm.status === 'ACTIVE' ? 'bg-emerald-500/90 text-white border-emerald-400' :
                    'bg-red-500/90 text-white border-red-400'
                  }`}>
                    {farm.status === 'PENDING' ? '⏳ Pending' : farm.status === 'ACTIVE' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                  #{farm.id.toString().padStart(4, '0')}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{farm.name}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-amber-500" /> {farm.wilaya || farm.location}</span>
                    {farm.commune && <span className="text-slate-400">• {farm.commune}</span>}
                    {farm.size_hectares && (
                      <span className="flex items-center gap-1"><Maximize2 size={11} className="text-emerald-500" /> {farm.size_hectares} HA</span>
                    )}
                  </div>
                </div>

                {/* Owner Info */}
                <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-black text-sm">
                    {farm.owner_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <User size={12} /> {farm.owner_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                      <Mail size={10} /> {farm.owner_email}
                      {farm.owner_phone && <span className="flex items-center gap-1 ml-2"><Phone size={10} /> {farm.owner_phone}</span>}
                    </div>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {farm.status === 'REJECTED' && farm.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Rejection Reason</span>
                      <p className="text-xs text-red-700 font-medium mt-0.5">{farm.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Reviewed Info */}
                {farm.reviewed_at && (
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock size={10} /> Reviewed: {new Date(farm.reviewed_at).toLocaleString()}
                  </div>
                )}

                {/* Action Buttons */}
                {farm.status === 'PENDING' && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(farm.id)}
                      disabled={actionLoading === farm.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModal(farm.id)}
                      disabled={actionLoading === farm.id}
                      className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {/* Date */}
                <div className="text-[10px] text-slate-400 font-medium">
                  Submitted: {new Date(farm.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-in relative">
            <button className="absolute top-5 right-5 w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
              <X size={20} />
            </button>
            <div className="mb-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Reject Farm</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Provide a reason so the farmer can correct and resubmit.</p>
            </div>
            <textarea
              className="w-full h-32 bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-medium resize-none focus:outline-none focus:border-red-400 transition-all"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 disabled:opacity-50">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
