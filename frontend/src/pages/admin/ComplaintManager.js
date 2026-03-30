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
    OPEN:      { cls: 'badge-status-waiting',   icon: <Clock size={12} />,        label: 'Open' },
    IN_REVIEW: { cls: 'badge-status-transit',   icon: <Info size={12} />,         label: 'In Review' },
    RESOLVED:  { cls: 'badge-status-delivered', icon: <CheckCircle size={12} />,  label: 'Resolved' },
    REJECTED:  { cls: 'badge-status-rejected',  icon: <XCircle size={12} />,      label: 'Rejected' },
    CLOSED:    { cls: 'badge-status-closed',    icon: <XCircle size={12} />,      label: 'Closed' },
  };
  const c = config[s] || config.OPEN;
  return (
    <span className={`inline-badge ${c.cls}`}>
      {c.icon}<span className="ms-1">{c.label}</span>
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
    <div className="admin-complaints animate-fade-in">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <ShieldAlert className="text-primary me-3" size={28} /> Disputes & Complaints Center
          </h1>
          <p className="page-subtitle text-muted">Review institutional disputes, investigate evidence, and issue resolutions.</p>
        </div>
      </div>

      <div className="agr-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-5">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" className="form-input ps-5" 
                placeholder="Search by title or reporter name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="ORDER">Order Issue</option>
              <option value="DELIVERY">Delivery Problem</option>
              <option value="PRODUCT">Product Quality</option>
              <option value="PAYMENT">Payment/Transaction</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="col-md-1">
             <button className="btn-agr btn-outline w-100" onClick={fetchComplaints} title="Reload list">
               <RefreshCw size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          {loading ? (
             <div className="flex-center py-5"><div className="spinner-agr" /></div>
          ) : (
            <div className="complaint-list">
              {filtered.length === 0 ? (
                <div className="agr-card p-5 text-center">
                   <MessageSquare size={64} className="text-muted opacity-25 mb-3" />
                   <p className="text-muted">No disputes found matching your criteria.</p>
                </div>
              ) : (
                filtered.map(c => (
                  <div 
                    key={c.id} 
                    className={`agr-card p-3 mb-3 cursor-pointer transition-all ${selectedComplaint?.id === c.id ? 'border-primary border-2 shadow-sm' : 'border'}`}
                    onClick={() => {
                        setSelectedComplaint(c);
                        setNewStatus(c.status);
                        setAdminNotes(c.admin_notes || '');
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                       <StatusBadge status={c.status} />
                       <span className="very-small text-muted fw-bold text-uppercase">{c.complaint_type.replace('_', ' ')}</span>
                    </div>
                    <h4 className="h6 fw-bold mb-1">{c.title}</h4>
                    <div className="d-flex align-items-center gap-3 very-small text-muted">
                        <span className="d-flex align-items-center"><User size={12} className="me-1" /> {c.creator_details?.full_name} ({c.creator_details?.role})</span>
                        <span className="d-flex align-items-center"><Calendar size={12} className="me-1" /> {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="col-lg-5">
           {selectedComplaint ? (
             <div className="agr-card p-4 animate-fade-in sticky-top" style={{ top: '2rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                   <h3 className="h6 fw-bold mb-0">Complaint Details</h3>
                   <div className="text-muted very-small">ticket: #{selectedComplaint.id.toString().padStart(4, '0')}</div>
                </div>

                <div className="mb-4">
                   <div className="very-small text-muted fw-bold text-uppercase mb-1">Issue Description</div>
                   <p className="small text-dark p-3 bg-light-soft rounded-lg border">{selectedComplaint.description}</p>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-6">
                       <div className="very-small text-muted fw-bold text-uppercase mb-1">Related Order</div>
                       {selectedComplaint.order ? (
                          <div className="small fw-bold text-primary d-flex align-items-center"><LinkIcon size={12} className="me-1" /> #AG-{selectedComplaint.order}</div>
                       ) : <span className="text-muted small italic">None linked</span>}
                    </div>
                    <div className="col-6">
                       <div className="very-small text-muted fw-bold text-uppercase mb-1">Evidence</div>
                       {selectedComplaint.attachment ? (
                          <a href={selectedComplaint.attachment} target="_blank" rel="noreferrer" className="small d-flex align-items-center text-primary">
                             <ImageIcon size={12} className="me-1" /> View Attachment
                          </a>
                       ) : <span className="text-muted small italic">No evidence provided</span>}
                    </div>
                 </div>

                 {selectedComplaint.order_details?.delivery_request?.pod_completed_at && (
                    <div className="mb-4 p-3 bg-light-soft rounded-lg border-dashed border-1 border-success">
                        <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold very-small text-uppercase">
                          <CheckCircle size={14} /> Mission Proof of Delivery
                        </div>
                        <div className="small mb-1"><span className="text-muted fw-bold">Signee:</span> {selectedComplaint.order_details.delivery_request.pod_recipient_name}</div>
                        <div className="very-small text-muted mb-2">
                           {new Date(selectedComplaint.order_details.delivery_request.pod_completed_at).toLocaleString()}
                        </div>
                        {selectedComplaint.order_details.delivery_request.pod_photo && (
                          <div className="pod-photo-preview mt-2">
                            <img 
                              src={selectedComplaint.order_details.delivery_request.pod_photo} 
                              alt="Handover Proof" 
                              className="img-fluid rounded border shadow-sm"
                              style={{ maxHeight: '120px', cursor: 'pointer' }}
                              onClick={() => window.open(selectedComplaint.order_details.delivery_request.pod_photo, '_blank')}
                            />
                          </div>
                        )}
                        {selectedComplaint.order_details.buyer_confirmed_at && (
                          <div className="mt-2 text-success very-small fw-bold">
                             ✓ BUYER CONFIRMED RECEIPT
                          </div>
                        )}
                    </div>
                 )}

                <form onSubmit={handleUpdate} className="agr-form pt-3 border-top">
                   <h5 className="h6 fw-bold mb-3 d-flex align-items-center gap-2"><ArrowRight size={16} className="text-primary" /> Resolution Actions</h5>
                   
                   <div className="form-group mb-3">
                      <label className="form-label small fw-bold">Update Status</label>
                      <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                         <option value="OPEN">Open</option>
                         <option value="IN_REVIEW">In Review</option>
                         <option value="RESOLVED">Resolved</option>
                         <option value="REJECTED">Rejected</option>
                         <option value="CLOSED">Closed</option>
                      </select>
                   </div>

                   <div className="form-group mb-4">
                      <label className="form-label small fw-bold">Resolution Notes (Public to user)</label>
                      <textarea 
                        className="form-input" rows="3" 
                        placeholder="Explain your decision or next steps..."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                      ></textarea>
                   </div>

                   <div className="d-flex gap-2">
                       <button type="submit" className="btn-agr btn-primary flex-grow-1 d-flex align-items-center justify-content-center" disabled={updating}>
                           {updating ? 'Saving...' : <><Send size={18} className="me-2" /> Sync Resolution</>}
                       </button>
                       <button type="button" className="btn-agr btn-outline" onClick={() => setSelectedComplaint(null)}>Cancel</button>
                   </div>
                </form>
             </div>
           ) : (
             <div className="agr-card p-5 text-center bg-light-soft border-dashed">
                <Info size={48} className="text-muted opacity-25 mb-3" />
                <h3 className="h6 text-muted">Select a ticket to investigate</h3>
                <p className="very-small text-muted">Detailed evidence and resolution tools will appear here.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintManager;
