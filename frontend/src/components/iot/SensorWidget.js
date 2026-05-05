import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CARD_STYLES = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
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
};

function KpiCard({ emoji, value, label, alert, alertColor, borderColor }) {
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
      <span style={CARD_STYLES.emoji}>{emoji}</span>
      <div style={CARD_STYLES.value}>{value}</div>
      <div style={CARD_STYLES.label}>{label}</div>
      {alert && (
        <div
          style={{
            ...CARD_STYLES.alert,
            color: alertColor === 'red' ? '#dc2626' : '#ea580c',
            backgroundColor: alertColor === 'red' ? '#fef2f2' : '#fff7ed',
            border: `1px solid ${alertColor === 'red' ? '#fecaca' : '#fed7aa'}`,
          }}
        >
          {alert}
        </div>
      )}
    </div>
  );
}

function getRainDisplay(status) {
  switch (status) {
    case 'sec':     return { emoji: '☀️', text: 'Dry',    color: '#f59e0b' };
    case 'humide':  return { emoji: '🌦️', text: 'Wet', color: '#3b82f6' };
    case 'pluie':   return { emoji: '🌧️', text: 'Raining',  color: '#6366f1' };
    default:        return { emoji: '—',  text: '—',      color: '#94a3b8' };
  }
}

export default function SensorWidget({ farmId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    if (!farmId) return;
    api.get(`/iot/data/${farmId}/`)
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('[SensorWidget] fetch error:', err);
        setError('Unable to load sensor data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000); // refresh every 10 min
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

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

  if (error || data.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📡</div>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', margin: '0 0 0.5rem' }}>
          No sensor data available
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, maxWidth: 320, margin: '0 auto' }}>
          Connect your ESP32 to start receiving real-time farm data. Sensors report every 10 minutes.
        </p>
      </div>
    );
  }

  // Latest reading for KPI cards
  const latest = data[data.length - 1];
  const rain = getRainDisplay(latest.rain_status);

  // Build KPI data
  const soilAlert = latest.soil_moisture != null && latest.soil_moisture < 30
    ? '⚠️ Irrigate!' : null;
  const phAlert = latest.ph != null
    ? (latest.ph < 6 ? '⚠️ Acidic' : latest.ph > 7.5 ? '⚠️ Alkaline' : null)
    : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
      borderRadius: '1.5rem',
      padding: '1.75rem',
      border: '1px solid #bbf7d0',
      boxShadow: '0 8px 30px rgba(34, 84, 61, 0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
            Live farm telemetry — Last {data.length} readings
          </span>
        </div>
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.7rem',
          background: '#dcfce7', border: '1px solid #86efac',
          borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800,
          color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Online
        </div>
      </div>

      {/* KPI Cards */}
      <div style={CARD_STYLES.container}>
        <KpiCard
          emoji="🌡️"
          value={latest.temperature != null ? `${latest.temperature}°C` : '—'}
          label="Temperature"
          borderColor="#f97316"
        />
        <KpiCard
          emoji="💧"
          value={latest.humidity != null ? `${latest.humidity}%` : '—'}
          label="Air Humidity"
          borderColor="#3b82f6"
        />
        <KpiCard
          emoji="🌱"
          value={latest.soil_moisture != null ? `${latest.soil_moisture}%` : '—'}
          label="Soil Moisture"
          alert={soilAlert}
          alertColor="red"
          borderColor={latest.soil_moisture != null && latest.soil_moisture < 30 ? '#ef4444' : '#22c55e'}
        />
        <KpiCard
          emoji="🧪"
          value={latest.ph != null ? latest.ph.toFixed(1) : '—'}
          label="Soil pH"
          alert={phAlert}
          alertColor="orange"
          borderColor={latest.ph != null ? (latest.ph < 6 || latest.ph > 7.5 ? '#f59e0b' : '#8b5cf6') : '#8b5cf6'}
        />
        <KpiCard
          emoji={rain.emoji}
          value={rain.text}
          label="Rain"
          borderColor={rain.color}
        />
      </div>

      {/* Recharts Line Chart */}
      <div style={{
        background: '#ffffff',
        borderRadius: '1rem',
        padding: '1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      }}>
        <h4 style={{
          margin: '0 0 1rem',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          📈 Sensor Trends
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="recorded_at"
              tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.75rem', fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ff7300"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="Temperature (°C)"
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#0088fe"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="Humidity (%)"
            />
            <Line
              type="monotone"
              dataKey="soil_moisture"
              stroke="#00C49F"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="Soil (%)"
            />
            <Line
              type="monotone"
              dataKey="ph"
              stroke="#8884d8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              name="pH"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
