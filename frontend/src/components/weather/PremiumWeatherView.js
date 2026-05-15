import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { 
  MapPin, Wind, Droplets, Thermometer, 
  Search, CloudRain, Sun, Cloud, Eye, Sunrise, Sunset,
  Compass, Navigation, CloudLightning
} from 'lucide-react';

const CONDITION_MAP_EN = {
  'clear sky': 'Clear Sky',
  'few clouds': 'Few Clouds',
  'scattered clouds': 'Scattered Clouds',
  'broken clouds': 'Broken Clouds',
  'shower rain': 'Showers',
  'rain': 'Rain',
  'thunderstorm': 'Thunderstorm',
  'snow': 'Snow',
  'mist': 'Mist',
  'overcast clouds': 'Overcast',
  'light rain': 'Light Rain',
  'moderate rain': 'Moderate Rain',
  'heavy intensity rain': 'Heavy Rain',
  'fog': 'Fog',
  'thunderstorm with rain': 'Probable Thunderstorms',
  'thunderstorm with light rain': 'Light Thunderstorms',
  'thunderstorm with heavy rain': 'Severe Thunderstorms'
};

const getConditionEn = (desc) => {
  if (!desc) return 'Unknown';
  const lower = desc.toLowerCase();
  return CONDITION_MAP_EN[lower] || desc;
};

const getWeatherTheme = (iconCode) => {
  if (!iconCode) return { bg: 'from-sky-400 to-blue-600', accent: 'sky' };
  
  if (iconCode.includes('01')) return { bg: 'from-amber-400 via-orange-400 to-rose-500', accent: 'amber' }; // Clear
  if (iconCode.includes('02') || iconCode.includes('03')) return { bg: 'from-sky-400 to-indigo-500', accent: 'blue' }; // Clouds
  if (iconCode.includes('04')) return { bg: 'from-slate-400 to-slate-600', accent: 'slate' }; // Overcast
  if (iconCode.includes('09') || iconCode.includes('10')) return { bg: 'from-blue-600 to-slate-800', accent: 'blue' }; // Rain
  if (iconCode.includes('11')) return { bg: 'from-purple-800 to-slate-900', accent: 'purple' }; // Lightning
  if (iconCode.includes('13')) return { bg: 'from-blue-100 to-sky-300', accent: 'sky' }; // Snow
  if (iconCode.includes('50')) return { bg: 'from-slate-300 to-slate-500', accent: 'slate' }; // Mist
  
  return { bg: 'from-sky-500 to-blue-700', accent: 'sky' };
};

const StatCard = ({ icon, label, value, unit }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 hover:bg-white/15 transition-all">
    <div className="p-3 bg-white/10 rounded-xl text-white">
      {icon}
    </div>
    <div>
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-white text-lg font-black">{value}<span className="text-xs ml-1 opacity-70">{unit}</span></p>
    </div>
  </div>
);

