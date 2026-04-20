import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  FileText, XCircle, AlertCircle, RefreshCw, User, ShieldAlert,
  ShieldCheck, ChevronRight, ClipboardList, Clock, CheckCircle, Package, Truck, MapPin, ChevronDown, ChevronUp, ShoppingBag
} from 'lucide-react';

/* ─── Premium E-commerce Timeline Stepper ─────────────────────────────── */
const DeliveryTimeline = ({ order }) => {
  const logs = order.timeline || [];
  
  const steps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: <Package size={12} /> },
    { key: 'PICKED_UP', label: 'Picked Up', icon: <Truck size={12} /> },
    { key: 'DELIVERED', label: 'Delivered', icon: <CheckCircle size={12} /> }
  ];

  // Logic for alternate path (Refusal)
  const isRefused = logs.some(l => l.status === 'REFUSED_DELIVERY');
  const isReturned = logs.some(l => l.status === 'RETURNED');

  if (isRefused || isReturned) {
     const returnSteps = [
        { key: 'CONFIRMED', label: 'Confirmed', icon: <Package size={12} /> },
        { key: 'REFUSED_DELIVERY', label: 'Refused', icon: <ShieldAlert size={12} />, color: 'bg-rose-500' },
        { key: 'RETURNED', label: 'Returned', icon: <RefreshCw size={12} />, color: 'bg-emerald-600' }
     ];
     
     let currentIndex = 0;
     if (logs.some(l => l.status === 'REFUSED_DELIVERY')) currentIndex = 1;
     if (logs.some(l => l.status === 'RETURNED')) currentIndex = 2;

     return (
        <div className="relative mb-6 px-4">
          <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-100 -translate-y-1/2 rounded-full -z-10 overflow-hidden">
             <div className={`h-full transition-all duration-1000 ease-in-out ${currentIndex === 1 ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${(currentIndex / 2) * 100}%` }} />
          </div>
          <div className="flex justify-between items-center relative z-10 w-full">
            {returnSteps.map((step, idx) => {
              const isActive = idx <= currentIndex;
              const stepColor = step.color || 'bg-blue-600';
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5" title={step.label}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? `${stepColor} text-white shadow-lg` : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                    {step.icon}
                  </div>
                  <div className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
     );
  }

  let currentStepIndex = -1;
  if (logs.some(l => l.status === 'AWAITING_PICKUP' || l.status === 'CONFIRMED')) currentStepIndex = 0;
  if (logs.some(l => l.status === 'PICKED_UP' || l.status === 'IN_TRANSIT')) currentStepIndex = 1;
  if (logs.some(l => l.status === 'DELIVERED')) currentStepIndex = 2;
  
  if (order.status === 'PENDING') {
     return (
       <div className="flex items-center justify-center p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl mb-4">
         <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
           <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/> Awaiting Clearance
         </div>
       </div>
     );
  }

  return (
    <div className="relative mb-6 px-4">
      <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-100 -translate-y-1/2 rounded-full -z-10 overflow-hidden">
         <div className="h-full bg-blue-500 transition-all duration-1000 ease-in-out" style={{ width: `${(currentStepIndex / 2) * 100}%` }} />
      </div>
      <div className="flex justify-between items-center relative z-10 w-full">
        {steps.map((step, idx) => {
          const isActive = idx <= currentStepIndex;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)] shadow-inner' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                {step.icon}
              </div>
              <div className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-blue-900 drop-shadow-sm' : 'text-slate-400'}`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Status badge components ─────────────────────────────── */
const FarmerStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'PENDING';
  const config = {
    PENDING:   { color: 'text-amber-600', bg: 'bg-amber-50',     icon: <Clock size={10} />,       label: 'Pending' },
    CONFIRMED:          { color: 'text-emerald-600',  bg: 'bg-emerald-50',      icon: <CheckCircle size={10} />, label: 'Confirmed' },
    REFUSED_DELIVERY:   { color: 'text-rose-600',  bg: 'bg-rose-50',     icon: <ShieldAlert size={10} />, label: 'Refused' },
    RETURN_IN_PROGRESS: { color: 'text-rose-600',  bg: 'bg-rose-50',     icon: <Truck size={10} />,       label: 'Returning' },
    RETURNED:           { color: 'text-emerald-600', bg: 'bg-emerald-50',    icon: <RefreshCw size={10} />,   label: 'Returned' },
    DELIVERED:          { color: 'text-slate-900', bg: 'bg-slate-50', icon: <CheckCircle size={10} />, label: 'Delivered' },
    REJECTED:           { color: 'text-rose-600',  bg: 'bg-rose-50',      icon: <XCircle size={10} />,     label: 'Rejected' },
    CANCELLED:          { color: 'text-slate-600', bg: 'bg-slate-100',    icon: <AlertCircle size={10} />, label: 'Cancelled' },
  };
  const c = config[s] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${c.bg} ${c.color} shadow-sm border border-${c.color.split('-')[1]}-200/50`}>
      {c.icon} {c.label}
    </span>
  );
};

const DeliveryStatusBadge = ({ o }) => {
  const hasReq = o.has_delivery_request;
  const reqStatus = o.delivery_request?.status?.toUpperCase() || '';
  const orderDelivStatus = o.delivery_status?.toUpperCase() || '';
  
  if (orderDelivStatus === 'DELIVERED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm">
        <CheckCircle size={10} /> Delivered
      </span>
    );
  }

  if (!hasReq) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-200/50 shadow-sm">
        <Clock size={10} /> Routing
      </span>
    );
  }

  const config = {
    OPEN:       { bg: 'bg-amber-50', color: 'text-amber-600', icon: <Clock size={10} />,        label: 'Awaiting' },
    ASSIGNED:   { bg: 'bg-blue-50', color: 'text-blue-600', icon: <User size={10} />,         label: 'Assigned' },
    PICKED_UP:          { bg: 'bg-indigo-50', color: 'text-indigo-600', icon: <Truck size={10} />,        label: 'Transit' },
    IN_TRANSIT:         { bg: 'bg-indigo-50', color: 'text-indigo-600', icon: <Truck size={10} />,        label: 'Transit' },
    REFUSED_DELIVERY:   { bg: 'bg-rose-50', color: 'text-rose-600', icon: <ShieldAlert size={10} />,   label: 'Refused' },
    RETURN_IN_PROGRESS: { bg: 'bg-rose-50', color: 'text-rose-600', icon: <Truck size={10} />,         label: 'Returning' },
    RETURNED:           { bg: 'bg-emerald-50', color: 'text-emerald-600', icon: <RefreshCw size={10} />,   label: 'Returned' },
    CANCELLED:          { bg: 'bg-rose-50', color: 'text-rose-600', icon: <XCircle size={10} />,      label: 'Cancelled' },
  };

  const c = config[reqStatus] || { bg: 'bg-slate-50', color: 'text-slate-500', icon: <Package size={10} />, label: reqStatus || 'Processing' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${c.bg} ${c.color} shadow-sm border border-${c.color.split('-')[1]}-200/50`}>
      {c.icon} {c.label}
    </span>
  );
};

/* ─── Filter tabs ─────────────────────────────────────────── */
const FILTER_TABS = [
  { key: 'all',       label: 'All Log' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'returned',  label: 'Returned' },
  { key: 'rejected',  label: 'Rejected' },
  { key: 'delivered', label: 'Delivered' },
];

function matchesFilter(order, filter) {
  switch (filter) {
    case 'all':       return true;
    case 'pending':   return order.status?.toUpperCase() === 'PENDING';
    case 'confirmed': return order.status?.toUpperCase() === 'CONFIRMED' && order.delivery_status?.toUpperCase() !== 'DELIVERED';
    case 'returned':  return order.status?.toUpperCase() === 'RETURNED';
    case 'rejected':  return order.status?.toUpperCase() === 'REJECTED';
    case 'delivered': return order.delivery_status?.toUpperCase() === 'DELIVERED';
    default:          return true;
  }
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders/');
        setOrders(res.data.results || res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter(o => matchesFilter(o, activeFilter));

  return (
    <div className="w-full px-4 sm:px-6 xl:px-8 py-6 space-y-6 animate-fade-in relative z-0 text-slate-900 bg-slate-50 min-h-screen">
      
      {/* ── BREADCRUMBS & HEADER ───────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2">
            <Link to="/buyer-dashboard" className="hover:underline hover:text-blue-800 transition-colors">Marketplace</Link>
            <ChevronRight size={10} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><ClipboardList size={10}/> Order Log</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600" strokeWidth={2.5} /> Master Logistics
          </h1>
        </div>
        <Link to="/buyer-dashboard/invoices" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] active:scale-95">
          <FileText size={14} /> View Invoices
        </Link>
      </div>

      {/* ── FILTER TABS ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === tab.key ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-0.5 opacity-70 border-l border-blue-200/50 pl-1">
                {orders.filter(o => matchesFilter(o, tab.key)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Scanning ledgers...</span>
        </div>
      ) : (
        <div className="w-full">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-slate-300" />
              </div>
              <h4 className="text-sm font-black text-slate-800 mb-1">No trace data available</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                {activeFilter === 'all' ? "Your logistics ledger is empty." : `Zero nodes match status [${activeFilter}].`}
              </p>
              {activeFilter !== 'all' ? (
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors" onClick={() => setActiveFilter('all')}>
                  <RefreshCw size={12} className="text-slate-400" /> Reset Filter
                </button>
              ) : (
                <Link to="/buyer-dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-[0_4px_10px_rgba(37,99,235,0.2)] transition-all">Browse Map</Link>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                     <tr className="bg-slate-900 text-white uppercase text-[8px] font-black tracking-widest">
                       <th className="px-3 py-2 w-28 border-b border-slate-800">Route Ref</th>
                       <th className="px-3 py-2 w-24 border-b border-slate-800 hidden sm:table-cell">Auth Date</th>
                       <th className="px-3 py-2 w-48 border-b border-slate-800 hidden md:table-cell">Payload</th>
                       <th className="px-3 py-2 border-b border-slate-800 text-right">Value (DZD)</th>
                       <th className="px-3 py-2 border-b border-slate-800 text-center">Node State</th>
                       <th className="px-3 py-2 border-b border-slate-800 text-center">Logistics</th>
                       <th className="px-3 py-2 w-12 border-b border-slate-800 text-right">Ext</th>
                     </tr>
                  </thead>
                  <tbody>
                    {filtered.map(o => (
                      <React.Fragment key={o.id}>
                        <tr className="bg-white even:bg-slate-50 hover:bg-blue-50/50 transition-colors group cursor-pointer border-b border-slate-100 last:border-b-0" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                          <td className="px-3 py-3">
                            <span className="font-extrabold text-blue-600 text-xs tracking-tight whitespace-nowrap">#AG-{o.id.toString().padStart(5, '0')}</span>
                            <div className="text-[8px] uppercase tracking-widest font-bold d-flex items-center text-slate-400 mt-0.5 whitespace-nowrap truncate max-w-[80px]">
                              {o.payment_method?.replace(/_/g, ' ') || 'Cash'}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {new Date(o.created_at).toLocaleDateString('en-GB')}
                            </span>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="font-black text-slate-800 text-[10px] whitespace-nowrap leading-tight">{o.items?.length} Element{o.items?.length !== 1 ? 's' : ''}</div>
                            <div className="text-[8px] uppercase font-bold tracking-widest text-slate-400 truncate max-w-[120px] xl:max-w-[180px] leading-tight">
                              {o.items?.[0]?.product_detail?.title || o.items?.[0]?.product_name}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                             <span className="font-black text-slate-900 text-xs whitespace-nowrap">{parseFloat(o.total_price).toLocaleString()}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <FarmerStatusBadge status={o.status} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            {o.status === 'CONFIRMED' || o.status === 'confirmed'
                              ? <DeliveryStatusBadge o={o} />
                              : <span className="text-[10px] font-bold text-slate-300">—</span>
                            }
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              className={`w-6 h-6 ml-auto rounded-full flex items-center justify-center transition-colors border border-transparent ${expanded === o.id ? 'bg-blue-600 text-white shadow-sm border-blue-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              {expanded === o.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </td>
                        </tr>

                        {/* ── EXPANDED DISPATCH DETAILS (COMPRESSED) ──────────────────────────────── */}
                        {expanded === o.id && (
                          <tr className="bg-slate-50 border-b-2 border-blue-100">
                            <td colSpan="7" className="p-0 border-0 pointer-events-auto">
                              <div className="p-6 md:p-8 animate-fade-in shadow-inner bg-slate-50/50">
                                
                                {/* ── TOP PROGRESS SECTION ── */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                                   <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><RefreshCw size={16} /></div>
                                         <h3 className="font-black text-xs uppercase tracking-widest m-0">Live Flux Tracker</h3>
                                      </div>
                                      <FarmerStatusBadge status={o.status} />
                                   </div>
                                   <DeliveryTimeline order={o} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Col 1: Payload Matrix */}
                                  <div className="lg:col-span-2 space-y-6">
                                     <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-full">
                                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                          <div className="flex items-center gap-2">
                                            <Package size={18} className="text-blue-600" />
                                            <h6 className="font-black text-xs uppercase tracking-widest m-0">Asset Payload Matrix</h6>
                                          </div>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded">{o.items?.length} Discrete Nodes</div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                          {o.items?.map(item => {
                                            const name = item.product_detail?.title || item.product_name || 'Item';
                                            const unit = item.product_detail?.unit || item.product_unit || 'KG';
                                            const unitPrice = parseFloat(item.price_per_unit || item.price_snapshot || 0);
                                            const qty = parseFloat(item.quantity || 0);
                                            const sub = (unitPrice * qty).toFixed(0);
                                            return (
                                              <div key={item.id} className="flex justify-between items-center bg-slate-50/80 hover:bg-white hover:shadow-md p-3 rounded-xl border border-slate-100 transition-all group">
                                                <div className="flex items-center gap-4 truncate">
                                                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                    {item.product_image ? <img src={item.product_image} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={20} /></div>}
                                                  </div>
                                                  <div className="truncate min-w-0">
                                                    <div className="font-black text-xs text-slate-800 truncate">{name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                       <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{qty} {unit}</span>
                                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@ {unitPrice.toLocaleString()} DZD</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                  <div className="font-black text-slate-900 text-sm tracking-tight">{parseInt(sub).toLocaleString()} <span className="text-[9px] text-slate-400 uppercase font-black">DZD</span></div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                                           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform"><FileText size={80} /></div>
                                           <div className="flex justify-between items-end relative z-10">
                                              <div>
                                                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Financial Settlement</div>
                                                 <div className="text-2xl font-black text-blue-400 tracking-tighter">{parseFloat(o.total_price).toLocaleString()} <span className="text-xs text-slate-500 uppercase">DZD</span></div>
                                              </div>
                                              {o.delivery_status?.toUpperCase() === 'DELIVERED' && (
                                                <Link
                                                  to={`/buyer-dashboard/invoices/${o.id}`}
                                                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10"
                                                >
                                                  Invoice Portal
                                                </Link>
                                              )}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  {/* Col 2: Intel & Traces */}
                                  <div className="space-y-6">
                                     {/* Logistics Trace */}
                                     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                                          <MapPin size={16} className="text-blue-600" />
                                          <h6 className="font-black text-xs uppercase tracking-widest m-0">Logistics Traces</h6>
                                        </div>
                                        <div className="space-y-4">
                                           <div className="flex flex-col gap-1 text-[11px]">
                                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Target</span>
                                              <div className="font-bold text-slate-800 leading-tight bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                                {o.delivery_address}{o.wilaya ? `, ${o.wilaya}` : ''}
                                              </div>
                                           </div>
                                           <div className="grid grid-cols-2 gap-3 pt-2">
                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hub State</label>
                                                <DeliveryStatusBadge o={o} />
                                              </div>
                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Auth Type</label>
                                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                                                   {o.payment_method?.replace(/_/g, ' ') || 'Cash Auth'}
                                                </div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Refusal Intel Block */}
                                     {o.refusal_reason && (
                                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldAlert size={48} /></div>
                                           <div className="flex items-center gap-2 text-rose-600 mb-4 border-b border-rose-100 pb-3">
                                              <ShieldAlert size={16} />
                                              <h6 className="font-black text-xs uppercase tracking-widest m-0">Refusal Intelligence</h6>
                                           </div>
                                           <div className="space-y-4 relative z-10">
                                              <div className="flex flex-col gap-1">
                                                 <span className="text-[9px] font-black text-rose-400 uppercase">Primary Discrepancy</span>
                                                 <div className="text-[11px] font-black text-rose-900 border-l-2 border-rose-300 pl-3 py-1">{o.refusal_reason}</div>
                                              </div>
                                              {o.refusal_note && (
                                                 <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-rose-400 uppercase">Field Observations</span>
                                                    <p className="text-[10px] text-rose-800 font-medium italic leading-snug">"{o.refusal_note}"</p>
                                                 </div>
                                              )}
                                              <div className="pt-2 flex flex-col gap-2">
                                                 <div className="flex justify-between items-center text-[9px]">
                                                    <span className="font-bold text-rose-400 uppercase">Logged At:</span>
                                                    <span className="font-black text-rose-700">{new Date(o.refused_at).toLocaleString()}</span>
                                                 </div>
                                                 {o.returned_at && (
                                                   <div className="flex justify-between items-center text-[9px]">
                                                      <span className="font-bold text-emerald-500 uppercase">Finalized At:</span>
                                                      <span className="font-black text-emerald-700">{new Date(o.returned_at).toLocaleString()}</span>
                                                   </div>
                                                 )}
                                              </div>
                                           </div>
                                        </div>
                                     )}

                                     {/* PoD Intelligence */}
                                     {o.delivery_request?.pod_completed_at && !o.refusal_reason && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                                           <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-4 shadow-emerald-500/20"><ShieldCheck size={24} /></div>
                                           <h6 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-800 mb-2">Authenticated PoD</h6>
                                           <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-4">Signed by {o.delivery_request.pod_recipient_name}</div>
                                           {o.delivery_request.pod_photo && (
                                              <button onClick={() => window.open(o.delivery_request.pod_photo, '_blank')} className="w-full h-32 rounded-xl border border-emerald-200 overflow-hidden bg-white hover:border-emerald-400 transition-all shadow-sm">
                                                 <img src={o.delivery_request.pod_photo} alt="PoD Trace" className="w-full h-full object-cover" />
                                              </button>
                                           )}
                                        </div>
                                     )}

                                     {/* Action Block */}
                                     {o.status === 'PENDING' && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                                           <Clock size={32} className="text-amber-500 mx-auto mb-3" />
                                           <h6 className="font-black text-xs uppercase tracking-widest text-amber-800 mb-2">Pending Supplier Auth</h6>
                                           <p className="text-[10px] text-amber-700 font-medium mb-4 leading-normal">The supplier has not yet verified this transaction. You may abort the sequence to restore credits instantly.</p>
                                           <button 
                                             onClick={async () => {
                                               if(!window.confirm("Abort this transaction? Stock will be restored automatically.")) return;
                                               try { await api.post(`/orders/${o.id}/cancel/`); const res = await api.get('/orders/'); setOrders(res.data.results || res.data); } catch (err) { alert(err.response?.data?.error || "Error."); }
                                             }}
                                             className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                                           >
                                             Abort Sequence
                                           </button>
                                        </div>
                                     )}

                                     {/* Transaction Logs */}
                                     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex-1">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                          <Clock size={16} className="text-blue-600" />
                                          <h6 className="font-black text-xs uppercase tracking-widest m-0">Flux Logs</h6>
                                        </div>
                                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                                           {o.timeline?.slice().reverse().map((entry, idx) => (
                                              <div key={idx} className="relative pl-8 group">
                                                 <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-[3px] border-white flex items-center justify-center shadow-md transition-all ${idx === 0 ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                 </div>
                                                 <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                       <span className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-blue-900' : 'text-slate-500'}`}>{entry.status.replace(/_/g, ' ')}</span>
                                                       <span className="text-[8px] font-black text-slate-300 uppercase bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100">{new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    {entry.note && <p className="text-[10px] text-slate-400 font-medium leading-tight mb-1.5 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">"{entry.note}"</p>}
                                                    {entry.actor_name && (
                                                       <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-tight">
                                                          <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center"><User size={10} /></div> {entry.actor_name}
                                                       </div>
                                                    )}
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
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
          )}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
