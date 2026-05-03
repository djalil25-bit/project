import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Archive,
  LineChart
} from 'lucide-react';

const CatalogManager = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', official_price: '', min_price: '', max_price: '', unit: 'kg' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

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

  const filteredCatalog = catalog.filter(item =>
    selectedCategoryFilter === '' || item.category === parseInt(selectedCategoryFilter)
  );

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">

      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={28} /> Master Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-1">Standardize agricultural products and enforce price guardrails.</p>
        </div>
        <button
          className="adm-btn adm-btn-primary px-5 py-2.5 shrink-0"
          onClick={() => { setEditingId(null); setShowModal(true); }}
        >
          <Plus size={16} /> Register Product
        </button>
      </div>

      {/* ── Catalog Table Card ──────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">Available Standardized Units</h3>
            <span className="adm-badge adm-badge-approved ml-1">{catalog.length} Items</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-500" />
            <select
              className="adm-input"
              style={{ width: '200px' }}
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon || '🌱'} {c.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="adm-spinner"></div>
            <span className="text-gray-400 text-sm">Indexing catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Identification</th>
                  <th>Domain</th>
                  <th>Price Ceiling / Floor</th>
                  <th>Index Price</th>
                  <th style={{ textAlign: 'right' }}>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                        <Search size={40} className="opacity-20" />
                        <p className="text-sm">No catalog products match this criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCatalog.map(item => (
                  <tr key={item.id} className="anim-fade-up">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                          <Tag size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-badge flex items-center gap-1 w-fit" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                        <Layers size={11} />
                        {categories.find(c => c.id === item.category)?.name || 'Unmapped'}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        <span className="text-red-600">Min: {item.min_price}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-green-600">Max: {item.max_price}</span>
                        <span className="ml-1 text-xs text-gray-500">{item.unit}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-blue-600">{item.official_price} <small className="text-xs text-gray-500">DZD/{item.unit}</small></span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button className="adm-btn adm-btn-ghost adm-btn-icon" title="View Price History" onClick={() => navigate(`/admin-dashboard/catalog/${item.id}/price-history`)}>
                          <LineChart size={14} className="text-amber-500" />
                        </button>
                        <button className="adm-btn adm-btn-ghost adm-btn-icon" title="Update" onClick={() => handleEdit(item)}>
                          <Edit size={14} className="text-blue-400" />
                        </button>
                        <button className="adm-btn adm-btn-ghost adm-btn-icon" title="De-register" onClick={() => handleDelete(item.id)}>
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

      {/* ── Modal ───────────────────────────────────────── */}
      {showModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="text-blue-600" size={18} />
                  {editingId ? 'Modify Catalog Entry' : 'New Catalog Registration'}
                </h3>
                <button type="button" className="adm-btn adm-btn-ghost adm-btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    <Info size={16} /> {error}
                  </div>
                )}

                <div>
                  <label className="adm-label">Product Designation</label>
                  <input type="text" className="adm-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                  <label className="adm-label">Category Mapping</label>
                  <select className="adm-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Domain...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="adm-label">Floor Price (DZD)</label>
                    <input type="number" className="adm-input" required value={formData.min_price} onChange={e => setFormData({...formData, min_price: e.target.value})} />
                  </div>
                  <div>
                    <label className="adm-label">Ceiling Price (DZD)</label>
                    <input type="number" className="adm-input" required value={formData.max_price} onChange={e => setFormData({...formData, max_price: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="adm-label">Reference Index Price</label>
                    <input type="number" className="adm-input" required value={formData.official_price} onChange={e => setFormData({...formData, official_price: e.target.value})} />
                  </div>
                  <div>
                    <label className="adm-label">Measurement Unit</label>
                    <input type="text" className="adm-input" required placeholder="e.g. kg, ton" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="adm-label">Technical Description</label>
                  <textarea className="adm-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button type="submit" className="adm-btn adm-btn-primary flex-1 justify-center py-2.5" disabled={submitting}>
                  <Save size={16} /> {submitting ? 'Finalizing...' : 'Save Registry'}
                </button>
                <button type="button" className="adm-btn adm-btn-ghost px-5" onClick={() => setShowModal(false)}>
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
