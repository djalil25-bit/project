import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, XCircle, AlertCircle, RefreshCw, User, ShieldAlert,
  ShieldCheck, ChevronRight, ClipboardList, Clock, CheckCircle, Package, Truck, MapPin, Calendar, CreditCard, ChevronDown, ChevronUp, ShoppingBag, Divide
} from 'lucide-react';

/* ─── Premium E-commerce Timeline Stepper ─────────────────────────────── */
const DeliveryTimeline = ({ order }) => {
  const steps = [
    { key: 'ordered', label: 'Confirmed', icon: <Package size={12} /> },
    { key: 'transit', label: 'Transit', icon: <Truck size={12} /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={12} /> }
  ];

  let currentStepIndex = 0;
  if (order.status === 'CONFIRMED') currentStepIndex = 0;
  
  const reqStatus = order.delivery_request?.status?.toUpperCase();
  if (reqStatus === 'ASSIGNED' || reqStatus === 'PICKED_UP' || reqStatus === 'IN_TRANSIT') currentStepIndex = 1;
  const orderDelivStatus = order.delivery_status?.toUpperCase();
  if (orderDelivStatus === 'DELIVERED') currentStepIndex = 2;
  
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
    CONFIRMED: { color: 'text-blue-600',  bg: 'bg-blue-50',      icon: <CheckCircle size={10} />, label: 'Confirmed' },
    REJECTED:  { color: 'text-rose-600',  bg: 'bg-rose-50',      icon: <XCircle size={10} />,     label: 'Rejected' },
    CANCELLED: { color: 'text-slate-600', bg: 'bg-slate-100',    icon: <AlertCircle size={10} />, label: 'Cancelled' },
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
    PICKED_UP:  { bg: 'bg-indigo-50', color: 'text-indigo-600', icon: <Truck size={10} />,        label: 'Transit' },
    IN_TRANSIT: { bg: 'bg-indigo-50', color: 'text-indigo-600', icon: <Truck size={10} />,        label: 'Transit' },
    CANCELLED:  { bg: 'bg-rose-50', color: 'text-rose-600', icon: <XCircle size={10} />,      label: 'Cancelled' },
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
  { key: 'rejected',  label: 'Rejected' },
  { key: 'delivered', label: 'Delivered' },
];

