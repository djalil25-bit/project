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
          {accounts.map(a => {
            const rb = roleBadge[a.role] || roleBadge.buyer;
            return (
              <div key={a.id} className="glass-card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Identity */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: rb.bg, color: rb.c }}>{a.full_name?.charAt(0)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{a.full_name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: rb.bg, color: rb.c }}>{a.role}</span>
                        {a.is_verified ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10}/> VERIFIED</span> : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={10}/> PENDING</span>}
                        {a.status === 'suspended' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">SUSPENDED</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Mail size={11}/> {a.email}</span>
                        {a.phone && <span className="flex items-center gap-1"><Phone size={11}/> {a.phone}</span>}
                        {a.address && <span className="flex items-center gap-1"><MapPin size={11}/> {a.address}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Real Stats */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <div className="text-center"><div className="font-bold text-gray-800 text-sm">{a.stats?.listings || 0}</div>Listings</div>
                    <div className="text-center"><div className="font-bold text-gray-800 text-sm">{a.stats?.orders || 0}</div>Orders</div>
                    <div className="text-center"><div className="font-bold text-blue-600 text-sm">{(a.stats?.revenue || 0).toLocaleString()}</div>Revenue</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-wrap shrink-0">
                    <button className="adm-btn adm-btn-ghost text-xs" onClick={() => handleMessage(a)}><MessageSquare size={12}/> Message</button>
                    <button className="adm-btn adm-btn-ghost text-xs" onClick={() => setSelectedUserId(a.id)}><Eye size={12}/> View Details</button>
                    {a.status !== 'suspended' && (
                      <button
                        className="adm-btn adm-btn-warning text-xs"
                        disabled={actionLoading === `${a.id}-suspend`}
                        onClick={() => handleAction(a.id, 'suspend')}
                      >
                        <UserMinus size={12}/> {actionLoading === `${a.id}-suspend` ? 'Suspending...' : 'Suspend'}
                      </button>
                    )}
                    {!a.is_verified && (
                      <button
                        className="adm-btn adm-btn-success text-xs"
                        disabled={actionLoading === `${a.id}-verify`}
                        onClick={() => handleAction(a.id, 'approve')}
                      >
                        <CheckCircle size={12}/> {actionLoading === `${a.id}-verify` ? 'Verifying...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> Registered: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Unknown'}</div>
              </div>
            );
          })}
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
