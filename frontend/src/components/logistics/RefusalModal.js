import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  ShieldAlert,
  ArrowRightCircle,
  Truck
} from 'lucide-react';

const REASONS = [
  'Quality issue (damaged goods)',
  'Wrong items delivered',
  'Packaging compromise',
  'Price/Weight discrepancy',
  'Recipient absent / unreachable',
  'Delivery delay exceeded',
  'Other (specify in notes)'
];

const RefusalModal = ({ isOpen, onClose, onConfirm, mission }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason) {
      setError('Please select a primary reason for refusal.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(mission.id, { reason, note });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process refusal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-white w-full max-w-xl animate-scale-in relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
               <ShieldAlert size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Refusal Protocol</h3>
               <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Disposition required for MIL-{mission?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 text-rose-800">
             <AlertTriangle size={20} className="shrink-0 mt-0.5" />
             <p className="text-[11px] font-medium leading-relaxed">
               Invoking refusal will move the order to <strong className="font-black">RETURN IN PROGRESS</strong>. You are legally responsible for returning the goods to the origin farmer.
             </p>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Select Primary Reason</label>
             <div className="grid grid-cols-1 gap-2">
                {REASONS.map(r => (
                  <button 
                    key={r}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${reason === r ? 'bg-rose-50 border-rose-600 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                    onClick={() => setReason(r)}
                  >
                    <span className={`text-[11px] font-bold ${reason === r ? 'text-rose-900' : 'text-slate-600'}`}>{r}</span>
                    {reason === r && <ArrowRightCircle size={14} className="text-rose-600" />}
                  </button>
                ))}
             </div>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Detailed Logs (Optional)</label>
             <div className="relative">
                <textarea 
                  className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-300"
                  placeholder="Provide additional details for the farmer and buyer..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <MessageSquare size={16} className="absolute right-4 bottom-4 text-slate-200" />
             </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-shake">
               {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
           <button 
             onClick={onClose}
             className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
           >
             Cancel
           </button>
           <button 
             className={`flex-[2] h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2 ${!reason || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'}`}
             disabled={!reason || isSubmitting}
             onClick={handleConfirm}
           >
             {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={18} />}
             Authorize Disposition
           </button>
        </div>

      </div>
    </div>
  );
};

export default RefusalModal;
