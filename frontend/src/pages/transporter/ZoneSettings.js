import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import {
  MapPin, Plus, X, ChevronRight, Globe,
  Navigation, CheckCircle, Activity, Radio,
  ShieldCheck, Signal, TrendingUp, Layers, Search
} from 'lucide-react';

const ALL_WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal',
  'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', "El M'Ghair", 'El Meniaa'
];

const ZoneSettings = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setZones(res.data.service_zones || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addZone = (wilaya) => {
    if (zones.includes(wilaya)) return;
    saveZones([...zones, wilaya]);
  };

  const removeZone = (wilaya) => {
    saveZones(zones.filter(z => z !== wilaya));
  };

  const saveZones = async (updatedList) => {
    try {
      await api.patch('/auth/profile/', { service_zones: updatedList });
      setZones(updatedList);
    } catch (err) { alert('Failed to save service registry zones.'); }
  };

  const coveragePct = Math.round((zones.length / ALL_WILAYAS.length) * 100);
  const filteredWilayas = ALL_WILAYAS.filter(
    w => !zones.includes(w) && w.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10B981] mb-5 bg-[#10B981]/10 px-3 py-1 rounded-full w-fit border border-[#10B981]/20 shadow-sm">
        <Link to="/transporter-dashboard" className="hover:text-[#059669] transition-colors">Logistics Hub</Link>
        <ChevronRight size={10} className="text-[#10B981]/40" />
        <span className="text-[#10B981] flex items-center gap-1.5 font-black uppercase">
          <Navigation size={11} /> Service Zones
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#10B981]">
              <Navigation size={22} strokeWidth={2.5} />
            </div>
            Service <span className="text-[#10B981]">Coverage</span> Grid
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Define your operational territory across Algeria's 58 official wilayas.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
              <Signal size={18} />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Nodes</div>
              <div className="text-xl font-black text-slate-900 leading-none">{zones.length}</div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coverage</div>
              <div className="text-xl font-black text-slate-900 leading-none">{coveragePct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Active zones — 3 cols ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Dark active-zones card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl flex flex-col">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#10B981]/15 blur-3xl rounded-full pointer-events-none" />

            {/* Card header */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white">
                  <Radio size={18} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-white font-black text-base tracking-tight">Active Coverage Zones</div>
                  <div className="text-[#10B981] text-[10px] font-bold mt-0.5 uppercase tracking-widest">
                    {zones.length} node{zones.length !== 1 ? 's' : ''} selected · hover row to remove
                  </div>
                </div>
              </div>
              <Activity size={32} className="text-[#10B981]/20" />
            </div>

            {/* Zone list - no scroll, grows naturally */}
            <div className="relative z-10 px-4 py-4 space-y-1.5">
              {loading ? (
                <div className="flex items-center gap-3 py-10 justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Loading zones...</span>
                </div>
              ) : zones.length === 0 ? (
                <div className="text-center py-12">
                  <Globe size={32} className="text-white/15 mx-auto mb-3" />
                  <p className="text-white/50 text-sm font-black">No zones selected</p>
                  <p className="text-white/25 text-xs mt-1 font-medium">Pick wilayas from the panel on the right →</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {zones.map(z => (
                    <div
                      key={z}
                      className="group flex items-center justify-between bg-white/8 hover:bg-red-500/10 border border-white/10 hover:border-red-400/30 rounded-xl px-3 py-2.5 transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                        <span className="text-white font-bold text-xs tracking-tight truncate">{z}</span>
                      </div>
                      <button
                        onClick={() => removeZone(z)}
                        className="w-6 h-6 rounded-lg bg-transparent group-hover:bg-red-500/80 flex items-center justify-center transition-all duration-150 active:scale-90 shrink-0 ml-1"
                        title={`Remove ${z}`}
                      >
                        <X size={11} strokeWidth={3} className="text-white/30 group-hover:text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coverage bar */}
            <div className="relative z-10 px-6 pb-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">National Coverage</span>
                <span className="text-white font-black text-xs">{coveragePct}% · {zones.length}/{ALL_WILAYAS.length} wilayas</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981]/80 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
            <div className="w-9 h-9 bg-[#10B981]/20 rounded-xl flex items-center justify-center text-[#10B981] shrink-0 border border-indigo-100">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 mb-0.5">Public Coverage Visibility</div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Your registered zones are publicly visible to farmers and buyers for route optimization and mission matching across the national grid.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Wilaya picker — 2 cols ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-visible">

            {/* Panel header & Select */}
            <div className={`p-5 border-b border-slate-100 transition-all duration-200 ${isDropdownOpen ? 'pb-[22rem]' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
                  <Layers size={16} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Add Service Zone</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {ALL_WILAYAS.length - zones.length} available
                  </div>
                </div>
              </div>

              {/* Custom Dropdown (Opens clearly downward) */}
              <div className="relative">
                <div 
                  className={`w-full h-11 px-4 bg-slate-50 border ${isDropdownOpen ? 'border-indigo-400' : 'border-slate-200'} rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-[#10B981]/50`}
                  onClick={() => {
                    if (zones.length < ALL_WILAYAS.length) {
                      setIsDropdownOpen(!isDropdownOpen);
                    }
                  }}
                >
                  <span className={`text-sm font-medium ${isDropdownOpen ? 'text-[#10B981]' : 'text-slate-600'}`}>
                    {zones.length === ALL_WILAYAS.length ? "All zones active" : isDropdownOpen ? "Search or select wilaya..." : "Choose a wilaya to add..."}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#10B981]' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-2 border-b border-slate-100 relative bg-slate-50">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Type to filter..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto p-1 scrollbar-hide">
                      {filteredWilayas.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400 font-medium">No available wilayas match "{search}"</div>
                      ) : (
                        filteredWilayas.map(w => (
                          <button
                            key={w}
                            onClick={() => { addZone(w); setIsDropdownOpen(false); setSearch(''); }}
                            className="w-full text-left px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#10B981]/20 hover:text-[#2DA83B] rounded-lg transition-colors flex items-center justify-between group"
                          >
                            <span>{w}</span>
                            <div className="w-5 h-5 rounded bg-white group-hover:bg-[#10B981] border border-slate-200 group-hover:border-indigo-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                              <Plus size={12} className="text-white" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State / Status */}
            <div className="p-4">
              {zones.length === ALL_WILAYAS.length ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-3 border border-emerald-100">
                    <CheckCircle size={22} />
                  </div>
                  <div className="text-sm font-black text-slate-800">Full National Coverage!</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">All 58 wilayas are active.</div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#10B981]/20 rounded-2xl flex items-center justify-center text-[#10B981] mb-3 border border-indigo-100">
                    <MapPin size={22} />
                  </div>
                  <div className="text-sm font-bold text-slate-600">Expand Your Reach</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Select a wilaya from the dropdown above to add it to your service zones.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZoneSettings;
