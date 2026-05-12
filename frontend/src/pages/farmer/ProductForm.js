import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Home, Tag, Image as ImageIcon,
  Save, Info, ShieldCheck, AlertTriangle, ChevronRight, Plus,
  Layers, BadgeCheck, FileText, LayoutGrid, CheckCircle2,
  AlertCircle, X
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
            const item = fetchedCatalog.find(i => i.id === Number(p.catalog_product));
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
      const item = catalog.find(i => i.id === Number(value));
      setSelCatalog(item || null);
      if (item) {
        setFormData(prev => ({
          ...prev,
          catalog_product: value,
          price: item.ref_price || '',
          title: item.name,
          category: item.category,
          unit: item.default_unit,
        }));
      }
      setFErrors({});
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setFErrors({});

    if (selCatalog) {
      const price = parseFloat(formData.price);
      const rawMinP  = selCatalog.min_price !== null ? parseFloat(selCatalog.min_price) : null;
      const rawMaxP  = selCatalog.max_price !== null ? parseFloat(selCatalog.max_price) : null;
      
      let minP = rawMinP;
      let maxP = rawMaxP;
      if (rawMinP !== null && rawMaxP !== null && !isNaN(rawMinP) && !isNaN(rawMaxP)) {
        minP = Math.min(rawMinP, rawMaxP);
        maxP = Math.max(rawMinP, rawMaxP);
      }

      const tooLow  = minP !== null && !isNaN(minP) && price < minP;
      const tooHigh = maxP !== null && !isNaN(maxP) && price > maxP;
      if (tooLow || tooHigh) {
        const rangeHint = (minP !== null && maxP !== null)
          ? ` Allowed range: ${minP} – ${maxP} DZD.`
          : minP !== null ? ` Minimum: ${minP} DZD.` : ` Maximum: ${maxP} DZD.`;
        setFErrors({ price: 'Your asking price is outside the admin-approved range.' + rangeHint });
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
        setSuccess('Product added to marketplace successfully!');
      }
      setTimeout(() => navigate('/farmer-dashboard/products'), 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData && typeof resData === 'object') {
        const fieldErrs = {};
        const topMessages = [];
        Object.entries(resData).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          if (key === 'detail' || key === 'non_field_errors') {
            topMessages.push(msg);
          } else {
            fieldErrs[key] = msg;
            topMessages.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${msg}`);
          }
        });
        setFErrors(fieldErrs);
        setError(topMessages.length > 0 ? topMessages.join(' | ') : 'Submission failed.');
      } else {
        setError('Failed to submit. Please check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="farmer-page-wrapper" style={{ paddingBottom: '5rem' }}>
      
      {/* ── HEADER & BREADCRUMB ───────────────────────── */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          <Link to="/farmer-dashboard" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>Farmer Hub</Link>
          <ChevronRight size={12} style={{ color: '#94a3b8' }} />
          <Link to="/farmer-dashboard/products" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>Inventory</Link>
          <ChevronRight size={12} style={{ color: '#94a3b8' }} />
          <span style={{ color: '#065f46', fontWeight: 800 }}>{isEdit ? 'Modification Protocol' : 'Registration Protocol'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1px', margin: 0 }}>
              {isEdit ? 'Refine your ' : 'Register New '} <span style={{ color: '#059669' }}>Harvest</span>
            </h1>
            <p style={{ color: '#64748b', fontWeight: 500, margin: '0.5rem 0 0' }}>
              Ensure your product data aligns with official ministry standards for maximum marketplace visibility.
            </p>
          </div>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#64748b', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', border: '1.5px solid #e2e8f0', cursor: 'pointer' }}>
             <ArrowLeft size={16} /> Return to Inventory
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* ── MAIN FORM ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '1.25rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', color: '#991b1b', fontSize: '0.9rem', fontWeight: 700 }}>
              <AlertCircle size={20} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '1.25rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', color: '#166534', fontSize: '0.9rem', fontWeight: 700 }}>
              <CheckCircle2 size={20} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Identity Group */}
            <div style={{ background: '#fff', borderRadius: '32px', padding: '2.5rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BadgeCheck size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Official Identity</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Registry Product <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="catalog_product"
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: fieldErrors.catalog_product ? '2px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', outline: 'none', background: '#f8fafc' }}
                      onChange={handleChange}
                      required
                      value={formData.catalog_product}
                    >
                      <option value="">Choose Catalog Entry…</option>
                      {catalog.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <ChevronRight size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: '#94a3b8' }} />
                  </div>
                  {fieldErrors.catalog_product && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem' }}>{fieldErrors.catalog_product}</div>}
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Producing Farm <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="farm"
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: fieldErrors.farm ? '2px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', outline: 'none', background: '#f8fafc' }}
                      onChange={handleChange}
                      required
                      value={formData.farm}
                    >
                      <option value="">Select Origin Farm…</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <ChevronRight size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: '#94a3b8' }} />
                  </div>
                  {fieldErrors.farm && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem' }}>{fieldErrors.farm}</div>}
                </div>
              </div>
            </div>

            {/* Economics Group */}
            <div style={{ background: '#fff', borderRadius: '32px', padding: '2.5rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Valuation & Inventory</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Asking Price (DZD) <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" step="0.01" name="price"
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: fieldErrors.price ? '2px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '1rem', fontWeight: 800, color: '#1e293b', outline: 'none' }}
                      placeholder="0.00" onChange={handleChange} required value={formData.price}
                    />
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#cbd5e1', fontSize: '0.8rem' }}>DZD / {selCatalog?.default_unit || 'UNIT'}</div>
                  </div>
                  {fieldErrors.price && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem' }}>{fieldErrors.price}</div>}
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Available Stock <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" step="0.01" name="stock"
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: fieldErrors.stock ? '2px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '1rem', fontWeight: 800, color: '#1e293b', outline: 'none' }}
                      placeholder="0.00" onChange={handleChange} required value={formData.stock}
                    />
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#cbd5e1', fontSize: '0.8rem' }}>{selCatalog?.default_unit || 'UNIT'}</div>
                  </div>
                  {fieldErrors.stock && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem' }}>{fieldErrors.stock}</div>}
                </div>
              </div>
            </div>

            {/* Quality Group */}
            <div style={{ background: '#fff', borderRadius: '32px', padding: '2.5rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} /></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>Quality & Description</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Quality Grade <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="quality"
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', outline: 'none', background: '#f8fafc' }}
                      onChange={handleChange} required value={formData.quality}
                    >
                      <option value="PREMIUM">Premium (High End)</option>
                      <option value="STANDARD">Standard (Regular)</option>
                      <option value="ECONOMY">Economy (Low Cost)</option>
                      <option value="ORGANIC">Organic (Certified)</option>
                    </select>
                    <ChevronRight size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: '#94a3b8' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Harvest Imagery</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file" name="image"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', outline: 'none' }}
                      accept="image/*" onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>Detailed Manifest & Harvest Notes</label>
                <textarea
                  name="description"
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '20px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', outline: 'none', resize: 'none', minHeight: '120px', lineHeight: 1.6 }}
                  placeholder="Elaborate on the harvest conditions, specific variety, or any unique quality markers..."
                  onChange={handleChange} value={formData.description}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '1rem' }}>
               <button
                 type="submit"
                 disabled={loading || farms.length === 0}
                 style={{ flex: 1, background: '#059669', color: '#fff', padding: '1.25rem', borderRadius: '18px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(5,150,105,0.2)' }}
               >
                 {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={20} /> {isEdit ? 'Update Requisition' : 'Authorize Listing'}</>}
               </button>
               <button
                 type="button"
                 onClick={() => navigate('/farmer-dashboard/products')}
                 style={{ padding: '1.25rem 2.5rem', borderRadius: '18px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
               >
                 Discard
               </button>
            </div>
          </form>
        </div>

        {/* ── SIDEBAR: OFFICIAL DATA ──────────────────── */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          {selCatalog ? (
            <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)', borderRadius: '32px', padding: '2.5rem', color: '#fff', boxShadow: '0 20px 40px rgba(6,95,70,0.15)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', opacity: 0.1 }}><Info size={250} /></div>
              
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2.5rem' }}>
                  <Building2 size={16} /> Ministry Reference
                </div>

                <div style={{ marginBottom: '3rem' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Market Stabilization Range</div>
                   <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
                      {selCatalog.min_price} – {selCatalog.max_price} <small style={{ fontSize: '1rem', opacity: 0.6 }}>DZD</small>
                   </div>
                   <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontWeight: 600 }}>Per {selCatalog.default_unit} • Updated Daily</div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Quality Specifications</div>
                   <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                      {selCatalog.description || 'Standard Ministry quality guidelines apply to this category.'}
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'rgba(16,185,129,0.2)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
                   <ShieldCheck size={20} style={{ color: '#10b981', marginTop: '0.2rem' }} />
                   <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                      Products listed within reference price ranges receive priority indexing in the buyer marketplace.
                   </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '32px', padding: '4rem 2rem', border: '1.5px dashed #e2e8f0', textAlign: 'center' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f8fafc', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}><LayoutGrid size={32} /></div>
               <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>Registry Guidance</h4>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1.6 }}>
                  Select a product from the official catalog to synchronize your listing with ministry-grade data benchmarks.
               </p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', background: '#f0fdf4', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ color: '#16a34a' }}><Info size={24} /></div>
             <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534' }}>Digital Traceability</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 500 }}>Every listing is tagged with a unique batch ID for national tracking.</div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-group {
          display: flex;
          flex-direction: column;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const Building2 = ({ size, style }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);
