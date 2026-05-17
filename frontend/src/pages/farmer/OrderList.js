import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Package, User, ListOrdered, CheckCircle, XCircle,
  Clock, Truck, Search, Eye, ChevronLeft, ChevronRight,
  ShieldAlert, Phone
} from 'lucide-react';

/* ── Pure Tailwind Status badges ───────────────────────────────────────── */
const OrderStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || '';
  const map = {
    PENDING:            { cls: 'bg-amber-100 text-amber-800 border-amber-200',   icon: <Clock size={12} />,         label: 'Pending'   },
    CONFIRMED:          { cls: 'bg-[#2E6F40] text-white border-[#255933] shadow-sm font-black',  icon: <CheckCircle size={12} />,   label: 'Confirmed' },
    DELIVERED:          { cls: 'bg-slate-900 text-white border-slate-900 shadow-sm font-black',  icon: <Truck size={12} />,         label: 'Delivered' },
    REFUSED_DELIVERY:   { cls: 'bg-rose-100 text-rose-800 border-rose-200 font-black', icon: <ShieldAlert size={12} />, label: 'Refused' },
    RETURN_IN_PROGRESS: { cls: 'bg-rose-50 text-rose-700 border-rose-200 border-dashed animate-pulse', icon: <Truck size={12} />,      label: 'Returning' },
    RETURNED:           { cls: 'bg-[#2E6F40] text-white border-[#255933] shadow-sm font-black', icon: <CheckCircle size={12} />, label: 'Returned' },
    REJECTED:           { cls: 'bg-red-100 text-red-800 border-red-200',   icon: <XCircle size={12} />,       label: 'Rejected'  },
  };
  const b = map[s] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: null, label: s };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold border ${b.cls}`}>{b.icon} {b.label}</span>;
};

const DeliveryBadge = ({ order }) => {
  const hasReq      = order.has_delivery_request;
  const reqStatus   = order.delivery_request?.status?.toUpperCase() || '';
  const delivStatus = order.delivery_status?.toUpperCase() || '';

  if (delivStatus === 'DELIVERED') return <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#cee8d9] text-emerald-800 border border-[#a2d4b5] rounded-full text-[10px] font-extrabold"><CheckCircle size={12} /> Delivered</span>;
  if (!hasReq)                     return <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-extrabold">Not Sent</span>;

  const map = {
    OPEN:               { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',  label: 'Awaiting' },
    ASSIGNED:           { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Assigned'             },
    PICKED_UP:          { cls: 'bg-purple-100 text-purple-800 border-purple-200',  label: 'In Transit'           },
    IN_TRANSIT:         { cls: 'bg-purple-100 text-purple-800 border-purple-200',  label: 'In Transit'           },
    REFUSED_DELIVERY:   { cls: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Refused' },
    RETURN_IN_PROGRESS: { cls: 'bg-rose-50 text-rose-700 border-rose-200 border-dashed animate-pulse', label: 'Returning' },
    RETURNED:           { cls: 'bg-[#2E6F40] text-white border-[#255933] font-black', label: 'Returned' },
    CANCELLED:          { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled'            },
  };
  const b = map[reqStatus] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: reqStatus || 'Unknown' };
  return <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-extrabold border ${b.cls}`}>{b.label}</span>;
};

/* ── Format order number ─────────────────────────────────── */
const fmtNum = o => o.farmer_order_number
  ? `F-${String(o.farmer_order_number).padStart(3, '0')}`
  : String(o.id);

