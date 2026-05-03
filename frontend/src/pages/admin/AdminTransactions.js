import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Download, Search, ChevronUp, ChevronDown, Eye, ArrowUpDown } from 'lucide-react';
import adminApi from '../../api/adminApi';
import TransactionDetailModal from '../../components/admin/TransactionDetailModal';

const statuses = ['PENDING','CONFIRMED','DELIVERED','CANCELLED','REJECTED','REFUSED_DELIVERY','RETURNED'];

const stColor = s => {
  if (s==='CONFIRMED'||s==='DELIVERED') return { bg:'#E6F9EE', c:'#047857' };
  if (s==='PENDING') return { bg:'#FFF4E0', c:'#B45309' };
  if (s==='CANCELLED'||s==='REJECTED'||s==='REFUSED_DELIVERY') return { bg:'#FDE8ED', c:'#B91C1C' };
  return { bg:'#F3F4F6', c:'#6B7280' };
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
        }
      });
      setData(res.data.results || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setData([]);
    } finally { setLoading(false); }
  }, [page, search, filterStatus, filterZone, sortKey, sortDir]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Fetch zones for filter dropdown
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
    <th className="cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <div className="flex items-center gap-1">{children} {sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={10} className="opacity-30"/>}</div>
    </th>
  );

  const exportCSV = () => {
    const hdr = 'ID,Date,Farmer,Buyer,Product,Value,Status,Zone\n';
    const rows = data.map(t => `${t.id},${new Date(t.created_at).toLocaleDateString()},${t.farmer_name},${t.buyer_name},${t.product},${t.total_price},${t.status},${t.buyer_zone}`).join('\n');
    const blob = new Blob([hdr + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click(); URL.revokeObjectURL(url);
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
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Transactions</span></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center"><ShoppingBag className="text-purple-600" size={24}/></div>
          <div><h1 className="text-xl font-extrabold text-gray-900">Transactions</h1><p className="text-gray-500 text-sm">{totalCount.toLocaleString()} orders across the platform</p></div>
        </div>
        <button className="adm-btn adm-btn-ghost" onClick={exportCSV}><Download size={15}/> Export CSV</button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="adm-input pl-10" placeholder="Search ID, farmer, buyer, product..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <select className="adm-input w-auto" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}>
            <option value="all">All Statuses</option>{statuses.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select className="adm-input w-auto" value={filterZone} onChange={e=>{setFilterZone(e.target.value);setPage(1);}}>
            <option value="all">All Zones</option>{zones.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="adm-spinner"></div><span className="text-gray-400 text-sm ml-3">Loading transactions...</span></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr>
              <SortH k="id">ID</SortH><SortH k="date">Date</SortH><th>Farmer</th><th>Buyer</th>
              <th>Product</th><SortH k="value">Value</SortH><SortH k="status">Status</SortH>
              <th>Delivery</th><th>Payment</th><th style={{textAlign:'right'}}>Actions</th>
            </tr></thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="10"><div className="py-12 text-center text-gray-400"><ShoppingBag size={32} className="mx-auto mb-2 opacity-30"/><p>No transactions found.</p></div></td></tr>
              ) : data.map(t => {
                const sc = stColor(t.status);
                return (
                  <tr key={t.id} className="cursor-pointer" onClick={() => handleSelectTxn(t)}>
                    <td><span className="font-mono text-xs font-bold text-blue-600">#{t.id}</span></td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td><div className="text-sm font-medium text-gray-800">{t.farmer_name}</div></td>
                    <td><div className="text-sm font-medium text-gray-800">{t.buyer_name}</div><div className="text-xs text-gray-400">{t.buyer_zone}</div></td>
                    <td><span className="text-sm text-gray-700">{t.product}</span>{t.quantity > 0 && <span className="text-xs text-gray-400 ml-1">×{t.quantity}</span>}</td>
                    <td><span className="font-bold text-gray-900">{t.total_price.toLocaleString()}</span><span className="text-xs text-gray-400 ml-1">DZD</span></td>
                    <td><span className="text-xs font-bold px-2 py-1 rounded-full" style={{backgroundColor:sc.bg,color:sc.c}}>{t.status.replace(/_/g,' ')}</span></td>
                    <td><span className="text-xs text-gray-500">{t.delivery_status.replace(/_/g,' ')}</span></td>
                    <td><span className="text-xs text-gray-500">{t.payment_method?.replace(/_/g,' ')}</span></td>
                    <td style={{textAlign:'right'}}><button className="adm-btn adm-btn-ghost adm-btn-icon" onClick={e=>{e.stopPropagation();handleSelectTxn(t);}}><Eye size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Page {page} of {totalPages} ({totalCount} results)</span>
          <div className="flex gap-2">
            <button className="adm-btn adm-btn-ghost text-xs" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = page <= 3 ? i+1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return <button key={p} className={`adm-btn text-xs ${p===page?'adm-btn-primary':'adm-btn-ghost'}`} onClick={()=>setPage(p)}>{p}</button>;
            })}
            {totalPages > 5 && <span className="text-gray-400 self-center">...</span>}
            <button className="adm-btn adm-btn-ghost text-xs" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {selected && <TransactionDetailModal txn={selected} onClose={() => setSelected(null)} onAction={handleAction} />}
    </div>
  );
};

export default AdminTransactions;
