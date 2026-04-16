import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  X,
  AlertCircle,
  ShieldCheck,
  Fuel,
  Gauge,
  Activity,
  Edit2,
  Power,
  Package,
  Zap
} from 'lucide-react';

const VehicleSettings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ plate: '', model: '', capacity: '', type: 'Truck', fuelType: 'Diesel' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setVehicles(res.data.vehicles || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let updated;
    if (editingId) {
       updated = vehicles.map(v => v.id === editingId ? { ...v, ...formData } : v);
    } else {
       updated = [...vehicles, { ...formData, id: Date.now(), is_active: true }];
    }
    saveVehicles(updated);
  };

  const removeVehicle = (id) => {
    const updated = vehicles.filter(v => v.id !== id);
    saveVehicles(updated);
  };

  const toggleVehicleStatus = (id) => {
    const updated = vehicles.map(v => 
      v.id === id ? { ...v, is_active: v.is_active === false ? true : false } : v
    );
    saveVehicles(updated);
  };

  const startEdit = (v) => {
    setFormData({ plate: v.plate, model: v.model, capacity: v.capacity, type: v.type, fuelType: v.fuelType || 'Diesel' });
    setEditingId(v.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ plate: '', model: '', capacity: '', type: 'Truck', fuelType: 'Diesel' });
  };

  const saveVehicles = async (updatedList) => {
    try {
      await api.patch('/auth/profile/', { vehicles: updatedList });
      setVehicles(updatedList);
      closeForm();
    } catch (err) { alert('Failed to save fleet update.'); }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorcycle': return <Zap size={22} />;
      default: return <Truck size={22} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-10 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── BREADCRUMBS & HEADER ───────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full w-fit border border-indigo-100 shadow-sm">
            <Link to="/transporter-dashboard" className="hover:text-indigo-800 transition-colors">Logistics Hub</Link>
            <ChevronRight size={10} className="text-indigo-300" />
            <span className="text-indigo-900 font-black">Fleet Assets</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-600">
               <Truck size={40} strokeWidth={2.5} />
            </div>
            Managed Fleet
          </h1>
          <p className="text-slate-500 font-medium mt-3 leading-relaxed max-w-xl text-lg">
            Monitor asset availability and specialized technical specifications for the national logistics grid.
          </p>
        </div>
        {!showForm && (
           <button 
             className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-3 group"
             onClick={() => setShowForm(true)}
           >
             <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Register Asset
           </button>
        )}
      </div>

      {/* ── FLEET GRID (SQUARE ARCHITECTURE) ──────────────────────── */}
      <div className="w-full">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Registry...</span>
             </div>
        ) : vehicles.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center shadow-sm max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-slate-50 rounded-full shadow-inner flex items-center justify-center mb-6 text-slate-200">
              <Truck size={48} />
            </div>
            <h4 className="text-3xl font-black text-slate-800 mb-2">Registry Empty</h4>
            <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed text-sm">
              Your managed logistics footprint is currently unindexed. Engage assets to begin operations.
            </p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-900/10 active:scale-95"
              onClick={() => setShowForm(true)}
            >
              Initialize Fleet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {vehicles.map(v => (
              <div 
                key={v.id} 
                className={`group relative min-h-[200px] bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-200 flex flex-col overflow-hidden ${v.is_active === false ? 'grayscale opacity-60' : 'opacity-100'}`}
              >
                 {/* COMPACT HEADER: Type & Status */}
                 <div className="p-5 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${v.is_active === false ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {getVehicleIcon(v.type)}
                       </div>
                       <div className="text-left">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vehicle Node</div>
                          <span className="text-sm font-black text-slate-900 tracking-tight">{v.type} • {v.model}</span>
                       </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border flex items-center gap-1.5 ${v.is_active !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       <div className={`w-1 h-1 rounded-full ${v.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                       {v.is_active !== false ? 'Active' : 'Offline'}
                    </span>
                 </div>

                 {/* COMPACT SPECS: Plate & Capacity */}
                 <div className="p-5 flex-1 flex items-center justify-between bg-slate-50/30">
                    <div className="text-left space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Registry Plate</span>
                       <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">{v.plate}</span>
                    </div>
                    
                    <div className="text-right space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Load Capacity</span>
                       <div className="flex items-center gap-2 justify-end">
                          <Gauge size={14} className="text-indigo-500" />
                          <span className="text-xl font-black text-indigo-600 font-mono tracking-tighter">
                             {parseFloat(v.capacity) >= 1000 ? `${(parseFloat(v.capacity)/1000).toFixed(1)}T` : `${v.capacity}KG`}
                          </span>
                       </div>
                    </div>
                 </div>

                 {/* COMPACT ACTIONS: Bottom Strip */}
                 <div className="bg-slate-900 px-5 py-2.5 flex items-center justify-between border-t border-slate-800">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                       SECURE REGISTRY: {v.id.toString().slice(-6).toUpperCase()}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                       <button 
                         className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                         onClick={(e) => { e.stopPropagation(); startEdit(v); }}
                         title="Modify"
                       >
                         <Edit2 size={14} />
                       </button>
                       <button 
                         className={`p-2 transition-all rounded-lg ${v.is_active === false ? 'text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'text-amber-500 hover:bg-amber-600 hover:text-white'}`}
                         onClick={(e) => { e.stopPropagation(); toggleVehicleStatus(v.id); }}
                         title={v.is_active === false ? "Activate" : "Deactivate"}
                       >
                         <Power size={14} />
                       </button>
                       <button 
                         className="p-2 text-slate-500 hover:text-white hover:bg-rose-600 rounded-lg transition-all"
                         onClick={(e) => { e.stopPropagation(); removeVehicle(v.id); }}
                         title="Delete"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REGISTRY MODAL PORTAL ──────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
           <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border-4 border-white w-full max-w-xl animate-scale-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />
              <button className="absolute top-8 right-8 w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90" onClick={closeForm}>
                <X size={24} />
              </button>
              
              <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 mx-auto mb-6">
                   {editingId ? <Edit2 size={24} /> : <Plus size={24} strokeWidth={3} />}
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {editingId ? 'Modify Configuration' : 'Asset Registration'}
                </h3>
                <p className="text-slate-500 font-medium text-sm mt-2">Update technical parameters for this logistics node.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Category</label>
                  <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Truck</option>
                    <option>Van</option>
                    <option>Pickup</option>
                    <option>Motorcycle</option>
                    <option>Cooled Container</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Propulsion Tier</label>
                  <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})}>
                    <option>Diesel</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                    <option>Hydrogen</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registry Plate</label>
                  <input type="text" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all uppercase"
                    placeholder="PLATE-001" required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Model Designation</label>
                  <input type="text" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    placeholder="Isuzu Forward" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payload Max (KG)</label>
                  <input type="number" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    placeholder="5000" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>

                <div className="col-span-full mt-6 flex gap-4">
                  <button type="button" onClick={closeForm} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 h-16 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-16 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
                    <Save size={18} /> {editingId ? 'Modify Index' : 'Register Asset'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSettings;
