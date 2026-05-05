import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getAlertBadges = (alerts) => {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {alerts.map((alert, idx) => {
        const bg = alert.level === 'danger' ? '#fef2f2' : alert.level === 'warning' ? '#fff7ed' : '#eff6ff';
        const color = alert.level === 'danger' ? '#dc2626' : alert.level === 'warning' ? '#ea580c' : '#2563eb';
        const border = alert.level === 'danger' ? '#fca5a5' : alert.level === 'warning' ? '#fdba74' : '#93c5fd';
        return (
          <span key={idx} style={{
            background: bg, color: color, border: `1px solid ${border}`,
            padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
          }}>
            {alert.icon} {alert.sensor}: {alert.message}
          </span>
        );
      })}
    </div>
  );
};

export default function FarmMap({ criticalFarms = [], warningFarms = [], normalFarms = [] }) {
  const center = [28.0, 2.5]; // Center of Algeria

  const renderFarms = (farms, color) => {
    return farms.map((farm, index) => {
      // fallback to center if lat/lng is somehow missing
      const lat = farm.latitude || 28.0;
      const lng = farm.longitude || 2.5;
      
      const reading = farm.last_reading || {};

      return (
        <Circle 
          key={`${farm.farm_id}-${index}`} 
          center={[lat, lng]} 
          color={color} 
          radius={40000} 
          fillOpacity={0.5}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0f172a' }}>🏡 {farm.farm_name}</h3>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#475569' }}>👤 Farmer: {farm.farmer_name}</p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#475569' }}>📍 {farm.wilaya}</p>
              
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', paddingBottom: '8px' }}>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>🌡️ Temp : {reading.temperature != null ? `${reading.temperature} °C` : 'N/A'}</div>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>💧 Humidity : {reading.humidity != null ? `${reading.humidity} %` : 'N/A'}</div>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>🌱 Soil : {reading.soil_moisture != null ? `${reading.soil_moisture} %` : 'N/A'}</div>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>🧪 pH : {reading.ph != null ? reading.ph : 'N/A'}</div>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>🌧️ Rain : {reading.rain_status || 'N/A'}</div>
              </div>

              {getAlertBadges(farm.alerts)}
            </div>
          </Popup>
        </Circle>
      );
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={center} zoom={5} style={{ height: '480px', width: '100%', borderRadius: '12px', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {renderFarms(criticalFarms, "#ef4444")}
        {renderFarms(warningFarms, "#f97316")}
        {renderFarms(normalFarms, "#22c55e")}
        
      </MapContainer>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>Farm Status</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', opacity: 0.5, border: '2px solid #ef4444' }}></span>
            Critical
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f97316', opacity: 0.5, border: '2px solid #f97316' }}></span>
            Warning
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', opacity: 0.5, border: '2px solid #22c55e' }}></span>
            Normal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></span>
            Not connected
          </div>
        </div>
      </div>
    </div>
  );
}
