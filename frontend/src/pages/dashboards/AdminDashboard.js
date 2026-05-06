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
  Home
} from 'lucide-react';
import UserDetailModal from '../admin/UserDetailModal';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => { fetchStats(); fetchUsers(); }, []);

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
    { icon: <Users size={18} />, color: 'text-blue-600', iconBg: 'bg-blue-50', value: stats.total_users, label: 'Platform Members' },
    { icon: <Wheat size={18} />, color: 'text-emerald-600', iconBg: 'bg-emerald-50', value: stats.total_farmers, label: 'Registered Producers' },
    { icon: <DollarSign size={18} />, color: 'text-purple-600', iconBg: 'bg-purple-50', value: `${avgOrderValue.toLocaleString()} DA`, label: 'Avg Order Value' },
    { icon: <Package size={18} />, color: 'text-teal-600', iconBg: 'bg-teal-50', value: avgProductsPerFarmer, label: 'Avg Products/Farmer' },
    { icon: <Home size={18} />, color: 'text-slate-600', iconBg: 'bg-slate-50', value: stats.total_farmers, label: 'Active Farms' },
  ] : [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <Activity size={12} /> Administrative Control Center
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Central Dashboard
          </h1>
          <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-2">
            System status: <span className="text-emerald-400">Operational</span>
          </p>
        </div>
        <div className="z-10 mt-3 md:mt-0">
          <button
            className="bg-[#0f5c44] hover:bg-[#166534] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all border border-emerald-500/30 shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            onClick={() => navigate('/admin-dashboard/analytics')}
          >
            <TrendingUp size={14} /> Full Analytics
          </button>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map((card, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.iconBg} ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-xl font-black text-slate-800 mb-0.5">{card.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-snug">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pending Accounts Registry ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-600" />
            <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700">Pending Account Verifications</h3>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{users.length} Awaiting Review</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Registry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity & Credentials</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Actor Designation</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Date</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                        <CheckCircle size={40} className="opacity-20 text-emerald-600" />
                        <div className="text-xs font-black uppercase tracking-widest">No pending accounts found.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-800 text-sm">{u.full_name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        u.role === 'farmer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        u.role === 'transporter' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center gap-1 mx-auto w-fit">
                        <Clock size={10} /> {u.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-[10px] font-black px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5"
                          onClick={() => handleAction(u.id, 'approve')}
                          disabled={actionLoading === u.id + 'approve'}
                        >
                          {actionLoading === u.id + 'approve' ? '...' : <><CheckCircle size={12} /> Verify</>}
                        </button>
                        <button
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-black px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5"
                          onClick={() => handleAction(u.id, 'reject')}
                          disabled={actionLoading === u.id + 'reject'}
                        >
                          {actionLoading === u.id + 'reject' ? '...' : <><XCircle size={12} /> Decline</>}
                        </button>
                        <button
                          className="bg-white hover:bg-slate-100 text-slate-400 border border-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm"
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
