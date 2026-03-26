import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  Info, 
  X,
  AlertCircle,
  ShieldCheck,
  Ship,
  Bike
} from 'lucide-react';

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

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorcycle': return <Bike size={18} />;
      default: return <Truck size={18} />;
    }
  };

  return (
    <div className="vehicle-settings-page">
      <div className="agr-breadcrumb">
        <Link to="/transporter-dashboard">Logistic Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Fleet Registry</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <Truck className="text-primary me-3" size={32} /> Managed Fleet
          </h1>
          <p className="page-subtitle text-muted">Register and monitor transport units for marketplace logistics.</p>
        </div>
        <button 
           className={`btn-agr ${showForm ? 'btn-outline-danger' : 'btn-primary'} px-4 d-flex align-items-center`} 
           onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><X size={18} className="me-2" /> Discard</> : <><Plus size={18} className="me-2" /> Add Unit</>}
        </button>
      </div>

      <div className="row g-4">
        <div className={showForm ? "col-lg-8" : "col-lg-12"}>
          <div className="agr-card overflow-hidden">
            <div className="agr-card-header bg-light-soft border-bottom">
              <h3 className="h6 fw-bold mb-0 d-flex align-items-center">
                <ShieldCheck size={16} className="text-primary me-2" /> Active Vehicle Inventory
              </h3>
            </div>
            {loading ? (
              <div className="flex-center py-5">
                <div className="spinner-agr"></div>
                <span className="ms-3 text-muted">Retrieving fleet data...</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table-agr table-hover">
                  <thead>
                    <tr>
                      <th>Configuration</th>
                      <th>Plate Designation</th>
                      <th>Payload Limit</th>
                      <th className="text-end">Maintenance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <div className="table-empty py-5 text-center">
                             <Truck size={48} className="text-muted mb-3 opacity-25" />
                             <h4 className="h5 text-muted">No units registered</h4>
                             <p className="small text-muted mb-0">Assemble your fleet to begin receiving cargo assignments.</p>
                          </div>
                        </td>
                      </tr>
                    ) : vehicles.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-xs-circle bg-light-soft me-3">{getVehicleIcon(v.type)}</div>
                            <div>
                               <div className="fw-bold text-dark">{v.type}</div>
                               <div className="very-small text-muted">{v.model}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge-agr badge-outline-secondary font-monospace">{v.plate}</span></td>
                        <td><span className="fw-bold text-primary">{v.capacity} <small className="text-muted">kg</small></span></td>
                        <td className="text-end">
                          <button className="btn-icon text-danger" title="Decommission" onClick={() => removeVehicle(v.id)}>
                            <Trash2 size={16} />
                          </button>
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
          <div className="col-lg-4 animate-slide-in">
            <div className="agr-card p-4 shadow-sm border-primary-soft">
              <div className="d-flex align-items-center mb-4">
                 <Plus size={20} className="text-primary me-2" />
                 <h3 className="h5 fw-bold mb-0">New Unit Registry</h3>
              </div>
              <form onSubmit={handleSubmit} className="agr-form">
                <div className="form-group mb-3">
                  <label className="form-label small">Class / Category</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option>Truck</option>
                    <option>Van</option>
                    <option>Pickup</option>
                    <option>Motorcycle</option>
                    <option>Cooled Container</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label small">Model Specification</label>
                  <input type="text" className="form-input" placeholder="e.g. Isuzu Forward 5T" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label small">Registry Plate</label>
                  <input type="text" className="form-input font-monospace" placeholder="12345-678-01" required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label small">Cargo Capacity (kg)</label>
                  <input type="number" className="form-input" placeholder="0" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>
                <button type="submit" className="btn-agr btn-primary w-100 py-2 d-flex align-items-center justify-content-center">
                  <Save size={18} className="me-2" /> Finalize Registry
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSettings;
