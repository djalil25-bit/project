import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

const VehicleSettings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ plate: '', model: '', capacity: '', type: 'Truck' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setVehicles(res.data.vehicles || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = [...vehicles, { ...formData, id: Date.now() }];
    saveVehicles(updated);
  };

  const removeVehicle = (id) => {
    const updated = vehicles.filter(v => v.id !== id);
    saveVehicles(updated);
  };

  const saveVehicles = async (updatedList) => {
    try {
      await api.patch('/auth/profile/', { vehicles: updatedList });
      setVehicles(updatedList);
      setShowForm(false);
      setFormData({ plate: '', model: '', capacity: '', type: 'Truck' });
    } catch (err) { alert('Failed to save fleet change.'); }
  };

  return (
    <div className="vehicle-settings">
      <div className="agr-breadcrumb">
        <Link to="/transporter-dashboard">Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>My Fleet</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Management</h1>
          <p className="page-subtitle">Add and manage your transport vehicles for logistical assignments.</p>
        </div>
        <button className="btn-agr btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '➕ Add Vehicle'}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="agr-card">
            {loading ? (
              <div className="loading-wrapper py-5"><div className="spinner" /></div>
            ) : (
              <div className="table-responsive">
                <table className="agr-table">
                  <thead>
                    <tr>
                      <th>Vehicle Info</th>
                      <th>Plate Number</th>
                      <th>Max Capacity</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr><td colSpan="4"><div className="table-empty py-5"><div className="table-empty-icon">🚛</div><div className="table-empty-text">No vehicles registered. Add your first vehicle to start accepting missions.</div></div></td></tr>
                    ) : vehicles.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div className="fw-bold">{v.type} - {v.model}</div>
                        </td>
                        <td><span className="badge bg-light text-dark">{v.plate}</span></td>
                        <td>{v.capacity} kg</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-agr btn-danger btn-sm" onClick={() => removeVehicle(v.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="col-lg-4">
            <div className="agr-card p-4 animate-slide-in">
              <h3 className="h5 fw-bold mb-3">Register New Vehicle</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Truck</option>
                    <option>Van</option>
                    <option>Pickup</option>
                    <option>Motorcycle</option>
                    <option>Car</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Model Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Toyota Hilux" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Plate Number</label>
                  <input type="text" className="form-input" placeholder="ABC-1234" required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (kg)</label>
                  <input type="number" className="form-input" placeholder="1500" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>
                <button type="submit" className="btn-agr btn-primary w-100 mt-2">💾 Save Vehicle</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSettings;
