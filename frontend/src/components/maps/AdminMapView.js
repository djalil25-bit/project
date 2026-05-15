import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Truck, Sprout, Users, Eye } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Farm marker (green)
const farmMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#2E6F40"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
      <circle cx="14" cy="14" r="3.5" fill="#2E6F40"/>
    </svg>
  `),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

// Pending Farm marker (amber)
const pendingFarmMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#D97706"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
      <circle cx="14" cy="14" r="3.5" fill="#D97706"/>
    </svg>
  `),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});


// Fit all markers into view
function FitAllMarkers({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10, duration: 1 });
    }
  }, [markers, map]);
  return null;
}

/**
 * AdminMapView — Admin overview map showing farm locations.
 * Props:
 *   - farms: Array of { id, name, wilaya, commune, lat, lng, owner_name, status }
 *   - height: CSS height (default "500px")
 *   - onFarmClick: callback(farm)
 */
export default function AdminMapView({
  farms = [],
  height = '500px',
  onFarmClick,
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending'

  // Filter valid markers with GPS coordinates
  const validFarms = farms.filter(f => f.latitude && f.longitude);

  const filteredFarms = validFarms.filter(f => {
    if (filter === 'active') return f.status === 'ACTIVE';
    if (filter === 'pending') return f.status === 'PENDING';
    return true;
  });

  const allMarkers = filteredFarms.map(f => ({ lat: f.latitude, lng: f.longitude }));

  // Algeria center
  const defaultCenter = [28.0, 2.5];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#064e3b] border border-emerald-100 shadow-sm">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">National Asset Map</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {filteredFarms.length} Farms Visible
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
          {[
            { key: 'all', label: 'All', icon: <Users size={12} /> },
            { key: 'active', label: 'Active', icon: <div className="w-2 h-2 rounded-full bg-[#2E6F40]" /> },
            { key: 'pending', label: 'Pending', icon: <div className="w-2 h-2 rounded-full bg-[#D97706]" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ height }} className="relative">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {allMarkers.length > 0 && <FitAllMarkers markers={allMarkers} />}

          {/* Farm markers */}
          {filteredFarms.map(farm => (
            <Marker
              key={`farm-${farm.id}`}
              position={[farm.latitude, farm.longitude]}
              icon={farm.status === 'PENDING' ? pendingFarmMarkerIcon : farmMarkerIcon}
              eventHandlers={{ click: () => onFarmClick?.(farm) }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${farm.status === 'PENDING' ? 'bg-[#D97706]' : 'bg-[#2E6F40]'}`}>
                      <Sprout size={12} className="text-white" />
                    </div>
                    <div>
                      <div className={`text-[8px] font-black uppercase tracking-widest ${farm.status === 'PENDING' ? 'text-[#D97706]' : 'text-[#2E6F40]'}`}>
                        {farm.status === 'PENDING' ? 'Pending Farm' : 'Farm'}
                      </div>
                      <div className="text-xs font-black text-slate-800">{farm.name}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Owner</span>
                      <span className="font-black text-slate-700">{farm.owner_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Wilaya</span>
                      <span className="font-black text-slate-700">{farm.wilaya || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Status</span>
                      <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${
                        farm.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                        farm.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>{farm.status}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl px-4 py-3 shadow-lg space-y-2">
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2E6F40]" />
            <span className="text-[10px] font-bold text-slate-600">Active Farm ({validFarms.filter(f => f.status === 'ACTIVE').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D97706]" />
            <span className="text-[10px] font-bold text-slate-600">Pending Farm ({validFarms.filter(f => f.status === 'PENDING').length})</span>
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-1 right-2 z-[1000] text-[8px] text-slate-400 font-medium">
          © OpenStreetMap
        </div>
      </div>
    </div>
  );
}
