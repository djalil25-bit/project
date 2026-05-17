import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import {
  Eye, Volume2, Wifi, RefreshCw, Thermometer, 
  Droplets, Sprout, CloudRain, ShieldAlert, Activity, Clock
} from 'lucide-react';

const translateMessage = (msg) => {
  if (!msg) return msg;
  const translations = {
    'MOUVEMENT DÉTECTÉ SUR LA FERME': 'MOVEMENT DETECTED ON FARM',
    'VIBRATION DÉTECTÉE SUR LA FERME': 'VIBRATION DETECTED ON FARM',
    'SOL TROP HUMIDE': 'SOIL TOO WET',
    'PLUIE DÉTECTÉE': 'RAIN DETECTED',
    'NIVEAU DE SON ÉLEVÉ': 'HIGH SOUND LEVEL',
    'MOUVEMENT INTRUS DÉTECTÉ': 'INTRUDER MOVEMENT DETECTED',
    'HUMIDITÉ ÉLEVÉE': 'HIGH HUMIDITY',
    'TEMPÉRATURE ÉLEVÉE': 'HIGH TEMPERATURE'
  };
  const upperMsg = msg.toUpperCase();
  return translations[upperMsg] || msg;
};

function KpiCard({ icon, value, label, color, bg, text, border, alert, note }) {
  return (
    <div className={`relative overflow-hidden group ${bg} ${border} border rounded-[1.5rem] p-4 transition-all duration-300 hover:shadow-xl hover:bg-white`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 bg-white shadow-sm ${text}`}>
            {icon}
          </div>
          {note && <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{note}</div>}
        </div>
        <div className="text-lg font-black text-slate-900 tracking-tighter mb-0.5">{value}</div>
        <div className={`text-[9px] font-black uppercase tracking-[0.15em] ${text}`}>{label}</div>
        {alert && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/60 border border-current rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
            <ShieldAlert size={10} /> {alert}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SensorWidget({ farmId }) {
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    if (!farmId) return;
    api.get(`/iot/data/${farmId}/`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data.slice(-50) : [];
        setReadings(list);
        setLatest(list.length > 0 ? list[list.length - 1] : null);
        setError(null);
      })
      .catch(err => {
        console.error('[SensorWidget] fetch error:', err);
        setError('Unable to load sensor data');
      })
      .finally(() => setLoading(false));
  }, [farmId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!farmId) return null;

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        textAlign: 'center',
        border: '1px solid #bbf7d0',
      }}>
        <div style={{
          width: 36, height: 36, margin: '0 auto 1rem',
          border: '3px solid #d1fae5', borderTop: '3px solid #22543d',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Loading sensor data…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || readings.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ color: '#94a3b8', marginBottom: '0.75rem' }}>
          <Wifi size={48} strokeWidth={1.5} />
        </div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', margin: '0 0 0.5rem' }}>
          Waiting for sensor data
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, maxWidth: 380, margin: '0 auto 1rem' }}>
          Make sure your ESP8266 is connected and FARM_ID matches the farm ID below.
        </p>
        <div style={{
          display: 'inline-block',
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '0.75rem',
          padding: '0.6rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 900,
          color: '#166534',
          letterSpacing: '0.02em',
        }}>
          Farm ID: {farmId}
        </div>
      </div>
    );
  }

  // Temperature
  const tempValue = latest?.temperature !== null && latest?.temperature !== undefined
    ? `${latest.temperature}°C` : '—';
  const tempBorder = latest?.temperature > 35 ? '#ef4444'
    : latest?.temperature < 5 ? '#7c3aed'
    : '#f97316';
  const tempAlert = latest?.temperature > 35 ? '⚠️ Heat Risk!'
    : latest?.temperature < 5 ? '⚠️ Frost Risk!'
    : null;
  const tempAlertColor = latest?.temperature > 35 ? 'red' : 'purple';

  // Humidity
  const humValue = latest?.humidity !== null && latest?.humidity !== undefined
    ? `${latest.humidity}%` : '—';

  // Soil Moisture
  const soilValue = latest?.soil_moisture !== null && latest?.soil_moisture !== undefined
    ? `${latest.soil_moisture}%` : '—';
  const soilBorder = latest?.soil_moisture !== null && latest?.soil_moisture !== undefined
    ? (latest.soil_moisture < 30 ? '#ef4444' : latest.soil_moisture > 80 ? '#3b82f6' : '#22c55e')
    : '#22c55e';
  const soilAlert = latest?.soil_moisture !== null && latest?.soil_moisture !== undefined
    ? (latest.soil_moisture < 30 ? '⚠️ Irrigate Now!' : latest.soil_moisture > 80 ? '⚠️ Too Wet!' : null)
    : null;

  // Rain
  const rainStatus = latest?.rain_status;
  const rainText = rainStatus === 'sec' ? 'Dry' : rainStatus === 'pluie' ? 'Raining' : '—';
  
  const miniKpis = [
    { icon: <Thermometer size={18} />, label: 'Temperature', value: latest?.temperature != null ? `${latest.temperature}°C` : '—', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', alert: latest?.temperature > 35 ? 'HEAT RISK' : null },
    { icon: <Droplets size={18} />, label: 'Air Humidity', value: latest?.humidity != null ? `${latest.humidity}%` : '—', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
    { icon: <Sprout size={18} />, label: 'Soil Health', value: latest?.soil_moisture != null ? `${latest.soil_moisture}%` : '—', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', alert: latest?.soil_moisture < 30 ? 'DRY SOIL' : null },
    { icon: <CloudRain size={18} />, label: 'Rain Status', value: rainText, text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { icon: <ShieldAlert size={18} />, label: 'IR Security', value: latest?.ir_status === 'detected' ? 'ALERT' : 'CLEAR', text: latest?.ir_status === 'detected' ? 'text-red-700' : 'text-slate-700', bg: latest?.ir_status === 'detected' ? 'bg-red-50' : 'bg-slate-50', border: latest?.ir_status === 'detected' ? 'border-red-100' : 'border-slate-100', alert: latest?.ir_status === 'detected' ? 'MOVEMENT' : null },
    { icon: <Volume2 size={18} />, label: 'Acoustics', value: latest?.sound_status === 'detected' ? 'NOISE' : 'SILENT', text: latest?.sound_status === 'detected' ? 'text-amber-700' : 'text-slate-700', bg: latest?.sound_status === 'detected' ? 'bg-amber-50' : 'bg-slate-50', border: latest?.sound_status === 'detected' ? 'border-amber-100' : 'border-slate-100' },
  ];

  return (
    <div className="bg-[#f8fafc] rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E6F40] text-white flex items-center justify-center shadow-lg shadow-[#2E6F40]/20">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">IoT Sensor Monitor</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Downlink Real-time Data</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Farm #{farmId}</div>
            <div className="flex items-center justify-end gap-1.5 text-[8px] font-black text-[#2E6F40] uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-[#2E6F40] rounded-full animate-ping" /> Synchronized
            </div>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-[#2E6F40] hover:border-[#2E6F40] transition-all shadow-sm active:scale-95"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {miniKpis.map((kpi, i) => (
            <KpiCard key={i} {...kpi} note={`0${i + 1}`} />
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#2E6F40]" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Historical Telemetry (Last 50)
              </h4>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis 
                  dataKey="recorded_at" 
                  hide={true}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                    fontSize: '10px', 
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '9px', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    paddingTop: '20px'
                  }} 
                />
                <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} dot={false} name="Temp" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} dot={false} name="Hum" />
                <Line type="monotone" dataKey="soil_moisture" stroke="#10b981" strokeWidth={3} dot={false} name="Soil" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
