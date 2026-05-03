import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { Activity, ChevronRight, Search, Download, Eye, UserMinus, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

const actorTypes = ['admin','farmer','buyer','transporter','system'];

const stIcon = s => s==='success'?<CheckCircle size={13} className="text-green-500"/>:s==='warning'?<AlertTriangle size={13} className="text-yellow-500"/>:<AlertTriangle size={13} className="text-red-500"/>;
const flagSt = s => s==='UNDER_REVIEW'?{bg:'#FFF4E0',c:'#B45309'}:s==='INVESTIGATING'?{bg:'#E8F0FE',c:'#0066CC'}:{bg:'#E6F9EE',c:'#047857'};

const AdminMonitoring = () => {
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);
  const [flagged, setFlagged] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await adminApi.get('/monitoring/activity-log/', {
        params: { search, actor_type: actorFilter, date_range: dateRange, page: logsPage }
      });
      setLogs(res.data.results || []);
      setLogsTotal(res.data.total || 0);
      setLogsTotalPages(res.data.total_pages || 1);
    } catch { setLogs([]); }
    finally { setLogsLoading(false); }
  }, [search, actorFilter, dateRange, logsPage]);

  const fetchFlagged = useCallback(async () => {
    setFlaggedLoading(true);
    try {
      const res = await adminApi.get('/monitoring/flagged-accounts/');
      setFlagged(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { setFlagged([]); }
    finally { setFlaggedLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchFlagged(); }, [fetchFlagged]);

  const handleFlagAction = async (flagId, newStatus) => {
    setActionLoading(`flag-${flagId}`);
    try {
      await adminApi.patch(`/monitoring/flagged-accounts/${flagId}/`, { status: newStatus });
      showToast(`Flagged account status updated to ${newStatus}`);
      fetchFlagged();
    } catch { showToast('Action failed'); }
    finally { setActionLoading(null); }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this account?')) return;
    setActionLoading(`suspend-${userId}`);
    try {
      await adminApi.post(`/accounts/${userId}/action/`, { action: 'suspend' });
      showToast('Account suspended successfully');
      fetchFlagged();
    } catch { showToast('Suspend failed'); }
    finally { setActionLoading(null); }
  };

  const exportCSV = () => {
    const hdr='Time,Actor,Type,Action,Details,Status\n';
    const rows=logs.map(l=>`${l.timestamp},${l.actor},${l.actor_type},${l.action},"${typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}",${l.status}`).join('\n');
    const blob=new Blob([hdr+rows],{type:'text/csv'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='activity_log.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Monitoring</span></div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center"><Activity className="text-orange-600" size={24}/></div>
        <div><h1 className="text-xl font-extrabold text-gray-900">Activity Monitoring</h1><p className="text-gray-500 text-sm">System activity logs and fraud detection.</p></div>
      </div>

      {/* Toast */}
      {toast && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"><CheckCircle size={16}/> {toast}</div>}

      {/* Flagged Accounts */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><ShieldAlert size={16} className="text-red-500"/> Flagged Accounts</h3>
        {flaggedLoading ? <div className="py-8 text-center text-gray-400">Loading flagged accounts...</div> :
         flagged.length === 0 ? <div className="py-8 text-center"><ShieldAlert size={24} className="text-gray-300 mx-auto mb-2"/><p className="text-gray-400 text-sm">No flagged accounts.</p></div> : (
        <div className="space-y-3">
          {flagged.map(f=>{
            const sc=flagSt(f.status);
            return(
              <div key={f.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ShieldAlert size={16} className="text-red-400 shrink-0"/>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{f.account_name || f.account?.full_name || `Account #${f.account}`}</div>
                    <div className="text-xs text-gray-500">{f.reason}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{f.flagged_at ? new Date(f.flagged_at).toLocaleDateString() : new Date(f.created_at).toLocaleDateString()}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:sc.bg,color:sc.c}}>{f.status}</span>
                  <button className="adm-btn adm-btn-ghost text-xs" onClick={() => navigate('/admin-dashboard/accounts')}><Eye size={12}/> View</button>
                  {f.account && (
                    <button
                      className="adm-btn adm-btn-warning text-xs"
                      disabled={actionLoading === `suspend-${f.account}`}
                      onClick={() => handleSuspendUser(typeof f.account === 'object' ? f.account.id : f.account)}
                    >
                      <UserMinus size={12}/> Suspend
                    </button>
                  )}
                  {f.status !== 'RESOLVED' && (
                    <button className="adm-btn adm-btn-primary text-xs" onClick={() => handleFlagAction(f.id, 'RESOLVED')}>Resolve</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-gray-100 gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={16} className="text-blue-600"/> Activity Log</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="adm-input pl-9 w-48" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setLogsPage(1);}}/></div>
            <select className="adm-input w-auto" value={actorFilter} onChange={e=>{setActorFilter(e.target.value);setLogsPage(1);}}><option value="all">All Actors</option>{actorTypes.map(t=><option key={t} value={t}>{t}</option>)}</select>
            <select className="adm-input w-auto" value={dateRange} onChange={e=>{setDateRange(e.target.value);setLogsPage(1);}}><option value="24h">Last 24h</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
            <button className="adm-btn adm-btn-ghost text-xs" onClick={exportCSV}><Download size={13}/> CSV</button>
          </div>
        </div>
        {logsLoading ? <div className="py-12 text-center text-gray-400">Loading activity log...</div> : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th><th>Status</th></tr></thead>
            <tbody>{logs.length===0?(
              <tr><td colSpan="5"><div className="py-12 text-center text-gray-400">No activities match filters.</div></td></tr>
            ):logs.map(l=>(
              <tr key={l.id}>
                <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                <td><div className="text-sm font-medium text-gray-800">{l.actor}</div><div className="text-xs text-gray-400">{l.actor_type}</div></td>
                <td className="text-sm text-gray-700">{l.action}</td>
                <td className="text-xs text-gray-500 max-w-xs truncate">{typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}</td>
                <td><div className="flex items-center gap-1">{stIcon(l.status)}<span className="text-xs text-gray-600 capitalize">{l.status}</span></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{logsTotal} entries</span>
          <div className="flex gap-1">
            <button className="adm-btn adm-btn-ghost text-xs" disabled={logsPage<=1} onClick={()=>setLogsPage(p=>p-1)}>Prev</button>
            <span className="text-xs text-gray-500 self-center px-2">{logsPage}/{logsTotalPages}</span>
            <button className="adm-btn adm-btn-ghost text-xs" disabled={logsPage>=logsTotalPages} onClick={()=>setLogsPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonitoring;
