import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  Maximize, 
  Save, 
  FileText, 
  ChevronRight,
  ArrowLeft,
  Info
} from 'lucide-react';

function FarmForm() {
  const [formData, setFormData] = useState({ name: '', location: '', size_hectares: '', description: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/farms/', formData);
      navigate('/farmer-dashboard');
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save farm.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="farm-form-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Register Farm</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">Add New Farm Unit</h1>
          <p className="page-subtitle text-muted">Register your agricultural land to start selling your produce.</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-agr btn-outline d-flex align-items-center">
          <ArrowLeft size={16} className="me-2" /> Back
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="agr-card p-4 p-md-5">
            {error && (
              <div className="alert-agr alert-danger-agr mb-4 d-flex align-items-center">
                <Info size={18} className="me-3" />
                <div>{error}</div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="agr-form">
              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center">
                  <Home size={16} className="me-2 text-primary" /> Registered Farm Name *
                </label>
                <input 
                  type="text" name="name" className="form-input" 
                  placeholder="e.g. Ibrahim Family Orchards" 
                  onChange={handleChange} required 
                />
              </div>

              <div className="row">
                <div className="col-md-7">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center">
                      <MapPin size={16} className="me-2 text-primary" /> Regional Location *
                    </label>
                    <input 
                      type="text" name="location" className="form-input" 
                      placeholder="Province, District or City" 
                      onChange={handleChange} required 
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center">
                      <Maximize size={16} className="me-2 text-primary" /> Land Size (Hectares)
                    </label>
                    <input 
                      type="number" step="0.01" name="size_hectares" className="form-input" 
                      placeholder="0.00" onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center">
                  <FileText size={16} className="me-2 text-primary" /> Unit Description
                </label>
                <textarea 
                  name="description" className="form-input" 
                  placeholder="Tell us a bit about your soil, crops, or farming methods..." 
                  rows="4"
                  onChange={handleChange} 
                />
              </div>

              <div className="d-flex gap-3 pt-3">
                <button type="submit" className="btn-agr btn-primary px-4 d-flex align-items-center" disabled={loading}>
                  {loading ? 'Processing...' : <><Save size={18} className="me-2" /> Save Farm Details</>}
                </button>
                <button type="button" className="btn-agr btn-outline px-4" onClick={() => navigate('/farmer-dashboard')}>Discard</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmForm;
