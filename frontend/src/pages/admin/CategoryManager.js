import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  Search,
  BookOpen,
  Info,
  X,
  PlusCircle
} from 'lucide-react';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '🌱' });
  const [editingId, setEditingId] = useState(null);
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
      if (editingId) {
        await api.patch(`/categories/${editingId}/`, formData);
        setSuccess('Category updated successfully.');
      } else {
        await api.post('/categories/', formData);
        setSuccess('Category registered successfully.');
      }
      setFormData({ name: '', description: '', icon: '🌱' });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save the category.');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '🌱'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will remove this classification category.')) return;
    try {
      await api.delete(`/categories/${id}/`);
      setSuccess('Category removed from registry.');
      fetchCategories();
    } catch { setError('Failed to decommission category.'); }
  };

  return (
    <div className="category-manager-page">
      <div className="agr-breadcrumb">
        <Link to="/admin-dashboard">Admin Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Product Classifications</span>
      </div>

      <div className="page-header mb-4">
        <div className="d-flex align-items-center">
          <Layers className="text-primary me-3" size={32} />
          <div>
            <h1 className="page-title">Domain Taxonomy</h1>
            <p className="page-subtitle text-muted">Initialize and manage standard categories for the product catalog.</p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="agr-card p-4 shadow-sm border-primary-soft">
            <h3 className="h6 fw-bold mb-4 d-flex align-items-center">
               <PlusCircle size={18} className="text-primary me-2" /> New Classification
            </h3>
            
            {error && (
              <div className="alert-agr alert-danger mb-4 py-2">
                <AlertCircle size={16} className="me-2" /> <span className="small">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="alert-agr alert-success mb-4 py-2">
                <CheckCircle size={16} className="me-2" /> <span className="small">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="agr-form">
              <div className="row g-2 mb-3">
                <div className="col-9">
                  <label className="form-label small">Domain Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Legumes" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="col-3">
                  <label className="form-label small">Icon</label>
                  <input type="text" className="form-input text-center" placeholder="🌱" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} maxLength="10" />
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label small">Taxonomic Description</label>
                <textarea className="form-input" style={{ minHeight: 100 }} placeholder="Scope of products included..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="d-flex gap-2">
                <button className={`btn-agr w-100 py-2 d-flex align-items-center justify-content-center ${editingId ? 'btn-success' : 'btn-primary'}`} type="submit" disabled={submitting}>
                  <Plus size={18} className="me-2" /> {submitting ? 'Saving...' : (editingId ? 'Update Domain' : 'Add Domain')}
                </button>
                <button className="btn-agr btn-icon-outline" type="button" title="Reset Form" onClick={() => { setFormData({ name: '', description: '', icon: '🌱' }); setEditingId(null); }}>
                  <X size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="agr-card overflow-hidden">
            <div className="agr-card-header bg-light-soft border-bottom p-3 d-flex justify-content-between align-items-center">
              <h3 className="h6 fw-bold mb-0 d-flex align-items-center">
                 <Layers size={16} className="text-primary me-2" /> Registered Taxonomy ({categories.length})
              </h3>
            </div>
            {loading ? (
              <div className="flex-center py-5">
                <div className="spinner-agr"></div>
                <span className="ms-3 text-muted">Calculating domains...</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table-agr h6 table-hover">
                  <thead>
                    <tr>
                      <th className="ps-4">Classification</th>
                      <th>Scope / Description</th>
                      <th className="text-end pe-4">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          <div className="table-empty py-5 text-center">
                             <Search size={40} className="text-muted mb-3 opacity-25" />
                             <p className="small text-muted mb-0">No taxonomic domains identified.</p>
                          </div>
                        </td>
                      </tr>
                    ) : categories.map(c => (
                      <tr key={c.id}>
                        <td className="ps-4">
                           <div className="d-flex align-items-center">
                             <span className="me-3 fs-5">{c.icon || '🌱'}</span>
                             <div className="fw-bold text-dark">{c.name}</div>
                           </div>
                        </td>
                        <td>
                           <div className="very-small text-muted lh-sm" style={{maxWidth: '300px'}}>
                              {c.description || <span className="fst-italic opacity-50">No scope defined</span>}
                           </div>
                        </td>
                        <td className="text-end pe-4">
                          <button className="btn-icon text-primary me-2" title="Edit" onClick={() => handleEdit(c)}>
                            <Layers size={16} />
                          </button>
                          <button className="btn-icon text-danger" title="Remove" onClick={() => handleDelete(c.id)}>
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
          
          <div className="mt-4 p-3 bg-light-soft rounded-lg d-flex align-items-center">
             <Info size={18} className="text-primary me-3 opacity-50" />
             <div className="very-small text-muted">
               Categories defined here are used to group products in the marketplace and for price index filtering.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
