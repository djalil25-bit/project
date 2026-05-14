import React, { useState, useEffect } from 'react';
import PremiumWeatherView from '../../components/weather/PremiumWeatherView';
import { ArrowLeft, CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

export default function FarmerWeatherPage() {
  const navigate = useNavigate();
  const [farmId, setFarmId] = useState(undefined);
  const [wilaya, setWilaya] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch farmer's first farm for the weather widget context
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/dashboards/farmer-stats/');
        setWilaya(statsRes.data.wilaya);

        const farmsRes = await api.get('/farms/');
        const farms = farmsRes.data.results || farmsRes.data;
        if (farms && farms.length > 0) {
          setFarmId(farms[0].id);
        } else {
          setFarmId(null);
        }
      } catch (err) {
        console.error('[Weather] Could not load context:', err);
        setFarmId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in p-4 md:p-8 min-h-screen bg-[#f1f5f9]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-4 font-bold text-sm"
            >
              <ArrowLeft size={16} /> Retour au Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <CloudSun size={32} className="text-[#2E6F40]" />
              Intelligence Météorologique
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Surveillance atmosphérique en temps réel pour l'optimisation des cultures.
            </p>
          </div>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-[3rem] shadow-sm border border-slate-100">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#2E6F40] animate-spin mb-4" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initialisation...</span>
            </div>
          ) : (
            <PremiumWeatherView farmId={farmId} wilaya={wilaya} />
          )}
        </div>
      </div>
    </div>
  );
}
