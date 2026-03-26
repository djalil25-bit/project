import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const CatalogManager = () => {
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', official_price: '', min_price: '', max_price: '', unit: 'kg' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, catProdRes] = await Promise.all([
        api.get('/categories/'),
        api.get('/catalog-products/')
      ]);
      setCategories(catRes.data.results || catRes.data);
      setCatalog(catProdRes.data.results || catProdRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/catalog-products/${editingId}/`, formData);
      } else {
        await api.post('/catalog-products/', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '', category: '', official_price: '', min_price: '', max_price: '', unit: 'kg' });
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save catalog product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      official_price: item.official_price,
      min_price: item.min_price,
      max_price: item.max_price,
      unit: item.unit
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will remove this product from the master catalog.')) {
      await api.delete(`/catalog-products/${id}/`);
      fetchData();
    }
  };

  return (
    <div className="catalog-manager">
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Product Catalog</h1>
          <p className="page-subtitle">Define products that farmers can list on the platform</p>
        </div>
        <button className="btn-agr btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }}>
          ➕ Add New Product
        </button>
      </div>

      <div className="agr-card">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : (
          <table className="agr-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Official Price</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="fw-bold">{item.name}</div>
                    <div className="text-muted small">{item.description?.substring(0, 40)}...</div>
                  </td>
                  <td>{categories.find(c => c.id === item.category)?.name || 'Unknown'}</td>
                  <td>{item.min_price} DZD</td>
                  <td>{item.max_price} DZD</td>
                  <td className="text-primary fw-bold">{item.official_price} DZD</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-agr btn-outline btn-sm me-2" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-agr btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-header">
                <h3>{editingId ? 'Edit Product' : 'Add to Catalog'}</h3>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              
              <div className="modal-body">
                {error && <div className="alert alert-danger mb-4">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Price (DZD)</label>
                    <input type="number" className="form-input" required value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Price (DZD)</label>
                    <input type="number" className="form-input" required value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Official Ref. Price</label>
                    <input type="number" className="form-input" required value={formData.official_price} onChange={e => setFormData({...formData, official_price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input type="text" className="form-input" required placeholder="e.g. kg" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn-agr btn-primary w-100" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-agr btn-outline w-100" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
