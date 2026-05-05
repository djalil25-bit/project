import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';
import {
  Activity, RefreshCw, Shield, ShieldAlert, ShieldCheck,
  Thermometer, Droplets, Sprout, FlaskConical, CloudRain,
  ChevronRight, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';

const LEVEL_STYLES = {
  danger: {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '#fca5a5',
    text: '#dc2626',
    badgeBg: '#dc2626',
    badgeText: '#fff',
    iconBg: 'rgba(220, 38, 38, 0.12)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '#fcd34d',
    text: '#d97706',
    badgeBg: '#d97706',
    badgeText: '#fff',
    iconBg: 'rgba(217, 119, 6, 0.12)',
  },
  info: {
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#93c5fd',
    text: '#2563eb',
    badgeBg: '#2563eb',
    badgeText: '#fff',
    iconBg: 'rgba(37, 99, 235, 0.12)',
  },
};

function getRainDisplay(status) {
  switch (status) {
    case 'sec':     return { emoji: '☀️', text: 'Dry' };
    case 'humide':  return { emoji: '🌦️', text: 'Wet' };
    case 'pluie':   return { emoji: '🌧️', text: 'Raining' };
    default:        return { emoji: '—', text: '—' };
  }
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

  // Load farms on mount
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
          if (has_danger) {
            showToast('⚠️ Critical alerts detected on your farm!', 'error');
          } else if (alerts_count > 0) {
            showToast(`⚠️ ${alerts_count} alerts on your farm`, 'warning');
          } else {
            showToast('✅ All sensors are normal!', 'success');
          }
        }
      })
      .catch(err => console.error('[IoTAlerts] fetch error:', err))
      .finally(() => setRefreshing(false));
  }, [showToast]);

  // Fetch alerts when farm changes
  useEffect(() => {
    if (selectedFarmId) {
      setToastShown(false);
      fetchAlerts(selectedFarmId, false);
    }
  }, [selectedFarmId, fetchAlerts]);

  // Show toast ONCE after first load
  useEffect(() => {
    if (alertData && !toastShown) {
      setToastShown(true);
      const { alerts_count, has_danger } = alertData;
      if (has_danger) {
        showToast('⚠️ Critical alerts detected on your farm!', 'error');
      } else if (alerts_count > 0) {
        showToast(`⚠️ ${alerts_count} alerts on your farm`, 'warning');
      } else {
        showToast('✅ All sensors are normal!', 'success');
      }
    }
  }, [alertData, toastShown, showToast]);

  // Polling every 10 minutes
  useEffect(() => {
    if (!selectedFarmId) return;
    const interval = setInterval(() => fetchAlerts(selectedFarmId, true), 600000);
    return () => clearInterval(interval);
  }, [selectedFarmId, fetchAlerts]);

  const handleRefresh = () => {
    fetchAlerts(selectedFarmId, true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #22543d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading IoT data…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const alerts = alertData?.alerts || [];
  const lastReading = alertData?.last_reading;
  const rain = lastReading ? getRainDisplay(lastReading.rain_status) : { emoji: '—', text: '—' };

  const miniKpis = lastReading ? [
    { icon: <Thermometer size={16} />, label: 'Temperature', value: lastReading.temperature != null ? `${lastReading.temperature}°C` : '—', color: '#f97316' },
    { icon: <Droplets size={16} />, label: 'Humidity', value: lastReading.humidity != null ? `${lastReading.humidity}%` : '—', color: '#3b82f6' },
    { icon: <Sprout size={16} />, label: 'Soil', value: lastReading.soil_moisture != null ? `${lastReading.soil_moisture}%` : '—', color: '#22c55e' },
    { icon: <FlaskConical size={16} />, label: 'pH', value: lastReading.ph != null ? lastReading.ph.toFixed(1) : '—', color: '#8b5cf6' },
    { icon: <CloudRain size={16} />, label: 'Rain', value: `${rain.emoji} ${rain.text}`, color: '#06b6d4' },
  ] : [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* ── HEADER ─────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #22543d 0%, #1a402e 50%, #0f2d1e 100%)',
        borderRadius: '1.5rem',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(34, 84, 61, 0.25)',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 20, padding: '3px 10px', fontSize: '0.65rem',
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#86efac', marginBottom: '0.75rem',
            }}>
              <Activity size={11} /> IoT Monitoring
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              🌡️ IoT Alerts — My Farm
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.4rem' }}>
              Real-time monitoring of your farm sensors
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Farm Selector */}
            {farms.length > 1 && (
              <select
                value={selectedFarmId || ''}
                onChange={e => setSelectedFarmId(Number(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.75rem', padding: '0.5rem 0.75rem',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                  backdropFilter: 'blur(8px)', outline: 'none', cursor: 'pointer',
                }}
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id} style={{ color: '#000' }}>{f.name}</option>
                ))}
              </select>
            )}

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.75rem', padding: '0.55rem 1rem',
                color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                cursor: refreshing ? 'wait' : 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT COLUMN: ACTIVE ALERTS ──────── */}
        <div style={{
          background: '#fff',
          borderRadius: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <ShieldAlert size={18} style={{ color: alerts.length > 0 ? '#dc2626' : '#22c55e' }} />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
              Active Alerts
            </h3>
            {alerts.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: alertData?.has_danger ? '#dc2626' : '#d97706',
                color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                padding: '2px 8px', borderRadius: 20,
              }}>
                {alerts.length}
              </span>
            )}
          </div>

          <div style={{ padding: '0.75rem' }}>
            {alerts.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1rem',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '1rem',
                  background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', border: '1px solid #bbf7d0',
                }}>
                  <ShieldCheck size={28} style={{ color: '#16a34a' }} />
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontWeight: 800, color: '#166534', fontSize: '1rem' }}>
                  ✅ All good!
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, maxWidth: 240, margin: '0 auto' }}>
                  No alerts detected. All sensors are within normal ranges.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {alerts.map((alert, i) => {
                  const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.info;
                  return (
                    <div key={i} style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderRadius: '1rem',
                      padding: '1rem 1.15rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      transition: 'all 0.3s',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '0.75rem',
                        background: style.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.15rem', flexShrink: 0,
                      }}>
                        {alert.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: style.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                          {alert.sensor}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                          {alert.message}
                        </div>
                      </div>
                      <span style={{
                        background: style.badgeBg, color: style.badgeText,
                        fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 6, letterSpacing: '0.05em',
                      }}>
                        {alert.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── LAST READING KPI MINI-CARDS ─── */}
          <div style={{
            background: '#fff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Activity size={18} style={{ color: '#22543d' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Latest Reading
              </h3>
              {lastReading && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Clock size={12} /> {lastReading.recorded_at}
                </span>
              )}
            </div>

            {!lastReading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                No sensor data available
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem', padding: '1rem',
              }}>
                {miniKpis.map((kpi, i) => (
                  <div key={i} style={{
                    textAlign: 'center', padding: '0.75rem 0.5rem',
                    borderRadius: '0.75rem', background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '0.5rem',
                      background: `${kpi.color}15`, color: kpi.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 0.4rem',
                    }}>
                      {kpi.icon}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ALERT HISTORY ─────────────── */}
          <div style={{
            background: '#fff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Clock size={18} style={{ color: '#6366f1' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Alert History
              </h3>
              <span style={{
                marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                color: '#94a3b8', textTransform: 'uppercase',
              }}>
                Last 20
              </span>
            </div>

            {history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle size={28} style={{ color: '#22c55e', marginBottom: 8 }} />
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                  No alert history
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {history.map((entry, i) => {
                  const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1.25rem',
                      borderBottom: i < history.length - 1 ? '1px solid #f8fafc' : 'none',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{entry.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {entry.message}
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>
                          {entry.sensor} · {entry.triggered_at}
                        </div>
                      </div>
                      <span style={{
                        background: style.badgeBg, color: style.badgeText,
                        fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em',
                      }}>
                        {entry.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE GRID FIX ──────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1.4fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(5"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
