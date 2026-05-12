import React, { useState } from 'react';
import PremiumWeatherView from '../../components/weather/PremiumWeatherView';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';

export default function TransporterWeatherPage() {
  const navigate = useNavigate();
  const [selectedWilaya, setSelectedWilaya] = useState('');

  return (
    <div className="animate-fade-in p-4 md:p-8 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-4 font-bold text-sm"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Meteorological Intelligence
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Real-time atmospheric monitoring for logistics optimization.
            </p>
          </div>

          <div className="flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[240px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> Target Wilaya
            </label>
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="bg-slate-50 border-none outline-none focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 cursor-pointer transition-all"
            >
              <option value="">Current (Auto)</option>
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
    </div>
  );
}
