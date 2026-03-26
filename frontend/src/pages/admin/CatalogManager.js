import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Info, 
  X, 
  Save,
  ChevronRight,
  Search,
  Layers,
  Archive
} from 'lucide-react';

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
      try {
        await api.delete(`/catalog-products/${id}/`);
        fetchData();
      } catch (err) { alert('Deletion failed. Ensure no active listings reference this product.'); }
    }
  };

  return (
    <div className="catalog-manager-page">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <BookOpen className="text-primary me-3" size={32} /> Master Catalog
          </h1>
          <p className="page-subtitle text-muted">Standardize agricultural products and enforce price guardrails.</p>
        </div>
        <button className="btn-agr btn-primary px-4 d-flex align-items-center" onClick={() => { setEditingId(null); setShowModal(true); }}>
          <Plus size={18} className="me-2" /> Register Product
        </button>
      </div>

      <div className="agr-card overflow-hidden">
        <div className="agr-card-header bg-light-soft border-bottom p-3 d-flex justify-content-between align-items-center">
           <h3 className="h6 fw-bold mb-0 d-flex align-items-center">
              <Archive size={16} className="text-primary me-2" /> Available Standardized Units
           </h3>
           <span className="badge-agr badge-primary-soft">{catalog.length} Items</span>
        </div>
        {loading ? (
          <div className="flex-center py-5">
            <div className="spinner-agr"></div>
            <span className="ms-3 text-muted">Indexing catalog...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-agr table-hover">
              <thead>
                <tr>
                  <th>Product Identification</th>
                  <th>Domain</th>
                  <th>Price Ceiling/Floor</th>
                  <th>Index Price</th>
                  <th className="text-end">Operations</th>
                </tr>
              </thead>
              <tbody>
                {catalog.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                       <Search size={40} className="mb-3 opacity-25" />
                       <p>No catalog products defined. Start by registering your first SKU.</p>
                    </td>
                  </tr>
                ) : catalog.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-xs-circle bg-light-soft me-3"><Tag size={16} className="text-primary" /></div>
                        <div>
                           <div className="fw-bold text-dark">{item.name}</div>
                           <div className="very-small text-muted">{item.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                       <span className="badge-agr badge-outline-secondary">
                          <Layers size={12} className="me-1" />
                          {categories.find(c => c.id === item.category)?.name || 'Unmapped'}
                       </span>
                    </td>
                    <td>
                       <div className="small fw-medium">
                          <span className="text-danger-soft">Min: {item.min_price}</span>
                          <span className="mx-2 text-muted">|</span>
                          <span className="text-success-soft">Max: {item.max_price}</span>
                          <span className="ms-1 very-small text-muted">{item.unit}</span>
                       </div>
                    </td>
                    <td>
                       <div className="fw-bold text-primary">{item.official_price} <small className="very-small">DZD/{item.unit}</small></div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-icon text-primary" title="Update" onClick={() => handleEdit(item)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon text-danger" title="De-register" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay flex-center">
          <div className="modal-content agr-card border-primary p-0 animate-scale-in" style={{maxWidth: '600px', width: '95%'}}>
            <form onSubmit={handleSubmit} className="agr-form">
              <div className="modal-header border-bottom p-4 bg-light-soft d-flex justify-content-between align-items-center">
                <h3 className="h5 fw-bold mb-0 d-flex align-items-center">
                   <Plus className="text-primary me-2" size={20} />
                   {editingId ? 'Modify Catalog Entry' : 'New Catalog Registration'}
                </h3>
                <button type="button" className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              
              <div className="modal-body p-4">
                {error && (
                  <div className="alert-agr alert-danger mb-4 d-flex align-items-center">
                    <Info size={18} className="me-2" /> {error}
                  </div>
                )}
                
                <div className="form-group mb-3">
                  <label className="form-label small">Product Designation</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="form-group mb-3">
                  <label className="form-label small">Category Mapping</label>
                  <select className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Domain...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Floor Price (DZD)</label>
                    <input type="number" className="form-input" required value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Ceiling Price (DZD)</label>
                    <input type="number" className="form-input" required value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} />
                  </div>
                </div>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small">Reference Index Price</label>
                    <input type="number" className="form-input" required value={formData.official_price} onChange={e => setFormData({...formData, official_price: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Measurement Unit</label>
                    <input type="text" className="form-input" required placeholder="e.g. Metric Ton, kg" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label small">Technical Description</label>
                  <textarea className="form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              
              <div className="modal-footer border-top p-4 d-flex gap-3">
                <button type="submit" className="btn-agr btn-primary w-100 py-2 d-flex align-items-center justify-content-center" disabled={submitting}>
                  <Save size={18} className="me-2" /> {submitting ? 'Finalizing...' : 'Save Registry'}
                </button>
                <button type="button" className="btn-agr btn-outline-secondary w-100 py-2" onClick={() => setShowModal(false)}>
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
