import React, { useState, useEffect } from 'react';
import WeatherWidget from '../../components/weather/WeatherWidget';
import { ArrowLeft, CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

export default function FarmerWeatherPage() {
  const navigate = useNavigate();
  const [farmId, setFarmId] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch farmer's first farm for the weather widget context
    api.get('/farms/')
      .then(res => {
        const farms = res.data.results || res.data;
        if (farms && farms.length > 0) {
          setFarmId(farms[0].id);
        } else {
          setFarmId(null);
        }
      })
      .catch(err => {
        console.error('[Weather] Could not load farms:', err);
        setFarmId(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in p-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-bold text-sm"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <CloudSun size={28} className="text-emerald-600" />
          Field Weather Intelligence
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Detailed 5-day meteorological forecast and 3-hour interval tracking tailored to your farm location.
        </p>
      </div>

      <div className="shadow-2xl rounded-3xl overflow-hidden border border-slate-200 bg-white min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#22543d] animate-spin mb-4" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading location data...</span>
          </div>
        ) : (
          <WeatherWidget farmId={farmId} />
        )}
      </div>
    </div>
  );
}
