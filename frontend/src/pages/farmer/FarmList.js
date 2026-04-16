import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Tractor, Edit3, Trash2, MapPin, Maximize2, ExternalLink, ChevronRight, Sprout, ImageOff } from 'lucide-react';

export default function FarmList() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFarms = async () => {
    try {
      const res = await api.get('/farms/');
      setFarms(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFarms(); }, []);

  const deleteFarm = async (id) => {
    if (!window.confirm('Delete this farm? All localized data will be permanently purged. Proceed?')) return;
    try {
      await api.delete(`/farms/${id}/`);
      fetchFarms();
    } catch { alert('Failed to detach farm node'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Topography...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative z-0">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#22543d] mb-3">
            <Link to="/farmer-dashboard" className="hover:underline hover:text-[#1a402e] transition-colors">Farmer Hub</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-400 flex items-center gap-1"><Tractor size={12}/> My Farms</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Land Management
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2 max-w-xl leading-relaxed">
            Register and manage your geographical agricultural assets. Update yield expectations and define boundaries.
          </p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 bg-[#22543d] hover:bg-[#1a402e] text-white px-6 py-3.5 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(34,84,61,0.3)] hover:shadow-[0_8px_25px_rgba(34,84,61,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95"
          onClick={() => navigate('/farmer-dashboard/farm/new')}
        >
          <Plus size={18} strokeWidth={3} /> Register New Sector
        </button>
      </div>

      {/* ── GRID SYSTEM ───────────────────────────────────────────── */}
      {farms.length === 0 ? (
        <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto mt-12 flex flex-col items-center shadow-sm">
          <div className="w-24 h-24 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-8 transform hover:rotate-12 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <Tractor size={48} strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">No Zones Registered</h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8 px-8">
            You must register at least one valid topography mapping to begin listing live yields on the ecosystem.
          </p>
          <button 
            className="inline-flex items-center gap-2 bg-[#22543d] hover:bg-[#1a402e] text-white px-8 py-4 rounded-2xl font-extrabold shadow-[0_8px_30px_rgba(34,84,61,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
            onClick={() => navigate('/farmer-dashboard/farm/new')}
          >
            <Plus size={20} strokeWidth={3} /> Initialize Registration
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Sprout size={22} className="text-[#22543d]" strokeWidth={2.5}/> Active Agricultural Nodes
            </h3>
            <span className="bg-[#22543d]/10 text-[#22543d] font-black tracking-widest uppercase px-4 py-1.5 rounded-full text-[10px] shadow-inner border border-[#22543d]/20">
              {farms.length} Sector{farms.length !== 1 ? 's' : ''} Documented
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm, idx) => (
              <div 
                key={farm.id} 
                className="group relative bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(34,84,61,0.12)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform hover:-translate-y-2 flex flex-col"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Image Cover/Gradient fallback */}
                <div className="relative h-56 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}>
                  {farm.image ? (
                    <img src={farm.image} alt={farm.name} className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#1a402e] to-[#2d6a4f] flex items-center justify-center transition-transform duration-1000 group-hover:scale-110">
                      <ImageOff size={40} className="text-white/20" strokeWidth={1.5} />
                    </div>
                  )}
                  {/* Floating ID badge */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg">
                    ZONE #{farm.id.toString().padStart(4, '0')}
                  </div>
                  {/* Interactive Details Overlay */}
                  <div className="absolute inset-0 bg-[#22543d]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out flex items-center justify-center backdrop-blur-md pointer-events-none">
                    <span className="bg-white text-[#22543d] px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                      <ExternalLink size={18} strokeWidth={2.5}/> Open Dossier
                    </span>
                  </div>
                </div>

                {/* Card Payload */}
                <div className="p-8 flex flex-col flex-grow bg-white">
                  <h4 className="text-2xl font-black text-slate-900 mb-3 truncate tracking-tight" title={farm.name}>{farm.name}</h4>
                  
                  <div className="flex items-start gap-2.5 mb-6">
                    <MapPin size={18} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <span className="text-slate-600 font-bold text-sm leading-snug line-clamp-2">
                      {farm.location}
                    </span>
                  </div>

                  {/* Surface Chips */}
                  <div className="flex flex-wrap gap-2.5 mb-6">
                    {farm.size_hectares && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transform transition-transform group-hover:scale-105 duration-300">
                        <Maximize2 size={12} className="text-[#22543d]" strokeWidth={3} /> {farm.size_hectares} HA
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transform transition-transform group-hover:scale-105 duration-300 cursor-default">
                      <Sprout size={12} className="text-emerald-600" strokeWidth={3} /> Node Secure
                    </span>
                  </div>

                  {farm.description && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2 italic border-l-4 border-[#22543d]/20 pl-4 py-1">
                      “{farm.description}”
                    </p>
                  )}

                  {/* Operational Toolbar */}
                  <div className="mt-auto pt-5 border-t border-slate-100 flex items-center gap-3">
                    <button 
                      className="flex-1 bg-slate-50 hover:bg-[#22543d] border border-slate-200 hover:border-[#1a402e] text-slate-700 hover:text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
                    >
                      <ExternalLink size={14} strokeWidth={3} /> Full View
                    </button>
                    <button 
                      className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-400 hover:text-amber-600 rounded-xl transition-all duration-300 shadow-sm"
                      title="Edit farm parameters"
                      onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}
                    >
                      <Edit3 size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 rounded-xl transition-all duration-300 shadow-sm"
                      title="Purge farm locally"
                      onClick={() => deleteFarm(farm.id)}
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
