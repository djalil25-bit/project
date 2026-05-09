import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Truck, Plus, Edit2, Trash2, Power, Upload, Save, X,
  ChevronRight, Clock, AlertCircle, Zap, Gauge, FileText,
  ChevronDown
} from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

const VehicleSettings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ plate: '', model: '', capacity: '', type: 'truck', fuelType: 'Diesel' });
  const [carteGriseFile, setCarteGriseFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchVehicles(); }, []);

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
    if (carteGriseFile) data.append('carte_grise', carteGriseFile);
    try {
      if (editingId) {
        await api.patch(`/vehicles/${editingId}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/vehicles/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      fetchVehicles(); closeForm();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save vehicle.');
    }
  };

  const removeVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle from your fleet?')) return;
    try { await api.delete(`/vehicles/${id}/`); fetchVehicles(); }
    catch (err) { alert('Failed to remove vehicle.'); }
  };

  const toggleVehicleStatus = async (id, currentActive) => {
    try { await api.patch(`/vehicles/${id}/`, { is_active: !currentActive }); fetchVehicles(); }
    catch (err) { alert('Failed to toggle status.'); }
  };

  const startEdit = (v) => {
    setFormData({ plate: v.plate, model: v.model, capacity: v.capacity, type: v.type, fuelType: v.fuelType || 'Diesel' });
    setCarteGriseFile(null); setEditingId(v.id); setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false); setEditingId(null);
    setFormData({ plate: '', model: '', capacity: '', type: 'truck', fuelType: 'Diesel' });
    setCarteGriseFile(null);
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'refrigerated_truck': return <Zap size={18} />;
      default: return <Truck size={18} />;
    }
  };

  const statusConfig = {
    ACTIVE:   { bar: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Active' },
    PENDING:  { bar: 'bg-amber-400',   dot: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending' },
    REJECTED: { bar: 'bg-red-500',     dot: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Rejected' },
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 bg-indigo-50 px-3 py-1.5 rounded-full w-fit border border-indigo-100">
            <Link to="/transporter-dashboard" className="hover:text-indigo-800 transition-colors">Logistics Hub</Link>
            <ChevronRight size={10} />
            <span className="text-indigo-900">Fleet Assets</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Truck size={20} strokeWidth={2.5} />
            </div>
            Managed Fleet
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2">
            {vehicles.length > 0 ? `${vehicles.length} asset${vehicles.length > 1 ? 's' : ''} registered in registry` : 'Monitor asset availability across the national logistics grid.'}
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 active:scale-95 flex items-center gap-3"
          >
            <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </div>
            Register New Asset
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          </button>
        )}
      </div>

      {/* FLEET LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Registry...</span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
              <Truck size={32} />
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-1">Registry Empty</h4>
            <p className="text-slate-400 font-medium mb-6 max-w-xs text-sm">No vehicles found. Register your first asset to begin operations.</p>
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2">
              <Plus size={14} /> Initialize Fleet
            </button>
          </div>
        ) : (
          vehicles.map(v => {
            const sc = statusConfig[v.status] || statusConfig.PENDING;
            return (
              <div key={v.id} className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col md:flex-row relative">
                
                {/* Left Side: Image */}
                <div className="md:w-1/3 xl:w-1/4 h-48 md:h-auto shrink-0">
                  <img 
                    src={v.type === 'van' 
                      ? "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80" 
                      : "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"}
                    alt={v.model} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right Side: Content & Info */}
                <div className="flex-1 p-5 md:p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                        {VEHICLE_TYPES.find(vt => vt.id === v.type)?.name || v.type}
                        <span className="text-slate-400 font-medium text-base ml-2 tracking-normal">{v.model}</span>
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-widest shadow-sm">
                          {v.plate}
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sc.bg} ${sc.text} ${sc.border} flex items-center gap-1.5 shadow-sm`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${v.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                          {v.status === 'ACTIVE' && v.is_active === false ? 'Offline' : sc.label}
                        </div>
                      </div>
                    </div>

                    {v.carte_grise && (
                      <a href={v.carte_grise.startsWith('http') ? v.carte_grise : `http://localhost:8000${v.carte_grise}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shrink-0" title="View Carte Grise">
                        <FileText size={18} />
                      </a>
                    )}
                  </div>

                  {/* Status Alerts */}
                  {v.status === 'REJECTED' && (
                    <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 font-bold">{v.rejection_reason || 'Registration rejected.'}</p>
                    </div>
                  )}
                  {v.status === 'PENDING' && (
                    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700 font-bold">Awaiting administrative approval. Mission acceptance disabled.</p>
                    </div>
                  )}

                  {/* Properties Grid (Only Real Data) */}
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl px-4 py-2.5 min-w-[120px] flex-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Fuel Type</div>
                      <div className="text-sm font-black text-slate-800">{v.fuelType || 'Diesel'}</div>
                    </div>
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl px-4 py-2.5 min-w-[120px] flex-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Max Capacity</div>
                      <div className="text-sm font-black text-slate-800">{parseFloat(v.capacity) >= 1000 ? `${(parseFloat(v.capacity)/1000).toFixed(1)} tons` : `${v.capacity} kg`}</div>
                    </div>
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl px-4 py-2.5 min-w-[120px] flex-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Registry ID</div>
                      <div className="text-sm font-black text-slate-800 font-mono">REG-{v.id.toString().padStart(4, '0')}</div>
                    </div>
                  </div>

                  {/* Explicit Action Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    {v.status === 'REJECTED' && (
                      <button onClick={(e) => { e.stopPropagation(); startEdit(v); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm" title="Edit Asset">
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                    {v.status === 'ACTIVE' && (
                      <button onClick={(e) => { e.stopPropagation(); toggleVehicleStatus(v.id, v.is_active); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm" title={v.is_active === false ? "Activate" : "Deactivate"}>
                        <Power size={12} /> {v.is_active === false ? "Activate" : "Deactivate"}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeVehicle(v.id); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm" title="Delete Asset">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL */}
      {showForm && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[90vh] border border-slate-200/60">
            {/* Modal header stripe */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 md:px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-inner">
                  {editingId ? <Edit2 size={20} /> : <Plus size={20} strokeWidth={3} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {editingId ? 'Modify Fleet Asset' : 'Register New Asset'}
                  </h3>
                  <p className="text-indigo-200 text-xs font-medium mt-0.5">
                    {editingId ? 'Update and resubmit for administrative review' : 'Initialize a new vehicle for logistics deployment'}
                  </p>
                </div>
              </div>
              <button onClick={closeForm} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-white/10">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* LEFT COLUMN */}
                  <div className="space-y-6">
                    {/* Asset Category */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Category</label>
                      <div className="relative group">
                        <select
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer group-hover:border-slate-300"
                          value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                          {VEHICLE_TYPES.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:text-slate-600" />
                      </div>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Model Designation</label>
                      <input
                        type="text"
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all hover:border-slate-300 placeholder:text-slate-300 placeholder:font-medium"
                        placeholder="e.g. Isuzu Forward" required value={formData.model}
                        onChange={e => setFormData({...formData, model: e.target.value})}
                      />
                    </div>

                    {/* Plate */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registry Plate</label>
                      <input
                        type="text"
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all hover:border-slate-300 uppercase text-sm placeholder:text-slate-300 placeholder:font-sans placeholder:font-medium"
                        placeholder="PLATE-001" required value={formData.plate}
                        onChange={e => setFormData({...formData, plate: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-6">
                    {/* Fuel */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Propulsion Tier (Fuel)</label>
                      <div className="relative group">
                        <select
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer group-hover:border-slate-300"
                          value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})}
                        >
                          <option>Diesel</option>
                          <option>Electric</option>
                          <option>Hybrid</option>
                          <option>Hydrogen</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:text-slate-600" />
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payload Capacity (KG)</label>
                      <input
                        type="number"
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-mono font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all hover:border-slate-300 text-sm placeholder:text-slate-300 placeholder:font-sans placeholder:font-medium"
                        placeholder="5000" required value={formData.capacity}
                        onChange={e => setFormData({...formData, capacity: e.target.value})}
                      />
                    </div>
                    
                    {/* Carte Grise Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Documentation</label>
                        {carteGriseFile && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">File Selected</span>}
                      </div>
                      <input type="file" accept="image/*,.pdf" onChange={e => setCarteGriseFile(e.target.files[0])} className="hidden" id="carte-grise-input" />
                      <label htmlFor="carte-grise-input" className={`w-full h-12 border-2 border-dashed rounded-xl px-4 flex items-center gap-3 text-sm cursor-pointer transition-all ${carteGriseFile ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-inner' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${carteGriseFile ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Upload size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-bold text-slate-800 text-xs">
                            {carteGriseFile ? carteGriseFile.name : 'Upload Carte Grise'}
                          </span>
                          <span className="text-[10px] font-medium opacity-70">
                            {carteGriseFile ? `${(carteGriseFile.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG or PDF (max 5MB)'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="p-6 md:px-8 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
                <button type="button" onClick={closeForm} className="w-full md:w-auto px-8 h-12 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm">
                  Cancel
                </button>
                <button type="submit" className="w-full md:w-auto px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <Save size={16} strokeWidth={2.5} /> {editingId ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VehicleSettings;
