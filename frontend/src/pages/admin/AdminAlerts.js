import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { Bell, ChevronRight, TrendingDown, Package, ShieldAlert, Clock, Server, Settings, CheckCircle, Flag } from 'lucide-react';

const meta = {
  PRICE_ANOMALY:        { icon: TrendingDown, color:'#DD0033', bg:'#FDE8ED', label:'Price Anomaly' },
  STOCK_IMBALANCE:      { icon: Package,      color:'#FF9900', bg:'#FFF4E0', label:'Stock Alert' },
  SUSPICIOUS_ACTIVITY:  { icon: ShieldAlert,  color:'#DC2626', bg:'#FEE2E2', label:'Fraud/Behavior' },
  USER_REPORT:          { icon: Flag,         color:'#EAB308', bg:'#FEF9C3', label:'User Report' },
  VERIFICATION_PENDING: { icon: Clock,        color:'#0066CC', bg:'#E8F0FE', label:'Verifications' },
  SYSTEM_ALERT:         { icon: Server,       color:'#DD0033', bg:'#FDE8ED', label:'System Alert' },
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState([]);
  const [alertSummary, setAlertSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [stFilter, setStFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, configRes, summaryRes] = await Promise.all([
        adminApi.get('/alerts/', { params: { type: tab !== 'all' ? tab : undefined, status: stFilter !== 'all' ? stFilter : undefined } }),
        adminApi.get('/alerts/config/'),
        adminApi.get('/alerts/summary/'),
      ]);
      const alertData = Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data.results || [];
      setAlerts(alertData);
      setConfig(Array.isArray(configRes.data) ? configRes.data : configRes.data.results || []);
      setAlertSummary(summaryRes.data || {});
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlerts([]);
    } finally { setLoading(false); }
  }, [tab, stFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAlertAction = async (alertId, newStatus) => {
    try {
      await adminApi.patch(`/alerts/${alertId}/`, { status: newStatus });
      showToast(`Alert ${newStatus.toLowerCase()} successfully`);
      fetchData();
    } catch (err) {
      showToast('Action failed');
    }
  };

  const tabs = [
    { k:'all', l:'All Alerts' },
    { k:'STOCK_IMBALANCE', l:'Stock Alerts' },
    { k:'SUSPICIOUS_ACTIVITY', l:'Fraud/Behavior' },
    { k:'USER_REPORT', l:'User Reports' },
    { k:'VERIFICATION_PENDING', l:'Verifications' },
  ];

  const list = alerts;

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Alerts</span></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center"><Bell className="text-red-600" size={24}/></div>
          <div><h1 className="text-xl font-extrabold text-gray-900">Alert Center</h1><p className="text-gray-500 text-sm">Monitor and respond to platform anomalies.</p></div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"><CheckCircle size={16}/> {toast}</div>}

      {/* Config Summary */}
      {config.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3"><Settings size={14} className="text-gray-500"/><span className="text-sm font-semibold text-gray-700">Alert Thresholds</span></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {config.map((c, i) => (
              <div key={i} className="text-xs bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-gray-500 mb-1">{c.alert_type?.replace(/_/g, ' ')}</div>
                <div className="font-bold text-gray-800">{c.threshold_value}{c.threshold_unit || '%'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="adm-tab-bar w-fit overflow-x-auto">
          {tabs.map(t=>{
            const count = t.k === 'all' ? Object.values(alertSummary).reduce((a, b) => a + b, 0) : alertSummary[t.k] || 0;
            return <button key={t.k} className={`adm-tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.l} ({count})</button>;
          })}
        </div>
        <select className="adm-input w-auto" value={stFilter} onChange={e=>setStFilter(e.target.value)}>
          <option value="all">All Statuses</option><option value="ACTIVE">Active</option><option value="RESOLVED">Resolved</option><option value="INVESTIGATING">Investigating</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center text-gray-500">Loading alerts...</div>
        ) : list.length === 0 ? (
          <div className="glass-card p-12 text-center"><Bell size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No alerts match filters.</p></div>
        ) : list.map(al => { 
          const m = meta[al.alert_type] || meta['SYSTEM_ALERT']; 
          const Ic = m.icon;
          return (
            <div key={al.id} className={`alert-card alert-${al.alert_type} flex flex-col md:flex-row md:items-center gap-4`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor:m.bg}}><Ic size={18} style={{color:m.color}}/></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold uppercase" style={{color:m.color}}>{m.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${al.status==='ACTIVE'?'bg-red-100 text-red-700':al.status==='INVESTIGATING'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{al.status}</span>
                    {al.severity==='CRITICAL'&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">CRITICAL</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{al.product_name || al.zone || al.alert_type?.replace(/_/g, ' ')}</h4>
                  {al.alert_type === 'SUSPICIOUS_ACTIVITY' && al.details_json?.discrepancy ? (
                    <div className="mt-1 font-medium text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 inline-block text-xs">
                      {al.details_json.discrepancy}
                    </div>
                  ) : al.alert_type === 'USER_REPORT' && al.details_json?.message ? (
                    <div className="mt-1 font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 inline-block text-xs">
                      {al.details_json.message}
                    </div>
                  ) : al.alert_type === 'STOCK_IMBALANCE' && al.details_json?.message ? (
                    <div className="mt-1 font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100 inline-block text-xs">
                      {al.details_json.message}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 truncate">{al.details_json?.description || JSON.stringify(al.details_json)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(al.created_at).toLocaleDateString()} {new Date(al.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                {al.status === 'ACTIVE' && (
                  <>
                    <button className="adm-btn adm-btn-ghost text-xs" onClick={() => handleAlertAction(al.id, 'INVESTIGATING')}>Review</button>
                    <button className="adm-btn adm-btn-primary text-xs" onClick={() => handleAlertAction(al.id, 'RESOLVED')}>Resolve</button>
                  </>
                )}
                {al.status === 'INVESTIGATING' && (
                  <button className="adm-btn adm-btn-primary text-xs" onClick={() => handleAlertAction(al.id, 'RESOLVED')}>Resolve</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminAlerts;
