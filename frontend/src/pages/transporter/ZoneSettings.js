import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Map, 
  Plus, 
  X, 
  ChevronRight, 
  Globe,
  Navigation,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ZoneSettings = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setZones(res.data.service_zones || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addZone = async (e) => {
    e.preventDefault();
    if (!newZone.trim()) return;
    const updated = [...new Set([...zones, newZone.trim()])];
    saveZones(updated);
  };

  const removeZone = (zoneName) => {
    const updated = zones.filter(z => z !== zoneName);
    saveZones(updated);
  };

  const saveZones = async (updatedList) => {
    try {
      await api.patch('/auth/profile/', { service_zones: updatedList });
      setZones(updatedList);
      setNewZone('');
    } catch (err) { alert('Failed to save service registry zones.'); }
  };

  const COMMON_ZONES = ['Algiers', 'Oran', 'Constantine', 'Setif', 'Annaba', 'Blida', 'Batna', 'Chlef', 'Djelfa'];

  return (
    <div className="zone-settings-page">
      <div className="agr-breadcrumb">
        <Link to="/transporter-dashboard">Logistic Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Service Footprint</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <MapPin className="text-primary me-3" size={32} /> Operational Regions
          </h1>
          <p className="page-subtitle text-muted">Define the geographic sectors where your fleet maintains presence.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="agr-card p-4 p-md-5">
            <div className="d-flex align-items-center mb-4">
               <Navigation size={20} className="text-primary me-2" />
               <h3 className="h5 fw-bold mb-0">Active Coverage Map</h3>
            </div>
            
            <div className="d-flex flex-wrap gap-2 mb-4">
              {zones.length === 0 ? (
                <div className="text-center w-100 py-5 bg-light-soft rounded-lg">
                  <Globe size={48} className="text-muted mb-3 opacity-25" />
                  <p className="text-muted small fw-medium">No service sectors defined. Begin by adding a region.</p>
                </div>
              ) : zones.map(z => (
                <div key={z} className="zone-badge animate-scale-in">
                  <span className="fw-semibold small">{z}</span>
                  <button className="zone-remove-btn" onClick={() => removeZone(z)}><X size={14} /></button>
                </div>
              ))}
            </div>
            
            <form onSubmit={addZone} className="mt-5 pt-4 border-top">
              <label className="form-label small fw-bold text-uppercase text-muted mb-3">Add Custom Registry Area</label>
              <div className="d-flex gap-2">
                <input 
                  type="text" className="form-input" placeholder="Enter city or district name..." 
                  value={newZone} onChange={e => setNewZone(e.target.value)} 
                />
                <button type="submit" className="btn-agr btn-primary px-4 d-flex align-items-center">
                  <Plus size={18} className="me-2" /> Append
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="agr-card p-4 h-100">
            <div className="d-flex align-items-center mb-4">
               <Map size={20} className="text-primary me-2" />
               <h3 className="h5 fw-bold mb-0">Regional Hubs</h3>
            </div>
            <p className="small text-muted mb-4">Select major agricultural centers to quickly expand your service footprint.</p>
            
            <div className="d-flex flex-wrap gap-2">
              {COMMON_ZONES.filter(z => !zones.includes(z)).map(z => (
                <button 
                  key={z} 
                  className="btn-agr btn-outline btn-sm rounded-pill d-flex align-items-center"
                  onClick={() => {
                    const updated = [...new Set([...zones, z])];
                    saveZones(updated);
                  }}
                >
                  <Plus size={12} className="me-1" /> {z}
                </button>
              ))}
            </div>
            
            {COMMON_ZONES.filter(z => !zones.includes(z)).length === 0 && (
              <div className="bg-success-soft p-3 rounded-lg d-flex align-items-center mt-3">
                <CheckCircle size={16} className="text-success me-2" />
                <span className="very-small text-success fw-bold">All major hubs are within your service registry.</span>
              </div>
            )}

            <div className="mt-5 pt-4 border-top">
               <div className="d-flex align-items-center p-3 bg-light-soft rounded-lg">
                  <AlertCircle size={20} className="text-primary me-3 opacity-50" />
                  <div className="very-small text-muted">
                    Your availability is shown to buyers and farmers based on these selected sectors.
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneSettings;
