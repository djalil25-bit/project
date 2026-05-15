import { WILAYA_DATA } from './algeria_locations';

const PRICING_DEFAULTS = {
  BASE_FEE: 500,
  PRICE_PER_KM: 15,
  WEIGHT_MODIFIER: 0.1, // DZD per kg/unit
  VEHICLE_MULTIPLIERS: {
    'standard': 1.0,
    'truck': 1.5,
    'van': 1.2,
    'refrigerated_truck': 2.0,
    'pickup': 0.8,
    'utility': 0.9
  }
};

/**
 * Calculates Haversine distance between two points in KM
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Fetches routing data from OSRM with Haversine fallback
 */
export async function getLogisticsData(pickup, destination) {
  // pickup: { lat, lng }, destination: { lat, lng }
  
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      return {
        distance_km: (route.distance / 1000).toFixed(1),
        duration_mins: Math.round(route.duration / 60),
        duration_text: formatDuration(route.duration / 60),
        method: 'osrm'
      };
    }
  } catch (error) {
    console.error("OSRM Error, falling back to Haversine:", error);
  }

  // Fallback to Haversine
  const distance = calculateHaversineDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
  // Add 30% to Haversine to simulate actual road distance
  const road_dist = distance * 1.3;
  const duration = (road_dist / 60) * 60; // Assume 60km/h average

  return {
    distance_km: road_dist.toFixed(1),
    duration_mins: Math.round(duration),
    duration_text: formatDuration(duration),
    method: 'haversine'
  };
}

function formatDuration(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Main pricing engine
 */
export function calculateAutomaticPrice(distance_km, quantity, vehicleType) {
  const multiplier = PRICING_DEFAULTS.VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
  
  const base = PRICING_DEFAULTS.BASE_FEE;
  const distCost = distance_km * PRICING_DEFAULTS.PRICE_PER_KM;
  const weightCost = quantity * PRICING_DEFAULTS.WEIGHT_MODIFIER;
  
  const total = (base + distCost + weightCost) * multiplier;
  
  return {
    total: Math.round(total),
    breakdown: {
      base,
      distance: Math.round(distCost),
      weight: Math.round(weightCost),
      multiplier
    }
  };
}

/**
 * Helper to get Wilaya GPS
 */
export function getWilayaCoords(wilayaName) {
  const w = WILAYA_DATA.find(d => d.name.toLowerCase() === wilayaName.toLowerCase());
  return w ? { lat: w.lat, lng: w.lng } : null;
}
