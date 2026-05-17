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
  Image as ImageIcon,
  X,
  FileText,
  FileDown,
  ChevronRight,
  Gavel,
  Scale
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'OPEN';
  const config = {
    OPEN:      { cls: 'bg-amber-50 text-amber-600 border-amber-100',      icon: <Clock size={10} />,        label: 'Investigation' },
    IN_REVIEW: { cls: 'bg-blue-50 text-blue-600 border-blue-100',         icon: <Info size={10} />,         label: 'Under Review' },
    RESOLVED:  { cls: 'bg-emerald-50 text-[#064e3b] border-emerald-100',  icon: <CheckCircle size={10} />,  label: 'Resolved' },
    REJECTED:  { cls: 'bg-rose-50 text-rose-600 border-rose-100',         icon: <XCircle size={10} />,      label: 'Decommissioned' },
    CLOSED:    { cls: 'bg-slate-50 text-slate-600 border-slate-100',      icon: <XCircle size={10} />,      label: 'Closed' },
  };
  const c = config[s] || config.OPEN;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 w-fit ${c.cls}`}>
      {c.icon} {c.label}
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
  const [attachmentPreview, setAttachmentPreview] = useState(null);

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
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <ArrowLeft size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <ShieldAlert size={11} /> Grievance Registry
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]">
              <Scale size={28} strokeWidth={2.5} />
            </div>
            Dispute <span className="text-[#064e3b]">Resolution Center</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Institutional mediation framework for global incident reports, trade disputes, and platform guardrail mediation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95" onClick={fetchComplaints}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Registry
          </button>
        </div>
      </div>

      {/* ── FILTERS BAR ─────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
            <input
              type="text"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all uppercase"
              placeholder="Search Subject, Identity, or Protocol ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <div className="relative h-12 flex items-center">
              <Filter size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
              <select className="w-full h-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner appearance-none cursor-pointer" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="ALL">All Classifications</option>
                <option value="ORDER">Order Disputes</option>
                <option value="DELIVERY">Logistics Failures</option>
                <option value="PRODUCT">Quality Reports</option>
                <option value="PAYMENT">Financial Discrepancies</option>
              </select>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="relative h-12 flex items-center">
              <ShieldAlert size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
              <select className="w-full h-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner appearance-none cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">All Operational Statuses</option>
                <option value="OPEN">Open Investigation</option>
                <option value="IN_REVIEW">Under Official Review</option>
                <option value="RESOLVED">Resolved Registry</option>
                <option value="REJECTED">Decommissioned Reports</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Split Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[750px]">

        {/* ── List Panel ────────────────────────── */}
        <div className={`lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in ${selectedComplaint ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#064e3b]">
                <Gavel size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">Ticket Registry</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Operational Queue</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm">{filtered.length} Cases</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                 <div className="w-10 h-10 border-4 border-slate-100 border-t-[#064e3b] rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing disputes...</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
                      <MessageSquare size={40} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">Registry index is currently empty.</p>
                  </div>
                ) : (
                  filtered.map(c => (
                    <div
                      key={c.id}
                      className={`p-6 cursor-pointer transition-all flex flex-col gap-3 relative border-l-4
                        ${selectedComplaint?.id === c.id ? 'bg-emerald-50/30 border-l-[#064e3b] shadow-inner' : 'bg-transparent border-l-transparent hover:bg-slate-50/50'}`}
                      onClick={() => {
                          setSelectedComplaint(c);
                          setNewStatus(c.status);
                          setAdminNotes(c.admin_notes || '');
                      }}
                    >
                      <div className="flex items-center justify-between">
                         <StatusBadge status={c.status} />
                         <span className="text-[8px] font-black text-[#064e3b] bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100">{c.complaint_type.replace('_', ' ')}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm tracking-tight leading-snug line-clamp-2 uppercase">{c.title}</h4>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1.5 truncate text-slate-900"><User size={12} className="text-[#064e3b]" /> {c.creator_details?.full_name}</span>
                        <span className="shrink-0 flex items-center gap-1"><Calendar size={12} /> {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ──────────────────────────── */}
        <div className={`lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col animate-fade-in ${!selectedComplaint ? 'hidden lg:flex' : 'flex'}`}>
          {selectedComplaint ? (
            <div className="flex flex-col flex-1 overflow-hidden relative">
              
              {/* Internal Header */}
              <div className="px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 relative z-10">
                 <div className="flex items-center gap-4">
                   <button className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#064e3b] transition-all" onClick={() => setSelectedComplaint(null)}>
                     <ArrowLeft size={18} />
                   </button>
                   <div>
                     <h3 className="font-black text-base text-slate-900 tracking-tight leading-none uppercase">{selectedComplaint.title}</h3>
                     <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest mt-2 flex items-center gap-2">
                       Protocol Tracking ID: <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-black">AG-C-{selectedComplaint.id.toString().padStart(5, '0')}</span>
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {selectedComplaint.order && (
                      <button className="h-10 bg-[#064e3b] text-white text-[10px] font-black px-5 rounded-2xl uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-[#022c22] transition-all shadow-xl shadow-emerald-900/20 active:scale-95" onClick={() => navigate(`/admin-dashboard/transactions?id=${selectedComplaint.order}`)}>
                        <Search size={14} /> Audit Manifest
                      </button>
                    )}
                    <button className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center lg:hidden" onClick={() => setSelectedComplaint(null)}>
                      <X size={20} />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/20 custom-scrollbar">
                
                {/* Information Cluster */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-3">Complainant Architecture</span>
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#064e3b] border-2 border-emerald-100 flex items-center justify-center font-black text-xl shadow-inner uppercase">
                          {selectedComplaint.creator_details?.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-base truncate uppercase">{selectedComplaint.creator_details?.full_name}</div>
                          <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <ShieldAlert size={12} /> {selectedComplaint.creator_details?.role} Actor
                          </div>
                        </div>
                     </div>
                   </div>

                   <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-3">Registry Timestamp</span>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-400 flex items-center gap-2"><Clock size={12} /> Registered:</span>
                          <span className="text-slate-900">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-400 flex items-center gap-2"><Filter size={12} /> Current Phase:</span>
                          <StatusBadge status={selectedComplaint.status} />
                        </div>
                     </div>
                   </div>
                </div>

                {/* Narrative Statement */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <MessageSquare size={120} className="text-[#064e3b]" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-4 relative z-10">Official Statement Manifest</span>
                  <div className="text-base font-bold text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">
                    {selectedComplaint.description}
                  </div>
                  {selectedComplaint.attachment && (
                    <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-5">Evidence Catalog Attachment</span>
                      <button 
                        onClick={() => {
                          const url = selectedComplaint.attachment.startsWith('http') 
                            ? selectedComplaint.attachment 
                            : `http://localhost:8000${selectedComplaint.attachment}`;
                          setAttachmentPreview(url);
                        }} 
                        className="inline-flex items-center gap-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-2xl transition-all group w-full text-left shadow-inner"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-[#064e3b] shadow-sm group-hover:scale-105 transition-all">
                          <ImageIcon size={22} />
                        </div>
                        <div>
                           <div className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Inspect Dispute Evidence</div>
                           <div className="text-[9px] font-black text-[#064e3b] uppercase tracking-widest opacity-60 mt-0.5">High-Resolution Payload Payload</div>
                        </div>
                        <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-[#064e3b] transition-colors" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Resolution Protocol Form */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-[#064e3b]/10 shadow-xl shadow-emerald-900/5 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <Send size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">Resolution Protocol</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Official Administrative Decision</p>
                      </div>
                    </div>
                    <Scale size={20} className="text-[#064e3b] opacity-20" />
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Protocol Status Update</label>
                        <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all appearance-none uppercase cursor-pointer" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                          <option value="OPEN">Open Investigation</option>
                          <option value="IN_REVIEW">Under Official Review</option>
                          <option value="RESOLVED">Resolved / Closed Registry</option>
                          <option value="REJECTED">Decommission Claim</option>
                          <option value="CLOSED">Administrative Closure</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Official Findings & Mandate <span className="text-[#064e3b] opacity-40 italic">(Synchronized to User)</span></label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all"
                        rows={5}
                        placeholder="Detail the investigation findings and institutional reasoning for this resolution mandate..."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button type="submit" className="flex-1 h-14 bg-[#064e3b] hover:bg-[#022c22] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" disabled={updating}>
                        {updating ? '...' : <><RefreshCw size={18} className="animate-pulse" /> Finalize Resolution Manifest</>}
                      </button>
                      <button type="button" className="px-8 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95" onClick={() => setSelectedComplaint(null)}>Decline</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/20 p-20 text-center">
              <div className="w-32 h-32 bg-white border border-slate-100 rounded-[3rem] flex items-center justify-center mb-8 shadow-sm">
                <Scale size={56} className="text-slate-100" />
              </div>
              <h3 className="font-black text-[12px] uppercase tracking-widest text-slate-400">Dispute Investigation Matrix</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 leading-relaxed max-w-xs">Initialize official investigation protocol by selecting a registry ticket from the operational queue.</p>
            </div>
          )}
        </div>

      </div>
      {/* ── ATTACHMENT PREVIEW MODAL ── */}
      {attachmentPreview && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setAttachmentPreview(null)}>
          <div className="bg-white rounded-[2.5rem] overflow-hidden max-w-5xl w-full max-h-[95vh] shadow-2xl animate-scale-in relative flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase text-sm">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-[#064e3b]">
                  <FileText size={18} />
                </div>
                Evidence Manifest Registry
              </h3>
              <div className="flex items-center gap-3">
                <a href={attachmentPreview} download className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#064e3b] hover:bg-emerald-50 transition-all shadow-sm" title="Download Official Artifact">
                  <FileDown size={20} />
                </a>
                <button onClick={() => setAttachmentPreview(null)} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center items-center">
              {attachmentPreview.toLowerCase().endsWith('.pdf') ? (
                <iframe src={attachmentPreview} className="w-full h-full min-h-[70vh] rounded-[2rem] shadow-2xl border-8 border-white" title="Evidence Preview" />
              ) : (
                <img src={attachmentPreview} alt="Evidence Preview" className="max-w-full h-auto rounded-[2rem] shadow-2xl border-8 border-white" />
              )}
            </div>
            <div className="p-6 bg-white text-center border-t border-slate-100">
              <button onClick={() => setAttachmentPreview(null)} className="px-10 py-3 bg-[#064e3b] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#022c22] transition-all shadow-xl shadow-emerald-900/20 active:scale-95">Decommission Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManager;
