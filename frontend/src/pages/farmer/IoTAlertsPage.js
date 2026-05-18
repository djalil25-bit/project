import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';
import {
  Activity, RefreshCw, Shield, ShieldAlert, ShieldCheck,
  Thermometer, Droplets, Sprout, FlaskConical, CloudRain,
  ChevronRight, Clock, AlertTriangle, CheckCircle, Eye, Volume2,
  Zap, Bot, Sparkles
} from 'lucide-react';

const LEVEL_STYLES = {
  danger: {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '#fca5a5', text: '#dc2626', badgeBg: '#dc2626', badgeText: '#fff',
    iconBg: 'rgba(220, 38, 38, 0.12)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '#fcd34d', text: '#d97706', badgeBg: '#d97706', badgeText: '#fff',
    iconBg: 'rgba(217, 119, 6, 0.12)',
  },
  info: {
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#93c5fd', text: '#2563eb', badgeBg: '#2563eb', badgeText: '#fff',
    iconBg: 'rgba(37, 99, 235, 0.12)',
  },
};

function getRainDisplay(status) {
  switch (status) {
    case 'dry':
    case 'sec': return { emoji: '☀️', text: 'Dry' };
    case 'humide': return { emoji: '🌦️', text: 'Wet' };
    case 'rain':
    case 'pluie': return { emoji: '🌧️', text: 'Raining' };
    default: return { emoji: '—', text: '—' };
  }
}

const translateMessage = (msg) => {
  if (!msg) return msg;
  const translations = {
    'MOUVEMENT DÉTECTÉ SUR LA FERME': 'MOVEMENT DETECTED ON FARM',
    'MOVEMENT DETECTED ON FARM': 'MOVEMENT DETECTED ON FARM',
    'VIBRATION DÉTECTÉE SUR LA FERME': 'VIBRATION DETECTED ON FARM',
    'SOL TROP HUMIDE': 'SOIL TOO WET',
    'PLUIE DÉTECTÉE': 'RAIN DETECTED',
    'NIVEAU DE SON ÉLEVÉ': 'HIGH SOUND LEVEL',
    'MOUVEMENT INTRUS DÉTECTÉ': 'INTRUDER MOVEMENT DETECTED',
    'HUMIDITÉ ÉLEVÉE': 'HIGH HUMIDITY',
    'TEMPÉRATURE ÉLEVÉE': 'HIGH TEMPERATURE',
    'BRUIT SUSPECT DÉTECTÉ': 'SUSPICIOUS NOISE DETECTED',
    'SUSPICIOUS NOISE DETECTED': 'SUSPICIOUS NOISE DETECTED',
  };
  const upperMsg = msg.toUpperCase();
  return translations[upperMsg] || msg;
};

// Helper: check if a sensor value is actually connected (not null/disconnected)
function isSensorConnected(val) {
  return val != null && val !== 'disconnected';
}

