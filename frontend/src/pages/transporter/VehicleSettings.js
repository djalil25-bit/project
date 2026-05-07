import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  Upload, 
  Save, 
  X, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Zap,
  Gauge,
  FileText
} from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

const VehicleSettings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ plate: '', model: '', capacity: '', type: 'truck', fuelType: 'Diesel' });
  const [carteGriseFile, setCarteGriseFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles/');
      setVehicles(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('plate', formData.plate);
    data.append('model', formData.model);
    data.append('capacity', formData.capacity);
    data.append('type', formData.type);
    data.append('fuelType', formData.fuelType);
    if (carteGriseFile) {
      data.append('carte_grise', carteGriseFile);
    }

    try {
      if (editingId) {
        await api.patch(`/vehicles/${editingId}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/vehicles/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchVehicles();
      closeForm();
    } catch (err) { 
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save vehicle.';
      alert(errMsg); 
    }
  };

  const removeVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle from your fleet?')) return;
    try {
      await api.delete(`/vehicles/${id}/`);
      fetchVehicles();
    } catch (err) { alert('Failed to remove vehicle.'); }
  };

  const toggleVehicleStatus = async (id, currentActive) => {
    try {
      await api.patch(`/vehicles/${id}/`, { is_active: !currentActive });
      fetchVehicles();
    } catch (err) { alert('Failed to toggle status.'); }
  };

  const startEdit = (v) => {
    setFormData({ plate: v.plate, model: v.model, capacity: v.capacity, type: v.type, fuelType: v.fuelType || 'Diesel' });
    setCarteGriseFile(null);
    setEditingId(v.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ plate: '', model: '', capacity: '', type: 'truck', fuelType: 'Diesel' });
    setCarteGriseFile(null);
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'refrigerated_truck': return <Zap size={22} />;
      default: return <Truck size={22} />;
    }
  };

  const getStatusBadge = (v) => {
    if (v.status === 'ACTIVE') {
      return (
        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-100">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          {v.is_active !== false ? 'Active' : 'Offline'}
        </span>
      );
    } else if (v.status === 'PENDING') {
      return (
        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border flex items-center gap-1.5 bg-amber-50 text-amber-600 border-amber-100 animate-pulse">
          <Clock size={8} />
          Pending
        </span>
      );
    } else {
      return (
        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border flex items-center gap-1.5 bg-red-50 text-red-600 border-red-100">
          <AlertCircle size={8} />
          Rejected
        </span>
      );
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
                className={`group relative min-h-[200px] bg-white rounded-[2rem] border-2 shadow-sm transition-all duration-300 hover:shadow-xl flex flex-col overflow-hidden ${
                  v.status === 'REJECTED' ? 'border-red-200 hover:border-red-300' :
                  v.status === 'PENDING' ? 'border-amber-200 hover:border-amber-300' :
                  v.is_active === false ? 'border-slate-100 grayscale opacity-60' :
                  'border-slate-100 hover:border-indigo-200'
                }`}
              >
                 {/* COMPACT HEADER: Type & Status */}
                 <div className="p-5 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                         v.status === 'REJECTED' ? 'bg-red-50 text-red-500 border-red-100' :
                         v.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         v.is_active === false ? 'bg-slate-50 text-slate-300 border-slate-100' :
                         'bg-indigo-50 text-indigo-600 border-indigo-100'
                       }`}>
                          {getVehicleIcon(v.type)}
                       </div>
                       <div className="text-left">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vehicle Node</div>
                          <span className="text-sm font-black text-slate-900 tracking-tight">
                            {VEHICLE_TYPES.find(vt => vt.id === v.type)?.name || v.type} • {v.model}
                          </span>
                       </div>
                    </div>
                    {getStatusBadge(v)}
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

                 {/* Carte Grise indicator */}
                 {v.carte_grise && (
                   <div className="px-5 pb-2">
                     <a href={v.carte_grise.startsWith('http') ? v.carte_grise : `http://localhost:8000${v.carte_grise}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold hover:underline">
                       <FileText size={11} /> Carte Grise Uploaded
                     </a>
                   </div>
                 )}

                 {/* Rejection Reason Banner */}
                 {v.status === 'REJECTED' && v.rejection_reason && (
                   <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                     <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                     <div>
                       <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Rejection Reason</span>
                       <p className="text-[11px] text-red-700 font-medium mt-0.5">{v.rejection_reason}</p>
                       <p className="text-[9px] text-red-500 font-bold mt-1 italic">Edit this vehicle to resubmit for approval.</p>
                     </div>
                   </div>
                 )}

                 {/* Pending Banner */}
                 {v.status === 'PENDING' && (
                   <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                     <Clock size={12} className="text-amber-500 mt-0.5 shrink-0" />
                     <div>
                       <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Awaiting Admin Approval</span>
                       <p className="text-[10px] text-amber-700 font-medium mt-0.5">You cannot accept missions until this vehicle is approved.</p>
                     </div>
                   </div>
                 )}

                 {/* COMPACT ACTIONS: Bottom Strip */}
                 <div className="bg-slate-900 px-5 py-2.5 flex items-center justify-between border-t border-slate-800 mt-auto">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                       SECURE REGISTRY: {v.id.toString().slice(-6).toUpperCase()}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                       <button 
                         className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                         onClick={(e) => { e.stopPropagation(); startEdit(v); }}
                         title={v.status === 'REJECTED' ? 'Edit & Resubmit' : 'Modify'}
                       >
                         <Edit2 size={14} />
                       </button>
                       {v.status === 'ACTIVE' && (
                         <button 
                           className={`p-2 transition-all rounded-lg ${v.is_active === false ? 'text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'text-amber-500 hover:bg-amber-600 hover:text-white'}`}
                           onClick={(e) => { e.stopPropagation(); toggleVehicleStatus(v.id, v.is_active); }}
                           title={v.is_active === false ? "Activate" : "Deactivate"}
                         >
                           <Power size={14} />
                         </button>
                       )}
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
           <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border-4 border-white w-full max-w-xl animate-scale-in relative overflow-hidden max-h-[90vh] overflow-y-auto">
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
                <p className="text-slate-500 font-medium text-sm mt-2">
                  {editingId ? 'Update technical parameters. Rejected vehicles will be resubmitted for review.' : 'Register a new vehicle for approval.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Category</label>
                  <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    {VEHICLE_TYPES.map(vt => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
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

                {/* Carte Grise Upload */}
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Carte Grise (Vehicle Registration)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={e => setCarteGriseFile(e.target.files[0])}
                      className="hidden"
                      id="carte-grise-input"
                    />
                    <label htmlFor="carte-grise-input" className="w-full h-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-6 flex items-center gap-3 text-sm font-medium text-slate-500 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                      <Upload size={18} className="text-indigo-500" />
                      {carteGriseFile ? (
                        <span className="text-indigo-700 font-bold truncate">{carteGriseFile.name}</span>
                      ) : (
                        <span>Upload Carte Grise (JPG, PNG, PDF)</span>
                      )}
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium ml-1">Required for vehicle verification. Max 5MB.</p>
                </div>

                <div className="col-span-full mt-6 flex gap-4">
                  <button type="button" onClick={closeForm} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 h-16 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-16 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
                    <Save size={18} /> {editingId ? 'Modify & Resubmit' : 'Register Asset'}
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
