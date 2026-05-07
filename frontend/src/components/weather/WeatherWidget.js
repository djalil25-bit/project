import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import {
  Wind, Droplets, Thermometer, Eye, CalendarDays,
  ChevronLeft, ChevronRight, MapPin, RefreshCw
} from 'lucide-react';

/* ─── Map OWM icon codes to beautiful emoji + colour theme ─── */
const OWM_MAP = {
  '01d': { emoji: '☀️', label: 'Clear Sky', bg: 'from-amber-400 to-orange-400', text: 'text-amber-900' },
  '01n': { emoji: '🌙', label: 'Clear Night', bg: 'from-indigo-700 to-slate-800', text: 'text-indigo-100' },
  '02d': { emoji: '⛅', label: 'Few Clouds', bg: 'from-sky-300 to-blue-400', text: 'text-sky-900' },
  '02n': { emoji: '🌤️', label: 'Few Clouds', bg: 'from-indigo-600 to-slate-700', text: 'text-slate-100' },
  '03d': { emoji: '🌥️', label: 'Scattered', bg: 'from-slate-300 to-slate-400', text: 'text-slate-800' },
  '03n': { emoji: '☁️', label: 'Scattered', bg: 'from-slate-600 to-slate-700', text: 'text-slate-100' },
  '04d': { emoji: '☁️', label: 'Overcast', bg: 'from-slate-400 to-slate-500', text: 'text-slate-100' },
  '04n': { emoji: '☁️', label: 'Overcast', bg: 'from-slate-700 to-slate-800', text: 'text-slate-100' },
  '09d': { emoji: '🌧️', label: 'Shower Rain', bg: 'from-blue-500 to-blue-700', text: 'text-blue-50' },
  '09n': { emoji: '🌧️', label: 'Shower Rain', bg: 'from-blue-700 to-slate-800', text: 'text-blue-50' },
  '10d': { emoji: '🌦️', label: 'Rain', bg: 'from-blue-400 to-blue-600', text: 'text-blue-50' },
  '10n': { emoji: '🌧️', label: 'Rain', bg: 'from-blue-700 to-indigo-900', text: 'text-blue-100' },
  '11d': { emoji: '⛈️', label: 'Thunderstorm', bg: 'from-violet-600 to-slate-900', text: 'text-violet-100' },
  '11n': { emoji: '⛈️', label: 'Thunderstorm', bg: 'from-violet-800 to-slate-900', text: 'text-violet-100' },
  '13d': { emoji: '❄️', label: 'Snow', bg: 'from-sky-100 to-blue-200', text: 'text-sky-900' },
  '13n': { emoji: '❄️', label: 'Snow', bg: 'from-slate-300 to-blue-300', text: 'text-slate-800' },
  '50d': { emoji: '🌫️', label: 'Mist/Fog', bg: 'from-slate-300 to-slate-400', text: 'text-slate-700' },
  '50n': { emoji: '🌫️', label: 'Mist/Fog', bg: 'from-slate-600 to-slate-700', text: 'text-slate-100' },
};

