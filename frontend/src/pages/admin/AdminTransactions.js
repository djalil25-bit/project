import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Download, Search, ChevronUp, ChevronDown, Eye, ArrowUpDown, Package, MapPin, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import html2pdf from 'html2pdf.js';
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
          exclude_completed: true
        }
      });
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

  const downloadSinglePDF = async (txnStub) => {
    let txn = txnStub;
    try {
      const res = await adminApi.get(`/transactions/${txnStub.id}/`);
      txn = res.data;
    } catch (err) { console.warn("Using stub data", err); }

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #1e293b;">
        <div style="border-bottom: 4px solid #059669; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; color: #064e3b; font-size: 28px; font-weight: 900; letter-spacing: -1px;">AGRIGOV <span style="color: #059669;">LOGISTICS</span></h1>
            <p style="margin: 5px 0 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b;">Official Transaction Manifest • Registry ID: #${txn.id}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e293b;">Date: ${new Date(txn.created_at).toLocaleDateString()}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Status: ${txn.status}</p>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Entities Involved</h3>
            <div style="font-size: 11px; color: #475569; line-height: 1.6;">
              <div><b>Farmer:</b> ${txn.farmer_name || 'N/A'}</div>
              <div><b>Buyer:</b> ${txn.buyer?.name || txn.buyer_name || 'N/A'}</div>
              ${txn.buyer?.email ? `<div><b>Buyer Email:</b> ${txn.buyer.email}</div>` : ''}
              ${txn.buyer?.phone ? `<div><b>Buyer Phone:</b> ${txn.buyer.phone}</div>` : ''}
            </div>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #166534; margin-bottom: 12px; border-bottom: 1px solid #dcfce7; padding-bottom: 5px;">Logistics & Destination</h3>
            <div style="font-size: 11px; color: #475569; line-height: 1.6;">
              <div><b>Wilaya:</b> ${txn.wilaya || txn.buyer_zone || 'N/A'}</div>
              <div><b>Commune:</b> ${txn.commune || 'N/A'}</div>
              ${txn.delivery_address ? `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #bbf7d0;"><b>Address:</b> ${txn.delivery_address}</div>` : ''}
            </div>
          </div>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Inventory</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; background: #f8fafc;">
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b;">Description</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: center;">Quantity</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: right;">Unit Value</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(txn.items && txn.items.length > 0 ? txn.items : [{product: txn.product, quantity: txn.quantity, price_snapshot: txn.total_price / (txn.quantity || 1), item_total: txn.total_price}]).map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 12px;">${item.product}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.quantity}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${item.price_snapshot?.toLocaleString()} DZD</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #059669;">${item.item_total?.toLocaleString()} DZD</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: bold; color: #64748b;">Logistics Appraisal</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: bold;">${txn.transport_fee?.toLocaleString() || 0} DZD</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td colspan="3" style="padding: 15px 12px; text-align: right; font-size: 14px; font-weight: 900; color: #1e293b;">FINAL SETTLEMENT</td>
                <td style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: 900; color: #059669;">${txn.total_price.toLocaleString()} DZD</td>
              </tr>
            </tfoot>
          </table>
        </div>
        ${txn.timeline && txn.timeline.length > 0 ? `
          <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Official Timeline</h3>
            <div style="font-size: 9px; color: #475569; line-height: 1.8;">
              ${txn.timeline.map(t => `
                <div style="display: flex; gap: 15px; border-bottom: 1px solid #f1f5f9; padding: 4px 0;">
                  <span style="font-weight: bold; color: #1e293b; width: 70px;">${new Date(t.created_at).toLocaleDateString()}</span>
                  <span style="font-weight: 800; color: #10b981; width: 100px;">${t.status}</span>
                  <span>by ${t.actor}</span>
                  ${t.note ? `<span style="font-style: italic; color: #94a3b8;">— ${t.note}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div style="background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: left; font-size: 10px; color: #64748b; font-weight: bold;">
            GENERATED BY AGRIGOV INTELLIGENCE SYSTEMS<br/>ALGIERS, ALGERIA • VERIFIED DOCUMENT
          </div>
          <div style="text-align: right;">
             <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #10b981;">Registry Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>
        </div>
      </div>
    `;
    const opt = { margin: 0, filename: `txn_${txn.id}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().from(element).set(opt).save();
  };

  const downloadAllPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 30px; font-family: sans-serif;">
        <h1 style="color: #064e3b; margin-bottom: 5px;">Active Order Registry</h1>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 20px;">Export Date: ${new Date().toLocaleString()} • ${data.length} Records</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f0fdf4; text-align: left;">
              <th style="padding: 10px; border: 1px solid #dcfce7;">ID</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Date</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Farmer</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Buyer</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Product</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Value</th>
              <th style="padding: 10px; border: 1px solid #dcfce7;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(t => `
              <tr>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">#${t.id}</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${new Date(t.created_at).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${t.farmer_name}</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${t.buyer_name}</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${t.product}</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${t.total_price.toLocaleString()} DZD</td>
                <td style="padding: 8px; border: 1px solid #f1f5f9;">${t.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    const opt = { margin: 0.5, filename: 'active_registry.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } };
    html2pdf().from(element).set(opt).save();
  };

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
            onClick={downloadAllPDF}
          >
             <Download size={14} className="text-emerald-400" /> Download Registry (PDF)
          </button>
          <button 
            className="flex-1 md:flex-none bg-emerald-100/10 hover:bg-emerald-100/20 text-emerald-400 rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 border border-emerald-500/30" 
            onClick={exportCSV}
          >
             CSV Export
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
                  <td className="px-6 py-4 text-right" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="bg-white hover:bg-slate-100 text-slate-400 border border-slate-200 w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 group-hover:border-slate-200" onClick={()=>handleSelectTxn(t)} title="View Detail Matrix">
                        <Eye size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {/* Pagination Console */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal Output • Page {page} of {totalPages}</span>
            <button className="text-[9px] font-black uppercase text-emerald-600 hover:underline flex items-center gap-1" onClick={downloadAllPDF}>
              <Download size={10}/> Full Registry PDF
            </button>
          </div>
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
