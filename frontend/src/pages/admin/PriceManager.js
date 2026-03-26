import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

function PriceManager() {
  const [publications, setPublications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({ category: '', effective_date: '', min_price: '', max_price: '', reference_price: '', unit: 'kg', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pubRes, catRes] = await Promise.all([api.get('/price-publications/'), api.get('/categories/')]);
      setPublications(pubRes.data.results || pubRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch { console.error('Failed to load price data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/price-publications/', formData);
      setFormData({ category: '', effective_date: '', min_price: '', max_price: '', reference_price: '', unit: 'kg', notes: '' });
      setSuccess('Price publication created!');
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to create publication.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this price publication?')) return;
    try {
      await api.delete(`/price-publications/${id}/`);
      setSuccess('Publication deleted.');
      fetchData();
    } catch { setError('Failed to delete.'); }
  };

  return (
    <div>
      <div className="agr-breadcrumb">
        <Link to="/admin-dashboard">Admin Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Official Prices</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Official Price Manager</h1>
          <p className="page-subtitle">Publish official market reference prices by category</p>
        </div>
      </div>

      {/* Form */}
      <div className="agr-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Publish New Price</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Effective Date *</label>
              <input type="date" className="form-input" value={formData.effective_date} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Price *</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.min_price} onChange={e => setFormData({ ...formData, min_price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Max Price *</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.max_price} onChange={e => setFormData({ ...formData, max_price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Reference Price *</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.reference_price} onChange={e => setFormData({ ...formData, reference_price: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                {['kg', 'g', 'ton', 'litre', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" placeholder="Source, comments..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn-agr btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : '📢 Publish Price'}
            </button>
            <button className="btn-agr btn-outline" type="button" onClick={() => setFormData({ category: '', effective_date: '', min_price: '', max_price: '', reference_price: '', unit: 'kg', notes: '' })}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="agr-card">
        <div className="agr-card-header">
          <h3 className="agr-card-title">Published Prices</h3>
        </div>
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : (
          <table className="agr-table">
            <thead><tr><th>Category</th><th>Effective Date</th><th>Min</th><th>Max</th><th>Reference</th><th>Unit</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {publications.length === 0 ? (
                <tr><td colSpan="7"><div className="table-empty"><div className="table-empty-icon">💰</div><div className="table-empty-text">No price publications yet.</div></div></td></tr>
              ) : publications.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{categories.find(c => c.id === p.category)?.name || p.category}</td>
                  <td>{p.effective_date}</td>
                  <td>${p.min_price}</td>
                  <td>${p.max_price}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${p.reference_price}</td>
                  <td>{p.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-agr btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PriceManager;
