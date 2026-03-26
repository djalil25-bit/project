import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories/');
      setCategories(res.data.results || res.data);
    } catch { console.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/categories/', formData);
      setFormData({ name: '', description: '' });
      setSuccess('Category created successfully!');
      fetchCategories();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to create category.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}/`);
      setSuccess('Category deleted.');
      fetchCategories();
    } catch { setError('Failed to delete category.'); }
  };

  return (
    <div>
      <div className="agr-breadcrumb">
        <Link to="/admin-dashboard">Admin Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Categories</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">📂 Category Manager</h1>
          <p className="page-subtitle">Create and manage product categories</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="agr-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Add Category</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Vegetables" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" style={{ minHeight: 80 }} placeholder="Category description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn-agr btn-primary w-100" type="submit" disabled={submitting} style={{ justifyContent: 'center' }}>
                {submitting ? 'Creating...' : '+ Create Category'}
              </button>
              <button className="btn-agr btn-outline w-100" type="button" onClick={() => setFormData({ name: '', description: '' })} style={{ justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="agr-card">
          <div className="agr-card-header">
            <h3 className="agr-card-title">All Categories ({categories.length})</h3>
          </div>
          {loading ? (
            <div className="loading-wrapper"><div className="spinner" /></div>
          ) : (
            <table className="agr-table">
              <thead><tr><th>Name</th><th>Description</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan="3"><div className="table-empty"><div className="table-empty-icon">📂</div><div className="table-empty-text">No categories yet.</div></div></td></tr>
                ) : categories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{c.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-agr btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
