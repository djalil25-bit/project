import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { Eye, Volume2, Wifi, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CARD_STYLES = {
  container: {
    display: 'grid',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  row4: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
  row3: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  card: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '1.25rem',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
  },
  emoji: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    display: 'block',
  },
  value: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: '#0f172a',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '0.25rem',
  },
  alert: {
    fontSize: '0.7rem',
    fontWeight: 800,
    marginTop: '0.4rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '0.5rem',
    display: 'inline-block',
  },
  badge: {
    fontSize: '0.6rem',
    fontWeight: 800,
    padding: '0.15rem 0.5rem',
    borderRadius: '0.4rem',
    display: 'inline-block',
    marginTop: '0.35rem',
  },
  noteText: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginTop: '0.3rem',
  },
};

function KpiCard({ emoji, icon, value, label, alert, alertColor, borderColor, badge, badgeColor, noteText }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...CARD_STYLES.card,
        ...(hovered ? CARD_STYLES.cardHover : {}),
        borderLeft: `4px solid ${borderColor || '#e2e8f0'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon ? (
        <div style={{ marginBottom: '0.5rem', color: borderColor || '#94a3b8' }}>{icon}</div>
      ) : (
        <span style={CARD_STYLES.emoji}>{emoji}</span>
      )}
      <div style={CARD_STYLES.value}>{value}</div>
      <div style={CARD_STYLES.label}>{label}</div>
      {alert && (
        <div
          style={{
            ...CARD_STYLES.alert,
            color: alertColor === 'red' ? '#dc2626' : alertColor === 'purple' ? '#7c3aed' : '#ea580c',
            backgroundColor: alertColor === 'red' ? '#fef2f2' : alertColor === 'purple' ? '#f5f3ff' : '#fff7ed',
            border: `1px solid ${alertColor === 'red' ? '#fecaca' : alertColor === 'purple' ? '#ddd6fe' : '#fed7aa'}`,
          }}
        >
          {alert}
        </div>
      )}
      {badge && (
        <div
          style={{
            ...CARD_STYLES.badge,
            color: badgeColor === 'gray' ? '#94a3b8' : '#fff',
            backgroundColor: badgeColor === 'gray' ? '#f1f5f9' : badgeColor,
            border: `1px solid ${badgeColor === 'gray' ? '#e2e8f0' : badgeColor}`,
          }}
        >
          {badge}
        </div>
      )}
      {noteText && (
        <div style={CARD_STYLES.noteText}>{noteText}</div>
      )}
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
  const rainValue = rainStatus === 'sec' ? 'Dry' : rainStatus === 'pluie' ? 'Raining' : '—';
  const rainEmoji = rainStatus === 'sec' ? '☀️' : rainStatus === 'pluie' ? '🌧️' : '—';
  const rainBorder = rainStatus === 'pluie' ? '#3b82f6' : rainStatus === 'sec' ? '#f59e0b' : '#94a3b8';

  // IR
  const irStatus = latest?.ir_status;
  const irValue = irStatus === 'detected' ? 'Detected!' : irStatus === 'clear' ? 'Clear' : '—';
  const irBorder = irStatus === 'detected' ? '#ef4444' : '#22c55e';
  const irAlert = irStatus === 'detected' ? '⚠️ Movement!' : null;

  // Sound
  const soundStatus = latest?.sound_status;
  const soundValue = soundStatus === 'detected' ? 'Detected!' : soundStatus === 'silent' ? 'Silent' : '—';
  const soundBorder = soundStatus === 'detected' ? '#f59e0b' : '#94a3b8';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
      borderRadius: '1.5rem',
      padding: '1.75rem',
      border: '1px solid #bbf7d0',
      boxShadow: '0 8px 30px rgba(34, 84, 61, 0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #22543d, #1a402e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(34, 84, 61, 0.3)',
        }}>
          <span style={{ fontSize: '1.2rem' }}>📡</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
            IoT Sensor Monitor
          </h3>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Farm ID: {farmId} — Last {readings.length} readings
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.7rem',
            background: '#dcfce7', border: '1px solid #86efac',
            borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800,
            color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            LIVE
          </div>
          <button
            onClick={fetchData}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '0.5rem',
              background: '#ffffff', border: '1px solid #e2e8f0',
              cursor: 'pointer', color: '#64748b',
              transition: 'all 0.2s',
            }}
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ROW 1 — 4 cards */}
      <div style={{ ...CARD_STYLES.container, ...CARD_STYLES.row4 }}>
        <KpiCard emoji="🌡️" value={tempValue} label="Temperature" borderColor={tempBorder} alert={tempAlert} alertColor={tempAlertColor} />
        <KpiCard emoji="💧" value={humValue} label="Air Humidity" borderColor="#3b82f6" />
        <KpiCard emoji="🌱" value={soilValue} label="Soil Moisture" alert={soilAlert} alertColor="red" borderColor={soilBorder} />
        <KpiCard emoji={rainEmoji} value={rainValue} label="Rain Status" borderColor={rainBorder} />
      </div>

      {/* ROW 2 — 3 cards */}
      <div style={{ ...CARD_STYLES.container, ...CARD_STYLES.row3 }}>
        <KpiCard icon={<Eye size={24} />} value={irValue} label="IR Detection" borderColor={irBorder} alert={irAlert} alertColor="red" />
        <KpiCard icon={<Volume2 size={24} />} value={soundValue} label="Sound / Vibration" borderColor={soundBorder} />
        <KpiCard emoji="🧪" value="N/A" label="pH Soil" borderColor="#e2e8f0" badge="No Sensor" badgeColor="gray" noteText="pH sensor not connected" />
      </div>

      {/* Chart */}
      <div style={{
        background: '#ffffff', borderRadius: '1rem', padding: '1.25rem',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📈 Sensor Trends
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={readings} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="recorded_at" tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: '0.82rem', fontWeight: 600 }} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 700 }} />
            <Line type="monotone" dataKey="temperature" stroke="#ff7300" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} name="Temperature (°C)" />
            <Line type="monotone" dataKey="humidity" stroke="#0088fe" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} name="Humidity (%)" />
            <Line type="monotone" dataKey="soil_moisture" stroke="#00C49F" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} name="Soil (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
