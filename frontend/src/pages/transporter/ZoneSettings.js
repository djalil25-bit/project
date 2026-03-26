import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

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
    } catch (err) { alert('Failed to save zones.'); }
  };

  const COMMON_ZONES = ['Algiers', 'Oran', 'Constantine', 'Setif', 'Annaba', 'Blida', 'Batna', 'Chlef', 'Djelfa'];

  return (
    <div className="zone-settings">
      <div className="agr-breadcrumb">
        <Link to="/transporter-dashboard">Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Service Zones</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Regional Service Areas</h1>
          <p className="page-subtitle">Define the geographic areas where you provide transportation services.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="agr-card p-4">
            <h3 className="h5 fw-bold mb-4">Your Active Coverage</h3>
            <div className="d-flex flex-wrap gap-2">
              {zones.length === 0 ? (
                <div className="text-center w-100 py-4 text-muted">No zones defined yet. Add a region below.</div>
              ) : zones.map(z => (
                <div key={z} className="badge bg-primary-100 text-primary p-2 px-3 rounded-pill d-flex align-items-center gap-2">
                  <span className="fw-bold fs-6">{z}</span>
                  <button className="btn-close" style={{fontSize: '0.8rem', padding: 0}} onClick={() => removeZone(z)}>×</button>
                </div>
              ))}
            </div>
            
            <form onSubmit={addZone} className="mt-5 pt-3 border-top">
              <label className="form-label fw-bold">Add Custom Region</label>
              <div className="d-flex gap-2">
                <input 
                  type="text" className="form-input" placeholder="Enter city or wilaya name..." 
                  value={newZone} onChange={e => setNewZone(e.target.value)} 
                />
                <button type="submit" className="btn-agr btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="agr-card p-4 glass-box">
            <h3 className="h5 fw-bold mb-3">Suggested Regions</h3>
            <p className="small text-muted mb-4">Quickly add major hubs to your service area:</p>
            <div className="d-flex flex-wrap gap-2">
              {COMMON_ZONES.filter(z => !zones.includes(z)).map(z => (
                <button 
                  key={z} 
                  className="btn btn-outline-secondary btn-sm rounded-pill"
                  onClick={() => {
                    const updated = [...new Set([...zones, z])];
                    saveZones(updated);
                  }}
                >
                  + {z}
                </button>
              ))}
            </div>
            {COMMON_ZONES.filter(z => !zones.includes(z)).length === 0 && (
              <div className="small text-success fw-bold">All suggested regions are in your list!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneSettings;
