import React, { useState, useEffect } from 'react';
import PremiumWeatherView from '../../components/weather/PremiumWeatherView';
import { ChevronRight, CloudSun } from 'lucide-react';
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
    <div className="animate-fade-in p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-6 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
          <button onClick={() => navigate('/farmer-dashboard')} className="hover:text-[#255933] transition-colors uppercase">Farmer Hub</button>
          <ChevronRight size={10} className="text-[#2E6F40]/40" />
          <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
            <CloudSun size={11} /> Weather Intelligence
          </span>
        </div>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
                <CloudSun size={22} strokeWidth={2.5} />
              </div>
              Weather <span className="text-[#2E6F40]">Intelligence</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
              Real-time atmospheric monitoring and agro-climatic optimization protocols.
            </p>
          </div>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#2E6F40] animate-spin mb-4" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Atmosphere...</span>
            </div>
          ) : (
            <PremiumWeatherView farmId={farmId} wilaya={wilaya} />
          )}
        </div>
      </div>
    </div>
  );
}
