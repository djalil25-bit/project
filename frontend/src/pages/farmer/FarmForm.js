import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';

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
    <div>
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Add Farm</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Farm</h1>
          <p className="page-subtitle">Register your farm on the AgriGov platform</p>
        </div>
      </div>

      <div className="agr-card" style={{ maxWidth: 600, padding: '2rem' }}>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Farm Name *</label>
            <input type="text" name="name" className="form-input" placeholder="e.g. Ibrahim Family Farm" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input type="text" name="location" className="form-input" placeholder="City or region" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Size (Hectares)</label>
            <input type="number" step="0.01" name="size_hectares" className="form-input" placeholder="e.g. 12.5" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" placeholder="Brief description of your farm..." onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-agr btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '🌾 Save Farm'}
            </button>
            <button type="button" className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FarmForm;
