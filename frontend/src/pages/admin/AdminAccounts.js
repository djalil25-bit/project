import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { Users, ChevronRight, Search, Mail, Phone, MapPin, Eye, UserMinus, CheckCircle, MessageSquare, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

const RoleBadge = ({ role }) => {
  const r = role?.toLowerCase() || 'buyer';
  if (r === 'farmer') return <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200/50 shadow-sm">{role}</span>;
  if (r === 'transporter') return <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200/50 shadow-sm">{role}</span>;
  return <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200/50 shadow-sm">{role}</span>;
};

const getAvatarStyle = (role) => {
  const r = role?.toLowerCase() || 'buyer';
  if (r === 'farmer') return "from-emerald-400 to-emerald-600 shadow-emerald-900/20";
  if (r === 'transporter') return "from-amber-400 to-amber-600 shadow-amber-900/20";
  return "from-blue-400 to-blue-600 shadow-blue-900/20";
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

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-6 flex flex-col md:flex-row gap-6 items-center justify-between mt-8 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200 shadow-inner">
                <Users size={16} />
             </div>
             <div>
               <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-800">Registry Filters</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Filter entities by role or status</div>
             </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="flex-1 md:w-48 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner cursor-pointer hover:bg-slate-100 transition-colors" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
              <option value="all">Global Roles</option>
              <option value="farmer">Producers</option>
              <option value="buyer">Buyers</option>
              <option value="transporter">Logistics</option>
            </select>
            <select className="flex-1 md:w-48 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner cursor-pointer hover:bg-slate-100 transition-colors" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
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
          
          <div className="flex flex-col gap-3 pt-4">
            {/* Header Row (Desktop Only) */}
            <div className="hidden md:flex items-center justify-between px-5 pb-2 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="w-[300px]">Entity Profile</div>
              <div className="w-[200px] text-center">Role & Status</div>
              <div className="w-[120px] text-center">Metrics</div>
              <div className="w-[200px] text-right">Administrative Actions</div>
            </div>

            {/* List Rows */}
            {accounts.map(a => (
              <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col md:flex-row items-center justify-between gap-5 group">
                
                {/* 1. Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full md:w-[300px] shrink-0">
                  <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${getAvatarStyle(a.role)} text-white flex items-center justify-center font-black text-xl shadow-sm overflow-hidden border-2 border-white`}>
                    {a.profile_picture ? (
                      <img src={a.profile_picture} alt={a.full_name} className="w-full h-full object-cover" />
                    ) : (
                      a.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="font-black text-slate-900 text-base truncate leading-tight">{a.full_name}</div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      <span className="flex items-center gap-1 text-slate-500"><Mail size={10} className="text-slate-300"/> {a.email}</span>
                      {a.phone && (
                        <a 
                          href={`https://wa.me/${a.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer group/wa shadow-sm"
                          title="Contact via WhatsApp"
                        >
                          <Phone size={10} className="text-emerald-600 group-hover/wa:text-white transition-colors"/> 
                          <span className="text-[9px] font-black tracking-normal">{a.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Role & Status */}
                <div className="flex items-center gap-3 w-full md:w-[200px] shrink-0 justify-start md:justify-center">
                  <RoleBadge role={a.role} />
                  <div className="w-px h-6 bg-slate-100 hidden md:block"></div>
                  {a.is_verified ? 
                     <span className="text-[9px] font-black px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 uppercase tracking-widest"><CheckCircle size={10}/> Verified</span> : 
                     <span className="text-[9px] font-black px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1 uppercase tracking-widest"><Clock size={10}/> Pending</span>
                  }
                  {a.status === 'suspended' && <span className="text-[9px] font-black px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">Suspended</span>}
                </div>

                {/* 3. Stats */}
                <div className="flex items-center gap-6 w-full md:w-[120px] shrink-0 justify-start md:justify-center">
                  {a.role === 'transporter' ? (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 font-black text-sm">{a.stats?.vehicles || 0}</span> 
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vehicles</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 font-black text-sm">{a.stats?.missions || 0}</span> 
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Missions</span>
                      </div>
                    </>
                  ) : a.role === 'buyer' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-slate-800 font-black text-sm">{a.stats?.orders || 0}</span> 
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Orders</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 font-black text-sm">{a.stats?.listings || 0}</span> 
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Listings</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-800 font-black text-sm">{a.stats?.orders || 0}</span> 
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Orders</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 4. Actions */}
                <div className="flex items-center gap-2 w-full md:w-[200px] shrink-0 justify-start md:justify-end">
                  <button className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-black rounded-xl flex items-center gap-1.5 transition-all uppercase tracking-widest shadow-sm active:scale-95" onClick={() => handleMessage(a)}>
                    <MessageSquare size={12} /> Msg
                  </button>
                  <button className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-[10px] font-black rounded-xl flex items-center gap-1.5 transition-all uppercase tracking-widest shadow-md active:scale-95" onClick={() => setSelectedUserId(a.id)}>
                    <Eye size={12} /> View
                  </button>
                  {a.status !== 'suspended' ? (
                    <button
                      className="h-9 w-9 bg-white hover:bg-rose-50 text-rose-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ml-1"
                      disabled={actionLoading === `${a.id}-suspend`}
                      onClick={() => handleAction(a.id, 'suspend')}
                      title="Suspend Account"
                    >
                      {actionLoading === `${a.id}-suspend` ? <RefreshCw size={12} className="animate-spin"/> : <UserMinus size={14}/>}
                    </button>
                  ) : (
                    <button
                      className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ml-1"
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