function matchesFilter(order, filter) {
  switch (filter) {
    case 'all':       return true;
    case 'pending':   return order.status?.toUpperCase() === 'PENDING';
    case 'confirmed': return order.status?.toUpperCase() === 'CONFIRMED';
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
                              <div className="p-4 md:p-6 animate-fade-in shadow-inner">
                                <DeliveryTimeline order={o} />
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  
                                  {/* Left Col: Receipt Module */}
                                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 relative flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-1.5 text-slate-900">
                                        <FileText size={14} className="text-blue-600" />
                                        <h6 className="font-black text-[10px] uppercase tracking-widest m-0">Digital Receipt</h6>
                                      </div>
                                      {o.delivery_status?.toUpperCase() === 'DELIVERED' && (
                                        <Link
                                          to={`/buyer-dashboard/invoices/${o.id}`}
                                          className="text-blue-600 hover:text-blue-800 text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 transition-colors"
                                        >
                                          View Master
                                        </Link>
                                      )}
                                    </div>

                                    <div className="space-y-2 mb-4 overflow-y-auto max-h-40 pr-1">
                                      {o.items?.map(item => {
                                        const name = item.product_detail?.title || item.product_name || 'Item';
                                        const unit = item.product_detail?.unit || item.product_unit || 'KG';
                                        const unitPrice = parseFloat(item.price_per_unit || item.price_snapshot || 0);
                                        const qty = parseFloat(item.quantity || 0);
                                        const sub = (unitPrice * qty).toFixed(0);
                                        return (
                                          <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                              <div className="w-5 h-5 rounded bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Package size={10} /></div>
                                              <div className="truncate min-w-0">
                                                <div className="font-black text-[10px] text-slate-800 truncate">{name}</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 truncate">{qty} {unit} @ {unitPrice}</div>
                                              </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                              <div className="font-black text-slate-900 text-[11px]">{parseInt(sub).toLocaleString()} <span className="text-[8px] text-slate-400">DZD</span></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="border-t border-dashed border-slate-200 mt-auto pt-3">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">
                                        <span>Subtotal Array</span>
                                        <span>{parseFloat(o.total_price).toLocaleString()} DZD</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg shadow-sm">
                                        <span className="font-black text-[9px] uppercase tracking-widest">Gross Total Auth</span>
                                        <span className="text-sm font-black text-blue-400 tracking-tighter drop-shadow-sm">{parseFloat(o.total_price).toLocaleString()} <span className="text-[8px] text-blue-600">DZD</span></span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Col: Logistics & Security */}
                                  <div className="flex flex-col gap-4">
                                     <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-1.5 mb-2 text-blue-600">
                                          <MapPin size={14} />
                                          <h6 className="font-black text-[9px] uppercase tracking-widest m-0">Protocol Traces</h6>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-700 leading-snug mb-3 max-h-10 overflow-hidden text-ellipsis">
                                          {o.delivery_address}{o.wilaya ? `, ${o.wilaya}` : ''}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                           <div>
                                             <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Supplier</label>
                                             <FarmerStatusBadge status={o.status} />
                                           </div>
                                           <div>
                                             <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Hub Tracker</label>
                                             <DeliveryStatusBadge o={o} />
                                           </div>
                                        </div>
                                     </div>

                                     {/* Proof of Delivery Component */}
                                     {o.delivery_request?.pod_completed_at ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 relative overflow-hidden flex flex-col justify-center">
                                          <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="text-emerald-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12} /> Valid PoD</div>
                                            <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">{new Date(o.delivery_request.pod_completed_at).toLocaleDateString()}</div>
                                          </div>
                                          
                                          <div className="flex items-center gap-3 relative z-10">
                                            {o.delivery_request.pod_photo && (
                                              <div className="w-12 h-12 bg-white border border-emerald-200 rounded shadow-sm overflow-hidden flex shrink-0 items-center justify-center cursor-pointer hover:border-emerald-400 transition" onClick={() => window.open(o.delivery_request.pod_photo, '_blank')}>
                                                <img src={o.delivery_request.pod_photo} alt="PoD Trace" className="max-h-full max-w-full object-contain" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                               <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Signed Target</div>
                                               <div className="text-xs font-extrabold text-slate-800 truncate">{o.delivery_request.pod_recipient_name}</div>
                                            </div>
                                          </div>

                                          {!o.buyer_confirmed_at ? (
                                            <button 
                                              className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 text-white py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm transition-all active:scale-95"
                                              onClick={async () => {
                                                if(!window.confirm("Acknowledge secure transfer?")) return;
                                                try {
                                                  await api.post(`/orders/${o.id}/confirm_receipt/`);
                                                  const res = await api.get('/orders/');
                                                  setOrders(res.data.results || res.data);
                                                } catch (err) { alert(err.response?.data?.error || "Error."); }
                                              }}
                                            >
                                              Clear Handshake
                                            </button>
                                          ) : (
                                            <div className="mt-3 w-full bg-emerald-600 text-white py-1 rounded-lg font-black text-[8px] uppercase tracking-widest flex justify-center items-center gap-1 shadow-inner">
                                              <CheckCircle size={10} /> Transfer Sealed
                                            </div>
                                          )}
                                        </div>
                                     ) : (
                                       <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 relative overflow-hidden flex-1 flex flex-col justify-center">
                                          <div className="flex justify-between items-center mb-1 text-rose-600">
                                            <h6 className="font-black text-[9px] uppercase tracking-widest m-0 flex items-center gap-1"><AlertCircle size={12}/> Fault Block</h6>
                                          </div>
                                          <p className="text-[9px] text-rose-800 font-medium mb-3 leading-tight">
                                            If asset integrity is compromised, invoke official disposition immediately.
                                          </p>
                                          <Link 
                                            to={`/complaints/new?order_id=${o.id}&type=ORDER`}
                                            className="w-full bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm transition-all flex justify-center items-center gap-1 active:scale-95"
                                          >
                                            <ShieldAlert size={12} /> Invoke Support
                                          </Link>
                                      </div>
                                     )}

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
