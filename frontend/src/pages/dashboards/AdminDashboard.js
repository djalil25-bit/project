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
  DollarSign
} from 'lucide-react';
import AlertsPanel from '../../components/admin/AlertsPanel';
import UserDetailModal from '../admin/UserDetailModal';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => (
  <span className={`adm-badge adm-badge-${status}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [iotData, setIotData] = useState(null);
  const [iotLoading, setIotLoading] = useState(true);
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

  const fetchIotData = async () => {
    setIotLoading(true);
    try {
      const res = await api.get('/iot/admin/overview/');
      setIotData(res.data);
    } catch (err) { console.error('Failed to fetch IoT overview', err); }
    finally { setIotLoading(false); }
  };

  const fetchUsers = async (statusFilter = 'pending') => {
    setLoading(true);
    try {
      const url = `/auth/admin/users/?status=${statusFilter}`;
      const res = await api.get(url);
      setUsers(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchIotData(); fetchUsers(); }, []);

  const handleAction = async (userId, action) => {
    setActionLoading(userId + action);
    try {
      await api.post(`/auth/admin/users/${userId}/change_status/`, { action });
      fetchStats();
      fetchUsers();
      if (['approve', 'reject'].includes(action)) {
        setSelectedUserId(null); // Close modal on definitive actions
      }
    } catch { 
      alert('Action failed. System integrity check recommended.'); 
    } finally { setActionLoading(null); }
  };

  const STAT_CARDS = stats ? [
    { icon: <Clock size={20}/>,       color: 'text-orange-500',  iconBg: 'bg-orange-50',  accent: 'stat-accent-orange', value: stats.pending_users,   label: 'Pending Verifications' },
    { icon: <Users size={20}/>,       color: 'text-blue-600',    iconBg: 'bg-blue-50',    accent: 'stat-accent-blue',   value: stats.total_users,     label: 'Platform Members' },
    { icon: <Wheat size={20}/>,       color: 'text-green-600',   iconBg: 'bg-green-50',   accent: 'stat-accent-green',  value: stats.total_farmers,   label: 'Registered Producers' },
    { icon: <ShoppingCart size={20}/>,color: 'text-blue-600',    iconBg: 'bg-blue-50',    accent: 'stat-accent-blue',   value: stats.total_buyers,    label: 'Consumer Base' },
    { icon: <Package size={20}/>,     color: 'text-green-600',   iconBg: 'bg-green-50',   accent: 'stat-accent-green',  value: stats.total_products,  label: 'Active Listings' },
    { icon: <ShoppingBag size={20}/>, color: 'text-purple-600',  iconBg: 'bg-purple-50',  accent: 'stat-accent-purple', value: stats.total_orders,    label: 'Transaction Volume' },
  ] : [];

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="admin-hero-strip p-8 anim-fade-up">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">
              <Activity size={13} /> Administrative Control Center
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Central Dashboard</h1>
            <p className="text-blue-100/80 text-sm max-w-lg">
              Monitor system health, verify actors, and manage global marketplace parameters.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-sm px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all"
              onClick={() => window.location.href='/admin-dashboard/analytics'}
            >
              <TrendingUp size={15} /> View Full Analytics
            </button>
          </div>
        </div>
        <div className="absolute top-4 right-6 text-5xl opacity-10 select-none">🛡️</div>
      </div>

      {/* ── Quick Alerts Panel ──────────────────────────── */}
      <AlertsPanel />

      {/* ── Stats Grid ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map((card, i) => (
            <div key={i} className={`glass-stat-card p-4 ${card.accent} anim-fade-up`}
                 style={{ animationDelay: `${i * 0.06}s` }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg} ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{card.value}</div>
              <div className="text-xs text-gray-500 leading-snug">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Farm Sensor Map removed ── */}

      {/* ── Recent Critical Alerts ──────────────────────── */}
      {stats?.recent_alerts && stats.recent_alerts.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" />
              <h3 className="font-bold text-gray-800 text-base">Recent Critical Alerts</h3>
            </div>
            <button className="adm-btn adm-btn-ghost text-xs" onClick={() => window.location.href='/admin-dashboard/alerts'}>View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recent_alerts.map(a => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.severity === 'CRITICAL' ? 'bg-red-600' : a.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-400'}`}></div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{a.alert_type?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <button className="adm-btn adm-btn-ghost text-xs" onClick={() => window.location.href='/admin-dashboard/alerts'}><Eye size={13}/> View</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Registry Management Card ─────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-800 text-base">Registry Management</h3>
          </div>
          <div className="text-xs text-gray-400 font-medium">Real-time Actor Monitoring</div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="adm-spinner"></div>
            <span className="text-gray-400 text-sm">Synchronizing user registry...</span>
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
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                        <AlertCircle size={48} className="opacity-20" />
                        <div className="text-sm">No entries found in this registry sector.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <React.Fragment key={u.id}>
                  <tr>
                    <td>
                      <div className="font-semibold text-gray-800">{u.full_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
                          onClick={() => setSelectedUserId(u.id)}
                          title="View Full Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  </React.Fragment>
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

      {/* ── IoT Quick Preview ──────────────────────────── */}
      <div className="glass-card overflow-hidden mt-6" style={{ border: '1px solid #e5e7eb' }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            🌐 IoT Monitoring
          </h3>
          <button className="adm-btn adm-btn-ghost text-xs" onClick={() => navigate('/admin-dashboard/iot')}>
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="p-6">
          {iotLoading ? (
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Loading IoT data...</span>
            </div>
          ) : iotData ? (
            <div className="space-y-6">
              {/* Row of 3 mini-cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-red-600 mb-1">
                    🔴 {iotData.critical_alerts?.length || (iotData.summary?.farms_danger) || 0}
                  </span>
                  <span className="text-xs text-red-700 font-semibold uppercase tracking-wider">Critical</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-orange-500 mb-1">
                    🟡 {iotData.warning_alerts?.length || (iotData.summary?.farms_warning) || 0}
                  </span>
                  <span className="text-xs text-orange-700 font-semibold uppercase tracking-wider">Warning</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-green-600 mb-1">
                    ✅ {iotData.normal_farms?.length || (iotData.summary?.farms_normal) || 0}
                  </span>
                  <span className="text-xs text-green-700 font-semibold uppercase tracking-wider">Normal</span>
                </div>
              </div>

              {/* Lists */}
              <div className="space-y-3">
                {iotData.critical_alerts && iotData.critical_alerts.length > 0 ? (
                  iotData.critical_alerts.slice(0, 3).map((farm, i) => (
                    <div key={`crit-${i}`} className="text-sm text-red-600 font-medium">
                      ⚠️ <span className="font-bold">{farm.farm_name}</span> — {farm.wilaya} : {farm.alerts?.[0]?.message || 'Critical alert active'}
                    </div>
                  ))
                ) : iotData.warning_alerts && iotData.warning_alerts.length > 0 ? (
                  iotData.warning_alerts.slice(0, 3).map((farm, i) => (
                    <div key={`warn-${i}`} className="text-sm text-orange-600 font-medium">
                      ⚠️ <span className="font-bold">{farm.farm_name}</span> — {farm.wilaya} : {farm.alerts?.[0]?.message || 'Warning active'}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-green-600 font-semibold py-2">
                    ✅ All farm sensors are operating normally
                  </div>
                )}
              </div>

              {/* Action Button */}
              {(() => {
                const danger = (iotData.critical_alerts?.length || iotData.summary?.farms_danger || 0) > 0;
                const warning = (iotData.warning_alerts?.length || iotData.summary?.farms_warning || 0) > 0;
                const btnBg = danger ? '#ef4444' : warning ? '#f97316' : '#22c55e';
                const pulseClass = danger ? 'animate-pulse' : '';
                return (
                  <button 
                    onClick={() => navigate('/admin-dashboard/iot')}
                    className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 ${pulseClass}`}
                    style={{ backgroundColor: btnBg }}
                  >
                    View Full IoT Dashboard <ArrowUpRight size={16} />
                  </button>
                );
              })()}
            </div>
          ) : (
             <div className="text-gray-500 text-sm">Failed to load IoT preview.</div>
          )}
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;
