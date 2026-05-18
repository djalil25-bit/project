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

  const getTheme = () => {
    switch (user?.role) {
      case 'buyer':
        return {
          primary: 'text-[#0F766E]',
          bgPrimary: 'bg-[#0F766E]',
          hoverPrimary: 'hover:bg-[#0f5c56]',
          bgSoft: 'bg-[#0F766E]/10',
          borderSoft: 'border-[#0F766E]/20',
          shadowPrimary: 'shadow-[0_10px_30px_rgba(15,118,110,0.3)]',
          hubText: 'Marketplace',
          hubLink: '/buyer-dashboard',
          spinnerColor: 'border-t-[#0F766E]',
        };
      case 'transporter':
        return {
          primary: 'text-[#d97706]',
          bgPrimary: 'bg-[#d97706]',
          hoverPrimary: 'hover:bg-[#b45309]',
          bgSoft: 'bg-[#d97706]/10',
          borderSoft: 'border-[#d97706]/20',
          shadowPrimary: 'shadow-[0_10px_30px_rgba(217,119,6,0.3)]',
          hubText: 'Fleet Hub',
          hubLink: '/transporter-dashboard',
          spinnerColor: 'border-t-[#d97706]',
        };
      default: // farmer
        return {
          primary: 'text-[#2E6F40]',
          bgPrimary: 'bg-[#2E6F40]',
          hoverPrimary: 'hover:bg-[#255933]',
          bgSoft: 'bg-[#2E6F40]/10',
          borderSoft: 'border-[#2E6F40]/20',
          shadowPrimary: 'shadow-[0_10px_30px_rgba(46,111,64,0.3)]',
          hubText: 'Farmer Hub',
          hubLink: '/farmer-dashboard',
          spinnerColor: 'border-t-[#2E6F40]',
        };
    }
  };
  const theme = getTheme();

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
        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${theme.primary} mb-5 ${theme.bgSoft} px-3 py-1 rounded-full w-fit border ${theme.borderSoft} shadow-sm`}>
          <Link to={theme.hubLink} className="hover:opacity-80 transition-opacity">{theme.hubText}</Link>
          <ChevronRight size={10} className="opacity-40" />
          <span className={`${theme.primary} flex items-center gap-1.5 font-black uppercase`}>
            <ShieldAlert size={11} /> Complaints Registry
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`p-2 bg-white rounded-xl shadow-sm border border-slate-100 ${theme.primary}`}>
            <ShieldAlert size={22} strokeWidth={2.5} />
          </div>
          My <span className={theme.primary}>Complaints</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
          Track and manage your complaints regarding orders, deliveries, or system issues.
        </p>
      </div>
      <button 
        className={`inline-flex items-center justify-center gap-2 ${theme.bgPrimary} ${theme.hoverPrimary} text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${theme.shadowPrimary} active:scale-95`}
        onClick={() => navigate('/complaints/new?type=OTHER')}
      >
        <Plus size={16} strokeWidth={3} /> New Complaint
      </button>
    </div>

    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit mb-8 overflow-x-auto hide-scrollbar">
      {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].map(f => (
        <button 
          key={f} 
          className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === f ? `${theme.bgPrimary} text-white shadow-md` : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
          onClick={() => setActiveFilter(f)}
        >
          {f.replace('_', ' ')}
        </button>
      ))}
    </div>

    {loading ? (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className={`w-10 h-10 rounded-full border-4 border-slate-100 ${theme.spinnerColor} animate-spin`} />
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
