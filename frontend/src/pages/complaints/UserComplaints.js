import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  AlertCircle, MessageSquare, Clock, CheckCircle, XCircle, 
  ChevronRight, Filter, Search, RefreshCw, Info, Calendar,
  MessageCircle, FileText, Plus, X, ShieldAlert, Send, Image as ImageIcon, Package
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'OPEN';
  const config = {
    OPEN:      { cls: 'bg-amber-100 text-amber-800 border-amber-200',   icon: <Clock size={12} />,        label: 'Open' },
    IN_REVIEW: { cls: 'bg-blue-100 text-blue-800 border-blue-200',   icon: <Info size={12} />,         label: 'In Review' },
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
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#22543d] mb-3">
            <Link to="/farmer-dashboard" className="hover:underline hover:text-[#1a402e] transition-colors">Farmer Hub</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={12}/> Audits & Dispositions</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            System Gripes Archive
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2 max-w-xl leading-relaxed">
            Track official escalations filed against internal systems, third-party logisticians, or financial faults.
          </p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 bg-[#22543d] hover:bg-[#1a402e] text-white px-6 py-3.5 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(34,84,61,0.3)] hover:shadow-[0_8px_25px_rgba(34,84,61,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95"
          onClick={() => navigate('/complaints/new?type=OTHER')}
        >
          <Plus size={18} strokeWidth={3} /> Log Global Incident
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto hide-scrollbar mb-8 max-w-fit shadow-inner">
        {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].map(f => (
          <button 
            key={f} 
            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeFilter === f ? 'bg-white text-[#22543d] shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-105' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveFilter(f)}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin" />
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Scanning Archive...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.length === 0 ? (
            <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto flex flex-col items-center shadow-sm">
              <div className="w-24 h-24 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-[2rem] flex items-center justify-center mb-8 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:rotate-12">
                <ShieldAlert size={48} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">No Active Dispositions</h2>
              <p className="text-slate-500 text-lg font-medium mb-8 px-8 leading-relaxed">There are zero registered incidents matching the applied matrix parameter.</p>
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(34,84,61,0.08)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform hover:-translate-y-1.5 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                  
                  {/* Left Block Payload */}
                  <div className="flex items-start gap-6 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-[#22543d] shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                      <FileText size={28} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{c.title}</h4>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-4 border-l-2 text-center border-slate-200">
                          {c.complaint_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed max-w-3xl">{c.description}</p>
                      
                      <div className="flex items-center gap-4 text-[11px] font-black tracking-widest uppercase text-slate-400">
                        <span className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl bg-slate-50 shadow-sm">
                          <Calendar size={14} className="text-slate-500" /> {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        {c.order && (
                          <span className="text-[#22543d] bg-[#22543d]/5 px-4 py-2 rounded-xl border border-[#22543d]/20 flex items-center gap-2 shadow-sm">
                            <Package size={14}/> SYS REF: {c.order}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Reference ID Column */}
                  <div className="md:border-l-2 border-slate-100 md:pl-8 flex flex-col md:items-end gap-3 shrink-0 w-full md:w-auto">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sequence</div>
                    <div className="font-mono text-slate-800 text-lg font-black bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
                      SYS-{c.id.toString().padStart(6, '0')}
                    </div>
                  </div>
                </div>

                {/* Resolution Output */}
                {c.admin_notes && (
                  <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-100 relative z-10">
                    <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-2xl p-6 flex gap-5 shadow-sm">
                      <Info size={24} className="text-[#22543d] shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <div className="text-[10px] font-black text-[#22543d] uppercase tracking-widest mb-2">Administration Directive / Resolution</div>
                        <p className="text-base text-slate-800 font-bold leading-relaxed">{c.admin_notes}</p>
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
