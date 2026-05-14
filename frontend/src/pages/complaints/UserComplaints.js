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
          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${user?.role === 'farmer' ? 'text-[#2E6F40]' : user?.role === 'admin' ? 'text-[#0f5c44]' : 'text-teal-600'}`}>
            <Link to="/profile" className={`hover:underline transition-colors ${user?.role === 'farmer' ? 'hover:text-[#2E6F40]' : user?.role === 'admin' ? 'hover:text-[#0f5c44]' : 'hover:text-teal-600'}`}>Dashboard</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={12}/> Complaints</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            My Complaints
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2 max-w-xl leading-relaxed">
            Track and manage your complaints regarding orders, deliveries, or system issues.
          </p>
        </div>
        <button 
          className={`inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md active:scale-95 transition-all ${user?.role === 'farmer' ? 'bg-[#2E6F40] hover:bg-[#255933]' : user?.role === 'admin' ? 'bg-[#0f5c44] hover:bg-[#0a3d2e]' : user?.role === 'transporter' ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : 'bg-teal-600 hover:bg-teal-700'}`}
          onClick={() => navigate('/complaints/new?type=OTHER')}
        >
          <Plus size={18} strokeWidth={3} /> New Complaint
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar mb-6 max-w-fit">
        {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].map(f => (
          <button 
            key={f} 
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition-all ${activeFilter === f ? (user?.role === 'farmer' ? 'bg-white text-[#2E6F40] shadow-sm' : user?.role === 'admin' ? 'bg-white text-[#0f5c44] shadow-sm' : user?.role === 'transporter' ? 'bg-white text-[#2E7D32] shadow-sm' : 'bg-white text-teal-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveFilter(f)}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-teal-600 animate-spin" />
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading complaints...</span>
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
