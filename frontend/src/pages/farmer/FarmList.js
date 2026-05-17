import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Tractor, Edit3, Trash2, MapPin, Maximize2, ExternalLink, ChevronRight, Sprout, ImageOff, Clock, AlertCircle } from 'lucide-react';

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
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#2E6F40] animate-spin" />
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Topography...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5">
          <Tractor size={11} /> Land Management
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
              <Tractor size={22} strokeWidth={2.5} />
            </div>
            Registry of <span className="text-[#2E6F40]">Farms</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Register and manage your geographical agricultural assets.</p>
        </div>
        
        <button 
          className="inline-flex items-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 border-0"
          onClick={() => navigate('/farmer-dashboard/farm/new')}
        >
          <Plus size={16} strokeWidth={3} /> Register New Farm
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
            You must register at least one valid farm to begin selling your products on the marketplace.
          </p>
          <button 
            className="inline-flex items-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-8 py-4 rounded-2xl font-extrabold shadow-[0_8px_30px_rgba(34,84,61,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
            onClick={() => navigate('/farmer-dashboard/farm/new')}
          >
            <Plus size={20} strokeWidth={3} /> Initialize Registration
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sprout size={14} className="text-[#2E6F40]" strokeWidth={3}/> Operational Assets
            </h3>
            <span className="bg-[#f0faf4] text-[#2E6F40] font-black tracking-widest uppercase px-3 py-1 rounded-full text-[9px] border border-[#2E6F40]/20 shadow-sm">
              {farms.length} Node{farms.length !== 1 ? 's' : ''} Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {farms.map((farm, idx) => (
              <div 
                key={farm.id} 
                className={`group bg-white border rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500 transform hover:-translate-y-1 flex flex-col ${
                  farm.status === 'REJECTED' ? 'border-red-100 bg-red-50/10' : farm.status === 'PENDING' ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100 hover:border-[#2E6F40]/20'
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Image Banner */}
                <div className="relative h-44 overflow-hidden bg-slate-50 cursor-pointer shrink-0" onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}>
                  {farm.image ? (
                    <img src={farm.image} alt={farm.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                      <ImageOff size={28} className="text-slate-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-sm border border-slate-100">
                    ID-{farm.id.toString().padStart(4, '0')}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h4 className="text-base font-black text-slate-900 truncate tracking-tight cursor-pointer hover:text-[#2E6F40] transition-colors" title={farm.name} onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}>
                      {farm.name}
                    </h4>
                    {/* Dynamic Status Badge */}
                    {farm.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#2E6F40] border border-emerald-100 px-2 py-1 rounded-lg text-[8px] font-black shrink-0 shadow-sm">
                        <div className="w-1 h-1 rounded-full bg-[#2E6F40] animate-pulse" /> ACTIVE
                      </span>
                    ) : farm.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-lg text-[8px] font-black shrink-0 shadow-sm">
                        <div className="w-1 h-1 rounded-full bg-amber-600 animate-pulse" /> PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-[8px] font-black shrink-0 shadow-sm">
                        <div className="w-1 h-1 rounded-full bg-red-600" /> REJECTED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={12} className="text-slate-400 shrink-0" strokeWidth={3} />
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider truncate">{farm.location}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    {farm.size_hectares && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Maximize2 size={10} className="text-[#2E6F40]" strokeWidth={3} />
                        <span className="text-[10px] font-black text-slate-700 tabular-nums">{farm.size_hectares} HA</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={10} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest">2024 Cycle</span>
                    </div>
                  </div>

                  {/* Rejection Reason Banner */}
                  {farm.status === 'REJECTED' && farm.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                      <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Rejection Reason</span>
                        <p className="text-[11px] text-red-700 font-medium mt-0.5">{farm.rejection_reason}</p>
                        <p className="text-[9px] text-red-500 font-bold mt-1 italic">Edit this farm to resubmit for approval.</p>
                      </div>
                    </div>
                  )}

                  {/* Pending Banner */}
                  {farm.status === 'PENDING' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                      <Clock size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Awaiting Admin Approval</span>
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">You cannot list products until this farm is approved.</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#2E6F40] border border-slate-200 hover:border-[#255933] text-slate-700 hover:text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 shadow-sm"
                      onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
                    >
                      <ExternalLink size={12} strokeWidth={3} /> Node Details
                    </button>
                    <div className="flex items-center gap-2">
                      <button 
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-400 hover:text-amber-600 rounded-xl transition-all duration-300 shadow-sm active:scale-95"
                        title={farm.status === 'REJECTED' ? 'Edit & Resubmit' : 'Edit asset'}
                        onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}
                      >
                        <Edit3 size={14} strokeWidth={2.5} />
                      </button>
                      <button 
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-300 shadow-sm active:scale-95"
                        title="Delete asset"
                        onClick={() => deleteFarm(farm.id)}
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
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