export default function OrderList() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const qp        = new URLSearchParams(location.search);
  const initFilter = qp.get('status')?.toUpperCase() || 'ALL';

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState(initFilter);
  const [searchTerm, setSearch]     = useState('');
  const [expandedRow, setExpanded]  = useState(null);
  const [actionLoading, setActLoad] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer-orders/');
      setOrders(res.data.results || res.data);
    } catch (err) { console.error('Failed to fetch orders', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAction = async (orderId, action) => {
    setActLoad(orderId + '_' + action);
    try {
      await api.post(`/farmer-orders/${orderId}/status/`, { action });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Action failed.');
    } finally { setActLoad(null); }
  };

  const filteredOrders = orders.filter(o => {
    let match = false;
    if (filter === 'ALL')        match = true;
    else if (filter === 'DELIVERED') match = o.delivery_status?.toUpperCase() === 'DELIVERED';
    else if (filter === 'CONFIRMED') match = o.status?.toUpperCase() === 'CONFIRMED' && o.delivery_status?.toUpperCase() !== 'DELIVERED';
    else if (filter === 'RETURNED') match = o.status?.toUpperCase() === 'RETURNED';
    else match = o.status?.toUpperCase() === filter;

    const locNum   = o.farmer_order_number ? `F-${String(o.farmer_order_number).padStart(3,'0')}` : String(o.id);
    const matchSrc = (o.buyer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                     locNum.toLowerCase().includes(searchTerm.toLowerCase());
    return match && matchSrc;
  });

  const filterTabs = [
    { key: 'ALL',       label: 'All'   },
    { key: 'PENDING',   label: 'Pending'   },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'RETURNED',  label: 'Returned'  },
    { key: 'REJECTED',  label: 'Rejected'  },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#2E6F40] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading orders...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative z-0">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5">
          <ListOrdered size={11} /> My Orders
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
            <ListOrdered size={22} strokeWidth={2.5} />
          </div>
          Registry of Orders
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Monitor and manage your incoming harvest orders and delivery logistics.</p>
      </div>

      {/* ── UNIFIED FLEXBOX FILTER BAR ────────────────────────────── */}
      {/* ── FILTER BAR ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6 flex flex-col xl:flex-row gap-2 xl:items-center overflow-hidden">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2E6F40] transition-colors" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40]/20 transition-all text-xs font-black text-slate-700 placeholder-slate-400 uppercase tracking-wider"
            placeholder="Search by Order ID or Buyer Name..."
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden xl:block w-px h-6 bg-slate-100 mx-2" />

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto hide-scrollbar">
          {filterTabs.map(t => (
            <button
              key={t.key}
              className={`whitespace-nowrap px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === t.key ? 'bg-white text-[#2E6F40] shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESPONSIVE TABLE CONTAINER ─────────────────────────────────── */}
      {/* ── ORDERS TABLE ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-[#2E6F40] text-[#cee8d9] uppercase text-[9px] font-black tracking-widest">
                <th className="px-6 py-4">Registry Ref</th>
                <th className="px-6 py-4">Buyer Identity</th>
                <th className="px-6 py-4 text-center">Volume</th>
                <th className="px-6 py-4 text-right">Settlement</th>
                <th className="px-6 py-4">Lifecycle</th>
                <th className="px-6 py-4">Logistics</th>
                <th className="px-6 py-4 text-center">Timestamp</th>
                <th className="px-6 py-4 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="p-16 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <ListOrdered size={32} className="text-slate-300" />
                      </div>
                      <h2 className="text-lg font-black text-slate-800 mb-1">No Orders</h2>
                      <p className="text-slate-500 text-sm font-medium">No orders match your search.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr className="bg-white hover:bg-[#f0faf4]/40 transition-colors group cursor-pointer border-b border-slate-50 last:border-b-0" onClick={() => setExpanded(expandedRow === o.id ? null : o.id)}>
                    <td className="px-6 py-4">
                      <span className="font-black text-[#2E6F40] text-[11px] tracking-tight">#{fmtNum(o)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-[#2E6F40] flex items-center justify-center font-black text-[10px] shrink-0 border border-slate-100 shadow-sm group-hover:bg-white">
                          {o.buyer_name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-black text-[11px] text-slate-700 tracking-tight">{o.buyer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-500 text-[10px] font-black bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{o.items?.length || 0} ITEMS</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900 text-xs tabular-nums">{Number(o.farmer_total || o.total_price || 0).toLocaleString()} <span className="text-[10px] text-slate-400">DZD</span></span>
                    </td>
                    <td className="px-6 py-4"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-6 py-4"><DeliveryBadge order={o} /></td>
                    <td className="px-6 py-4 text-[10px] text-center font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                      {new Date(o.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {o.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-white text-[#2E6F40] hover:bg-[#2E6F40] hover:text-white border border-slate-200 hover:border-[#2E6F40] rounded-xl transition-all shadow-sm active:scale-95"
                              title="Confirm"
                              onClick={() => handleAction(o.id, 'confirm')}
                              disabled={actionLoading === o.id + '_confirm'}
                            >
                              {actionLoading === o.id + '_confirm'
                                ? <span className="inline-block w-3 h-3 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin" />
                                : <CheckCircle size={14} strokeWidth={2.5} />
                              }
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center bg-white text-red-600 hover:bg-red-600 hover:text-white border border-slate-200 hover:border-red-600 rounded-xl transition-all shadow-sm active:scale-95"
                              title="Reject"
                              onClick={() => handleAction(o.id, 'reject')}
                              disabled={actionLoading === o.id + '_reject'}
                            >
                              {actionLoading === o.id + '_reject'
                                ? <span className="inline-block w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                : <XCircle size={14} strokeWidth={2.5} />
                              }
                            </button>
                          </>
                        )}
                        <button
                          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 ${expandedRow === o.id ? 'bg-[#2E6F40] text-white border border-[#2E6F40]' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                          title="View"
                          onClick={() => setExpanded(expandedRow === o.id ? null : o.id)}
                        >
                          <Eye size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── EXPANDED DOSSIER ───────────────────── */}
                  {expandedRow === o.id && (
                    <tr>
                      <td colSpan="8" className="p-0 border-0">
                        <div className="bg-slate-50 border-t border-b border-slate-200 shadow-inner overflow-hidden animate-fade-in">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
                            {/* Vertical Separator */}
                            <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-200 -ml-px z-10" />

                            <div className="p-6">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-4 pb-2 border-b border-slate-200 border-dashed">
                                <Package size={14} /> Order Items
                              </div>
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse table-fixed text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                                      <th className="px-3 py-2 w-1/2 truncate">Identifier</th>
                                      <th className="px-3 py-2 w-1/4 text-center truncate">Vol</th>
                                      <th className="px-3 py-2 w-1/4 text-right truncate">Net Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {o.items?.map(item => (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 truncate">
                                          <div className="font-extrabold text-slate-800 truncate">{item.product_name}</div>
                                          <div className="text-[9px] font-bold text-slate-400 mt-0.5">{item.price_per_unit} DZD/UN</div>
                                        </td>
                                        <td className="px-3 py-2 text-center font-black text-slate-600">{item.quantity}</td>
                                        <td className="px-3 py-2 text-right font-black text-[#2E6F40] truncate">{item.item_total}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="p-6 bg-white">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-4 pb-2 border-b border-slate-200 border-dashed">
                                <User size={14} /> Delivery & Totals
                              </div>
                              <div className="space-y-2 mb-6">
                                <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Phone:</span>
                                  {o.buyer_phone ? (
                                    <a 
                                      href={`https://wa.me/${o.buyer_phone.replace(/\D/g, '').startsWith('0') ? '213' + o.buyer_phone.replace(/\D/g, '').substring(1) : o.buyer_phone.replace(/\D/g, '')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#f0faf4] text-[#255933] border border-[#a2d4b5] rounded-lg text-[11px] font-black hover:bg-[#cee8d9] hover:border-[#76b08a] transition-all shadow-sm"
                                    >
                                      <Phone size={11} className="fill-[#255933]" /> {o.buyer_phone}
                                    </a>
                                  ) : (
                                    <span className="text-xs font-black text-slate-400 italic">UNAVAILABLE</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Delivery Address:</span>
                                  <span className="text-[10px] font-extrabold text-slate-800 text-right truncate max-w-[60%]">
                                    {o.wilaya && <span className="text-[#2E6F40] mr-1">{o.wilaya} /</span>}
                                    {o.delivery_address}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-white/5 pb-2">
                                  <span>Order Totals</span>
                                  <span className="text-[#4a8c5f]">DZD (Net)</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span>{parseFloat(o.order_subtotal || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-400">Transport Fee</span>
                                    <span className="text-indigo-300">+{parseFloat(o.transport_fee || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                                    <span className="text-lg font-black text-[#4a8c5f]">{(parseFloat(o.order_subtotal || 0) + parseFloat(o.transport_fee || 0)).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                                {o.status?.toUpperCase() === 'CONFIRMED' && (
                                  <div className="mt-4 pt-2">
                                    {!o.has_delivery_request ? (
                                      <button
                                        className="w-full flex items-center justify-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white py-2.5 rounded-lg text-xs font-extrabold shadow-md transition-transform hover:-translate-y-0.5"
                                        onClick={() => navigate(`/farmer-dashboard/orders/${o.id}/request-delivery`)}
                                      >
                                        <Truck size={14} strokeWidth={2.5} /> Request Delivery
                                      </button>
                                    ) : (
                                      <div className="w-full flex items-center justify-center gap-2 bg-[#f0faf4] text-[#255933] py-2.5 rounded-lg text-xs font-black border border-[#a2d4b5]">
                                        <CheckCircle size={14} /> Delivery Requested
                                      </div>
                                    )}
                                  </div>
                                )}

                                {o.refusal_reason && (
                                   <div className="mt-4 bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldAlert size={48} /></div>
                                      <div className="flex items-center gap-2 text-rose-600 mb-4 border-b border-rose-100 pb-3">
                                         <ShieldAlert size={16} />
                                         <h6 className="font-black text-[10px] uppercase tracking-widest m-0">Refusal Reason</h6>
                                      </div>
                                      <div className="space-y-4 relative z-10">
                                         <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-rose-400 uppercase">Reason</span>
                                            <div className="text-[11px] font-black text-rose-900 border-l-2 border-rose-300 pl-3 py-1 bg-white/40">{o.refusal_reason}</div>
                                         </div>
                                         {o.refusal_note && (
                                            <div className="flex flex-col gap-1">
                                               <span className="text-[9px] font-black text-rose-400 uppercase">Note</span>
                                               <p className="text-[10px] text-rose-800 font-medium italic leading-snug bg-white/40 p-2 rounded-lg border border-rose-100">"{o.refusal_note}"</p>
                                            </div>
                                         )}
                                         <div className="pt-2 flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-[9px]">
                                               <span className="font-bold text-rose-400 uppercase">Refused On:</span>
                                               <span className="font-black text-rose-700">{new Date(o.refused_at).toLocaleString()}</span>
                                            </div>
                                            {o.returned_at && (
                                              <div className="flex justify-between items-center text-[9px]">
                                                 <span className="font-bold text-[#2E6F40] uppercase">Returned On:</span>
                                                 <span className="font-black text-[#255933]">{new Date(o.returned_at).toLocaleString()}</span>
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                )}

                                {o.delivery_request?.pod_completed_at && (
                                  <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><ShieldAlert size={48} /></div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#2E6F40] tracking-widest mb-2">
                                      <CheckCircle size={12} /> Proof of Delivery
                                    </div>
                                    <div className="space-y-1 relative z-10 text-xs">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-500">Signed By:</span> 
                                        <span className="font-black text-slate-800 truncate pl-2">{o.delivery_request.pod_recipient_name}</span>
                                      </div>
                                      <div className="font-bold text-slate-400 text-[10px] text-right">
                                        {new Date(o.delivery_request.pod_completed_at).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Have a problem?</span>
                                  <Link
                                    to={`/complaints/new?order_id=${o.id}&type=PAYMENT`}
                                    className="flex items-center justify-center gap-1.5 text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors rounded-lg px-3 py-1.5"
                                  >
                                    <ShieldAlert size={12} /> File Complaint
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        </tr>
                      )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
