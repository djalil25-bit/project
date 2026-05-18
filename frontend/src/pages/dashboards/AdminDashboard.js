import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  Users,
  Activity,
  Package,
  ShoppingCart,
  Wheat,
  ShoppingBag,
  ClipboardList,
  FolderTree,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  RefreshCw,
  Eye,
  Search,
  AlertTriangle,
  Bell,
  ShieldAlert,
  BarChart3,
  ArrowUpRight,
  DollarSign,
  User as UserIcon,
  Home,
  Truck
} from 'lucide-react';
import UserDetailModal from '../admin/UserDetailModal';
import { useNavigate } from 'react-router-dom';
import AdminMapView from '../../components/maps/AdminMapView';

const StatusBadge = ({ status }) => (
  <span className={`adm-badge adm-badge-${status}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [mapData, setMapData] = useState({ farms: [], transporters: [] });

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboards/admin-stats/');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `/auth/admin/users/?status=pending`;
      const res = await api.get(url);
      setUsers(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMapData = async () => {
    try {
      const res = await api.get('/dashboards/admin-map-data/');
      setMapData(res.data);
    } catch (err) { console.error('Map data error:', err); }
  };

  useEffect(() => { fetchStats(); fetchUsers(); fetchMapData(); }, []);

  const handleAction = async (userId, action) => {
    setActionLoading(userId + action);
    try {
      await api.post(`/auth/admin/users/${userId}/change_status/`, { action });
      fetchStats();
      fetchUsers();
      if (['approve', 'reject'].includes(action)) {
        setSelectedUserId(null);
      }
    } catch {
      alert('Action failed.');
    } finally { setActionLoading(null); }
  };

  const avgOrderValue = stats && stats.total_orders > 0
    ? Math.round((stats.total_revenue || 0) / stats.total_orders)
    : 0;
  const avgProductsPerFarmer = stats && stats.total_farmers > 0
    ? (stats.total_products / stats.total_farmers).toFixed(1)
    : '0.0';

  const STAT_CARDS = stats ? [
    { icon: <Clock size={18} />, color: 'text-amber-600', iconBg: 'bg-amber-50', value: stats.pending_users, label: 'Pending Verifications' },
    { icon: <Users size={18} />, color: 'text-[#064e3b]', iconBg: 'bg-[#064e3b]/10', value: stats.total_users, label: 'Platform Members' },
    { icon: <Wheat size={18} />, color: 'text-emerald-700', iconBg: 'bg-emerald-50', value: stats.total_farmers, label: 'Registered Producers' },
    { icon: <Truck size={18} />, color: 'text-indigo-700', iconBg: 'bg-indigo-50', value: stats.active_vehicles || 0, label: 'Active Vehicles' },
    { icon: <Package size={18} />, color: 'text-teal-700', iconBg: 'bg-teal-50', value: avgProductsPerFarmer, label: 'Avg Products/Farmer' },
    { icon: <Home size={18} />, color: 'text-[#064e3b]', iconBg: 'bg-[#064e3b]/10', value: stats.total_farmers, label: 'Active Farms' },
  ] : [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-10 animate-fade-in relative z-0 bg-slate-50/50 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#022c22] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between px-8 py-8 md:px-12 md:py-10 relative isolate border border-[#064e3b]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#022c22]/60 via-[#064e3b]/30 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="z-10 flex flex-col max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit border border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
            <Activity size={12} className="animate-pulse" /> Administrative Control Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4">
            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Overview</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm md:text-base leading-relaxed">
            Monitor key metrics, verify new registrations, and manage the national agricultural logistics grid. System status is currently <span className="text-emerald-400 font-bold">fully operational</span>.
          </p>
        </div>
        <div className="z-10 mt-8 md:mt-0 shrink-0">
          <button
            className="group bg-white hover:bg-[#f0fdf4] text-slate-900 text-xs font-black uppercase tracking-[0.15em] px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-white/5 hover:shadow-white/10 flex items-center gap-3 active:scale-95"
            onClick={() => navigate('/admin-dashboard/analytics')}
          >
            <TrendingUp size={16} className="text-[#064e3b] group-hover:scale-110 transition-transform" /> 
            <span>Full Analytics</span>
          </button>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
          {STAT_CARDS.map((card, i) => (
            <div 
              key={i} 
              className="group bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-[#064e3b]/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col"
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${card.iconBg} opacity-30 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 pointer-events-none`} />
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 ${card.iconBg} ${card.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {card.icon}
              </div>
              <div className="mt-auto">
                <div className="text-3xl font-black text-slate-900 tracking-tight mb-1 relative z-10">{card.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-snug relative z-10">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── National Asset Map ──────────────────────────── */}
      <AdminMapView
        farms={mapData.farms}
        height="420px"
      />

      {/* ── Pending Accounts Registry ─────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-6 border-b border-slate-100 bg-white gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#064e3b] shadow-inner">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 tracking-tight leading-none">Pending Verifications</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">Manual review required for security</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {users.length} Awaiting Review
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-50/30">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Registry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Identity & Credentials</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Actor</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">Registry Date</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="bg-slate-50/30">
                      <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-400">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2 shadow-inner">
                          <CheckCircle size={32} />
                        </div>
                        <div className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">All caught up!</div>
                        <div className="text-xs font-medium text-slate-400">No pending accounts found in the registry.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xs shrink-0">
                          {u.full_name?.charAt(0).toUpperCase() || <UserIcon size={14} />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-sm truncate">{u.full_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border flex w-fit items-center gap-1.5 ${
                        u.role === 'farmer' ? 'bg-emerald-50 text-[#064e3b] border-emerald-100' :
                        u.role === 'transporter' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-50 text-[#064e3b] border-slate-100'
                      }`}>
                        <div className={`hidden sm:block w-1.5 h-1.5 rounded-full ${u.role === 'farmer' ? 'bg-emerald-500' : u.role === 'transporter' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                       <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center gap-1.5 mx-auto w-fit">
                        <Clock size={12} className="animate-pulse" /> {u.status}
                       </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[10px] md:text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          className="bg-[#064e3b] hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 text-[9px] md:text-[10px] font-black px-3 py-2 rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                          onClick={() => handleAction(u.id, 'approve')}
                          disabled={actionLoading === u.id + 'approve'}
                        >
                          {actionLoading === u.id + 'approve' ? <span className="animate-pulse">...</span> : <><CheckCircle size={12} /> <span className="hidden sm:inline">Verify</span></>}
                        </button>
                        <button
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 hover:border-rose-200 text-[9px] md:text-[10px] font-black px-3 py-2 rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                          onClick={() => handleAction(u.id, 'reject')}
                          disabled={actionLoading === u.id + 'reject'}
                        >
                          {actionLoading === u.id + 'reject' ? <span className="animate-pulse">...</span> : <><XCircle size={12} /> <span className="hidden sm:inline">Decline</span></>}
                        </button>
                        <button
                          className="bg-slate-50 hover:bg-slate-200 text-slate-500 w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-colors border border-slate-200 shrink-0 active:scale-95"
                          onClick={() => setSelectedUserId(u.id)}
                          title="View Full Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
