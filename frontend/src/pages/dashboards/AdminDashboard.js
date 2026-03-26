import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

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
    const res = await api.get('/dashboards/admin-stats/');
    setStats(res.data);
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
    } catch { alert('Action failed'); }
    finally { setActionLoading(null); }
  };

  const TABS = [
    { key: 'pending', label: 'Pending', count: stats?.pending_users },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All Users' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Administration</h1>
          <p className="page-subtitle">Manage users, categories, and market prices</p>
        </div>
        <div className="page-actions">
          <button className="btn-agr btn-outline" onClick={() => window.location.href='/admin-dashboard/catalog'}>📋 Catalog</button>
          <button className="btn-agr btn-outline" onClick={() => window.location.href='/admin-dashboard/categories'}>📂 Categories</button>
          <button className="btn-agr btn-outline" onClick={() => window.location.href='/admin-dashboard/prices'}>💰 Price History</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">⏳</div>
            <div><div className="stat-value">{stats.pending_users}</div><div className="stat-label">Pending Approvals</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">👥</div>
            <div><div className="stat-value">{stats.total_users}</div><div className="stat-label">Total Members</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">🚜</div>
            <div><div className="stat-value">{stats.total_farmers}</div><div className="stat-label">Active Farmers</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">🛒</div>
            <div><div className="stat-value">{stats.total_buyers}</div><div className="stat-label">Active Buyers</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">🌱</div>
            <div><div className="stat-value">{stats.total_products}</div><div className="stat-label">Listed Products</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📦</div>
            <div><div className="stat-value">{stats.total_orders}</div><div className="stat-label">Total Orders</div></div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="agr-card">
        <div className="agr-card-header">
          <h3 className="agr-card-title">User Management</h3>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
          <div className="tab-pills">
            {TABS.map(tab => (
              <button key={tab.key} className={`tab-pill ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /><span>Loading users...</span></div>
        ) : (
          <table className="agr-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="5"><div className="table-empty"><div className="table-empty-icon">🎉</div><div className="table-empty-text">No users in this category.</div></div></td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{u.email}</div>
                  </td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.status === 'pending' && (
                      <>
                        <button
                          className="btn-agr btn-success btn-sm"
                          style={{ marginRight: '0.5rem' }}
                          onClick={() => handleAction(u.id, 'approve')}
                          disabled={actionLoading === u.id + 'approve'}
                        >
                          {actionLoading === u.id + 'approve' ? '...' : '✓ Approve'}
                        </button>
                        <button
                          className="btn-agr btn-danger btn-sm"
                          onClick={() => handleAction(u.id, 'reject')}
                          disabled={actionLoading === u.id + 'reject'}
                        >
                          {actionLoading === u.id + 'reject' ? '...' : '✗ Reject'}
                        </button>
                      </>
                    )}
                    {u.status === 'approved' && (
                      <button className="btn-agr btn-danger btn-sm" onClick={() => handleAction(u.id, 'suspend')}>Suspend</button>
                    )}
                    {(u.status === 'rejected' || u.status === 'suspended') && (
                      <button className="btn-agr btn-outline btn-sm" onClick={() => handleAction(u.id, 'reactivate')}>Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
