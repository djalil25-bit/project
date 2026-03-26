import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Info, 
  X,
  Send,
  ChevronRight,
  Database,
  Tag
} from 'lucide-react';

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
      setSuccess('Market price index updated successfully.');
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to publish price data.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will remove this official price index entry.')) return;
    try {
      await api.delete(`/price-publications/${id}/`);
      setSuccess('Publication archived.');
      fetchData();
    } catch { setError('Failed to archive publication.'); }
  };

  return (
    <div className="price-manager-page">
      <div className="agr-breadcrumb">
        <Link to="/admin-dashboard">Admin Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Price Indexing</span>
      </div>

      <div className="page-header mb-4">
        <div className="d-flex align-items-center">
          <TrendingUp className="text-primary me-3" size={32} />
          <div>
            <h1 className="page-title">Market Price Surveillance</h1>
            <p className="page-subtitle text-muted">Publish official wholesale reference prices to stabilize platform trade.</p>
          </div>
        </div>
      </div>

      <div className="agr-card p-4 p-md-5 mb-4 shadow-sm border-primary-soft">
        <h3 className="h6 fw-bold mb-4 d-flex align-items-center text-dark">
           <Plus size={18} className="text-primary me-2" /> New Index Publication
        </h3>
        
        {error && (
          <div className="alert-agr alert-danger mb-4 d-flex align-items-center">
             <AlertCircle size={18} className="me-2" /> {error}
          </div>
        )}
        {success && (
          <div className="alert-agr alert-success mb-4 d-flex align-items-center">
             <CheckCircle size={18} className="me-2" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="agr-form overflow-hidden">
          <div className="row g-3 mb-3">
            <div className="col-md-6 text-start">
              <label className="form-label small fw-bold">Target Category *</label>
              <div className="input-group-agr">
                <Tag size={16} className="input-icon" />
                <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                  <option value="">Select Classification...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-6 text-start">
              <label className="form-label small fw-bold">Effective From *</label>
              <div className="input-group-agr">
                <Calendar size={16} className="input-icon" />
                <input type="date" className="form-input" value={formData.effective_date} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} required />
              </div>
            </div>
          </div>
          
          <div className="row g-3 mb-3">
            <div className="col-md-4 text-start">
              <label className="form-label small fw-bold">Safety Min (DZD)</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.min_price} onChange={e => setFormData({ ...formData, min_price: e.target.value })} required />
            </div>
            <div className="col-md-4 text-start">
              <label className="form-label small fw-bold">Safety Max (DZD)</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.max_price} onChange={e => setFormData({ ...formData, max_price: e.target.value })} required />
            </div>
            <div className="col-md-4 text-start">
              <label className="form-label small fw-bold">Market Average (DZD)</label>
              <div className="input-group-agr border-primary-soft">
                <DollarSign size={16} className="input-icon text-primary" />
                <input type="number" step="0.01" className="form-input fw-bold text-primary" placeholder="0.00" value={formData.reference_price} onChange={e => setFormData({ ...formData, reference_price: e.target.value })} required />
              </div>
            </div>
          </div>
          
          <div className="row g-3 mb-4">
            <div className="col-md-4 text-start">
              <label className="form-label small fw-bold">Trading Unit</label>
              <select className="form-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                 {['kg', 'quintal', 'ton', 'box', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-md-8 text-start">
              <label className="form-label small fw-bold">Publication Annotations</label>
              <input type="text" className="form-input" placeholder="e.g. Based on Wholesale Algiers reports..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          
          <div className="d-flex gap-3">
            <button className="btn-agr btn-primary px-5 py-2 d-flex align-items-center" type="submit" disabled={submitting}>
              <Send size={18} className="me-2" /> {submitting ? 'Transmitting...' : 'Authorize Publication'}
            </button>
            <button className="btn-agr btn-outline-secondary px-4 py-2" type="button" onClick={() => setFormData({ category: '', effective_date: '', min_price: '', max_price: '', reference_price: '', unit: 'kg', notes: '' })}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      <div className="agr-card overflow-hidden">
        <div className="agr-card-header bg-light-soft border-bottom p-3 d-flex justify-content-between align-items-center">
          <h3 className="h6 fw-bold mb-0 d-flex align-items-center text-dark">
             <Database size={16} className="text-primary me-2" /> Historic Price Registry
          </h3>
          <span className="badge-agr badge-primary-soft">{publications.length} Indices</span>
        </div>
        {loading ? (
          <div className="flex-center py-5">
             <div className="spinner-agr"></div>
             <span className="ms-3 text-muted">Retrieving index data...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-agr table-hover">
              <thead>
                <tr>
                  <th className="ps-4">Classification</th>
                  <th>Valid From</th>
                  <th>Safe Range</th>
                  <th>Reference</th>
                  <th>Unit</th>
                  <th className="text-end pe-4">Operations</th>
                </tr>
              </thead>
              <tbody>
                {publications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                       <TrendingUp size={40} className="mb-3 opacity-25" />
                       <p className="small mb-0">No price publications on record.</p>
                    </td>
                  </tr>
                ) : publications.map(p => (
                  <tr key={p.id}>
                    <td className="ps-4">
                       <span className="fw-bold text-dark">{categories.find(c => c.id === p.category)?.name || 'Unknown'}</span>
                    </td>
                    <td><span className="small text-muted">{p.effective_date}</span></td>
                    <td>
                       <span className="very-small text-muted">{p.min_price} DZD</span>
                       <span className="mx-1 opacity-25">→</span>
                       <span className="very-small text-muted">{p.max_price} DZD</span>
                    </td>
                    <td><span className="fw-bold text-primary">{p.reference_price} DZD</span></td>
                    <td><span className="badge-agr badge-light small">{p.unit}</span></td>
                    <td className="text-end pe-4">
                      <button className="btn-icon text-danger" title="Evict Publication" onClick={() => handleDelete(p.id)}>
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
           Farmers cannot list products outside the specified Min/Max range of the latest publication for each category.
         </div>
      </div>
    </div>
  );
}

export default PriceManager;
