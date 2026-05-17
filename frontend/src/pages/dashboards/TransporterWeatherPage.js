import React, { useState } from 'react';
import PremiumWeatherView from '../../components/weather/PremiumWeatherView';
import { ArrowLeft, MapPin, ChevronRight, CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';

export default function TransporterWeatherPage() {
  const navigate = useNavigate();
  const [selectedWilaya, setSelectedWilaya] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10B981] mb-5 bg-[#10B981]/10 px-3 py-1 rounded-full w-fit border border-[#10B981]/20 shadow-sm">
        <button onClick={() => navigate(-1)} className="hover:text-[#059669] transition-colors uppercase font-black flex items-center gap-1.5">
          <ArrowLeft size={10} /> Logistics Hub
        </button>
        <ChevronRight size={10} className="text-[#10B981]/40" />
        <span className="text-[#10B981] flex items-center gap-1.5 font-black uppercase">
          <CloudSun size={11} /> Meteorological Intel
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#10B981]">
              <CloudSun size={22} strokeWidth={2.5} />
            </div>
            Meteorological <span className="text-[#10B981]">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Real-time atmospheric monitoring for logistics route optimization and safety.
          </p>
        </div>

        <div className="flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[240px]">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MapPin size={12} className="text-[#10B981]" /> Target Wilaya
          </label>
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#10B981]/20 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer transition-all uppercase tracking-wider"
          >
            <option value="">Current (Auto-Detect)</option>
            {ALGERIAN_WILAYAS.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full">
        <PremiumWeatherView wilaya={selectedWilaya || null} />
      </div>
    </div>
  );
}
