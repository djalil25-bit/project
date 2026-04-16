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
  Search
} from 'lucide-react';

const StatusBadge = ({ status }) => (
  <span className={`adm-badge adm-badge-${status}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboards/admin-stats/');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async (statusFilter) => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/auth/admin/users/' : `/auth/admin/users/?status=${statusFilter}`;
      const res = await api.get(url);
      setUsers(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchUsers(activeTab); }, []);
  useEffect(() => { fetchUsers(activeTab); }, [activeTab]);

  const handleAction = async (userId, action) => {
    setActionLoading(userId + action);
    try {
      await api.post(`/auth/admin/users/${userId}/change_status/`, { action });
      fetchStats();
      fetchUsers(activeTab);
    } catch { 
      alert('Action failed. System integrity check recommended.'); 
    } finally { setActionLoading(null); }
  };

  const TABS = [
    { key: 'pending', label: 'Pending Approvals', count: stats?.pending_users, icon: <Clock size={13} /> },
    { key: 'approved', label: 'Verified Users', icon: <UserCheck size={13} /> },
    { key: 'rejected', label: 'Rejected', icon: <UserX size={13} /> },
    { key: 'all', label: 'Registry History', icon: <Users size={13} /> },
  ];

  const STAT_CARDS = stats ? [
    { icon: <Clock size={20}/>,       color: 'text-amber-400',   bg: 'bg-amber-400/10  border-amber-400/20',   value: stats.pending_users,   label: 'Pending Verifications'       },
    { icon: <Users size={20}/>,       color: 'text-blue-400',    bg: 'bg-blue-400/10   border-blue-400/20',    value: stats.total_users,     label: 'System Platform Members'     },
    { icon: <Wheat size={20}/>,       color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', value: stats.total_farmers,   label: 'Registered Producer Base'    },
    { icon: <ShoppingCart size={20}/>,color: 'text-blue-400',    bg: 'bg-blue-400/10   border-blue-400/20',    value: stats.total_buyers,    label: 'Market Consumer Base'        },
    { icon: <Package size={20}/>,     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', value: stats.total_products,  label: 'Live Marketplace Listings'   },
    { icon: <ShoppingBag size={20}/>, color: 'text-violet-400',  bg: 'bg-violet-400/10 border-violet-400/20',  value: stats.total_orders,    label: 'Platform Transaction Volume' },
  ] : [];

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="admin-hero-strip p-8 anim-fade-up">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
              <Activity size={13} /> Secure System Control
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Central Control</h1>
            <p className="text-emerald-200/70 text-sm max-w-lg">
              Monitor system health, verify actors, and manage global marketplace parameters.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              className="adm-btn adm-btn-primary text-sm px-5 py-2.5"
              onClick={() => window.location.href='/admin-dashboard/analytics'}
            >
              <TrendingUp size={15} /> View Full Analytics
            </button>
          </div>
        </div>
        <div className="absolute top-4 right-6 text-5xl opacity-10 select-none">🛡️</div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map((card, i) => (
            <div key={i} className={`glass-stat-card p-4 border ${card.bg} anim-fade-up`}
                 style={{ animationDelay: `${i * 0.06}s` }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-2xl font-extrabold text-white mb-0.5">{card.value}</div>
              <div className="text-xs text-slate-400 leading-snug">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Registry Management Card ─────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-base">Registry Management</h3>
          </div>
          <div className="text-xs text-slate-500 font-medium">Real-time Actor Monitoring</div>
        </div>

        {/* Tab Bar */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="adm-tab-bar w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`adm-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="opacity-75">{tab.icon}</span>
                {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="adm-spinner"></div>
            <span className="text-slate-500 text-sm">Synchronizing user registry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Identity &amp; Credentials</th>
                  <th>Actor Designation</th>
                  <th>Verification Status</th>
                  <th>Registry Date</th>
                  <th style={{ textAlign: 'right' }}>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
                        <AlertCircle size={48} className="opacity-20" />
                        <div className="text-sm">No entries found in this registry sector.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <React.Fragment key={u.id}>
                  <tr>
                    <td>
                      <div className="font-semibold text-slate-200">{u.full_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={11} className="opacity-50" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'pending' && (
                          <>
                            <button
                              className="adm-btn adm-btn-success"
                              onClick={() => handleAction(u.id, 'approve')}
                              disabled={actionLoading === u.id + 'approve'}
                            >
                              {actionLoading === u.id + 'approve' ? '...' : <><CheckCircle size={13} /> Verify</>}
                            </button>
                            <button
                              className="adm-btn adm-btn-danger"
                              onClick={() => handleAction(u.id, 'reject')}
                              disabled={actionLoading === u.id + 'reject'}
                            >
                              {actionLoading === u.id + 'reject' ? '...' : <><XCircle size={13} /> Decline</>}
                            </button>
                          </>
                        )}
                        {u.status === 'approved' && (
                          <button
                            className="adm-btn adm-btn-warning"
                            onClick={() => handleAction(u.id, 'suspend')}
                          >
                            <UserMinus size={13} /> Restrict
                          </button>
                        )}
                        {(u.status === 'rejected' || u.status === 'suspended') && (
                          <button
                            className="adm-btn adm-btn-ghost"
                            onClick={() => handleAction(u.id, 'reactivate')}
                          >
                            <RefreshCw size={13} /> Restore
                          </button>
                        )}
                        <button
                          className="adm-btn adm-btn-ghost adm-btn-icon"
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === u.id && (
                    <tr>
                      <td colSpan="5" className="p-0 border-0">
                        <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10 anim-fade-up">
                          <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Search size={13}/> User Request Details
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="adm-label">Full Name</label>
                              <span className="text-slate-300 text-sm">{u.full_name}</span>
                            </div>
                            <div>
                              <label className="adm-label">Contact Email</label>
                              <span className="text-slate-300 text-sm">{u.email}</span>
                            </div>
                            <div>
                              <label className="adm-label">Phone Number</label>
                              <span className="text-slate-300 text-sm">{u.phone || 'N/A'}</span>
                            </div>
                            <div>
                              <label className="adm-label">Physical Address</label>
                              <span className="text-slate-300 text-sm">{u.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
