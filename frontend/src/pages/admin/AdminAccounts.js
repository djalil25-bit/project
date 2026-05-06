import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { Users, ChevronRight, Search, Mail, Phone, MapPin, Eye, UserMinus, CheckCircle, MessageSquare, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

const RoleBadge = ({ role }) => {
  const r = role?.toLowerCase() || 'buyer';
  if (r === 'farmer') return <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{role}</span>;
  if (r === 'transporter') return <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{role}</span>;
  return <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{role}</span>;
};

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
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
        params: { role: roleFilter, status: statusFilter }
      });
      setAccounts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setAccounts([]);
    } finally { setLoading(false); }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAction = async (userId, action) => {
    if (action === 'suspend' && !window.confirm('Are you sure you want to suspend this account?')) return;
    setActionLoading(`${userId}-${action}`);
    try {
      await adminApi.post(`/accounts/${userId}/action/`, { action });
      showToast(`Account ${action} successful`);
      fetchAccounts();
      if (['approve', 'reject'].includes(action)) {
        setSelectedUserId(null);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } finally { setActionLoading(null); }
  };

  const handleMessage = (account) => {
    navigate('/admin-dashboard/messages', { state: { prefillRecipient: { id: account.id, full_name: account.full_name, email: account.email } } });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <Users size={12} /> Registry Management
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Platform Accounts
          </h1>
          <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-2">{accounts.length} TOTAL REGISTERED ENTITIES</p>
        </div>
        <div className="z-10 mt-3 md:mt-0 flex gap-2">
           <div className="bg-[#0f5c44] rounded-xl px-4 py-2 border border-emerald-500/30">
              <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active nodes</div>
              <div className="text-white font-black text-lg leading-none">{accounts.filter(a => a.is_verified).length}</div>
           </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[10px] font-black tracking-widest uppercase animate-slide-in ${toast.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-900 text-emerald-400 border border-emerald-900/50'}`}>
           <ShieldCheck size={16}/> {toast.msg}
        </div>
      )}

      {/* Filters - Search Band Removed as requested */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Users size={14} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registry Filters</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select className="flex-1 md:flex-none h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
              <option value="all">Global Roles</option>
              <option value="farmer">Agricultural</option>
              <option value="buyer">Commercial</option>
              <option value="transporter">Logistics</option>
            </select>
            <select className="flex-1 md:flex-none h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="approved">Verified</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Registry Database...</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          {accounts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center shadow-sm">
              <Users size={48} className="text-slate-100 mx-auto mb-4"/>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">No entities match the current security filters.<br/>Try adjusting the parameters.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {accounts.map(a => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                   <RoleBadge role={a.role} />
                </div>
                <div>
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-emerald-700 border border-slate-100 flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:bg-emerald-50 transition-colors">
                      {a.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0 pr-12">
                      <div className="font-black text-slate-900 truncate text-base tracking-tight mb-1">{a.full_name}</div>
                      <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                        <span className="flex items-center gap-1.5 truncate"><Mail size={12} className="text-emerald-500"/> {a.email}</span>
                        {a.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-emerald-500"/> {a.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex gap-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-xs">{a.stats?.listings || 0}</span> Units
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-xs">{a.stats?.orders || 0}</span> Txns
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       {a.is_verified ? 
                         <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 uppercase tracking-widest shadow-sm"><CheckCircle size={8}/> Verified</span> : 
                         <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1 uppercase tracking-widest shadow-sm"><Clock size={8}/> Pending</span>
                       }
                       {a.status === 'suspended' && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest mt-1 shadow-sm">Suspended</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                    <button className="h-8 flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest shadow-sm active:scale-95" onClick={() => handleMessage(a)}>
                      <MessageSquare size={12} className="text-emerald-500"/> Msg
                    </button>
                    <button className="h-8 flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest shadow-sm active:scale-95" onClick={() => setSelectedUserId(a.id)}>
                      <Eye size={12} className="text-emerald-500"/> View
                    </button>
                    {a.status !== 'suspended' ? (
                      <button
                        className="h-8 w-8 bg-white hover:bg-rose-50 text-rose-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                        disabled={actionLoading === `${a.id}-suspend`}
                        onClick={() => handleAction(a.id, 'suspend')}
                        title="Suspend Account"
                      >
                        {actionLoading === `${a.id}-suspend` ? <RefreshCw size={12} className="animate-spin"/> : <UserMinus size={14}/>}
                      </button>
                    ) : (
                      <button
                        className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                        disabled={actionLoading === `${a.id}-approve`}
                        onClick={() => handleAction(a.id, 'approve')}
                        title="Reinstate Account"
                      >
                        {actionLoading === `${a.id}-approve` ? <RefreshCw size={12} className="animate-spin"/> : <CheckCircle size={14}/>}
                      </button>
                    )}
                </div>
              </div>
            ))}
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
