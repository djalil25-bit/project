import React, { useState, useEffect } from 'react';
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
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.creator_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || c.complaint_type === filterType;
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up">

      {/* ── Page Header ──────────────────────────────── */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-3">
          <ShieldAlert className="text-emerald-400" size={26} /> Disputes &amp; Complaints Center
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review institutional disputes, investigate evidence, and issue resolutions.</p>
      </div>

      {/* ── Search & Filters Bar ──────────────────────── */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              className="adm-input pl-9"
              placeholder="Search by title or reporter name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <select className="adm-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="ORDER">Order Issue</option>
              <option value="DELIVERY">Delivery Problem</option>
              <option value="PRODUCT">Product Quality</option>
              <option value="PAYMENT">Payment/Transaction</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <select className="adm-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button className="adm-btn adm-btn-ghost w-full h-full justify-center" onClick={fetchComplaints} title="Reload list">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Split Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

        {/* ── Complaint List ────────────────────────── */}
        <div className="lg:col-span-4">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="adm-spinner"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <MessageSquare size={56} className="text-slate-600 opacity-25 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No disputes found matching your criteria.</p>
                </div>
              ) : (
                filtered.map(c => (
                  <div
                    key={c.id}
                    className={`glass-card p-4 cursor-pointer transition-all hover:border-emerald-500/30 ${
                      selectedComplaint?.id === c.id ? 'border-emerald-500/40 shadow-admin' : ''
                    }`}
                    onClick={() => {
                        setSelectedComplaint(c);
                        setNewStatus(c.status);
                        setAdminNotes(c.admin_notes || '');
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{c.complaint_type.replace('_', ' ')}</span>
                    </div>
                    <h4 className="font-semibold text-slate-200 text-sm mb-2">{c.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User size={11} /> {c.creator_details?.full_name} ({c.creator_details?.role})</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Detail Panel ──────────────────────────── */}
        <div className="lg:col-span-3">
          {selectedComplaint ? (
            <div className="glass-card p-5 sticky top-6 anim-scale-in">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <h3 className="font-bold text-slate-200 text-sm">Complaint Details</h3>
                <div className="text-xs text-slate-500">ticket: #{selectedComplaint.id.toString().padStart(4, '0')}</div>
              </div>

              <div className="mb-4">
                <div className="adm-label mb-2">Issue Description</div>
                <p className="text-sm text-slate-300 p-3 rounded-xl bg-white/4 border border-white/6 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="adm-label mb-1">Related Order</div>
                  {selectedComplaint.order ? (
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <LinkIcon size={11} /> #AG-{selectedComplaint.order}
                    </div>
                  ) : <span className="text-slate-500 text-sm italic">None linked</span>}
                </div>
                <div>
                  <div className="adm-label mb-1">Evidence</div>
                  {selectedComplaint.attachment ? (
                    <a href={selectedComplaint.attachment} target="_blank" rel="noreferrer" className="text-sm flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                      <ImageIcon size={11} /> View Attachment
                    </a>
                  ) : <span className="text-slate-500 text-sm italic">No evidence provided</span>}
                </div>
              </div>

              {selectedComplaint.order_details?.delivery_request?.pod_completed_at && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle size={13} /> Mission Proof of Delivery
                  </div>
                  <div className="text-sm mb-1 text-slate-300"><span className="text-slate-500 font-bold">Signee:</span> {selectedComplaint.order_details.delivery_request.pod_recipient_name}</div>
                  <div className="text-xs text-slate-500 mb-2">
                    {new Date(selectedComplaint.order_details.delivery_request.pod_completed_at).toLocaleString()}
                  </div>
                  {selectedComplaint.order_details.delivery_request.pod_photo && (
                    <div className="mt-2">
                      <img
                        src={selectedComplaint.order_details.delivery_request.pod_photo}
                        alt="Handover Proof"
                        className="rounded-lg border border-white/10 shadow-sm"
                        style={{ maxHeight: '110px', cursor: 'pointer' }}
                        onClick={() => window.open(selectedComplaint.order_details.delivery_request.pod_photo, '_blank')}
                      />
                    </div>
                  )}
                  {selectedComplaint.order_details.buyer_confirmed_at && (
                    <div className="mt-2 text-emerald-400 text-xs font-bold">✓ BUYER CONFIRMED RECEIPT</div>
                  )}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-3 pt-3 border-t border-white/5">
                <h5 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <ArrowRight size={14} className="text-emerald-400" /> Resolution Actions
                </h5>

                <div>
                  <label className="adm-label">Update Status</label>
                  <select className="adm-input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="OPEN">Open</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="adm-label">Resolution Notes (Public to user)</label>
                  <textarea
                    className="adm-input"
                    rows="3"
                    placeholder="Explain your decision or next steps..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" className="adm-btn adm-btn-primary flex-1 justify-center py-2.5" disabled={updating}>
                    {updating ? 'Saving...' : <><Send size={14} /> Sync Resolution</>}
                  </button>
                  <button type="button" className="adm-btn adm-btn-ghost px-4" onClick={() => setSelectedComplaint(null)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Info size={44} className="text-slate-600 opacity-25 mx-auto mb-3" />
              <h3 className="text-slate-500 font-medium text-sm">Select a ticket to investigate</h3>
              <p className="text-slate-600 text-xs mt-1">Detailed evidence and resolution tools will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ComplaintManager;
