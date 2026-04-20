import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap,
  Power
} from 'lucide-react';
import api from '../../api/axiosConfig';

const VehicleSelectionModal = ({ isOpen, onClose, onAccept, mission }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFleet();
      setSelectedId(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile/');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error(err);
      setError('System Error: Unable to synchronize fleet registry.');
    } finally {
      setLoading(false);
    }
  };

  const totalPayload = parseFloat(mission?.total_quantity || 0);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAccept(mission.id, selectedId);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Authorization Link Failure';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorcycle': return <Zap size={20} />;
      default: return <Truck size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-white w-full max-w-2xl animate-scale-in relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Decor */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl -mr-10 -mt-10" />
        
        {/* Modal Header */}
        <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Mission Authorization</h3>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Asset verification required</p>
            </div>
          </div>
          <button 
            className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full flex items-center justify-center transition-all shadow-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 py-4 overflow-y-auto hide-scrollbar flex-1 relative z-10">
          
          {/* Mission Context */}
          <div className="bg-slate-900 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-slate-900/10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Target Payload</span>
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                      <Package size={18} />
                   </div>
                   <span className="text-2xl font-black font-mono">{totalPayload.toLocaleString()} <small className="text-xs text-indigo-400 opacity-60">UNIT</small></span>
                </div>
              </div>
              <div className="border-l border-slate-800 pl-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Ref ID</span>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-black text-indigo-400">MIL-{mission?.id?.toString().padStart(4, '0')}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                 <MapPin size={12} className="text-emerald-500" />
                 <span className="truncate max-w-[120px] font-bold">{mission?.pickup_location || 'Farm Node'}</span>
              </div>
              <ChevronRight size={10} className="text-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-400">
                 <Navigation size={12} className="text-indigo-400" />
                 <span className="truncate max-w-[120px] font-bold">{mission?.delivery_location || 'Final Hub'}</span>
              </div>
            </div>
          </div>

          {/* Fleet Selection */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Choose Compliant Asset</h4>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scanning Registry...</span>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                 <Truck size={32} className="text-slate-300 mb-3" />
                 <p className="text-xs font-bold text-slate-500">No assets registered in your fleet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => {
                  const capacity = parseFloat(v.capacity || 0);
                  const isSufficient = capacity >= totalPayload;
                  const isActive = v.is_active !== false;
                  const isEligible = isSufficient && isActive;

                  return (
                    <div 
                      key={v.id}
                      className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${!isEligible ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50 border-slate-100' : selectedId === v.id ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-300 cursor-pointer'}`}
                      onClick={() => isEligible && setSelectedId(v.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all ${selectedId === v.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                           {getVehicleIcon(v.type)}
                        </div>
                        <div className="text-left">
                           <div className="text-sm font-black text-slate-900 tracking-tight">{v.model} <span className="text-xs font-mono text-slate-400">[{v.plate}]</span></div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded ${isSufficient ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                 Cap: {capacity >= 1000 ? `${(capacity/1000).toFixed(1)}T` : `${v.capacity}KG`}
                              </span>
                              {!isActive && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><Power size={8} /> Offline</span>}
                           </div>
                        </div>
                      </div>

                      {isEligible ? (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === v.id ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                           {selectedId === v.id && <CheckCircle size={14} className="text-white" />}
                        </div>
                      ) : (
                        <div className="p-2 text-rose-500" title={!isSufficient ? "Capacity Violation" : "Node Offline"}>
                           <AlertTriangle size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-fade-in">
               <AlertTriangle size={18} />
               <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 relative z-10">
          <button 
            className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            onClick={onClose}
          >
            Abort Protocol
          </button>
          <button 
            className={`flex-[2] h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${!selectedId || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95'}`}
            disabled={!selectedId || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            Authorize Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectionModal;
