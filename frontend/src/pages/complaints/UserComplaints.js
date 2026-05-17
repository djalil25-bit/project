import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  AlertCircle, MessageSquare, Clock, CheckCircle, XCircle, 
  ChevronRight, Filter, Search, RefreshCw, Info, Calendar,
  MessageCircle, FileText, Plus, X, ShieldAlert, Send, Image as ImageIcon, Package
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'OPEN';
  const config = {
    OPEN:      { cls: 'bg-amber-100 text-amber-800 border-amber-200',   icon: <Clock size={12} />,        label: 'Open' },
    IN_REVIEW: { cls: 'bg-teal-100 text-teal-800 border-teal-200',   icon: <Info size={12} />,         label: 'In Review' },
    RESOLVED:  { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle size={12} />,  label: 'Resolved' },
    REJECTED:  { cls: 'bg-red-100 text-red-800 border-red-200',  icon: <XCircle size={12} />,      label: 'Rejected' },
    CLOSED:    { cls: 'bg-slate-200 text-slate-700 border-slate-300',  icon: <XCircle size={12} />,      label: 'Closed' },
  };
  const c = config[s] || config.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border shadow-sm ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
};

export default function UserComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="max-w-7xl mx-auto px-4 py-8 relative z-0 animate-fade-in">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
          <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
          <ChevronRight size={10} className="text-[#2E6F40]/40" />
          <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
            <ShieldAlert size={11} /> Complaints Registry
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
            <ShieldAlert size={22} strokeWidth={2.5} />
          </div>
          My <span className="text-[#2E6F40]">Complaints</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
          Track and manage your complaints regarding orders, deliveries, or system issues.
        </p>
      </div>
      <button 
        className="inline-flex items-center justify-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(46,111,64,0.3)] active:scale-95"
        onClick={() => navigate('/complaints/new?type=OTHER')}
      >
        <Plus size={16} strokeWidth={3} /> New Complaint
      </button>
    </div>

    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit mb-8 overflow-x-auto hide-scrollbar">
      {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].map(f => (
        <button 
          key={f} 
          className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === f ? 'bg-[#2E6F40] text-white shadow-md' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
          onClick={() => setActiveFilter(f)}
        >
          {f.replace('_', ' ')}
        </button>
      ))}
    </div>

    {loading ? (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#2E6F40] animate-spin" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data...</span>
      </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center shadow-sm max-w-xl mx-auto">
              <ShieldAlert size={32} className="text-slate-300 mb-3" strokeWidth={1.5} />
              <h2 className="text-lg font-black text-slate-800 mb-2">No Complaints Found</h2>
              <p className="text-slate-500 text-sm font-medium">No complaints match the selected filter.</p>
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 ${user?.role === 'farmer' ? 'text-[#2E6F40]' : user?.role === 'admin' ? 'text-[#0f5c44]' : 'text-teal-600'}`}>
                      <FileText size={18} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-base font-black text-slate-900">{c.title}</h4>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.complaint_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 font-medium leading-relaxed">{c.description}</p>
                      <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                          <Calendar size={12} className="text-slate-500" /> {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        {c.order && (
                          <span className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${user?.role === 'farmer' ? 'text-[#2E6F40] bg-[#2E6F40]/10 border-[#2E6F40]/20' : user?.role === 'admin' ? 'text-[#0f5c44] bg-[#0f5c44]/10 border-[#0f5c44]/20' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>
                            <Package size={12}/> Order #{c.order}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference</div>
                    <div className="font-mono text-slate-700 text-sm font-black bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      #{c.id.toString().padStart(5, '0')}
                    </div>
                  </div>
                </div>
                {c.admin_notes && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className={`border rounded-xl p-4 flex gap-3 ${user?.role === 'farmer' ? 'bg-[#2E6F40]/10 border-[#2E6F40]/20' : user?.role === 'admin' ? 'bg-[#0f5c44]/10 border-[#0f5c44]/20' : 'bg-teal-50 border-teal-100'}`}>
                      <Info size={16} className={`${user?.role === 'farmer' ? 'text-[#2E6F40]' : user?.role === 'admin' ? 'text-[#0f5c44]' : 'text-teal-600'} shrink-0 mt-0.5`} strokeWidth={2.5} />
                      <div>
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${user?.role === 'farmer' ? 'text-[#2E6F40]' : user?.role === 'admin' ? 'text-[#0f5c44]' : 'text-teal-700'}`}>Admin Response</div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{c.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
