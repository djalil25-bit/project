import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Home, Tag, Image as ImageIcon,
  Save, Info, ShieldCheck, AlertTriangle, ChevronRight, Plus
} from 'lucide-react';

export default function ProductForm() {
  const [formData, setFormData] = useState({
    catalog_product: '', description: '', price: '', stock: '',
    farm: '', title: '', category: '', unit: '', quality: 'STANDARD', image: null,
  });
  const [farms, setFarms]           = useState([]);
  const [catalog, setCatalog]       = useState([]);
  const [selCatalog, setSelCatalog] = useState(null);
  const [fieldErrors, setFErrors]   = useState({});
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [qp]        = useSearchParams();
  const isEdit      = !!id;

  useEffect(() => {
    async function loadDeps() {
      try {
        const [farmRes, catRes] = await Promise.all([
          api.get('/farms/'),
          api.get('/catalog-products/'),
        ]);
        const fetchedFarms   = farmRes.data.results || farmRes.data;
        const fetchedCatalog = catRes.data.results  || catRes.data;
        setFarms(fetchedFarms);
        setCatalog(fetchedCatalog);

        // Pre-select farm from URL query ?farm=N
        const farmParam = qp.get('farm');
        if (farmParam && !id) {
          setFormData(prev => ({ ...prev, farm: farmParam }));
        }

        if (id) {
          const productRes = await api.get(`/products/${id}/`);
          const p = productRes.data;
          setFormData({
            catalog_product: p.catalog_product || '',
            description: p.description || '',
            price: p.price || '',
            stock: p.stock || '',
            farm: p.farm || '',
            title: p.title || '',
            category: p.category || '',
            unit: p.unit || '',
            quality: p.quality || 'STANDARD',
            image: null,
          });
          if (p.catalog_product) {
            const item = fetchedCatalog.find(i => i.id === parseInt(p.catalog_product));
            if (item) setSelCatalog(item);
          }
        }
      } catch (err) { console.error('Failed to load deps', err); }
    }
    loadDeps();
  }, [id, qp]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (fieldErrors[name]) setFErrors({ ...fieldErrors, [name]: null });

    if (name === 'catalog_product') {
      const item = catalog.find(i => i.id === parseInt(value));
      setSelCatalog(item);
      if (item) {
        setFormData(prev => ({
          ...prev,
          price: item.ref_price || '',
          title: item.name,
          category: item.category,
          unit: item.default_unit,
        }));
      }
      setFErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setFErrors({});

    if (selCatalog) {
      const price = parseFloat(formData.price);
      const minP  = parseFloat(selCatalog.min_price);
      const maxP  = parseFloat(selCatalog.max_price);
      if ((!isNaN(minP) && price < minP) || (!isNaN(maxP) && price > maxP)) {
        setFErrors({ price: 'Your price is outside the admin-approved range. Please review the official pricing.' });
        return;
      }
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && (formData[key] !== '' || key === 'description')) {
        data.append(key, formData[key]);
      }
    });
    if (!formData.title && selCatalog) data.set('title', selCatalog.name);

    try {
      if (isEdit) {
        await api.patch(`/products/${id}/`, data);
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/products/', data);
        setSuccess('Product listed successfully!');
      }
      setFormData({ catalog_product:'', description:'', price:'', stock:'', farm:'', title:'', category:'', unit:'', quality:'STANDARD', image:null });
      setSelCatalog(null);
      setTimeout(() => navigate('/farmer-dashboard'), 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData && typeof resData === 'object') {
        setFErrors(resData);
        setError(resData.detail || resData.non_field_errors?.[0] || resData.price?.[0] || 'Submission failed. Please check the fields.');
      } else {
        setError('Failed to list product. Please check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="farmer-page-wrapper">
      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>{isEdit ? 'Edit Produce' : 'List New Produce'}</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0 }}>
            {isEdit ? 'Edit Your Produce' : 'List Your Produce'}
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            {isEdit ? 'Update your harvest details and pricing.' : 'Register your fresh harvest to the AgriGov marketplace.'}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-f-ghost btn-f-sm">
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Form card ── */}
        <div className="f-card">
          <div className="f-card-body">
            {error && (
              <div className="f-alert f-alert-danger">
                <AlertTriangle size={16} /> <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="f-alert f-alert-success">
                <ShieldCheck size={16} /> <div>{success}</div>
              </div>
            )}
            {farms.length === 0 && !loading && (
              <div className="f-alert f-alert-warning">
                <Info size={16} />
                <div>No active farms found. <Link to="/farmer-dashboard/farm/new" style={{ fontWeight: 700, color: 'var(--f-forest)' }}>Register a farm</Link> to start selling.</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Section: Product */}
              <div className="f-form-section">
                <div className="f-form-section-title">Product Information</div>

                <div className="f-form-group">
                  <label className="f-form-label">
                    <Package size={14} style={{ color: 'var(--f-olive)' }} />
                    Select Market Product <span className="req">*</span>
                  </label>
                  <select
                    name="catalog_product"
                    className={`f-input f-select ${fieldErrors.catalog_product ? 'error' : ''}`}
                    onChange={handleChange}
                    required
                    value={formData.catalog_product}
                  >
                    <option value="">Choose from official catalog…</option>
                    {catalog.map(i => <option key={i.id} value={i.id}>{i.name} ({i.default_unit})</option>)}
                  </select>
                  <div className="f-form-hint">Only certified products from the AgriGov database can be listed.</div>
                </div>

                <div className="f-form-group">
                  <label className="f-form-label">
                    <Home size={14} style={{ color: 'var(--f-olive)' }} />
                    Origin Farm <span className="req">*</span>
                  </label>
                  <select
                    name="farm"
                    className={`f-input f-select ${fieldErrors.farm ? 'error' : ''}`}
                    onChange={handleChange}
                    required
                    value={formData.farm}
                  >
                    <option value="">Select where this is grown…</option>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Section: Pricing & Quantity */}
              <div className="f-form-section">
                <div className="f-form-section-title">Pricing &amp; Quantity</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="f-form-group" style={{ marginBottom: 0 }}>
                    <label className="f-form-label">
                      <Tag size={14} style={{ color: 'var(--f-olive)' }} />
                      Asking Price (DZD) <span className="req">*</span>
                    </label>
                    <input
                      type="number" step="0.01" name="price"
                      className={`f-input ${fieldErrors.price ? 'error' : ''}`}
                      placeholder="0.00" onChange={handleChange} required value={formData.price}
                    />
                    {fieldErrors.price && (
                      <div className="f-form-error">{Array.isArray(fieldErrors.price) ? fieldErrors.price[0] : fieldErrors.price}</div>
                    )}
                  </div>

                  <div className="f-form-group" style={{ marginBottom: 0 }}>
                    <label className="f-form-label">
                      <Plus size={14} style={{ color: 'var(--f-olive)' }} />
                      Quantity ({selCatalog?.default_unit || 'Units'}) <span className="req">*</span>
                    </label>
                    <input
                      type="number" step="0.01" name="stock"
                      className={`f-input ${fieldErrors.stock ? 'error' : ''}`}
                      placeholder="Enter amount" onChange={handleChange} required value={formData.stock}
                    />
                    {fieldErrors.stock && (
                      <div className="f-form-error">{Array.isArray(fieldErrors.stock) ? fieldErrors.stock[0] : fieldErrors.stock}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Details */}
              <div className="f-form-section">
                <div className="f-form-section-title">Quality &amp; Photography</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="f-form-group" style={{ marginBottom: 0 }}>
                    <label className="f-form-label">
                      <ShieldCheck size={14} style={{ color: 'var(--f-olive)' }} />
                      Product Quality <span className="req">*</span>
                    </label>
                    <select
                      name="quality"
                      className="f-input f-select"
                      onChange={handleChange} required value={formData.quality}
                    >
                      <option value="PREMIUM">Premium (High End)</option>
                      <option value="STANDARD">Standard (Regular)</option>
                      <option value="ECONOMY">Economy (Low Cost)</option>
                      <option value="ORGANIC">Organic (Certified)</option>
                    </select>
                  </div>

                  <div className="f-form-group" style={{ marginBottom: 0 }}>
                    <label className="f-form-label">
                      <ImageIcon size={14} style={{ color: 'var(--f-olive)' }} />
                      Product Photography <span className="opt">(optional)</span>
                    </label>
                    <input
                      type="file" name="image"
                      className="f-input"
                      style={{ padding: '0.5rem' }}
                      accept="image/*" onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="f-form-group" style={{ marginTop: '1rem' }}>
                  <label className="f-form-label">Harvest Details &amp; Quality Notes</label>
                  <textarea
                    name="description"
                    className="f-input f-textarea"
                    placeholder="Tell buyers about your produce: organic, extra fresh, specific variety, etc."
                    onChange={handleChange} value={formData.description}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }} className="f-form-actions">
                <button
                  type="submit"
                  className="btn-f-primary"
                  disabled={loading || farms.length === 0}
                >
                  {loading
                    ? 'Processing…'
                    : <><Save size={16} /> {isEdit ? 'Save Changes' : 'List Product for Sale'}</>
                  }
                </button>
                <button
                  type="button"
                  className="btn-f-ghost"
                  onClick={() => navigate('/farmer/products')}
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar info panel ── */}
        {selCatalog ? (
          <div className="f-info-panel">
            <div className="f-info-panel-header">
              <Info size={16} style={{ color: 'var(--f-olive)' }} />
              Official Marketplace Guide
            </div>

            <div className="f-info-field">
              <div className="f-info-field-label">Recommended Pricing</div>
              <div className="f-info-field-value">
                {selCatalog.min_price} – {selCatalog.max_price}
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--f-olive)', marginLeft: '0.3rem' }}>
                  DZD / {selCatalog.default_unit}
                </span>
              </div>
              <div className="f-info-field-sub">Based on latest market data for {selCatalog.name}.</div>
            </div>

            {selCatalog.description && (
              <div className="f-info-field">
                <div className="f-info-field-label">Quality Requirements</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.55, background: '#fff', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(26,74,46,0.09)' }}>
                  {selCatalog.description}
                </div>
              </div>
            )}

            <div className="f-info-tip">
              <ShieldCheck size={18} style={{ color: 'var(--f-forest)', flexShrink: 0, marginTop: 1 }} />
              <div>
                Listing within the recommended price range increases your visibility on the buyer marketplace.
              </div>
            </div>
          </div>
        ) : (
          <div className="f-info-placeholder">
            <div className="f-info-placeholder-icon"><Package size={40} style={{ color: 'var(--f-sage-light)' }} /></div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af' }}>
              Select a product to view marketplace guidelines and pricing help.
            </div>
          </div>
        )}

      </div>

      {/* Mobile: stack sidebar below */}
      <style>{`
        @media (max-width: 900px) {
          .farmer-page-wrapper > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
