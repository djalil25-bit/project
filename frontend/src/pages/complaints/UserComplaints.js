import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  AlertCircle, MessageSquare, Clock, CheckCircle, XCircle, 
  ChevronRight, Filter, Search, RefreshCw, Info, Calendar,
  MessageCircle, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const UserComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/');
      setComplaints(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = activeFilter === 'ALL' 
    ? complaints 
    : complaints.filter(c => c.status === activeFilter);

  return (
    <div className="complaints-page animate-fade-in">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <MessageSquare className="text-primary me-3" size={28} /> My Complaints & Disputes
          </h1>
          <p className="page-subtitle text-muted">Track our progress on your reported issues and review resolution notes.</p>
        </div>
      </div>

      <div className="tab-pills mb-4">
        {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].map(f => (
          <button 
            key={f} 
            className={`tab-pill border-0 ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center py-5"><div className="spinner-agr" /></div>
      ) : (
        <div className="row g-4">
          {filtered.length === 0 ? (
            <div className="col-12">
              <div className="agr-card p-5 text-center">
                <MessageCircle size={64} className="text-muted mb-3 opacity-25" />
                <h3 className="h5 text-muted">No complaints found</h3>
                <p className="small text-muted">You haven't reported any issues matching this filter.</p>
              </div>
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="col-12">
                <div className="agr-card p-4 hover-shadow transition-all">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div className="complaint-icon-square bg-light-soft p-3 rounded-lg">
                        <FileText size={24} className="text-primary" />
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-3 mb-1 flex-wrap">
                          <h4 className="h6 fw-bold mb-0">{c.title}</h4>
                          <StatusBadge status={c.status} />
                          <span className="very-small text-muted fw-bold text-uppercase border-start ps-2">{c.complaint_type.replace('_', ' ')}</span>
                        </div>
                        <p className="small text-muted mb-2 line-clamp-1">{c.description}</p>
                        <div className="d-flex align-items-center gap-3 very-small text-muted">
                          <span className="d-flex align-items-center"><Calendar size={12} className="me-1" /> {new Date(c.created_at).toLocaleDateString()}</span>
                          {c.order && <span className="fw-bold text-primary">Ref: #AG-{c.order}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-md-end gap-2">
                      <div className="text-muted very-small">Ticket ID: #{c.id.toString().padStart(4, '0')}</div>
                    </div>
                  </div>

                  {c.admin_notes && (
                    <div className="mt-4 p-3 bg-primary-50 border-start border-primary border-4 rounded-end-lg animate-slide-in">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Info size={14} className="text-primary" />
                        <span className="very-small fw-bold text-primary text-uppercase">Resolution Update</span>
                      </div>
                      <p className="small text-dark mb-0">{c.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserComplaints;
