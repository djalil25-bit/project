import React from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Package, 
  Truck, 
  Clock, 
  DollarSign, 
  Info,
  Calendar,
  Thermometer,
  ShieldAlert,
  Phone,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

const MissionDetailsModal = ({ mission, onClose, onAccept, hasActiveMission, actionLoading }) => {
  if (!mission) return null;

  const orderDetail = mission.order_detail || {};
  const items = orderDetail.items || [];
  
  const fee = mission.estimated_fee ? `${parseFloat(mission.estimated_fee).toLocaleString()} DZD` : 'N/A';
  const totalQuantity = items.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
  
  const vehicleTypeLabel = VEHICLE_TYPES.find(vt => vt.id === mission.required_vehicle_type)?.name || 'Standard Truck';

  const isAccepted = mission.status !== 'open';
  const canAccept = mission.status === 'open' && !hasActiveMission;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/50 backdrop-blur-md animate-fade-in p-4 pt-10 md:pt-16 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-200/60 my-auto">
        
        {/* Ministry-Grade Header */}
        <div className="bg-slate-900 text-white px-8 py-3.5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-950/20">
              <Truck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight leading-tight text-white">Mission Manifest</h2>
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400 leading-none mt-1 opacity-90">Registry ID: MIL-{mission.id.toString().padStart(4, '0')}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Optimized Manifest Content */}
        <div className="p-4 md:p-5 space-y-4 overflow-hidden">
          
          {/* Logistics & Yield Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 flex flex-col justify-center gap-3 shadow-sm">
               <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10"><MapPin size={16} /></div>
                 <div className="truncate">
                   <span className="text-[8px] font-black text-emerald-600 uppercase block tracking-widest leading-none mb-1">Pickup Node</span>
                   <span className="text-xs font-black text-slate-800 truncate block">{mission.pickup_wilaya} <span className="font-medium text-slate-400 text-[10px]">— {mission.pickup_location}</span></span>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10"><Navigation size={16} /></div>
                 <div className="truncate">
                   <span className="text-[8px] font-black text-indigo-600 uppercase block tracking-widest leading-none mb-1">Destination Node</span>
                   <span className="text-xs font-black text-slate-800 truncate block">{orderDetail.wilaya} <span className="font-medium text-slate-400 text-[10px]">— {orderDetail.delivery_address}</span></span>
                 </div>
               </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-[1.5rem] p-4 flex flex-col justify-center items-center text-center shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">Financial Yield</span>
              <div className="text-2xl font-black text-indigo-950 tracking-tighter leading-none mb-2.5">{fee}</div>
              <div className="text-[9px] font-bold text-indigo-700 bg-white border border-indigo-100 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                <Calendar size={10} /> {mission.preferred_delivery_date ? new Date(mission.preferred_delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Flexible'}
              </div>
            </div>
          </div>

          {/* Cargo & Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payload Inventory</span>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{totalQuantity.toLocaleString()} Units</span>
              </div>
              <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="max-h-[110px] overflow-y-auto custom-scrollbar">
                  {items.map((item, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="truncate pr-4">
                        <span className="text-xs font-bold text-slate-800 truncate block">{item.product_name}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">{item.product_quality}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Specifications</span>
              <div className="space-y-2">
                <div className="bg-slate-900 rounded-[1.25rem] p-3 flex items-center gap-3 text-white shadow-lg shadow-slate-900/10">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Truck size={16} /></div>
                  <div className="truncate">
                    <span className="text-[8px] font-black text-indigo-300 uppercase block tracking-widest leading-none mb-1">Asset Class</span>
                    <span className="text-xs font-black capitalize block truncate tracking-wide">{vehicleTypeLabel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-[1.25rem] p-3 border flex items-center justify-center gap-2 transition-all shadow-sm ${mission.is_refrigerated ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                    <Thermometer size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Fridge</span>
                  </div>
                  <div className={`rounded-[1.25rem] p-3 border flex items-center justify-center gap-2 transition-all shadow-sm ${mission.is_fragile ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                    <ShieldAlert size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Fragile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Action Bar */}
          {isAccepted && (
            <div className="bg-emerald-600 rounded-[1.5rem] p-3.5 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 border border-white/20 shadow-inner">{mission.farmer_name?.charAt(0)}</div>
                  <div className="truncate">
                    <span className="text-[8px] font-black text-emerald-100 uppercase block tracking-widest mb-0.5">Contracting Farmer</span>
                    <span className="text-sm font-black truncate block">{mission.farmer_name}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={`tel:${mission.farmer_phone}`} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all border border-white/20"><Phone size={14} /></a>
                  <a href={`https://wa.me/${mission.farmer_phone?.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white text-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"><MessageSquare size={14} /></a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Professional Action Footer */}
        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-50 transition-all shadow-sm">Close</button>
          {mission.status === 'open' && (
            <button 
              onClick={() => onAccept(mission)}
              disabled={!canAccept || actionLoading}
              className={`flex-[2.5] h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg flex items-center justify-center gap-2 transition-all ${!canAccept ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-600/20'}`}
            >
              {actionLoading ? 'Verifying...' : <><CheckCircle size={16} /> {hasActiveMission ? 'Limit Reached' : 'Accept Assignment'}</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default MissionDetailsModal;
