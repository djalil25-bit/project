import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  ArrowRight,
  Route,
  Zap
} from 'lucide-react';

import { VEHICLE_TYPES } from '../../utils/constants';
import MissionRouteMap from '../maps/MissionRouteMap';

const MissionDetailsModal = ({ mission, onClose, onAccept, hasActiveMission, actionLoading, compatibility }) => {
  useEffect(() => {
    // Disable background scrolling when modal is open
    // We check if mission exists to only lock scroll when modal is actually displaying
    if (mission) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [mission]);

  if (!mission) return null;

  const orderDetail = mission.order_detail || {};
  const items = orderDetail.items || [];
  
  const fee = mission.estimated_fee ? `${parseFloat(mission.estimated_fee).toLocaleString()} DZD` : 'N/A';
  const totalQuantity = items.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
  const calculatedTotalValue = items.reduce((acc, item) => acc + (parseFloat(item.price || item.price_snapshot || item.unit_price || 0) * parseFloat(item.quantity || 0)), 0);
  const totalOrderValue = orderDetail.total_price || orderDetail.farmer_total || calculatedTotalValue || 0;
  
  const vehicleTypeLabel = VEHICLE_TYPES.find(vt => vt.id === mission.required_vehicle_type)?.name || 'Standard Truck';

  const isAccepted = mission.status !== 'open';
  const isCompatible = compatibility?.compatible !== false;
  const canAccept = mission.status === 'open' && !hasActiveMission && isCompatible;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/50 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-200/60">
        
        {/* Ministry-Grade Header */}
        <div className="bg-[#10B981] text-white px-8 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20">
              <Truck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight leading-tight text-white uppercase">Mission Manifest</h2>
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-white/70 leading-none mt-1 opacity-90">Registry ID: MIL-{mission.id.toString().padStart(4, '0')}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center justify-center border border-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Optimized Manifest Content */}
        <div className="p-3 md:p-4 space-y-3 overflow-y-auto custom-scrollbar">
          
          {/* Logistics & Yield Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 bg-slate-50 rounded-[1.25rem] p-4 border border-slate-100 flex flex-col justify-center gap-0 shadow-sm relative min-h-[120px]">
               <div className="flex items-start gap-3 relative z-10 pb-4">
                 <div className="absolute top-6 left-[0.875rem] bottom-0 w-px bg-slate-200 border-dashed border-l z-0" />
                 <div className="w-7 h-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#10B981]/10 relative z-10"><MapPin size={14} /></div>
                 <div className="truncate pt-0.5">
                   <span className="text-[7px] font-black text-[#10B981] uppercase block tracking-widest leading-none mb-1">Origin Node</span>
                   <span className="text-[11px] font-black text-slate-800 truncate block uppercase tracking-tight">{mission.pickup_wilaya} <span className="font-medium text-slate-400 text-[9px]">— {mission.pickup_location}</span></span>
                 </div>
               </div>
               <div className="flex items-start gap-3 relative z-10 pt-1">
                 <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 border border-slate-800 relative z-10"><Navigation size={14} /></div>
                 <div className="truncate pt-0.5">
                   <span className="text-[7px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">Destination Node</span>
                   <span className="text-[11px] font-black text-slate-800 truncate block uppercase tracking-tight">{orderDetail.wilaya} <span className="font-medium text-slate-400 text-[9px]">— {orderDetail.delivery_address}</span></span>
                 </div>
               </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-[1.25rem] p-4 flex flex-col justify-center gap-2 shadow-xl shadow-slate-900/20 text-white relative overflow-hidden min-h-[120px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <div className="w-6 h-6 rounded-lg bg-[#10B981] flex items-center justify-center text-white shadow-lg shadow-[#10B981]/10"><Zap size={12} fill="currentColor" /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Institutional Pricing</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5 my-1 relative z-10">
                <div>
                  <span className="text-[7px] font-black text-slate-500 uppercase block tracking-widest mb-1">Road Distance</span>
                  <span className="text-[10px] font-black text-white">{mission.estimated_distance_km || '0'} <small className="text-[8px] text-slate-500 uppercase">KM</small></span>
                </div>
                <div>
                  <span className="text-[7px] font-black text-slate-500 uppercase block tracking-widest mb-1">Est. Duration</span>
                  <span className="text-[10px] font-black text-white uppercase">{mission.estimated_duration || 'N/A'}</span>
                </div>
              </div>
 
              <div className="relative z-10 p-2.5 bg-[#10B981] rounded-xl text-white shadow-lg shadow-[#10B981]/20 group overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-80">Assignment Fee</div>
                <div className="text-xl font-black tracking-tight">{fee}</div>
              </div>
              <div className="mt-1 text-[7px] font-black text-slate-500 uppercase tracking-widest text-center relative z-10">Verified Engine</div>
            </div>

          </div>

          {/* Mission Route Map */}
          {(mission.pickup_latitude && mission.delivery_latitude) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Route size={12} className="text-[#10B981]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mission Logistics Topology</span>
              </div>
              <MissionRouteMap
                pickupCoords={[mission.pickup_latitude, mission.pickup_longitude]}
                destinationCoords={[mission.delivery_latitude, mission.delivery_longitude]}
                pickupLabel={mission.pickup_wilaya || mission.pickup_location}
                destinationLabel={orderDetail.wilaya || orderDetail.delivery_address}
                height="220px"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Payload Inventory</span>
                <span className="text-[8px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">{totalQuantity.toLocaleString()} Units</span>
              </div>
              <div className="bg-white rounded-[1rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="max-h-[100px] overflow-y-auto custom-scrollbar">
                  {items.map((item, idx) => (
                    <div key={idx} className="px-3 py-1.5 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="truncate pr-3">
                        <span className="text-[10px] font-bold text-slate-800 truncate block">{item.product_name}</span>
                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                      </div>
                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 shrink-0">{item.product_quality}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2">Specifications</span>
              <div className="space-y-1.5">
                <div className="bg-slate-900 rounded-[1rem] p-3 flex items-center gap-3 text-white shadow-xl shadow-slate-900/20 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shadow-inner"><Truck size={16} /></div>
                  <div className="truncate">
                    <span className="text-[7px] font-black text-slate-500 uppercase block tracking-widest leading-none mb-1">Asset Classification</span>
                    <span className="text-[11px] font-black uppercase block truncate tracking-wide">{vehicleTypeLabel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-[1rem] p-2.5 border flex items-center justify-center gap-2 transition-all shadow-sm ${mission.is_refrigerated ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                    <Thermometer size={12} /> <span className="text-[8px] font-black uppercase tracking-widest">Fridge</span>
                  </div>
                  <div className={`rounded-[1rem] p-2.5 border flex items-center justify-center gap-2 transition-all shadow-sm ${mission.is_fragile ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                    <ShieldAlert size={12} /> <span className="text-[8px] font-black uppercase tracking-widest">Fragile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Action Bar */}
          {isAccepted && (
            <div className="bg-emerald-600 rounded-[1.25rem] p-3 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-base font-black shrink-0 border border-white/20 shadow-inner">{mission.farmer_name?.charAt(0)}</div>
                  <div className="truncate">
                    <span className="text-[7px] font-black text-emerald-100 uppercase block tracking-widest mb-0.5">Contracting Farmer</span>
                    <span className="text-[11px] font-black truncate block">{mission.farmer_name}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={`tel:${mission.farmer_phone}`} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all border border-white/20"><Phone size={12} /></a>
                  <a href={`https://wa.me/${mission.farmer_phone?.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white text-emerald-600 rounded-lg flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95"><MessageSquare size={12} /></a>
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
              className={`flex-[2.5] h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-lg flex items-center justify-center gap-3 transition-all ${!canAccept ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-[#10B981] hover:bg-[#059669] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[#10B981]/25'}`}
            >
              {actionLoading ? 'Verifying Credentials...' : (
                <>
                  <CheckCircle size={18} /> 
                  {hasActiveMission ? 'Asset Busy' : !isCompatible ? (compatibility?.reason || 'Incompatible Asset') : 'Authorize & Accept Mission'}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default MissionDetailsModal;
