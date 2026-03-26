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
  RefreshCw
} from 'lucide-react';

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

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
      // Replace generic alert with a more modern approach if possible, but keep functional
      alert('Action failed. System integrity check recommended.'); 
    } finally { setActionLoading(null); }
  };

  const TABS = [
    { key: 'pending', label: 'Pending Approvals', count: stats?.pending_users, icon: <Clock size={14} /> },
    { key: 'approved', label: 'Verified Users', icon: <UserCheck size={14} /> },
    { key: 'rejected', label: 'Rejected', icon: <UserX size={14} /> },
    { key: 'all', label: 'Registry History', icon: <Users size={14} /> },
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <Activity className="text-primary me-3" size={28} /> Central Control
          </h1>
          <p className="page-subtitle text-muted">Monitor system health, verify actors, and manage global marketplace parameters.</p>
        </div>
        <div className="page-actions d-flex gap-2">
          <button className="btn-agr btn-outline px-3" onClick={() => window.location.href='/admin-dashboard/catalog'}>
            <ClipboardList size={16} className="me-2 text-primary" /> Master Catalog
          </button>
          <button className="btn-agr btn-outline px-3" onClick={() => window.location.href='/admin-dashboard/categories'}>
            <FolderTree size={16} className="me-2 text-primary" /> Categories
          </button>
          <button className="btn-agr btn-outline px-3" onClick={() => window.location.href='/admin-dashboard/prices'}>
            <TrendingUp size={16} className="me-2 text-primary" /> Price Ticker
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid mb-5">
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber"><Clock size={20} /></div>
            <div>
              <div className="stat-value">{stats.pending_users}</div>
              <div className="stat-label">Pending Verifications</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><Users size={20} /></div>
            <div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">System Platform Members</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><Wheat size={20} /></div>
            <div>
              <div className="stat-value">{stats.total_farmers}</div>
              <div className="stat-label">Registered Producer Base</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><ShoppingCart size={20} /></div>
            <div>
              <div className="stat-value">{stats.total_buyers}</div>
              <div className="stat-label">Market Consumer Base</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><Package size={20} /></div>
            <div>
              <div className="stat-value">{stats.total_products}</div>
              <div className="stat-label">Live Marketplace Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><ShoppingBag size={20} /></div>
            <div>
              <div className="stat-value">{stats.total_orders}</div>
              <div className="stat-label">Platform Transaction Volume</div>
            </div>
          </div>
        </div>
      )}

      <div className="agr-card overflow-hidden">
        <div className="agr-card-header bg-light-soft border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <UserCheck size={18} className="text-primary me-2" />
            <h3 className="h5 fw-bold mb-0">Registry Management</h3>
          </div>
          <div className="text-muted small fw-medium">Real-time Actor Monitoring</div>
        </div>
        
        <div className="p-3 border-bottom bg-white sticky-top-custom">
          <div className="tab-pills m-0">
            {TABS.map(tab => (
              <button 
                 key={tab.key} 
                 className={`tab-pill border-0 d-flex align-items-center ${activeTab === tab.key ? 'active' : ''}`} 
                 onClick={() => setActiveTab(tab.key)}
              >
                <span className="me-2 opacity-75">{tab.icon}</span>
                {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-center py-5">
            <div className="spinner-agr"></div>
            <span className="ms-3 text-muted small fw-medium">Synchronizing user registry...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="agr-table">
              <thead>
                <tr>
                  <th>Identity & Credentials</th>
                  <th>Actor Designation</th>
                  <th>Verification Status</th>
                  <th>Registry Date</th>
                  <th className="text-end">Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="table-empty py-5">
                        <AlertCircle size={48} className="text-muted mb-3 opacity-25" />
                        <div className="table-empty-text text-muted">No entries found in this registry sector.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-bold text-dark">{u.full_name}</div>
                      <div className="very-small text-muted">{u.email}</div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.role} text-uppercase very-small fw-bold`}>{u.role}</span>
                    </td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="small text-muted">
                      <div className="d-flex align-items-center">
                         <Clock size={12} className="me-2 opacity-50" />
                         {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {u.status === 'pending' && (
                          <>
                            <button
                              className="btn-agr btn-success btn-sm py-1 px-3 d-flex align-items-center"
                              onClick={() => handleAction(u.id, 'approve')}
                              disabled={actionLoading === u.id + 'approve'}
                            >
                              {actionLoading === u.id + 'approve' ? '...' : <><CheckCircle size={14} className="me-2" /> Verify</>}
                            </button>
                            <button
                              className="btn-agr btn-danger btn-sm py-1 px-3 d-flex align-items-center"
                              onClick={() => handleAction(u.id, 'reject')}
                              disabled={actionLoading === u.id + 'reject'}
                            >
                              {actionLoading === u.id + 'reject' ? '...' : <><XCircle size={14} className="me-2" /> Declin</>}
                            </button>
                          </>
                        )}
                        {u.status === 'approved' && (
                          <button 
                             className="btn-agr btn-outline-danger btn-sm py-1 px-3 d-flex align-items-center" 
                             onClick={() => handleAction(u.id, 'suspend')}
                          >
                             <UserMinus size={14} className="me-2" /> Restrict
                          </button>
                        )}
                        {(u.status === 'rejected' || u.status === 'suspended') && (
                          <button 
                             className="btn-agr btn-outline-primary btn-sm py-1 px-3 d-flex align-items-center" 
                             onClick={() => handleAction(u.id, 'reactivate')}
                          >
                             <RefreshCw size={14} className="me-2" /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
