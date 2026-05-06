import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Download, Search, ChevronUp, ChevronDown, Eye, ArrowUpDown, Package, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import adminApi from '../../api/adminApi';
import TransactionDetailModal from '../../components/admin/TransactionDetailModal';

const statuses = ['PENDING','CONFIRMED','DELIVERED','CANCELLED','REJECTED','REFUSED_DELIVERY','RETURNED'];

const StatusBadge = ({ s }) => {
  if (s==='CONFIRMED'||s==='DELIVERED') return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-200"><CheckCircle size={10}/> {s.replace(/_/g,' ')}</span>;
  if (s==='PENDING') return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-amber-200"><Clock size={10}/> {s}</span>;
  if (s==='CANCELLED'||s==='REJECTED'||s==='REFUSED_DELIVERY'||s==='RETURNED') return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-rose-200"><XCircle size={10}/> {s.replace(/_/g,' ')}</span>;
  return <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">{s.replace(/_/g,' ')}</span>;
};

const AdminTransactions = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/transactions/', {
        params: {
          page, search, status: filterStatus, zone: filterZone,
          sort: sortDir === 'desc' ? sortKey : `-${sortKey}`,
          exclude_completed: true // Custom param to filter out DELIVERED/RETURNED if backend supports it, otherwise we filter client-side
        }
      });
      
      // Client-side fallback filter if backend doesn't handle 'exclude_completed'
      const rawResults = res.data.results || [];
      const filteredResults = rawResults.filter(t => t.status !== 'DELIVERED' && t.status !== 'RETURNED');
      
      setData(filteredResults);
      setTotalPages(res.data.total_pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setData([]);
    } finally { setLoading(false); }
  }, [page, search, filterStatus, filterZone, sortKey, sortDir]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    adminApi.get('/analytics/zones/').then(res => setZones(res.data.zones || [])).catch(() => {});
  }, []);

  const handleSelectTxn = async (txn) => {
    try {
      const res = await adminApi.get(`/transactions/${txn.id}/`);
      setSelected(res.data);
    } catch { setSelected(txn); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortH = ({ k, children }) => (
    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => toggleSort(k)}>
      <div className="flex items-center gap-1">{children} {sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={10} className="opacity-30"/>}</div>
    </th>
  );

  const exportCSV = () => {
    const hdr = 'ID,Date,Farmer,Buyer,Product,Value,Status,Zone\n';
    const rows = data.map(t => `${t.id},${new Date(t.created_at).toLocaleDateString()},${t.farmer_name},${t.buyer_name},${t.product},${t.total_price},${t.status},${t.buyer_zone}`).join('\n');
    const blob = new Blob([hdr + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'active_transactions.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleAction = async (orderId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this order?`)) return;
    try {
      await adminApi.post(`/transactions/${orderId}/action/`, { action });
      fetchTransactions();
      setSelected(null);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <ShoppingBag size={12} /> Transaction Operations
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Active Order Pipeline
          </h1>
          <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest mt-2">{data.length} ACTIVE MISSIONS DETECTED</p>
        </div>
        <div className="z-10 mt-3 md:mt-0 flex items-center gap-2 w-full md:w-auto">
          <button 
            className="flex-1 md:flex-none bg-[#0f5c44] hover:bg-[#166534] text-white rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 border border-emerald-500/30" 
            onClick={exportCSV}
          >
             <Download size={14} className="text-emerald-400" /> Export Active Registry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input 
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner" 
              placeholder="Search ID, farmer, buyer, product..." 
              value={search} 
              onChange={e=>{setSearch(e.target.value);setPage(1);}}
            />
          </div>
          <select className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner w-full md:w-auto" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}>
            <option value="all">All Active Statuses</option>
            {statuses.filter(s => s !== 'DELIVERED' && s !== 'RETURNED').map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner w-full md:w-auto" value={filterZone} onChange={e=>{setFilterZone(e.target.value);setPage(1);}}>
            <option value="all">Global Zones</option>
            {zones.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          <button className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-sm" onClick={fetchTransactions}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing transactions...</span>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <SortH k="id">Batch ID</SortH>
                <SortH k="date">Initiated</SortH>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant / Farmer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Destination / Buyer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Manifest</th>
                <SortH k="value">Appraisal</SortH>
                <SortH k="status">Status</SortH>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ops</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
                       <ShoppingBag size={32} className="text-slate-200" />
                    </div>
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">No active missions available.</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">Completed missions are suppressed from this view.</div>
                  </td>
                </tr>
              ) : data.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors cursor-pointer group" onClick={() => handleSelectTxn(t)}>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm group-hover:bg-emerald-100 transition-colors">#{t.id}</span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-500 whitespace-nowrap uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-800 tracking-tight">{t.farmer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-800 tracking-tight">{t.buyer_name}</div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">
                      <MapPin size={10} className="text-emerald-500"/> {t.buyer_zone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-white transition-colors">
                        <Package size={14} className="text-emerald-600"/>
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{t.product}</span>
                      {t.quantity > 0 && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 ml-1">×{t.quantity}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-sm tracking-tight">{t.total_price.toLocaleString()}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">DZD</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge s={t.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-white hover:bg-emerald-600 hover:text-white text-slate-400 border border-slate-200 w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ml-auto active:scale-95 group-hover:border-emerald-200" onClick={e=>{e.stopPropagation();handleSelectTxn(t);}} title="View Transaction Matrix">
                      <Eye size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {/* Pagination Console */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal Output • Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:cursor-not-allowed" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <div className="flex gap-1.5">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = page <= 3 ? i+1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return <button key={p} className={`w-9 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center ${p===page?'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 border border-emerald-500':'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-sm'}`} onClick={()=>setPage(p)}>{p}</button>;
              })}
            </div>
            <button className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:cursor-not-allowed" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {selected && <TransactionDetailModal txn={selected} onClose={() => setSelected(null)} onAction={handleAction} />}
    </div>
  );
};

export default AdminTransactions;
