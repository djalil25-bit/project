import React, { useState } from 'react';
import WeatherWidget from '../../components/weather/WeatherWidget';
import { ArrowLeft, CloudSun, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';

export default function TransporterWeatherPage() {
  const navigate = useNavigate();
  const [selectedWilaya, setSelectedWilaya] = useState('');

  return (
    <div className="animate-fade-in p-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-bold text-sm"
      >
        <ArrowLeft size={16} /> Back to Control Center
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <CloudSun size={28} className="text-sky-500" />
            National Route Weather
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Detailed 5-day meteorological forecast and 3-hour interval tracking for major transit hubs.
          </p>
        </div>

        {/* Wilaya Filter Dropdown */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <MapPin size={12} /> Filter by Wilaya
          </label>
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="form-control"
            style={{ 
              minWidth: '200px', 
              borderRadius: '0.75rem', 
              border: '1px solid #e2e8f0', 
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#334155',
              backgroundColor: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="">Default (Algiers)</option>
            {ALGERIAN_WILAYAS.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="shadow-2xl rounded-3xl overflow-hidden border border-slate-200">
        <WeatherWidget farmId={null} wilaya={selectedWilaya || null} />
      </div>
    </div>
  );
}
