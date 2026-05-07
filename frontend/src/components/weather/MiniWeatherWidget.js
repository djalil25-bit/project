import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const OWM_MAP = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '🌤️',
  '03d': '🌥️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

export default function MiniWeatherWidget({ farmId, targetPath }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmId === undefined) return;
    const fetchWeather = async () => {
      try {
        const params = farmId ? `?farm_id=${farmId}` : '';
        const res = await api.get(`/dashboards/weather/${params}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [farmId]);

  if (loading || !data) return (
    <div className="w-[130px] h-[130px] bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center animate-pulse border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] cursor-pointer"
         onClick={() => navigate(targetPath || '/transporter-dashboard/weather')}>
       <div className="text-white/80 text-[10px] font-bold uppercase tracking-wider text-center">Loading<br/>Weather</div>
    </div>
  );

  const current = data.current;
  const emoji = OWM_MAP[current?.icon_code] || '🌤️';

  return (
    <div 
      onClick={() => navigate(targetPath || '/transporter-dashboard/weather')}
      className="flex flex-col justify-between p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]"
      style={{ width: '130px', height: '130px' }}
      title="Click for full weather report"
    >
      <div className="flex justify-between items-start w-full">
        {/* Large Emoji */}
        <div className="text-[2.3rem] leading-none drop-shadow-md" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' }}>
          {emoji}
        </div>

        {/* Temp block */}
        <div className="flex items-start text-white">
          <span className="text-[1.9rem] leading-none font-bold tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
            {current?.temp}
          </span>
          <span className="text-[10px] font-bold leading-none mt-1 ml-0.5 opacity-80">
            °C
          </span>
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="w-full h-px bg-white/20 my-1" />

      {/* Details block */}
      <div className="flex flex-col gap-0.5 text-[9px] font-medium text-white/80 tracking-wider">
        <div className="flex justify-between items-center">
          <span>Précip</span> 
          <span className="font-bold text-white">{data.forecast?.[0]?.humidity > 80 ? '20%' : '0%'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Humidité</span> 
          <span className="font-bold text-white">{current?.humidity}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Vent</span> 
          <span className="font-bold text-white">{current?.wind_speed} <span className="opacity-70 text-[8px]">km/h</span></span>
        </div>
      </div>
    </div>
  );
}