function getTheme(iconCode) {
  return OWM_MAP[iconCode] || { emoji: '🌡️', label: 'Weather', bg: 'from-emerald-600 to-teal-700', text: 'text-white' };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatPill({ icon, value, label, color = 'text-white/80' }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20 min-w-[72px]">
      <div className={`${color} opacity-80`}>{icon}</div>
      <span className="text-white font-black text-sm leading-none">{value}</span>
      <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function WeatherWidget({ farmId, wilaya }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today (current)
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (farmId) queryParams.append('farm_id', farmId);
      if (wilaya) queryParams.append('wilaya', wilaya);
      
      const paramsStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await api.get(`/dashboards/weather/${paramsStr}`);
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error;
      if (status === 502) {
        setError(detail || 'Weather API error. Check your API key.');
      } else if (status === 503) {
        setError('Weather service not configured on the server.');
      } else {
        setError(detail || 'Could not load weather data. Please retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [farmId, wilaya]);

  useEffect(() => {
    // For the farmer dashboard, farmId starts as null and gets set after
    // the /farms/ call resolves. We skip the first render if farmId prop
    // is explicitly undefined (component mounted before parent data arrived),
    // but we DO fetch when farmId is null (transporter — no farm needed).
    if (farmId === undefined && !wilaya) return;
    fetchWeather();
  }, [fetchWeather, farmId, wilaya]);


  /* ── LOADING ── */
  if (loading) return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 p-6 shadow-xl animate-pulse min-h-[180px] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-5xl mb-3 animate-bounce">🌤️</div>
        <p className="text-white/80 font-bold text-sm uppercase tracking-widest">Loading weather…</p>
      </div>
    </div>
  );

  /* ── ERROR ── */
  if (error) return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 p-5 shadow-xl border border-white/10">
      <p className="text-white/70 text-sm font-bold text-center py-4">⚠️ {error}</p>
      <button
        onClick={() => fetchWeather()}
        className="block mx-auto mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl transition-all"
      >
        Retry
      </button>
    </div>
  );

  const forecast = data?.forecast || [];
  const current = data?.current;
  const isShowingCurrent = selectedDay === 0;
  const displayDay = isShowingCurrent ? null : forecast[selectedDay - 1];
  const displayIconCode = isShowingCurrent ? current?.icon_code : displayDay?.icon_code;
  const theme = getTheme(displayIconCode);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.bg} shadow-2xl border border-white/20`}
      style={{ transition: 'background 0.6s ease' }}>
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-white/70" />
          <span className="text-white/80 font-black text-xs uppercase tracking-widest truncate max-w-[160px]">
            {data?.farm_name || 'Your Farm'} · {current?.city}
          </span>
        </div>
        <button
          onClick={() => fetchWeather(true)}
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          title="Refresh"
        >
          <RefreshCw size={12} className={`text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Weather Display */}
      <div className="relative z-10 px-5 pb-4 pt-1">
        {isShowingCurrent ? (
          /* ── Today (current) ── */
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-7xl leading-none mb-1" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
                {theme.emoji}
              </div>
              <p className="text-white/80 text-sm font-bold capitalize">{current?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-black text-white leading-none drop-shadow-lg">
                {current?.temp}°
              </div>
              <p className="text-white/60 text-xs font-bold mt-1">Feels {current?.feels_like}°C</p>
            </div>
          </div>
        ) : (
          /* ── Selected forecast day ── */
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-7xl leading-none mb-1" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
                {theme.emoji}
              </div>
              <p className="text-white/80 text-sm font-bold capitalize">{displayDay?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-white leading-none drop-shadow-lg">
                {displayDay?.temp_max}°
              </div>
              <p className="text-white/60 text-xs font-bold mt-1">Low {displayDay?.temp_min}°C</p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {isShowingCurrent ? (
            <>
              <StatPill icon={<Droplets size={14} />} value={`${current?.humidity}%`} label="Humidity" />
              <StatPill icon={<Wind size={14} />} value={`${current?.wind_speed}`} label="km/h Wind" />
              <StatPill icon={<Thermometer size={14} />} value={`${current?.feels_like}°`} label="Feels Like" />
            </>
          ) : (
            <>
              <StatPill icon={<Droplets size={14} />} value={`${displayDay?.humidity}%`} label="Humidity" />
              <StatPill icon={<Wind size={14} />} value={`${displayDay?.wind_speed}`} label="km/h Wind" />
              <StatPill icon={<Thermometer size={14} />} value={`${displayDay?.temp_min}°`} label="Min Temp" />
            </>
          )}
        </div>
      </div>

      {/* ── Day Selector ── */}
      {forecast.length > 0 && (
        <div className="relative z-10 border-t border-white/20 bg-black/10 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {/* Today button */}
            <button
              onClick={() => setSelectedDay(0)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-200 ${selectedDay === 0
                  ? 'bg-white/25 shadow-lg border border-white/40 scale-105'
                  : 'hover:bg-white/10 border border-transparent'
                }`}
            >
              <span className="text-xl">{getTheme(current?.icon_code)?.emoji}</span>
              <span className="text-white font-black text-[10px] mt-0.5 uppercase tracking-wider">Now</span>
              <span className="text-white/80 font-bold text-[10px]">{current?.temp}°</span>
            </button>

            {/* Separator */}
            <div className="w-px h-10 bg-white/20 mx-1 flex-shrink-0" />

            {/* Forecast days */}
            {forecast.slice(1).map((day, idx) => {
              const dayTheme = getTheme(day.icon_code);
              const dayIndex = idx + 1;
              const isSelected = selectedDay === dayIndex;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(dayIndex)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-200 ${isSelected
                      ? 'bg-white/25 shadow-lg border border-white/40 scale-105'
                      : 'hover:bg-white/10 border border-transparent'
                    }`}
                >
                  <span className="text-xl">{dayTheme.emoji}</span>
                  <span className="text-white font-black text-[10px] mt-0.5 uppercase tracking-wider">
                    {formatDate(day.date)}
                  </span>
                  <span className="text-white/80 font-bold text-[10px]">{day.temp_max}°/{day.temp_min}°</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hourly Forecast (For Selected Day) ── */}
      {data?.hourly && data.hourly.length > 0 && (
        (() => {
          const selectedDateStr = forecast[selectedDay]?.date;
          const displayHourly = data.hourly.filter(hour => hour.date === selectedDateStr);
          const hourlyLabel = selectedDay === 0 ? "Today's Forecast" : `${formatDate(selectedDateStr)}'s Forecast`;

          if (displayHourly.length === 0) return null;

          return (
            <div className="relative z-10 border-t border-white/20 bg-black/10 backdrop-blur-sm px-4 py-3 rounded-b-3xl">
              <div className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3">
                {hourlyLabel}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {displayHourly.map((hour, idx) => {
                  const hourTheme = getTheme(hour.icon_code);
                  const isNow = selectedDay === 0 && idx === 0; // Highlight 'NOW' only for today's first slot
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 flex flex-col items-center px-2 py-2 rounded-2xl transition-all duration-200 ${isNow ? 'bg-white/20 border border-white/40 shadow-sm' : 'hover:bg-white/10 border border-transparent'
                        }`}
                      style={{ minWidth: '52px' }}
                    >
                      <span className="text-white font-bold text-[10px] mb-1.5">{isNow ? 'NOW' : hour.time}</span>
                      <span className="text-xl mb-1.5">{hourTheme.emoji}</span>
                      <span className="text-white font-black text-[11px]">{hour.temp}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
