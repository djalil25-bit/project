import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Home, 
  Tag, 
  Image as ImageIcon, 
  Save, 
  Info, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Plus
} from 'lucide-react';

function ProductForm() {
  const [formData, setFormData] = useState({ 
    catalog_product: '', 
    description: '', 
    price: '', 
    stock: '', 
    farm: '',
    title: '',
    category: '',
    unit: '',
    image: null
  });
  const [farms, setFarms] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDeps() {
      try {
        const [farmRes, catalogRes] = await Promise.all([
          api.get('/farms/'), 
          api.get('/catalog-products/')
        ]);
        setFarms(farmRes.data.results || farmRes.data);
        setCatalog(catalogRes.data.results || catalogRes.data);
      } catch (err) { console.error('Failed to load deps', err); }
    }
    loadDeps();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }
    
    if (name === 'catalog_product') {
      const item = catalog.find(i => i.id === parseInt(value));
      setSelectedCatalogItem(item);
      if (item) {
        setFormData(prev => ({ 
          ...prev, 
          price: item.official_price || '', 
          title: item.name,
          category: item.category,
          unit: item.default_unit
        }));
      }
      setFieldErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (selectedCatalogItem) {
      const price = parseFloat(formData.price);
      const minP = parseFloat(selectedCatalogItem.min_price);
      const maxP = parseFloat(selectedCatalogItem.max_price);

      if ((!isNaN(minP) && price < minP) || (!isNaN(maxP) && price > maxP)) {
        setFieldErrors({ 
          price: "Your price is outside the admin-approved range. Please review the admin prices." 
        });
        return;
      }
    }

    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    if (!formData.title && selectedCatalogItem) {
      data.set('title', selectedCatalogItem.name);
    }

    try {
      await api.post('/products/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Product listed successfully!');
      setFormData({
        catalog_product: '', description: '', price: '', stock: '',
        farm: '', title: '', category: '', unit: '', image: null
      });
      setSelectedCatalogItem(null);
      setTimeout(() => navigate('/farmer-dashboard'), 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData && typeof resData === 'object') {
        setFieldErrors(resData);
        let topMsg = resData.detail || resData.non_field_errors?.[0] || resData.price?.[0] || 'Submission failed. Please check the fields below.';
        setError(topMsg);
      } else {
        setError('Failed to list product. Please check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="product-form-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>List New Produce</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">List Your Produce</h1>
          <p className="page-subtitle text-muted">Register your fresh harvest to the AgriGov marketplace.</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-agr btn-outline d-flex align-items-center">
          <ArrowLeft size={16} className="me-2" /> Back
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="agr-card p-4 p-md-5">
            {error && (
              <div className="alert-agr alert-danger-agr mb-4 d-flex align-items-center">
                <AlertTriangle size={18} className="me-3" />
                <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="alert-agr alert-success-agr mb-4 d-flex align-items-center">
                <ShieldCheck size={18} className="me-3" />
                <div>{success}</div>
              </div>
            )}
            
            {farms.length === 0 && !loading && (
              <div className="alert-agr alert-warning-agr mb-4 d-flex align-items-center">
                <Info size={18} className="me-3" />
                <div>
                  No active farms found. <Link to="/farmer-dashboard/farm/new" className="fw-bold">Register a farm</Link> to start selling.
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="agr-form">
              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center">
                  <Package size={16} className="me-2 text-primary" /> Select Market Product *
                </label>
                <select name="catalog_product" className="form-input" onChange={handleChange} required value={formData.catalog_product}>
                  <option value="">Choose from official catalog...</option>
                  {catalog.map(i => <option key={i.id} value={i.id}>{i.name} ({i.default_unit})</option>)}
                </select>
                <p className="form-hint small text-muted mt-1 italic">Only certified products from our database can be listed.</p>
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center">
                  <Home size={16} className="me-2 text-primary" /> Origin Farm *
                </label>
                <select name="farm" className="form-input" onChange={handleChange} required value={formData.farm}>
                  <option value="">Select where this is grown...</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center">
                      <Tag size={16} className="me-2 text-primary" /> Asking Price (DZD) *
                    </label>
                    <div className="input-group-agr">
                      <input 
                        type="number" step="0.01" name="price" 
                        className={`form-input ${fieldErrors.price ? 'border-danger' : ''}`}
                        placeholder="0.00" onChange={handleChange} required value={formData.price}
                      />
                    </div>
                    {fieldErrors.price && (
                      <div className="text-danger very-small mt-1 fw-medium">{Array.isArray(fieldErrors.price) ? fieldErrors.price[0] : fieldErrors.price}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center">
                      <Plus size={16} className="me-2 text-primary" /> Quantity Available ({selectedCatalogItem?.default_unit || 'Units'}) *
                    </label>
                    <input 
                      type="number" step="0.01" name="stock" 
                      className={`form-input ${fieldErrors.stock ? 'border-danger' : ''}`}
                      placeholder="Enter amount" onChange={handleChange} required value={formData.stock}
                    />
                    {fieldErrors.stock && (
                      <div className="text-danger very-small mt-1 fw-medium">{Array.isArray(fieldErrors.stock) ? fieldErrors.stock[0] : fieldErrors.stock}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center">
                  <ImageIcon size={16} className="me-2 text-primary" /> Product Photography
                </label>
                <div className="file-input-wrapper">
                  <input 
                    type="file" name="image" className="form-input" 
                    accept="image/*" onChange={handleChange}
                  />
                  <p className="form-hint small text-muted mt-1">Upload a clear photo of the actual produce to improve buyer trust.</p>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Harvest Details & Quality</label>
                <textarea 
                  name="description" className="form-input" 
                  placeholder="Tell buyers about your produce: organic, extra fresh, specific variety, etc." 
                  style={{ minHeight: '120px' }}
                  onChange={handleChange} value={formData.description}
                />
              </div>

              <div className="d-flex gap-3 pt-3">
                <button type="submit" className="btn-agr btn-primary px-4 d-flex align-items-center" disabled={loading || farms.length === 0}>
                  {loading ? 'Processing...' : <><Save size={18} className="me-2" /> List Product for Sale</>}
                </button>
                <button type="button" className="btn-agr btn-outline px-4" onClick={() => navigate('/farmer-dashboard')}>Discard</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          {selectedCatalogItem ? (
            <div className="agr-card bg-light-soft p-4 sticky-top" style={{ top: '2rem' }}>
              <div className="d-flex align-items-center mb-3">
                <Info size={20} className="text-primary me-2" />
                <h3 className="h5 fw-bold mb-0">Official Marketplace Guide</h3>
              </div>
              
              <div className="mb-4">
                <label className="very-small text-muted d-block text-uppercase fw-bold mb-1">Recommended Pricing</label>
                <div className="h4 fw-bold text-dark">{selectedCatalogItem.min_price} - {selectedCatalogItem.max_price} <small className="small">DZD / {selectedCatalogItem.default_unit}</small></div>
                <div className="very-small text-muted italic">Based on latest market data for {selectedCatalogItem.name}.</div>
              </div>

              <div className="mb-4">
                <label className="very-small text-muted d-block text-uppercase fw-bold mb-1">Quality Requirements</label>
                <div className="bg-white p-3 rounded border small text-muted">
                  {selectedCatalogItem.description || 'General high-quality standards apply. Ensure produce is clean and properly packaged.'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary-soft text-primary small d-flex">
                <ShieldCheck size={20} className="me-2 flex-shrink-0" />
                <div>
                  Listing within the recommended price range increases your visibility on the buyer's marketplace by 40%.
                </div>
              </div>
            </div>
          ) : (
            <div className="agr-card bg-light-soft p-5 text-center border-dashed">
              <Package size={48} className="text-muted mb-3 opacity-25" />
              <h4 className="h6 text-muted mb-0">Select a product to view marketplace guidelines and pricing help.</h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductForm;