export default function PremiumWeatherView({ farmId, wilaya }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (farmId) queryParams.append('farm_id', farmId);
      if (wilaya) queryParams.append('wilaya', wilaya);
      const res = await api.get(`/dashboards/weather/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to load weather data.');
    } finally {
      setLoading(false);
    }
  }, [farmId, wilaya]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  if (loading) return (
    <div className="w-full min-h-[600px] flex items-center justify-center bg-white rounded-3xl border border-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Updating systems...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="w-full min-h-[400px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8">
      <div className="text-center">
        <p className="text-slate-500 font-medium mb-6">{error}</p>
        <button onClick={fetchWeather} className="px-8 py-3 bg-white text-slate-800 font-bold rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">Retry</button>
      </div>
    </div>
  );

  const current = data?.current;
  const forecast = data?.forecast || [];
  const hourly = data?.hourly?.slice(0, 12) || [];
  const theme = getWeatherTheme(current?.icon_code);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Insights Grid (Now at the top) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Sunrise size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunrise</p>
               <p className="text-lg font-black text-slate-800">05:42</p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Sunset size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sunset</p>
               <p className="text-lg font-black text-slate-800">19:26</p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><CloudRain size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precipitation</p>
               <p className="text-lg font-black text-slate-800">1.2<span className="text-xs ml-1 opacity-50">mm</span></p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl"><CloudLightning size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UV Index</p>
               <p className="text-lg font-black text-slate-800">4<span className="text-xs ml-1 opacity-50">Medium</span></p>
            </div>
         </div>
      </div>

      {/* Hero Header Section */}
      <div className={`relative w-full rounded-[2.5rem] overflow-hidden p-8 md:p-12 bg-gradient-to-br ${theme.bg} text-white shadow-2xl`}>
        {/* ... existing hero code ... */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
          {/* Left: Location & Main Temp */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
              <MapPin size={16} />
              <span className="text-sm font-bold uppercase tracking-widest">{current?.city || wilaya || 'El-Khroub'}</span>
            </div>
            
            <div className="flex items-start justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-8xl md:text-9xl font-black tracking-tighter">{current?.temp}</h1>
              <span className="text-4xl md:text-5xl font-light mt-4">°C</span>
            </div>
            
            <p className="text-2xl md:text-3xl font-bold opacity-90 mb-4">
              {getConditionEn(current?.description)}
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-4 text-lg font-medium opacity-80">
              <span>↑ {forecast[0]?.temp_max || current?.temp + 2}°</span>
              <span className="w-px h-4 bg-white/30" />
              <span>↓ {forecast[0]?.temp_min || current?.temp - 4}°</span>
              <span className="w-px h-4 bg-white/30" />
              <span>Feels like {current?.feels_like}°</span>
            </div>
          </div>

          {/* Center/Right: Visual representation or 3D icon */}
          <div className="hidden lg:flex items-center justify-center">
             <div className="text-[12rem] animate-bounce-slow" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}>
                {current?.icon_code?.includes('01') ? '☀️' : 
                 current?.icon_code?.includes('02') || current?.icon_code?.includes('03') ? '⛅' :
                 current?.icon_code?.includes('04') ? '☁️' :
                 current?.icon_code?.includes('09') || current?.icon_code?.includes('10') ? '🌧️' :
                 current?.icon_code?.includes('11') ? '⛈️' : '🌤️'}
             </div>
          </div>

          {/* Right: Quick Stats Sidebar */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 w-full md:w-auto">
            <StatCard icon={<Droplets size={20} />} label="Humidity" value={current?.humidity} unit="%" />
            <StatCard icon={<Wind size={20} />} label="Wind" value={current?.wind_speed} unit="km/h" />
            <StatCard icon={<Eye size={20} />} label="Visibility" value={current?.visibility || '10'} unit="km" />
            <StatCard icon={<Compass size={20} />} label="Pressure" value={current?.pressure || '1013'} unit="hPa" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Forecast (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Hourly Forecast</h3>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
               <Navigation size={12} className="rotate-45" />
               Updated just now
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-4 h-64 relative">
            {/* Background horizontal lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-black" />
            </div>

            {hourly.map((h, i) => {
              const heightPercent = ((h.temp - (current?.temp - 10)) / 20) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{h.time}</span>
                  <div className="relative flex-1 w-full flex flex-col justify-end items-center">
                    <div 
                      className="w-1.5 bg-sky-500/20 rounded-full group-hover:bg-sky-500/40 transition-all duration-500 mb-2"
                      style={{ height: `${Math.max(20, Math.min(100, heightPercent))}%` }}
                    />
                    <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-all -translate-y-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md font-bold mb-2">
                       {h.temp}°
                    </div>
                  </div>
                  <div className="text-xl group-hover:scale-125 transition-transform duration-300">
                     {h.icon_code?.includes('01') ? '☀️' : h.icon_code?.includes('10') ? '🌧️' : '☁️'}
                  </div>
                  <span className="text-sm font-black text-slate-800">{h.temp}°</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day List (1/3 width) */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Next 7 Days</h3>
          <div className="flex flex-col gap-6">
            {forecast.slice(1).map((day, i) => (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <span className="text-slate-500 font-bold w-12 text-sm">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <div className="flex items-center gap-3 w-20">
                  <div className="text-2xl group-hover:rotate-12 transition-transform">
                    {day.icon_code?.includes('01') ? '☀️' : day.icon_code?.includes('10') ? '🌧️' : '☁️'}
                  </div>
                  <span className="text-xs font-bold text-slate-400">{day.humidity}%</span>
                </div>
                <div className="flex gap-4 min-w-[4rem] justify-end">
                   <span className="font-black text-slate-800">{day.temp_max}°</span>
                   <span className="font-bold text-slate-300">{day.temp_min}°</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={fetchWeather} className="w-full mt-10 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl transition-all border border-slate-100">
            VIEW MORE DETAILS
          </button>
        </div>

      </div>
    </div>
  );
}
