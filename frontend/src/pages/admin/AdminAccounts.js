import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { Users, ChevronRight, Search, Mail, Phone, MapPin, Eye, UserMinus, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

const roleBadge = { farmer: { bg:'#E6F9EE', c:'#047857' }, buyer: { bg:'#E8F0FE', c:'#0066CC' }, transporter: { bg:'#FFF4E0', c:'#B45309' } };

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/accounts/', {
        params: { search, role: roleFilter, status: statusFilter }
      });
      setAccounts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setAccounts([]);
    } finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchAccounts, 300);
    return () => clearTimeout(timer);
  }, [fetchAccounts]);

  const handleAction = async (userId, action) => {
    if (action === 'suspend' && !window.confirm('Are you sure you want to suspend this account?')) return;
    setActionLoading(`${userId}-${action}`);
    try {
      await adminApi.post(`/accounts/${userId}/action/`, { action });
      showToast(`Account ${action} successful`);
      fetchAccounts();
      if (['approve', 'reject'].includes(action)) {
        setSelectedUserId(null); // Close modal on definitive actions
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } finally { setActionLoading(null); }
  };

  const handleMessage = (account) => {
    navigate('/admin-dashboard/messages', { state: { prefillRecipient: { id: account.id, full_name: account.full_name, email: account.email } } });
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode relative">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Accounts</span></div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center"><Users className="text-blue-600" size={24}/></div>
        <div><h1 className="text-xl font-extrabold text-gray-900">Account Management</h1><p className="text-gray-500 text-sm">Search, verify, and manage all platform accounts.</p></div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          <CheckCircle size={16}/> {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="adm-input pl-10" placeholder="Search name, email, phone..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="adm-input w-auto" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="all">All Roles</option><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="transporter">Transporter</option></select>
          <select className="adm-input w-auto" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option value="approved">Verified</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select>
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center py-16"><div className="adm-spinner"></div></div> : (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">{accounts.length} accounts found</div>
          {accounts.length === 0 && (
            <div className="glass-card p-12 text-center"><Users size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No accounts match your filters.</p></div>
          )}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Contact & Location</th>
                    <th className="p-4 font-semibold">Stats</th>
                    <th className="p-4 font-semibold">Registered</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map(a => {
                    const rb = roleBadge[a.role] || roleBadge.buyer;
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: rb.bg, color: rb.c }}>
                              {a.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{a.full_name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide" style={{ backgroundColor: rb.bg, color: rb.c }}>
                                  {a.role}
                                </span>
                                {a.is_verified ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10}/> VERIFIED</span>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={10}/> PENDING</span>
                                )}
                                {a.status === 'suspended' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700">SUSPENDED</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> {a.email}</div>
                          {a.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {a.phone}</div>}
                          {a.address && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> {a.address}</div>}
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {a.role === 'farmer' && (
                            <div className="grid grid-cols-3 gap-2 min-w-[150px]">
                              <div className="text-center"><div className="font-bold text-gray-800">{a.stats?.listings || 0}</div><div className="text-[10px] uppercase">Listings</div></div>
                              <div className="text-center"><div className="font-bold text-gray-800">{a.stats?.orders || 0}</div><div className="text-[10px] uppercase">Orders</div></div>
                              <div className="text-center"><div className="font-bold text-green-600">{(a.stats?.revenue || 0).toLocaleString()}</div><div className="text-[10px] uppercase">Rev (DZD)</div></div>
                            </div>
                          )}
                          {a.role === 'buyer' && (
                            <div className="grid grid-cols-3 gap-2 min-w-[150px]">
                              <div className="text-center"><div className="font-bold text-gray-800">{a.stats?.orders || 0}</div><div className="text-[10px] uppercase">Orders</div></div>
                              <div className="text-center"><div className="font-bold text-blue-600">{(a.stats?.total_spent || 0).toLocaleString()}</div><div className="text-[10px] uppercase">Spent (DZD)</div></div>
                              <div className="text-center"><div className="font-bold text-red-500">{a.stats?.canceled_orders || 0}</div><div className="text-[10px] uppercase">Canceled</div></div>
                            </div>
                          )}
                          {a.role === 'transporter' && (
                            <div className="grid grid-cols-3 gap-2 min-w-[150px]">
                              <div className="text-center"><div className="font-bold text-gray-800">{a.stats?.missions_done || 0}</div><div className="text-[10px] uppercase">Missions</div></div>
                              <div className="text-center"><div className="font-bold text-gray-800">{a.stats?.zone_services || 0}</div><div className="text-[10px] uppercase">Zones</div></div>
                              <div className="text-center"><div className="font-bold text-orange-600">{(a.stats?.revenue || 0).toLocaleString()}</div><div className="text-[10px] uppercase">Rev (DZD)</div></div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button className="adm-btn adm-btn-ghost text-[11px] px-2 py-1 h-auto" onClick={() => handleMessage(a)} title="Message"><MessageSquare size={14}/></button>
                            <button className="adm-btn adm-btn-ghost text-[11px] px-2 py-1 h-auto" onClick={() => setSelectedUserId(a.id)} title="View Details"><Eye size={14}/></button>
                            {!a.is_verified && (
                              <button
                                className="adm-btn adm-btn-success text-[11px] px-2 py-1 h-auto"
                                disabled={actionLoading === `${a.id}-verify`}
                                onClick={() => handleAction(a.id, 'approve')}
                                title="Approve"
                              >
                                <CheckCircle size={14}/>
                              </button>
                            )}
                            {a.status !== 'suspended' && (
                              <button
                                className="adm-btn adm-btn-warning text-[11px] px-2 py-1 h-auto"
                                disabled={actionLoading === `${a.id}-suspend`}
                                onClick={() => handleAction(a.id, 'suspend')}
                                title="Suspend"
                              >
                                <UserMinus size={14}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default AdminAccounts;
