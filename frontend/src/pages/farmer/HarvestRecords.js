import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Wheat, 
  Calendar, 
  ClipboardList, 
  PlusCircle, 
  History, 
  MapPin, 
  Tag, 
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

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
    <div className="harvest-records-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Harvest Management</span>
      </div>

      <div className="page-header mb-4">
        <h1 className="page-title d-flex align-items-center">
          <Wheat className="text-primary me-3" size={32} /> Harvest Logs
        </h1>
        <p className="page-subtitle text-muted">Maintain precise records of your farm yields and production cycles.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="agr-card p-4 h-100">
            <div className="d-flex align-items-center mb-4">
              <PlusCircle size={20} className="text-primary me-2" />
              <h3 className="h5 fw-bold mb-0">Record New Harvest</h3>
            </div>
            
            {error && (
              <div className="alert-agr alert-danger-agr mb-4 d-flex align-items-center small">
                <AlertTriangle size={14} className="me-2" /> {error}
              </div>
            )}
            {success && (
              <div className="alert-agr alert-success-agr mb-4 d-flex align-items-center small">
                <CheckCircle size={14} className="me-2" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="agr-form">
              <div className="form-group mb-3">
                <label className="form-label d-flex align-items-center">
                  <MapPin size={14} className="me-2 text-muted" /> Source Farm
                </label>
                <select className="form-input" value={formData.farm} onChange={e => setFormData({ ...formData, farm: e.target.value })} required>
                  <option value="">Select Origin...</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="form-label d-flex align-items-center">
                  <Tag size={14} className="me-2 text-muted" /> Crop Variety
                </label>
                <input type="text" className="form-input" placeholder="e.g. Organic Russet Potatoes" value={formData.crop_name} onChange={e => setFormData({ ...formData, crop_name: e.target.value })} required />
              </div>

              <div className="form-group mb-3">
                <label className="form-label d-flex align-items-center">
                  <Calendar size={14} className="me-2 text-muted" /> Collection Date
                </label>
                <input type="date" className="form-input" value={formData.harvest_date} onChange={e => setFormData({ ...formData, harvest_date: e.target.value })} required />
              </div>

              <div className="form-group mb-3">
                <label className="form-label d-flex align-items-center">
                  <Wheat size={14} className="me-2 text-muted" /> Yield Output (kg)
                </label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.yield_quantity} onChange={e => setFormData({ ...formData, yield_quantity: e.target.value })} required />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Quality Observations</label>
                <textarea 
                   className="form-input" 
                   placeholder="Notes on quality, size, color..." 
                   rows="3"
                   value={formData.notes} 
                   onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                />
              </div>

              <button className="btn-agr btn-primary w-100 py-2 d-flex align-items-center justify-content-center" type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : <><PlusCircle size={18} className="me-2" /> Log Harvest</>}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="agr-card h-100 overflow-hidden">
            <div className="agr-card-header d-flex justify-content-between align-items-center border-bottom">
              <div className="d-flex align-items-center">
                <History size={18} className="text-primary me-2" />
                <h3 className="h5 fw-bold mb-0">Production Archives</h3>
              </div>
              <div className="text-muted small fw-medium">{records.length} total entries</div>
            </div>
            {loading ? (
              <div className="flex-center py-5"><div className="spinner-agr" /></div>
            ) : (
              <div className="table-responsive">
                <table className="agr-table">
                  <thead>
                    <tr>
                      <th>Crop / Variety</th>
                      <th>Origin Farm</th>
                      <th>Collected On</th>
                      <th className="text-end">Yield (kg)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <div className="table-empty py-5">
                            <Wheat size={48} className="text-muted mb-3 opacity-25" />
                            <div className="table-empty-text font-medium text-muted">No harvest records indexed yet.</div>
                          </div>
                        </td>
                      </tr>
                    ) : records.map(r => (
                      <tr key={r.id}>
                        <td className="fw-bold text-dark">{r.crop_name}</td>
                        <td className="small text-muted">{farms.find(f => f.id === r.farm)?.name || 'Direct Entry'}</td>
                        <td>
                          <div className="d-flex align-items-center small">
                            <Calendar size={12} className="text-muted me-2" />
                            {new Date(r.harvest_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-end fw-bold text-primary">{r.yield_quantity}</td>
                        <td>
                           {r.notes ? (
                             <div className="text-muted very-small text-truncate" style={{ maxWidth: '150px' }} title={r.notes}>
                               {r.notes}
                             </div>
                           ) : <span className="text-muted opacity-50 very-small">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HarvestRecords;
