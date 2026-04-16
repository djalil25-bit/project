import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Map, 
  Plus, 
  X, 
  ChevronRight, 
  Globe,
  Navigation,
  CheckCircle,
  AlertCircle,
  Search,
  Activity,
  Zap,
  Radio,
  GanttChartSquare,
  ShieldCheck
} from 'lucide-react';

const ZoneSettings = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setZones(res.data.service_zones || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addZone = async (e) => {
    e.preventDefault();
    if (!newZone.trim()) return;
    const updated = [...new Set([...zones, newZone.trim()])];
    saveZones(updated);
  };

  const removeZone = (zoneName) => {
    const updated = zones.filter(z => z !== zoneName);
    saveZones(updated);
  };

  const saveZones = async (updatedList) => {
    try {
      await api.patch('/auth/profile/', { service_zones: updatedList });
      setZones(updatedList);
      setNewZone('');
    } catch (err) { alert('Failed to save service registry zones.'); }
  };

  const COMMON_ZONES = ['Algiers', 'Oran', 'Constantine', 'Setif', 'Annaba', 'Blida', 'Batna', 'Chlef', 'Djelfa'];

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-10 animate-fade-in bg-slate-50/30 min-h-screen">
      
      {/* ── BREADCRUMBS & LOGISTICS HEADER ───────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full w-fit border border-indigo-100 shadow-sm">
            <Link to="/transporter-dashboard" className="hover:text-indigo-800 transition-colors">Logistics Hub</Link>
            <ChevronRight size={10} className="text-indigo-300" />
            <span className="text-indigo-900 font-black">Coverage Topology</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-600">
               <Navigation size={40} strokeWidth={2.5} />
            </div>
            Service Grid
          </h1>
          <p className="text-slate-500 font-medium mt-3 leading-relaxed max-w-xl text-lg">
            Strategize and manage your operational footprint across the national logistics grid.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT: Interactive Topology Grid */}
        <div className="flex-1 w-full space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
              <div className="bg-slate-900 p-8 border-b border-slate-800 flex items-center justify-between relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                 <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-lg">
                       <Radio size={24} className="animate-pulse" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-white uppercase tracking-widest">Active Footprint Index</h3>
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{zones.length} Online Nodes</div>
                    </div>
                 </div>
                 <Activity size={32} className="text-indigo-500/30" />
              </div>

              <div className="p-10 min-h-[400px]">
                 {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Grid Topology...</span>
                    </div>
                 ) : zones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                          <Globe size={40} />
                       </div>
                       <h4 className="text-xl font-black text-slate-800 mb-2">Operational Shadow</h4>
                       <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed">
                          Zero operational hubs detected. Initialize your service area to join the logistics grid.
                       </p>
                    </div>
                 ) : (
                    <div className="flex flex-wrap gap-3">
                       {zones.map(z => (
                          <div key={z} className="group bg-indigo-50 border border-indigo-100 pl-5 pr-3 py-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-indigo-600 hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 animate-scale-in">
                             <MapPin size={14} className="text-indigo-600 group-hover:text-white" />
                             <span className="text-sm font-black text-indigo-900 tracking-tight group-hover:text-white">{z}</span>
                             <button 
                               onClick={() => removeZone(z)}
                               className="w-8 h-8 rounded-xl bg-white/50 text-indigo-400 group-hover:bg-indigo-700 group-hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                               title="Decommit Node"
                             >
                                <X size={14} strokeWidth={3} />
                             </button>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* Surgical Node Registry Form */}
                 <div className="mt-16 pt-10 border-t border-slate-50">
                    <form onSubmit={addZone} className="max-w-md">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block flex items-center gap-2">
                          <GanttChartSquare size={14} className="text-indigo-600"/> Append New Territory Node
                       </label>
                       <div className="flex gap-3">
                          <div className="relative flex-1">
                             <input 
                               type="text" className="w-full h-16 bg-slate-50 border-2 border-slate-50 rounded-2xl px-14 text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner uppercase tracking-widest" 
                               placeholder="Enter sector ID..." 
                               value={newZone} onChange={e => setNewZone(e.target.value)} 
                             />
                             <MapPin size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                          </div>
                          <button type="submit" className="w-16 h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center group">
                             <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                          </button>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: Regional Hub Hub Catalog */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Map size={24} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Hub Registry</h3>
              </div>
              
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                 Engage these major logistics hubs to immediately expand your delivery footprint.
              </p>

              <div className="flex flex-wrap gap-2">
                 {COMMON_ZONES.filter(z => !zones.includes(z)).map(z => (
                   <button 
                     key={z} 
                     className="bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 group"
                     onClick={() => {
                       const updated = [...new Set([...zones, z])];
                       saveZones(updated);
                     }}
                   >
                     <Zap size={10} className="text-amber-500" /> {z}
                   </button>
                 ))}
              </div>

              {COMMON_ZONES.filter(z => !zones.includes(z)).length === 0 && (
                 <div className="mt-8 bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 animate-fade-in shadow-inner">
                    <CheckCircle size={24} className="text-emerald-500 shrink-0" />
                    <div>
                       <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Topology Satisfied</div>
                       <div className="text-[10px] font-medium text-emerald-600">All major hubs are indexed.</div>
                    </div>
                 </div>
              )}

              <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                 <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-indigo-600 shrink-0" />
                    <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide leading-relaxed">
                       Registry nodes are publically visible for buyer route optimization calculation.
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ZoneSettings;