export default function IoTAlertsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  // AI Recommendations state
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.get('/farms/')
      .then(res => {
        const list = res.data.results || res.data;
        setFarms(list);
        if (list.length > 0) setSelectedFarmId(list[0].id);
      })
      .catch(err => console.error('[IoTAlerts] farms fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchAlerts = useCallback((farmId, showToasts = false) => {
    if (!farmId) return;
    setRefreshing(true);
    Promise.all([
      api.get(`/iot/alerts/${farmId}/`),
      api.get(`/iot/alerts/history/${farmId}/`),
    ])
      .then(([alertRes, histRes]) => {
        setAlertData(alertRes.data);
        setHistory(histRes.data);
        if (showToasts) {
          const { alerts_count, has_danger } = alertRes.data;
          if (has_danger) showToast('⚠️ Critical alerts detected on your farm!', 'error');
          else if (alerts_count > 0) showToast(`⚠️ ${alerts_count} alerts on your farm`, 'warning');
          else showToast('✅ All sensors are normal!', 'success');
        }
      })
      .catch(err => console.error('[IoTAlerts] fetch error:', err))
      .finally(() => setRefreshing(false));
  }, [showToast]);

  useEffect(() => {
    if (selectedFarmId) { setToastShown(false); fetchAlerts(selectedFarmId, false); }
  }, [selectedFarmId, fetchAlerts]);

  useEffect(() => {
    if (alertData && !toastShown) {
      setToastShown(true);
      const { alerts_count, has_danger } = alertData;
      if (has_danger) showToast('⚠️ Critical alerts detected on your farm!', 'error');
      else if (alerts_count > 0) showToast(`⚠️ ${alerts_count} alerts on your farm`, 'warning');
      else showToast('✅ All sensors are normal!', 'success');
    }
  }, [alertData, toastShown, showToast]);

  useEffect(() => {
    if (!selectedFarmId) return;
    const interval = setInterval(() => fetchAlerts(selectedFarmId, true), 600000);
    return () => clearInterval(interval);
  }, [selectedFarmId, fetchAlerts]);

  // ── AI RECOMMENDATIONS FETCH ──
  const fetchAIRecommendations = useCallback((farmId, force = false) => {
    if (!farmId) return;
    setAiLoading(true);
    api.get(`/iot/ai-recommendations/${farmId}/${force ? '?force=true' : ''}`)
      .then(res => setAiData(res.data))
      .catch(err => {
        console.error('[AI] fetch error:', err);
        setAiData(null);
      })
      .finally(() => setAiLoading(false));
  }, []);

  useEffect(() => {
    if (selectedFarmId) fetchAIRecommendations(selectedFarmId);
  }, [selectedFarmId, fetchAIRecommendations]);

  const handleRefresh = () => {
    fetchAlerts(selectedFarmId, true);
    fetchAIRecommendations(selectedFarmId, true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #2E6F40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading IoT data…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const alerts = alertData?.alerts || [];
  const lastReading = alertData?.last_reading;
  const rain = lastReading ? getRainDisplay(lastReading.rain_status) : { emoji: '—', text: '—' };

  // Check if IR/Sound sensors are connected
  const irConnected = lastReading ? isSensorConnected(lastReading.ir_status) : false;
  const soundConnected = lastReading ? isSensorConnected(lastReading.sound_status) : false;

  // Build sensor KPI cards — show rain emoji inline with text
  const rainValue = rain.text !== '—' ? `${rain.emoji} ${rain.text}` : '—';

  // 6 real sensors
  const miniKpis = lastReading ? [
    { icon: <Thermometer size={18} />, label: 'Temperature', value: lastReading.temperature != null ? `${lastReading.temperature}°C` : '—', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    { icon: <Droplets size={18} />, label: 'Humidity', value: lastReading.humidity != null ? `${lastReading.humidity}%` : '—', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    { icon: <Sprout size={18} />, label: 'Soil Health', value: lastReading.soil_moisture != null ? `${lastReading.soil_moisture}%` : '—', color: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    { icon: <CloudRain size={18} />, label: 'Rain Status', value: rainValue, color: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
    { icon: <ShieldAlert size={18} />, label: 'IR Security', value: !irConnected ? 'N/A' : lastReading.ir_status === 'detected' ? 'ALERT' : 'CLEAR', color: !irConnected ? '#94a3b8' : lastReading.ir_status === 'detected' ? '#ef4444' : '#22c55e', bg: !irConnected ? 'bg-slate-50' : lastReading.ir_status === 'detected' ? 'bg-red-50' : 'bg-slate-50', text: !irConnected ? 'text-slate-400' : lastReading.ir_status === 'detected' ? 'text-red-700' : 'text-slate-700', border: !irConnected ? 'border-slate-100' : lastReading.ir_status === 'detected' ? 'border-red-100' : 'border-slate-100' },
    { icon: <Volume2 size={18} />, label: 'Acoustics', value: !soundConnected ? 'N/A' : lastReading.sound_status === 'detected' ? 'NOISE' : 'SILENT', color: !soundConnected ? '#94a3b8' : lastReading.sound_status === 'detected' ? '#f59e0b' : '#64748b', bg: !soundConnected ? 'bg-slate-50' : lastReading.sound_status === 'detected' ? 'bg-amber-50' : 'bg-slate-50', text: !soundConnected ? 'text-slate-400' : lastReading.sound_status === 'detected' ? 'text-amber-700' : 'text-slate-700', border: !soundConnected ? 'border-slate-100' : lastReading.sound_status === 'detected' ? 'border-amber-100' : 'border-slate-100' },
  ] : [];

  // IR and Sound info cards — only show when sensors are connected AND triggered
  const irDetected = irConnected && lastReading?.ir_status === 'detected';
  const soundDetected = soundConnected && lastReading?.sound_status === 'detected';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
          <Activity size={11} /> Telemetry & Alerts
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
              <ShieldAlert size={22} strokeWidth={2.5} />
            </div>
            IoT <span className="text-[#2E6F40]">Alerts System</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Real-time telemetry monitoring and critical event protocols.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {farms.length > 0 && (
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedFarmId || ''}
                onChange={e => setSelectedFarmId(Number(e.target.value))}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all text-[11px] font-black uppercase tracking-widest text-slate-800 shadow-sm cursor-pointer"
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (ID: #{f.id})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E6F40] pointer-events-none">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          )}
          <button 
            onClick={handleRefresh} 
            disabled={refreshing} 
            className="inline-flex items-center justify-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(46,111,64,0.3)] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Sync Hardware
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: ACTIVE ALERTS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${alerts.length > 0 ? 'bg-red-500 text-white border-red-400' : 'bg-[#2E6F40] text-white border-[#2E6F40]/20'}`}>
                  <ShieldAlert size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Active Incidents</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Network Safety Protocol</p>
                </div>
              </div>
              {alerts.length > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-[18px] font-black text-red-600 leading-none">{alerts.length}</span>
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter">Detected</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-inner">
                  <div className="w-16 h-16 rounded-[2rem] bg-[#f0faf4] flex items-center justify-center mx-auto mb-4 border border-[#2E6F40]/10 text-[#2E6F40] shadow-sm animate-pulse">
                    <ShieldCheck size={32} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-[0.2em]">All Systems Nominal</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[180px] mx-auto leading-relaxed">Infrastructure reporting zero discrepancies.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, i) => {
                    const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.info;
                    return (
                      <div key={i} className="group relative bg-white border border-slate-200 rounded-[1.25rem] p-3.5 transition-all duration-300 hover:shadow-lg flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border border-slate-50 ${alert.level === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'} group-hover:rotate-6 transition-transform`}>
                          {alert.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{alert.sensor}</span>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${alert.level === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-tight truncate">{translateMessage(alert.message)}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-[#2E6F40] transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Security info cards */}
              {(irDetected || soundDetected) && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Visual & Acoustic Data</div>
                  {irDetected && (
                    <div className="flex items-center gap-3 p-3.5 bg-red-50/50 border border-red-100/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Eye size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Visual movement detected</span>
                    </div>
                  )}
                  {soundDetected && (
                    <div className="flex items-center gap-3 p-3.5 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Volume2 size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Acoustic vibration detected</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 🤖 AI RECOMMENDATIONS ── */}
          <div className="bg-gradient-to-br from-[#f0f0ff] to-[#e8eeff] rounded-[2.5rem] border border-indigo-200/60 shadow-[0_10px_40px_rgba(99,102,241,0.06)] overflow-hidden" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <div className="px-8 py-6 border-b border-indigo-200/40 flex items-center justify-between bg-white/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Bot size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">AI Recommendations</h3>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Gemini Intelligence Layer</p>
                </div>
              </div>
              {aiData?.generated_at && (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                    <Sparkles size={10} /> {_aiTimeAgo(aiData.generated_at)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              {aiLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Analyzing farm conditions…</p>
                </div>
              ) : !aiData || aiData.recommendations?.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white/60 rounded-[1.5rem] border border-indigo-100/50">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 border border-indigo-100 text-indigo-400">
                    <Sparkles size={26} strokeWidth={2} />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-700 mb-1 uppercase tracking-[0.15em]">No Advisories</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                    {aiData?.error || 'AI analysis will appear when sensor data is available.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiData.recommendations.map((rec, i) => {
                    const sev = _aiSeverityStyle(rec.severity);
                    const typeIcon = _aiTypeIcon(rec.type);
                    return (
                      <div key={i} className="group relative bg-white/80 backdrop-blur-sm border rounded-[1.25rem] p-4 transition-all duration-300 hover:shadow-lg hover:bg-white" style={{ borderColor: sev.border }}>
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: sev.iconBg, color: sev.iconColor }}>
                            {typeIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: sev.iconColor }}>
                                {rec.type.replace('_', ' ')}
                              </span>
                              <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: sev.badgeBg, color: sev.badgeText }}>
                                {rec.severity}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{rec.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: READINGS & HISTORY */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* LATEST READING */}
          <div className="bg-[#f8fafc] rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E6F40] text-white flex items-center justify-center shadow-lg shadow-[#2E6F40]/20">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Hardware Telemetry</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Downlink Real-time Data</p>
                </div>
              </div>
              {lastReading && (
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">{lastReading.recorded_at}</div>
                  <div className="flex items-center justify-end gap-1.5 text-[8px] font-black text-[#2E6F40] uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-[#2E6F40] rounded-full animate-ping" /> Synchronized
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              {!lastReading ? (
                <div className="text-center py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">No downlink data available</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {miniKpis.map((kpi, i) => (
                    <div key={i} className={`relative overflow-hidden group ${kpi.bg} ${kpi.border} border rounded-[1.5rem] p-4 transition-all duration-300 hover:shadow-xl hover:bg-white`}>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 bg-white shadow-sm ${kpi.text}`}>
                            {kpi.icon}
                          </div>
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">0{i + 1}</div>
                        </div>
                        <div className="text-lg font-black text-slate-900 tracking-tighter mb-1">{kpi.value}</div>
                        <div className={`text-[9px] font-black uppercase tracking-[0.15em] ${kpi.text}`}>{kpi.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALERT HISTORY */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Clock size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Incident Log</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive (Last 20)</span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100 text-slate-300">
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Registry is Empty</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Icon</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Incident Detail</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((entry, i) => {
                      const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
                      return (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{entry.icon}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">{translateMessage(entry.message)}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {entry.sensor} <span className="mx-1.5 opacity-30">|</span> {entry.triggered_at}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${entry.level === 'danger' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {entry.level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI HELPER FUNCTIONS ──
function _aiTimeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function _aiSeverityStyle(severity) {
  switch (severity) {
    case 'critical': return { border: '#fca5a5', iconBg: 'rgba(239,68,68,0.10)', iconColor: '#dc2626', badgeBg: '#fef2f2', badgeText: '#dc2626' };
    case 'warning': return { border: '#fcd34d', iconBg: 'rgba(245,158,11,0.10)', iconColor: '#d97706', badgeBg: '#fffbeb', badgeText: '#d97706' };
    default: return { border: '#a5b4fc', iconBg: 'rgba(99,102,241,0.10)', iconColor: '#6366f1', badgeBg: '#eef2ff', badgeText: '#6366f1' };
  }
}

function _aiTypeIcon(type) {
  switch (type) {
    case 'irrigation': return <Droplets size={16} strokeWidth={2.5} />;
    case 'weather': return <CloudRain size={16} strokeWidth={2.5} />;
    case 'crop_safety': return <Sprout size={16} strokeWidth={2.5} />;
    case 'security': return <ShieldAlert size={16} strokeWidth={2.5} />;
    default: return <Zap size={16} strokeWidth={2.5} />;
  }
}
