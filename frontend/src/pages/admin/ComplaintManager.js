import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Info, 
  User, 
  MessageSquare, 
  Calendar, 
  ArrowRight,
  ArrowLeft,
  Send,
  Link as LinkIcon,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'OPEN';
  const config = {
    OPEN:      { cls: 'adm-badge-open',      icon: <Clock size={11} />,        label: 'Open' },
    IN_REVIEW: { cls: 'adm-badge-in_review', icon: <Info size={11} />,         label: 'In Review' },
    RESOLVED:  { cls: 'adm-badge-resolved',  icon: <CheckCircle size={11} />,  label: 'Resolved' },
    REJECTED:  { cls: 'adm-badge-rejected',  icon: <XCircle size={11} />,      label: 'Rejected' },
    CLOSED:    { cls: 'adm-badge-closed',    icon: <XCircle size={11} />,      label: 'Closed' },
  };
  const c = config[s] || config.OPEN;
  return (
    <span className={`adm-badge ${c.cls}`}>
      {c.icon}<span className="ml-1">{c.label}</span>
    </span>
  );
};

const ComplaintManager = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('OPEN');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/management/');
      setComplaints(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch(`/complaints/management/${selectedComplaint.id}/`, {
        status: newStatus,
        admin_notes: adminNotes
      });
      showToast('Complaint updated and user notified.', 'success');
      fetchComplaints();
      setSelectedComplaint(null);
    } catch (err) {
      showToast('Failed to update complaint.', 'error');
    } finally { setUpdating(false); }
  };

  const filtered = complaints.filter(c => {
    const matchesSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.creator_details?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || c.complaint_type === filterType;
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <ShieldAlert size={12} /> Dispute Resolution Center
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Grievance Registry
          </h1>
          <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-2">
            Mediate institutional reports and platform disputes
          </p>
        </div>
      </div>

      {/* ── Filters Bar ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
              placeholder="Search title, user, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All Classifications</option>
              <option value="ORDER">Order Disputes</option>
              <option value="DELIVERY">Logistics Failures</option>
              <option value="PRODUCT">Quality Reports</option>
              <option value="PAYMENT">Financial Inconsistencies</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Investigation</option>
              <option value="IN_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved / Closed</option>
              <option value="REJECTED">Decommissioned</option>
            </select>
          </div>
          <div className="lg:col-span-1 flex justify-end">
            <button className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl flex items-center justify-center transition-colors" onClick={fetchComplaints} title="Refresh Registry">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Split Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">

        {/* ── List Panel ────────────────────────── */}
        <div className={`lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in ${selectedComplaint ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">Ticket Registry</h3>
            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest">{filtered.length} Active Cases</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                 <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing disputes...</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <div className="p-16 text-center">
                    <MessageSquare size={48} className="text-slate-200 mx-auto mb-4 opacity-50" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry is currently empty.</p>
                  </div>
                ) : (
                  filtered.map(c => (
                    <div
                      key={c.id}
                      className={`p-5 cursor-pointer transition-all flex flex-col gap-2 relative border-l-4
                        ${selectedComplaint?.id === c.id ? 'bg-white border-l-emerald-600 shadow-sm z-10' : 'bg-transparent border-l-transparent hover:bg-white'}`}
                      onClick={() => {
                          setSelectedComplaint(c);
                          setNewStatus(c.status);
                          setAdminNotes(c.admin_notes || '');
                      }}
                    >
                      <div className="flex items-center justify-between">
                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                           c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           c.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>{c.status}</span>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{c.complaint_type.replace('_', ' ')}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight leading-snug line-clamp-1">{c.title}</h4>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1.5 truncate"><User size={12} className="text-emerald-600" /> {c.creator_details?.full_name}</span>
                        <span className="shrink-0">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ──────────────────────────── */}
        <div className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col animate-fade-in ${!selectedComplaint ? 'hidden lg:flex' : 'flex'}`}>
          {selectedComplaint ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                   <button className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600" onClick={() => setSelectedComplaint(null)}>
                     <ArrowLeft size={18} />
                   </button>
                   <div>
                     <h3 className="font-black text-sm text-slate-900 leading-none">{selectedComplaint.title}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Tracking No: AG-C-{selectedComplaint.id.toString().padStart(4, '0')}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {selectedComplaint.order && (
                      <button className="h-9 bg-slate-900 text-white text-[9px] font-black px-3 rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20" onClick={() => navigate(`/admin-dashboard/transactions?id=${selectedComplaint.order}`)}>
                        <LinkIcon size={12} /> Inspect Order
                      </button>
                    )}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                
                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Complainant Information</span>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black text-lg shadow-inner">
                          {selectedComplaint.creator_details?.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-sm truncate">{selectedComplaint.creator_details?.full_name}</div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{selectedComplaint.creator_details?.role} Actor</div>
                        </div>
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Incident Metadata</span>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">Registered On:</span>
                          <span className="text-slate-700 font-black">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">Current Status:</span>
                          <span className="text-emerald-600 font-black">{selectedComplaint.status}</span>
                        </div>
                     </div>
                   </div>
                </div>

                {/* Evidence Section */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-3">Official Statement / Description</span>
                  <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </div>
                  {selectedComplaint.attachment && (
                    <div className="mt-6 pt-6 border-t border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Evidence Attachment</span>
                      <a href={selectedComplaint.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                          <ImageIcon size={18} />
                        </div>
                        <div className="pr-4">
                           <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest">View Supporting Evidence</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">External Document / Media</div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Resolution Form */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Resolution</span>
                    <ShieldAlert size={16} className="text-emerald-600" />
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Classification Status</label>
                        <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                          <option value="OPEN">Open Investigation</option>
                          <option value="IN_REVIEW">Under Review</option>
                          <option value="RESOLVED">Resolved / Closed</option>
                          <option value="REJECTED">Rejected / False Claim</option>
                          <option value="CLOSED">Administrative Closure</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Official Resolution Notes <span className="text-amber-600 opacity-60">(Visible to Participant)</span></label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                        rows={4}
                        placeholder="Detail the investigation findings and the reasoning for the issued resolution..."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2" disabled={updating}>
                        {updating ? '...' : <><Send size={16} /> Sync Resolution Protocol</>}
                      </button>
                      <button type="button" className="px-6 h-11 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all" onClick={() => setSelectedComplaint(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
              <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                <ShieldAlert size={44} className="text-slate-100 opacity-50" />
              </div>
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400">Dispute Investigation Matrix</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Select a ticket to initialize investigation protocol.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ComplaintManager;
