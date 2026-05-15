import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, Truck, Route } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pickup marker (green)
const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#10B981"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#10B981">P</text>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Custom destination marker (indigo)
const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#4F46E5"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#4F46E5">D</text>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Auto-fit bounds
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1 });
    }
  }, [bounds, map]);
  return null;
}

/**
 * MissionRouteMap — Displays pickup→destination route with OSRM routing.
 * Props:
 *   - pickupCoords: [lat, lng] or { lat, lng }
 *   - destinationCoords: [lat, lng] or { lat, lng }
 *   - pickupLabel: string
 *   - destinationLabel: string
 *   - height: CSS height (default "300px")
 *   - onRouteCalculated: callback({ distance_km, duration_min }) 
 */
export default function MissionRouteMap({
  pickupCoords,
  destinationCoords,
  pickupLabel = 'Pickup',
  destinationLabel = 'Destination',
  height = '300px',
  onRouteCalculated,
}) {
  const [routeLine, setRouteLine] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normalize coords to [lat, lng]
  const normalizeCoords = (c) => {
    if (!c) return null;
    if (Array.isArray(c)) return c;
    if (c.lat !== undefined && c.lng !== undefined) return [c.lat, c.lng];
    return null;
  };

  const pickup = normalizeCoords(pickupCoords);
  const destination = normalizeCoords(destinationCoords);

  useEffect(() => {
    if (!pickup || !destination) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);
      try {
        // OSRM expects lng,lat (reversed from Leaflet's lat,lng)
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          // GeoJSON coords are [lng, lat], flip to [lat, lng] for Leaflet
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteLine(coords);

          const info = {
            distance_km: (route.distance / 1000).toFixed(1),
            duration_min: Math.round(route.duration / 60),
          };
          setRouteInfo(info);
          onRouteCalculated?.(info);
        } else {
          setError('Route not found');
          // Fallback: straight line
          setRouteLine([pickup, destination]);
          const straightDist = calcStraightDistance(pickup, destination);
          const info = { distance_km: straightDist.toFixed(1), duration_min: Math.round(straightDist * 1.3) };
          setRouteInfo(info);
          onRouteCalculated?.(info);
        }
      } catch (err) {
        setError('Route service unavailable');
        setRouteLine([pickup, destination]);
        const straightDist = calcStraightDistance(pickup, destination);
        const info = { distance_km: straightDist.toFixed(1), duration_min: Math.round(straightDist * 1.3) };
        setRouteInfo(info);
        onRouteCalculated?.(info);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup?.[0], pickup?.[1], destination?.[0], destination?.[1]]); // eslint-disable-line

  // Haversine formula for fallback distance
  function calcStraightDistance(p1, p2) {
    const R = 6371;
    const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
    const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1[0] * Math.PI) / 180) *
        Math.cos((p2[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  if (!pickup || !destination) {
    return (
      <div 
        className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400"
        style={{ height }}
      >
        <Route size={32} className="text-slate-300" />
        <span className="text-xs font-black uppercase tracking-widest">No GPS coordinates available</span>
        <span className="text-[10px] font-medium text-slate-400">Route map requires pickup & destination coordinates.</span>
      </div>
    );
  }

  const bounds = [pickup, destination];
  const center = [(pickup[0] + destination[0]) / 2, (pickup[1] + destination[1]) / 2];

  return (
    <div className="space-y-3">
      {/* Route Info Bar */}
      {routeInfo && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 shadow-sm">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Truck size={12} />
            </div>
            <div>
              <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Distance</div>
              <div className="text-sm font-black text-slate-900">{routeInfo.distance_km} km</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 shadow-sm">
            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Clock size={12} />
            </div>
            <div>
              <div className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Est. Duration</div>
              <div className="text-sm font-black text-slate-900">
                {routeInfo.duration_min >= 60
                  ? `${Math.floor(routeInfo.duration_min / 60)}h ${routeInfo.duration_min % 60}m`
                  : `${routeInfo.duration_min} min`}
              </div>
            </div>
          </div>
          {error && (
            <div className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
              ⚠ Estimated (straight line)
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md"
        style={{ height }}
      >
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Calculating Route...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={center}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />

          <Marker position={pickup} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Pickup</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{pickupLabel}</div>
              </div>
            </Popup>
          </Marker>

          <Marker position={destination} icon={destinationIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Destination</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{destinationLabel}</div>
              </div>
            </Popup>
          </Marker>

          {routeLine.length > 0 && (
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: '#4F46E5',
                weight: 4,
                opacity: 0.8,
                dashArray: routeLine.length === 2 ? '10, 10' : null,
              }}
            />
          )}
        </MapContainer>

        {/* Legend */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Destination</span>
          </div>
        </div>

        {/* OSM Attribution */}
        <div className="absolute bottom-1 right-2 z-[1000] text-[8px] text-slate-400 font-medium">
          © OpenStreetMap
        </div>
      </div>
    </div>
  );
}
