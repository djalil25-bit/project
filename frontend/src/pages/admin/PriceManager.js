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
    <div className="min-h-screen p-6 space-y-6 anim-fade-up">

      {/* ── Breadcrumb ────────────────────────────────── */}
      <div className="adm-breadcrumb">
        <Link to="/admin-dashboard">Admin Hub</Link>
        <ChevronRight size={12} className="text-slate-600" />
        <span className="text-slate-500">Price Indexing</span>
      </div>

      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <TrendingUp className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">Market Price Surveillance</h1>
          <p className="text-slate-500 text-sm">Publish official wholesale reference prices to stabilize platform trade.</p>
        </div>
      </div>

      {/* ── Publication Form ──────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
          <Plus size={16} className="text-emerald-400" /> New Index Publication
        </h3>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">Target Category *</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  className="adm-input pl-9"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Classification...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="adm-label">Effective From *</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  className="adm-input pl-9"
                  value={formData.effective_date}
                  onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="adm-label">Safety Min (DZD)</label>
              <input type="number" step="0.01" className="adm-input" placeholder="0.00" value={formData.min_price} onChange={e => setFormData({ ...formData, min_price: e.target.value })} required />
            </div>
            <div>
              <label className="adm-label">Safety Max (DZD)</label>
              <input type="number" step="0.01" className="adm-input" placeholder="0.00" value={formData.max_price} onChange={e => setFormData({ ...formData, max_price: e.target.value })} required />
            </div>
            <div>
              <label className="adm-label">Market Average (DZD)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input type="number" step="0.01" className="adm-input pl-9 font-bold text-emerald-400" placeholder="0.00" value={formData.reference_price} onChange={e => setFormData({ ...formData, reference_price: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="adm-label">Trading Unit</label>
              <select className="adm-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                {['kg', 'quintal', 'ton', 'box', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="adm-label">Publication Annotations</label>
              <input type="text" className="adm-input" placeholder="e.g. Based on Wholesale Algiers reports..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="adm-btn adm-btn-primary px-7 py-2.5" type="submit" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Transmitting...' : 'Authorize Publication'}
            </button>
            <button
              className="adm-btn adm-btn-ghost px-5"
              type="button"
              onClick={() => setFormData({ category: '', effective_date: '', min_price: '', max_price: '', reference_price: '', unit: 'kg', notes: '' })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* ── Price History Table ───────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Database size={16} className="text-emerald-400" /> Historic Price Registry
          </h3>
          <span className="adm-badge adm-badge-approved">{publications.length} Indices</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="adm-spinner"></div>
            <span className="text-slate-500 text-sm">Retrieving index data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="pl-6">Classification</th>
                  <th>Valid From</th>
                  <th>Safe Range</th>
                  <th>Reference</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Operations</th>
                </tr>
              </thead>
              <tbody>
                {publications.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="flex flex-col items-center gap-3 py-14 text-slate-600">
                        <TrendingUp size={40} className="opacity-20" />
                        <p className="text-sm">No price publications on record.</p>
                      </div>
                    </td>
                  </tr>
                ) : publications.map(p => (
                  <tr key={p.id}>
                    <td className="pl-6">
                      <span className="font-semibold text-slate-200">
                        {categories.find(c => c.id === p.category)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td><span className="text-xs text-slate-400">{p.effective_date}</span></td>
                    <td>
                      <span className="text-xs text-red-400">{p.min_price} DZD</span>
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className="text-xs text-emerald-400">{p.max_price} DZD</span>
                    </td>
                    <td><span className="font-bold text-emerald-400">{p.reference_price} DZD</span></td>
                    <td>
                      <span className="adm-badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {p.unit}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end pr-6">
                        <button className="adm-btn adm-btn-ghost adm-btn-icon" title="Evict Publication" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} className="text-red-400" />
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

      <div className="adm-info-block">
        <Info size={16} className="shrink-0 mt-0.5 opacity-60" />
        <div>Farmers cannot list products outside the specified Min/Max range of the latest publication for each category.</div>
      </div>

    </div>
  );
}

export default PriceManager;
