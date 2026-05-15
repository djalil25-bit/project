import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Truck, 
  Map, 
  Scale, 
  ShieldCheck,
  Edit2
} from 'lucide-react';

const TransportPricingManager = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const vehicleTypes = [
    { id: 'standard', name: 'Standard (Any)' },
    { id: 'truck', name: 'Truck' },
    { id: 'van', name: 'Van' },
    { id: 'refrigerated_truck', name: 'Refrigerated Truck' },
    { id: 'pickup', name: 'Pickup' },
    { id: 'utility', name: 'Utility Vehicle' },
  ];

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transport-pricing-rules/');
      setRules(res.data);
    } catch (err) {
      setError("Failed to synchronize with the pricing registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setEditForm({ ...rule });
  };

  const handleSave = async () => {
    try {
      if (editingId === 'new') {
        await api.post('/transport-pricing-rules/', editForm);
      } else {
        await api.patch(`/transport-pricing-rules/${editingId}/`, editForm);
      }
      setEditingId(null);
      setIsAdding(false);
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || "Validation protocol failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL: Deleting this rule will fallback to system defaults. Proceed?")) return;
    try {
      await api.delete(`/transport-pricing-rules/${id}/`);
      fetchRules();
    } catch (err) {
      setError("Deletion protocol rejected by server.");
    }
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({
      vehicle_type: 'truck',
      base_fee: 500,
      price_per_km: 15,
      weight_multiplier: 0.1,
      is_active: true
    });
    setIsAdding(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px] gap-3">
      <div className="spinner-agr w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Accessing Registry...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap size={18} fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Logistics Pricing Engine</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium">Configure automated tariff structures for the national transport network.</p>
        </div>
        <button 
          onClick={startNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> Initialize New Rule
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake">
          <AlertCircle size={20} />
          <span className="text-xs font-black uppercase tracking-tight">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600"><Plus size={16} className="rotate-45" /></button>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-sm ${editingId === rule.id ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200'}`}>
            
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner transition-colors ${rule.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Truck size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{rule.vehicle_type_display}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${rule.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {rule.is_active ? 'Active Protocol' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingId !== rule.id ? (
                    <>
                      <button onClick={() => handleEdit(rule)} className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all border border-slate-100"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(rule.id)} className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all border border-rose-100"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <button onClick={() => setEditingId(null)} className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><Plus size={18} className="rotate-45" /></button>
                  )}
                </div>
              </div>

              {editingId === rule.id ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Protocol (DZD)</label>
                      <input 
                        type="number"
                        value={editForm.base_fee}
                        onChange={(e) => setEditForm({...editForm, base_fee: e.target.value})}
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Distance Multiplier (DZD/KM)</label>
                      <input 
                        type="number"
                        value={editForm.price_per_km}
                        onChange={(e) => setEditForm({...editForm, price_per_km: e.target.value})}
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight Factor (DZD/UNIT)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={editForm.weight_multiplier}
                        onChange={(e) => setEditForm({...editForm, weight_multiplier: e.target.value})}
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">System Status</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditForm({...editForm, is_active: true})}
                          className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${editForm.is_active ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >Active</button>
                        <button 
                          onClick={() => setEditForm({...editForm, is_active: false})}
                          className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${!editForm.is_active ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >Suspended</button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSave}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <Save size={18} /> Update Pricing Protocol
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-inner border border-slate-100/50">
                    <ShieldCheck size={16} className="text-indigo-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Base</span>
                    <span className="text-sm font-black text-slate-900">{parseFloat(rule.base_fee).toLocaleString()} <small className="text-[9px] text-slate-500 font-bold">DZD</small></span>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-inner border border-slate-100/50">
                    <Map size={16} className="text-amber-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Per KM</span>
                    <span className="text-sm font-black text-slate-900">{parseFloat(rule.price_per_km).toLocaleString()} <small className="text-[9px] text-slate-500 font-bold">DZD</small></span>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-inner border border-slate-100/50">
                    <Scale size={16} className="text-emerald-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Weight</span>
                    <span className="text-sm font-black text-slate-900">{rule.weight_multiplier} <small className="text-[9px] text-slate-500 font-bold">X</small></span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Design Footnote */}
            <div className="bg-slate-50/50 px-8 py-3 flex justify-between items-center border-t border-slate-100/50">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol V3.2 Registry</span>
               <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[9px] uppercase tracking-widest">
                  <Zap size={10} fill="currentColor" /> Live Sync
               </div>
            </div>
          </div>
        ))}

        {/* Add Form (if empty or isAdding) */}
        {(rules.length === 0 || isAdding) && editingId === 'new' && (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-200 p-6 md:p-8 flex flex-col animate-fade-in shadow-2xl shadow-indigo-100">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Plus size={24} strokeWidth={3} /></div>
               <h3 className="text-lg font-black text-slate-900">New Pricing Protocol</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Class</label>
                  <select 
                    value={editForm.vehicle_type}
                    onChange={(e) => setEditForm({...editForm, vehicle_type: e.target.value})}
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none appearance-none"
                  >
                    {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Fee</label>
                    <input 
                      type="number"
                      value={editForm.base_fee}
                      onChange={(e) => setEditForm({...editForm, base_fee: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">KM Rate</label>
                    <input 
                      type="number"
                      value={editForm.price_per_km}
                      onChange={(e) => setEditForm({...editForm, price_per_km: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-black focus:ring-2 ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 mt-4"
                >
                  <CheckCircle size={18} /> Instantiate Protocol
                </button>
                <button 
                  onClick={() => { setEditingId(null); setIsAdding(false); }}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard Initialization
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportPricingManager;
