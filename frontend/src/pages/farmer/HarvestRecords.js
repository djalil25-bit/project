import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

function HarvestRecords() {
  const [records, setRecords] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({ farm: '', crop_name: '', harvest_date: '', yield_quantity: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, fRes] = await Promise.all([api.get('/harvest-records/'), api.get('/farms/')]);
      setRecords(rRes.data.results || rRes.data);
      setFarms(fRes.data.results || fRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/harvest-records/', formData);
      setFormData({ farm: '', crop_name: '', harvest_date: '', yield_quantity: '', notes: '' });
      setSuccess('Harvest record added successfully!');
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to add record');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Harvest Records</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">🌾 Harvest Records</h1>
          <p className="page-subtitle">Track your farm production and harvests</p>
        </div>
      </div>

      {/* Add Record Form */}
      <div className="agr-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 className="agr-card-title" style={{ marginBottom: '1.25rem' }}>Add New Record</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Farm *</label>
              <select className="form-input" value={formData.farm} onChange={e => setFormData({ ...formData, farm: e.target.value })} required>
                <option value="">Select Farm...</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Crop Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Tomatoes" value={formData.crop_name} onChange={e => setFormData({ ...formData, crop_name: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Harvest Date *</label>
              <input type="date" className="form-input" value={formData.harvest_date} onChange={e => setFormData({ ...formData, harvest_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Yield Quantity (kg) *</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.yield_quantity} onChange={e => setFormData({ ...formData, yield_quantity: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input type="text" className="form-input" placeholder="Additional notes about harvest quality, conditions..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <button className="btn-agr btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : '+ Add Record'}
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="agr-card">
        <div className="agr-card-header">
          <h3 className="agr-card-title">Record History</h3>
        </div>
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : (
          <table className="agr-table">
            <thead>
              <tr><th>Crop</th><th>Farm</th><th>Harvest Date</th><th>Yield (kg)</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="5"><div className="table-empty"><div className="table-empty-icon">🌾</div><div className="table-empty-text">No harvest records yet.</div></div></td></tr>
              ) : records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.crop_name}</td>
                  <td>{farms.find(f => f.id === r.farm)?.name || '—'}</td>
                  <td>{r.harvest_date}</td>
                  <td style={{ fontWeight: 600 }}>{r.yield_quantity}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default HarvestRecords;
