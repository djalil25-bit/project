import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Navigation } from 'lucide-react';

// Fix default marker icon issue with webpack/react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom green marker for farms
const farmIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#2E6F40"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="5" fill="#2E6F40"/>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Click handler component
function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Fly-to component for centering
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

/**
 * LocationPicker — Interactive map for selecting a single GPS coordinate.
 * Props:
 *   - latitude, longitude: initial position (optional)
 *   - onLocationChange(lat, lng): callback when user clicks on map
 *   - height: CSS height string (default "280px")
 *   - disabled: if true, clicking is disabled
 */
export default function LocationPicker({ latitude, longitude, onLocationChange, height = '280px', disabled = false }) {
  // Default center: Algeria center (approx Algiers)
  const defaultCenter = [36.75, 3.06];
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = ({ lat, lng }) => {
    if (disabled) return;
    setPosition([lat, lng]);
    onLocationChange?.(lat, lng);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        onLocationChange?.(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
          <MapPin size={14} className="text-[#2E6F40]" />
          Pin Location on Map <span className="text-slate-400 lowercase font-medium">(click to place)</span>
        </label>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={locating || disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E6F40]/10 hover:bg-[#2E6F40]/20 text-[#2E6F40] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-[#2E6F40]/20 disabled:opacity-50"
        >
          {locating ? (
            <div className="w-3 h-3 rounded-full border-2 border-[#2E6F40] border-t-transparent animate-spin" />
          ) : (
            <Crosshair size={12} />
          )}
          {locating ? 'Locating...' : 'My Location'}
        </button>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm hover:border-[#2E6F40]/30 transition-colors"
        style={{ height }}
      >
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 13 : 6}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          {!disabled && <ClickHandler onLocationSelect={handleLocationSelect} />}
          {position && <Marker position={position} icon={farmIcon} />}
          {position && <FlyToLocation position={position} />}
        </MapContainer>

        {/* Coordinates overlay */}
        {position && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Navigation size={10} className="text-[#2E6F40]" />
              <span className="text-[10px] font-black text-slate-800 font-mono">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </span>
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="absolute bottom-1 right-2 z-[1000] text-[8px] text-slate-400 font-medium">
          © OpenStreetMap
        </div>
      </div>

      {!position && !disabled && (
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 ml-1">
          <MapPin size={10} /> Click on the map to place your farm's GPS pin, or use "My Location".
        </div>
      )}
    </div>
  );
}
